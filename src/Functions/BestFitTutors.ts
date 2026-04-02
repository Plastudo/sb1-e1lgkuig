import { supabase } from "../lib/supabase";

export interface TutorMatch {
  tutorId: string;
  compatibility: number;
  name?: string;
  profile_picture?: string | null;
  subjects?: string[] | null;
  rating?: number | null;
  bio?: string | null;
  email?: string | null;
}

// Power-law exponent for the weighting formula — higher P → bigger gap between ranks
const P = 1.5;

// Questions included in Stage 2 compatibility scoring (student question IDs).
// Q1, Q2, Q7, Q8-District, and Q12 are filter-only and must NOT contribute to the score.
const SCORING_QUESTIONS = new Set(["3", "4", "5", "6", "8", "9", "10", "11"]);

// Human-readable labels for each scoring question (used in logs)
const QUESTION_LABELS: Record<string, string> = {
  "3": "Subjects",
  "4": "Sessions/week",
  "5": "Budget ↔ Rate",
  "6": "Availability",
  "8": "Location (concelho + freguesia)",
  "9": "Goal",
  "10": "Teaching approach",
  "11": "Hobbies",
};

/**
 * Maps student question index → the tutor semantic column name.
 * Semantic columns are populated from raw_answers by migration 20260402000000_semantic_columns.sql.
 * Falls back to raw_answers for tutors registered before that migration.
 */
const STUDENT_IDX_TO_TUTOR_COLUMN: Record<string, string> = {
  "1":  "class_type",          // Format: individual/grupo
  "2":  "teaching_levels",     // Teaching levels (array)
  "3":  "subjects",            // Subjects (array)
  "4":  "sessions_per_week",   // Sessions/week
  "5":  "hourly_rate",         // Rate/hr
  "6":  "schedule",            // Availability grid (jsonb)
  "7":  "modalities",          // Session format (presencial/centro-estudo/online)
  "8":  "location",            // District (text)
  "9":  "accepted_objectives", // Objectives the tutor works with (array)
  "10": "teaching_approach",   // Teaching approach (array)
  "11": "hobbies",             // Hobbies (array)
  "12": "accepted_profiles",   // Student profiles the tutor accepts (array)
};

/**
 * Maps student question index → the tutor raw_answers key (fallback for pre-migration tutors).
 */
const STUDENT_IDX_TO_TUTOR_KEY: Record<string, string> = {
  "1":  "question_1_answer",
  "2":  "question_3_answer",
  "3":  "question_4_answer",
  "4":  "question_5_answer",
  "5":  "question_6_answer",
  "6":  "question_7_answer",
  "7":  "question_8_answer",
  "8":  "question_9_answer",
  "9":  "question_11_answer",
  "10": "question_13_answer",
  "11": "question_14_answer",
  "12": "question_15_answer",
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Normalises a string: strips accents, trims, lowercases. */
function normalizeString(input?: string | null): string {
  if (input === undefined || input === null) return "";
  return input
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Compares two availability grids {slot: boolean}.
 * Returns the fraction of the student's desired slots covered by the tutor (0–1).
 */
function compareAvailability(sRaw: any, tRaw: any): number {
  if (!sRaw || !tRaw || typeof sRaw !== "object" || typeof tRaw !== "object") return 0;
  const studentSlots = Object.keys(sRaw).filter((k) => sRaw[k] === true);
  if (studentSlots.length === 0) return 0;
  const tutorSlots = new Set(Object.keys(tRaw).filter((k) => tRaw[k] === true));
  const overlap = studentSlots.filter((s) => tutorSlots.has(s)).length;
  return overlap / studentSlots.length;
}

/** Returns true if v is a plain object (not an array, not null). */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Scores location match with a fixed 60/30/10 weight split:
 *   60% → distrito, 30% → concelho, 10% → freguesia
 * Returns 0–1. Empty student values contribute 0 to the score.
 */
function compareLocation(
  studentDistrict: string,
  studentMunicipality: string,
  studentParish: string,
  tutorDistrict: string,
  tutorMunicipality: string,
  tutorParish: string
): number {
  let score = 0;
  if (studentDistrict && normalizeString(studentDistrict) === normalizeString(tutorDistrict)) score += 0.6;
  if (studentMunicipality && normalizeString(studentMunicipality) === normalizeString(tutorMunicipality)) score += 0.3;
  if (studentParish && normalizeString(studentParish) === normalizeString(tutorParish)) score += 0.1;
  return score;
}

// ─── Stage 1: Hard filter ─────────────────────────────────────────────────────

interface FilterDetail {
  passed: boolean;
  rules: {
    rule: string;
    passed: boolean;
    studentValue: any;
    tutorValue: any;
  }[];
}

/**
 * Evaluates all filter rules for a single tutor and returns a detailed result.
 * The tutor passes only when every applicable rule is satisfied.
 *
 * Filter rules:
 *  Q1  Learning format    — student's choice ∈ tutor's options           [tutor Q1]
 *  Q2  Teaching level     — student's level ∈ tutor's levels             [tutor Q3]
 *  Q3  Subjects           — at least one student subject ∈ tutor's subjects [tutor Q4]
 *  Q6  Availability       — at least one student time slot ∈ tutor's slots  [tutor Q7]
 *  Q7  Session type       — student's choice ∈ tutor's options           [tutor Q8]
 *  Q8  District           — exact match (only when Q7 = presencial | centro-estudo) [tutor Q9]
 *  Q12 Student profile    — student's choice ∈ tutor's accepted profiles  [tutor Q15]
 */
function evaluateTutorFilter(tutor: any, studentAnswers: Record<string, any>): FilterDetail {
  // Read from semantic column first; fall back to raw_answers for pre-migration tutors.
  const col = (semanticCol: string, rawKey?: string): any => {
    const direct = tutor[semanticCol];
    if (direct !== null && direct !== undefined && !(Array.isArray(direct) && direct.length === 0)) {
      return direct;
    }
    if (rawKey) return tutor?.raw_answers?.[rawKey] ?? tutor[rawKey];
    return direct;
  };
  const rules: FilterDetail["rules"] = [];

  function matchesAtLeastOne(studentVal: any, tutorVal: any): boolean {
    const sVals = (Array.isArray(studentVal) ? studentVal : [studentVal])
      .map(normalizeString)
      .filter((v) => v !== "");
    if (sVals.length === 0) return true;
    const tVals = (Array.isArray(tutorVal) ? tutorVal : [tutorVal])
      .map(normalizeString)
      .filter((v) => v !== "");
    return sVals.some((sv) => tVals.includes(sv));
  }

  // Q1 → class_type: Learning format (individual/grupo)
  const tClassType = col("class_type", "question_1_answer");
  const q1Pass = matchesAtLeastOne(studentAnswers["question_1_answer"], tClassType);
  rules.push({ rule: "Q1 Format", passed: q1Pass, studentValue: studentAnswers["question_1_answer"], tutorValue: tClassType });

  // Q2 → teaching_levels: Teaching level (student's single level ∈ tutor's levels array)
  const tLevels = col("teaching_levels", "question_3_answer");
  const q2LevelPass = matchesAtLeastOne(studentAnswers["question_2_answer"], tLevels);
  rules.push({ rule: "Q2 Level", passed: q2LevelPass, studentValue: studentAnswers["question_2_answer"], tutorValue: tLevels });

  // Q3 → subjects: Subjects — at least one overlap
  const tSubjects = col("subjects", "question_4_answer");
  const q3Pass = matchesAtLeastOne(studentAnswers["question_3_answer"], tSubjects);
  rules.push({ rule: "Q3 Subjects", passed: q3Pass, studentValue: studentAnswers["question_3_answer"], tutorValue: tSubjects });

  // Q6 → schedule: Availability — at least one slot must overlap
  const q6s = studentAnswers["question_6_answer"];
  const q6t = col("schedule", "question_7_answer");
  let q6Pass = true;
  let studentSlotCount = 0;
  let overlapCount = 0;
  if (isPlainObject(q6s)) {
    const studentSlots = Object.keys(q6s).filter((k) => q6s[k] === true);
    studentSlotCount = studentSlots.length;
    if (studentSlots.length > 0) {
      const tutorSlots: Set<string> = isPlainObject(q6t)
        ? new Set(Object.keys(q6t).filter((k) => q6t[k] === true))
        : new Set();
      overlapCount = studentSlots.filter((s) => tutorSlots.has(s)).length;
      q6Pass = overlapCount > 0;
    }
  }
  rules.push({
    rule: "Q6 Availability",
    passed: q6Pass,
    studentValue: `${studentSlotCount} slots selected`,
    tutorValue: `${overlapCount} overlapping slots`,
  });

  // Q7 → modalities: Session type/format
  const tModalities = col("modalities", "question_8_answer");
  const q7Pass = matchesAtLeastOne(studentAnswers["question_7_answer"], tModalities);
  rules.push({ rule: "Q7 Session type", passed: q7Pass, studentValue: studentAnswers["question_7_answer"], tutorValue: tModalities });

  // Q8 → location: District — conditional on student wanting presencial or centro-estudo
  const q7Student = normalizeString(studentAnswers["question_7_answer"]);
  let q8DistrictPass = true;
  if (q7Student === "presencial" || q7Student === "centro-estudo") {
    const studentDistrict = normalizeString(studentAnswers["question_8_answer"]);
    const tLocation = col("location", "question_9_answer");
    const tutorDistrict = normalizeString(tLocation);
    q8DistrictPass = !studentDistrict || studentDistrict === tutorDistrict;
    rules.push({
      rule: "Q8 District (conditional)",
      passed: q8DistrictPass,
      studentValue: studentAnswers["question_8_answer"] ?? "—",
      tutorValue: tLocation ?? "—",
    });
  } else {
    rules.push({ rule: "Q8 District (skipped — online)", passed: true, studentValue: "—", tutorValue: "—" });
  }

  // Q12 → accepted_profiles: Student profile the tutor accepts
  const tProfiles = col("accepted_profiles", "question_15_answer");
  const q12Pass = matchesAtLeastOne(studentAnswers["question_12_answer"], tProfiles);
  rules.push({ rule: "Q12 Profile", passed: q12Pass, studentValue: studentAnswers["question_12_answer"], tutorValue: tProfiles });

  const passed = rules.every((r) => r.passed);
  return { passed, rules };
}

/** Thin wrapper used in the actual filter — delegates to evaluateTutorFilter. */
function passesTutorFilter(tutor: any, studentAnswers: Record<string, any>): boolean {
  return evaluateTutorFilter(tutor, studentAnswers).passed;
}

// ─── Scoring detail type ──────────────────────────────────────────────────────

interface QuestionScore {
  question: string;
  label: string;
  rank: number;
  weight: string;       // formatted as "32.1%"
  studentValue: any;
  tutorValue: any;
  rawScore: string;     // formatted as "0.75"
  contribution: string; // formatted as "+21.8 pts"
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getBestTutorMatches(
  studentAnswers: Record<string, any>
): Promise<TutorMatch[]> {
  console.group("🎯 [TuTmaiT Matching] — Run started");

  // Fetch all tutors from the database
  const { data: tutors, error } = await supabase.from("tutores").select("*");

  if (error) {
    console.error("❌ Erro ao buscar tutores:", error);
    console.groupEnd();
    throw new Error("Erro ao buscar tutores");
  }

  if (!tutors || tutors.length === 0) {
    console.warn("⚠️ No tutors found in database.");
    console.groupEnd();
    return [];
  }

  console.log(`📦 Tutors fetched from DB: ${tutors.length}`);

  // ── Stage 1: Hard filter ──────────────────────────────────────────────────
  console.group("🔍 Stage 1 — Hard Filter");

  const filterResults = tutors.map((t: any) => ({
    tutor: t,
    detail: evaluateTutorFilter(t, studentAnswers),
  }));

  const passed = filterResults.filter((r) => r.detail.passed);
  const failed = filterResults.filter((r) => !r.detail.passed);

  console.log(`✅ Passed: ${passed.length} / ${tutors.length}    ❌ Rejected: ${failed.length}`);

  // Log each tutor's filter outcome
  filterResults.forEach(({ tutor, detail }) => {
    const name = tutor.name || tutor.id;
    const status = detail.passed ? "✅ PASS" : "❌ FAIL";
    const firstFail = detail.rules.find((r) => !r.passed);

    if (detail.passed) {
      console.groupCollapsed(`  ${status}  ${name}`);
    } else {
      console.group(`  ${status}  ${name}  ← failed on: ${firstFail?.rule ?? "unknown"}`);
    }

    console.table(
      detail.rules.map((r) => ({
        Rule: r.rule,
        "Pass?": r.passed ? "✅" : "❌",
        "Student value": JSON.stringify(r.studentValue),
        "Tutor value": JSON.stringify(r.tutorValue),
      }))
    );
    console.groupEnd();
  });

  console.groupEnd(); // Stage 1

  const filteredTutors = passed.map((r) => r.tutor);

  // If no tutor passes, fall back to full pool so the student always sees results
  const usingFallback = filteredTutors.length === 0;
  const scoringPool: any[] = usingFallback ? tutors : filteredTutors;

  if (usingFallback) {
    console.warn("⚠️  No tutors passed Stage 1. Falling back to full pool for Stage 2.");
  }

  // ── Stage 2 setup: scoring question indexes ───────────────────────────────
  const questionIndexes = Array.from(
    new Set(
      Object.keys(studentAnswers)
        .filter((k) => k.startsWith("question_") && k.endsWith("_answer"))
        .map((k) => k.split("_")[1])
    )
  ).filter((idx) => SCORING_QUESTIONS.has(idx));

  if (questionIndexes.length === 0) {
    console.warn("⚠️  No scoring question answers found. Ranking by rating only.");
    console.groupEnd();
    return scoringPool
      .map((t: any) => ({
        tutorId: String(t.id),
        compatibility: 0,
        name: t.name,
        profile_picture: t.profile_picture ?? null,
        subjects: t.subjects ?? null,
        rating: t.rating != null ? Number(t.rating) : null,
        bio: t.bio ?? null,
        email: t.email ?? null,
      }))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
  }

  // ── Weighting formula ─────────────────────────────────────────────────────
  // r_i = (N − rank_i + 1)^P   then normalise so Σ w_i = 1
  const ranks = questionIndexes.map((idx) => ({
    idx,
    rank: Number(studentAnswers[`question_${idx}_rank`]) || 1,
  }));

  const N = ranks.length;

  const rawWeights = ranks.map((q) => ({
    idx: q.idx,
    raw: Math.pow(N - q.rank + 1, P),
  }));

  const rawSum = rawWeights.reduce((sum, w) => sum + w.raw, 0);

  const normalizedWeights = rawWeights.map((w) => ({
    idx: w.idx,
    weight: w.raw / rawSum,
  }));

  const getWeight = (idx: string): number =>
    normalizedWeights.find((w) => w.idx === idx)?.weight || 0;

  // Log the weight table
  console.group("⚖️  Stage 2 — Question Weights (student priority order)");
  console.table(
    [...normalizedWeights]
      .sort((a, b) => b.weight - a.weight)
      .map((w) => ({
        "Q#": `Q${w.idx}`,
        Label: QUESTION_LABELS[w.idx] ?? w.idx,
        "Priority rank": ranks.find((r) => r.idx === w.idx)?.rank ?? "—",
        "Tutor column": STUDENT_IDX_TO_TUTOR_COLUMN[w.idx] ?? "—",
        "Weight": `${(w.weight * 100).toFixed(1)}%`,
      }))
  );
  console.groupEnd();

  // ── Stage 2: Compatibility scoring ───────────────────────────────────────
  function calculateCompatibilityDetailed(tutor: any): { total: number; breakdown: QuestionScore[] } {
    // Read from semantic column; fall back to raw_answers for pre-migration tutors.
    const getTutorVal = (studentIdx: string): any => {
      const semCol = STUDENT_IDX_TO_TUTOR_COLUMN[studentIdx];
      const rawKey = STUDENT_IDX_TO_TUTOR_KEY[studentIdx];
      if (semCol) {
        const direct = tutor[semCol];
        if (direct !== null && direct !== undefined && !(Array.isArray(direct) && direct.length === 0)) {
          return direct;
        }
      }
      if (rawKey) return tutor?.raw_answers?.[rawKey] ?? tutor[rawKey];
      return undefined;
    };

    let total = 0;
    const breakdown: QuestionScore[] = [];

    for (const idx of questionIndexes) {
      const sRaw = studentAnswers[`question_${idx}_answer`];
      const tRaw = getTutorVal(idx);
      const w = getWeight(idx);
      const rank = ranks.find((r) => r.idx === idx)?.rank ?? 1;

      let rawScore = 0;

      // Q4 — sessions/week: coverage logic
      // Score = 1.0 if tutor can cover ≥ student's sessions, else tutorSessions/studentSessions
      if (idx === "4") {
        const parseSessions = (v: any): number => {
          if (v === "5+" || v === "5 ou mais sessões") return 5;
          const n = parseInt(String(v), 10);
          return isNaN(n) ? 0 : n;
        };
        const studentSessions = parseSessions(sRaw);
        const tutorSessions = parseSessions(tRaw);

        if (studentSessions === 0) {
          breakdown.push({
            question: "Q4",
            label: QUESTION_LABELS["4"],
            rank,
            weight: `${(w * 100).toFixed(1)}%`,
            studentValue: sRaw,
            tutorValue: tRaw,
            rawScore: "—  (no value)",
            contribution: "+0.0 pts",
          });
          continue;
        }

        rawScore = tutorSessions >= studentSessions ? 1 : tutorSessions / studentSessions;
        total += rawScore * w * 100;

        breakdown.push({
          question: "Q4",
          label: QUESTION_LABELS["4"],
          rank,
          weight: `${(w * 100).toFixed(1)}%`,
          studentValue: `${studentSessions} sessões/sem`,
          tutorValue: `${tutorSessions} sessões/sem`,
          rawScore: rawScore.toFixed(2),
          contribution: `+${(rawScore * w * 100).toFixed(1)} pts`,
        });
        continue;
      }

      // Q8 — location: fixed 60/30/10 split across distrito → concelho → freguesia
      if (idx === "8") {
        const sDistrict = studentAnswers["question_8_answer"] || "";
        const sMunicipality = studentAnswers["question_8_municipality"] || "";
        const sParish = studentAnswers["question_8_parish"] || "";
        const tDistrict = tutor["location"] ?? tutor?.raw_answers?.["question_9_answer"] ?? "";
        const tMunicipality = tutor["municipality"] ?? tutor?.raw_answers?.["question_9_municipality"] ?? "";
        const tParish = tutor["parish"] ?? tutor?.raw_answers?.["question_9_parish"] ?? "";

        rawScore = compareLocation(sDistrict, sMunicipality, sParish, tDistrict, tMunicipality, tParish);
        total += rawScore * w * 100;

        breakdown.push({
          question: `Q${idx}`,
          label: QUESTION_LABELS[idx] ?? idx,
          rank,
          weight: `${(w * 100).toFixed(1)}%`,
          studentValue: `${sDistrict || "—"} / ${sMunicipality || "—"} / ${sParish || "—"}`,
          tutorValue: `${tDistrict || "—"} / ${tMunicipality || "—"} / ${tParish || "—"}`,
          rawScore: `${rawScore.toFixed(2)} (60% dist + 30% conc + 10% freg)`,
          contribution: `+${(rawScore * w * 100).toFixed(1)} pts`,
        });
        continue;
      }

      // Q6 — availability grid: score by overlapping boolean time slots
      if (isPlainObject(sRaw) && isPlainObject(tRaw)) {
        rawScore = compareAvailability(sRaw, tRaw);
        total += rawScore * w * 100;

      // Incomparable types → skip
      } else if (isPlainObject(sRaw) || isPlainObject(tRaw)) {
        breakdown.push({
          question: `Q${idx}`,
          label: QUESTION_LABELS[idx] ?? idx,
          rank,
          weight: `${(w * 100).toFixed(1)}%`,
          studentValue: sRaw,
          tutorValue: tRaw,
          rawScore: "—  (incomparable types)",
          contribution: "+0.0 pts",
        });
        continue;

      // Scalar / array comparison
      } else {
        const sValues = Array.isArray(sRaw) ? sRaw.map(normalizeString) : [normalizeString(sRaw)];
        const tValues = Array.isArray(tRaw) ? tRaw.map(normalizeString) : [normalizeString(tRaw)];
        const studentItems = sValues.filter((v) => v !== "");
        const tutorItems = tValues.filter((v) => v !== "");

        if (studentItems.length === 0 || tutorItems.length === 0) {
          breakdown.push({
            question: `Q${idx}`,
            label: QUESTION_LABELS[idx] ?? idx,
            rank,
            weight: `${(w * 100).toFixed(1)}%`,
            studentValue: sRaw,
            tutorValue: tRaw,
            rawScore: "—  (no values)",
            contribution: "+0.0 pts",
          });
          continue;
        }

        let matches = 0;
        for (const sVal of studentItems) {
          if (tutorItems.includes(sVal)) {
            matches += 1;
          } else if (tutorItems.some((tVal) => tVal.includes(sVal))) {
            matches += 0.5;
          }
        }

        rawScore = matches / studentItems.length;
        total += rawScore * w * 100;
      }

      breakdown.push({
        question: `Q${idx}`,
        label: QUESTION_LABELS[idx] ?? idx,
        rank,
        weight: `${(w * 100).toFixed(1)}%`,
        studentValue: Array.isArray(sRaw) ? sRaw.join(", ") : (isPlainObject(sRaw) ? JSON.stringify(sRaw) : sRaw),
        tutorValue: Array.isArray(tRaw) ? tRaw.join(", ") : (isPlainObject(tRaw) ? JSON.stringify(tRaw) : tRaw),
        rawScore: rawScore.toFixed(2),
        contribution: `+${(rawScore * w * 100).toFixed(1)} pts`,
      });
    }

    return { total: Math.max(0, Math.min(100, Math.round(total))), breakdown };
  }

  // Score all filtered tutors
  const scoredResults = scoringPool.map((t: any) => {
    const { total, breakdown } = calculateCompatibilityDetailed(t);
    return {
      tutor: t,
      compatibility: total,
      breakdown,
    };
  });

  // Log quick overview of all scored tutors
  console.group("📊 Stage 2 — Compatibility Scores (all filtered tutors)");
  console.table(
    [...scoredResults]
      .sort((a, b) => b.compatibility - a.compatibility)
      .map((r) => ({
        Name: r.tutor.name || r.tutor.id,
        "Score (%)": r.compatibility,
        "Rating": r.tutor.rating ?? "—",
      }))
  );
  console.groupEnd();

  // ── Build final ranked list ───────────────────────────────────────────────
  const anyPositive = scoredResults.some((r) => r.compatibility > 0);

  const sorted = anyPositive
    ? [...scoredResults].sort((a, b) => {
        if (b.compatibility !== a.compatibility) return b.compatibility - a.compatibility;
        return ((b.tutor.rating || 0) as number) - ((a.tutor.rating || 0) as number);
      })
    : [...scoredResults].sort((a, b) => ((b.tutor.rating || 0) as number) - ((a.tutor.rating || 0) as number));

  const top3 = sorted.slice(0, Math.min(3, sorted.length));

  // ── Detailed log for the top 3 ────────────────────────────────────────────
  const medals = ["🥇", "🥈", "🥉"];
  console.group("🏆 Top 3 Matches — Detailed Breakdown");

  top3.forEach((result, i) => {
    const name = result.tutor.name || result.tutor.id;
    const score = result.compatibility;
    const rating = result.tutor.rating ?? "—";

    console.group(`${medals[i]}  #${i + 1} — ${name}   |   Compatibility: ${score}%   |   Rating: ${rating}`);

    console.table(
      result.breakdown.map((q) => ({
        "Question": q.question,
        "Topic": q.label,
        "Priority rank": q.rank,
        "Weight": q.weight,
        "Student value": q.studentValue,
        "Tutor value": q.tutorValue,
        "Raw score (0–1)": q.rawScore,
        "Contribution": q.contribution,
      }))
    );

    console.log(`   Total score: ${score} / 100`);
    console.groupEnd();
  });

  console.groupEnd(); // Top 3
  console.groupEnd(); // Run started

  // Return the standard TutorMatch shape
  return top3.map((r) => ({
    tutorId: String(r.tutor.id),
    compatibility: r.compatibility,
    name: r.tutor.name,
    profile_picture: r.tutor.profile_picture || null,
    subjects: r.tutor.subjects || null,
    rating: r.tutor.rating != null ? Number(r.tutor.rating) : null,
    bio: r.tutor.bio || null,
    email: r.tutor.email || null,
  }));
}

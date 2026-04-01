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

// Parâmetro p do método de potência
const P = 1.5;

// Mapeamento: índice da pergunta do ALUNO → índice da pergunta do TUTOR
// As perguntas têm numerações diferentes nos dois questionários
const STUDENT_TO_TUTOR: Record<string, string> = {
  '1': '1',   // formato (individual/grupo) — mesmo valor
  '3': '5',   // disciplinas
  '5': '7',   // preço (orçamento do aluno vs valor cobrado pelo tutor)
  '6': '8',   // disponibilidade (grelha de slots)
  '7': '9',   // tipo (presencial/online/centro-estudo)
  '8': '11',  // localização (distrito)
  '10': '15', // abordagem de ensino
  '11': '16', // hobbies
  '12': '17', // perfil/necessidades do aluno
};

function normalizeString(input?: string | null) {
  if (input === undefined || input === null) return "";
  return input
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function compareAvailability(sRaw: any, tRaw: any): number {
  if (!sRaw || !tRaw || typeof sRaw !== "object" || typeof tRaw !== "object") return 0;
  const studentSlots = Object.keys(sRaw).filter((k) => sRaw[k] === true);
  if (studentSlots.length === 0) return 0;
  const tutorSlots = new Set(Object.keys(tRaw).filter((k) => tRaw[k] === true));
  const overlap = studentSlots.filter((s) => tutorSlots.has(s)).length;
  return overlap / studentSlots.length;
}

function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// Converte string de intervalo "10-15" ou "45+" num par [min, max]
function parseRange(r: string): [number, number] {
  const s = r.trim();
  if (s.includes("+")) return [parseInt(s), 999];
  const parts = s.split("-").map(Number);
  return [parts[0] || 0, parts[1] || parts[0] || 0];
}

// Compatibilidade de preço: devolve 0–1
// Lógica: se o tutor cobra dentro do orçamento do aluno → match total;
// se cobra ligeiramente acima → match parcial; se muito acima → 0
function comparePriceRanges(studentBudget: string, tutorCharge: string): number {
  if (!studentBudget || !tutorCharge) return 0;
  const [sMin, sMax] = parseRange(studentBudget);
  const [tMin, tMax] = parseRange(tutorCharge);
  // Sobreposição total: tutor está dentro do orçamento
  if (tMax <= sMax && tMin >= sMin) return 1;
  // Sobreposição parcial: os intervalos cruzam-se
  if (tMin <= sMax && tMax >= sMin) return 0.5;
  // Sem sobreposição
  return 0;
}

// Compatibilidade de tipo de ensino (Q7 aluno / Q9 tutor)
// "indiferente" do tutor → match com qualquer tipo do aluno
function compareTeachingType(sVal: string, tVal: string): number {
  const s = normalizeString(sVal);
  const t = normalizeString(tVal);
  if (t === "indiferente") return 1;
  if (s === t) return 1;
  // presencial e centro-estudo são ambos físicos → match parcial
  const physical = new Set(["presencial", "centro-estudo", "centro de estudo"]);
  if (physical.has(s) && physical.has(t)) return 0.7;
  return 0;
}

export async function getBestTutorMatches(
  studentAnswers: Record<string, any>
): Promise<TutorMatch[]> {
  const { data: tutors, error } = await supabase.from("tutores").select("*");

  if (error) {
    console.error("Erro ao buscar tutores:", error);
    throw new Error("Erro ao buscar tutores");
  }

  if (!tutors || tutors.length === 0) return [];

  // Só mostrar tutores com perfil público (foto real — mesmo critério do marketplace)
  const publicTutors = tutors.filter(
    (t: any) => t.profile_picture && t.profile_picture.startsWith("data:image")
  );
  if (publicTutors.length === 0) return [];

  // Identificar perguntas do aluno que têm equivalente no perfil do tutor
  const allStudentIndexes = Array.from(
    new Set(
      Object.keys(studentAnswers)
        .filter((k) => k.startsWith("question_") && k.endsWith("_answer"))
        .map((k) => k.split("_")[1])
    )
  );

  // Só usar perguntas com mapeamento definido
  const questionIndexes = allStudentIndexes.filter((idx) => idx in STUDENT_TO_TUTOR);

  if (questionIndexes.length === 0) {
    return publicTutors
      .map((t: any) => ({
        tutorId: String(t.id),
        compatibility: 0,
        name: t.name,
        profile_picture: t.profile_picture,
        subjects: t.subjects,
        rating: t.rating ? Number(t.rating) : null,
        bio: t.bio,
        email: t.email,
      }))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
  }

  // 1. Ranks das perguntas (baseado nas prioridades do aluno)
  const ranks = questionIndexes.map((idx) => ({
    idx,
    rank: Number(studentAnswers[`question_${idx}_rank`]) || 1,
  }));

  const N = ranks.length;

  // 2. Peso bruto ri = (N - rank_i + 1)^P
  const rawWeights = ranks.map((q) => ({
    idx: q.idx,
    raw: Math.pow(N - q.rank + 1, P),
  }));

  const rawSum = rawWeights.reduce((sum, w) => sum + w.raw, 0);

  // 3. Normalizar wi = ri / Σ ri
  const normalizedWeights = rawWeights.map((w) => ({
    idx: w.idx,
    weight: rawSum > 0 ? w.raw / rawSum : 1 / rawWeights.length,
  }));

  const getWeight = (idx: string) =>
    normalizedWeights.find((w) => w.idx === idx)?.weight || 0;

  // 4. Calcular compatibilidade
  function calculateCompatibility(tutor: any) {
    let total = 0;

    for (const idx of questionIndexes) {
      const tutorIdx = STUDENT_TO_TUTOR[idx];
      const sRaw = studentAnswers[`question_${idx}_answer`];
      const tutorKey = `question_${tutorIdx}_answer`;
      const tRaw = tutor[tutorKey] ?? tutor?.raw_answers?.[tutorKey];

      const w = getWeight(idx);

      // Grelha de disponibilidade
      if (isPlainObject(sRaw) && isPlainObject(tRaw)) {
        total += compareAvailability(sRaw, tRaw) * w * 100;
        continue;
      }
      if (isPlainObject(sRaw) || isPlainObject(tRaw)) continue;

      // Preço: comparação especial de intervalos
      if (idx === '5') {
        const score = comparePriceRanges(String(sRaw || ''), String(tRaw || ''));
        total += score * w * 100;
        continue;
      }

      // Tipo de ensino: comparação especial com 'indiferente'
      if (idx === '7') {
        if (!sRaw || !tRaw) continue;
        const score = compareTeachingType(String(sRaw), String(tRaw));
        total += score * w * 100;
        continue;
      }

      // Comparação genérica (strings / arrays)
      const sValues = Array.isArray(sRaw)
        ? sRaw.map(normalizeString)
        : [normalizeString(sRaw)];

      const tValues = Array.isArray(tRaw)
        ? tRaw.map(normalizeString)
        : [normalizeString(tRaw)];

      const studentItems = sValues.filter((v) => v !== "");
      const tutorItems = tValues.filter((v) => v !== "");

      if (studentItems.length === 0 || tutorItems.length === 0) continue;

      let matches = 0;
      for (const sVal of studentItems) {
        if (tutorItems.includes(sVal)) {
          matches += 1;
        } else if (tutorItems.some((tVal) => tVal.includes(sVal) || sVal.includes(tVal))) {
          matches += 0.5;
        }
      }

      const perQuestionCompatibility = matches / studentItems.length;
      total += perQuestionCompatibility * w * 100;
    }

    return Math.max(0, Math.min(100, Math.round(total)));
  }

  const results: TutorMatch[] = publicTutors.map((t: any) => ({
    tutorId: String(t.id),
    compatibility: calculateCompatibility(t),
    name: t.name,
    profile_picture: t.profile_picture || null,
    subjects: t.subjects || (t.raw_answers?.question_5_answer) || null,
    rating: t.rating !== undefined && t.rating !== null ? Number(t.rating) : null,
    bio: t.bio || null,
    email: t.email || null,
  }));

  const anyPositive = results.some((r) => r.compatibility > 0);

  if (!anyPositive) {
    return results
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, Math.min(3, results.length));
  }

  return results
    .sort((a, b) => {
      if (b.compatibility !== a.compatibility)
        return b.compatibility - a.compatibility;
      return (b.rating || 0) - (a.rating || 0);
    })
    .slice(0, Math.min(3, results.length));
}

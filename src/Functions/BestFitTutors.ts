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

/**
 * Normaliza strings
 */
function normalizeString(input?: string | null) {
  if (input === undefined || input === null) return "";
  return input
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export async function getBestTutorMatches(
  studentAnswers: Record<string, any>
): Promise<TutorMatch[]> {
  // Buscar tutores
  const { data: tutors, error } = await supabase.from("tutores").select("*");

  if (error) {
    console.error("Erro ao buscar tutores:", error);
    throw new Error("Erro ao buscar tutores");
  }

  if (!tutors || tutors.length === 0) return [];

  // Identificar perguntas
  const questionIndexes = Array.from(
    new Set(
      Object.keys(studentAnswers)
        .filter((k) => k.startsWith("question_") && k.endsWith("_answer"))
        .map((k) => k.split("_")[1])
    )
  );

  if (questionIndexes.length === 0) {
    // fallback por rating
    return tutors
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

  // ------------------------------
  // 🔥 1. Ler ranks das perguntas
  // ------------------------------
  const ranks = questionIndexes.map((idx) => ({
    idx,
    rank: Number(studentAnswers[`question_${idx}_rank`]) || 1,
  }));

  const N = ranks.length;

  // ------------------------------
  // 🔥 2. Calcular peso bruto ri
  // r_i = (N - rank_i + 1)^P
  // ------------------------------
  const rawWeights = ranks.map((q) => ({
    idx: q.idx,
    raw: Math.pow(N - q.rank + 1, P),
  }));

  const rawSum = rawWeights.reduce((sum, w) => sum + w.raw, 0);

  // ------------------------------
  // 🔥 3. Normalizar wi = ri / Σ ri
  // ------------------------------
  const normalizedWeights = rawWeights.map((w) => ({
    idx: w.idx,
    weight: w.raw / rawSum, // soma = 1
  }));

  // Criar acesso rápido weight por pergunta
  const getWeight = (idx: string) =>
    normalizedWeights.find((w) => w.idx === idx)?.weight || 0;

  // ------------------------------
  // 🔥 4. Função de cálculo de compatibilidade
  // ------------------------------
  function calculateCompatibility(tutor: any) {
    let total = 0;

    for (const idx of questionIndexes) {
      const sRaw = studentAnswers[`question_${idx}_answer`];
      const tRaw = tutor[`question_${idx}_answer`];

      const sValues = Array.isArray(sRaw)
        ? sRaw.map(normalizeString)
        : [normalizeString(sRaw)];

      const tValues = Array.isArray(tRaw)
        ? tRaw.map(normalizeString)
        : [normalizeString(tRaw)];

      const studentItems = sValues.filter((v) => v !== "");
      const tutorItems = tValues.filter((v) => v !== "");

      if (studentItems.length === 0 || tutorItems.length === 0) continue;

      // ---- Calcular matches ----
      let matches = 0;

      for (const sVal of studentItems) {
        if (tutorItems.includes(sVal)) {
          matches += 1;
        } else if (tutorItems.some((tVal) => tVal.includes(sVal))) {
          matches += 0.5;
        }
      }

      const perQuestionCompatibility = matches / studentItems.length;

      // Peso normalizado da pergunta
      const w = getWeight(idx);

      // Pontuação final ponderada
      total += perQuestionCompatibility * w * 100;
    }

    // Garante 0–100
    return Math.max(0, Math.min(100, Math.round(total)));
  }

  // Calcular resultados
  const results: TutorMatch[] = tutors.map((t: any) => ({
    tutorId: String(t.id),
    compatibility: calculateCompatibility(t),
    name: t.name,
    profile_picture: t.profile_picture || null,
    subjects: t.subjects || null,
    rating:
      t.rating !== undefined && t.rating !== null ? Number(t.rating) : null,
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

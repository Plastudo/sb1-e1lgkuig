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

/**
 * Normaliza strings: remove acentos, trim e toLowerCase
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

/**
 * Recebe um objecto studentAnswers onde as chaves são "question_1_answer", "question_2_answer", ...
 * Retorna até 3 melhores matches, cada um já com campos do tutor (name, email, etc).
 */
export async function getBestTutorMatches(studentAnswers: Record<string, any>): Promise<TutorMatch[]> {
  // Busca todos os tutores
  const { data: tutors, error } = await supabase.from("tutores").select("*");

  if (error) {
    console.error("Erro ao buscar tutores:", error);
    throw new Error("Erro ao buscar tutores");
  }

  if (!tutors || tutors.length === 0) {
    return [];
  }

  // Obter as chaves do studentAnswers que começam por "question_"
  const questionKeys = Object.keys(studentAnswers).filter((k) => k.startsWith("question_"));

  // Fallback: Sem perguntas → retornar top 3 por rating
  if (questionKeys.length === 0) {
    const fallback = tutors
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

    return fallback;
  }

  // Peso igual para todas as perguntas
  const questionWeight = 100 / questionKeys.length;

  /**
   * Cálculo completo da compatibilidade do tutor
   */
  function calculateCompatibility(tutor: any) {
    let total = 0;

    for (const key of questionKeys) {
      const sRaw = studentAnswers[key];
      const tRaw = tutor[key];

      // Transformar em array mesmo se for string simples
      const sValues = Array.isArray(sRaw)
        ? sRaw.map(normalizeString)
        : [normalizeString(sRaw)];

      const tValues = Array.isArray(tRaw)
        ? tRaw.map(normalizeString)
        : [normalizeString(tRaw)];

      // Remover vazios
      const studentItems = sValues.filter((v) => v !== "");
      const tutorItems = tValues.filter((v) => v !== "");

      if (studentItems.length === 0 || tutorItems.length === 0) continue;

      // ---- Compatibilidade por pergunta ----
      let matches = 0;

      for (const sVal of studentItems) {
        if (tutorItems.includes(sVal)) {
          matches += 1; // match exato
        } else {
          // match parcial
          if (tutorItems.some((tVal) => tVal.includes(sVal))) {
            matches += 0.5;
          }
        }
      }

      // percentagem da pergunta
      const questionScore = (matches / studentItems.length) * questionWeight;
      total += questionScore;
    }

    const rounded = Math.max(0, Math.min(100, Math.round(total)));
    return rounded;
  }

  // Calcula todos os resultados
  const results: TutorMatch[] = tutors.map((t: any) => ({
    tutorId: String(t.id),
    compatibility: calculateCompatibility(t),
    name: t.name,
    profile_picture: t.profile_picture || null,
    subjects: t.subjects || null,
    rating: t.rating !== undefined && t.rating !== null ? Number(t.rating) : null,
    bio: t.bio || null,
    email: t.email || null,
  }));

  // Fallback: todos com compatibilidade 0 → ordenar por rating
  const anyPositive = results.some((r) => r.compatibility > 0);

  if (!anyPositive) {
    return results
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, Math.min(3, results.length));
  }

  // Caso normal: ordenar por compatibilidade e depois rating
  return results
    .sort((a, b) => {
      if (b.compatibility !== a.compatibility) return b.compatibility - a.compatibility;
      return (b.rating || 0) - (a.rating || 0);
    })
    .slice(0, Math.min(3, results.length));
}

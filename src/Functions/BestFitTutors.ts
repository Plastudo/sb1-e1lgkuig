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
export async function getBestTutorMatches(studentAnswers: Record<string, string>): Promise<TutorMatch[]> {
  // Busca todos os tutores (podes otimizar com filtros mais tarde)
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

  // Se não houver perguntas, devolve top 3 por rating (fallback)
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

  const questionWeight = 100 / questionKeys.length;

  function calculateCompatibility(tutor: any) {
    let total = 0;

    for (const key of questionKeys) {
      const sValueRaw = studentAnswers[key];
      // Alguns registos de tutor podem ter os campos com null / undefined
      const tValueRaw = (tutor as any)[key];

      const sValue = normalizeString(sValueRaw);
      const tValue = normalizeString(tValueRaw);

      if (sValue !== "" && tValue !== "") {
        if (tValue === sValue) {
          total += questionWeight;
        } else {
          // Pequena heurística: se tutor.subjects contém sValue (ex: "matematica"), dá meia-pontuação
          try {
            const tutorSubjects: string[] = Array.isArray(tutor.subjects) ? tutor.subjects.map(String) : [];
            const normalizedSubjects = tutorSubjects.map(normalizeString);
            if (normalizedSubjects.some((sub) => sub.includes(sValue))) {
              total += questionWeight * 0.5;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    }

    // Garantir número inteiro 0..100
    const rounded = Math.max(0, Math.min(100, Math.round(total)));
    return rounded;
  }

  // Calcula resultados
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

  // Se todas compatibilidades forem 0, devolve top 3 por rating (fallback)
  const anyPositive = results.some((r) => r.compatibility > 0);

  if (!anyPositive) {
    return results
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, Math.min(3, results.length));
  }

  // Caso normal: devolve top 3 por compatibilidade (se empate, por rating)
  return results
    .sort((a, b) => {
      if (b.compatibility !== a.compatibility) return b.compatibility - a.compatibility;
      return (b.rating || 0) - (a.rating || 0);
    })
    .slice(0, Math.min(3, results.length));
}

import { supabase } from "../lib/supabase";

export async function getBestTutorMatches(studentAnswers: Record<string, string>) {
  const { data: tutors, error } = await supabase.from("tutores").select("*");
  if (error) throw new Error("Erro ao buscar tutores");

  if (!tutors || tutors.length === 0) return [];

  const questionKeys = Object.keys(studentAnswers).filter(key =>
    key.startsWith("question_")
  );

  const questionWeight = 100 / questionKeys.length;

  function calculateCompatibility(tutor: any) {
    let total = 0;

    for (const key of questionKeys) {
      const sValue = studentAnswers[key];
      const tValue = tutor[key];

      if (typeof sValue === "string" && typeof tValue === "string") {
        if (tValue.trim().toLowerCase() === sValue.trim().toLowerCase()) {
          total += questionWeight;
        }
      }
    }

    return Math.round(total);
  }

  const results = tutors.map(t => ({
    tutorId: t.id as string,
    compatibility: calculateCompatibility(t),
  }));

  return results
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, Math.min(3, results.length));
}

export async function getBestTutorMatches(studentAnswers: Record<string, string>) {
  // buscar todos os tutores
  const { data: tutors, error } = await supabase.from("tutors").select("*");
  if (error) throw new Error("Erro ao buscar tutores");

  // detectar perguntas dinamicamente
  const questionKeys = Object.keys(studentAnswers).filter(key =>
    key.startsWith("question_")
  );

  const questionWeight = 100 / questionKeys.length;

  function calculateCompatibility(tutor: any) {
    let total = 0;

    for (const key of questionKeys) {
      const sValue = studentAnswers[key];
      const tValue = tutor[key];

      if (!sValue) continue;

      // STRING
      if (typeof sValue === "string" && tValue === sValue) {
        total += questionWeight;
      }
    }

    return Math.round(total);
  }

  return tutors
    .map(t => ({
      tutorId: t.id,
      compatibility: calculateCompatibility(t),
    }))
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, 3);
}

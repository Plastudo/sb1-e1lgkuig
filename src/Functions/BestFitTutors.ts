import { createClient } from "@supabase/supabase-js";

// Supabase + UUID
import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

/**
 * Serviço Dinâmico de Matching
 */
export async function getBestTutorMatches(sessionId: string) {
  const { data: student, error: studentError } = await supabase
    .from("temp_students")
    .select("*")
    .eq("session_id", sessionId) // <--- aqui
    .single();

  if (studentError || !student) {
    throw new Error("Erro ao buscar estudante");
  }

  // 2. Buscar todos os tutores
  const { data: tutors, error: tutorsError } = await supabase
    .from("tutors")
    .select("*");

  if (tutorsError || !tutors) {
    throw new Error("Erro ao buscar tutores");
  }

  // 3. Detetar todas as colunas dinamicamente
  const questionKeys = Object.keys(student).filter((key) =>
    key.startsWith("question_")
  );

  const questionWeight = 100 / questionKeys.length; // peso por pergunta

  // Função de compatibilidade dinâmica
  function calculateCompatibility(tutor: any) {
    let total = 0;

    for (const key of questionKeys) {
      const studentValue = student[key];
      const tutorValue = tutor[key];

      if (studentValue == null) continue;

      // ---- Pergunta tipo STRING ----
      if (typeof studentValue === "string") {
        if (tutorValue === studentValue) {
          total += questionWeight;
        }
      }

      // ---- Pergunta tipo ARRAY ----
      else if (Array.isArray(studentValue)) {
        const studentArray = studentValue;
        const tutorArray = Array.isArray(tutorValue) ? tutorValue : [];

        if (studentArray.length > 0) {
          const perItem = questionWeight / studentArray.length;

          studentArray.forEach((item) => {
            if (tutorArray.includes(item)) {
              total += perItem;
            }
          });
        }
      }
    }

    return Math.round(total);
  }

  // 4. Avaliar todos os tutores
  const results = tutors.map((tutor) => ({
    tutorId: tutor.id,
    compatibility: calculateCompatibility(tutor),
  }));

  // 5. Ordenar e pegar top 3
  return results
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, 3);
}


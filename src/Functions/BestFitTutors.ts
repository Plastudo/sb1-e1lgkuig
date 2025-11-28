import { supabase } from '../lib/supabase'

interface Answers {
  [key: string]: string | string[]
}

interface TutorMatch {
  tutorId: number
  compatibility: number
}

/**
 * Calcula os melhores tutors com base nas respostas do estudante
 * @param answers respostas do estudante
 * @returns top 3 tutors com compatibilidade
 */
export async function getBestTutorMatches(answers: Answers): Promise<TutorMatch[]> {
  //  Buscar todos os tutores
  const { data: tutors, error } = await supabase
    .from('tutors')
    .select('*')

  if (error || !tutors) {
    throw new Error('Erro ao buscar tutores')
  }

  // Detetar todas as "perguntas" nas respostas
  const questionKeys = Object.keys(answers).filter(key => key.startsWith('question_'))
  const questionWeight = 100 / questionKeys.length

  // Função de compatibilidade
  function calculateCompatibility(tutor: any): number {
    let total = 0

    for (const key of questionKeys) {
      const studentValue = answers[key]
      const tutorValue = tutor[key]

      if (studentValue == null) continue

      // STRING
      if (typeof studentValue === 'string') {
        if (tutorValue === studentValue) total += questionWeight
      }
      // ARRAY
      else if (Array.isArray(studentValue)) {
        const tutorArray = Array.isArray(tutorValue) ? tutorValue : []
        const perItem = questionWeight / studentValue.length
        studentValue.forEach(item => {
          if (tutorArray.includes(item)) total += perItem
        })
      }
    }

    return Math.round(total)
  }

  // Avaliar todos os tutores
  const results = tutors.map(tutor => ({
    tutorId: tutor.id,
    compatibility: calculateCompatibility(tutor)
  }))

  // Ordenar e pegar top 3
  return results.sort((a, b) => b.compatibility - a.compatibility).slice(0, 3)
}

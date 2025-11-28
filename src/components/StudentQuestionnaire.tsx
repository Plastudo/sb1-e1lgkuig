import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { ChevronRight, ChevronLeft, Check, Star, Mail } from 'lucide-react'

import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

import { getBestTutorMatches } from '../Functions/BestFitTutors'


interface QuestionOption {
  value: string
  label: string
}

interface Question {
  id: number
  title: string
  options: QuestionOption[]
}


const questions: Question[] = [
  {
    id: 1,
    title: "Em que área precisa de ajuda?",
    options: [
      { value: "matematica", label: "A) Matemática e Ciências Exatas" },
      { value: "linguas", label: "B) Línguas e Literatura" },
      { value: "ciencias", label: "C) Ciências Naturais e Biologia" },
      { value: "humanas", label: "D) Ciências Humanas e Sociais" }
    ]
  },
  {
    id: 2,
    title: "Qual a fase escolar?",
    options: [
      { value: "Básico", label: "A) Ensino Básico" },
      { value: "Secundário", label: "B) Ensino Secundário" },
      { value: "Superior", label: "C) Ensino Superior" }
    ]
  }
]


interface TutorMatch {
  tutorId: string
  compatibility: number
  name?: string
  profile_picture?: string
  subjects?: string[]
  rating?: string
  bio?: string
  email?: string
}


export const StudentQuestionnaire: React.FC = () => {

  const [currentQuestion, setCurrentQuestion] = useState<number>(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState<boolean>(false)
  const [matchedTutors, setMatchedTutors] = useState<TutorMatch[]>([])
  const navigate = useNavigate()

  const sessionIdRef = useRef<string>(uuidv4())


  const saveAnswersToSupabase = async (answers: Record<string, string>) => {
    const payload = {
      session_id: sessionIdRef.current,
      question_1_answer: answers.question_1_answer || null,
      question_2_answer: answers.question_2_answer || null,
    }

    const { data, error } = await supabase
      .from('temp_students')
      .insert([payload])
      .select()

    if (error) {
      console.error("Erro ao salvar respostas:", error)
      return null
    }

    return data[0]
  }


  const handleAnswer = async (questionId: number, answer: string) => {
    const updatedAnswers = {
      ...answers,
      [`question_${questionId}_answer`]: answer
    }

    setAnswers(updatedAnswers)

    const isLast = currentQuestion === questions.length - 1

    if (!isLast) {
      setCurrentQuestion(currentQuestion + 1)
      return
    }

    const studentRecord = await saveAnswersToSupabase(updatedAnswers)
    if (!studentRecord) return

    try {
      const topMatches = await getBestTutorMatches(updatedAnswers)
      const tutorIds = topMatches.map(t => t.tutorId)

      if (tutorIds.length === 0) {
        setMatchedTutors([])
        setShowResults(true)
        return
      }

      const { data: tutorsData, error } = await supabase
        .from("tutores")
        .select("*")
        .in("id", tutorIds)

      if (error) {
        console.error("Erro ao buscar tutors:", error)
        return
      }

      const finalTutors = topMatches.map(match => ({
        ...match,
        ...(tutorsData?.find(t => t.id === match.tutorId) || {})
      }))

      setMatchedTutors(finalTutors)
      setShowResults(true)

    } catch (err) {
      console.error("Erro ao calcular matches:", err)
    }
  }


  const handleContactTutor = (email: string, tutorName: string) => {
    const subject = encodeURIComponent(`Interessado em explicações - Plastudo`)
    const body = encodeURIComponent(
      `Olá ${tutorName},\n\nEncontrei o seu perfil na Plastudo e estou interessado(a) nas suas explicações.\n\nPodemos conversar sobre disponibilidade e condições?\n\nObrigado(a)!`
    )
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }


  const goBack = () => {
    if (showResults) {
      setShowResults(false)
      setCurrentQuestion(questions.length - 1)
    } else if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }


  // ---------------------- RESULTADOS ----------------------
  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
        <div className="max-w-6xl mx-auto px-4">

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Os seus matches perfeitos!</h2>
            <p className="text-lg text-gray-600 mb-6">
              Baseado nas suas respostas, encontrámos estes explicadores ideais.
            </p>

            <Button variant="outline" onClick={goBack} className="mb-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar ao questionário
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {matchedTutors.map((tutor, index) => (
              <motion.div
                key={tutor.tutorId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm">

                  <div className="text-center mb-4">
                    <img
                      src={tutor.profile_picture}
                      alt={tutor.name}
                      className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                    />

                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{tutor.name}</h3>

                    <p className="text-green-600 font-medium mb-2">
                      {tutor.subjects?.[0] || "—"}
                    </p>

                    <div className="flex items-center justify-center space-x-1 mb-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-700">{tutor.rating || "—"}</span>
                    </div>

                    <p className="text-blue-600 font-semibold text-sm">
                      Compatibilidade: {tutor.compatibility}%
                    </p>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{tutor.bio}</p>

                  <div className="space-y-2">
                    <Button
                      onClick={() => navigate(`/profile/${tutor.tutorId}`)}
                      variant="outline"
                      className="w-full"
                    >
                      Ver perfil completo
                    </Button>

                    <Button
                      onClick={() => handleContactTutor(tutor.email!, tutor.name!)}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      <Mail className="h-4 w-4 mr-2" /> Contactar
                    </Button>
                  </div>

                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ---------------------- QUESTIONÁRIO ----------------------
  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100


  return (/* ... resto igual ... */)
}

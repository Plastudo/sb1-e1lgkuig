//---------------- IMPORTAÇÕES -------------------
import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { ChevronRight, ChevronLeft, Check, Star, Mail } from 'lucide-react'

// Supabase + UUID
import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// Serviço de matching (dinâmico)
import { getBestTutorMatches } from '../functions/BestFitTutors'

//---------------- PERGUNTAS ---------------------
const questions = [
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

//---------------- COMPONENTE PRINCIPAL -----------------
export const StudentQuestionnaire = () => {

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [matchedTutors, setMatchedTutors] = useState<any[]>([])
  const navigate = useNavigate()

  // ID único para esta sessão
  const sessionIdRef = useRef(uuidv4())

  //---------------- FUNÇÃO PARA GUARDAR RESPOSTAS -----------------
  const saveAnswersToSupabase = async (answers) => {
    const payload = {
      session_id: sessionIdRef.current,
      question_1: answers.question_1_answer || null,
      question_2: answers.question_2_answer || null,
    }

    const { error } = await supabase
      .from('temp_students')
      .insert([payload])

    if (error) console.error("Erro supabase:", error)
  }

  //---------------- FUNÇÃO PARA GUARDAR RESPOSTA E AVANÇAR -----------------
  const handleAnswer = async (questionId: number, answer: string) => {
    const updatedAnswers = {
      ...answers,
      [`question_${questionId}_answer`]: answer
    }

    setAnswers(updatedAnswers)

    const isLastQuestion = currentQuestion === questions.length - 1

    if (isLastQuestion) {
      // 1. Guardar respostas no supabase
      await saveAnswersToSupabase(updatedAnswers)

      // 2. Obter os tutores com maior compatibilidade
      const topMatches = await getBestTutorMatches(sessionIdRef.current)

      // 3. Buscar dados completos dos tutores
      const tutorIds = topMatches.map(t => t.tutorId)

      const { data: tutorsData, error } = await supabase
        .from("tutors")
        .select("*")
        .in("id", tutorIds)

      if (error) console.error(error)

      // 4. Criar estrutura final ordenada pela compatibilidade
      const finalTutors = topMatches.map(match => ({
        ...match,
        ...tutorsData.find(t => t.id === match.tutorId)
      }))

      setMatchedTutors(finalTutors)

      // 5. Mostrar resultados
      setShowResults(true)
    } else {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  //---------------- FUNÇÃO PARA CONTACTAR TUTOR -----------------
  const handleContactTutor = (email: string, tutorName: string) => {
    const subject = encodeURIComponent(`Interessado em explicações - Plastudo`)
    const body = encodeURIComponent(
      `Olá ${tutorName},\n\nEncontrei o seu perfil na Plastudo e estou interessado(a) nas suas explicações.\n\nPodemos conversar sobre disponibilidade e condições?\n\nObrigado(a)!`
    )
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  //---------------- FUNÇÃO PARA VOLTAR ATRÁS -----------------
  const goBack = () => {
    if (showResults) {
      setShowResults(false)
      setCurrentQuestion(questions.length - 1)
    } else if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  //---------------- SEÇÃO DE RESULTADOS -----------------
  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Os seus matches perfeitos!</h2>
            <p className="text-lg text-gray-600 mb-6">
              Baseado nas suas respostas, encontrámos estes explicadores ideais para si.
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
                    <img src={tutor.profile_picture} alt={tutor.name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{tutor.name}</h3>
                    <p className="text-green-600 font-medium mb-2">{tutor.subject}</p>
                    <div className="flex items-center justify-center space-x-1 mb-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {tutor.rating || "—"}
                      </span>
                    </div>

                    {/* Compatibilidade */}
                    <p className="text-blue-600 font-semibold text-sm">
                      Compatibilidade: {tutor.compatibility}%
                    </p>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{tutor.bio}</p>

                  <div className="space-y-2">
                    <Button onClick={() => navigate(`/profile/${tutor.tutorId}`)} variant="outline" className="w-full">Ver perfil completo</Button>
                    <Button onClick={() => handleContactTutor(tutor.email, tutor.name)} className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                      <Mail className="h-4 w-4 mr-2" /> Contactar
                    </Button>
                  </div>

                </Card>
              </motion.div>
            ))}

          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center">
            <p className="text-gray-600 mb-4">Quer ver mais opções?</p>
            <Button onClick={() => navigate('/marketplace')} size="lg" variant="outline" className="border-yellow-400 text-yellow-600 hover:bg-yellow-50">
              Explorar todos os explicadores
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  //---------------- QUESTIONÁRIO -----------------
  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="bg-white rounded-full h-3 overflow-hidden shadow-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-green-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">Pergunta {currentQuestion + 1} de {questions.length}</p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={currentQuestion} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
            <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{question.title}</h2>
              <div className="space-y-4">
                {question.options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleAnswer(question.id, option.value)}
                    className="w-full p-4 text-left border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg text-gray-700 group-hover:text-blue-700">{option.label}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={goBack} disabled={currentQuestion === 0} className="flex items-center space-x-2">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </Button>

                <div className="text-sm text-gray-500">
                  {answers[`question_${question.id}_answer`] && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Check className="h-4 w-4" />
                      <span>Respondido</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

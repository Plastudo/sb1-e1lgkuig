//-----------------TUTOR QUESTIONNAIRE-----------------
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { supabase } from '../lib/supabase'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { AuthModal } from './AuthModal'
import { BookOpen, GraduationCap, User, Building } from 'lucide-react'

//-----------------ARRAY DE PERGUNTAS-----------------
const questions = [
  { 
    id: 1,
    type: 'cards',
    title: 'Como vais dar explicações?',
    options: [
      { value: 'individual', label: 'Individual', icon: User },
      { value: 'grupo', label: 'Centro de estudos / grupo', icon: Building }
    ]
  },
  {
    id: 2,
    type: 'cards-with-other',
    title: 'Nível Académico',
    subtitle: 'Qual é o teu nível académico mais alto concluído?',
    icon: GraduationCap,
    options: [
      { value: 'Licenciatura', label: 'Licenciatura' },
      { value: 'Mestrado', label: 'Mestrado' },
      { value: 'Doutoramento', label: 'Doutoramento' },
      { value: 'Outro', label: 'Outro (especificar)' }
    ]
  }
]

//-----------------COMPONENTE PRINCIPAL-----------------
export const TutorQuestionnaire = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [sessionId] = useState(() => crypto.randomUUID())
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()

  //-----------------HANDLE ANSWER-----------------
  const handleAnswer = async (questionId: number, answer: string) => {
    const newAnswers = { ...answers, [`question_${questionId}_answer`]: answer }
    setAnswers(newAnswers)

    // Salvar dados temporários
    try {
      await supabase.from('temp_tutores').upsert(
        { session_id: sessionId, ...newAnswers },
        { onConflict: 'session_id' }
      )
    } catch (error) {
      console.warn('Erro ao salvar temporário:', error)
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      setShowAuth(true)
    }
  }

  //-----------------HANDLE REGISTRATION COMPLETE-----------------
  const handleRegistrationComplete = async (userId: string) => {
    try {
      // Pega dados temporários
      const { data: tempData, error } = await supabase
        .from('temp_tutores')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (error || !tempData) throw error

      // Pega info do usuário logado
      const { data: { user } } = await supabase.auth.getUser()

      // Monta dados para a tabela permanente
      const tutorData = {
        user_id: userId,
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        question_1_answer: tempData.question_1_answer || null,
        question_2_answer: tempData.question_2_answer || null,
        bio: '',
        subjects: [],
        profile_picture: ''
      }

      await supabase.from('tutores').insert(tutorData)
      await supabase.from('temp_tutores').delete().eq('session_id', sessionId)

      navigate('/profile')
    } catch (error) {
      console.error('Erro ao completar registo:', error)
    }
  }

  //-----------------GO BACK-----------------
  const goBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  //-----------------RENDER STEP CONTENT-----------------
  const renderStepContent = () => {
    const question = questions[currentStep]

    switch (question.type) {
      case 'cards':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">{question.title}</h2>
            </div>

            <div className="grid gap-4">
              {question.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(question.id, option.value)}
                  className={`p-4 rounded-xl border-2 text-left ${
                    answers[`question_${question.id}_answer`] === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )

      case 'cards-with-other':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-blue-500" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.subtitle && <p className="text-gray-600">{question.subtitle}</p>}
            </div>

            <div className="grid gap-3">
              {question.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(question.id, option.value)}
                  className={`p-4 rounded-lg border-2 text-left ${
                    answers[`question_${question.id}_answer`] === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {answers[`question_${question.id}_answer`] === 'Outro' && (
              <input
                type="text"
                placeholder="Especifica o teu nível académico"
                value={answers[`question_${question.id}_other`] || ''}
                onChange={(e) =>
                  setAnswers(prev => ({
                    ...prev,
                    [`question_${question.id}_other`]: e.target.value
                  }))
                }
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              />
            )}
          </div>
        )

      default:
        return null
    }
  }

  //-----------------RENDER COMPONENT-----------------
  if (showAuth) {
    return (
      <AuthModal
        onComplete={handleRegistrationComplete}
        title="Complete o seu registo"
        subtitle="Crie a sua conta para finalizar o seu perfil de explicador"
      />
    )
  }

  const question = questions[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4">

        {/* Barra de progresso */}
        <motion.div className="mb-8">
          <div className="bg-white rounded-full h-3 overflow-hidden shadow-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-green-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Pergunta {currentStep + 1} de {questions.length}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 shadow-xl bg-white/80 backdrop-blur-sm">
              {renderStepContent()}

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={goBack} disabled={currentStep === 0}>
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                {answers[`question_${question.id}_answer`] && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span>Respondido</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  )
}

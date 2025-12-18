//-----------------TUTOR QUESTIONNAIRE REFATORADO COM RENDERSTEPCONTENT-----------------
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { supabase } from '../lib/supabase'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { AuthModal } from './AuthModal'
import { BookOpen, GraduationCap, User, Building } from 'lucide-react'

// ----------------- ARRAY DE PERGUNTAS -----------------
const questions = [
  { 
    id: 1,
    type: 'cards',
    title: 'Como vais dar explicações?',
    options: [
      { value: 'individual', label: 'Individual', desc: 'Aulas particulares para um aluno', icon: User },
      { value: 'grupo', label: 'Centro de estudos / grupo', desc: 'Explicações em grupo ou num centro de estudos', icon: Building }
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

export const TutorQuestionnaire = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [sessionId] = useState(() => crypto.randomUUID())
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()

  //-----------------FUNÇÃO DE RESPOSTA-----------------
  const handleAnswer = async (questionId, answer) => {
    const newAnswers = { ...answers, [`question_${questionId}_answer`]: answer }
    setAnswers(newAnswers)

    // Salvar dados temporários no Supabase
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
        const tempData = { session_id: sessionId, ...newAnswers }
        await supabase.from('temp_tutores').upsert(tempData, { onConflict: 'session_id' })
      }
    } catch (error) {
      console.warn('Erro ao guardar dados temporários:', error)
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      setShowAuth(true)
    }
  }

  //-----------------FUNÇÃO DE REGISTRO FINAL-----------------
 const tutorData = {
  user_id: userId,
  name: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
  email: user?.email || '',
  answers: Object.fromEntries(
    Object.entries(tempData).filter(([key]) =>
      key.startsWith('question_')
    )
  ),
  bio: '',
  subjects: [],
  profile_picture: ''
}

  //-----------------FUNÇÃO DE VOLTAR-----------------
  const goBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  //-----------------FUNÇÃO RENDER STEP CONTENT-----------------
  const renderStepContent = () => {
  const question = questions[currentStep]

  switch (question.type) {
    // ----------------- Pergunta 3 -----------------
    case 'cards':
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {question.title}
            </h2>
            {question.subtitle && (
              <p className="text-gray-600">{question.subtitle}</p>
            )}
          </div>

          <div className="grid gap-4">
            {question.options.map(option => (
              <button
                key={option.value}
                onClick={() => handleAnswer(question.id, option.value)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  answers[`question_${question.id}_answer`] === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )

    // ----------------- Pergunta 4 -----------------
    case 'cards-with-other':
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            {question.icon && (
              <question.icon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            )}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {question.title}
            </h2>
            {question.subtitle && (
              <p className="text-gray-600">{question.subtitle}</p>
            )}
          </div>

          <div className="grid gap-3">
            {question.options.map(option => (
              <button
                key={option.value}
                onClick={() => handleAnswer(question.id, option.value)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  answers[`question_${question.id}_answer`] === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
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
  //-----------------RENDER COMPONENTE-----------------
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Barra de progresso */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="bg-white rounded-full h-3 overflow-hidden shadow-sm">
            <motion.div className="h-full bg-gradient-to-r from-yellow-400 to-green-400" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Pergunta {currentStep + 1} de {questions.length}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
            <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">

              {renderStepContent(question)}

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={goBack} disabled={currentStep === 0} className="flex items-center space-x-2">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Anterior</span>
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

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
    title: 'Qual é a sua área principal de expertise?',
    options: [
      { value: 'matematica', label: 'Matemática e Ciências Exatas', desc: 'Álgebra, cálculo, física, química, etc.', icon: BookOpen },
      { value: 'linguas', label: 'Línguas e Literatura', desc: 'Português, Inglês, Francês, Espanhol, etc.', icon: BookOpen },
      { value: 'ciencias', label: 'Ciências Naturais e Biologia', desc: 'Biologia, geologia, ciências naturais', icon: BookOpen },
      { value: 'humanas', label: 'Ciências Humanas e Sociais', desc: 'História, filosofia, geografia, sociologia', icon: BookOpen }
    ]
  },
  {
    id: 2,
    type: 'cards',
    title: 'Qual é o seu nível de experiência a ensinar?',
    options: [
      { value: 'iniciante', label: 'Iniciante', desc: 'Ainda estou a começar a dar explicações', icon: GraduationCap },
      { value: 'intermedio', label: 'Intermédio', desc: 'Já tenho alguma experiência com alunos', icon: GraduationCap },
      { value: 'avancado', label: 'Avançado', desc: 'Dou explicações regularmente há vários anos', icon: GraduationCap }
    ]
  },
  {
    id: 3,
    type: 'cards',
    title: 'Como vais dar explicações?',
    options: [
      { value: 'individual', label: 'Individual', desc: 'Aulas particulares para um aluno', icon: User },
      { value: 'grupo', label: 'Centro de estudos / grupo', desc: 'Explicações em grupo ou num centro de estudos', icon: Building }
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
  const handleRegistrationComplete = async (userId) => {
    try {
      const { data: tempData, error } = await supabase.from('temp_tutores').select('*').eq('session_id', sessionId).single()
      if (error || !tempData) throw error

      const { data: { user } } = await supabase.auth.getUser()
      const tutorData = {
        user_id: userId,
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        ...Object.fromEntries(Object.entries(tempData).filter(([key]) => key.startsWith('question_'))),
        bio: '',
        subjects: [],
        profile_picture: ''
      }

      await supabase.from('tutores').insert(tutorData)
      await supabase.from('temp_tutores').delete().eq('session_id', sessionId)
      navigate('/profile')
    } catch (error) {
      console.error('Erro ao finalizar registo:', error)
    }
  }

  //-----------------FUNÇÃO DE VOLTAR-----------------
  const goBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  //-----------------FUNÇÃO RENDER STEP CONTENT-----------------
  const renderStepContent = (question) => {
    switch (question.type) {
      case 'cards':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{question.title}</h2>
              {question.subtitle && <p className="text-gray-600">{question.subtitle}</p>}
            </div>

            <div className="grid gap-4">
              {question.options.map(option => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(question.id, option.value)}
                    className={`p-6 rounded-xl border-2 flex items-center space-x-4 transition-all duration-200 ${answers[`question_${question.id}_answer`] === option.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    {Icon && <Icon className="w-8 h-8" />}
                    <div>
                      <div className="font-semibold">{option.label}</div>
                      {option.desc && <div className="text-sm text-gray-500 mt-1">{option.desc}</div>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">{question.title}</h2>
            <textarea
              className="w-full p-4 border rounded-xl"
              rows={5}
              value={answers[`question_${question.id}_answer`] || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
            />
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

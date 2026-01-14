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
import { Calendar, Monitor, Home, Target, MapPin } from 'lucide-react'


// -----------------QUESTION TYPES-----------------
type CardsQuestion = {
  id: number
  type: 'cards'
  title: string
  subtitle?: string
  icon?: any
  options: {
    value: string
    label: string
    icon?: any
  }[]
}


type CardsWithOtherQuestion = {
  id: number
  type: 'cards-with-other'
  title: string
  subtitle?: string
  icon?: any
  options: {
    value: string
    label: string
  }[]
}

type YesNoWithExtraQuestion = {
  id: number
  type: 'yes-no-with-extra'
  title: string
  subtitle?: string
  extraLabel: string
}

type CardsMultipleQuestion = {
  id: number
  type: 'cards-multiple'
  title: string
  subtitle?: string
  icon?: any
  options: {
    value: string
    label: string
  }[]
}

type AvailabilityGridQuestion = {
  id: number
  type: 'availability-grid'
  title: string
  subtitle?: string
  icon?: any
}

type SingleChoiceCardsQuestion = {
  id: number
  type: 'single-choice-cards'
  title: string
  subtitle?: string
  icon?: any
  options: {
    value: string
    label: string
    description?: string
    icon?: any
  }[]
}

type ConditionalQuestion = {
  id: number
  type: 'conditional'
  dependsOn: string
  conditions: {
    value: string
    question: Question
  }[]
}

type Question =
  | CardsQuestion
  | CardsWithOtherQuestion
  | YesNoWithExtraQuestion
  | CardsMultipleQuestion
  | AvailabilityGridQuestion
  | SingleChoiceCardsQuestion
  | ConditionalQuestion

//-----------------SUPABASE DEBUG HELPERS-----------------
const logSupabase = (step: string, payload: any) => {
  console.group(`[SUPABASE][${step}]`)
  console.log('Timestamp:', new Date().toISOString())
  console.log('Payload:', payload)
  console.groupEnd()
}

const logSupabaseError = (step: string, error: any) => {
  console.group(`[SUPABASE ERROR][${step}]`)
  console.error('Timestamp:', new Date().toISOString())
  console.error('Error object:', error)
  console.error('Message:', error?.message)
  console.error('Details:', error?.details)
  console.error('Hint:', error?.hint)
  console.groupEnd()
}

const distritos: string[] = [
  'Aveiro',
  'Beja',
  'Braga',
  'Bragança',
  'Castelo Branco',
  'Coimbra',
  'Évora',
  'Faro',
  'Guarda',
  'Leiria',
  'Lisboa',
  'Portalegre',
  'Porto',
  'Santarém',
  'Setúbal',
  'Viana do Castelo',
  'Vila Real',
  'Viseu'
]


//-----------------ARRAY DE PERGUNTAS-----------------
const questions: Question[] = [
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
  },
  {
    id: 3,
    type: 'yes-no-with-extra',
    title: 'Experiência como explicador',
    subtitle: 'Tens experiência anterior a dar explicações?',
    extraLabel: 'Quantos anos de experiência tens?'
  },
  {
    id: 4,
    type: 'cards-multiple',
    title: 'Níveis de Ensino',
    subtitle: 'Quais os níveis de ensino que podes lecionar? (Podes escolher várias)',
    icon: BookOpen,
    options: [
      { value: 'Ensino Básico (1º ciclo)', label: 'Ensino Básico (1º ciclo)' },
      { value: 'Ensino Básico (2º ciclo)', label: 'Ensino Básico (2º ciclo)' },
      { value: 'Ensino Básico (3º ciclo)', label: 'Ensino Básico (3º ciclo)' },
      { value: 'Ensino Secundário', label: 'Ensino Secundário' },
      { value: 'Ensino Superior', label: 'Ensino Superior' },
      { value: 'Cursos profissionais', label: 'Cursos profissionais' },
      { value: 'Outros', label: 'Outros' }
    ]
  },
  {
  id: 5,
  type: 'cards-multiple',
  title: 'Disciplinas',
  subtitle: 'Que disciplinas podes ensinar? (Podes escolher várias)',
  icon: BookOpen,
  options: [
    { value: 'Português', label: 'Português' },
    { value: 'Matemática', label: 'Matemática' },
    { value: 'Física', label: 'Física' },
    { value: 'Química', label: 'Química' },
    { value: 'Biologia', label: 'Biologia' },
    { value: 'História', label: 'História' },
    { value: 'Geografia', label: 'Geografia' },
    { value: 'Inglês', label: 'Inglês' },
    { value: 'Francês', label: 'Francês' },
    { value: 'Espanhol', label: 'Espanhol' },
    { value: 'Economia', label: 'Economia' },
    { value: 'Informática', label: 'Informática' },
    { value: 'Outras', label: 'Outras' }
  ]
},
{
  id: 6,
  type: 'cards',
  title: 'Quantas horas por semana tens disponibilidade para dar explicações?',
  options: [
    { value: '1-5', label: '1 a 5 horas' },
    { value: '6-10', label: '6 a 10 horas' },
    { value: '11-20', label: '11 a 20 horas' },
    { value: '21-30', label: '21 a 30 horas' },
    { value: '30+', label: 'Mais de 30 horas' }
  ]
},
{
  id: 7,
  type: 'cards',
  title: 'Qual é o valor que pretendes cobrar por hora?',
  subtitle: 'Valor indicativo (podes alterar mais tarde)',
  options: [
    { value: '5-10', label: '5€ – 10€ / hora' },
    { value: '10-15', label: '10€ – 15€ / hora' },
    { value: '15-20', label: '15€ – 20€ / hora' },
    { value: '20-30', label: '20€ – 30€ / hora' },
    { value: '30+', label: 'Mais de 30€ / hora' }
  ]
},
{
  id: 8,
  type: 'availability-grid',
  title: 'Disponibilidade',
  subtitle: 'Qual o horário disponível para as explicações?',
  icon: Calendar
},
{
  id: 9,
  type: 'single-choice-cards',
  title: 'Tipo de Explicação',
  subtitle: 'As explicações serão presenciais ou online?',
  icon: Monitor,
  options: [
    {
      value: 'presencial',
      label: 'Presencial',
      description: 'Na tua casa ou local combinado',
      icon: Home
    },
    {
      value: 'centro-estudo',
      label: 'Centro de Estudo',
      description: 'Numa instalação dedicada ao estudo',
      icon: Building
    },
    {
      value: 'online',
      label: 'Online',
      description: 'Sessões virtuais por videochamada',
      icon: Monitor
    },
    {
      value: 'indiferente',
      label: 'Indiferente',
      description: 'Qualquer formato serve',
      icon: Target
    }
  ]
},
{
  id: 10,
  type: 'conditional',
  dependsOn: 'question_7_answer',
  conditions: [
    {
  value: 'presencial',
  question: {
    id: 10,
    type: 'cards',
    title: 'Distrito',
    icon: MapPin,
    options: distritos.map((d: string) => ({
      value: d,
      label: d
    }))
  }
},
    {
      value: 'online',
      question: {
        id: 10,
        type: 'cards',
        title: 'Plataforma',
        icon: Monitor,
        options: [
          'Zoom',
          'Google Meet',
          'Microsoft Teams',
          'Skype',
          'Discord',
          'Sem preferência',
          'Outra'
        ].map(p => ({ value: p, label: p }))
      }
    },
    {
      value: 'centro-estudo',
      question: {
        id: 10,
        type: 'cards-with-other',
        title: 'Centro de Estudo',
        subtitle: 'Tens preferência por algum centro ou zona?',
        icon: Building,
        options: [{ value: 'Outro', label: 'Outro (especificar)' }]
      }
    }
  ]
},
{
  id: 11,
  type: 'conditional',
  dependsOn: 'question_7_answer',
  conditions: [
    {
      value: 'presencial',
      question: {
        id: 11,
        type: 'cards',
        title: 'Município',
        icon: MapPin,
        options: [] // preenchido dinamicamente pelo distrito escolhido
      }
    }
  ]
},
{
  id: 12,
  type: 'conditional',
  dependsOn: 'question_7_answer',
  conditions: [
    {
      value: 'presencial',
      question: {
        id: 102,
        type: 'cards',
        title: 'Freguesia',
        icon: MapPin,
        options: [] // preenchido dinamicamente pelo município
      }
    }
  ]
}

]

//-----------------COMPONENTE PRINCIPAL-----------------
export const TutorQuestionnaire = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: any }>({})
  const [sessionId] = useState(() => crypto.randomUUID())
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()

  //-----------------HANDLE ANSWER-----------------
  const handleAnswer = async (questionId: number, answer: any) => {
    const newAnswers = {
      ...answers,
      [`question_${questionId}_answer`]: answer
    }
    setAnswers(newAnswers)

    try {
      logSupabase('UPSERT temp_tutores - START', { session_id: sessionId, ...newAnswers })
      const { data, error } = await supabase
        .from('temp_tutores')
        .upsert({ session_id: sessionId, ...newAnswers }, { onConflict: 'session_id' })
      if (error) throw error
      logSupabase('UPSERT temp_tutores - SUCCESS', data)
    } catch (error) {
      console.warn('⚠️ Erro ao salvar temporário:', error)
    }
  }

  //-----------------HANDLE REGISTRATION COMPLETE-----------------
  const handleRegistrationComplete = async (userId: string) => {
    try {
      const { data: tempData, error: tempError } = await supabase
        .from('temp_tutores')
        .select('*')
        .eq('session_id', sessionId)
        .single()
      if (tempError) throw tempError

      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      const user = authData?.user

      const tutorData = {
        user_id: userId,
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        question_1_answer: tempData?.question_1_answer || null,
        question_2_answer: tempData?.question_2_answer || null,
        bio: '',
        subjects: [],
        profile_picture: ''
      }

      const { data: insertData, error: insertError } = await supabase
        .from('tutores')
        .insert(tutorData)
      if (insertError) throw insertError

      await supabase.from('temp_tutores').delete().eq('session_id', sessionId)

      navigate('/profile')
    } catch (error) {
      console.error('❌ ERRO AO COMPLETAR REGISTO', error)
    }
  }

  //-----------------GO BACK-----------------
  const goBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }
//-----------------ReNDER QUESTION CONTENT-----------------
  const renderQuestionContent = (question: Question): React.ReactNode => {
  if (question.type === 'conditional') {
    // encontra a condição que corresponde à resposta anterior
    const parentAnswerKey = `question_${question.dependsOn}_answer`
    const parentAnswer = answers[parentAnswerKey]

    const condition = question.conditions.find(c => c.value === parentAnswer)
    if (!condition) return null

    // chama recursivamente para renderizar a pergunta dentro da condicional
    return renderQuestionContent(condition.question)
  }

  // se não for condicional, retorna o conteúdo normal
  return renderStepContent(condition.question)
}
  //-----------------RENDER STEP CONTENT-----------------
 const renderStepContent = (question: Question) => {
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
              onChange={e =>
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

    case 'yes-no-with-extra':
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">{question.title}</h2>
            {question.subtitle && <p className="text-gray-600">{question.subtitle}</p>}
          </div>

          <div className="grid gap-3">
            {['Sim', 'Não'].map(option => (
              <button
                key={option}
                onClick={() => handleAnswer(question.id, option)}
                className={`p-4 rounded-lg border-2 text-left ${
                  answers[`question_${question.id}_answer`] === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {answers[`question_${question.id}_answer`] === 'Sim' && (
            <input
              type="number"
              min={0}
              placeholder={question.extraLabel}
              value={answers[`question_${question.id}_extra`] || ''}
              onChange={e =>
                setAnswers(prev => ({
                  ...prev,
                  [`question_${question.id}_extra`]: e.target.value
                }))
              }
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
            />
          )}
        </div>
      )

    case 'cards-multiple':
      const selectedValues: string[] = Array.isArray(answers[`question_${question.id}_answer`])
        ? answers[`question_${question.id}_answer`]
        : []

      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-purple-500" />}
            <h2 className="text-2xl font-bold">{question.title}</h2>
            {question.subtitle && <p className="text-gray-600">{question.subtitle}</p>}
          </div>

          <div className="grid gap-3">
            {question.options.map(option => {
              const isSelected = selectedValues.includes(option.value)
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    const newValues = isSelected
                      ? selectedValues.filter(v => v !== option.value)
                      : [...selectedValues, option.value]
                    handleAnswer(question.id, newValues)
                  }}
                  className={`p-4 rounded-lg border-2 text-left flex justify-between items-center ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-5 h-5 text-purple-600" />}
                </button>
              )
            })}
          </div>
        </div>
      )

    case 'availability-grid':
      const availabilitySelected = Object.values(answers[`question_${question.id}_answer`] || {}).some(v => v)

      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-green-500" />}
            <h2 className="text-2xl font-bold">{question.title}</h2>
            {question.subtitle && <p className="text-gray-600">{question.subtitle}</p>}
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
              <div key={day}>
                <p className="font-semibold mb-1">{day}</p>
                <div className="grid grid-rows-3 gap-1">
                  {['Manhã', 'Tarde', 'Noite'].map(slot => {
                    const key = `${day}_${slot}`
                    const selected = answers[`question_${question.id}_answer`] || {}
                    const isSelected = selected[key]

                    return (
                      <button
                        key={slot}
                        onClick={() => handleAnswer(question.id, { ...selected, [key]: !isSelected })}
                        className={`border p-2 rounded-lg w-full text-sm ${
                          isSelected ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-8">
            <Button
              onClick={() => {
                if (currentStep < questions.length - 1) {
                  setCurrentStep(prev => prev + 1)
                } else {
                  setShowAuth(true)
                }
              }}
              disabled={!availabilitySelected} // botão habilitado se houver seleção
            >
              Seguinte
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )

      case 'single-choice-cards':
  const selectedValue: string = answers[`question_${question.id}_answer`] || ''

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-blue-500" />}
        <h2 className="text-2xl font-bold">{question.title}</h2>
        {question.subtitle && <p className="text-gray-600">{question.subtitle}</p>}
      </div>

      <div className="grid gap-3">
        {question.options.map(option => {
          const isSelected = selectedValue === option.value
          return (
            <button
              key={option.value}
              onClick={() => handleAnswer(question.id, option.value)}
              className={`p-4 rounded-lg border-2 text-left flex flex-col items-start ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{option.label}</span>
              {option.description && <span className="text-gray-500 text-sm">{option.description}</span>}
            </button>
          )
        })}
      </div>
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
  const currentAnswer = answers[`question_${question.id}_answer`]

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4">
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
              {renderQuestionContent(questions[currentStep])}

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={goBack} disabled={currentStep === 0}>
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <Button
                  onClick={() => {
                    if (currentStep < questions.length - 1) {
                      setCurrentStep(prev => prev + 1)
                    } else {
                      setShowAuth(true)
                    }
                  }}
                  disabled={
                    currentAnswer === undefined ||
                    (Array.isArray(currentAnswer) && currentAnswer.length === 0)
                  }
                >
                  Seguinte
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

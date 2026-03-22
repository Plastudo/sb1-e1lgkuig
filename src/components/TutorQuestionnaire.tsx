//-----------------TUTOR QUESTIONNAIRE-----------------
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { supabase } from '../lib/supabase'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { AuthModal } from './AuthModal'
import { BookOpen, GraduationCap, User, Building, Gamepad, Info } from 'lucide-react'
import { Calendar, Monitor, Home, Target, MapPin } from 'lucide-react'
import { GripVertical } from 'lucide-react'
import { getDistritos, getMunicipiosByDistrito, getFreguesiasByMunicipio } from '../data/locationMap'
type CardsQuestion = {
  id: number
  type: 'cards'
  title: string
  subtitle?: string
  tooltip?: string
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
  tooltip?: string
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
  tooltip?: string
  extraLabel: string
}

type CardsMultipleQuestion = {
  id: number
  type: 'cards-multiple'
  title: string
  subtitle?: string
  tooltip?: string
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
  tooltip?: string
  icon?: any
}

type SingleChoiceCardsQuestion = {
  id: number
  type: 'single-choice-cards'
  title: string
  subtitle?: string
  tooltip?: string
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
  dependsOn: number
  conditions: {
    value: string
    question: Question
  }[]
}

type PriorityListQuestion = {
  id: number
  type: 'priority-list'
  title: string
  subtitle?: string
  tooltip?: string
  icon?: any
  options: { value: string; label: string }[]
}

type Question =
  | CardsQuestion
  | CardsWithOtherQuestion
  | YesNoWithExtraQuestion
  | CardsMultipleQuestion
  | AvailabilityGridQuestion
  | SingleChoiceCardsQuestion
  | ConditionalQuestion
  | PriorityListQuestion
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
    tooltip: "caso queiras dar a várias disciplinas e alunos diz a soma das horas totais semanais",
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
      { value: 'presencial', label: 'Presencial', description: 'Na tua casa ou local combinado', icon: Home },
      { value: 'centro-estudo', label: 'Centro de Estudo', description: 'Numa instalação dedicada ao estudo', icon: Building },
      { value: 'online', label: 'Online', description: 'Sessões virtuais por videochamada', icon: Monitor },
      { value: 'indiferente', label: 'Indiferente', description: 'Qualquer formato serve', icon: Target }
    ]
  },
  {
    id: 10,
    type: 'conditional',
    dependsOn: 9,
    conditions: [
      {
        value: 'presencial',
        question: {
          id: 10,
          type: 'cards',
          title: 'Distrito',
          icon: MapPin,
          options: getDistritos().map(d => ({ value: d, label: d }))
        }
      },
      {
        value: 'online',
        question: {
          id: 102,
          type: 'cards',
          title: 'Plataforma',
          icon: Monitor,
          options: [
            'Zoom', 'Google Meet', 'Microsoft Teams', 'Skype', 'Discord', 'Sem preferência', 'Outra'
          ].map(p => ({ value: p, label: p }))
        }
      },
      {
        value: 'centro-estudo',
        question: {
          id: 103,
          type: 'cards-with-other',
          title: 'Centro de Estudo',
          subtitle: 'Tens preferência por algum centro ou zona?',
          icon: Building,
          options: [{ value: 'Outro', label: 'Outro (especificar)' }]
        }
      }
    ]
  },
  
// Município (dependente do Distrito)
{
  id: 11,
  type: 'conditional',
  dependsOn: 10, // agora depende do Distrito correto
  conditions: [
    {
      value: '', // genérico
      question: {
        id: 11,
        type: 'cards',
        title: 'Município',
        icon: MapPin,
        options: [] // será preenchido dinamicamente
      }
    }
  ]
},

// Freguesia (dependente do Município)
{
  id: 12,
  type: 'conditional',
  dependsOn: 11, // agora depende do Município correto
  conditions: [
    {
      value: '', // genérico
      question: {
        id: 12,
        type: 'cards',
        title: 'Freguesia',
        icon: MapPin,
        options: [] // será preenchido dinamicamente
      }
    }
  ]
},
  {
    id: 15,
    type: 'cards-multiple',
    title: 'Abordagem de Ensino',
    subtitle: 'Que tipo de abordagem usas nas tuas explicações?',
    icon: Target,
    options: [
      { value: 'Explicações práticas', label: 'Explicações práticas' },
      { value: 'Uso de material visual', label: 'Uso de material visual' },
      { value: 'Aulas expositivas', label: 'Aulas expositivas' },
      { value: 'Exercícios guiados', label: 'Exercícios guiados' },
      { value: 'Aulas interativas', label: 'Aulas interativas' },
      { value: 'Preparação intensiva para exames', label: 'Preparação intensiva para exames' }
    ]
  },
  {
    id: 16,
    type: 'cards-multiple',
    title: 'Hobbies',
    subtitle: 'Quais são as tuas áreas de interesse/hobbies?',
    icon: Gamepad,
    options: [
      { value: 'Jogos', label: 'Jogos' },
      { value: 'Desporto', label: 'Desporto' },
      { value: 'Música', label: 'Música' },
      { value: 'Leitura', label: 'Leitura' },
      { value: 'Cinema', label: 'Cinema' },
      { value: 'Outros', label: 'Outros' }
    ]
  },
  {
    id: 17,
    type: 'cards-multiple',
    title: 'Necessidades Especiais / Perfil do Aluno',
    subtitle: 'A que tipo de aluno estás confortável a dar aulas? (Podes escolher várias)',
    icon: Target,
    options: [
      { value: 'Excelente aluno', label: 'Excelente aluno' },
      { value: 'Aluno mediano', label: 'Aluno mediano' },
      { value: 'Dificuldades de aprendizagem', label: 'Dificuldades de aprendizagem' },
      { value: 'TDAH (Défice de atenção)', label: 'TDAH (Défice de atenção)' },
      { value: 'Autismo / Asperger', label: 'Autismo / Asperger' },
      { value: 'Outros', label: 'Outros' }
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
        .upsert({ 
          session_id: sessionId, 
          question_1_answer: newAnswers['question_1_answer'] || '',
          raw_answers: newAnswers 
        }, { onConflict: 'session_id' })
      if (error) throw error
      logSupabase('UPSERT temp_tutores - SUCCESS', data)
    } catch (error) {
      console.warn('⚠️ Erro ao salvar temporário:', error)
    }
  }

  //-----------------HANDLE REGISTRATION COMPLETE-----------------
  const handleRegistrationComplete = async (userId: string) => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user

      const rawAnswers = { ...answers }

      const tutorData = {
        user_id: userId,
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        question_1_answer: rawAnswers['question_1_answer'] || null,
        raw_answers: rawAnswers,
        subjects: rawAnswers['question_5_answer'] || [],
        hourly_rate: rawAnswers['question_7_answer'] || null,
        experience: rawAnswers['question_3_answer'] === 'Sim' ? `${rawAnswers['question_3_extra']} anos` : '-',
        education: rawAnswers['question_2_answer'] || null,
      }

      // Verifica se já existe registo para este user
      const { data: existing } = await supabase
        .from('tutores')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (existing?.id) {
        // Atualiza registo existente
        const { error } = await supabase
          .from('tutores')
          .update(tutorData)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        // Cria novo registo
        const { error } = await supabase
          .from('tutores')
          .insert({ ...tutorData, bio: '', profile_picture: '' })
        if (error) throw error
      }

      // Limpar temp_tutores em background
      supabase.from('temp_tutores').delete().eq('session_id', sessionId)

    } catch (error: any) {
      console.error('❌ ERRO AO COMPLETAR REGISTO', error)
      alert(`Erro ao guardar perfil: ${error?.message || error}`)
    } finally {
      navigate('/profile')
    }
  }

  //-----------------GO BACK-----------------
  const goBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }
//-----------------ReNDER QUESTION CONTENT (COM MUNICÍPIO/FREGUESIA DINÂMICO)-----------------
const renderQuestionContent = (question: Question): React.ReactNode => {
  if (question.type === 'conditional') {
    const cq = question as ConditionalQuestion
    const parentAnswerKey = `question_${cq.dependsOn}_answer`
    const parentAnswer = answers[parentAnswerKey]

    const condition =
  cq.conditions.find(c => c.value === parentAnswer) || cq.conditions[0]

    // Preenche dinamicamente opções de Município/Freguesia
  if ('options' in condition.question) {
  if (condition.question.id === 11) {
    const distritoSelecionado = answers['question_10_answer']
    condition.question.options = getMunicipiosByDistrito(distritoSelecionado).map(m => ({ value: m, label: m }))
  }

  if (condition.question.id === 12) {
    const municipioSelecionado = answers['question_11_answer']
    const distritoSelecionado = answers['question_10_answer']
    condition.question.options = getFreguesiasByMunicipio(distritoSelecionado, municipioSelecionado).map(f => ({ value: f, label: f }))
  }
}

    return renderQuestionContent(condition.question)
  }

  return renderStepContent(question)
}
  //-----------------RENDER STEP CONTENT-----------------
 const renderStepContent = (question: Question) => {
  switch (question.type) {
    case 'cards':
      return (
        <div className="space-y-6">
          <div className="text-center mb-8 flex flex-col items-center justify-center gap-2 relative">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.tooltip && (
                <div className="group relative flex items-center justify-center cursor-help">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-blue-50">?</div>
                  <div className="absolute bottom-full mb-3 hidden group-hover:block w-72 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-[100] transition-opacity duration-200 opacity-0 group-hover:opacity-100 left-1/2 -translate-x-1/2 text-center pointer-events-none break-words whitespace-normal leading-relaxed before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-t-gray-900 border border-gray-700">
                    {question.tooltip}
                  </div>
                </div>
              )}
            </div>
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
          <div className="text-center mb-8 relative">
            {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-blue-500" />}
            <h2 className="text-2xl font-bold inline-flex items-center gap-2">
              {question.title}
              {question.tooltip && (
                <div className="group relative inline-block cursor-help">
                  <Info className="w-5 h-5 text-blue-400 hover:text-blue-600 transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-slate-800 text-white text-sm rounded-lg p-3 shadow-lg z-50">
                    {question.tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              )}
            </h2>
            {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
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
          <div className="text-center mb-8 relative">
            <h2 className="text-2xl font-bold inline-flex items-center gap-2">
              {question.title}
              {question.tooltip && (
                <div className="group relative inline-block cursor-help">
                  <Info className="w-5 h-5 text-blue-400 hover:text-blue-600 transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-slate-800 text-white text-sm rounded-lg p-3 shadow-lg z-50">
                    {question.tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              )}
            </h2>
            {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
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
          <div className="text-center mb-8 relative">
            {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-purple-500" />}
            <h2 className="text-2xl font-bold inline-flex items-center gap-2">
              {question.title}
              {question.tooltip && (
                <div className="group relative flex items-center justify-center cursor-help">
                  <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold ring-2 ring-purple-50">?</div>
                  <div className="absolute bottom-full mb-3 hidden group-hover:block w-72 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-[100] transition-opacity duration-200 opacity-0 group-hover:opacity-100 left-1/2 -translate-x-1/2 text-center pointer-events-none break-words whitespace-normal leading-relaxed before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-t-gray-900 border border-gray-700">
                    {question.tooltip}
                  </div>
                </div>
              )}
            </h2>
            {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
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
      return (
        <div className="space-y-6">
          <div className="text-center mb-8 relative">
            {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-green-500" />}
            <h2 className="text-2xl font-bold inline-flex items-center gap-2">
              {question.title}
              {question.tooltip && (
                <div className="group relative flex items-center justify-center cursor-help">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold ring-2 ring-green-50">?</div>
                  <div className="absolute bottom-full mb-3 hidden group-hover:block w-72 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-[100] transition-opacity duration-200 opacity-0 group-hover:opacity-100 left-1/2 -translate-x-1/2 text-center pointer-events-none break-words whitespace-normal leading-relaxed before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-t-gray-900 border border-gray-700">
                    {question.tooltip}
                  </div>
                </div>
              )}
            </h2>
            {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
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
        </div>
      )

      case 'single-choice-cards':
  const selectedValue: string = answers[`question_${question.id}_answer`] || ''

  return (
    <div className="space-y-6">
      <div className="text-center mb-8 relative">
        {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-blue-500" />}
        <h2 className="text-2xl font-bold inline-flex items-center gap-2">
          {question.title}
          {question.tooltip && (
            <div className="group relative flex items-center justify-center cursor-help">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-blue-50">?</div>
              <div className="absolute bottom-full mb-3 hidden group-hover:block w-72 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-[100] transition-opacity duration-200 opacity-0 group-hover:opacity-100 left-1/2 -translate-x-1/2 text-center pointer-events-none break-words whitespace-normal leading-relaxed before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-t-gray-900 border border-gray-700">
                {question.tooltip}
              </div>
            </div>
          )}
        </h2>
        {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
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

  case 'priority-list':
  const prioridades: string[] =
    answers[`question_${question.id}_answer`] && Array.isArray(answers[`question_${question.id}_answer`])
      ? answers[`question_${question.id}_answer`]
      : question.options.map(opt => opt.value) // valor inicial

  const handlePriorityDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handlePriorityDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    const draggedIndex = Number(e.dataTransfer.getData('text/plain'))
    const newPrioridades = [...prioridades]
    const [movedItem] = newPrioridades.splice(draggedIndex, 1)
    newPrioridades.splice(index, 0, movedItem)
    handleAnswer(question.id, newPrioridades)
  }

  const handlePriorityDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8 relative">
        {question.icon && <question.icon className="w-12 h-12 text-emerald-500 mx-auto mb-4" />}
        <h2 className="text-2xl font-bold text-gray-800 mb-2 inline-flex items-center gap-2">
          {question.title}
          {question.tooltip && (
            <div className="group relative flex items-center justify-center cursor-help">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold ring-2 ring-emerald-50">?</div>
              <div className="absolute bottom-full mb-3 hidden group-hover:block w-72 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-[100] transition-opacity duration-200 opacity-0 group-hover:opacity-100 left-1/2 -translate-x-1/2 text-center pointer-events-none break-words whitespace-normal leading-relaxed before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-t-gray-900 border border-gray-700">
                {question.tooltip}
              </div>
            </div>
          )}
        </h2>
        {question.subtitle && <p className="text-gray-600">{question.subtitle}</p>}
      </div>

      <div className="space-y-2">
        {prioridades.map((item, index) => (
          <div
            key={item}
            draggable
            onDragStart={e => handlePriorityDragStart(e, index)}
            onDrop={e => handlePriorityDrop(e, index)}
            onDragOver={handlePriorityDragOver}
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
          >
            <GripVertical className="w-5 h-5 text-gray-400" />
            <span className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
              {index + 1}
            </span>
            <span className="font-medium text-gray-700">{item}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 Arrasta os itens para reordenar por prioridade (1 = mais importante)
        </p>
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
                  disabled={(() => {
                    // CORREÇÃO: Validação para perguntas condicionais
                    if (question.type === 'conditional') {
  const parentAnswerKey = `question_${question.dependsOn}_answer`
  const parentAnswer = answers[parentAnswerKey]

  if (!parentAnswer) return true

  const condition =
    question.conditions.find(c => c.value === parentAnswer) ||
    question.conditions[0]

  const subAnswer = answers[`question_${condition.question.id}_answer`]

  return (
    subAnswer === undefined ||
    (Array.isArray(subAnswer) && subAnswer.length === 0)
  )
}

                    
                    // Para perguntas normais, validação original
                    return currentAnswer === undefined || (Array.isArray(currentAnswer) && currentAnswer.length === 0)
                  })()}
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
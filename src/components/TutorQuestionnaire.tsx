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
import { Footer } from './Footer'
import { useAuth } from '../contexts/AuthContext'
type CardsQuestion = {
  id: number
  type: 'cards'
  title: string
  subtitle?: string
  tooltip?: string
  icon?: any
  skipIf?: (answers: Record<string, any>) => boolean
  options: { value: string; label: string; icon?: any }[]
}

type CardsWithOtherQuestion = {
  id: number
  type: 'cards-with-other'
  title: string
  subtitle?: string
  tooltip?: string
  icon?: any
  skipIf?: (answers: Record<string, any>) => boolean
  options: { value: string; label: string }[]
}

type YesNoWithExtraQuestion = {
  id: number
  type: 'yes-no-with-extra'
  title: string
  subtitle?: string
  tooltip?: string
  extraLabel: string
  skipIf?: (answers: Record<string, any>) => boolean
}

type CardsMultipleQuestion = {
  id: number
  type: 'cards-multiple'
  title: string
  subtitle?: string
  tooltip?: string
  icon?: any
  skipIf?: (answers: Record<string, any>) => boolean
  options: { value: string; label: string }[]
}

type AvailabilityGridQuestion = {
  id: number
  type: 'availability-grid'
  title: string
  subtitle?: string
  tooltip?: string
  icon?: any
  skipIf?: (answers: Record<string, any>) => boolean
}

type SingleChoiceCardsQuestion = {
  id: number
  type: 'single-choice-cards'
  title: string
  subtitle?: string
  tooltip?: string
  icon?: any
  skipIf?: (answers: Record<string, any>) => boolean
  options: { value: string; label: string; description?: string; icon?: any }[]
}

type TextInputQuestion = {
  id: number
  type: 'text-input'
  title: string
  subtitle?: string
  placeholder?: string
  icon?: any
  skipIf?: (answers: Record<string, any>) => boolean
}

type DynamicCardsQuestion = {
  id: number
  type: 'dynamic-cards'
  title: string
  subtitle?: string
  icon?: any
  skipIf?: (answers: Record<string, any>) => boolean
  getOptions: (answers: Record<string, any>) => { value: string; label: string }[]
}

type PriorityListQuestion = {
  id: number
  type: 'priority-list'
  title: string
  subtitle?: string
  tooltip?: string
  icon?: any
  skipIf?: (answers: Record<string, any>) => boolean
  options: { value: string; label: string }[]
}

type Question =
  | CardsQuestion
  | CardsWithOtherQuestion
  | YesNoWithExtraQuestion
  | CardsMultipleQuestion
  | AvailabilityGridQuestion
  | SingleChoiceCardsQuestion
  | TextInputQuestion
  | DynamicCardsQuestion
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
    tooltip: '10€–15€: normal para ensino primário e explicadores sem ou com pouca experiência.\n15€–20€: explicadores até ao ensino básico.\n25€–35€: normal para ensino secundário com pouca ou nenhuma experiência.\n35€–45€: explicadores com experiência no secundário ou superior.\n+45€: muita experiência ou professores do ensino secundário para cima.',
    options: [
      { value: '10-15', label: '10€ – 15€ / hora' },
      { value: '15-20', label: '15€ – 20€ / hora' },
      { value: '25-35', label: '25€ – 35€ / hora' },
      { value: '35-45', label: '35€ – 45€ / hora' },
      { value: '45+', label: 'Mais de 45€ / hora' }
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
  // Q10: Nome do centro de estudos (só aparece se Q9 = centro-estudo)
  {
    id: 10,
    type: 'text-input',
    title: 'Qual o centro de estudos onde trabalhas?',
    placeholder: 'Nome do centro de estudos',
    icon: Building,
    skipIf: (a) => a['question_9_answer'] !== 'centro-estudo'
  },
  // Q11: Distrito (não aparece se Q9=online)
  {
    id: 11,
    type: 'cards',
    title: 'Distrito',
    icon: MapPin,
    skipIf: (a) => a['question_9_answer'] === 'online',
    options: getDistritos().map(d => ({ value: d, label: d }))
  },
  // Q12: Concelho (não aparece se Q9=online)
  {
    id: 12,
    type: 'dynamic-cards',
    title: 'Concelho',
    icon: MapPin,
    skipIf: (a) => a['question_9_answer'] === 'online',
    getOptions: (a) => getMunicipiosByDistrito(a['question_11_answer'] || '').map(m => ({ value: m, label: m }))
  },
  // Q13: Freguesia (não aparece se Q9=online)
  {
    id: 13,
    type: 'dynamic-cards',
    title: 'Freguesia',
    icon: MapPin,
    skipIf: (a) => a['question_9_answer'] === 'online',
    getOptions: (a) => getFreguesiasByMunicipio(a['question_11_answer'] || '', a['question_12_answer'] || '').map(f => ({ value: f, label: f }))
  },
  // Q14: Plataforma (só aparece se Q9 = online ou indiferente)
  {
    id: 14,
    type: 'cards',
    title: 'Plataforma',
    subtitle: 'Qual a plataforma preferida para as sessões online?',
    icon: Monitor,
    skipIf: (a) => !['online', 'indiferente'].includes(a['question_9_answer']),
    options: ['Zoom', 'Google Meet', 'Microsoft Teams', 'Skype', 'Discord', 'Sem preferência', 'Outra'].map(p => ({ value: p, label: p }))
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
//-----------------HELPERS DE NAVEGAÇÃO COM SKIP-----------------
function getSkippedIndexes(currentAnswers: Record<string, any>): Set<number> {
  const q9 = currentAnswers['question_9_answer']
  const skipped = new Set<number>()
  questions.forEach((q, idx) => {
    if (q.type === 'conditional') {
      const cq = q as ConditionalQuestion
      if ((cq.dependsOn === 10 || cq.dependsOn === 11) && q9 !== 'presencial' && q9 !== 'indiferente') skipped.add(idx)
    }
  })
  return skipped
}

function getNextStep(from: number, currentAnswers: Record<string, any>): number {
  const skipped = getSkippedIndexes(currentAnswers)
  let next = from + 1
  while (next < questions.length && skipped.has(next)) next++
  return next
}

function getPrevStep(from: number, currentAnswers: Record<string, any>): number {
  const skipped = getSkippedIndexes(currentAnswers)
  let prev = from - 1
  while (prev >= 0 && skipped.has(prev)) prev--
  return Math.max(0, prev)
}

//-----------------COMPONENTE PRINCIPAL-----------------
export const TutorQuestionnaire = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: any }>({})
  const [sessionId] = useState(() => crypto.randomUUID())
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()
  const { user, userRole } = useAuth()

  //-----------------HANDLE ANSWER-----------------
  const handleAnswer = async (questionId: number, answer: any) => {
    const newAnswers = {
      ...answers,
      [`question_${questionId}_answer`]: answer
    }
    setAnswers(newAnswers)

    // Auto-avançar para perguntas de seleção única
    const q = questions.find(q => q.id === questionId)
    if (q && ['cards', 'single-choice-cards'].includes(q.type)) {
      const nextStep = getNextStep(currentStep, newAnswers)
      setTimeout(() => {
        if (nextStep < questions.length) setCurrentStep(nextStep)
      }, 300)
    }

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
      supabase.auth.updateUser({ data: { role: 'tutor' } })
      localStorage.setItem('tutmait_role', 'tutor')

    } catch (error: any) {
      console.error('❌ ERRO AO COMPLETAR REGISTO', error)
      alert(`Erro ao guardar perfil: ${error?.message || error}`)
    } finally {
      navigate('/dashboard/tutor-profile')
    }
  }

  //-----------------SKIP LOGIC-----------------
  const shouldSkip = (step: number, currentAnswers: Record<string, any>) => {
    const q = questions[step]
    return 'skipIf' in q && typeof (q as any).skipIf === 'function' && (q as any).skipIf(currentAnswers)
  }

  const getNextStep = (step: number, currentAnswers: Record<string, any>) => {
    let next = step + 1
    while (next < questions.length && shouldSkip(next, currentAnswers)) next++
    return next
  }

  const getPrevStep = (step: number, currentAnswers: Record<string, any>) => {
    let prev = step - 1
    while (prev >= 0 && shouldSkip(prev, currentAnswers)) prev--
    return prev
  }

  //-----------------GO BACK-----------------
  const goBack = () => {
    const prev = getPrevStep(currentStep, answers)
    if (prev >= 0) setCurrentStep(prev)
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
                  <div className="w-5 h-5 rounded-full bg-tutor-green-light text-primary flex items-center justify-center text-xs font-bold ring-2 ring-tutor-green-light/50">?</div>
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block w-80 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-[100] transition-opacity duration-200 opacity-0 group-hover:opacity-100 text-left pointer-events-none whitespace-pre-line leading-relaxed before:content-[''] before:absolute before:top-1/2 before:-translate-y-1/2 before:right-full before:border-8 before:border-transparent before:border-r-gray-900 border border-gray-700">
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
                    ? 'border-primary bg-tutor-green-light'
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
            {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-primary" />}
            <h2 className="text-2xl font-bold inline-flex items-center gap-2">
              {question.title}
              {question.tooltip && (
                <div className="group relative inline-block cursor-help">
                  <Info className="w-5 h-5 text-primary/60 hover:text-primary transition-colors" />
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
                    ? 'border-primary bg-tutor-green-light'
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
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none text-lg"
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
                  <Info className="w-5 h-5 text-primary/60 hover:text-primary transition-colors" />
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
                    ? 'border-primary bg-tutor-green-light'
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
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none text-lg"
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
            {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-primary" />}
            <h2 className="text-2xl font-bold inline-flex items-center gap-2">
              {question.title}
              {question.tooltip && (
                <div className="group relative flex items-center justify-center cursor-help">
                  <div className="w-5 h-5 rounded-full bg-tutor-green-light text-primary flex items-center justify-center text-xs font-bold ring-2 ring-tutor-green-light/50">?</div>
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
                      ? 'border-primary bg-tutor-green-light text-foreground'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-5 h-5 text-primary" />}
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
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-gray-100 hover:bg-gray-200'
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
        {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-primary" />}
        <h2 className="text-2xl font-bold inline-flex items-center gap-2">
          {question.title}
          {question.tooltip && (
            <div className="group relative flex items-center justify-center cursor-help">
              <div className="w-5 h-5 rounded-full bg-tutor-green-light text-primary flex items-center justify-center text-xs font-bold ring-2 ring-tutor-green-light/50">?</div>
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
                  ? 'border-primary bg-tutor-green-light text-primary'
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

      <div className="mt-4 p-3 bg-tutor-green-light rounded-lg">
        <p className="text-sm text-foreground">
          💡 Arrasta os itens para reordenar por prioridade (1 = mais importante)
        </p>
      </div>
    </div>
  )
    case 'text-input': {
      const tq = question as TextInputQuestion
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            {tq.icon && <tq.icon className="w-12 h-12 mx-auto mb-4 text-green-500" />}
            <h2 className="text-2xl font-bold">{tq.title}</h2>
            {tq.subtitle && <p className="text-gray-600 mt-2">{tq.subtitle}</p>}
          </div>
          <input
            type="text"
            placeholder={tq.placeholder || ''}
            value={answers[`question_${tq.id}_answer`] || ''}
            onChange={(e) => handleAnswer(tq.id, e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl p-4 text-base focus:outline-none focus:border-primary"
          />
        </div>
      )
    }

    case 'dynamic-cards': {
      const dq = question as DynamicCardsQuestion
      const opts = dq.getOptions(answers)
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            {dq.icon && <dq.icon className="w-12 h-12 mx-auto mb-4 text-green-500" />}
            <h2 className="text-2xl font-bold">{dq.title}</h2>
            {dq.subtitle && <p className="text-gray-600 mt-2">{dq.subtitle}</p>}
          </div>
          {opts.length === 0 ? (
            <p className="text-center text-gray-400">Seleciona primeiro a opção anterior.</p>
          ) : (
            <div className="grid gap-3">
              {opts.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(dq.id, opt.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${
                    answers[`question_${dq.id}_answer`] === opt.value
                      ? 'border-primary bg-tutor-green-light text-primary'
                      : 'border-gray-200 bg-white hover:border-green-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )
    }

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
        variant="tutor"
      />
    )
  }

  const question = questions[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100
  const currentAnswer = answers[`question_${question.id}_answer`]

  if (user && userRole === 'student') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-border/50 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-3">Conta já associada</h2>
          <p className="text-muted-foreground mb-6">
            Não podes ter conta de aluno e explicador na mesma conta. A tua conta já está registada como <strong>aluno</strong>.
          </p>
          <button
            onClick={() => navigate('/dashboard/student-profile')}
            className="w-full py-2 px-4 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
          >
            Ir para o meu perfil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">


      <div className="flex-1 py-8 px-4" style={{ position: 'relative', zIndex: 1 }}>
      <div className="max-w-4xl mx-auto">
        <motion.div className="mb-8">
          <div className="bg-muted rounded-full h-3 overflow-hidden shadow-sm">
            <motion.div
              className="h-full bg-primary"
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
            <Card className="p-8 shadow-xl rounded-2xl border border-border/50 bg-white/80 backdrop-blur-sm">
              {renderQuestionContent(questions[currentStep])}

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={goBack} disabled={currentStep === 0}>
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <Button
                  onClick={() => {
                    const next = getNextStep(currentStep, answers)
                    if (next < questions.length) {
                      setCurrentStep(next)
                    } else {
                      setShowAuth(true)
                    }
                  }}
                  disabled={(() => {
                    if (question.type === 'text-input') {
                      const val = answers[`question_${question.id}_answer`]
                      return !val || val.toString().trim() === ''
                    }
                    if (question.type === 'dynamic-cards') {
                      const opts = (question as DynamicCardsQuestion).getOptions(answers)
                      if (opts.length === 0) return false // sem opções → permite avançar
                      return currentAnswer === undefined
                    }
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
      <Footer />
    </div>
  )
}
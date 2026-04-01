//-----------------STUDENT QUESTIONNAIRE-----------------
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { supabase } from '../lib/supabase'
import { ChevronRight, ChevronLeft, Check, GripVertical } from 'lucide-react'
import { AuthModal } from './AuthModal'
import { BookOpen, User, Building, Gamepad, Target, GraduationCap, MapPin } from 'lucide-react'
import { Calendar, Monitor, Home } from 'lucide-react'
import { getDistritos, getMunicipiosByDistrito, getFreguesiasByMunicipio } from '../data/locationMap'
import { getBestTutorMatches, TutorMatch } from '../Functions/BestFitTutors'
import { TuTmaiTLoading } from './TuTmaiTLoading'
import { subjectsByLevelArea } from '../data/subjectsByLevel'
import { useAuth } from '../contexts/AuthContext'
import { Footer } from './Footer'

//-----------------QUESTION TYPES-----------------
type CardsQuestion = {
  id: number
  type: 'cards'
  title: string
  subtitle?: string
  tooltip?: string
  icon?: any
  options: { value: string; label: string; icon?: any }[]
}

type CardsMultipleQuestion = {
  id: number
  type: 'cards-multiple'
  title: string
  subtitle?: string
  tooltip?: string
  icon?: any
  options: { value: string; label: string }[]
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
  options: { value: string; label: string; description?: string; icon?: any }[]
}

type LevelYearQuestion = {
  id: number
  type: 'level-year'
  title: string
  subtitle?: string
  icon?: any
  levelOptions: { value: string; label: string }[]
}

type LocationScreenQuestion = {
  id: number
  type: 'location-screen'
  title: string
  subtitle?: string
  icon?: any
}

type PriorityRankingQuestion = {
  id: number
  type: 'priority-ranking'
  title: string
  subtitle?: string
  icon?: any
  criteria: { questionId: number; label: string }[]
}

type SubjectPickerQuestion = {
  id: number
  type: 'subject-picker'
  title: string
  subtitle?: string
  icon?: any
}

type Question =
  | CardsQuestion
  | CardsMultipleQuestion
  | AvailabilityGridQuestion
  | SingleChoiceCardsQuestion
  | LevelYearQuestion
  | LocationScreenQuestion
  | PriorityRankingQuestion
  | SubjectPickerQuestion

//-----------------SUPABASE DEBUG HELPERS-----------------
const logSupabase = (step: string, payload: any) => {
  console.group(`[SUPABASE][${step}]`)
  console.log('Timestamp:', new Date().toISOString())
  console.log('Payload:', payload)
  console.groupEnd()
}

//-----------------ÁREAS POR NÍVEL DE ENSINO-----------------
const areasByLevel: Record<string, string[]> = {
  '1º Ciclo':    [],
  '2º Ciclo':    [],
  '3º Ciclo':    [],
  'Secundário':  ['Ciências e Tecnologias', 'Ciências Socioeconómicas', 'Línguas e Humanidades', 'Artes Visuais'],
  'Superior':    ['Engenharia e Tecnologia', 'Medicina e Ciências da Saúde', 'Direito', 'Economia e Gestão', 'Humanidades e Línguas', 'Psicologia & Ciências Sociais', 'Educação e Formação', 'Artes, Design e Arquitectura', 'Agronomia, Ambiente e Veterinária', 'Ciências'],
  'Profissional': [],
}

//-----------------ARRAY DE PERGUNTAS (ESTUDANTE)-----------------
const questions: Question[] = [
  // Q1
  {
    id: 1,
    type: 'cards',
    title: 'Como preferes receber as explicações?',
    options: [
      { value: 'individual', label: 'Individual', icon: User },
      { value: 'grupo',      label: 'Grupo',      icon: Building },
    ]
  },
  // Q2
  {
    id: 2,
    type: 'level-year',
    title: 'Nível de ensino',
    subtitle: 'Seleciona o teu nível e, se aplicável, a área de ensino',
    icon: GraduationCap,
    levelOptions: [
      { value: '1º Ciclo',      label: '1º Ciclo' },
      { value: '2º Ciclo',      label: '2º Ciclo' },
      { value: '3º Ciclo',      label: '3º Ciclo' },
      { value: 'Secundário',    label: 'Secundário' },
      { value: 'Superior',      label: 'Superior' },
      { value: 'Profissional',  label: 'Profissional' },
    ]
  },
  // Q3
  {
    id: 3,
    type: 'subject-picker',
    title: 'Disciplinas',
    subtitle: 'Que disciplinas procuras? (podes escolher várias)',
    icon: BookOpen,
  },
  // Q4
  {
    id: 4,
    type: 'cards',
    title: 'Quantas sessões por semana precisas?',
    options: [
      { value: '1', label: '1 sessão' },
      { value: '2', label: '2 sessões' },
      { value: '3', label: '3 sessões' },
      { value: '4', label: '4 sessões' },
      { value: '5+', label: '5 ou mais sessões' },
    ]
  },
  // Q5
  {
    id: 5,
    type: 'cards',
    title: 'Qual é o teu orçamento por hora?',
    subtitle: 'Valor indicativo (podes alterar mais tarde)',
    options: [
      { value: '10-15', label: '10€ – 15€ / hora' },
      { value: '15-25', label: '15€ – 25€ / hora' },
      { value: '25-35', label: '25€ – 35€ / hora' },
      { value: '35-45', label: '35€ – 45€ / hora' },
      { value: '45+',   label: 'Mais de 45€ / hora' },
    ]
  },
  // Q6
  {
    id: 6,
    type: 'availability-grid',
    title: 'Disponibilidade',
    subtitle: 'Seleciona os períodos em que podes ter explicações',
    icon: Calendar,
  },
  // Q7
  {
    id: 7,
    type: 'single-choice-cards',
    title: 'Tipo de explicação',
    subtitle: 'Onde preferes ter as aulas?',
    icon: Monitor,
    options: [
      { value: 'presencial',     label: 'Presencial',       description: 'O explicador vai ao teu local ou local combinado', icon: Home },
      { value: 'centro-estudo',  label: 'Centro de Estudo', description: 'Numa instalação dedicada ao estudo',               icon: Building },
      { value: 'online',         label: 'Online',           description: 'Sessões virtuais por videochamada',                icon: Monitor },
    ]
  },
  // Q8 — visível apenas se Q7 ≠ online
  {
    id: 8,
    type: 'location-screen',
    title: 'Localização',
    subtitle: 'Indica onde te encontras para encontrarmos explicadores perto de ti',
    icon: MapPin,
  },
  // Q9
  {
    id: 9,
    type: 'single-choice-cards',
    title: 'Qual é o teu objectivo?',
    icon: Target,
    options: [
      { value: 'explorar',     label: 'Quero explorar este tema',             description: 'Estou a começar e quero construir uma base sólida de conhecimento.' },
      { value: 'duvidas',      label: 'Tenho dúvidas pontuais',               description: 'Já tenho algum conhecimento, mas quero esclarecer conceitos específicos.' },
      { value: 'recuperar',    label: 'Quero recuperar e consolidar',         description: 'Estou a ter dificuldades e quero identificar lacunas para melhorar os meus resultados.' },
      { value: 'progredir',    label: 'Quero progredir e aprofundar',         description: 'Estou num bom caminho e quero continuar a evoluir.' },
      { value: 'avancado',     label: 'Quero atingir um nível avançado',      description: 'Domino o essencial e quero aperfeiçoar ao máximo o meu desempenho.' },
      { value: 'avaliacoes',   label: 'Quero preparar-me para avaliações',    description: 'O meu foco é consolidar e rever os conteúdos para os exames.' },
    ]
  },
  // Q10
  {
    id: 10,
    type: 'cards-multiple',
    title: 'Abordagem de ensino',
    subtitle: 'Que tipo de abordagem preferes? (podes escolher várias)',
    icon: Target,
    options: [
      { value: 'Explicações práticas',  label: 'Explicações práticas' },
      { value: 'Material visual',       label: 'Material visual' },
      { value: 'Aulas teóricas',        label: 'Aulas teóricas' },
      { value: 'Exercícios guiados',    label: 'Exercícios guiados' },
      { value: 'Aulas interativas',     label: 'Aulas interativas' },
    ]
  },
  // Q11
  {
    id: 11,
    type: 'cards-multiple',
    title: 'Hobbies',
    subtitle: 'Quais são as tuas áreas de interesse? (podes escolher várias)',
    icon: Gamepad,
    options: [
      { value: 'Jogos',    label: 'Jogos' },
      { value: 'Desporto', label: 'Desporto' },
      { value: 'Música',   label: 'Música' },
      { value: 'Leitura',  label: 'Leitura' },
      { value: 'Cinema',   label: 'Cinema' },
      { value: 'Outros',   label: 'Outros' },
    ]
  },
  // Q12
  {
    id: 12,
    type: 'cards',
    title: 'Perfil do aluno',
    subtitle: 'Tens alguma condição relevante para o explicador conhecer?',
    icon: User,
    options: [
      { value: 'nenhuma',           label: 'Não' },
      { value: 'dificuldades',      label: 'Dificuldades de Aprendizagem' },
      { value: 'deficiencia',       label: 'Aprendizagem condicionada por deficiência' },
    ]
  },
  // Q13
  {
    id: 13,
    type: 'priority-ranking',
    title: 'O que é mais importante para ti?',
    subtitle: 'Ordena os critérios por ordem de importância — o primeiro é o que mais pesa na compatibilidade',
    icon: Target,
    criteria: [
      { questionId: 3,  label: 'Matéria — que disciplina preciso de apoio' },
      { questionId: 4,  label: 'Frequência — quantas sessões por semana' },
      { questionId: 5,  label: 'Preço — qual o orçamento disponível' },
      { questionId: 6,  label: 'Horário — quando estou disponível' },
      { questionId: 8,  label: 'Localização — onde quero as aulas' },
      { questionId: 9,  label: 'Objetivo — o que quero alcançar' },
      { questionId: 10, label: 'Método — como prefiro aprender' },
      { questionId: 11, label: 'Interesses — hobbies em comum com o explicador' },
    ]
  },
]

//-----------------HELPERS DE NAVEGAÇÃO COM SKIP-----------------
function getSkippedIndexes(currentAnswers: Record<string, any>): Set<number> {
  const q7 = currentAnswers['question_7_answer']
  const skipped = new Set<number>()
  questions.forEach((q, idx) => {
    if (q.id === 8 && q7 === 'online') skipped.add(idx)
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
export const StudentQuestionnaire = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: any }>({})
  const [sessionId] = useState(() => crypto.randomUUID())
  const [showResults, setShowResults] = useState(false)
  const [matched, setMatched] = useState<TutorMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [showTuTmaiTLoading, setShowTuTmaiTLoading] = useState(false)
  const [priorityOrder, setPriorityOrder] = useState<number[]>([3, 4, 5, 6, 8, 9, 10, 11])
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)
  const [pendingTutorId, setPendingTutorId] = useState<string | null>(null)
  const finalAnswersRef = useRef<Record<string, any>>({})
  const { user, userRole } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('[StudentQuestionnaire] session_id:', sessionId)
    localStorage.setItem('student_session_id', sessionId)
  }, [sessionId])

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
        if (nextStep < questions.length) {
          setCurrentStep(nextStep)
        } else {
          handleFinishQuestionnaire()
        }
      }, 300)
    }

    try {
      logSupabase('UPSERT temp_students', { session_id: sessionId })
      const { data, error } = await supabase
        .from('temp_students')
        .upsert({
          session_id: sessionId,
          question_1_answer: newAnswers['question_1_answer'] || '',
          raw_answers: newAnswers
        }, { onConflict: 'session_id' })
      if (error) throw error
      logSupabase('UPSERT temp_students - OK', data)
    } catch (error) {
      console.warn('⚠️ Erro ao salvar temporário:', error)
    }
  }

  //-----------------FINISH QUESTIONNAIRE-----------------
  //-----------------CRIAR PERFIL DE ALUNO-----------------
  const createStudentProfile = async (userId: string, finalAnswers: Record<string, any>, tutorId?: string | null) => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      const u = authData?.user
      const { error } = await supabase.from('students').upsert({
        user_id: userId,
        name: u?.user_metadata?.name || u?.email?.split('@')[0] || '',
        email: u?.email || '',
        question_1_answer: finalAnswers['question_1_answer'] || '',
        raw_answers: finalAnswers,
        subjects: finalAnswers['question_3_answer'] || [],
      }, { onConflict: 'user_id' })
      if (error) {
        console.error('Erro ao criar perfil de aluno:', error)
      } else {
        await supabase.from('temp_students').delete().eq('session_id', sessionId)
      }
      // Adicionar tutor escolhido aos favoritos (ignora se já existir)
      if (tutorId) {
        await supabase.from('student_favorites')
          .insert({ student_user_id: userId, tutor_id: tutorId })
          .then(({ error }) => {
            if (error && !error.message.includes('duplicate')) {
              console.error('Erro ao adicionar favorito:', error)
            }
          })
      }
    } catch (err) {
      console.error('Aviso ao criar perfil de aluno:', err)
    }
  }

  const handleFinishQuestionnaire = async (extraAnswers?: Record<string, any>) => {
    setLoading(true)
    const finalAnswers = { ...answers, ...(extraAnswers || {}) }
    try {
      const matches = await getBestTutorMatches(finalAnswers as any)
      logSupabase('MATCHES CALCULADOS', { count: matches.length })
      setMatched(matches)
    } catch (err) {
      console.error('❌ Erro ao calcular matches:', err)
      setMatched([])
    }
    setLoading(false)
    setShowTuTmaiTLoading(true)
    await new Promise(resolve => setTimeout(resolve, 5000))
    setShowTuTmaiTLoading(false)
    finalAnswersRef.current = finalAnswers
    setShowResults(true)

    // Se já autenticado: criar perfil de aluno imediatamente (sem tutor nos favoritos — escolhe depois)
    if (user) {
      await createStudentProfile(user.id, finalAnswers, null)
      localStorage.setItem('tutmait_role', 'student')
      supabase.auth.updateUser({ data: { role: 'student' } })
    }
  }

  //-----------------GO BACK-----------------
  const goBack = () => {
    if (showResults) { setShowResults(false); return }
    if (currentStep > 0) setCurrentStep(getPrevStep(currentStep, answers))
  }

  //-----------------SELECIONAR TUTOR-----------------
  const handleSelectTutor = (tutorId: string) => {
    if (user) {
      // Já autenticado: adicionar favorito e ir para o perfil de aluno
      supabase.from('student_favorites')
        .insert({ student_user_id: user.id, tutor_id: tutorId })
        .then(() => navigate('/dashboard/student-profile'))
    } else {
      setPendingTutorId(tutorId)
      setShowAuthOverlay(true)
    }
  }

  //-----------------AUTH COMPLETE-----------------
  const handleAuthComplete = async (userId: string) => {
    localStorage.setItem('tutmait_role', 'student')
    supabase.auth.updateUser({ data: { role: 'student' } })
    const chosenTutorId = pendingTutorId
    setShowAuthOverlay(false)
    setPendingTutorId(null)
    
    // Mostramos o loading screen global para evitar que o overlay de auth fique "encravado"
    // caso ocorra um re-render por parte do Supabase (onAuthStateChange)
    setShowTuTmaiTLoading(true)
    
    // ATENÇÃO: É vital esperar que o perfil seja criado (com 'await')
    // ANTES de navegar, caso contrário o ecrã do Perfil carrega
    // mais depressa do que a base de dados guarda as respostas e fica em branco!
    await createStudentProfile(userId, finalAnswersRef.current, chosenTutorId)

    setShowTuTmaiTLoading(false)

    if (chosenTutorId) {
      navigate(`/profile/${chosenTutorId}`)
    } else {
      navigate('/dashboard/student-profile')
    }
  }

  //-----------------RENDER STEP CONTENT-----------------
  const renderStepContent = (question: Question): React.ReactNode => {
    switch (question.type) {

      // --- CARDS (seleção única, auto-avança) ---
      case 'cards':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-accent" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
            </div>
            <div className="grid gap-3">
              {question.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(question.id, option.value)}
                  className={`p-4 rounded-xl border-2 text-left flex items-center gap-3 ${
                    answers[`question_${question.id}_answer`] === option.value
                      ? 'border-accent bg-student-yellow-light'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option.icon && <option.icon className="w-5 h-5 text-gray-500 flex-shrink-0" />}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )

      // --- CARDS MÚLTIPLA ---
      case 'cards-multiple': {
        const selectedValues: string[] = Array.isArray(answers[`question_${question.id}_answer`])
          ? answers[`question_${question.id}_answer`]
          : []
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-accent" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
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
                        ? 'border-accent bg-student-yellow-light text-foreground'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="w-5 h-5 text-accent flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      }

      // --- GRELHA DE DISPONIBILIDADE ---
      case 'availability-grid': {
        const slotTimes: Record<string, string> = {
          'Manhã': '08h–13h',
          'Tarde': '13h–18h',
          'Noite': '18h–23h',
        }
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-accent" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
            </div>
            {/* Legenda dos períodos */}
            <div className="flex justify-end gap-4 text-xs text-gray-500 mb-1 pr-1">
              {(['Manhã', 'Tarde', 'Noite'] as const).map(slot => (
                <span key={slot}><span className="font-medium text-gray-700">{slot}</span> {slotTimes[slot]}</span>
              ))}
            </div>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-2 text-center min-w-[400px]">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                  <div key={day}>
                    <p className="font-semibold mb-2 text-sm">{day}</p>
                    <div className="grid gap-1">
                      {(['Manhã', 'Tarde', 'Noite'] as const).map(slot => {
                        const key = `${day}_${slot}`
                        const selected = answers[`question_${question.id}_answer`] || {}
                        const isSelected = selected[key]
                        return (
                          <button
                            key={slot}
                            onClick={() => handleAnswer(question.id, { ...selected, [key]: !isSelected })}
                            className={`border rounded-lg w-full text-xs py-2 px-1 transition-colors ${
                              isSelected ? 'bg-accent text-foreground border-accent' : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
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
          </div>
        )
      }

      // --- SINGLE CHOICE CARDS (auto-avança) ---
      case 'single-choice-cards': {
        const selectedValue: string = answers[`question_${question.id}_answer`] || ''
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-accent" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
            </div>
            <div className="grid gap-3">
              {question.options.map(option => {
                const isSelected = selectedValue === option.value
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(question.id, option.value)}
                    className={`p-4 rounded-lg border-2 text-left flex items-start gap-3 ${
                      isSelected
                        ? 'border-accent bg-student-yellow-light text-foreground'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {Icon && <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                    <div>
                      <div className="font-medium">{option.label}</div>
                      {option.description && <div className="text-sm text-gray-500">{option.description}</div>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      }

      // --- NÍVEL + ANO (mesmo ecrã) ---
      case 'level-year': {
        const selectedLevel: string = answers['question_2_answer'] || ''
        const selectedArea: string = answers['question_2_area'] || ''
        const areaOpts = selectedLevel ? (areasByLevel[selectedLevel] || []) : []

        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-accent" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
            </div>

            {/* Nível de ensino */}
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Nível de ensino</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {question.levelOptions.map(opt => {
                  const hasAreas = (areasByLevel[opt.value] || []).length > 0
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setAnswers(prev => ({ ...prev, question_2_answer: opt.value, question_2_area: undefined }))
                        // Níveis sem área avançam automaticamente
                        if (!hasAreas) {
                          const nextStep = getNextStep(currentStep, { ...answers, question_2_answer: opt.value, question_2_area: undefined })
                          setTimeout(() => {
                            if (nextStep < questions.length) setCurrentStep(nextStep)
                          }, 300)
                        }
                      }}
                      className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-colors ${
                        selectedLevel === opt.value
                          ? 'border-accent bg-student-yellow-light text-foreground'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Área de ensino — aparece após escolha de nível com áreas */}
            {selectedLevel && areaOpts.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Área de ensino</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {areaOpts.map(area => (
                    <button
                      key={area}
                      onClick={() => {
                        setAnswers(prev => ({ ...prev, question_2_area: area }))
                        const nextStep = getNextStep(currentStep, { ...answers, question_2_answer: selectedLevel, question_2_area: area })
                        setTimeout(() => {
                          if (nextStep < questions.length) setCurrentStep(nextStep)
                        }, 300)
                      }}
                      className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-colors ${
                        selectedArea === area
                          ? 'border-accent bg-student-yellow-light text-foreground'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      }

      // --- LOCALIZAÇÃO (mesmo ecrã: Distrito + Concelho + Freguesia) ---
      case 'location-screen': {
        const selectedDistrict: string = answers['question_8_answer'] || ''
        const selectedMunicipality: string = answers['question_8_municipality'] || ''
        const selectedParish: string = answers['question_8_parish'] || ''
        const municipalities = selectedDistrict ? getMunicipiosByDistrito(selectedDistrict) : []
        const parishes = selectedMunicipality ? getFreguesiasByMunicipio(selectedDistrict, selectedMunicipality) : []

        return (
          <div className="space-y-8">
            <div className="text-center mb-6">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-accent" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
            </div>

            {/* Distrito */}
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Distrito</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-64 overflow-y-auto pr-1">
                {getDistritos().map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      handleAnswer(8, d)
                      setAnswers(prev => ({ ...prev, question_8_answer: d, question_8_municipality: undefined, question_8_parish: undefined }))
                    }}
                    className={`p-3 rounded-lg border-2 text-left text-sm transition-colors ${
                      selectedDistrict === d
                        ? 'border-accent bg-student-yellow-light text-foreground font-medium'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Concelho */}
            {selectedDistrict && municipalities.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Concelho</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-48 overflow-y-auto pr-1">
                  {municipalities.map(m => (
                    <button
                      key={m}
                      onClick={() => {
                        setAnswers(prev => ({ ...prev, question_8_municipality: m, question_8_parish: undefined }))
                      }}
                      className={`p-3 rounded-lg border-2 text-left text-sm transition-colors ${
                        selectedMunicipality === m
                          ? 'border-accent bg-student-yellow-light text-foreground font-medium'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Freguesia */}
            {selectedMunicipality && parishes.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Freguesia</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-48 overflow-y-auto pr-1">
                  {parishes.map(p => (
                    <button
                      key={p}
                      onClick={() => setAnswers(prev => ({ ...prev, question_8_parish: p }))}
                      className={`p-3 rounded-lg border-2 text-left text-sm transition-colors ${
                        selectedParish === p
                          ? 'border-accent bg-student-yellow-light text-foreground font-medium'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      }

      // --- ORDENAÇÃO POR PRIORIDADE (drag & drop) ---
      case 'priority-ranking': {
        const isOnline = answers['question_7_answer'] === 'online'
        const activeCriteria = question.criteria.filter(c => !(c.questionId === 8 && isOnline))
        const activeOrder = priorityOrder.filter(id => activeCriteria.some(c => c.questionId === id))

        const badgeGradient = 'from-accent to-accent/80'

        return (
          <div className="space-y-5">
            <div className="text-center mb-4">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-accent" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.subtitle && <p className="text-gray-500 mt-2 text-sm">{question.subtitle}</p>}
            </div>
            <p className="text-xs text-gray-400 text-center tracking-wide uppercase">Arrasta para reordenar</p>
            <Reorder.Group
              axis="y"
              values={activeOrder}
              onReorder={(newOrder: number[]) =>
                setPriorityOrder(isOnline ? [...newOrder, 8] : newOrder)
              }
              className="space-y-2 select-none"
            >
              {activeOrder.map((qId, index) => {
                const criterion = activeCriteria.find(c => c.questionId === qId)!
                return (
                  <Reorder.Item
                    key={qId}
                    value={qId}
                    whileDrag={{
                      scale: 1.04,
                      boxShadow: '0 20px 40px rgba(0,0,0,0.14)',
                      zIndex: 50,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="rounded-2xl cursor-grab active:cursor-grabbing list-none"
                  >
                    <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200">
                      <span className={`w-9 h-9 rounded-full bg-gradient-to-br ${badgeGradient} text-foreground text-sm font-bold flex items-center justify-center flex-shrink-0 shadow`}>
                        {index + 1}
                      </span>
                      <span className="flex-1 font-semibold text-gray-800 text-sm">{criterion.label}</span>
                      <GripVertical className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    </div>
                  </Reorder.Item>
                )
              })}
            </Reorder.Group>
          </div>
        )
      }

      // --- SUBJECT PICKER (disciplinas por nível/área) ---
      case 'subject-picker': {
        const level: string = answers['question_2_answer'] || ''
        const area: string = answers['question_2_area'] || ''
        const key = area ? `${level}|${area}` : level
        const subjectData = subjectsByLevelArea[key]

        const selectedValues: string[] = Array.isArray(answers['question_3_answer'])
          ? answers['question_3_answer']
          : []

        const toggle = (subject: string) => {
          const next = selectedValues.includes(subject)
            ? selectedValues.filter(v => v !== subject)
            : [...selectedValues, subject]
          handleAnswer(3, next)
        }

        const renderSubjectButton = (subject: string) => {
          const isSelected = selectedValues.includes(subject)
          return (
            <button
              key={subject}
              onClick={() => toggle(subject)}
              className={`p-3 rounded-lg border-2 text-left text-sm font-medium transition-colors flex justify-between items-center ${
                isSelected
                  ? 'border-accent bg-student-yellow-light text-foreground'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>{subject}</span>
              {isSelected && <Check className="w-4 h-4 text-accent flex-shrink-0 ml-2" />}
            </button>
          )
        }

        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-accent" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
            </div>

            {!subjectData ? (
              <p className="text-center text-gray-400 text-sm">Nenhuma disciplina disponível para esta combinação.</p>
            ) : Array.isArray(subjectData) ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {subjectData.map(renderSubjectButton)}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(subjectData).map(([category, subjects]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{category}</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {subjects.map(renderSubjectButton)}
                    </div>
                  </div>
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

  //-----------------VALIDAÇÃO DO BOTÃO SEGUINTE-----------------
  const isNextDisabled = (): boolean => {
    if (loading) return true
    const question = questions[currentStep]
    if (question.type === 'level-year') {
      const level = answers['question_2_answer']
      if (!level) return true
      const areas = areasByLevel[level] || []
      if (areas.length === 0) return false
      return !answers['question_2_area']
    }
    if (question.type === 'location-screen') {
      return !answers['question_8_answer']
    }
    if (question.type === 'priority-ranking') return false
    const currentAnswer = answers[`question_${question.id}_answer`]
    return currentAnswer === undefined || (Array.isArray(currentAnswer) && currentAnswer.length === 0)
  }

  //-----------------RENDER COMPONENT-----------------
  if (showTuTmaiTLoading) {
    return <TuTmaiTLoading />
  }

  if (showResults) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-20 h-20 bg-student-yellow-light text-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Questionário Concluído!</h2>
              <p className="text-gray-600 text-lg mb-8">
                Baseado nas tuas respostas, encontrámos estes explicadores ideais para ti.
              </p>
              <Button onClick={() => navigate('/')} variant="outline" className="mt-4">
                Voltar ao Início
              </Button>

              {matched && matched.length > 0 && (
                <div className="mt-12 text-left">
                  <h3 className="text-2xl font-bold mb-4 text-center">Os teus matches</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {matched.map((t) => (
                      <Card key={t.tutorId} className="p-6 flex flex-col gap-3">
                        {t.profile_picture && (
                          <img
                            src={t.profile_picture}
                            alt={t.name}
                            className="w-16 h-16 rounded-full object-cover mx-auto"
                          />
                        )}
                        <div>
                          <h3 className="text-xl font-bold">{t.name}</h3>
                          <p className="text-muted-foreground text-sm">{t.subjects?.join(', ')}</p>
                        </div>
                        <span className="bg-student-yellow-light text-foreground text-xs font-semibold px-2.5 py-0.5 rounded self-start">
                          Match: {t.compatibility}%
                        </span>
                        <Button
                          onClick={() => handleSelectTutor(t.tutorId)}
                          className="w-full mt-auto"
                        >
                          Escolher Explicador
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {showAuthOverlay && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAuthOverlay(false)
                setPendingTutorId(null)
              }
            }}
          >
            <div className="relative w-full max-w-sm">
              <button
                onClick={() => { setShowAuthOverlay(false); setPendingTutorId(null) }}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
              <AuthModal
                modal
                role="student"
                onComplete={handleAuthComplete}
                title="Cria a tua conta de aluno"
                subtitle="Regista-te gratuitamente para guardar o teu explicador e aceder ao teu perfil"
              />
            </div>
          </div>
        )}
      </>
    )
  }

  const question = questions[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100

  if (user && userRole === 'tutor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-border/50 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-3">Conta já associada</h2>
          <p className="text-muted-foreground mb-6">
            Não podes ter conta de aluno e explicador na mesma conta. A tua conta já está registada como <strong>explicador</strong>.
          </p>
          <button
            onClick={() => navigate('/dashboard/tutor-profile')}
            className="w-full py-2 px-4 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Ir para o meu perfil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div className="mb-8">
          <div className="bg-white rounded-full h-3 overflow-hidden shadow-sm">
            <motion.div
              className="h-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {Math.round(progress)}%
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
              {renderStepContent(question)}

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
                      // Calcular ranks da ordenação de prioridades
                      const isOnline = answers['question_7_answer'] === 'online'
                      const activeOrder = priorityOrder.filter(id => !(id === 8 && isOnline))
                      const rankAnswers: Record<string, any> = {}
                      activeOrder.forEach((qId, index) => {
                        rankAnswers[`question_${qId}_rank`] = index + 1
                      })
                      handleFinishQuestionnaire(rankAnswers)
                    }
                  }}
                  disabled={isNextDisabled()}
                  className="bg-accent hover:bg-accent/90 text-foreground"
                >
                  {loading ? 'A calcular matches...' : questions[currentStep].type === 'priority-ranking' ? 'Ver os meus matches' : 'Seguinte'}
                  {!loading && questions[currentStep].type !== 'priority-ranking' && <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-12">
        <Footer />
      </div>
    </div>
  )
}

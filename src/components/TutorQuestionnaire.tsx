//-----------------TUTOR QUESTIONNAIRE-----------------
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { supabase } from '../lib/supabase'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { AuthModal } from './AuthModal'
import { BookOpen, GraduationCap, User, Building, Gamepad, Target, MapPin } from 'lucide-react'
import { Calendar, Monitor, Home } from 'lucide-react'
import { getDistritos, getMunicipiosByDistrito, getFreguesiasByMunicipio } from '../data/locationMap'
import { subjectsByLevelArea } from '../data/subjectsByLevel'
import { Footer } from './Footer'

//-----------------QUESTION TYPES-----------------
type CardsQuestion = {
  id: number
  type: 'cards'
  title: string
  subtitle?: string
  icon?: any
  options: { value: string; label: string; icon?: any }[]
}

type CardsMultipleQuestion = {
  id: number
  type: 'cards-multiple'
  title: string
  subtitle?: string
  icon?: any
  options: { value: string; label: string; description?: string; icon?: any }[]
  skipIf?: (answers: Record<string, any>) => boolean
}

type CardsWithOtherQuestion = {
  id: number
  type: 'cards-with-other'
  title: string
  subtitle?: string
  icon?: any
  options: { value: string; label: string }[]
}

type YesNoWithExtraQuestion = {
  id: number
  type: 'yes-no-with-extra'
  title: string
  subtitle?: string
  extraLabel: string
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

type LocationScreenQuestion = {
  id: number
  type: 'location-screen'
  title: string
  subtitle?: string
  icon?: any
  skipIf?: (answers: Record<string, any>) => boolean
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

type TutorSubjectPickerQuestion = {
  id: number
  type: 'tutor-subject-picker'
  title: string
  subtitle?: string
  icon?: any
}

type Question =
  | CardsQuestion
  | CardsMultipleQuestion
  | CardsWithOtherQuestion
  | YesNoWithExtraQuestion
  | AvailabilityGridQuestion
  | SingleChoiceCardsQuestion
  | LocationScreenQuestion
  | TextInputQuestion
  | TutorSubjectPickerQuestion

//-----------------SUPABASE DEBUG HELPERS-----------------
const logSupabase = (step: string, payload: any) => {
  console.group(`[SUPABASE][${step}]`)
  console.log('Timestamp:', new Date().toISOString())
  console.log('Payload:', payload)
  console.groupEnd()
}

//-----------------HELPER: disciplinas por níveis selecionados-----------------
// Para cada nível selecionado, agrega todas as disciplinas (incluindo sub-áreas de Secundário/Superior)
function getSubjectsForLevels(selectedLevels: string[]): { level: string; subjects: string[] }[] {
  if (!selectedLevels || selectedLevels.length === 0) return []

  return selectedLevels.map(level => {
    const levelSubjects: string[] = []

    // Chave direta (ex: "1º Ciclo", "2º Ciclo")
    const direct = subjectsByLevelArea[level]
    if (direct) {
      if (Array.isArray(direct)) {
        levelSubjects.push(...direct)
      } else {
        // Record<categoria, string[]> → achata todas as categorias
        Object.values(direct).forEach(subs => levelSubjects.push(...(subs as string[])))
      }
    }

    // Chaves compostas como "Secundário|Ciências e Tecnologias"
    Object.entries(subjectsByLevelArea).forEach(([key, data]) => {
      if (key.startsWith(level + '|')) {
        if (Array.isArray(data)) {
          levelSubjects.push(...data)
        } else {
          Object.values(data).forEach(subs => levelSubjects.push(...(subs as string[])))
        }
      }
    })

    return { level, subjects: [...new Set(levelSubjects)] }
  }).filter(g => g.subjects.length > 0)
}

//-----------------ARRAY DE PERGUNTAS (EXPLICADOR)-----------------
const questions: Question[] = [
  // Q1 — Tipo de explicação (múltipla)
  {
    id: 1,
    type: 'cards-multiple',
    title: 'Como vais dar explicações?',
    options: [
      { value: 'individual', label: 'Individual',  icon: User },
      { value: 'grupo',      label: 'Grupo',        icon: Building },
    ],
  },
  // Q2 — Experiência anterior (Sim revela campo numérico inline)
  {
    id: 2,
    type: 'yes-no-with-extra',
    title: 'Experiência como explicador',
    subtitle: 'Tens experiência anterior a dar explicações?',
    extraLabel: 'Quantos anos de experiência?',
  },
  // Q3 — Níveis de ensino (múltipla; mesmos valores que Q2 do estudante)
  {
    id: 3,
    type: 'cards-multiple',
    title: 'Níveis de ensino',
    subtitle: 'Quais os níveis que podes lecionar? (Podes escolher vários)',
    icon: GraduationCap,
    options: [
      { value: '1º Ciclo',     label: '1º Ciclo' },
      { value: '2º Ciclo',     label: '2º Ciclo' },
      { value: '3º Ciclo',     label: '3º Ciclo' },
      { value: 'Secundário',   label: 'Secundário' },
      { value: 'Superior',     label: 'Superior' },
      { value: 'Profissional', label: 'Profissional' },
    ],
  },
  // Q3 (continuação) — Disciplinas filtradas pelos níveis selecionados em Q3
  {
    id: 4,
    type: 'tutor-subject-picker',
    title: 'Disciplinas',
    subtitle: 'Que disciplinas podes ensinar? (Podes escolher várias)',
    icon: BookOpen,
  },
  // Q4 — Sessões disponíveis por semana
  {
    id: 5,
    type: 'cards',
    title: 'Quantas sessões por semana tens disponíveis?',
    subtitle: 'Cada sessão corresponde aproximadamente a 1 hora',
    options: [
      { value: '1',  label: '1 sessão' },
      { value: '2',  label: '2 sessões' },
      { value: '3',  label: '3 sessões' },
      { value: '4',  label: '4 sessões' },
      { value: '5+', label: '5 ou mais sessões' },
    ],
  },
  // Q5 — Valor por hora
  {
    id: 6,
    type: 'cards',
    title: 'Qual é o valor que pretendes cobrar por hora?',
    subtitle: 'Valor indicativo (podes alterar mais tarde)',
    options: [
      { value: '10-15', label: '10€ – 15€ / hora' },
      { value: '15-25', label: '15€ – 25€ / hora' },
      { value: '25-35', label: '25€ – 35€ / hora' },
      { value: '35-45', label: '35€ – 45€ / hora' },
      { value: '45+',   label: 'Mais de 45€ / hora' },
    ],
  },
  // Q6 — Disponibilidade semanal (grelha 7 dias × 3 períodos)
  {
    id: 7,
    type: 'availability-grid',
    title: 'Disponibilidade',
    subtitle: 'Qual o horário disponível para as explicações?',
    icon: Calendar,
  },
  // Q7 — Modalidade de ensino (múltipla)
  {
    id: 8,
    type: 'cards-multiple',
    title: 'Modalidade de ensino',
    subtitle: 'Que formatos de aula ofereces? (Podes escolher várias)',
    icon: Monitor,
    options: [
      { value: 'presencial',    label: 'Presencial',        icon: Home },
      { value: 'centro-estudo', label: 'Centro de estudo',  icon: Building },
      { value: 'online',        label: 'Online',            icon: Monitor },
    ],
  },
  // Q8 — Localização (apenas se Q7 inclui "presencial" ou "centro-estudo")
  {
    id: 9,
    type: 'location-screen',
    title: 'Localização',
    subtitle: 'Indica onde te encontras para os alunos saberem onde podes dar aulas',
    icon: MapPin,
    skipIf: (a) => {
      const mods: string[] = Array.isArray(a['question_8_answer']) ? a['question_8_answer'] : []
      return !mods.some(v => v === 'presencial' || v === 'centro-estudo')
    },
  },
  // Q9 — Centro de estudos (apenas se Q7 inclui "centro-estudo")
  {
    id: 10,
    type: 'text-input',
    title: 'Centro de estudos',
    subtitle: 'Qual o nome do centro de estudos onde trabalhas?',
    placeholder: 'Nome do centro de estudos',
    icon: Building,
    skipIf: (a) => {
      const mods: string[] = Array.isArray(a['question_8_answer']) ? a['question_8_answer'] : []
      return !mods.includes('centro-estudo')
    },
  },
  // Q10 — Objetivo do aluno que o explicador prefere acompanhar
  {
    id: 11,
    type: 'cards-multiple',
    title: 'Que tipo de aluno preferes acompanhar?',
    subtitle: 'Podes selecionar mais do que uma opção',
    icon: Target,
    options: [
      { value: 'explorar',   label: 'Explorar o tema',            description: 'O aluno está a começar e precisa de construir uma base sólida de conhecimento.' },
      { value: 'duvidas',    label: 'Dúvidas pontuais',           description: 'O aluno já tem algum conhecimento, mas precisa de esclarecer conceitos específicos.' },
      { value: 'recuperar',  label: 'Recuperar e consolidar',     description: 'O aluno está a ter dificuldades e precisa de identificar lacunas para melhorar os seus resultados.' },
      { value: 'progredir',  label: 'Progredir e aprofundar',     description: 'O aluno está num bom caminho e quer continuar a evoluir.' },
      { value: 'avancado',   label: 'Nível avançado',             description: 'O aluno domina o essencial e quer aperfeiçoar ao máximo o seu desempenho.' },
      { value: 'avaliacoes', label: 'Preparação para avaliações', description: 'O foco do aluno é consolidar e rever os conteúdos para os exames.' },
    ],
  },
  // Q11 — Nível académico do explicador
  {
    id: 12,
    type: 'cards-with-other',
    title: 'Nível Académico',
    subtitle: 'Qual é o teu nível académico mais alto concluído?',
    icon: GraduationCap,
    options: [
      { value: 'Licenciatura',  label: 'Licenciatura' },
      { value: 'Mestrado',      label: 'Mestrado' },
      { value: 'Doutoramento',  label: 'Doutoramento' },
    ],
  },
  // Q12 — Abordagem de ensino preferida (múltipla)
  {
    id: 13,
    type: 'cards-multiple',
    title: 'Abordagem de ensino',
    subtitle: 'Que tipo de abordagem usas nas tuas explicações? (Podes escolher várias)',
    icon: Target,
    options: [
      { value: 'Explicações práticas',   label: 'Explicações práticas' },
      { value: 'Material visual',        label: 'Material visual' },
      { value: 'Aulas expositivas',      label: 'Aulas expositivas' },
      { value: 'Exercícios guiados',     label: 'Exercícios guiados' },
      { value: 'Aulas interativas',      label: 'Aulas interativas' },
      { value: 'Preparação para exames', label: 'Preparação para exames' },
    ],
  },
  // Q13 — Hobbies e interesses (múltipla)
  {
    id: 14,
    type: 'cards-multiple',
    title: 'Hobbies',
    subtitle: 'Quais são as tuas áreas de interesse? (Podes escolher várias)',
    icon: Gamepad,
    options: [
      { value: 'Jogos',    label: 'Jogos' },
      { value: 'Desporto', label: 'Desporto' },
      { value: 'Música',   label: 'Música' },
      { value: 'Leitura',  label: 'Leitura' },
      { value: 'Cinema',   label: 'Cinema' },
      { value: 'Outros',   label: 'Outros' },
    ],
  },
  // Q14 — Perfil de aluno disponível para acompanhar (múltipla)
  {
    id: 15,
    type: 'cards-multiple',
    title: 'Perfil de aluno',
    subtitle: 'A que tipo de aluno estás disponível para dar aulas? (Podes escolher várias)',
    icon: User,
    options: [
      { value: 'nenhuma',      label: 'Sem necessidades específicas' },
      { value: 'dificuldades', label: 'Dificuldades de Aprendizagem' },
      { value: 'deficiencia',  label: 'Aprendizagem condicionada por deficiência' },
    ],
  },
]

//-----------------HELPERS DE NAVEGAÇÃO COM SKIP-----------------
function shouldSkipStep(step: number, currentAnswers: Record<string, any>): boolean {
  const q = questions[step]
  return 'skipIf' in q && typeof (q as any).skipIf === 'function' && (q as any).skipIf(currentAnswers)
}

function getNextStep(from: number, currentAnswers: Record<string, any>): number {
  let next = from + 1
  while (next < questions.length && shouldSkipStep(next, currentAnswers)) next++
  return next
}

function getPrevStep(from: number, currentAnswers: Record<string, any>): number {
  let prev = from - 1
  while (prev >= 0 && shouldSkipStep(prev, currentAnswers)) prev--
  return Math.max(0, prev)
}

//-----------------COMPONENTE PRINCIPAL-----------------
export const TutorQuestionnaire = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [sessionId] = useState(() => crypto.randomUUID())
  const [showAuth, setShowAuth] = useState(false)
  // Controlo do colapso da localização (Distrito → Município → Freguesia)
  const [districtCollapsed, setDistrictCollapsed] = useState(false)
  const [municipalityCollapsed, setMunicipalityCollapsed] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  //-----------------HANDLE ANSWER-----------------
  const handleAnswer = async (questionId: number, answer: any) => {
    const newAnswers = { ...answers, [`question_${questionId}_answer`]: answer }
    setAnswers(newAnswers)

    // Auto-avançar para perguntas de seleção única
    // cards-with-other avança automaticamente exceto quando o utilizador escolhe "Outro"
    const q = questions.find(q => q.id === questionId)
    if (q && (
      ['cards', 'single-choice-cards'].includes(q.type) ||
      (q.type === 'cards-with-other' && answer !== 'Outro')
    )) {
      const nextStep = getNextStep(currentStep, newAnswers)
      setTimeout(() => {
        if (nextStep < questions.length) setCurrentStep(nextStep)
        else setShowAuth(true)
      }, 300)
    }

    try {
      logSupabase('UPSERT temp_tutores', { session_id: sessionId })
      const { data, error } = await supabase
        .from('temp_tutores')
        .upsert({
          session_id: sessionId,
          question_1_answer: newAnswers['question_1_answer'] || '',
          raw_answers: newAnswers,
        }, { onConflict: 'session_id' })
      if (error) throw error
      logSupabase('UPSERT temp_tutores OK', data)
    } catch (err) {
      console.warn('⚠️ Erro ao salvar temporário:', err)
    }
  }

  //-----------------HANDLE REGISTRATION COMPLETE-----------------
  const handleRegistrationComplete = async (userId: string) => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      const rawAnswers = { ...answers }

      const education = rawAnswers['question_12_answer'] === 'Outro'
        ? (rawAnswers['question_12_other'] || 'Outro')
        : (rawAnswers['question_12_answer'] || null)

      const experience = rawAnswers['question_2_answer'] === 'Sim'
        ? `${rawAnswers['question_2_extra'] || 0} anos`
        : 'Sem experiência'

      const tutorData = {
        user_id: userId,
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        bio: '',
        profile_picture: '',
        question_1_answer: rawAnswers['question_1_answer'] || null,
        raw_answers: rawAnswers,
        // Semantic columns — indexed for marketplace filtering and matching
        class_type: rawAnswers['question_1_answer'] || [],
        teaching_levels: rawAnswers['question_3_answer'] || [],
        subjects: rawAnswers['question_4_answer'] || [],
        sessions_per_week: rawAnswers['question_5_answer'] || null,
        hourly_rate: rawAnswers['question_6_answer'] || null,
        schedule: rawAnswers['question_7_answer'] || null,
        modalities: rawAnswers['question_8_answer'] || [],
        location: rawAnswers['question_9_answer'] || null,
        municipality: rawAnswers['question_9_municipality'] || null,
        parish: rawAnswers['question_9_parish'] || null,
        study_center: rawAnswers['question_10_answer'] || null,
        accepted_objectives: rawAnswers['question_11_answer'] || [],
        teaching_approach: rawAnswers['question_13_answer'] || [],
        hobbies: rawAnswers['question_14_answer'] || [],
        accepted_profiles: rawAnswers['question_15_answer'] || [],
        experience,
        education,
      }

      // Upsert por user_id: se o tutor já tinha perfil, atualiza as respostas
      const { error } = await supabase
        .from('tutores')
        .upsert(tutorData, { onConflict: 'user_id' })
      if (error) throw error

      supabase.from('temp_tutores').delete().eq('session_id', sessionId)
    } catch (err: any) {
      console.error('❌ Erro ao completar registo:', err)
      alert(`Erro ao guardar perfil: ${err?.message || err}`)
    } finally {
      navigate('/profile')
    }
  }

  //-----------------GO BACK-----------------
  const goBack = () => {
    const prev = getPrevStep(currentStep, answers)
    if (prev >= 0) setCurrentStep(prev)
  }

  //-----------------RENDER STEP CONTENT-----------------
  const renderStepContent = (question: Question): React.ReactNode => {
    switch (question.type) {

      // ── CARDS (seleção única, auto-avança) ──────────────────────────────
      case 'cards':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-primary" />}
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
                      ? 'border-primary bg-tutor-green-light'
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

      // ── CARDS MÚLTIPLA ───────────────────────────────────────────────────
      case 'cards-multiple': {
        const selectedValues: string[] = Array.isArray(answers[`question_${question.id}_answer`])
          ? answers[`question_${question.id}_answer`]
          : []
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-primary" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
              <span className="inline-block mt-3 px-3 py-1 text-xs font-medium bg-primary/15 text-primary rounded-full">
                Podes selecionar mais do que uma opção
              </span>
            </div>
            <div className="grid gap-3">
              {question.options.map(option => {
                const isSelected = selectedValues.includes(option.value)
                const Icon = option.icon
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
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {Icon && <Icon className="w-5 h-5 text-gray-500 flex-shrink-0" />}
                      <div>
                        <div>{option.label}</div>
                        {option.description && <div className="text-sm text-gray-500">{option.description}</div>}
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-primary flex-shrink-0 ml-2" />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      }

      // ── CARDS COM OUTRO ──────────────────────────────────────────────────
      case 'cards-with-other':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-primary" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
            </div>
            <div className="grid gap-3">
              {[...question.options, { value: 'Outro', label: 'Outro (especificar)' }].map(option => (
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
                onChange={e => setAnswers(prev => ({ ...prev, [`question_${question.id}_other`]: e.target.value }))}
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none text-lg"
              />
            )}
          </div>
        )

      // ── SIM / NÃO COM CAMPO EXTRA (inline, numérico) ─────────────────────
      case 'yes-no-with-extra':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">{question.title}</h2>
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
                onChange={e => setAnswers(prev => ({ ...prev, [`question_${question.id}_extra`]: e.target.value }))}
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none text-lg"
              />
            )}
          </div>
        )

      // ── GRELHA DE DISPONIBILIDADE ────────────────────────────────────────
      case 'availability-grid': {
        const slotTimes: Record<string, string> = {
          'Manhã': '07h–12h',
          'Tarde': '12h–18h',
          'Noite': '18h–23h',
        }
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-primary" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
            </div>
            <div className="flex justify-end gap-4 text-xs text-gray-500 mb-1 pr-1">
              {(['Manhã', 'Tarde', 'Noite'] as const).map(slot => (
                <span key={slot}>
                  <span className="font-medium text-gray-700">{slot}</span> {slotTimes[slot]}
                </span>
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
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
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

      // ── SINGLE CHOICE CARDS (auto-avança) ───────────────────────────────
      case 'single-choice-cards': {
        const selectedValue = answers[`question_${question.id}_answer`] || ''
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-primary" />}
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
                        ? 'border-primary bg-tutor-green-light text-foreground'
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

      // ── LOCALIZAÇÃO (Distrito → Município → Freguesia em cascata) ────────
      case 'location-screen': {
        // Keys são geradas a partir do id da pergunta para serem genéricas
        const districtKey    = `question_${question.id}_answer`
        const municipalityKey = `question_${question.id}_municipality`
        const parishKey      = `question_${question.id}_parish`

        const selectedDistrict    = answers[districtKey] || ''
        const selectedMunicipality = answers[municipalityKey] || ''
        const selectedParish      = answers[parishKey] || ''
        const municipalities = selectedDistrict ? getMunicipiosByDistrito(selectedDistrict) : []
        const parishes = selectedMunicipality ? getFreguesiasByMunicipio(selectedDistrict, selectedMunicipality) : []

        return (
          <div className="space-y-8">
            <div className="text-center mb-6">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-primary" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
            </div>

            {/* Distrito */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Distrito</p>
                {selectedDistrict && districtCollapsed && (
                  <button
                    onClick={() => {
                      setDistrictCollapsed(false)
                      setMunicipalityCollapsed(false)
                      setAnswers(prev => ({
                        ...prev,
                        [districtKey]: '',
                        [municipalityKey]: undefined,
                        [parishKey]: undefined,
                      }))
                    }}
                    className="text-xs text-primary underline"
                  >
                    Alterar
                  </button>
                )}
              </div>
              {districtCollapsed && selectedDistrict ? (
                <div className="w-full p-3 rounded-lg border-2 border-primary bg-tutor-green-light text-foreground font-medium text-sm">
                  {selectedDistrict}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-64 overflow-y-auto pr-1">
                  {getDistritos().map(d => (
                    <button
                      key={d}
                      onClick={() => {
                        setAnswers(prev => ({
                          ...prev,
                          [districtKey]: d,
                          [municipalityKey]: undefined,
                          [parishKey]: undefined,
                        }))
                        setDistrictCollapsed(true)
                        setMunicipalityCollapsed(false)
                      }}
                      className={`p-3 rounded-lg border-2 text-left text-sm transition-colors ${
                        selectedDistrict === d
                          ? 'border-primary bg-tutor-green-light text-foreground font-medium'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Município */}
            {selectedDistrict && districtCollapsed && municipalities.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Município</p>
                  {selectedMunicipality && municipalityCollapsed && (
                    <button
                      onClick={() => {
                        setMunicipalityCollapsed(false)
                        setAnswers(prev => ({ ...prev, [municipalityKey]: undefined, [parishKey]: undefined }))
                      }}
                      className="text-xs text-primary underline"
                    >
                      Alterar
                    </button>
                  )}
                </div>
                {municipalityCollapsed && selectedMunicipality ? (
                  <div className="w-full p-3 rounded-lg border-2 border-primary bg-tutor-green-light text-foreground font-medium text-sm">
                    {selectedMunicipality}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {municipalities.map(m => (
                      <button
                        key={m}
                        onClick={() => {
                          setAnswers(prev => ({ ...prev, [municipalityKey]: m, [parishKey]: undefined }))
                          setMunicipalityCollapsed(true)
                        }}
                        className={`p-3 rounded-lg border-2 text-left text-sm transition-colors ${
                          selectedMunicipality === m
                            ? 'border-primary bg-tutor-green-light text-foreground font-medium'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Freguesia */}
            {selectedMunicipality && municipalityCollapsed && parishes.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Freguesia</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {parishes.map(p => (
                    <button
                      key={p}
                      onClick={() => {
                        setAnswers(prev => ({ ...prev, [parishKey]: p }))
                        // Auto-avança após selecionar a freguesia
                        const next = getNextStep(currentStep, { ...answers, [parishKey]: p })
                        setTimeout(() => {
                          if (next < questions.length) setCurrentStep(next)
                          else setShowAuth(true)
                        }, 300)
                      }}
                      className={`p-3 rounded-lg border-2 text-left text-sm transition-colors ${
                        selectedParish === p
                          ? 'border-primary bg-tutor-green-light text-foreground font-medium'
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

      // ── TEXT INPUT ───────────────────────────────────────────────────────
      case 'text-input':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-primary" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
            </div>
            <input
              type="text"
              placeholder={question.placeholder || ''}
              value={answers[`question_${question.id}_answer`] || ''}
              onChange={e => handleAnswer(question.id, e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-4 text-base focus:outline-none focus:border-primary"
            />
          </div>
        )

      // ── SELETOR DE DISCIPLINAS POR NÍVEL (tutor) ─────────────────────────
      case 'tutor-subject-picker': {
        const selectedLevels: string[] = Array.isArray(answers['question_3_answer'])
          ? answers['question_3_answer']
          : []
        const selectedSubjects: string[] = Array.isArray(answers[`question_${question.id}_answer`])
          ? answers[`question_${question.id}_answer`]
          : []

        const subjectGroups = getSubjectsForLevels(selectedLevels)

        const toggle = (subject: string) => {
          const next = selectedSubjects.includes(subject)
            ? selectedSubjects.filter(v => v !== subject)
            : [...selectedSubjects, subject]
          handleAnswer(question.id, next)
        }

        const renderSubjectButton = (subject: string) => {
          const isSelected = selectedSubjects.includes(subject)
          return (
            <button
              key={subject}
              onClick={() => toggle(subject)}
              className={`p-3 rounded-lg border-2 text-left text-sm font-medium transition-colors flex justify-between items-center ${
                isSelected
                  ? 'border-primary bg-tutor-green-light text-foreground'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>{subject}</span>
              {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0 ml-2" />}
            </button>
          )
        }

        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              {question.icon && <question.icon className="w-12 h-12 mx-auto mb-4 text-primary" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.subtitle && <p className="text-gray-600 mt-2">{question.subtitle}</p>}
              <span className="inline-block mt-3 px-3 py-1 text-xs font-medium bg-primary/15 text-primary rounded-full">
                Podes selecionar mais do que uma opção
              </span>
            </div>

            {subjectGroups.length === 0 ? (
              <p className="text-center text-gray-400 text-sm">
                Volta atrás e seleciona pelo menos um nível de ensino.
              </p>
            ) : subjectGroups.length === 1 ? (
              // Nível único: lista plana
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {subjectGroups[0].subjects.map(renderSubjectButton)}
              </div>
            ) : (
              // Múltiplos níveis: agrupado por nível
              <div className="space-y-6">
                {subjectGroups.map(({ level, subjects }) => (
                  <div key={level}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{level}</p>
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
    const question = questions[currentStep]
    const answer = answers[`question_${question.id}_answer`]

    switch (question.type) {
      case 'yes-no-with-extra':
        if (!answer) return true
        if (answer === 'Sim') {
          const extra = answers[`question_${question.id}_extra`]
          return !extra || String(extra).trim() === ''
        }
        return false

      case 'cards-with-other':
        if (!answer) return true
        if (answer === 'Outro') {
          const other = answers[`question_${question.id}_other`]
          return !other || String(other).trim() === ''
        }
        return false

      case 'text-input':
        return !answer || String(answer).trim() === ''

      case 'location-screen':
        // É suficiente ter o distrito selecionado para avançar
        return !answers[`question_${question.id}_answer`]

      case 'availability-grid':
        // Opcional — pode avançar sem nenhum slot selecionado
        return false

      case 'tutor-subject-picker':
      case 'cards-multiple':
        return !answer || (Array.isArray(answer) && answer.length === 0)

      default:
        // cards e single-choice-cards auto-avançam; Next raramente necessário
        return answer === undefined
    }
  }

  //-----------------RENDER COMPONENT-----------------
  if (showAuth) {
    return (
      <AuthModal
        onComplete={handleRegistrationComplete}
        title="Finaliza o teu registo"
        subtitle="Cria a tua conta para publicar o teu perfil de explicador"
        variant="tutor"
      />
    )
  }

  // Progresso baseado nos passos visíveis (exclui steps com skipIf ativo)
  const visibleTotal = questions.filter((_, idx) => !shouldSkipStep(idx, answers)).length
  const visibleCurrent = questions
    .slice(0, currentStep + 1)
    .filter((_, idx) => !shouldSkipStep(idx, answers)).length
  const progress = (visibleCurrent / visibleTotal) * 100

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 py-8 px-4">
          <div className="max-w-4xl mx-auto">

            {/* Barra de progresso */}
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
                Pergunta {visibleCurrent} de {visibleTotal}
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
                  {renderStepContent(questions[currentStep])}

                  <div className="flex justify-between mt-8">
                    <Button variant="outline" onClick={goBack} disabled={currentStep === 0}>
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>

                    <Button
                      onClick={() => {
                        const next = getNextStep(currentStep, answers)
                        if (next < questions.length) setCurrentStep(next)
                        else setShowAuth(true)
                      }}
                      disabled={isNextDisabled()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
    </>
  )
}

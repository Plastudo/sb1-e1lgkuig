//-----------------STUDENT QUESTIONNAIRE-----------------
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { supabase } from '../lib/supabase'
import { ChevronRight, ChevronLeft, Check, BookOpen, GraduationCap, User, Building, Gamepad, Calendar, Monitor, Home, Target, MapPin, GripVertical } from 'lucide-react'
import { getDistritos, getMunicipiosByDistrito, getFreguesiasByMunicipio } from '../data/locationMap'
import { getBestTutorMatches, TutorMatch } from '../Functions/BestFitTutors'
import { Footer } from './Footer'

// -----------------QUESTION TYPES-----------------
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

//-----------------ARRAY DE PERGUNTAS (ESTUDANTES)-----------------
const questions: Question[] = [
  // Equivalent to Q1
  { 
    id: 1,
    type: 'cards',
    title: 'Como preferes ter as explicações?',
    options: [
      { value: 'individual', label: 'Individual', icon: User },
      { value: 'grupo', label: 'Centro de estudos / grupo', icon: Building }
    ]
  },
  // Equivalent to Q2
  {
    id: 2,
    type: 'cards',
    title: 'Qual a fase escolar?',
    icon: GraduationCap,
    options: [
      { value: 'Ensino Básico', label: 'Ensino Básico' },
      { value: 'Ensino Secundário', label: 'Ensino Secundário' },
      { value: 'Ensino Superior', label: 'Ensino Superior' },
      { value: 'Cursos profissionais', label: 'Cursos profissionais' },
      { value: 'Outros', label: 'Outros' }
    ]
  },
  // Equivalent "Qual o ciclo" (Conditional for Ensino Básico)
  {
    id: 3,
    type: 'conditional',
    dependsOn: 2,
    conditions: [
      {
        value: 'Ensino Básico',
        question: {
          id: 3,
          type: 'cards',
          title: 'Qual o ciclo?',
          icon: GraduationCap,
          options: [
            { value: '1º ciclo', label: '1º ciclo' },
            { value: '2º ciclo', label: '2º ciclo' },
            { value: '3º ciclo', label: '3º ciclo' }
          ]
        }
      },
      // Bypass fallback
      {
        value: '',
        question: {
          id: 3,
          type: 'cards',
          title: 'Avançar (Não aplicável)',
          options: [{ value: 'n/a', label: 'Prosseguir' }]
        }
      }
    ]
  },
  // Equivalent to Q4 & Q5 combination
  {
    id: 5,
    type: 'cards-multiple',
    title: 'Que disciplinas procuras?',
    subtitle: 'Podes escolher várias',
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
  // Equivalent to Q6
  {
    id: 6,
    type: 'cards',
    title: 'Quantas horas por semana precisas?',
    tooltip: "Caso tenhas escolhido diversas disciplinas, deves colocar o total de horas da soma de todas as disciplinas",
    options: [
      { value: '1-5', label: '1 a 5 horas' },
      { value: '6-10', label: '6 a 10 horas' },
      { value: '11-20', label: '11 a 20 horas' },
      { value: '21-30', label: '21 a 30 horas' },
      { value: '30+', label: 'Mais de 30 horas' }
    ]
  },
  // Equivalent to Q7
  {
    id: 7,
    type: 'cards',
    title: 'Qual é o teu orçamento por hora indicativo?',
    options: [
      { value: '5-10', label: '5€ – 10€ / hora' },
      { value: '10-15', label: '10€ – 15€ / hora' },
      { value: '15-20', label: '15€ – 20€ / hora' },
      { value: '20-30', label: '20€ – 30€ / hora' },
      { value: '30+', label: 'Mais de 30€ / hora' }
    ]
  },
  // Equivalent to Q8
  {
    id: 8,
    type: 'availability-grid',
    title: 'Disponibilidade',
    subtitle: 'Qual a tua disponibilidade para ter explicações?',
    icon: Calendar
  },
  // Equivalent to Q9
  {
    id: 9,
    type: 'single-choice-cards',
    title: 'Tipo de Explicação',
    subtitle: 'Onde preferes ter as aulas?',
    icon: Monitor,
    options: [
      { value: 'presencial', label: 'Presencial', description: 'O explicador vai à tua casa ou local combinado', icon: Home },
      { value: 'centro-estudo', label: 'Centro de Estudo', description: 'Numa instalação dedicada', icon: Building },
      { value: 'online', label: 'Online', description: 'Sessões virtuais por videochamada', icon: Monitor },
      { value: 'indiferente', label: 'Indiferente', description: 'Qualquer formato serve', icon: Target }
    ]
  },
  // Equivalent conditional Q10
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
          title: 'Plataforma preferida',
          icon: Monitor,
          options: [
            'Zoom', 'Google Meet', 'Microsoft Teams', 'Skype', 'Discord', 'Sem preferência'
          ].map(p => ({ value: p, label: p }))
        }
      },
      {
        value: 'centro-estudo',
        question: {
          id: 103,
          type: 'cards-with-other',
          title: 'Centro de Estudo',
          subtitle: 'Tens preferência por alguma zona?',
          icon: Building,
          options: [{ value: 'Outro', label: 'Especificar' }]
        }
      }
    ]
  },
  
  // Equivalent conditional Q11 (Município if presencial)
  {
    id: 11,
    type: 'conditional',
    dependsOn: 10,
    conditions: [
      {
        value: '',
        question: {
          id: 11,
          type: 'cards',
          title: 'Município',
          icon: MapPin,
          options: []
        }
      }
    ]
  },

  // Equivalent conditional Q12 (Freguesia if presencial)
  {
    id: 12,
    type: 'conditional',
    dependsOn: 11,
    conditions: [
      {
        value: '',
        question: {
          id: 12,
          type: 'cards',
          title: 'Freguesia',
          icon: MapPin,
          options: []
        }
      }
    ]
  },
  
  // Equivalent to Q15
  {
    id: 15,
    type: 'cards-multiple',
    title: 'Abordagem de Ensino',
    subtitle: 'Que método de ensino preferes?',
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
  // Equivalent to Q16
  {
    id: 16,
    type: 'cards-multiple',
    title: 'Hobbies',
    subtitle: 'Quais são os teus interesses/hobbies?',
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
  // Equivalent to Q17
  {
    id: 17,
    type: 'priority-list',
    title: 'Prioridades',
    subtitle: 'Ordena os fatores por importância para ti:',
    icon: Target,
    options: [
      { value: 'Qualidade do material', label: 'Qualidade do material' },
      { value: 'Experiência do explicador', label: 'Experiência do explicador' },
      { value: 'Flexibilidade de horário', label: 'Flexibilidade de horário' },
      { value: 'Preço', label: 'Preço' },
      { value: 'Método de ensino', label: 'Método de ensino' }
    ]
  }
]

//-----------------COMPONENTE PRINCIPAL-----------------
export const StudentQuestionnaire = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: any }>({})
  const [sessionId] = useState(() => crypto.randomUUID())
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [matched, setMatched] = useState<TutorMatch[]>([])
  const navigate = useNavigate()

  //-----------------HANDLE ANSWER-----------------
  const handleAnswer = async (questionId: number, answer: any) => {
    const newAnswers = {
      ...answers,
      [`question_${questionId}_answer`]: answer
    }
    setAnswers(newAnswers)

    try {
      logSupabase('UPSERT temp_students - START', { session_id: sessionId, ...newAnswers })
      const { data, error } = await supabase
        .from('temp_students')
        .upsert({ session_id: sessionId, ...newAnswers }, { onConflict: 'session_id' })
      if (error) throw error
      logSupabase('UPSERT temp_students - SUCCESS', data)
    } catch (error) {
      console.warn('⚠️ Erro ao salvar temporário:', error)
    }
  }

  //-----------------HANDLE FINISH QUESTIONNAIRE-----------------
  const handleFinish = async () => {
    setLoading(true)
    try {
       const matches = await getBestTutorMatches(answers as any)
       setMatched(matches)
       setShowResults(true)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  //-----------------GO BACK-----------------
  const goBack = () => {
    if (showResults) setShowResults(false)
    else if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
       setCurrentStep(prev => prev + 1)
    } else {
       handleFinish()
    }
  }

//-----------------RENDER QUESTION CONTENT-----------------
  // Esta função gerencia o fluxo de perguntas condicionais.
  // Algumas perguntas só aparecem ou mudam a sua estrutura de opções (Dropdown) com base em respostas prévias.
  const renderQuestionContent = (question: Question): React.ReactNode => {
    if (question.type === 'conditional') {
      const cq = question as ConditionalQuestion
      const parentAnswerKey = `question_${cq.dependsOn}_answer` // A resposta da qual esta pergunta depende
      const parentAnswer = answers[parentAnswerKey]
  
      // Fallback: se o aluno não tiver respondido "Ensino Básico", avança a pergunta sobre o ciclo de estudos da primária/básico
      if (!parentAnswer && question.id === 3) {
        return renderStepContent(cq.conditions.find(c => c.value === '')?.question as Question)
      }
  
      // Procura a condição correspondente à resposta anterior
      const condition =
        cq.conditions.find(c => c.value === parentAnswer) || cq.conditions[0]
  
      // 🔹 Lógica dinâmica para Distritos, Municípios e Freguesias
      // O array de options das perguntas 11 (Município) e 12 (Freguesia) são preenchidos
      // com base no array retornado pelas funções de mapa de localização e a resposta base (parent).
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
  
      // Chamada recursiva para caso haja condições aninhadas dentro umas das outras
      return renderQuestionContent(condition.question)
    }
  
    // Se não for condicional, passa logo para o renderizador de UI normal
    return renderStepContent(question)
  }

  //-----------------RENDER STEP CONTENT-----------------
  // Este Switch Case é o coração da interface do Questionário (tanto aluno como tutor).
  // Consoante o `type` da pergunta configurada no array inicial `questions`, 
  // ele devolve a interface apropriada para recolher a resposta.
  const renderStepContent = (question: Question) => {
    switch (question.type) {
      case 'cards':
        // 🔹 Cartões de escolha única (ex: Fase escolar)
        return (
        <div className="space-y-6 flex flex-col items-center">
          <div className="text-center mb-8 flex flex-col items-center justify-center gap-2 relative">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{question.title}</h2>
              {question.tooltip && (
                <div className="group relative flex items-center justify-center cursor-help">
                  <div className="w-5 h-5 rounded-full bg-student-yellow-light text-accent flex items-center justify-center text-xs font-bold ring-2 ring-student-yellow-light/50">?</div>
                  <div className="absolute bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-50 transition-opacity duration-200 opacity-0 group-hover:opacity-100 left-1/2 -translate-x-1/2 text-center pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-900">
                    {question.tooltip}
                  </div>
                </div>
              )}
            </div>
            {question.subtitle && <p className="text-gray-600">{question.subtitle}</p>}
          </div>
          <div className="grid gap-4 w-full">
            {question.options.map(option => (
              <button
                key={option.value}
                onClick={() => handleAnswer(question.id, option.value)}
                className={`p-4 rounded-xl border-2 text-left w-full ${
                  answers[`question_${question.id}_answer`] === option.value
                    ? 'border-accent bg-student-yellow-light'
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
        // 🔹 Cartões que oferecem a opção "Outros", revelando um campo de input de texto adicional
        return (
        <div className="space-y-6">
          <div className="text-center mb-8 flex flex-col items-center justify-center gap-2">
             <div className="flex items-center gap-2">
               {question.icon && <question.icon className="w-8 h-8 text-accent" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
               {question.tooltip && (
                <div className="group relative flex items-center justify-center cursor-help">
                  <div className="w-5 h-5 rounded-full bg-student-yellow-light text-accent flex items-center justify-center text-xs font-bold ring-2 ring-student-yellow-light/50">?</div>
                  <div className="absolute bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-50 transition-opacity duration-200 opacity-0 group-hover:opacity-100 left-1/2 -translate-x-1/2 text-center pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-gray-900">
                    {question.tooltip}
                  </div>
                </div>
              )}
            </div>
            {question.subtitle && <p className="text-gray-600">{question.subtitle}</p>}
          </div>

          <div className="grid gap-3">
            {question.options.map(option => (
              <button
                key={option.value}
                onClick={() => handleAnswer(question.id, option.value)}
                className={`p-4 rounded-lg border-2 text-left ${
                  answers[`question_${question.id}_answer`] === option.value
                    ? 'border-accent bg-student-yellow-light'
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
              placeholder="Especificar"
              value={answers[`question_${question.id}_other`] || ''}
              onChange={e =>
                setAnswers(prev => ({
                  ...prev,
                  [`question_${question.id}_other`]: e.target.value
                }))
              }
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none text-lg"
            />
          )}
        </div>
      )

      case 'yes-no-with-extra':
        // 🔹 Respostas binárias (Sim/Não) com input adicional condicional se responderem "Sim"
        return (
        <div className="space-y-6">
          <div className="text-center mb-8 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{question.title}</h2>
            </div>
            {question.subtitle && <p className="text-gray-600">{question.subtitle}</p>}
          </div>

          <div className="grid gap-3">
            {['Sim', 'Não'].map(option => (
              <button
                key={option}
                onClick={() => handleAnswer(question.id, option)}
                className={`p-4 rounded-lg border-2 text-left ${
                  answers[`question_${question.id}_answer`] === option
                    ? 'border-accent bg-student-yellow-light'
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
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none text-lg"
            />
          )}
        </div>
      )

      case 'cards-multiple':
        // 🔹 Cartões de resposta múltipla (o aluno pode selecionar N opções e clica noutra para desmarcar; ex: Hobbies)
        const selectedValues: string[] = Array.isArray(answers[`question_${question.id}_answer`])
        ? answers[`question_${question.id}_answer`]
        : []

      return (
        <div className="space-y-6">
          <div className="text-center mb-8 flex flex-col items-center justify-center gap-2">
             <div className="flex items-center gap-2">
              {question.icon && <question.icon className="w-8 h-8 text-accent" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
            </div>
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
                      ? 'border-accent bg-student-yellow-light text-foreground'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-5 h-5 text-accent" />}
                </button>
              )
            })}
          </div>
        </div>
      )

      case 'availability-grid':
        // 🔹 Componente custom de grelha (Tabela 7x3) para colher as manhãs/tardes/noites de segunda a domingo
        return (
        <div className="space-y-6">
          <div className="text-center mb-8 flex flex-col items-center justify-center gap-2">
             <div className="flex items-center gap-2">
              {question.icon && <question.icon className="w-8 h-8 text-accent" />}
              <h2 className="text-2xl font-bold">{question.title}</h2>
            </div>
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
                          isSelected ? 'bg-accent text-foreground' : 'bg-gray-100 hover:bg-gray-200'
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
  // 🔹 Igual aos 'cards' mas alinha os ícones e texto descritivo por debaixo do título, ideal para caixas compridas explicativas
  const selectedValue: string = answers[`question_${question.id}_answer`] || ''

  return (
    <div className="space-y-6">
      <div className="text-center mb-8 flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          {question.icon && <question.icon className="w-8 h-8 text-accent" />}
          <h2 className="text-2xl font-bold">{question.title}</h2>
        </div>
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
                  ? 'border-accent bg-student-yellow-light text-foreground'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                 {option.icon && <option.icon className="w-5 h-5" />}
                 <span className="font-medium">{option.label}</span>
              </div>
              {option.description && <span className="text-gray-500 text-sm ml-7">{option.description}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )

  case 'priority-list':
  // 🔹 Uma lista de blocos interativos formatados para drag-and-drop nativo HTML5 para ranquear elementos por ordem desejada
  const prioridades: string[] =
    answers[`question_${question.id}_answer`] && Array.isArray(answers[`question_${question.id}_answer`])
      ? answers[`question_${question.id}_answer`]
      : question.options.map(opt => opt.value)

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
      <div className="text-center mb-8 flex flex-col items-center justify-center gap-2">
         <div className="flex items-center gap-2">
           {question.icon && <question.icon className="w-8 h-8 text-emerald-500" />}
           <h2 className="text-2xl font-bold text-gray-800">{question.title}</h2>
         </div>
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

      <div className="mt-4 p-3 bg-student-yellow-light rounded-lg">
        <p className="text-sm text-foreground">
          💡 Arrasta os itens para reordenar por prioridade (1 = mais importante)
        </p>
      </div>
    </div>
  )
    default:
      return null
  }
}

  return (
    <div className="min-h-screen bg-background flex flex-col">


      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8" style={{ position: 'relative', zIndex: 1 }}>
      <div className="max-w-3xl mx-auto">
        {!showResults ? (
          <>
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Passo {currentStep + 1} de {questions.length}</span>
                <span>{Math.round(((currentStep + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <Card className="p-8 shadow-xl rounded-2xl border border-border/50 bg-white/80 backdrop-blur-sm min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderQuestionContent(questions[currentStep])}
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 pt-6 border-t flex justify-between">
                <Button
                  variant="outline"
                  onClick={goBack}
                  disabled={currentStep === 0}
                  className="w-32"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                
                <Button
                  onClick={handleNext}
                  className="w-32 bg-accent hover:bg-accent/90 text-foreground"
                  disabled={loading}
                >
                  {loading ? 'A processar...' : (currentStep === questions.length - 1 ? 'Concluir' : 'Próximo')}
                  {!loading && currentStep < questions.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </Card>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-student-yellow-light text-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Questionário Concluído!</h2>
            <p className="text-gray-600 text-lg mb-8">
               A analisar os teus matches ideais...
            </p>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="mt-4"
            >
              Voltar ao Início
            </Button>
            
            {matched && matched.length > 0 && (
                <div className="mt-12 text-left">
                  <h3 className="text-2xl font-bold mb-4 text-center">Os teus matches</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {matched.map((t: any) => (
                        <Card key={t.tutorId} className="p-6">
                            <h3 className="text-xl font-bold">{t.name}</h3>
                            <p className="text-gray-600">{t.subjects?.join(', ')}</p>
                            <div className="mt-4">
                              <span className="bg-student-yellow-light text-foreground text-xs font-semibold px-2.5 py-0.5 rounded">Match: {t.compatibility}%</span>
                            </div>
                        </Card>
                     ))}
                  </div>
                </div>
            )}
          </motion.div>
        )}
      </div>
      </div>
      <Footer />
    </div>
  )
}

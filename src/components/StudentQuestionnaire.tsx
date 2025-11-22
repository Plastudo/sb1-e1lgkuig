//-----------RESUMO----------------------------
//Este código cria um questionário interativo para estudantes numa aplicação feita com React.
//O questionário recolhe respostas do utilizador (por exemplo, em que área precisa de ajuda) e, no final, mostra uma lista de explicadores (tutores) que correspondem às suas preferências.
//Cada tutor é apresentado com o seu nome, foto, descrição e avaliação. O utilizador pode depois ver o perfil completo ou entrar em contacto por e-mail diretamente.

//--------- FLUXO DO CÒDIGO --------------------
//O código começa por importar bibliotecas e componentes necessários, como React, animações (Framer Motion) e ícones (Lucide).
//Define uma lista chamada questions com perguntas e opções de resposta (neste caso, apenas uma pergunta de exemplo).
//Define também uma lista chamada mockTutors com dados fictícios de explicadores (nome, disciplina, avaliação, foto, etc.).
//Cria o componente StudentQuestionnaire, que:
  //Usa o estado (useState) para guardar qual a pergunta atual, as respostas do utilizador e se os resultados devem ser mostrados.
  //Usa a função navigate (de React Router) para mudar de página ou perfil.
  //Define handleAnswer — uma função que guarda a resposta e avança para a próxima pergunta (ou mostra os resultados se for a última).
  //Define handleContactTutor — que abre um e-mail com uma mensagem pré-escrita para o tutor selecionado.
  //Define goBack — que permite voltar à pergunta anterior ou sair dos resultados.
//Se showResults for verdadeiro, o código mostra a lista de explicadores compatíveis, com animações e botões para ver o perfil ou contactar.
//Caso contrário, mostra o questionário com uma barra de progresso, as opções de resposta e um botão “Anterior”.

//---------CODE----------------

//---------IMPORTAÇÕES--------------------------
import React, { useState } from 'react'  
// React: biblioteca principal para criar interfaces.
// useState: hook que permite guardar e atualizar valores (estado) dentro de um componente.

import { useNavigate } from 'react-router-dom'  
// useNavigate: hook do React Router para navegar entre páginas sem recarregar o site.

import { motion, AnimatePresence } from 'framer-motion'  
// motion e AnimatePresence: ferramentas para criar animações suaves nas transições (entrada/saída de elementos).

import { Button } from './ui/button'  
// Componente de botão reutilizável com estilos definidos globalmente.

import { Card } from './ui/card'  
// Componente de cartão (usado como contêiner visual para perguntas e perfis de tutores).

import { ChevronRight, ChevronLeft, Check, Star, Mail } from 'lucide-react'  
// Ícones SVG prontos a usar, importados da biblioteca Lucide (muito leve e personalizável).

// === IMPORTAÇÕES SUPABASE + UUID ===
import { supabase, TempTutorData } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

//---------PERGUNTAS DO QUESTIONÁRIO------------
const questions = [
  {
    id: 1,  // ID único para identificar a pergunta.
    title: "Em que área precisa de ajuda?",  // Texto principal da pergunta.
    options: [  // Lista de respostas disponíveis.
      { value: "matematica", label: "A) Matemática e Ciências Exatas" },
      { value: "linguas", label: "B) Línguas e Literatura" },
      { value: "ciencias", label: "C) Ciências Naturais e Biologia" },
      { value: "humanas", label: "D) Ciências Humanas e Sociais" }
    ]
  },
   {
    id: 2,  // ID único para identificar a pergunta.
    title: "Qual a fase escolar?",  // Texto principal da pergunta.
    options: [  // Lista de respostas disponíveis.
      { value: "Básico", label: "A) Ensino Básico" },
      { value: "Secundário", label: "B) Ensino Secundário" },
      { value: "Superior", label: "C) Ensino Superior" }
    ]
  },
]

//---------DADOS FICTÍCIOS (EXPLICADORES)-------
const mockTutors = [
  {
    id: 1,
    name: "Ana Silva",
    subject: "Matemática",
    bio: "Professora experiente com 8 anos de ensino. Especializada em álgebra e cálculo.",
    rating: 4.9,  // Avaliação numérica
    email: "ana.silva@email.com",  // Email de contacto
    profilePicture: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
  },
  {
    id: 2,
    name: "João Santos",
    subject: "Física e Química",
    bio: "Engenheiro químico com paixão pelo ensino. Métodos práticos e eficazes.",
    rating: 4.8,
    email: "joao.santos@email.com",
    profilePicture: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
  },
  {
    id: 3,
    name: "Maria Costa",
    subject: "Biologia",
    bio: "Doutora em biologia molecular. Abordagem científica e didática personalizada.",
    rating: 4.9,
    email: "maria.costa@email.com",
    profilePicture: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
  }
]

//---------COMPONENTE PRINCIPAL-----------------
export const StudentQuestionnaire = () => {

  //-----ESTADOS DE CONTROLO-----
  const [currentQuestion, setCurrentQuestion] = useState(0)  
  // Guarda o índice da pergunta atual (começa em 0 → primeira pergunta).

  const [answers, setAnswers] = useState<Record<string, string>>({})  
  // Guarda as respostas do utilizador num objeto do tipo {question_1_answer: "matematica"}.

  const [showResults, setShowResults] = useState(false)  
  // Indica se o utilizador já completou o questionário e deve ver os resultados.

  const navigate = useNavigate()  
  // Permite redirecionar o utilizador para outras páginas (como /profile ou /marketplace).


  // === GERAR SESSION ID ÚNICO POR UTILIZADOR ===
  const sessionIdRef = useRef(uuidv4())

  // === FUNÇÃO PARA GUARDAR RESPOSTAS NO SUPABASE ===
  const saveAnswersToSupabase = async () => {
    const payload = {
      session_id: sessionIdRef.current,
      question_1_answer: answers.question_1_answer || null,
      question_2_answer: answers.question_2_answer || null,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('temp_students')
      .insert([payload])

    if (error) {
      console.error("Erro ao guardar respostas no Supabase:", error)
    } else {
      console.log("Respostas guardadas:", data)
    }
  }

  
  //-----FUNÇÃO: guardar resposta e avançar-----
  const handleAnswer = (questionId: number, answer: string) => {
    const newAnswers = { ...answers, [`question_${questionId}_answer`]: answer }
    setAnswers(newAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowResults(true)
      saveAnswersToSupabase()   // ← GUARDA AQUI
    }
  }

  //-----FUNÇÃO: abrir email de contacto-----
  const handleContactTutor = (email: string, tutorName: string) => {
    // Define o assunto e corpo do e-mail (codificados para URL).
    const subject = encodeURIComponent(`Interessado em explicações - Plastudo`)
    const body = encodeURIComponent(
      `Olá ${tutorName},\n\nEncontrei o seu perfil na Plastudo e estou interessado(a) nas suas explicações.\n\nPodemos conversar sobre disponibilidade e condições?\n\nObrigado(a)!`
    )
    // Abre o cliente de e-mail do utilizador com a mensagem pronta.
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  //-----FUNÇÃO: voltar atrás-----
  const goBack = () => {
    if (showResults) {  
      // Se estiver na tela de resultados, volta ao questionário.
      setShowResults(false)
      setCurrentQuestion(questions.length - 1)
    } else if (currentQuestion > 0) {  
      // Caso contrário, volta uma pergunta.
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  //-----SEÇÃO DE RESULTADOS (tutores compatíveis)-----
  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Cabeçalho com animação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Os seus matches perfeitos!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Baseado nas suas respostas, encontrámos estes explicadores ideais para si.
            </p>
            <Button variant="outline" onClick={goBack} className="mb-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar ao questionário
            </Button>
          </motion.div>

          {/* Grelha de cartões com tutores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {mockTutors.map((tutor, index) => (
              <motion.div
                key={tutor.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}  // Animação em cascata.
              >
                <Card className="p-6 h-full hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm">
                  <div className="text-center mb-4">
                    <img
                      src={tutor.profilePicture}
                      alt={tutor.name}
                      className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                    />
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {tutor.name}
                    </h3>
                    <p className="text-green-600 font-medium mb-2">{tutor.subject}</p>
                    <div className="flex items-center justify-center space-x-1 mb-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-700">{tutor.rating}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {tutor.bio}
                  </p>

                  <div className="space-y-2">
                    <Button
                      onClick={() => navigate(`/profile/${tutor.id}`)}
                      variant="outline"
                      className="w-full"
                    >
                      Ver perfil completo
                    </Button>
                    <Button
                      onClick={() => handleContactTutor(tutor.email, tutor.name)}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Contactar
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Secção final com botão extra */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <p className="text-gray-600 mb-4">Quer ver mais opções?</p>
            <Button
              onClick={() => navigate('/marketplace')}
              size="lg"
              variant="outline"
              className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
            >
              Explorar todos os explicadores
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  //-----CASO CONTRÁRIO: mostrar o questionário-----
  const question = questions[currentQuestion]  
  // Seleciona a pergunta atual pelo índice.

  const progress = ((currentQuestion + 1) / questions.length) * 100  
  // Calcula a percentagem de progresso (para a barra animada).

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Barra de progresso */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white rounded-full h-3 overflow-hidden shadow-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-green-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Pergunta {currentQuestion + 1} de {questions.length}
          </p>
        </motion.div>

        {/* Conteúdo da pergunta */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                {question.title}
              </h2>

              {/* Lista de opções */}
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
                      <span className="text-lg text-gray-700 group-hover:text-blue-700">
                        {option.label}
                      </span>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Botão "Anterior" e estado "Respondido" */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={goBack}
                  disabled={currentQuestion === 0}
                  className="flex items-center space-x-2"
                >
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

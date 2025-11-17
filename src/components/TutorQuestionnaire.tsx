//-----------------RESUMO GERAL-----------------
// Este código implementa um questionário interativo para tutores usando React e Supabase.
// O utilizador responde a perguntas sobre a sua área de expertise.
// As respostas são guardadas temporariamente no Supabase, e ao final é apresentado um modal
// de registo para finalizar o perfil de tutor.
// Inclui barra de progresso, navegação entre perguntas, feedback visual e animações com Framer Motion.

//-----------------IMPORTAÇÕES-----------------
import React, { useState } from 'react' // React e hooks para estado
import { useNavigate } from 'react-router-dom' // Para navegação entre páginas
import { motion, AnimatePresence } from 'framer-motion' // Biblioteca para animações suaves
import { Button } from './ui/button' // Componente de botão estilizado
import { Card } from './ui/card' // Componente Card para agrupar conteúdo
import { supabase, TempTutorData } from '../lib/supabase' // Supabase client e tipo de dados temporários
import { ChevronRight, ChevronLeft, Check } from 'lucide-react' // Ícones usados na UI
import { AuthModal } from './AuthModal' // Modal de autenticação/registro de utilizador

//-----------------PERGUNTAS DO QUESTIONÁRIO-----------------
// Array de perguntas do questionário com opções
const questions = [
  {
    id: 1, // Identificador único da pergunta
    title: "Qual é a sua área principal de expertise?", // Texto da pergunta
    options: [
      { value: "matematica", label: "A) Matemática e Ciências Exatas" },
      { value: "linguas", label: "B) Línguas e Literatura" },
      { value: "ciencias", label: "C) Ciências Naturais e Biologia" },
      { value: "humanas", label: "D) Ciências Humanas e Sociais" }
    ]
  }
]

//-----------------COMPONENTE PRINCIPAL-----------------
export const TutorQuestionnaire = () => {
  // Estado para controlar qual pergunta está ativa (índice do array)
  const [currentQuestion, setCurrentQuestion] = useState(0)

  // Estado para guardar respostas do utilizador; chave = 'question_X_answer', valor = resposta
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // ID único para identificar a sessão de questionário
  const [sessionId] = useState(() => crypto.randomUUID())

  // Estado para controlar se o modal de autenticação deve ser exibido
  const [showAuth, setShowAuth] = useState(false)

  // Estado para indicar se o questionário foi completado
  const [isCompleted, setIsCompleted] = useState(false)

  // Hook do React Router para navegar entre páginas
  const navigate = useNavigate()

  //-----------------FUNÇÃO DE RESPOSTA-----------------
  // Executa quando o utilizador seleciona uma opção
  const handleAnswer = async (questionId: number, answer: string) => {
    // Atualiza estado local de respostas
    const newAnswers = { ...answers, [`question_${questionId}_answer`]: answer }
    setAnswers(newAnswers)

    //---------------SALVA DADOS TEMPORÁRIOS NO SUPABASE---------------
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      // Verifica se Supabase está configurado corretamente
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('xyzcompany')) {
        console.warn('Supabase not configured, skipping temp data save')
      } else {
        // Cria objeto para guardar no Supabase
        const tempData: Omit<TempTutorData, 'id' | 'created_at'> = {
          session_id: sessionId, // ID da sessão
          question_1_answer: newAnswers.question_1_answer || '' // Resposta da primeira pergunta
        }

        // Upsert: insere ou atualiza os dados temporários na tabela 'temp_tutores'
        const { error } = await supabase
          .from('temp_tutores')
          .upsert(tempData, { onConflict: 'session_id', ignoreDuplicates: false })

        if (error) throw error
      }
    } catch (error) {
      console.warn('Error saving temp data (Supabase not configured properly):', error)
    }

    //---------------NAVEGAÇÃO ENTRE PERGUNTAS---------------
    if (currentQuestion < questions.length - 1) {
      // Passa para a próxima pergunta
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Se for a última pergunta, marca questionário como completo e mostra modal
      setIsCompleted(true)
      setShowAuth(true)
    }
  }

  //-----------------FUNÇÃO APÓS REGISTRO-----------------
  // Executa após o utilizador finalizar o registo no modal
  const handleRegistrationComplete = async (userId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('xyzcompany')) {
        console.warn('Supabase not configured, redirecting to profile')
        navigate('/profile') // Redireciona para perfil se Supabase não estiver configurado
        return
      }

      // Busca dados temporários da sessão no Supabase
      const { data: tempDataResult, error: fetchError } = await supabase
        .from('temp_tutores')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (fetchError || !tempDataResult) throw new Error('Failed to fetch temporary data')

      // Recupera dados do utilizador autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Failed to get user details')

      // Prepara dados finais para criar perfil de tutor
      const tutorData = {
        user_id: userId,
        name: user.user_metadata?.name || user.email?.split('@')[0] || '', // Nome do utilizador
        email: user.email || '',
        question_1_answer: tempDataResult.question_1_answer,
        bio: '', // Inicialmente vazio
        subjects: [], // Inicialmente vazio
        profile_picture: '' // Inicialmente vazio
      }

      // Insere dados permanentes do tutor
      const { error: insertError } = await supabase.from('tutores').insert(tutorData)
      if (insertError) throw new Error('Failed to create tutor profile')

      // Remove dados temporários
      await supabase.from('temp_tutores').delete().eq('session_id', sessionId)

      // Redireciona para a página de perfil
      navigate('/profile')
    } catch (error) {
      console.error('Error completing registration:', error)
    }
  }

  //-----------------FUNÇÃO DE VOLTAR-----------------
  const goBack = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1)
  }

  //-----------------MODAL DE AUTENTICAÇÃO-----------------
  // Se showAuth for true, renderiza modal de registro
  if (showAuth) {
    return (
      <AuthModal
        onComplete={handleRegistrationComplete}
        title="Complete o seu registo"
        subtitle="Crie a sua conta para finalizar o seu perfil de explicador"
      />
    )
  }

  // Pergunta e progresso atual
  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  //-----------------RENDERIZAÇÃO-----------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Barra de progresso */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} // Animação inicial
          animate={{ opacity: 1, y: 0 }} // Animação final
          className="mb-8"
        >
          <div className="bg-white rounded-full h-3 overflow-hidden shadow-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-green-400"
              initial={{ width: 0 }} // Começa vazio
              animate={{ width: `${progress}%` }} // Preenche de acordo com progresso
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Pergunta {currentQuestion + 1} de {questions.length} {/* Indica pergunta atual */}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion} // Re-renderiza animação ao trocar pergunta
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                {question.title} {/* Título da pergunta */}
              </h2>

              {/* Opções da pergunta */}
              <div className="space-y-4">
                {question.options.map((option, index) => (
                  <motion.button
                    key={option.value} // Chave única para React
                    initial={{ opacity: 0, y: 20 }} // Animação inicial
                    animate={{ opacity: 1, y: 0 }} // Animação final
                    transition={{ delay: index * 0.1 }} // Delay sequencial
                    onClick={() => handleAnswer(question.id, option.value)} // Função de resposta
                    className="w-full p-4 text-left border-2 border-gray-200 rounded-2xl hover:border-green-400 hover:bg-green-50 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg text-gray-700 group-hover:text-green-700">
                        {option.label} {/* Texto da opção */}
                      </span>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-500 transform group-hover:translate-x-1 transition-all" /> {/* Ícone de seta */}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Botões de navegação e status */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={goBack} // Volta para pergunta anterior
                  disabled={currentQuestion === 0} // Desativa se estiver na primeira pergunta
                  className="flex items-center space-x-2"
                >
                  <ChevronLeft className="h-4 w-4" /> {/* Ícone voltar */}
                  <span>Anterior</span>
                </Button>

                <div className="text-sm text-gray-500">
                  {answers[`question_${question.id}_answer`] && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <Check className="h-4 w-4" /> {/* Ícone de check */}
                      <span>Respondido</span> {/* Indica que a pergunta foi respondida */}
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

//-----------------RESUMO GERAL-----------------
//Este código cria a página de perfil do utilizador numa plataforma de ensino online.
//Ele mostra informações básicas do utilizador, como nome e email, e, se o utilizador também for tutor, mostra o seu perfil de explicador com área de expertise, disciplinas e biografia.
//Permite ao tutor navegar para a edição do seu perfil e oferece ações rápidas como explorar outros explicadores ou encontrar um explicador.
//Em produção, os dados do tutor são buscados a partir do Supabase, mas a interface já lida com estados de carregamento e casos em que o perfil não existe.

//-----------------FLUXO DO CÓDIGO-----------------
// 1. Importa React, hooks, navegação, animações, componentes de UI e ícones.
// 2. Cria o componente UserProfile e define estados: tutorProfile (perfil de tutor) e loading (carregamento da página).
// 3. useEffect verifica se o utilizador está logado e, se não estiver, redireciona para login. Se estiver, carrega o perfil do tutor.
// 4. loadTutorProfile busca os dados do tutor no Supabase filtrando pelo id do utilizador logado.
// 5. Trata erros caso não haja perfil de tutor ou ocorra outro problema na requisição.
// 6. Enquanto carrega os dados, exibe uma tela de carregamento com animação (skeleton screen).
// 7. Se não houver utilizador logado, retorna null (não mostra nada).
// 8. Renderiza o cartão de informações do utilizador (nome e email).
// 9. Se houver perfil de tutor, mostra detalhes do perfil: área de expertise, disciplinas e biografia, com botão para editar.
// 10. Caso não haja perfil de tutor, oferece botão para criar o perfil através de questionário. Inclui também um cartão de ações rápidas.

//-----------------CODE-----------------

//-----------------IMPORTAÇÕES-----------------
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { User, Edit, BookOpen, Mail } from 'lucide-react'

//-----------------TIPO LOCAL (IMPORTANTE)-----------------
// ⚠️ Este tipo NÃO vem do Supabase
// É apenas TypeScript para tipagem do estado
type TutorData = {
  id: string
  user_id: string
  name: string
  email: string
  question_1_answer?: string
  question_2_answer?: string
  question_3_answer?: string
  bio?: string
  subjects?: string[]
  profile_picture?: string
}

//-----------------COMPONENTE PRINCIPAL-----------------
export const UserProfile = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [tutorProfile, setTutorProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  //-----------------CARREGAR PERFIL-----------------
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
      return
    }

    if (user) {
      loadTutorProfile()
    }
  }, [user, authLoading, navigate])

  //-----------------FUNÇÃO LOAD-----------------
  const loadTutorProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('tutores')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setTutorProfile(data || null)
    } catch (error) {
      console.error('Erro ao carregar perfil de tutor:', error)
    } finally {
      setLoading(false)
    }
  }

  //-----------------LOADING-----------------
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
        <div className="max-w-4xl mx-auto px-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!user) return null

  //-----------------RENDER-----------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Cabeçalho */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">O meu perfil</h1>
          <p className="text-gray-600">Gerir a sua conta e informações</p>
        </motion.div>

        {/* Info do utilizador */}
        <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-green-400 flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {user.user_metadata?.name || user.email?.split('@')[0]}
              </h2>
              <div className="flex items-center text-gray-600 space-x-2">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Perfil de tutor */}
        {tutorProfile ? (
          <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                Perfil de Explicador
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/profile/${tutorProfile.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Área de expertise</p>
                <p className="font-medium">
                  {tutorProfile.question_1_answer}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Disciplinas</p>
                <p className="font-medium">
                  {tutorProfile.subjects?.join(', ') || 'A definir'}
                </p>
              </div>
            </div>

            {tutorProfile.bio && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Biografia</p>
                <p>{tutorProfile.bio}</p>
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-6 text-center bg-white/80 backdrop-blur-sm">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">
              Perfil de explicador não encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Complete o questionário para criar o seu perfil.
            </p>
            <Button
              onClick={() => navigate('/tutor-questionnaire')}
              className="bg-gradient-to-r from-green-500 to-blue-500"
            >
              Criar perfil de explicador
            </Button>
          </Card>
        )}

      </div>
    </div>
  )
}

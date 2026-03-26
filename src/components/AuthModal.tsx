//-----------RESUMO----------------------------
//Este código define um componente React chamado AuthModal, que mostra um formulário de autenticação (login ou registo). 
//Ele permite que o utilizador crie uma conta nova ou entre numa já existente, usando o email e a palavra-passe. 
//O código também lida com validação, erros, animações visuais e integração com a base de dados (Supabase).

//--------- FLUXO DO CÒDIGO --------------------
//O código importa React, Framer Motion, componentes de interface, contexto de autenticação e ícones.
//Cria o componente AuthModal, que permite ao utilizador criar conta ou iniciar sessão.
//Guarda estados como modo atual (login/registo), dados dos campos, visibilidade da palavra-passe, erros e carregamento.
//A função handleSubmit verifica a configuração do Supabase, tenta registar ou autenticar o utilizador e chama onComplete se for bem-sucedido.
//Mostra uma interface animada com campos de nome, email e palavra-passe, botão de envio com feedback visual e mensagens de erro.
//Inclui ainda um botão para alternar entre os modos de “Criar conta” e “Iniciar sessão”.

//---------CODE----------------
import React, { useState } from 'react'  // Importa o React e o hook useState
import { motion } from 'framer-motion'  // Importa a biblioteca Framer Motion
import { Card } from './ui/card'  // Caixa visual estilizada
import { Button } from './ui/button'  // Botão personalizado
import { Input } from './ui/input'  // Campo de texto
import { Label } from './ui/label'  // Texto descritivo para inputs
import { useAuth } from '../contexts/AuthContext'  // Contexto de autenticação
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'  // Ícones visuais
import { supabase } from '../lib/supabase'

interface AuthModalProps {
  onComplete: (userId: string) => void
  title?: string
  subtitle?: string
  variant?: 'tutor' | 'student' | 'default'
}

export const AuthModal = ({ onComplete, title, subtitle, variant = 'default' }: AuthModalProps) => {
  const isStudent = variant === 'student'
  const isTutor   = variant === 'tutor'

  const btnClass     = isStudent
    ? 'w-full bg-accent hover:bg-accent/90 text-foreground font-semibold'
    : 'w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold'
  const linkClass    = isStudent ? 'text-accent hover:text-accent/80' : 'text-primary hover:text-primary/80'
  const badgeClass   = isStudent
    ? 'inline-block px-3 py-1 rounded-full bg-student-yellow-light text-foreground text-xs font-semibold mb-3'
    : isTutor
      ? 'inline-block px-3 py-1 rounded-full bg-tutor-green-light text-primary text-xs font-semibold mb-3'
      : ''
  const [isSignUp, setIsSignUp] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signUp, signIn } = useAuth()

 const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  let result: any // declarar fora do try

  try {
    if (isSignUp) {
      result = await signUp(email, password)
      if (result.data?.user) {
        // Não cria registo vazio — o handleRegistrationComplete trata disso após login
        setIsSignUp(false)
        setError('')
      }
    } else {
      result = await signIn(email, password)
      if (result.data?.user) {
        onComplete(result.data.user.id)
      }
    }

    if (result?.error) throw result.error
  } catch (error: any) {
    setError(error.message || 'Ocorreu um erro. Tente novamente.')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-background py-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md px-4"
      >
        <Card className="p-8 shadow-xl rounded-2xl border border-border/50 bg-white/90 backdrop-blur-sm">
          <div className="text-center mb-6">
            {badgeClass && (
              <span className={badgeClass}>
                {isTutor ? 'Explicador' : 'Estudante'}
              </span>
            )}
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {title || (isSignUp ? 'Criar conta' : 'Iniciar sessão')}
            </h2>
            <p className="text-muted-foreground text-sm">
              {subtitle || (isSignUp ? 'Complete o seu registo para continuar' : 'Entre na sua conta')}
            </p>
          </div>

          {error && (
            // Se existir uma mensagem de erro
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
              {/* Mostra o texto do erro */}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Início do formulário */}
            {isSignUp && (
              // Campo Nome completo só no registo
              <div>
                <Label htmlFor="name">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  {/* Ícone de utilizador */}
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="O seu nome"
                    className="pl-10"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              {/* Campo de email */}
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                {/* Ícone de email */}
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              {/* Campo da palavra-passe */}
              <Label htmlFor="password">Palavra-passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                {/* Ícone de cadeado */}
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                  {/* Ícone de olho aberto/fechado */}
                </button>
              </div>
              {isSignUp && (
                // Dica mínima de caracteres
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              )}
            </div>

            <Button
              type="submit"
              className={btnClass}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isSignUp ? 'A criar conta...' : 'A iniciar sessão...'}
                </>
              ) : (
                isSignUp ? 'Criar conta' : 'Iniciar sessão'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            {/* Secção para alternar entre login e registo */}
            <p className="text-gray-600">
              {isSignUp ? 'Já tem uma conta?' : 'Não tem conta?'}
              {/* Pergunta adequada conforme o modo atual */}
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className={linkClass}
            >
              {isSignUp ? 'Iniciar sessão' : 'Criar conta'}
              {/* Botão que muda o modo */}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

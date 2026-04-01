import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { AuthModal } from './AuthModal'
import { BookOpen, GraduationCap, ArrowLeft } from 'lucide-react'

type LoginView = 'select' | 'tutor' | 'student'

export const Login: React.FC = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState<LoginView>('select')
  const didNavigate = useRef(false)

  // Só redireciona automaticamente se o utilizador JÁ estava autenticado ao abrir a página
  // (não quando faz login AGORA — esse caso é tratado por handleComplete)
  useEffect(() => {
    if (auth?.user && auth?.userRole && !didNavigate.current) {
      didNavigate.current = true
      if (auth.userRole === 'student') navigate('/dashboard/student-profile')
      else navigate('/dashboard/tutor-profile')
    }
  }, [auth?.userRole]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = (userId?: string) => {
    if (!userId) return
    didNavigate.current = true
    if (view === 'student') {
      localStorage.setItem('tutmait_role', 'student')
      navigate('/dashboard/student-profile')
    } else {
      localStorage.setItem('tutmait_role', 'tutor')
      navigate('/dashboard/tutor-profile')
    }
  }

  if (!auth) return <p>Carregando...</p>

  return (
    <div className="min-h-screen bg-background flex flex-col items-start justify-start pt-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-xl mx-auto"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-black text-foreground">TuTmait</Link>
          <p className="text-muted-foreground mt-1">A plataforma de explicações em Portugal</p>
        </div>

        <AnimatePresence mode="wait">

          {/* ── SELEÇÃO DE ROLE ─────────────────────────────────── */}
          {view === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-center text-muted-foreground mb-6">Como queres entrar?</p>
              <div className="grid grid-cols-2 gap-5">
                <button
                  onClick={() => setView('tutor')}
                  className="p-9 rounded-2xl border-2 border-primary/30 bg-tutor-green-light/30 hover:border-primary hover:bg-tutor-green-light/60 transition-all text-left"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-5">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-bold text-foreground text-lg">Explicador</p>
                  <p className="text-sm text-muted-foreground mt-1">Entrar ou criar conta</p>
                </button>

                <button
                  onClick={() => setView('student')}
                  className="p-9 rounded-2xl border-2 border-accent/30 bg-student-yellow-light/30 hover:border-accent hover:bg-student-yellow-light/60 transition-all text-left"
                >
                  <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-5">
                    <GraduationCap className="h-8 w-8 text-accent" />
                  </div>
                  <p className="font-bold text-foreground text-lg">Estudante</p>
                  <p className="text-sm text-muted-foreground mt-1">Entrar ou criar conta</p>
                </button>
              </div>
            </motion.div>
          )}

          {/* ── LOGIN EXPLICADOR ─────────────────────────────────── */}
          {view === 'tutor' && (
            <motion.div
              key="tutor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => setView('select')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <AuthModal
                modal
                defaultSignIn
                role="tutor"
                onComplete={handleComplete}
                title="Entrar como Explicador"
                subtitle="Acede ao teu perfil de explicador"
              />

              <p className="text-center text-sm text-muted-foreground mt-6">
                Ainda não tens conta?{' '}
                <button
                  onClick={() => navigate('/tutor-questionnaire')}
                  className="text-primary hover:underline font-semibold"
                >
                  Criar perfil de explicador
                </button>
              </p>
            </motion.div>
          )}

          {/* ── LOGIN ESTUDANTE ──────────────────────────────────── */}
          {view === 'student' && (
            <motion.div
              key="student"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => setView('select')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <AuthModal
                modal
                defaultSignIn
                role="student"
                onComplete={handleComplete}
                title="Entrar como Estudante"
                subtitle="Acede ao teu perfil de estudante"
              />

              <p className="text-center text-sm text-muted-foreground mt-6">
                Ainda não tens conta?{' '}
                <button
                  onClick={() => navigate('/student-questionnaire')}
                  className="text-accent hover:underline font-semibold"
                >
                  Encontrar um explicador
                </button>
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}

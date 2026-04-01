import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { BookOpen, GraduationCap, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export const DashboardRouter = () => {
  const { user, userRole, loading } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!loading) setChecking(false)
  }, [loading])

  const setRoleManual = async (role: 'student' | 'tutor') => {
    if (!user) return
    setChecking(true)
    
    // Save to metadata so it persists
    await supabase.auth.updateUser({ data: { role } }).catch(() => {})
    localStorage.setItem('tutmait_role', role)

    // Force reload context to pick it up or just navigate
    if (role === 'student') navigate('/dashboard/student-profile')
    else navigate('/dashboard/tutor-profile')
  }

  if (loading || checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">A analisar o teu perfil...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (userRole === 'student') return <Navigate to="/dashboard/student-profile" replace />
  if (userRole === 'tutor') return <Navigate to="/dashboard/tutor-profile" replace />

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-xl text-center border border-border/50"
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo(a)!</h2>
        <p className="text-muted-foreground mb-8">
          Ainda não escolheste como queres usar a plataforma. Define o teu perfil para continuar.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setRoleManual('student')}
            className="p-6 rounded-2xl border-2 border-accent/20 bg-student-yellow-light/30 hover:border-accent hover:bg-student-yellow-light/60 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap className="h-6 w-6 text-accent" />
            </div>
            <p className="font-bold text-foreground">Sou Estudante</p>
            <p className="text-xs text-muted-foreground mt-1">Quero encontrar um explicador para mim</p>
          </button>

          <button
            onClick={() => setRoleManual('tutor')}
            className="p-6 rounded-2xl border-2 border-primary/20 bg-tutor-green-light/30 hover:border-primary hover:bg-tutor-green-light/60 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <p className="font-bold text-foreground">Sou Explicador</p>
            <p className="text-xs text-muted-foreground mt-1">Quero dar aulas e partilhar conhecimento</p>
          </button>
        </div>
      </motion.div>
    </div>
  )
}

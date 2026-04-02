import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type UserRole = 'student' | 'tutor' | null

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  userRole: UserRole
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

async function detectRole(user: User): Promise<UserRole> {
  // 1. Metadados do Supabase (mais rápido)
  const metaRole = user.user_metadata?.role
  if (metaRole === 'student' || metaRole === 'tutor') {
    localStorage.setItem('tutmait_role', metaRole) // sempre sincronizar
    return metaRole
  }

  // 2. localStorage (set durante o fluxo de registo)
  const localRole = localStorage.getItem('tutmait_role')
  if (localRole === 'student' || localRole === 'tutor') return localRole as UserRole

  // 3. Consulta à base de dados (fallback para contas antigas)
  const [{ data: student }, { data: tutor }] = await Promise.all([
    supabase.from('students').select('user_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('tutores').select('user_id').eq('user_id', user.id).maybeSingle(),
  ])

  if (student) { localStorage.setItem('tutmait_role', 'student'); return 'student' }
  if (tutor)   { localStorage.setItem('tutmait_role', 'tutor');   return 'tutor'   }

  return null
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<UserRole>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[Auth] getSession →', session ? `user=${session.user.id}` : 'no session')
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const role = await detectRole(session.user)
        console.log('[Auth] getSession detectRole →', role)
        setUserRole(role)
      }
      console.log('[Auth] getSession setLoading(false)')
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[Auth] onAuthStateChange event=', _event, 'user=', session?.user?.id ?? 'none')
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const role = await detectRole(session.user)
        console.log('[Auth] onAuthStateChange detectRole →', role)
        setUserRole(role)
      } else {
        setUserRole(null)
      }
      console.log('[Auth] onAuthStateChange setLoading(false)')
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      return await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard/tutor-profile`,
          data: metadata
        }
      })
    } catch (error) {
      console.error('SignUp error:', error)
      return {
        data: { user: null, session: null },
        error: { message: 'Supabase não está configurado corretamente.' }
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      return await supabase.auth.signInWithPassword({ email, password })
    } catch (error) {
      console.error('SignIn error:', error)
      return {
        data: { user: null, session: null },
        error: { message: 'Supabase não está configurado corretamente.' }
      }
    }
  }

  const signOut = async () => {
    localStorage.removeItem('tutmait_role')
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

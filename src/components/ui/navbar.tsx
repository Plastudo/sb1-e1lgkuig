import { Link, useNavigate } from 'react-router-dom'
import { Button } from './button'
import { useAuth } from '../../contexts/AuthContext'
import { User, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'

const scrollTo = (sectionIndex: number) => {
  const el = document.querySelector(`section[data-s="${sectionIndex}"]`)
  el?.scrollIntoView({ behavior: 'smooth' })
}

export const Navbar = () => {
  const { user, userRole, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const resolvedRole = userRole || (localStorage.getItem('tutmait_role') as 'student' | 'tutor' | null)
  const profilePath = resolvedRole === 'student' ? '/dashboard/student-profile' : 
                      resolvedRole === 'tutor' ? '/dashboard/tutor-profile' : 
                      '/dashboard'

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{ backgroundColor: 'hsl(82 30% 10%)' }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="text-xl font-bold text-white tracking-tight">TuTmait</span>
          </Link>

          {/* Section nav — hidden on mobile */}
          <div className="hidden lg:flex items-center gap-1">
            {[
              { label: 'Como funciona', s: 1 },
              { label: 'Estudantes', s: 2 },
              { label: 'Explicadores', s: 3 },
              { label: 'Roadmap', s: 4 },
            ].map(({ label, s }) => (
              <button
                key={s}
                onClick={() => scrollTo(s)}
                className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/10"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/marketplace">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 border border-white/20"
              >
                Explorar
              </Button>
            </Link>

            {user ? (
              <>
                <Link to={profilePath}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-1.5 border border-white/20"
                  >
                    <User className="h-4 w-4" />
                    Perfil
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-1.5"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button
                  size="sm"
                  className="bg-white text-[hsl(82_30%_10%)] hover:bg-white/90 font-semibold"
                >
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

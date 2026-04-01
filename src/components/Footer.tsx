import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, MapPin } from 'lucide-react'

export const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer style={{ backgroundColor: 'hsl(82 30% 10%)' }} className="text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <span className="text-2xl font-bold">TuTmait</span>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              A plataforma que conecta estudantes com os melhores explicadores de Portugal.
              Explicações, aulas particulares e apoio escolar — presencial ou online.
            </p>
            <div className="flex flex-col gap-2 text-sm text-white/50">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:hello@tutmait.pt" className="hover:text-white transition-colors">
                  hello@tutmait.pt
                </a>
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Portugal
              </span>
            </div>
          </div>

          {/* Plataforma */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Plataforma</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link to="/marketplace" className="hover:text-white transition-colors">Explorar explicadores</Link></li>
              <li><Link to="/student-questionnaire" className="hover:text-white transition-colors">Encontrar explicador</Link></li>
              <li><Link to="/tutor-questionnaire" className="hover:text-white transition-colors">Tornar-me explicador</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Entrar na conta</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li>
                <a href="/privacy-policy" className="hover:text-white transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Termos e Condições
                </a>
              </li>
              <li>
                <a href="/cookies" className="hover:text-white transition-colors">
                  Política de Cookies
                </a>
              </li>
              <li>
                <a href="/gdpr" className="hover:text-white transition-colors">
                  RGPD
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/30">
          <span>© {year} TuTmait. Todos os direitos reservados.</span>
          <span>Feito em Portugal 🇵🇹</span>
        </div>
      </div>
    </footer>
  )
}

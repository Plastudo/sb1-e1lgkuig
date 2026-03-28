import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { supabase, TutorData } from '../lib/supabase'
import { Search, Star, Mail, MapPin, Monitor, Home, Wifi } from 'lucide-react'

export const Marketplace = () => {
  const [tutors, setTutors] = useState<TutorData[]>([])
  const [filteredTutors, setFilteredTutors] = useState<TutorData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')

  // 🔹 Carregar tutores do Supabase
  const loadTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('tutores')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar tutores:', error)
        return
      }

      if (data) {
        // Deduplica por user_id — mantém o registo mais recente
        const seen = new Set<string>()
        const unique = (data as TutorData[]).filter(t => {
          const key = t.user_id || t.id || ''
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        // Só mostra tutores com foto real (base64 carregada pelo utilizador)
        const publicTutors = unique.filter(t =>
          t.profile_picture && t.profile_picture.startsWith('data:image')
        )
        setTutors(publicTutors)
        setFilteredTutors(publicTutors)
      }
    } catch (err) {
      console.error('Erro inesperado:', err)
    }
  }

  useEffect(() => {
    loadTutors()
  }, [])

  // 🔹 Filtros de Pesquisa Cruzada
  // Atualiza a vista sempre que o utilizador altera a pesquisa por texto, ou seleciona uma disciplina do array.
  useEffect(() => {
    let filtered = tutors

    // 1️⃣ Aplicar filtro de texto (barra de pesquisa)
    // Aqui procuramos matches parciais ou totais por nome, disciplinas associadas ou localização
    if (searchTerm) {
      const term = searchTerm.toLowerCase()

      filtered = filtered.filter(tutor => {
        const raw = tutor.raw_answers || {}
        const subjects: string[] = raw.question_5_answer || tutor.subjects || []
        const district: string = raw.question_10_answer || ''
        const municipality: string = raw.question_11_answer || ''
        const location = tutor.location || `${municipality} ${district}`

        return (
          tutor.name.toLowerCase().includes(term) ||
          subjects.some(s => s.toLowerCase().includes(term)) ||
          location.toLowerCase().includes(term)
        )
      })
    }

    // 2️⃣ Aplicar filtro de disciplina (botões rápidos/pílulas)
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(tutor => {
        const raw = tutor.raw_answers || {}
        const subjects: string[] = raw.question_5_answer || tutor.subjects || []
        return subjects.some(s => s.toLowerCase().includes(selectedSubject.toLowerCase()))
      })
    }

    // 3️⃣ Concluir e renderizar a lista
    setFilteredTutors(filtered)
  }, [searchTerm, selectedSubject, tutors])

  // 🔹 Contactar tutor
  const handleContactTutor = (email: string, tutorName: string) => {
    const subject = encodeURIComponent('Interessado em explicações - Plastudo')
    const body = encodeURIComponent(
      `Olá ${tutorName},\n\nEncontrei o seu perfil na Plastudo e estou interessado(a) nas suas explicações.\n\nObrigado(a)!`
    )

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  const subjects = [
    'all',
    'Matemática',
    'Física',
    'Química',
    'Biologia',
    'Português',
    'Inglês',
    'História',
  ]

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Encontre o seu{' '}
            <span className="text-gradient">explicador ideal</span>
          </h1>

          <div className="max-w-4xl mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Pesquisar por nome, disciplina ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 text-lg border-2 border-gray-200 rounded-2xl"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {subjects.map(subject => (
                <Button
                  key={subject}
                  variant={selectedSubject === subject ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSubject(subject)}
                >
                  {subject === 'all' ? 'Todas as disciplinas' : subject}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tutors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTutors.map((tutor, index) => {
            const raw = tutor.raw_answers || {}
            const displaySubjects: string[] = raw.question_5_answer || tutor.subjects || []
            const district: string = raw.question_10_answer || ''
            const municipality: string = raw.question_11_answer || ''
            const displayLocation = tutor.location || [municipality, district].filter(Boolean).join(', ') || ''
            const format: string = raw.question_9_answer || ''
            const isOnline = format === 'online' || format === 'indiferente' || format === ''
            const isPresencial = format === 'presencial' || format === 'centro-estudo' || format === 'indiferente' || format === ''

            return (
              <motion.div
                key={tutor.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="group"
              >
                <Card className="overflow-hidden rounded-2xl border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col bg-white">

                  {/* ── Foto ── */}
                  <div className="relative overflow-hidden" style={{ height: 240 }}>
                    <img
                      src={tutor.profile_picture || '/default-avatar.svg'}
                      alt={tutor.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradiente suave no fundo da foto */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                    {/* Rating — canto superior direito */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-2.5 py-1 shadow-lg">
                      <Star className="w-3 h-3 fill-accent text-accent" />
                      <span className="text-xs font-bold">{tutor.rating ?? '—'}</span>
                    </div>

                    {/* Formato — canto inferior esquerdo */}
                    <div className="absolute bottom-3 left-3 flex gap-1.5">
                      {isOnline && (
                        <div className="flex items-center gap-1 bg-white/95 text-primary rounded-full px-2 py-1 shadow text-xs font-semibold">
                          <Wifi className="w-3 h-3" /> Online
                        </div>
                      )}
                      {isPresencial && (
                        <div className="flex items-center gap-1 bg-white/95 text-foreground rounded-full px-2 py-1 shadow text-xs font-semibold">
                          <Home className="w-3 h-3" /> Presencial
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Conteúdo ── */}
                  <div className="p-4 flex flex-col flex-1">

                    {/* Nome + localização */}
                    <div className="mb-3">
                      <h3 className="text-base font-bold text-foreground leading-tight">{tutor.name}</h3>
                      {displayLocation && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" /> {displayLocation}
                        </p>
                      )}
                    </div>

                    {/* Disciplinas */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {displaySubjects.slice(0, 3).map(s => (
                        <span key={s} className="px-2.5 py-0.5 bg-tutor-green-light text-primary rounded-full text-xs font-medium">
                          {s}
                        </span>
                      ))}
                      {displaySubjects.length > 3 && (
                        <span className="px-2.5 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                          +{displaySubjects.length - 3}
                        </span>
                      )}
                      {displaySubjects.length === 0 && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>

                    {/* Botões */}
                    <div className="mt-auto flex gap-2">
                      <Link to={`/profile/${tutor.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full rounded-xl text-xs border-border">
                          Ver perfil
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => handleContactTutor(tutor.email, tutor.name)}
                        className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                      >
                        <Mail className="w-3 h-3 mr-1" /> Contactar
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

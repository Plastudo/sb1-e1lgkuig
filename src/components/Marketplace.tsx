import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { supabase, TutorData } from '../lib/supabase'
import { Search, Star, Mail, MapPin, Clock } from 'lucide-react'

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
        setTutors(unique)
        setFilteredTutors(unique)
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Encontre o seu{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-green-600">
              explicador ideal
            </span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor, index) => {
            const raw = tutor.raw_answers || {}
            const displaySubjects: string[] = raw.question_5_answer || tutor.subjects || []
            const district: string = raw.question_10_answer || ''
            const municipality: string = raw.question_11_answer || ''
            const displayLocation = tutor.location || [municipality, district].filter(Boolean).join(', ') || '—'
            const displayHours: string = raw.question_6_answer || tutor.availability_summary || '—'

            return (
            <motion.div
              key={tutor.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6 bg-white/80 shadow hover:shadow-lg rounded-2xl h-full flex flex-col">
                <div className="text-center mb-4">
                  <img
                    src={tutor.profile_picture || '/default-avatar.png'}
                    alt={tutor.name}
                    className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                  />

                  <h3 className="text-xl font-semibold">{tutor.name}</h3>

                  <div className="flex justify-center items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm">{tutor.rating ?? '—'}</span>
                  </div>

                  <div className="flex justify-center gap-4 text-sm text-gray-500 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {displayLocation}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {displayHours}
                    </span>
                  </div>
                </div>

                {displaySubjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center mb-3">
                    {displaySubjects.slice(0, 3).map(s => (
                      <span key={s} className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        {s}
                      </span>
                    ))}
                    {displaySubjects.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                        +{displaySubjects.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {tutor.bio || 'Sem apresentação ainda.'}
                </p>

                <div className="mt-auto space-y-2">
                  <Link to={`/profile/${tutor.id}`}>
                    <Button variant="outline" className="w-full">
                      Ver perfil completo
                    </Button>
                  </Link>

                  <Button
                    onClick={() => handleContactTutor(tutor.email, tutor.name)}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contactar
                  </Button>
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

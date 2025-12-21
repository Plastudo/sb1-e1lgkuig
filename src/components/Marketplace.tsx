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

      if (error) {
        console.error('Erro ao carregar tutores:', error)
        return
      }

      if (data) {
        setTutors(data as TutorData[])
        setFilteredTutors(data as TutorData[])
      }
    } catch (err) {
      console.error('Erro inesperado:', err)
    }
  }

  useEffect(() => {
    loadTutors()
  }, [])

  // 🔹 Filtros
  useEffect(() => {
    let filtered = tutors

    if (searchTerm) {
      const term = searchTerm.toLowerCase()

      filtered = filtered.filter(tutor =>
        tutor.name.toLowerCase().includes(term) ||
        tutor.subjects?.some(subject =>
          subject.toLowerCase().includes(term)
        ) ||
        (tutor.location ?? '').toLowerCase().includes(term) // ✅ OPÇÃO A
      )
    }

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(tutor =>
        tutor.subjects?.some(subject =>
          subject.toLowerCase().includes(selectedSubject.toLowerCase())
        )
      )
    }

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
          {filteredTutors.map((tutor, index) => (
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
                      {tutor.location ?? '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {tutor.availability ?? '—'}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {tutor.bio}
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
          ))}
        </div>
      </div>
    </div>
  )
}

//-----------------RESUMO GERAL-----------------
// Este código define a página principal do "Marketplace" da plataforma de explicadores online.
// Apresenta uma lista de tutores (mock data neste exemplo) com possibilidade de pesquisa, filtro por disciplina e contacto direto via email.
// Cada tutor é exibido com foto, nome, avaliação, localização, disponibilidade, matérias e biografia resumida.
// O utilizador pode visualizar o perfil completo do tutor ou enviar um email diretamente através de um botão de contacto.

//-----------------FLUXO DO CÓDIGO-----------------
// 1. Importa React, hooks, componentes visuais, animações e ícones.
// 2. Define um array de "mockTutors" (dados fictícios) para demonstração.
// 3. Cria o componente Marketplace, com estados locais: tutors, filteredTutors, searchTerm e selectedSubject.
// 4. useEffect inicial reservado para futura integração com Supabase (carregamento real de tutores).
// 5. useEffect de filtragem: aplica filtros de texto e disciplina sempre que searchTerm, selectedSubject ou tutors mudam.
// 6. handleContactTutor: função que abre o cliente de email com assunto e corpo pré-preenchidos.
// 7. Define lista de disciplinas disponíveis para pesquisa e filtro.
// 8. Renderiza o cabeçalho, campo de pesquisa, botões de filtro, contagem de resultados e a grelha de tutores.
// 9. Se não existirem tutores correspondentes, mostra estado vazio com opção para limpar filtros.


import React, { useEffect, useState } from 'react' // Importa React e hooks de estado/efeito
import { Link } from 'react-router-dom' // Cria navegação interna sem recarregar página
import { motion } from 'framer-motion' // Biblioteca de animações para React
import { Card } from './ui/card' // Componente de cartão estilizado
import { Button } from './ui/button' // Componente de botão
import { Input } from './ui/input' // Campo de input estilizado
import { supabase, TutorData } from '../lib/supabase' // Integração com Supabase e tipo de tutor
import { Search, Star, Mail, MapPin, Clock } from 'lucide-react' // Ícones SVG para interface

//----------------- MOCK DATA -----------------
// Dados fictícios usados apenas para demonstração da interface
const mockTutors: (TutorData & { rating: number; location: string; availability: string; profilePicture: string })[] = [
  {
    id: '1',
    user_id: 'mock-1',
    name: 'Ana Silva',
    email: 'ana.silva@email.com',
    question_1_answer: 'matematica',
    bio: 'Professora experiente com 8 anos de ensino. Especializada em álgebra, cálculo e estatística. Métodos personalizados para cada aluno.',
    subjects: ['Matemática', 'Álgebra', 'Cálculo'],
    rating: 4.9,
    location: 'Lisboa',
    availability: 'Manhãs e tardes',
    profilePicture: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
  },
  {
    id: '2',
    user_id: 'mock-2',
    name: 'João Santos',
    email: 'joao.santos@email.com',
    question_1_answer: 'ciencias',
    bio: 'Engenheiro químico com paixão pelo ensino. Experiência em preparação para exames nacionais e universitários.',
    subjects: ['Física', 'Química', 'Ciências'],
    rating: 4.8,
    location: 'Porto',
    availability: 'Tardes e noites',
    profilePicture: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
  },
  {
    id: '3',
    user_id: 'mock-3',
    name: 'Maria Costa',
    email: 'maria.costa@email.com',
    question_1_answer: 'ciencias',
    bio: 'Doutora em biologia molecular. Especializada em biologia celular e genética. Abordagem científica e didática.',
    subjects: ['Biologia', 'Genética', 'Ciências Naturais'],
    rating: 4.9,
    location: 'Braga',
    availability: 'Flexível',
    profilePicture: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
  },
  // ... (restantes mock tutors omitidos por brevidade)
]

export const Marketplace = () => {
  // ----------------- ESTADOS -----------------
  const [tutors, setTutors] = useState(mockTutors) // Lista completa de tutores
  const [filteredTutors, setFilteredTutors] = useState(mockTutors) // Lista filtrada
  const [searchTerm, setSearchTerm] = useState('') // Texto de pesquisa
  const [selectedSubject, setSelectedSubject] = useState('all') // Filtro de disciplina

  // ----------------- EFEITOS -----------------
  useEffect(() => {
    // TODO: Substituir mockTutors por dados reais do Supabase
    // Exemplo futuro: loadTutors()
  }, [])

  // Filtrar tutores quando searchTerm, selectedSubject ou tutors mudam
  useEffect(() => {
    let filtered = tutors

    // Aplicar filtro de pesquisa
    if (searchTerm) {
      filtered = filtered.filter(tutor =>
        tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.subjects?.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tutor.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Aplicar filtro de disciplina
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(tutor =>
        tutor.subjects?.some(subject =>
          subject.toLowerCase().includes(selectedSubject.toLowerCase())
        )
      )
    }

    setFilteredTutors(filtered) // Atualizar lista filtrada
  }, [searchTerm, selectedSubject, tutors])

  // ----------------- FUNÇÕES -----------------
  /**
   * Abre o cliente de email do utilizador com mensagem pré-preenchida
   * @param email - Email do tutor
   * @param tutorName - Nome do tutor
   */
  const handleContactTutor = (email: string, tutorName: string) => {
    const subject = encodeURIComponent('Interessado em explicações - Plastudo')
    const body = encodeURIComponent(`Olá ${tutorName},\n\nEncontrei o seu perfil na Plastudo e estou interessado(a) nas suas explicações.\n\nPodemos conversar sobre disponibilidade e condições?\n\nObrigado(a)!`)
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  // Lista de disciplinas disponíveis para filtro
  const subjects = ['all', 'Matemática', 'Física', 'Química', 'Biologia', 'Português', 'Inglês', 'História']

  // ----------------- RENDER -----------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* ----------------- HEADER ----------------- */}
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
          <p className="text-lg text-gray-600 mb-8">
            Explore os nossos explicadores qualificados e encontre quem melhor se adequa às suas necessidades
          </p>

          {/* ----------------- PESQUISA E FILTROS ----------------- */}
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Pesquisar por nome, disciplina ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} // Atualizar searchTerm
                className="pl-10 py-3 text-lg border-2 border-gray-200 rounded-2xl focus:border-green-400"
              />
            </div>

            {/* Botões de filtro por disciplina */}
            <div className="flex flex-wrap gap-2 justify-center">
              {subjects.map((subject) => (
                <Button
                  key={subject}
                  variant={selectedSubject === subject ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSubject(subject)} // Atualizar filtro selecionado
                  className={
                    selectedSubject === subject
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                      : 'border-gray-300 hover:border-green-400'
                  }
                >
                  {subject === 'all' ? 'Todas as disciplinas' : subject}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ----------------- CONTAGEM DE RESULTADOS ----------------- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-gray-600 text-center">
            {filteredTutors.length} explicador{filteredTutors.length !== 1 ? 'es' : ''} encontrado{filteredTutors.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* ----------------- LISTA DE TUTORES ----------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor, index) => (
            <motion.div
              key={tutor.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 h-full hover:shadow-xl transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm group">
                {/* Cabeçalho do Tutor */}
                <div className="text-center mb-4">
                  <img
                    src={tutor.profilePicture}
                    alt={tutor.name}
                    className="w-20 h-20 rounded-full mx-auto mb-3 object-cover ring-4 ring-yellow-100 group-hover:ring-green-200 transition-all"
                  />
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{tutor.name}</h3>
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-700">{tutor.rating}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{tutor.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{tutor.availability}</span>
                    </div>
                  </div>
                </div>

                {/* Disciplinas */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {tutor.subjects?.slice(0, 3).map((subject) => (
                      <span
                        key={subject}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                      >
                        {subject}
                      </span>
                    ))}
                    {tutor.subjects && tutor.subjects.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{tutor.subjects.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>

                {/* Biografia */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{tutor.bio}</p>

                {/* Ações */}
                <div className="space-y-2 mt-auto">
                  <Link to={`/profile/${tutor.id}`}>
                    <Button variant="outline" className="w-full group-hover:border-green-400 transition-colors">
                      Ver perfil completo
                    </Button>
                  </Link>

                  <Button
                    onClick={() => handleContactTutor(tutor.email, tutor.name)}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contactar
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ----------------- ESTADO VAZIO ----------------- */}
        {filteredTutors.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum explicador encontrado</h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar os seus critérios de pesquisa ou explore todas as disciplinas
            </p>
            <Button
              onClick={() => {
                setSearchTerm('')
                setSelectedSubject('all')
              }}
              variant="outline"
            >
              Limpar filtros
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

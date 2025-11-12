//-----------------RESUMO GERAL-----------------
//Este código cria uma página de "Marketplace" para uma plataforma de explicadores online.
//Ele mostra uma lista de tutores (mock data neste exemplo), permitindo pesquisar por nome, disciplina ou localização e filtrar por disciplina.
//Cada tutor é exibido com foto, nome, avaliação, localização, disponibilidade, matérias e biografia resumida.
//O utilizador pode ver o perfil completo do tutor ou enviar email diretamente através de um botão de contacto.

//-----------------FLUXO DO CÓDIGO-----------------
// 1. Importa React, hooks, navegação, animações, componentes visuais e ícones.
// 2. Define um array de "mockTutors" com dados de tutores de exemplo para exibição.
// 3. Cria o componente Marketplace com estados: tutors, filteredTutors, searchTerm e selectedSubject.
// 4. useEffect vazio para futura carga de dados reais do Supabase.
// 5. useEffect que filtra os tutores conforme o searchTerm e selectedSubject sempre que algum deles muda.
// 6. Função handleContactTutor abre o email do utilizador para contactar o tutor selecionado.
// 7. Define array de disciplinas disponíveis para filtro.
// 8. Renderiza cabeçalho da página, campo de pesquisa e botões de filtro de disciplina.
// 9. Mostra quantidade de resultados e lista de tutores em cards, incluindo foto, avaliação, localização, disponibilidade, matérias e biografia.
// 10. Caso não existam tutores filtrados, exibe estado vazio com botão para limpar filtros.

//-----------------CODE-----------------

import React, { useEffect, useState } from 'react' // Importa React e hooks de estado e efeito
import { Link } from 'react-router-dom' // Componente para criar links entre páginas
import { motion } from 'framer-motion' // Para animações suaves
import { Card } from './ui/card' // Componente de cartão visual
import { Button } from './ui/button' // Botão estilizado
import { Input } from './ui/input' // Campo de input estilizado
import { supabase, TutorData } from '../lib/supabase' // Supabase e tipo de dados do tutor
import { Search, Star, Mail, MapPin, Clock } from 'lucide-react' // Ícones usados na interface

export const Marketplace = () => {
  const [tutors, setTutors] = useState<TutorData[]>([])
  const [filteredTutors, setFilteredTutors] = useState<TutorData[]>([])
  const [searchTerm, setSearchTerm] = useState('') // Estado para texto de pesquisa
  const [selectedSubject, setSelectedSubject] = useState('all') // Estado para disciplina selecionada
  
// Função para carregar tutores do Supabase
  const loadTutors = async () => {
    try {
      const { data, error } = await supabase
        .from<TutorData>('tutores') // Identificação da tabela
        .select('*')

      if (error) {
        console.error('Erro ao carregar tutores:', error)
        return
      }

      if (data) {
        setTutors(data)
        setFilteredTutors(data)
      }
    } catch (err) {
      console.error('Erro inesperado ao carregar tutores:', err)
    }
  }

  useEffect(() => {
    loadTutors() // Carrega os tutores ao montar o componente
  }, [])

  useEffect(() => { // Filtra tutores quando searchTerm, selectedSubject ou tutors mudam
    let filtered = tutors

    if (searchTerm) { // Se houver termo de pesquisa
      filtered = filtered.filter(tutor =>
        tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) || // Pesquisa pelo nome
        tutor.subjects?.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase())) || // Pesquisa por matéria
        tutor.location.toLowerCase().includes(searchTerm.toLowerCase()) // Pesquisa por localização
      )
    }

    if (selectedSubject !== 'all') { // Se uma disciplina específica foi selecionada
      filtered = filtered.filter(tutor =>
        tutor.subjects?.some(subject =>
          subject.toLowerCase().includes(selectedSubject.toLowerCase()) // Filtra por disciplina
        )
      )
    }

    setFilteredTutors(filtered) // Atualiza tutores filtrados
  }, [searchTerm, selectedSubject, tutors])

  // Função para enviar email ao tutor
  const handleContactTutor = (email: string, tutorName: string) => {
    const subject = encodeURIComponent(`Interessado em explicações - Plastudo`) // Assunto do email
    const body = encodeURIComponent(`Olá ${tutorName},\n\nEncontrei o seu perfil na Plastudo e estou interessado(a) nas suas explicações.\n\nPodemos conversar sobre disponibilidade e condições?\n\nObrigado(a)!`) // Corpo do email
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}` // Abre o cliente de email
  }

  const subjects = ['all', 'Matemática', 'Física', 'Química', 'Biologia', 'Português', 'Inglês', 'História'] // Lista de disciplinas

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
          <p className="text-lg text-gray-600 mb-8">
            Explore os nossos explicadores qualificados e encontre quem melhor se adequa às suas necessidades
          </p>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="relative">
              {/* Ícone de pesquisa */}
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Pesquisar por nome, disciplina ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} // Atualiza searchTerm
                className="pl-10 py-3 text-lg border-2 border-gray-200 rounded-2xl focus:border-green-400"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {/* Botões de filtro por disciplina */}
              {subjects.map((subject) => (
                <Button
                  key={subject}
                  variant={selectedSubject === subject ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSubject(subject)} // Atualiza disciplina selecionada
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

        {/* Results Count */}
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

        {/* Tutors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Para cada tutor filtrado */}
          {filteredTutors.map((tutor, index) => (
            <motion.div
              key={tutor.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 h-full hover:shadow-xl transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm group">
                <div className="text-center mb-4">
                  <img
                    src={tutor.profile_picture}
                    alt={tutor.name}
                    className="w-20 h-20 rounded-full mx-auto mb-3 object-cover ring-4 ring-yellow-100 group-hover:ring-green-200 transition-all"
                  />
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {tutor.name} {/* Nome do tutor */}
                  </h3>
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {/* Ícone de estrela */}
                    <span className="text-sm font-medium text-gray-700">{tutor.rating}</span> {/* Avaliação */}
                  </div>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" /> {/* Localização */}
                      <span>{tutor.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" /> {/* Disponibilidade */}
                      <span>{tutor.availability}</span>
                    </div>
                  </div>
                </div>

                {/* Subjects */}
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
                    {/* Se houver mais de 3 disciplinas */}
                    {tutor.subjects && tutor.subjects.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{tutor.subjects.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {tutor.bio} {/* Biografia resumida */}
                </p>

                <div className="space-y-2 mt-auto">
                  {/* Link para perfil completo */}
                  <Link to={`/TutorProfile/${tutor.id}`}>
                    <Button
                      variant="outline"
                      className="w-full group-hover:border-green-400 transition-colors"
                    >
                      Ver perfil completo
                    </Button>
                  </Link>

                  {/* Botão para enviar email */}
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

        {/* Empty State */}
        {filteredTutors.length === 0 && (
          // Se não houver tutores filtrados
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" /> {/* Ícone grande */}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum explicador encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar os seus critérios de pesquisa ou explore todas as disciplinas
            </p>
            <Button
              onClick={() => {
                setSearchTerm('') // Limpa pesquisa
                setSelectedSubject('all') // Limpa filtro de disciplina
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

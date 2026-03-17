import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { 
  Star, MapPin, Clock, BookOpen, 
  GraduationCap, Video, Home, CheckCircle2, User, Target, Gamepad 
} from "lucide-react"

type PublicTutor = {
  id: string
  name: string
  bio: string
  subjects: string[]
  rating: number
  location: string
  availability_summary: string
  profile_picture: string
  email: string
  hourly_rate: string
  experience: string
  education: string
  success_rate: string
  total_students: number
  raw_answers: Record<string, any>
}

export const TutorProfilePublic = () => {
  const { id } = useParams<{ id: string }>()
  const [tutor, setTutor] = useState<PublicTutor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError("ID inválido")
      setLoading(false)
      return
    }

    const fetchTutor = async () => {
      const { data, error } = await supabase
        .from("tutores")
        .select(`
          id,
          name,
          bio,
          subjects,
          rating,
          location,
          availability_summary,
          profile_picture,
          email,
          hourly_rate,
          experience,
          education,
          success_rate,
          total_students,
          raw_answers
        `)
        .eq("id", id)
        .single()

      if (error || !data) {
        setError("Tutor não encontrado")
      } else {
        setTutor(data)
      }

      setLoading(false)
    }

    fetchTutor()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (error || !tutor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-2xl shadow-sm text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ops!</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  // Helper variables for raw_answers data
  const raw = tutor.raw_answers || {}
  const teachingLevels: string[] = raw.question_4_answer || []
  const methodology: string[] = raw.question_15_answer || []
  const specialNeeds: string[] = raw.question_17_answer || []
  const format = raw.question_9_answer || 'indiferente'
  const hobbies: string[] = raw.question_16_answer || []

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-sans pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area (Left side) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* About Me Section */}
            <Card className="p-8 bg-white rounded-3xl shadow-sm border-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 font-display">Acerca do Professor</h2>
              {tutor.bio ? (
                <div className="prose prose-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {tutor.bio}
                </div>
              ) : (
                <p className="text-gray-500 italic">O professor ainda não escreveu uma apresentação detalhada.</p>
              )}
            </Card>

            {/* Subjects & Levels */}
            <Card className="p-8 bg-white rounded-3xl shadow-sm border-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 font-display">O que ensino</h2>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Disciplinas</h3>
                <div className="flex flex-wrap gap-2">
                  {tutor.subjects?.map((s) => (
                    <span key={s} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">
                      {s}
                    </span>
                  ))}
                  {(!tutor.subjects || tutor.subjects.length === 0) && <span className="text-gray-500">-</span>}
                </div>
              </div>

              {teachingLevels.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Níveis lecionados</h3>
                  <div className="flex flex-wrap gap-2">
                    {teachingLevels.map((lvl) => (
                      <span key={lvl} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium border border-gray-200">
                        {lvl}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Methodology & Approach */}
            {(methodology.length > 0 || specialNeeds.length > 0) && (
              <Card className="p-8 bg-white rounded-3xl shadow-sm border-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Target className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 font-display">Metodologia</h2>
                </div>
                
                {methodology.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Abordagem de Ensino</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {methodology.map(m => (
                        <li key={m} className="flex items-start gap-2 text-gray-600">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {specialNeeds.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Perfil de Alunos (Áreas de conforto)</h3>
                    <div className="flex flex-wrap gap-2">
                      {specialNeeds.map(sn => (
                        <span key={sn} className="px-3 py-1 bg-emerald-50/50 text-emerald-700 rounded-lg text-sm border border-emerald-100">
                          {sn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Formato das aulas */}
            <Card className="p-8 bg-white rounded-3xl shadow-sm border-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 font-display">Local das Aulas</h2>
              </div>
              
              <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-4 rounded-2xl">
                {format.includes('online') ? <Video className="w-6 h-6 text-purple-500" /> : <Home className="w-6 h-6 text-purple-500" />}
                <div className="text-lg capitalize font-medium">
                  {format === 'indiferente' ? 'Presencial ou Online' : format.replace('-', ' ')}
                </div>
              </div>
            </Card>

            {/* Hobbies / Extras */}
            {hobbies.length > 0 && (
              <Card className="p-8 bg-white rounded-3xl shadow-sm border-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                    <Gamepad className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 font-display">Interesses & Hobbies</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hobbies.map(h => (
                    <span key={h} className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-sm font-medium">
                      {h}
                    </span>
                  ))}
                </div>
              </Card>
            )}

          </div>

          {/* Sticky Sidebar (Right side) */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-8">
              <Card className="p-6 bg-white rounded-3xl shadow-lg border-0 overflow-hidden relative">
                
                {/* Visual Header Background Element */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-green-400 to-blue-500 opacity-20" />
                
                <div className="relative pt-6 flex flex-col items-center">
                  <img
                    src={tutor.profile_picture || "/default-avatar.png"}
                    alt={tutor.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md mb-4"
                  />
                  <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">{tutor.name}</h1>
                  <p className="text-green-600 font-bold text-2xl mb-6">{tutor.hourly_rate || 'Sob consulta'}</p>

                  <div className="w-full space-y-4 mb-8">
                    <div className="flex items-center justify-between text-gray-600">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium text-gray-900">{tutor.rating || 'Novo'}</span>
                      </div>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded-md">{tutor.total_students || 0} alunos ativos</span>
                    </div>

                    <div className="h-px w-full bg-gray-100 my-4" />

                    <div className="flex items-center gap-3 text-gray-600 mb-2">
                      <GraduationCap className="w-5 h-5 shrink-0 text-gray-400" />
                      <span className="text-sm">{tutor.education || 'Formação não especificada'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600 mb-2">
                      <Clock className="w-5 h-5 shrink-0 text-gray-400" />
                      <span className="text-sm">{tutor.availability_summary || 'Disponibilidade a combinar'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <User className="w-5 h-5 shrink-0 text-gray-400" />
                      <span className="text-sm">Exp: {tutor.experience || 'Iniciante'}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => (window.location.href = `mailto:${tutor.email}?subject=Pedido de Aula via Plataforma`)}
                    className="w-full py-6 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Marcar Aula
                  </Button>
                  <p className="text-xs text-center text-gray-400 mt-4">Resposta habitualmente em poucas horas</p>
                </div>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}


import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Star, Mail, MapPin, Clock } from "lucide-react"

type PublicTutor = {
  id: string
  name: string
  bio: string
  subjects: string[]
  rating: number
  location: string
  availability: string
  profile_picture: string
  email: string
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
          availability,
          profile_picture,
          email
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
    return <p className="text-center mt-10">A carregar perfil…</p>
  }

  if (error || !tutor) {
    return <p className="text-center mt-10 text-red-500">{error}</p>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-xl">
          <div className="flex flex-col md:flex-row gap-6">

            <img
              src={tutor.profile_picture || "/default-avatar.png"}
              alt={tutor.name}
              className="w-32 h-32 rounded-2xl object-cover"
            />

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{tutor.name}</h1>

              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                <span>{tutor.rating}</span>
              </div>

              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{tutor.location}</span>
              </div>

              <div className="flex items-center space-x-2 text-gray-600 mb-4">
                <Clock className="h-4 w-4" />
                <span>{tutor.availability}</span>
              </div>

              <p className="text-gray-700 mb-4">{tutor.bio}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {tutor.subjects?.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <Button
                onClick={() =>
                  (window.location.href = `mailto:${tutor.email}?subject=Contacto`)
                }
                className="bg-gradient-to-r from-green-500 to-blue-500"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contactar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

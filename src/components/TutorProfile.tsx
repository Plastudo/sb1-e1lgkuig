import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { useAuth } from '../contexts/AuthContext'
import { supabase, TutorData } from '../lib/supabase'
import { 
  Star, Mail, MapPin, Clock, Edit3, Save, X, GraduationCap,
  BookOpen, User, Target, Gamepad, Video, Home, CheckCircle2,
  Camera, Loader2
} from 'lucide-react'

export const TutorProfile = () => {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [tutor, setTutor] = useState<TutorData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<TutorData>>({})
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // O hook de referência (ref) serve para podermos clicar de forma invisível no input de ficheiro ao clicar no avatar
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 🔹 Carregamento Inicial
  // Efectua o fetch dos dados do tutor mal o componente monte, usando o ID do URL ou do user logado.
  useEffect(() => {
    if (authLoading) return

    const fetchTutorData = async () => {
      try {
        let targetId = id

        if (!targetId) {
          if (!user) {
            navigate('/marketplace')
            return
          }
          const { data: ownData, error: ownError } = await supabase
            .from('tutores')
            .select('id')
            .eq('user_id', user.id)
            .single()
            
          if (ownData?.id) {
            targetId = ownData.id
          } else if (ownError && ownError.code === 'PGRST116') {
            // O user logado ainda não tem perfil na tabela tutores (legacy users ou bugs)
            // Cria automaticamente um perfil base para poder aceder ao modo de edição direto
             const { data: newTutor, error: insertError } = await supabase
              .from('tutores')
              .insert({
                user_id: user.id,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'Utilizador',
                email: user.email || '',
                raw_answers: {}
              })
              .select('id')
              .single()
              
            if (!insertError && newTutor) {
              targetId = newTutor.id
            }
          }
        }

        if (!targetId) {
          navigate('/marketplace')
          return
        }

        const { data, error } = await supabase
          .from('tutores')
          .select('*')
          .eq('id', targetId)
          .single()

        if (error) throw error

        if (data) {
          // Ensure raw_answers gets parsed correctly if it's null
          const tutorWithAns = { ...data, raw_answers: data.raw_answers || {} }
          setTutor(tutorWithAns)
          setEditData(tutorWithAns)
        } else {
          navigate('/marketplace')
        }
      } catch (error) {
        console.error('Error fetching tutor:', error)
        navigate('/marketplace')
      } finally {
        setLoading(false)
      }
    }

    fetchTutorData()
  }, [id, navigate, user, authLoading])

  // Condição para validar se quem está a visualizar o perfil é o próprio dono
  const isOwner = user && tutor && user.id === tutor.user_id

  // 🔹 Guardar Alterações
  // Sincroniza o estado atualizado com a base de dados do Supabase (`tutores`)
  const handleSave = async () => {
    if (!tutor || !isOwner) return

    try {
      // Sync raw_answers text data with our editData changes before pushing
      const updatedRawAnswers = { ...editData.raw_answers }
      
      // We also update specific raw_answers properties if the root fields changed
      // Note: Full array editing requires a more complex UI, so we keep them as tags for now.
      
      const payloadToUpdate = {
        ...editData,
        raw_answers: updatedRawAnswers
      }

      const { error } = await supabase.from('tutores').update(payloadToUpdate).eq('id', tutor.id)
      if (error) throw error

      setTutor(payloadToUpdate as unknown as TutorData)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert("Houve um erro ao guardar as alterações.")
    }
  }

  // 🔹 Upload da Imagem de Perfil
  // Lida com o fluxo de armazenamento da nova imagem no bucket 'avatars' do Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0 || !tutor || !isOwner) return
      
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${tutor.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      setUploadingImage(true)

      // Upload image to Supabase Storage 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update tutor record with new profile_picture URL
      const { error: updateError } = await supabase
        .from('tutores')
        .update({ profile_picture: publicUrl })
        .eq('id', tutor.id)

      if (updateError) throw updateError

      setTutor({ ...tutor, profile_picture: publicUrl })
      setEditData(prev => ({ ...prev, profile_picture: publicUrl }))

    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Erro ao fazer upload da imagem de perfil. Verifica se rodaste o script SQL para criar o Bucket "avatars".')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleContactTutor = () => {
    if (!tutor) return
    const subject = encodeURIComponent(`Interessado em explicações - Plastudo`)
    const body = encodeURIComponent(
      `Olá ${tutor.name},\n\nEncontrei o seu perfil na Plastudo e estou interessado(a) nas suas explicações.\n\nPodemos conversar sobre disponibilidade e condições?\n\nObrigado(a)!`
    )
    window.location.href = `mailto:${tutor.email}?subject=${subject}&body=${body}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!tutor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-2xl shadow-sm text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Explicador não encontrado</h2>
          <Button onClick={() => navigate('/marketplace')}>Voltar ao marketplace</Button>
        </div>
      </div>
    )
  }

  // Define data references (preferring editData if in edit mode, falling back to tutor)
  const currentData = isEditing ? editData : tutor
  const raw = typeof currentData.raw_answers === 'object' && currentData.raw_answers !== null 
              ? currentData.raw_answers 
              : {}

  const teachingLevels: string[] = raw.question_4_answer || []
  const methodology: string[] = raw.question_15_answer || []
  const specialNeeds: string[] = raw.question_17_answer || []
  const format = raw.question_9_answer || 'indiferente'
  const hobbies: string[] = raw.question_16_answer || []

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-sans pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl border-gray-200">
            ← Voltar
          </Button>

          {isOwner && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={() => { setIsEditing(false); setEditData(tutor) }} variant="outline" className="rounded-xl">
                    <X className="w-4 h-4 mr-2" /> Cancelar
                  </Button>
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 rounded-xl">
                    <Save className="w-4 h-4 mr-2" /> Guardar Perfil
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-xl bg-white">
                  <Edit3 className="w-4 h-4 mr-2" /> Editar Perfil
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area (Left side) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* About Me Section */}
            <Card className="p-8 bg-white rounded-3xl shadow-sm border-0 transition-all">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 font-display">Acerca do Professor</h2>
              
              {isEditing ? (
                <Textarea 
                  value={currentData.bio || ''} 
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder="Apresenta-te aos teus futuros alunos..." 
                  className="min-h-[200px] text-lg rounded-2xl resize-y"
                />
              ) : (
                currentData.bio ? (
                  <div className="prose prose-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {currentData.bio}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Uma breve apresentação ajuda-te a ganhar mais alunos!</p>
                )
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
                  {currentData.subjects?.map((s) => (
                    <span key={s} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">
                      {s}
                    </span>
                  ))}
                  {(!currentData.subjects || currentData.subjects.length === 0) && <span className="text-gray-500">-</span>}
                </div>
              </div>

              {teachingLevels.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Níveis lecionados</h3>
                  <div className="flex flex-wrap gap-2">
                    {teachingLevels.map((lvl: string) => (
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
                      {methodology.map((m: string) => (
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
                      {specialNeeds.map((sn: string) => (
                        <span key={sn} className="px-3 py-1 bg-emerald-50/50 text-emerald-700 rounded-lg text-sm border border-emerald-100">
                          {sn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Format & Extras side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <Card className="p-8 bg-white rounded-3xl shadow-sm border-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 font-display">Local</h2>
                </div>
                
                <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-4 rounded-2xl">
                  {format.includes('online') ? <Video className="w-6 h-6 text-purple-500" /> : <Home className="w-6 h-6 text-purple-500" />}
                  <div className="text-lg capitalize font-medium">
                    {format === 'indiferente' ? 'Presencial ou Online' : format.replace('-', ' ')}
                  </div>
                </div>
              </Card>
              
              {hobbies.length > 0 && (
                <Card className="p-8 bg-white rounded-3xl shadow-sm border-0">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                      <Gamepad className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 font-display">Interesses</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hobbies.map((h: string) => (
                      <span key={h} className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-sm font-medium">
                        {h}
                      </span>
                    ))}
                  </div>
                </Card>
              )}
            </div>

          </div>

          {/* Sticky Sidebar (Right side) */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-8">
              <Card className="p-6 bg-white rounded-3xl shadow-lg border-0 overflow-hidden relative">
                
                {/* Visual Header Background Element */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-green-400 to-blue-500 opacity-20" />
                
                <div className="relative pt-6 flex flex-col items-center">
                  
                  {/* Editable Avatar */}
                  <div className="relative mb-4 group">
                    <img
                      src={currentData.profile_picture || "/default-avatar.png"}
                      alt={currentData.name}
                      className={`w-36 h-36 rounded-full object-cover border-4 border-white shadow-md transition-all ${isEditing ? 'group-hover:opacity-60' : ''}`}
                    />
                    {isEditing && (
                      <>
                        <div 
                          className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploadingImage ? (
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          ) : (
                            <Camera className="w-10 h-10 text-white" />
                          )}
                          <span className="text-white text-xs font-semibold mt-1">Alterar Foto</span>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </>
                    )}
                  </div>

                  {isEditing ? (
                    <Input 
                      value={currentData.name || ''} 
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })} 
                      className="text-2xl font-bold text-center mb-1 h-12 rounded-xl" 
                      placeholder="O teu nome"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">{currentData.name}</h1>
                  )}

                  {isEditing ? (
                    <Input 
                      value={currentData.hourly_rate || ''} 
                      onChange={(e) => setEditData({ ...editData, hourly_rate: e.target.value })} 
                      className="text-green-600 font-bold text-center text-xl mb-6 mt-2 rounded-xl h-10" 
                      placeholder="Ex: 15€ / hora"
                    />
                  ) : (
                    <p className="text-green-600 font-bold text-2xl mb-6">{currentData.hourly_rate || 'Preço sob consulta'}</p>
                  )}

                  <div className="w-full space-y-4 mb-8">
                    <div className="flex items-center justify-between text-gray-600">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium text-gray-900">{currentData.rating || 'Novo'}</span>
                      </div>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded-md">{currentData.total_students || 0} alunos ativos</span>
                    </div>

                    <div className="h-px w-full bg-gray-100 my-4" />

                    <div className="flex items-center gap-3 text-gray-600 mb-2">
                      <GraduationCap className="w-5 h-5 shrink-0 text-gray-400" />
                      {isEditing ? (
                         <Input 
                         value={currentData.education || ''} 
                         onChange={(e) => setEditData({ ...editData, education: e.target.value })} 
                         className="h-8 text-sm" 
                         placeholder="Ex: Licenciatura Univ. Lisboa"
                       />
                      ) : (
                        <span className="text-sm">{currentData.education || 'Formação não especificada'}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-gray-600 mb-2">
                      <Clock className="w-5 h-5 shrink-0 text-gray-400" />
                      {isEditing ? (
                         <Input 
                         value={currentData.availability_summary || ''} 
                         onChange={(e) => setEditData({ ...editData, availability_summary: e.target.value })} 
                         className="h-8 text-sm" 
                         placeholder="Ex: Fim de semana / Pós-laboral"
                       />
                      ) : (
                        <span className="text-sm">{currentData.availability_summary || 'Disponibilidade a combinar'}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <User className="w-5 h-5 shrink-0 text-gray-400" />
                      {isEditing ? (
                         <Input 
                         value={currentData.experience || ''} 
                         onChange={(e) => setEditData({ ...editData, experience: e.target.value })} 
                         className="h-8 text-sm" 
                         placeholder="Ex: 2 anos"
                       />
                      ) : (
                        <span className="text-sm">Exp: {currentData.experience || 'Iniciante'}</span>
                      )}
                    </div>
                  </div>

                  {!isOwner && (
                    <Button
                      onClick={handleContactTutor}
                      className="w-full py-6 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      Marcar Aula
                    </Button>
                  )}
                  {isOwner && isEditing && (
                    <div className="w-full p-4 bg-orange-50 border border-orange-100 rounded-xl text-center text-sm text-orange-700 flex flex-col gap-2">
                        <strong>Modo de Edição Ativo</strong>
                        Altera os dados textuais nos campos acima ou carrega na fotografia para fazeres o upload de uma nova imagem.
                    </div>
                  )}
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

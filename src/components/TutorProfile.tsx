import React, { useEffect, useState, useRef } from 'react'
import { ProfilePictureUpload } from './ui/ProfilePictureUpload'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { useAuth } from '../contexts/AuthContext'
import { supabase, TutorData } from '../lib/supabase'
import {
  GraduationCap, Clock, Euro, MapPin, Monitor, BookOpen,
  Users, Gamepad2, Heart, Calendar, Briefcase, Lightbulb,
  Edit3, Save, X, Camera, Loader2, Mail, Star, CheckCircle2,
  Home, Video
} from 'lucide-react'

// ── Animação de entrada ──────────────────────────────────────────────────────
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
})

// ── Section card reutilizável ────────────────────────────────────────────────
const Section = ({
  icon: Icon, title, children, delay = 0,
}: {
  icon: React.ElementType; title: string; children: React.ReactNode; delay?: number
}) => (
  <motion.div {...fade(delay)}>
    <Card className="border-none shadow-[0_2px_12px_hsl(150_20%_20%/0.06)] hover:shadow-[0_4px_20px_hsl(150_20%_20%/0.1)] transition-shadow duration-300 h-full">
      <CardContent className="p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Icon className="w-[18px] h-[18px] text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
        </div>
        {children}
      </CardContent>
    </Card>
  </motion.div>
)

// ── Lista de tags ────────────────────────────────────────────────────────────
const TagList = ({ items, variant = 'default' }: {
  items: string[]; variant?: 'default' | 'secondary' | 'outline'
}) => (
  <div className="flex flex-wrap gap-2">
    {items.map((item) => (
      <Badge key={item} variant={variant} className="text-xs font-medium px-3 py-1 rounded-full">
        {item}
      </Badge>
    ))}
    {items.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
  </div>
)

// ── Grelha de disponibilidade ────────────────────────────────────────────────
// Formato guardado pelo questionário: { "Seg_Manhã": true, "Ter_Tarde": false, ... }
const SCHED_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const
const SCHED_DAYS_FULL = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
const SCHED_SLOTS = ['Manhã', 'Tarde', 'Noite'] as const

// ── Componente principal ─────────────────────────────────────────────────────
export const TutorProfile = () => {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [tutor, setTutor] = useState<TutorData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<TutorData>>({})
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 🔹 Carregamento Inicial
  useEffect(() => {
    if (authLoading) return

    const fetchTutorData = async () => {
      try {
        let targetId = id

        if (!targetId) {
          if (!user) { navigate('/marketplace'); return }
          const { data: ownData, error: ownError } = await supabase
            .from('tutores').select('id').eq('user_id', user.id).single()

          if (ownData?.id) {
            targetId = ownData.id
          } else {
            navigate('/marketplace')
            return
          }
        }

        if (!targetId) { navigate('/marketplace'); return }

        const { data, error } = await supabase
          .from('tutores').select('*').eq('id', targetId).single()

        if (error) throw error
        if (data) {
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

  const isOwner = user && tutor && user.id === tutor.user_id

  // 🔹 Guardar Alterações
  const handleSave = async () => {
    if (!tutor || !isOwner) return
    try {
      const payloadToUpdate = { ...editData, raw_answers: { ...editData.raw_answers } }
      const { error } = await supabase.from('tutores').update(payloadToUpdate).eq('id', tutor.id)
      if (error) throw error
      setTutor(payloadToUpdate as unknown as TutorData)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Houve um erro ao guardar as alterações.')
    }
  }

  // 🔹 Upload da Imagem de Perfil — chamado pelo ProfilePictureUpload após processamento
  const handleProcessedPhoto = async (base64: string) => {
    if (!tutor || !isOwner) return
    try {
      setUploadingImage(true)
      const { error } = await supabase
        .from('tutores')
        .update({ profile_picture: base64 })
        .eq('id', tutor.id)
      if (error) throw error
      setTutor({ ...tutor, profile_picture: base64 })
      setEditData(prev => ({ ...prev, profile_picture: base64 }))
    } catch (err: any) {
      console.error('Error saving image:', err)
      alert(`Erro ao guardar imagem: ${err?.message || err}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleContactTutor = () => {
    if (!tutor) return
    const subject = encodeURIComponent('Interessado em explicações - Plastudo')
    const body = encodeURIComponent(
      `Olá ${tutor.name},\n\nEncontrei o seu perfil na Plastudo e estou interessado(a) nas suas explicações.\n\nPodemos conversar sobre disponibilidade e condições?\n\nObrigado(a)!`
    )
    const a = document.createElement('a')
    a.href = `mailto:${tutor.email}?subject=${subject}&body=${body}`
    a.target = '_blank'
    a.click()
  }

  // ── Loading / Not Found ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!tutor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-8 bg-white rounded-2xl shadow-sm text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Explicador não encontrado</h2>
          <Button onClick={() => navigate('/marketplace')}>Voltar ao marketplace</Button>
        </div>
      </div>
    )
  }

  // ── Derivar dados do Supabase ────────────────────────────────────────────
  const currentData = isEditing ? editData : tutor

  // raw_answers pode vir como string JSON ou objeto
  const rawParsed = (() => {
    const r = currentData.raw_answers
    if (!r) return {}
    if (typeof r === 'string') { try { return JSON.parse(r) } catch { return {} } }
    if (typeof r === 'object') return r as Record<string, any>
    return {}
  })()
  const raw = rawParsed

  const subjects: string[] = raw.question_5_answer || currentData.subjects || []
  const teachingLevels: string[] = raw.question_4_answer || []
  const methodology: string[] = raw.question_15_answer || []
  const specialNeeds: string[] = raw.question_17_answer || []
  const hobbies: string[] = raw.question_16_answer || []
  const format: string = raw.question_9_answer || 'indiferente'
  const academicDegree: string = raw.question_2_answer || currentData.education || ''
  const hasExperience: boolean = raw.question_3_answer === 'Sim'
  const experienceYears: string = raw.question_3_extra || ''
  const district: string = raw.question_11_answer || raw.question_10_answer || ''
  const municipality: string = raw.question_12_answer || raw.question_11_answer || ''
  const parish: string = raw.question_13_answer || raw.question_12_answer || ''
  const horasSemana: string = raw.question_6_answer || ''
  const teachingType: string = Array.isArray(raw.question_1_answer)
    ? raw.question_1_answer[0]
    : raw.question_1_answer || ''
  // Plataforma (Q14 novo, Q102 legacy)
  const platform: string = raw.question_14_answer || raw.question_102_answer || ''

  const deriveHourlyRate = (answer: string): string => {
    if (!answer) return ''
    const t = answer.trim()
    if (t.includes('-')) {
      const [min, max] = t.split('-').map(s => s.trim())
      return `${min}€–${max}€`
    }
    return `${t}€`
  }
  const displayHourlyRate = currentData.hourly_rate || deriveHourlyRate(raw.question_7_answer || '')

  const experienceLabel = raw.question_3_answer
    ? (hasExperience ? (experienceYears ? `${experienceYears} anos de experiência` : 'Com experiência') : 'Sem experiência')
    : (currentData.experience || 'Iniciante')

  const formatLabel = (f: string) => {
    if (f === 'presencial') return 'Presencial'
    if (f === 'online') return 'Online'
    if (f === 'centro-estudo') return 'Centro de Estudo'
    return 'Presencial ou Online'
  }

  // Grelha de disponibilidade — formato: { "Seg_Manhã": true, "Ter_Tarde": false, ... }
  const scheduleRaw = raw.question_8_answer
  const schedule: Record<string, boolean> =
    scheduleRaw && typeof scheduleRaw === 'object' && !Array.isArray(scheduleRaw)
      ? scheduleRaw : {}
  const hasSchedule = Object.values(schedule).some(v => v === true)

  const showLocationCard = format === 'presencial' || format === 'centro-estudo'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-primary">
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-20">
          <motion.div {...fade()} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium text-primary-foreground/70">Perfil do Explicador</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="rounded-xl border-primary-foreground/20 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
              >
                ← Voltar
              </Button>
              {isOwner && (
                isEditing ? (
                  <>
                    <Button
                      onClick={() => { setIsEditing(false); setEditData(tutor) }}
                      variant="outline"
                      className="rounded-xl border-primary-foreground/20 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
                    >
                      <X className="w-4 h-4 mr-1" /> Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                    >
                      <Save className="w-4 h-4 mr-1" /> Guardar
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="rounded-xl border-primary-foreground/20 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
                  >
                    <Edit3 className="w-4 h-4 mr-1" /> Editar Perfil
                  </Button>
                )
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-14 pb-16">

        {/* ── Profile Card ──────────────────────────────────────────────── */}
        <motion.div {...fade(0.1)}>
          <Card className="border-none shadow-[0_4px_24px_hsl(150_20%_20%/0.08)] mb-6">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-start">

                {/* Avatar / Upload */}
                <div className="shrink-0">
                  {isEditing ? (
                    <ProfilePictureUpload
                      currentImage={currentData.profile_picture || undefined}
                      onProcessed={handleProcessedPhoto}
                    />
                  ) : (
                    <img
                      src={currentData.profile_picture || '/default-avatar.svg'}
                      alt={currentData.name}
                      className="w-24 h-24 rounded-full object-cover object-top ring-4 ring-accent/30 shadow-lg"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <Input
                      value={currentData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="text-2xl font-bold mb-2 h-12 rounded-xl"
                      placeholder="O teu nome"
                    />
                  ) : (
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight mb-1">
                      {currentData.name}
                    </h1>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                    {academicDegree && (
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4" /> {academicDegree}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" /> {experienceLabel}
                    </span>
                    {displayHourlyRate && (
                      <span className="flex items-center gap-1.5">
                        <Euro className="w-4 h-4" />
                        {isEditing ? (
                          <Input
                            value={currentData.hourly_rate || ''}
                            onChange={(e) => setEditData({ ...editData, hourly_rate: e.target.value })}
                            className="h-7 w-28 text-xs rounded-lg"
                            placeholder="Ex: 15€/hora"
                          />
                        ) : (
                          `${displayHourlyRate}/hora`
                        )}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <Textarea
                      value={currentData.bio || ''}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      placeholder="Apresenta-te aos teus futuros alunos..."
                      className="text-sm rounded-xl resize-y min-h-[80px]"
                    />
                  ) : (
                    currentData.bio ? (
                      <p className="text-muted-foreground text-sm leading-relaxed max-w-prose">
                        {currentData.bio}
                      </p>
                    ) : isOwner ? (
                      <p className="text-muted-foreground text-sm italic">
                        Adiciona uma apresentação para ganhar mais alunos!
                      </p>
                    ) : null
                  )}
                </div>
              </div>

              {/* Separador */}
              <div className="h-px bg-border my-6" />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {[
                  { label: 'Modalidade', value: teachingType || '—' },
                  { label: 'Tipo', value: formatLabel(format) },
                  { label: 'Horas/semana', value: horasSemana || '—' },
                  { label: 'Valor/hora', value: displayHourlyRate || 'Sob consulta' },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-xl bg-muted/60">
                    <p className="text-lg font-bold text-primary">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Avaliação */}
              {(tutor.rating || tutor.total_students) && (
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                  {tutor.rating && (
                    <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {tutor.rating}
                    </span>
                  )}
                  {tutor.total_students != null && (
                    <span className="text-sm text-muted-foreground">{tutor.total_students} alunos ativos</span>
                  )}
                </div>
              )}

              {/* Botão de contacto */}
              {!isOwner && (
                <Button
                  onClick={handleContactTutor}
                  className="w-full mt-6 py-5 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <Mail className="w-4 h-4 mr-2" /> Marcar Aula
                </Button>
              )}

              {isOwner && isEditing && (
                <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-xl text-center text-sm text-accent-foreground">
                  <strong>Modo de Edição</strong> — Altera os campos acima e clica na foto para alterar o avatar.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Banner: perfil incompleto ─────────────────────────────────── */}
        {isOwner && !tutor.profile_picture?.startsWith('data:image') && (
          <motion.div {...fade(0.15)} className="mb-6">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-accent/40 bg-student-yellow-light/40">
              <Camera className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  O teu perfil ainda não está público
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adiciona uma foto de perfil para o teu perfil ficar visível no marketplace e os alunos te encontrarem.
                </p>
                <button
                  onClick={() => { setIsEditing(true); setTimeout(() => fileInputRef.current?.click(), 100) }}
                  className="mt-2 text-xs font-semibold text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
                >
                  Adicionar foto agora →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Grelha de Secções ─────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">

          <Section icon={BookOpen} title="Disciplinas" delay={0.05}>
            <TagList items={subjects} />
          </Section>

          <Section icon={Users} title="Níveis de Ensino" delay={0.1}>
            <TagList items={teachingLevels} variant="secondary" />
          </Section>

          <Section icon={Lightbulb} title="Abordagem de Ensino" delay={0.15}>
            {methodology.length > 0 ? (
              <ul className="space-y-2">
                {methodology.map((m) => (
                  <li key={m} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {m}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </Section>

          {showLocationCard ? (
            <Section icon={MapPin} title="Localização" delay={0.2}>
              <div className="space-y-2 text-sm">
                {district && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distrito</span>
                    <span className="font-medium">{district}</span>
                  </div>
                )}
                {municipality && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Município</span>
                    <span className="font-medium">{municipality}</span>
                  </div>
                )}
                {parish && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Freguesia</span>
                    <span className="font-medium">{parish}</span>
                  </div>
                )}
                {!district && !municipality && <span className="text-muted-foreground">—</span>}
              </div>
            </Section>
          ) : format === 'online' ? (
            <Section icon={Monitor} title="Plataforma Online" delay={0.2}>
              <div className="flex items-center gap-2 text-sm">
                <Video className="w-4 h-4 text-muted-foreground" />
                <span>{platform || 'A combinar'}</span>
              </div>
            </Section>
          ) : (
            <Section icon={Home} title="Formato" delay={0.2}>
              <span className="text-sm text-muted-foreground">{formatLabel(format)}</span>
            </Section>
          )}

          <Section icon={Heart} title="Perfil do Aluno" delay={0.25}>
            <TagList items={specialNeeds} variant="secondary" />
          </Section>

          <Section icon={Gamepad2} title="Hobbies & Interesses" delay={0.3}>
            <TagList items={hobbies} variant="outline" />
          </Section>
        </div>

        {/* ── Disponibilidade Semanal ───────────────────────────────────── */}
        {hasSchedule && (
          <motion.div {...fade(0.35)} className="mb-12">
            <Card className="border-none shadow-[0_2px_12px_hsl(150_20%_20%/0.06)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                    <Calendar className="w-[18px] h-[18px] text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground tracking-tight">Disponibilidade Semanal</h2>
                </div>
                <div className="overflow-x-auto -mx-2 px-2">
                  <div className="min-w-[420px]">
                    <div className="grid grid-cols-[56px_repeat(7,1fr)] gap-1">
                      <div />
                      {SCHED_DAYS.map((day, i) => (
                        <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                          {SCHED_DAYS_FULL[i].slice(0, 3)}
                        </div>
                      ))}
                      {SCHED_SLOTS.map((slot) => (
                        <React.Fragment key={slot}>
                          <div className="text-xs text-muted-foreground flex items-center justify-end pr-3">
                            {slot}
                          </div>
                          {SCHED_DAYS.map((day) => {
                            const active = schedule[`${day}_${slot}`] === true
                            return (
                              <div
                                key={`${day}-${slot}`}
                                className={`h-9 rounded transition-colors ${active ? 'bg-primary/75' : 'bg-muted/40'}`}
                              />
                            )
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/75" /> Disponível</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted/40" /> Indisponível</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Fallback texto de disponibilidade se não houver grelha */}
        {!hasSchedule && currentData.availability_summary && (
          <motion.div {...fade(0.35)} className="mb-12">
            <Card className="border-none shadow-[0_2px_12px_hsl(150_20%_20%/0.06)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                    <Clock className="w-[18px] h-[18px] text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground tracking-tight">Disponibilidade</h2>
                </div>
                {isEditing ? (
                  <Input
                    value={currentData.availability_summary || ''}
                    onChange={(e) => setEditData({ ...editData, availability_summary: e.target.value })}
                    className="h-9 text-sm rounded-xl"
                    placeholder="Ex: Fim de semana / Pós-laboral"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{currentData.availability_summary}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

      </div>
    </div>
  )
}

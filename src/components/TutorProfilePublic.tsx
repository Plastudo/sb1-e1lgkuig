import React, { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { supabase } from "../lib/supabase"
import { useAuth } from "../contexts/AuthContext"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import {
  GraduationCap, Euro, MapPin, Monitor, BookOpen,
  Users, Gamepad2, Heart, Calendar, Briefcase, Lightbulb,
  Mail, Star, CheckCircle2, Home, Video, Clock, X, Send
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
  education_university: string
  education_course: string
  success_rate: string
  total_students: number
  raw_answers: Record<string, any>
  // Semantic columns
  class_type?: string[]
  teaching_levels?: string[]
  sessions_per_week?: string
  modalities?: string[]
  municipality?: string
  parish?: string
  teaching_approach?: string[]
  hobbies?: string[]
  accepted_profiles?: string[]
  schedule?: Record<string, any>
}

// ── Animação de entrada ──────────────────────────────────────────────────────
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
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
const TagList = ({ items, variant = "default" }: {
  items: string[]; variant?: "default" | "secondary" | "outline"
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
const SCHED_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const
const SCHED_DAYS_FULL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
const SCHED_SLOTS = ["Manhã", "Tarde", "Noite"] as const

// ── Componente principal ─────────────────────────────────────────────────────
export const TutorProfilePublic = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tutor, setTutor] = useState<PublicTutor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactSent, setContactSent] = useState(false)
  const timeoutRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!id) { setError("ID inválido"); setLoading(false); return }

    const fetchTutor = async () => {
      const { data, error } = await supabase
        .from("tutores")
        .select("*")
        .eq("id", id)
        .single()

      if (error || !data) setError("Tutor não encontrado")
      else setTutor(data)
      setLoading(false)
    }

    fetchTutor()
  }, [id])

  useEffect(() => {
    if (!user || !id) { setIsFavorite(false); return }
    supabase
      .from("student_favorites")
      .select("id")
      .eq("student_user_id", user.id)
      .eq("tutor_id", id)
      .maybeSingle()
      .then(({ data }) => setIsFavorite(!!data))
  }, [user, id])

  const toggleFavorite = async () => {
    if (!user || !id || toggling) return
    setToggling(true)
    if (isFavorite) {
      await supabase
        .from("student_favorites")
        .delete()
        .eq("student_user_id", user.id)
        .eq("tutor_id", id)
      setIsFavorite(false)
    } else {
      await supabase
        .from("student_favorites")
        .insert({ student_user_id: user.id, tutor_id: id })
      setIsFavorite(true)
    }
    setToggling(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !tutor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-8 bg-white rounded-2xl shadow-sm text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Ops!</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  // ── Derivar dados do Supabase ────────────────────────────────────────────
  // raw_answers pode vir como string JSON ou objeto
  const raw = (() => {
    const r = tutor.raw_answers
    if (!r) return {}
    if (typeof r === 'string') { try { return JSON.parse(r) } catch { return {} } }
    if (typeof r === 'object') return r as Record<string, any>
    return {}
  })()

  const toArr = (v: any): string[] => Array.isArray(v) ? v : (v ? [String(v)] : [])
  const firstFilled = (...vals: any[]): string[] => vals.map(toArr).find(a => a.length > 0) ?? []

  // Semantic columns take priority; raw_answers used as fallback for pre-migration tutors
  const subjects       = firstFilled(tutor.subjects, raw.question_4_answer, raw.question_5_answer)
  const teachingLevels = firstFilled(tutor.teaching_levels, raw.question_3_answer, raw.question_4_answer)
  const methodology    = firstFilled(tutor.teaching_approach, raw.question_13_answer, raw.question_15_answer)
  const specialNeeds   = firstFilled(tutor.accepted_profiles, raw.question_15_answer, raw.question_17_answer)
  const hobbies        = firstFilled(tutor.hobbies, raw.question_14_answer, raw.question_16_answer)

  const modalities     = firstFilled(tutor.modalities, raw.question_8_answer, raw.question_9_answer)
  const format: string = modalities[0] || raw.question_9_answer || "indiferente"

  const academicDegree: string = tutor.education || raw.question_12_answer || raw.question_2_answer || ""

  // Experience: new tutors have tutor.experience column ("X anos" / "Sem experiência")
  // Old tutors had question_3_answer = "Sim"/"Não" + question_3_extra for years
  const experienceLabel: string = tutor.experience
    || (raw.question_3_answer === "Sim"
        ? (raw.question_3_extra ? `${raw.question_3_extra} anos de experiência` : "Com experiência")
        : raw.question_3_answer === "Não" ? "Sem experiência" : "")

  const district: string     = tutor.location    || raw.question_9_answer  || raw.question_11_answer || raw.question_10_answer || ""
  const municipality: string = tutor.municipality || raw.question_9_municipality || raw.question_12_answer || raw.question_11_answer || ""
  const parish: string       = tutor.parish       || raw.question_9_parish  || raw.question_13_answer || raw.question_12_answer || ""

  const horasSemana: string = tutor.sessions_per_week || raw.question_5_answer || raw.question_6_answer || ""

  const teachingType: string = firstFilled(tutor.class_type, raw.question_1_answer)[0] || ""

  // Plataforma (Q14 novo, Q102 legacy)
  const platform: string = raw.question_14_answer || raw.question_102_answer || ""

  const deriveHourlyRate = (answer: string): string => {
    if (!answer) return ""
    const t = answer.trim()
    if (t.includes("-")) {
      const [min, max] = t.split("-").map(s => s.trim())
      return `${min}€–${max}€`
    }
    return `${t}€`
  }
  const displayHourlyRate = tutor.hourly_rate || deriveHourlyRate(raw.question_7_answer || raw.question_6_answer || "")

  const formatLabel = (f: string) => {
    if (f === "presencial") return "Presencial"
    if (f === "online") return "Online"
    if (f === "centro-estudo") return "Centro de Estudo"
    return "Presencial ou Online"
  }

  const showLocationCard = format === "presencial" || format === "centro-estudo"

  const scheduleRaw = raw.question_8_answer
  const schedule: Record<string, boolean> =
    scheduleRaw && typeof scheduleRaw === "object" && !Array.isArray(scheduleRaw)
      ? scheduleRaw : {}
  const hasSchedule = Object.values(schedule).some(v => v === true)

  const handleContact = () => {
    setShowContactModal(true)
  }

  const confirmContact = () => {
    setContactSent(true)
    timeoutRef.current = setTimeout(() => {
      setShowContactModal(false)
      setContactSent(false)
      const a = document.createElement('a')
      a.href = `mailto:${tutor.email}?subject=${encodeURIComponent('Pedido de Aula via TuTmait')}`
      a.target = '_blank'
      a.click()
    }, 2000)
  }

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
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="rounded-xl border-primary-foreground/20 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
            >
              ← Voltar
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-14 pb-16">

        {/* ── Profile Card ──────────────────────────────────────────────── */}
        <motion.div {...fade(0.1)}>
          <Card className="border-none shadow-[0_4px_24px_hsl(150_20%_20%/0.08)] mb-6">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-start">

                {/* Avatar */}
                <img
                  src={tutor.profile_picture || "/default-avatar.png"}
                  alt={tutor.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-accent/30 shadow-lg shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight mb-1">
                    {tutor.name}
                  </h1>
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
                        <Euro className="w-4 h-4" /> {displayHourlyRate}/hora
                      </span>
                    )}
                  </div>
                  {tutor.bio && (
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-prose">
                      {tutor.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Separador */}
              <div className="h-px bg-border my-6" />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {[
                  { label: "Modalidade", value: teachingType || "—" },
                  { label: "Tipo", value: formatLabel(format) },
                  { label: "Horas/semana", value: horasSemana || "—" },
                  { label: "Valor/hora", value: displayHourlyRate || "Sob consulta" },
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

              {/* Botões de ação */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleContact}
                  className="flex-1 py-5 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <Mail className="w-4 h-4 mr-2" /> Marcar Aula
                </Button>
                {user && (
                  <Button
                    variant="outline"
                    onClick={toggleFavorite}
                    disabled={toggling}
                    className={`px-4 py-5 rounded-xl border-2 transition-all ${isFavorite ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
                    title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-primary' : ''}`} />
                  </Button>
                )}
              </div>
              <p className="text-xs text-center text-muted-foreground mt-3">Resposta habitualmente em poucas horas</p>
            </CardContent>
          </Card>
        </motion.div>

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
          ) : format === "online" ? (
            <Section icon={Monitor} title="Plataforma Online" delay={0.2}>
              <div className="flex items-center gap-2 text-sm">
                <Video className="w-4 h-4 text-muted-foreground" />
                <span>{platform || "A combinar"}</span>
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
                        <React.Fragment key={`label-group-${slot}`}>
                          <div className="text-xs text-muted-foreground flex items-center justify-end pr-3">
                            {slot}
                          </div>
                          {SCHED_DAYS.map((day) => {
                            const active = schedule[`${day}_${slot}`] === true
                            return (
                              <div
                                key={`${day}-${slot}`}
                                className={`h-9 rounded transition-colors ${active ? "bg-primary/75" : "bg-muted/40"}`}
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

        {/* Fallback texto de disponibilidade */}
        {!hasSchedule && tutor.availability_summary && (
          <motion.div {...fade(0.35)} className="mb-12">
            <Card className="border-none shadow-[0_2px_12px_hsl(150_20%_20%/0.06)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                    <Clock className="w-[18px] h-[18px] text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground tracking-tight">Disponibilidade</h2>
                </div>
                <p className="text-sm text-muted-foreground">{tutor.availability_summary}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

      </div>

      {/* ── Contact Modal ─────────────────────────────────────────────── */}
      {showContactModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowContactModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 z-10 text-center"
          >
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {contactSent ? (
              <div className="py-8 space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">A conectar...</h3>
                <p className="text-muted-foreground text-sm">
                  Vamos abrir o teu gestor de email para entrares em contacto direto.
                </p>
              </div>
            ) : (
              <div className="py-4">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-5">
                  <Mail className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Marcar Aula</h3>
                <p className="text-muted-foreground text-sm mb-8">
                  Desejas enviar um pedido de contacto para <strong>{tutor.name}</strong>?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowContactModal(false)}
                    className="flex-1 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmContact}
                    className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4 mr-2" /> Avançar
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

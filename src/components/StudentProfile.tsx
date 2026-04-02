import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { StudentData, StudentNote, TutorData } from '../lib/supabase'
import rapazAEstudar from '../assets/rapaz-a-estudar-nobg.png'
import { Footer } from './Footer'
import {
  BookOpen, MapPin, Wifi, Home, Mail,
  Calendar, CreditCard, Folder, BarChart2, Users,
  Plus, Trash2, Edit2, Heart, MessageCircle, CheckCircle2,
  ChevronLeft, Clock, ArrowLeft
} from 'lucide-react'

type ActiveSection = 'tutors' | 'grades' | 'schedule' | 'payments' | 'materials'
type TutorTab = 'favorites' | 'contacted' | 'active'
type TutorDetailTab = 'schedule' | 'payments' | 'materials' | 'chat'

const MODE_LABEL: Record<string, string> = {
  presencial: 'Presencial',
  'centro-estudo': 'Centro de Estudo',
  online: 'Online',
  indiferente: 'Presencial e Online',
}

export const StudentProfile = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // Navigation
  const [activeSection, setActiveSection] = useState<ActiveSection>('tutors')
  const [tutorTab, setTutorTab] = useState<TutorTab>('favorites')
  const [selectedTutor, setSelectedTutor] = useState<TutorData | null>(null)
  const [tutorDetailTab, setTutorDetailTab] = useState<TutorDetailTab>('schedule')

  // Favorites
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [favoriteTutors, setFavoriteTutors] = useState<TutorData[]>([])
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Notes
  const [notes, setNotes] = useState<StudentNote[]>([])
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [editingNote, setEditingNote] = useState<StudentNote | null>(null)
  const [noteForm, setNoteForm] = useState({ subject: '', grade: '', date: '', notes: '' })
  const [savingNote, setSavingNote] = useState(false)

  // Pipeline (Favoritos -> Contactados -> Ativos)
  const [pipeline, setPipeline] = useState<Record<string, 'favoritos' | 'contactados' | 'ativos'>>({})

  // ── Load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return // aguarda auth resolver

    if (user) {
      loadStudentData()
      loadFavorites()
      loadNotes()
      return
    }

    // user ainda null mas auth já resolveu — pode ser race condition
    // confirmar diretamente com o Supabase antes de redirecionar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/login')
      // se há sessão, o AuthContext vai atualizar o user em breve → effect re-corre
    })
  }, [user, authLoading, navigate])

  const loadStudentData = async () => {
    if (!user) { setLoading(false); return }
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) console.warn('students query:', error.message, error.code)
      setStudentData(data ?? null)
    } catch (err) {
      console.warn('loadStudentData exception:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = async () => {
    if (!user) return
    const { data: favRows } = await supabase
      .from('student_favorites')
      .select('tutor_id')
      .eq('student_user_id', user.id)
    if (!favRows || favRows.length === 0) return
    const ids = favRows.map((f: any) => f.tutor_id)
    setFavoriteIds(ids)
    const { data: tutors } = await supabase
      .from('tutores')
      .select('*')
      .in('id', ids)
    setFavoriteTutors((tutors as TutorData[]) || [])
  }

  const loadNotes = async () => {
    if (!user) return
    const { data } = await supabase
      .from('student_notes')
      .select('*')
      .eq('student_user_id', user.id)
      .order('date', { ascending: false })
    if (data) setNotes(data as StudentNote[])

    // Carregar pipeline local
    const savedPipeline = localStorage.getItem(`tutmait_tutor_pipeline_${user.id}`)
    if (savedPipeline) {
      try {
        setPipeline(JSON.parse(savedPipeline))
      } catch (e) {
        console.error('Falha ao carregar pipeline local', e)
      }
    }
  }

  // ── Favorites toggle ──────────────────────────────────────────────────
  const toggleFavorite = async (tutor: TutorData) => {
    if (!user || !tutor.id) return
    setTogglingId(tutor.id)
    if (favoriteIds.includes(tutor.id)) {
      await supabase
        .from('student_favorites')
        .delete()
        .eq('student_user_id', user.id)
        .eq('tutor_id', tutor.id)
      setFavoriteIds(prev => prev.filter(id => id !== tutor.id))
      setFavoriteTutors(prev => prev.filter(t => t.id !== tutor.id))
    } else {
      await supabase
        .from('student_favorites')
        .insert({ student_user_id: user.id, tutor_id: tutor.id })
      setFavoriteIds(prev => [...prev, tutor.id!])
      setFavoriteTutors(prev => [...prev, tutor])
    }
    setTogglingId(null)
  }

  // ── Notes CRUD ────────────────────────────────────────────────────────
  const openAddNote = () => {
    setEditingNote(null)
    setNoteForm({ subject: '', grade: '', date: new Date().toISOString().slice(0, 10), notes: '' })
    setShowNoteForm(true)
  }

  const openEditNote = (note: StudentNote) => {
    setEditingNote(note)
    setNoteForm({ subject: note.subject, grade: note.grade, date: note.date, notes: note.notes || '' })
    setShowNoteForm(true)
  }

  const saveNote = async () => {
    if (!user || !noteForm.subject || !noteForm.grade || !noteForm.date) return
    setSavingNote(true)
    const payload = { ...noteForm, student_user_id: user.id }
    if (editingNote?.id) {
      await supabase.from('student_notes').update(payload).eq('id', editingNote.id)
    } else {
      await supabase.from('student_notes').insert(payload)
    }
    setShowNoteForm(false)
    setEditingNote(null)
    setSavingNote(false)
    loadNotes()
  }

  const deleteNote = async (id: string) => {
    await supabase.from('student_notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  // ── Kanban Actions ─────────────────────────────────────────────────────
  const moveTutor = (tutorId: string, status: 'favoritos' | 'contactados' | 'ativos') => {
    if (!user) return
    setPipeline(prev => {
      const next = { ...prev, [tutorId]: status }
      localStorage.setItem(`tutmait_tutor_pipeline_${user.id}`, JSON.stringify(next))
      return next
    })
  }

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('tutorId', id)
  }
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  const onDrop = (e: React.DragEvent, status: 'favoritos' | 'contactados' | 'ativos') => {
    e.preventDefault()
    const id = e.dataTransfer.getData('tutorId')
    if (id) moveTutor(id, status)
  }

  // ── Quick actions ──────────────────────────────────────────────────────
  const quickActions: {
    id: ActiveSection | 'guardian'
    icon: React.FC<any>
    label: string
    disabled?: boolean
    badge?: string
  }[] = [
    { id: 'tutors',    icon: Users,       label: 'Explicadores' },
    { id: 'grades',    icon: BookOpen,    label: 'Notas' },
    { id: 'schedule',  icon: Calendar,    label: 'Agendamentos', disabled: true, badge: 'Em dev' },
    { id: 'payments',  icon: CreditCard,  label: 'Pagamentos', disabled: true, badge: 'Em dev' },
    { id: 'materials', icon: Folder,      label: 'Conteúdos', disabled: true, badge: 'Em dev' },
    { id: 'guardian',  icon: Users,       label: 'Encarregado de Educação', disabled: true, badge: 'Em dev' },
  ]

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background animate-pulse">
        <div className="h-64 bg-student-yellow-light/60 rounded-b-3xl" />
        <div className="max-w-4xl mx-auto px-4 mt-6 space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded-2xl" />
          <div className="h-48 bg-muted rounded-2xl" />
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="p-8 bg-white rounded-2xl shadow-sm text-center max-w-sm">
          <p className="text-2xl mb-2">⚠️</p>
          <h2 className="text-lg font-bold text-foreground mb-2">Erro ao carregar perfil</h2>
          <p className="text-muted-foreground text-sm mb-4">Não foi possível carregar os teus dados. Tenta novamente.</p>
          <button
            onClick={() => { setLoadError(false); setLoading(true); loadStudentData() }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!user) return null

  // ── Derived data ───────────────────────────────────────────────────────
  const raw = studentData?.raw_answers || {}
  const subjects: string[] = Array.isArray(raw.question_3_answer) ? raw.question_3_answer : []
  const mode: string = raw.question_7_answer || ''
  const district: string = raw.question_8_answer || ''
  const municipality: string = raw.question_8_municipality || ''
  const locationStr = [municipality, district].filter(Boolean).join(', ')

  const displayName =
    studentData?.name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')?.[0] ||
    'Estudante'

  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // ── Render: Tutor Detail ───────────────────────────────────────────────
  if (selectedTutor) {
    const tutorRaw = selectedTutor.raw_answers || {}
    const rawSubjects = selectedTutor.subjects || tutorRaw.question_5_answer || tutorRaw.question_4_answer || []
    const tutorSubjects: string[] = Array.isArray(rawSubjects) ? rawSubjects : [rawSubjects].filter(Boolean)

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="max-w-4xl mx-auto px-4 py-6 flex-1 w-full">

          {/* Back */}
          <button
            onClick={() => setSelectedTutor(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao perfil
          </button>

          {/* Tutor header */}
          <div className="flex items-center gap-4 mb-6">
            <img
              src={selectedTutor.profile_picture || '/default-avatar.svg'}
              alt={selectedTutor.name}
              className="w-16 h-16 rounded-2xl object-cover object-top border-2 border-border"
            />
            <div>
              <h2 className="text-xl font-bold text-foreground">{selectedTutor.name}</h2>
              <div className="flex flex-wrap gap-1 mt-1">
                {tutorSubjects.slice(0, 3).map(s => (
                  <span key={s} className="px-2 py-0.5 bg-tutor-green-light text-primary rounded-full text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-2 mb-6 bg-muted rounded-2xl p-1">
            {([
              { id: 'schedule',  icon: Calendar,        label: 'Agendamentos' },
              { id: 'payments',  icon: CreditCard,       label: 'Pagamentos' },
              { id: 'materials', icon: Folder,           label: 'Conteúdos' },
              { id: 'chat',      icon: MessageCircle,    label: 'Chat' },
            ] as { id: TutorDetailTab; icon: React.FC<any>; label: string }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => tab.id !== 'chat' && setTutorDetailTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all relative
                  ${tutorDetailTab === tab.id && tab.id !== 'chat'
                    ? 'bg-white shadow-sm text-foreground'
                    : 'text-muted-foreground'}
                  ${tab.id === 'chat' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-foreground'}
                `}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === 'chat' && (
                  <span className="ml-1 px-1.5 py-0.5 bg-muted-foreground/20 rounded text-[9px] font-bold">Dev</span>
                )}
              </button>
            ))}
          </div>

          {/* Sub-tab content */}
          <Card className="p-8 rounded-2xl border border-border/50 text-center">
            <div className="w-14 h-14 bg-student-yellow-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              {tutorDetailTab === 'schedule'  && <Calendar   className="w-7 h-7 text-accent" />}
              {tutorDetailTab === 'payments'  && <CreditCard  className="w-7 h-7 text-accent" />}
              {tutorDetailTab === 'materials' && <Folder      className="w-7 h-7 text-accent" />}
            </div>
            <p className="text-base font-semibold text-foreground mb-1">
              {tutorDetailTab === 'schedule'  && 'Sem agendamentos'}
              {tutorDetailTab === 'payments'  && 'Sem pagamentos'}
              {tutorDetailTab === 'materials' && 'Sem conteúdos partilhados'}
            </p>
            <p className="text-sm text-muted-foreground">
              Quando {selectedTutor.name.split(' ')[0]} partilhar{' '}
              {tutorDetailTab === 'schedule'  && 'horários, aparecerão aqui.'}
              {tutorDetailTab === 'payments'  && 'faturas, aparecerão aqui.'}
              {tutorDetailTab === 'materials' && 'ficheiros, aparecerão aqui.'}
            </p>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-student-yellow-light" style={{ minHeight: 220 }}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(45 70% 62%) 0%, transparent 60%)',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-6 py-6 flex items-start gap-6">
          {/* Rapaz image */}
          <div className="shrink-0" style={{ height: 180 }}>
            <img
              src={rapazAEstudar}
              alt="Estudante"
              className="h-full w-auto object-contain object-top"
            />
          </div>

          {/* Info */}
          <div className="pt-1">
            <span className="inline-block px-3 py-1 rounded-full bg-accent text-foreground text-xs font-bold mb-2 shadow-sm">
              Estudante
            </span>
            <h1 className="text-2xl font-black text-foreground leading-tight">{displayName}</h1>
            <p className="text-sm text-foreground/60 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 w-full flex-1 py-6 space-y-6">

        {/* ── INFO ROW ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Disciplinas */}
          <Card className="p-4 rounded-2xl border border-border/50 bg-white">
            <div className="flex items-center gap-2 text-accent mb-2">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Disciplinas</span>
            </div>
            {subjects.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {subjects.slice(0, 4).map(s => (
                  <span key={s} className="px-2 py-0.5 bg-student-yellow-light text-foreground rounded-full text-xs font-medium">
                    {s}
                  </span>
                ))}
                {subjects.length > 4 && (
                  <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs">
                    +{subjects.length - 4}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </Card>

          {/* Modo */}
          <Card className="p-4 rounded-2xl border border-border/50 bg-white">
            <div className="flex items-center gap-2 mb-2">
              {mode === 'online' ? <Wifi className="w-4 h-4 text-accent" /> : <Home className="w-4 h-4 text-accent" />}
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Modo preferido</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {MODE_LABEL[mode] || '—'}
            </p>
          </Card>

          {/* Localização */}
          <Card className="p-4 rounded-2xl border border-border/50 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Localização</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {locationStr || '—'}
            </p>
          </Card>
        </div>

        {/* ── QUICK ACTIONS ────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Acesso rápido
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {quickActions.map(action => {
              const isActive = activeSection === action.id
              return (
                <button
                  key={action.id}
                  disabled={action.disabled}
                  onClick={() => !action.disabled && setActiveSection(action.id as ActiveSection)}
                  className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all text-center
                    ${action.disabled
                      ? 'border-border/30 bg-muted/30 opacity-50 cursor-not-allowed'
                      : isActive
                        ? 'border-accent bg-student-yellow-light shadow-sm'
                        : 'border-border/50 bg-white hover:border-accent/50 hover:bg-student-yellow-light/30 cursor-pointer'
                    }`}
                >
                  <action.icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-muted-foreground'}`} />
                  <span className={`text-[10px] font-semibold leading-tight ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {action.label}
                  </span>
                  {action.badge && (
                    <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[8px] font-bold leading-none shadow-sm">
                      Dev
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* EXPLICADORES KANBAN PIPELINE */}
          {activeSection === 'tutors' && (
            <motion.div
              key="tutors"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Users className="w-6 h-6 text-accent" />
                  Os Meus Explicadores
                </h2>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-semibold">
                Arrasta os explicadores de uma coluna para a outra
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {([
                  { id: 'favoritos', title: 'Favoritos', icon: Heart, bg: 'bg-student-yellow-light/40 border-accent/20' },
                  { id: 'contactados', title: 'Contactados', icon: MessageCircle, bg: 'bg-blue-50 border-blue-100' },
                  { id: 'ativos', title: 'Ativos', icon: CheckCircle2, bg: 'bg-green-50 border-green-100' },
                ] as const).map(col => {
                  
                  const colTutors = favoriteTutors.filter(t => {
                    const status = pipeline[t.id!] || 'favoritos'
                    return status === col.id
                  })

                  return (
                    <div
                      key={col.id}
                      className={`rounded-2xl border p-4 flex flex-col h-full min-h-[300px] transition-colors ${col.bg}`}
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(e, col.id)}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <col.icon className="w-5 h-5 text-foreground/70" />
                        <h3 className="font-bold text-foreground text-base">{col.title}</h3>
                        <span className="ml-auto bg-white px-2 py-0.5 rounded-full text-xs font-bold text-muted-foreground shadow-sm">
                          {colTutors.length}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col gap-3">
                        {colTutors.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 opacity-50">
                            <col.icon className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">Vazio</p>
                          </div>
                        ) : (
                          colTutors.map(tutor => {
                            const tutorRaw = tutor.raw_answers || {}
                            const rawSubjects = tutor.subjects || tutorRaw.question_5_answer || tutorRaw.question_4_answer || []
                            const tutorSubjects: string[] = Array.isArray(rawSubjects) ? rawSubjects : [rawSubjects].filter(Boolean)
                            return (
                              <div
                                key={tutor.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, tutor.id!)}
                                onClick={() => navigate(`/profile/${tutor.id}`)}
                                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing border border-border/70 transition-all group relative"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(tutor);
                                  }}
                                  className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <div className="flex items-start gap-3 mb-2 pr-6">
                                  <img
                                    src={tutor.profile_picture || '/default-avatar.svg'}
                                    alt={tutor.name}
                                    className="w-10 h-10 rounded-full object-cover shrink-0 border"
                                  />
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-sm text-foreground truncate group-hover:text-accent transition-colors">
                                      {tutor.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground truncate line-clamp-1">
                                      {tutorSubjects.join(', ')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* GRADES section */}
          {activeSection === 'grades' && (
            <motion.div
              key="grades"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">As Minhas Notas</h2>
                <Button
                  size="sm"
                  onClick={openAddNote}
                  variant="accent"
                  className="rounded-xl gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar nota
                </Button>
              </div>

              {/* Add/Edit form */}
              <AnimatePresence>
                {showNoteForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <Card className="p-5 rounded-2xl border border-accent/40 bg-student-yellow-light/20">
                      <h3 className="font-semibold text-foreground mb-4">
                        {editingNote ? 'Editar nota' : 'Nova nota'}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <Label htmlFor="note-subject" className="text-xs">Disciplina</Label>
                          <Input
                            id="note-subject"
                            value={noteForm.subject}
                            onChange={e => setNoteForm(f => ({ ...f, subject: e.target.value }))}
                            placeholder="ex: Matemática"
                            className="mt-1 rounded-xl border-border focus:border-accent"
                          />
                        </div>
                        <div>
                          <Label htmlFor="note-grade" className="text-xs">Nota</Label>
                          <Input
                            id="note-grade"
                            value={noteForm.grade}
                            onChange={e => setNoteForm(f => ({ ...f, grade: e.target.value }))}
                            placeholder="ex: 18 ou A"
                            className="mt-1 rounded-xl border-border focus:border-accent"
                          />
                        </div>
                        <div>
                          <Label htmlFor="note-date" className="text-xs">Data</Label>
                          <Input
                            id="note-date"
                            type="date"
                            value={noteForm.date}
                            onChange={e => setNoteForm(f => ({ ...f, date: e.target.value }))}
                            className="mt-1 rounded-xl border-border focus:border-accent"
                          />
                        </div>
                        <div>
                          <Label htmlFor="note-notes" className="text-xs">Observações (opcional)</Label>
                          <Input
                            id="note-notes"
                            value={noteForm.notes}
                            onChange={e => setNoteForm(f => ({ ...f, notes: e.target.value }))}
                            placeholder="ex: Teste intermédio"
                            className="mt-1 rounded-xl border-border focus:border-accent"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setShowNoteForm(false); setEditingNote(null) }}
                          className="rounded-xl"
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveNote}
                          disabled={savingNote || !noteForm.subject || !noteForm.grade || !noteForm.date}
                          variant="accent"
                          className="rounded-xl"
                        >
                          {savingNote ? 'A guardar...' : 'Guardar'}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes list */}
              {notes.length === 0 ? (
                <Card className="p-10 rounded-2xl border border-border/50 text-center bg-white">
                  <BarChart2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-semibold text-foreground mb-1">Sem notas registadas</p>
                  <p className="text-sm text-muted-foreground">Começa a registar as tuas classificações.</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {notes.map(note => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Card className="px-4 py-3 rounded-2xl border border-border/50 bg-white flex items-center gap-4">
                        {/* Grade badge */}
                        {(() => {
                          const subjectColors: Record<string, string> = {
                            'Matemática': 'bg-blue-100 text-blue-800 border-blue-200',
                            'Português': 'bg-orange-100 text-orange-800 border-orange-200',
                            'Inglês': 'bg-red-100 text-red-800 border-red-200',
                            'Física e Química': 'bg-purple-100 text-purple-800 border-purple-200',
                            'Biologia e Geologia': 'bg-green-100 text-green-800 border-green-200',
                            'História': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                            'Geografia': 'bg-teal-100 text-teal-800 border-teal-200',
                          }
                          const colorClass = subjectColors[note.subject] || 'bg-gray-100 text-gray-800 border-gray-200'
                          return (
                            <div className={`w-14 h-14 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${colorClass}`}>
                              <span className="text-xl font-black">{note.grade}</span>
                            </div>
                          )
                        })()}
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground leading-tight">{note.subject}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(note.date).toLocaleDateString('pt-PT')}
                            </span>
                            {note.notes && (
                              <span className="text-xs text-muted-foreground truncate">{note.notes}</span>
                            )}
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => openEditNote(note)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => note.id && deleteNote(note.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* SCHEDULE / PAYMENTS / MATERIALS — empty states */}
          {(activeSection === 'schedule' || activeSection === 'payments' || activeSection === 'materials') && (
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-12 rounded-2xl border border-border/50 bg-white text-center">
                <div className="w-16 h-16 bg-student-yellow-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {activeSection === 'schedule'  && <Calendar   className="w-8 h-8 text-accent" />}
                  {activeSection === 'payments'  && <CreditCard  className="w-8 h-8 text-accent" />}
                  {activeSection === 'materials' && <Folder      className="w-8 h-8 text-accent" />}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {activeSection === 'schedule'  && 'Sem agendamentos'}
                  {activeSection === 'payments'  && 'Sem pagamentos'}
                  {activeSection === 'materials' && 'Sem conteúdos'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {activeSection === 'schedule'  && 'Os teus agendamentos com explicadores aparecerão aqui.'}
                  {activeSection === 'payments'  && 'O histórico de pagamentos aparecerá aqui quando tiveres explicações ativas.'}
                  {activeSection === 'materials' && 'Os conteúdos partilhados pelos teus explicadores aparecerão aqui.'}
                </p>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
      <Footer />
    </div>
  )
}

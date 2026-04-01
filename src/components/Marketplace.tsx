import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from './ui/input'
import { supabase, TutorData } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  Search, Star, Mail, MapPin, Home, Wifi, Heart, BookOpen,
  SlidersHorizontal, X, ChevronDown, ChevronUp, Check,
} from 'lucide-react'
import { subjectsByLevelArea } from '../data/subjectsByLevel'

// ─── Filter state ─────────────────────────────────────────────────────────────

interface FilterState {
  nivel: string
  area: string
  subjects: string[]
  priceMin: string
  priceMax: string
  primeiraAulaGratuita: boolean
  modos: string[]
  dias: string[]
  periodos: string[]
  habilitacoes: string[]
  experienciaMinima: string
  comAvaliacoes: boolean
  verificado: boolean
}

const EMPTY: FilterState = {
  nivel: '', area: '', subjects: [],
  priceMin: '', priceMax: '', primeiraAulaGratuita: false,
  modos: [], dias: [], periodos: [],
  habilitacoes: [], experienciaMinima: '',
  comAvaliacoes: false, verificado: false,
}

function countActive(f: FilterState): number {
  return [
    !!f.nivel,
    f.subjects.length > 0,
    !!(f.priceMin || f.priceMax),
    f.primeiraAulaGratuita,
    f.modos.length > 0,
    f.dias.length > 0,
    f.periodos.length > 0,
    f.habilitacoes.length > 0,
    !!f.experienciaMinima,
    f.comAvaliacoes,
    f.verificado,
  ].filter(Boolean).length
}

// ─── Level / area mappings ────────────────────────────────────────────────────

const NIVEL_OPTIONS = [
  { label: '1º Ciclo',     tutorValue: 'Ensino Básico (1º ciclo)', areaKey: '1º Ciclo' },
  { label: '2º Ciclo',     tutorValue: 'Ensino Básico (2º ciclo)', areaKey: '2º Ciclo' },
  { label: '3º Ciclo',     tutorValue: 'Ensino Básico (3º ciclo)', areaKey: '3º Ciclo' },
  { label: 'Secundário',   tutorValue: 'Ensino Secundário',        areaKey: 'Secundário' },
  { label: 'Superior',     tutorValue: 'Ensino Superior',          areaKey: 'Superior' },
  { label: 'Profissional', tutorValue: 'Cursos profissionais',     areaKey: 'Profissional' },
]

const AREAS_BY_NIVEL: Record<string, string[]> = {
  '1º Ciclo':     [],
  '2º Ciclo':     [],
  '3º Ciclo':     [],
  'Secundário':   ['Ciências e Tecnologias', 'Ciências Socioeconómicas', 'Línguas e Humanidades', 'Artes Visuais'],
  'Superior':     ['Engenharia e Tecnologia', 'Medicina e Ciências da Saúde', 'Direito', 'Economia e Gestão', 'Humanidades e Línguas', 'Psicologia & Ciências Sociais', 'Educação e Formação', 'Artes, Design e Arquitectura', 'Agronomia, Ambiente e Veterinária', 'Ciências'],
  'Profissional': [],
}

const COMMON_SUBJECTS = [
  'Português', 'Matemática', 'Física', 'Química', 'Biologia',
  'História', 'Geografia', 'Inglês', 'Francês', 'Espanhol',
  'Economia', 'Informática', 'Outras',
]

function getSubjectList(nivel: string, area: string): string[] {
  if (!nivel) return COMMON_SUBJECTS
  const key = area ? `${nivel}|${area}` : nivel
  const data = subjectsByLevelArea[key]
  if (!data) return COMMON_SUBJECTS
  if (Array.isArray(data)) return data
  return Object.values(data).flat()
}

// ─── Filter logic ─────────────────────────────────────────────────────────────

function applyFilters(tutors: TutorData[], f: FilterState, search: string): TutorData[] {
  return tutors.filter(tutor => {
    const raw = tutor.raw_answers || {}
    const subjects: string[]                  = raw.question_5_answer || tutor.subjects || []
    const mode: string                        = raw.question_9_answer || ''
    const levels: string[]                    = raw.question_4_answer || []
    const hourlyRate: string                  = raw.question_7_answer || tutor.hourly_rate || ''
    const availability: Record<string, boolean> = raw.question_8_answer || {}
    const education: string                   = raw.question_2_answer || tutor.education || ''
    const expYears: number = raw.question_3_answer === 'Sim'
      ? parseInt(raw.question_3_extra || '0', 10) : 0

    // Search
    if (search) {
      const term = search.toLowerCase()
      const loc  = tutor.location || `${raw.question_11_answer || ''} ${raw.question_10_answer || ''}`
      const hit  =
        tutor.name.toLowerCase().includes(term) ||
        subjects.some(s => s.toLowerCase().includes(term)) ||
        loc.toLowerCase().includes(term)
      if (!hit) return false
    }

    // Nivel
    if (f.nivel) {
      const opt = NIVEL_OPTIONS.find(o => o.label === f.nivel)
      if (opt && levels.length > 0 && !levels.includes(opt.tutorValue)) return false
    }

    // Subjects (any match, partial)
    if (f.subjects.length > 0) {
      const hit = f.subjects.some(fs =>
        subjects.some(ts =>
          ts.toLowerCase().includes(fs.toLowerCase()) ||
          fs.toLowerCase().includes(ts.toLowerCase())
        )
      )
      if (!hit) return false
    }

    // Price
    if (f.priceMin || f.priceMax) {
      const rateMin = parseInt(hourlyRate.split('-')[0] || hourlyRate.replace('+', '') || '0', 10)
      if (f.priceMin && rateMin < parseInt(f.priceMin, 10)) return false
      if (f.priceMax && hourlyRate !== '45+' && rateMin > parseInt(f.priceMax, 10)) return false
    }

    // Mode
    if (f.modos.length > 0) {
      const tutorModes: string[] = []
      if (!mode || mode === 'indiferente') {
        tutorModes.push('online', 'presencial', 'centro-estudo')
      } else {
        tutorModes.push(mode)
      }
      if (!f.modos.some(m => tutorModes.includes(m))) return false
    }

    // Availability (dias + periodos)
    if ((f.dias.length > 0 || f.periodos.length > 0) && Object.keys(availability).length > 0) {
      const checkDias    = f.dias.length    > 0 ? f.dias    : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
      const checkPeriods = f.periodos.length > 0 ? f.periodos : ['Manhã', 'Tarde', 'Noite']
      const hasSlot = checkDias.some(d => checkPeriods.some(p => availability[`${d}_${p}`]))
      if (!hasSlot) return false
    }

    // Education
    if (f.habilitacoes.length > 0) {
      if (!f.habilitacoes.some(h => education.includes(h))) return false
    }

    // Experience minimum
    if (f.experienciaMinima && expYears < parseInt(f.experienciaMinima, 10)) return false

    // Com avaliações
    if (f.comAvaliacoes && !(tutor.rating && tutor.rating > 0)) return false

    return true
  })
}

// ─── Drawer sub-components ────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, children, defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-3.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        <span>{title}</span>
        {open
          ? <ChevronUp   className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}

const Pill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border
      ${active
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-transparent text-muted-foreground border-border hover:border-primary/60 hover:text-foreground'
      }`}
  >
    {label}
  </button>
)

const CheckRow: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2.5 cursor-pointer group py-1">
    <div
      onClick={onChange}
      className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-colors
        ${checked ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/60'}`}
    >
      {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />}
    </div>
    <span className="text-sm text-foreground/80 group-hover:text-foreground select-none">{label}</span>
  </label>
)

// ─── Filter Drawer ────────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean
  onClose: () => void
  pending: FilterState
  setPending: React.Dispatch<React.SetStateAction<FilterState>>
  onApply: () => void
}

const FilterDrawer: React.FC<DrawerProps> = ({ open, onClose, pending, setPending, onApply }) => {
  const [subjectSearch, setSubjectSearch] = useState('')

  const toggle = (key: 'subjects' | 'modos' | 'dias' | 'periodos' | 'habilitacoes', value: string) => {
    setPending(prev => {
      const arr = prev[key] as string[]
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }
    })
  }

  const areas           = AREAS_BY_NIVEL[pending.nivel] || []
  const subjectList     = getSubjectList(pending.nivel, pending.area)
  const visibleSubjects = subjectSearch
    ? subjectList.filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase()))
    : subjectList

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-background shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 className="text-base font-bold text-foreground">Filtros</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setPending(EMPTY); setSubjectSearch('') }}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  Limpar tudo
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-2">

              {/* 1. Nível de Ensino */}
              <Section title="📚 Nível de Ensino">
                <div className="flex flex-wrap gap-2">
                  {NIVEL_OPTIONS.map(({ label }) => (
                    <Pill
                      key={label}
                      label={label}
                      active={pending.nivel === label}
                      onClick={() => setPending(prev => ({
                        ...prev,
                        nivel:    prev.nivel === label ? '' : label,
                        area:     '',
                        subjects: [],
                      }))}
                    />
                  ))}
                </div>

                {areas.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/40">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Área</p>
                    <div className="flex flex-wrap gap-2">
                      {areas.map(a => (
                        <Pill
                          key={a}
                          label={a}
                          active={pending.area === a}
                          onClick={() => setPending(prev => ({
                            ...prev,
                            area:     prev.area === a ? '' : a,
                            subjects: [],
                          }))}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Section>

              {/* 2. Disciplina */}
              <Section title="📖 Disciplina" defaultOpen={false}>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Pesquisar disciplina..."
                    value={subjectSearch}
                    onChange={e => setSubjectSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                  {visibleSubjects.map(s => (
                    <CheckRow
                      key={s}
                      label={s}
                      checked={pending.subjects.includes(s)}
                      onChange={() => toggle('subjects', s)}
                    />
                  ))}
                  {visibleSubjects.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">Nenhuma disciplina encontrada.</p>
                  )}
                </div>
              </Section>

              {/* 3. Preço */}
              <Section title="💰 Preço / hora" defaultOpen={false}>
                <div className="flex items-end gap-2 mb-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Mínimo (€)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={pending.priceMin}
                      onChange={e => setPending(prev => ({ ...prev, priceMin: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <span className="text-muted-foreground pb-2.5">–</span>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Máximo (€)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="150"
                      value={pending.priceMax}
                      onChange={e => setPending(prev => ({ ...prev, priceMax: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <CheckRow
                  label="Primeira aula gratuita"
                  checked={pending.primeiraAulaGratuita}
                  onChange={() => setPending(prev => ({ ...prev, primeiraAulaGratuita: !prev.primeiraAulaGratuita }))}
                />
              </Section>

              {/* 4. Modo */}
              <Section title="📍 Modo" defaultOpen={false}>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'presencial',    label: 'Presencial' },
                    { value: 'online',        label: 'Online' },
                    { value: 'centro-estudo', label: 'Centro de Estudo' },
                  ].map(({ value, label }) => (
                    <Pill
                      key={value}
                      label={label}
                      active={pending.modos.includes(value)}
                      onClick={() => toggle('modos', value)}
                    />
                  ))}
                </div>
              </Section>

              {/* 5. Disponibilidade */}
              <Section title="🕐 Disponibilidade" defaultOpen={false}>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Dias da semana</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                    <Pill key={d} label={d} active={pending.dias.includes(d)} onClick={() => toggle('dias', d)} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Período do dia</p>
                <div className="flex flex-wrap gap-2">
                  {['Manhã', 'Tarde', 'Noite'].map(p => (
                    <Pill key={p} label={p} active={pending.periodos.includes(p)} onClick={() => toggle('periodos', p)} />
                  ))}
                </div>
              </Section>

              {/* 6. Requisitos do explicador */}
              <Section title="🎓 Requisitos do Explicador" defaultOpen={false}>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Habilitações académicas</p>
                <div className="space-y-0.5 mb-4">
                  {['Licenciatura', 'Mestrado', 'Doutoramento'].map(h => (
                    <CheckRow
                      key={h}
                      label={h}
                      checked={pending.habilitacoes.includes(h)}
                      onChange={() => toggle('habilitacoes', h)}
                    />
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mb-2 font-medium">Experiência mínima</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { value: '1', label: '1+ ano' },
                    { value: '2', label: '2+ anos' },
                    { value: '3', label: '3+ anos' },
                    { value: '5', label: '5+ anos' },
                    { value: '10', label: '10+ anos' },
                  ].map(({ value, label }) => (
                    <Pill
                      key={value}
                      label={label}
                      active={pending.experienciaMinima === value}
                      onClick={() => setPending(prev => ({
                        ...prev,
                        experienciaMinima: prev.experienciaMinima === value ? '' : value,
                      }))}
                    />
                  ))}
                </div>

                <div className="space-y-0.5">
                  <CheckRow
                    label="Com avaliações"
                    checked={pending.comAvaliacoes}
                    onChange={() => setPending(prev => ({ ...prev, comAvaliacoes: !prev.comAvaliacoes }))}
                  />
                  <CheckRow
                    label="Verificado pela plataforma"
                    checked={pending.verificado}
                    onChange={() => setPending(prev => ({ ...prev, verificado: !prev.verificado }))}
                  />
                </div>
              </Section>

            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border shrink-0">
              <button
                type="button"
                onClick={onApply}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Marketplace ──────────────────────────────────────────────────────────────

export const Marketplace = () => {
  const { user } = useAuth()
  const [tutors,          setTutors]          = useState<TutorData[]>([])
  const [filteredTutors,  setFilteredTutors]  = useState<TutorData[]>([])
  const [searchTerm,      setSearchTerm]      = useState('')
  const [drawerOpen,      setDrawerOpen]      = useState(false)
  const [pending,         setPending]         = useState<FilterState>(EMPTY)
  const [active,          setActive]          = useState<FilterState>(EMPTY)
  const [favoriteIds,     setFavoriteIds]     = useState<string[]>([])
  const [togglingId,      setTogglingId]      = useState<string | null>(null)

  // Load tutors
  const loadTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('tutores').select('*').order('created_at', { ascending: false })
      if (error) { console.error('Erro ao carregar tutores:', error); return }
      if (data) {
        const seen = new Set<string>()
        const unique = (data as TutorData[]).filter(t => {
          const key = t.user_id || t.id || ''
          if (seen.has(key)) return false
          seen.add(key); return true
        })
        const withPhoto = unique.filter(t => t.profile_picture?.startsWith('data:image'))
        setTutors(withPhoto)
        setFilteredTutors(withPhoto)
      }
    } catch (err) { console.error('Erro inesperado:', err) }
  }

  useEffect(() => { loadTutors() }, [])
  useEffect(() => {
    if (user) loadFavorites()
    else setFavoriteIds([])
  }, [user])

  const loadFavorites = async () => {
    if (!user) return
    const { data } = await supabase
      .from('student_favorites').select('tutor_id').eq('student_user_id', user.id)
    if (data) setFavoriteIds(data.map((f: any) => f.tutor_id))
  }

  const toggleFavorite = async (e: React.MouseEvent, tutorId: string) => {
    e.preventDefault()
    if (!user || !tutorId) return
    setTogglingId(tutorId)
    if (favoriteIds.includes(tutorId)) {
      await supabase.from('student_favorites').delete()
        .eq('student_user_id', user.id).eq('tutor_id', tutorId)
      setFavoriteIds(prev => prev.filter(id => id !== tutorId))
    } else {
      await supabase.from('student_favorites').insert({ student_user_id: user.id, tutor_id: tutorId })
      setFavoriteIds(prev => [...prev, tutorId])
    }
    setTogglingId(null)
  }

  // Re-filter whenever search or active filters change
  useEffect(() => {
    setFilteredTutors(applyFilters(tutors, active, searchTerm))
  }, [searchTerm, active, tutors])

  const handleOpenDrawer = () => {
    setPending(active) // sync pending with current active state
    setDrawerOpen(true)
  }

  const handleApply = () => {
    setActive(pending)
    setDrawerOpen(false)
  }

  const handleContactTutor = (email: string, tutorName: string) => {
    const subject = encodeURIComponent('Interessado em explicações - Plastudo')
    const body    = encodeURIComponent(
      `Olá ${tutorName},\n\nEncontrei o seu perfil na Plastudo e estou interessado(a) nas suas explicações.\n\nObrigado(a)!`
    )
    const a = document.createElement('a')
    a.href = `mailto:${email}?subject=${subject}&body=${body}`
    a.target = '_blank'
    a.click()
  }

  const activeCount = countActive(active)

  return (
    <>
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pending={pending}
        setPending={setPending}
        onApply={handleApply}
      />

      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Encontre o seu{' '}
              <span className="text-gradient">explicador ideal</span>
            </h1>

            <div className="max-w-4xl mx-auto flex gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 pointer-events-none" />
                <Input
                  placeholder="Pesquisar por nome, disciplina ou localização..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 py-3 text-base border-border rounded-2xl"
                />
              </div>

              {/* Filtros button */}
              <button
                type="button"
                onClick={handleOpenDrawer}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-sm font-semibold transition-all shrink-0
                  ${activeCount > 0
                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                    : 'bg-background text-foreground border-border hover:border-primary/60 hover:text-primary'
                  }`}
              >
                <SlidersHorizontal className="w-4 h-4 shrink-0" />
                <span>Filtros{activeCount > 0 ? ` (${activeCount})` : ''}</span>
              </button>
            </div>
          </motion.div>

          {/* ── Active filter chips ── */}
          {activeCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto mb-5 flex flex-wrap items-center gap-2"
            >
              {active.nivel && (
                <Chip
                  label={active.area ? `${active.nivel} · ${active.area}` : active.nivel}
                  onRemove={() => setActive(prev => ({ ...prev, nivel: '', area: '', subjects: [] }))}
                />
              )}
              {active.subjects.length > 0 && (
                <Chip
                  label={active.subjects.length === 1 ? active.subjects[0] : `${active.subjects.length} disciplinas`}
                  onRemove={() => setActive(prev => ({ ...prev, subjects: [] }))}
                />
              )}
              {(active.priceMin || active.priceMax) && (
                <Chip
                  label={
                    active.priceMin && active.priceMax ? `${active.priceMin}€ – ${active.priceMax}€/h`
                    : active.priceMin ? `Mín. ${active.priceMin}€/h`
                    : `Máx. ${active.priceMax}€/h`
                  }
                  onRemove={() => setActive(prev => ({ ...prev, priceMin: '', priceMax: '' }))}
                />
              )}
              {active.primeiraAulaGratuita && (
                <Chip label="1ª aula gratuita" onRemove={() => setActive(prev => ({ ...prev, primeiraAulaGratuita: false }))} />
              )}
              {active.modos.length > 0 && (
                <Chip label={active.modos.join(', ')} onRemove={() => setActive(prev => ({ ...prev, modos: [] }))} />
              )}
              {(active.dias.length > 0 || active.periodos.length > 0) && (
                <Chip
                  label={[...active.dias, ...active.periodos].join(', ')}
                  onRemove={() => setActive(prev => ({ ...prev, dias: [], periodos: [] }))}
                />
              )}
              {active.habilitacoes.length > 0 && (
                <Chip label={active.habilitacoes.join(', ')} onRemove={() => setActive(prev => ({ ...prev, habilitacoes: [] }))} />
              )}
              {active.experienciaMinima && (
                <Chip label={`${active.experienciaMinima}+ anos exp.`} onRemove={() => setActive(prev => ({ ...prev, experienciaMinima: '' }))} />
              )}
              {active.comAvaliacoes && (
                <Chip label="Com avaliações" onRemove={() => setActive(prev => ({ ...prev, comAvaliacoes: false }))} />
              )}
              {active.verificado && (
                <Chip label="Verificado" onRemove={() => setActive(prev => ({ ...prev, verificado: false }))} />
              )}
              <button
                onClick={() => setActive(EMPTY)}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors ml-1"
              >
                Limpar tudo
              </button>
            </motion.div>
          )}

          {/* ── Results count ── */}
          {(activeCount > 0 || searchTerm) && (
            <p className="text-sm text-muted-foreground mb-4 max-w-4xl mx-auto">
              {filteredTutors.length} explicador{filteredTutors.length !== 1 ? 'es' : ''} encontrado{filteredTutors.length !== 1 ? 's' : ''}
            </p>
          )}

          {/* ── Tutor grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTutors.map((tutor, index) => {
              const raw              = tutor.raw_answers || {}
              const displaySubjects: string[] = raw.question_5_answer || tutor.subjects || []
              const district: string = raw.question_10_answer || ''
              const municipality: string = raw.question_11_answer || ''
              const displayLocation  = tutor.location || [municipality, district].filter(Boolean).join(', ') || ''
              const format: string   = raw.question_9_answer || ''
              const isOnline         = format === 'online'     || format === 'indiferente' || format === ''
              const isPresencial     = format === 'presencial' || format === 'centro-estudo' || format === 'indiferente' || format === ''
              const isFav            = favoriteIds.includes(tutor.id || '')

              return (
                <motion.div
                  key={tutor.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="group"
                >
                  <div
                    className="relative rounded-3xl overflow-hidden bg-white border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300"
                    style={{ height: 440 }}
                  >
                    {/* Green tent */}
                    <div
                      className="absolute bottom-0 left-0 right-0"
                      style={{
                        height: '48%',
                        background: 'hsl(82 30% 82%)',
                        clipPath: 'polygon(50% 0%, 100% 36%, 100% 100%, 0% 100%, 0% 36%)',
                      }}
                    />

                    {/* Photo */}
                    <img
                      src={tutor.profile_picture}
                      alt={tutor.name}
                      className="absolute z-10 w-auto pointer-events-none"
                      style={{
                        height: 180, bottom: 60,
                        left: '50%', transform: 'translateX(-50%)',
                        objectFit: 'contain', objectPosition: 'top',
                      }}
                    />

                    {/* Format icons */}
                    <div className="absolute z-10 flex flex-col gap-1.5" style={{ bottom: 68, right: 16 }}>
                      {isOnline && (
                        <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shadow-sm" title="Online">
                          <Wifi className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      {isPresencial && (
                        <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shadow-sm" title="Presencial">
                          <Home className="w-4 h-4 text-foreground/70" />
                        </div>
                      )}
                    </div>

                    {/* Top info */}
                    <div className="absolute top-0 left-0 right-0 p-4 z-10">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-foreground leading-tight truncate">{tutor.name}</h3>
                          {displayLocation && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{displayLocation}</span>
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 w-12 h-12 rounded-full bg-tutor-green-light flex flex-col items-center justify-center shadow-sm">
                          <span className="text-base font-black text-primary leading-none">{tutor.rating ?? '—'}</span>
                          <Star className="w-2.5 h-2.5 text-primary fill-primary mt-0.5" />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {displaySubjects.slice(0, 3).map(s => (
                          <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-tutor-green-light text-primary rounded-full text-xs font-semibold">
                            <BookOpen className="w-3 h-3 shrink-0" />{s}
                          </span>
                        ))}
                        {displaySubjects.length > 3 && (
                          <span className="px-2.5 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                            +{displaySubjects.length - 3}
                          </span>
                        )}
                      </div>

                      {user && (
                        <button
                          onClick={e => tutor.id && toggleFavorite(e, tutor.id)}
                          disabled={togglingId === tutor.id}
                          className={`absolute top-4 right-16 p-1.5 rounded-full transition-all
                            ${isFav ? 'text-accent' : 'text-muted-foreground/40 hover:text-accent'}`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-accent' : ''}`} />
                        </button>
                      )}
                    </div>

                    {/* Bottom buttons */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 flex gap-2 px-4 pb-4">
                      <Link to={`/profile/${tutor.id}`} className="flex-1">
                        <button className="w-full h-10 rounded-2xl bg-white border border-border text-foreground text-xs font-semibold hover:bg-muted/50 transition-colors">
                          Ver perfil
                        </button>
                      </Link>
                      <button
                        onClick={() => handleContactTutor(tutor.email, tutor.name)}
                        className="flex-1 h-10 rounded-2xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                      >
                        <Mail className="w-3 h-3" /> Contactar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* ── Empty state ── */}
          {filteredTutors.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-2">Nenhum explicador encontrado.</p>
              <p className="text-sm text-muted-foreground">Tenta ajustar os filtros ou a pesquisa.</p>
              {activeCount > 0 && (
                <button
                  onClick={() => setActive(EMPTY)}
                  className="mt-4 text-sm text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
                >
                  Limpar filtros
                </button>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </>
  )
}

// ─── Chip helper (active filter tag) ─────────────────────────────────────────

const Chip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
    {label}
    <button type="button" onClick={onRemove} className="hover:opacity-70 transition-opacity">
      <X className="w-3 h-3" />
    </button>
  </span>
)

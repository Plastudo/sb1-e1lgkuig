import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import {
  Search, ArrowRight, ArrowLeft, GraduationCap, BookOpen,
  Users, Star, Clock, MapPin, Shield, CheckCircle,
  MessageCircle, CreditCard, Calendar, FileText,
} from 'lucide-react'
import { Footer } from './Footer'
import heroIllustration from '../assets/hero-illustration.png'
import tutorTeaching from '../assets/tutor-teaching-nobg.png'
import criancaSentada from '../assets/crianca-sentada-nobg.png'

/* ── constants ─────────────────────────────────────────────── */
const NAVBAR_H = 64 // px — matches h-16

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1 },
  }),
}

const STEPS = [
  {
    icon: BookOpen,
    title: 'Responde ao questionário',
    desc: 'Responde ao questionário que demora 2 min. Perguntamos a disciplina, o teu nível de ensino, os objectivos e a disponibilidade — quanto mais detalhes deres, melhor o match.',
  },
  {
    icon: Search,
    title: 'Os 3 melhores matches',
    desc: 'Damos-te os 3 explicadores com maior compatibilidade com o que procuras. Cada perfil mostra experiência, avaliações, preços e disponibilidade real.',
  },
  {
    icon: Star,
    title: 'Começa a aprender',
    desc: 'Analisa a disponibilidade, entra em contacto e começa a aprender! Falas directamente com o explicador — sem intermediários, sem complicações.',
  },
]

const STUDENT_BENEFITS = [
  { icon: Search,  text: 'Acesso a explicadores verificados em Portugal' },
  { icon: MapPin,  text: 'Aulas presenciais ou online — escolhe o que funciona para ti' },
  { icon: Clock,   text: 'Horários flexíveis que se adaptam à tua agenda' },
  { icon: Shield,  text: 'Perfis detalhados com avaliações reais de outros alunos' },
]

const TUTOR_BENEFITS = [
  { icon: GraduationCap, text: 'Cria o teu perfil em 5 mins e começa a receber alunos' },
  { icon: Users,         text: 'Se é a tua primeira vez não te preocupes — ajudamos-te a montar as tuas explicações e damos apoio quer de conteúdo quer da estrutura, contacto e pagamentos' },
  { icon: Star,          text: 'Constrói a tua reputação com avaliações reais de alunos' },
  { icon: CheckCircle,   text: 'Define os teus próprios preços e horários, sem comissões escondidas' },
]

const ROADMAP = [
  { icon: MessageCircle, title: 'Chat integrado',         desc: 'Fala directamente com o teu explicador dentro da plataforma, sem sair da TuTmait.',                              status: 'Brevemente' },
  { icon: CreditCard,    title: 'Pagamentos no chat',     desc: 'Paga as tuas sessões de forma segura directamente no chat — sem transferências nem dinheiro.',                   status: 'A seguir' },
  { icon: Calendar,      title: 'Agendamento automático', desc: 'Marca sessões com um clique, com sincronização automática de disponibilidade em tempo real.',                    status: 'Em desenvolvimento' },
  { icon: FileText,      title: 'Conteúdo próprio',       desc: 'Fichas, resumos e exercícios criados pelos explicadores, disponíveis directamente na plataforma.',              status: 'No roadmap' },
]

/* ── component ─────────────────────────────────────────────── */
export const HomePage = () => {
  const navigate = useNavigate()
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const [activeSection, setActiveSection] = useState(0)
  /* Section dot tracker */
  useEffect(() => {
    const sections = document.querySelectorAll('section[data-s]')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) setActiveSection(Number((e.target as HTMLElement).dataset.s))
      }),
      { threshold: 0.4 },
    )
    sections.forEach(s => obs.observe(s))
    return () => obs.disconnect()
  }, [])

  const handleStudentCTA = () => {
    setSlideDir('left')
    setTimeout(() => navigate('/student-questionnaire'), 520)
  }
  const handleTutorCTA = () => {
    setSlideDir('right')
    setTimeout(() => navigate('/tutor-questionnaire'), 520)
  }

  const sectionStyle: React.CSSProperties = {
    minHeight: `calc(100vh - ${NAVBAR_H}px)`,
    display: 'flex',
    alignItems: 'center',
  }
  // Sections that should sit higher (content pulled toward top)
  const sectionStyleTop: React.CSSProperties = {
    minHeight: `calc(100vh - ${NAVBAR_H}px)`,
    display: 'flex',
    alignItems: 'flex-start',
    paddingTop: '6vh',
  }

  return (
    <>
      {/* Section dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex-col gap-3 z-50 hidden md:flex" style={{ position: 'fixed' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} className={`rounded-full transition-all duration-300 ${
            activeSection === i ? 'h-3 w-3 bg-primary' : 'h-2 w-2 bg-foreground/20'
          }`} />
        ))}
      </div>

      <motion.div
        animate={
          slideDir === 'right' ? { x: '100vw', opacity: 0 } :
          slideDir === 'left'  ? { x: '-100vw', opacity: 0 } :
          { x: 0, opacity: 1 }
        }
        transition={{ duration: 0.52 }}
      >
        <div>
          <div className="relative">

          {/* ── 1. HERO ─────────────────────────────────────── */}
          <section data-s="0" style={{ ...sectionStyleTop }}
            className="relative overflow-hidden z-10"
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full pb-10">
              {/* Reduced gap: gap-8 instead of gap-16 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-8 lg:pr-4">
                  <motion.h1
                    variants={fadeUp} initial="hidden" animate="visible" custom={0}
                    className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight text-foreground"
                  >
                    Encontra o teu{' '}
                    <span className="text-gradient">TuTmait</span>
                  </motion.h1>

                  <motion.p
                    variants={fadeUp} initial="hidden" animate="visible" custom={1}
                    className="text-xl text-muted-foreground leading-relaxed"
                  >
                    Aprenda ao seu ritmo, no seu tempo, com quem entende as suas necessidades.
                  </motion.p>

                  <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
                    <Button size="lg" variant="accent" onClick={handleStudentCTA}
                      className="text-base px-9 py-6 shadow-lg hover:shadow-xl transition-all duration-200 group"
                    >
                      <Search className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Encontre o explicador ideal
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.93 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="relative flex items-center justify-center"
                >
                  <div className="absolute w-72 h-72 rounded-full animate-pulse-soft"
                    style={{ background: 'radial-gradient(circle, hsl(82 25% 38% / 0.22), transparent 70%)', top: '8%', left: '4%', filter: 'blur(44px)' }} />
                  <div className="absolute w-56 h-56 rounded-full animate-pulse-soft"
                    style={{ background: 'radial-gradient(circle, hsl(45 70% 62% / 0.25), transparent 70%)', bottom: '5%', right: '4%', filter: 'blur(44px)', animationDelay: '1s' }} />
                  <img src={heroIllustration} alt="Estudante com explicador na TuTmait"
                    className="relative z-10 w-full max-w-lg"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── 2. COMO FUNCIONA ────────────────────────────── */}
          <section data-s="1" style={{ ...sectionStyle, scrollSnapAlign: undefined }}
            className="relative bg-muted/55 overflow-hidden z-10"
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full py-16">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="text-center mb-14"
              >
                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                  Como funciona?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Procura apoio escolar ou explicações? O processo é simples, rápido e focado em si. Em menos de 5 minutos encontra o explicador ideal.
                </p>
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {STEPS.map((step, i) => (
                  <motion.div key={step.title}
                    variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                    className="text-center group"
                  >
                    <div className="mx-auto mb-5 flex h-18 w-18 h-[72px] w-[72px] items-center justify-center rounded-2xl bg-white shadow-sm border border-border/50 group-hover:shadow-md transition-shadow">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block">Passo {i + 1}</span>
                    <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* Section 2 CTA button added */}
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-14 text-center">
                <Button size="lg" variant="accent" onClick={handleStudentCTA} className="text-base px-8 py-5 shadow-lg hover:shadow-xl transition-all duration-200 group">
                  Encontre o explicador ideal
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </div>
          </section>

          {/* ── 3. PARA ESTUDANTES ──────────────────────────── */}
          <section data-s="2" style={{ ...sectionStyleTop, scrollSnapAlign: undefined, paddingTop: '3vh', paddingBottom: '3vh' }}
            className="relative overflow-hidden z-10"
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="space-y-7"
                >
                  <div>
                    <span className="inline-block px-4 py-1.5 rounded-full bg-student-yellow-light text-accent-foreground text-sm font-semibold mb-4">
                      Para estudantes
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                      Apoio escolar e <span className="text-gradient">aulas particulares</span>
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Das explicações de Matemática ao apoio em Português ou Ciências — garanta o sucesso escolar estudando com o explicador ideal para as suas necessidades.
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {STUDENT_BENEFITS.map((b, i) => (
                      <motion.li key={i}
                        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.3}
                        className="flex items-center gap-3 text-foreground/80"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-tutor-green-light flex items-center justify-center">
                          <b.icon className="h-4 w-4 text-tutor-green" />
                        </div>
                        {b.text}
                      </motion.li>
                    ))}
                  </ul>
                  <Button size="lg" variant="accent" onClick={handleStudentCTA}
                    className="text-base px-8 py-5 group"
                  >
                    Encontrar o meu explicador
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ y: 24 }} whileInView={{ y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative flex items-center justify-center"
                >
                  <img src={criancaSentada} alt="Estudante a estudar com apoio escolar da TuTmait"
                    className="w-full max-w-md"
                  />
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── 4. PARA EXPLICADORES ────────────────────────── */}
          <section data-s="3" style={{ ...sectionStyle, scrollSnapAlign: undefined }}
            className="relative bg-muted/55 overflow-hidden z-10"
          >
            <div className="max-w-6xl mx-auto px-6 lg:px-8 w-full py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <motion.div
                  initial={{ y: 24 }} whileInView={{ y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative flex items-center justify-center order-2 lg:order-1"
                >
                  <img src={tutorTeaching} alt="Explicador a dar aulas particulares — TuTmait"
                    className="w-full max-w-sm"
                  />
                </motion.div>

                <div className="space-y-4 order-1 lg:order-2">
                  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <span className="inline-block px-3 py-1 rounded-full bg-tutor-green-light text-tutor-green text-xs font-semibold mb-3">
                      Para explicadores
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
                      Partilha o teu{' '}<span className="text-gradient">conhecimento</span>
                    </h2>
                  </motion.div>
                  <ul className="space-y-2.5">
                    {TUTOR_BENEFITS.map((b, i) => (
                      <motion.li key={i}
                        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.3}
                        className="flex items-start gap-3 text-foreground/80 text-sm"
                      >
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-tutor-green-light flex items-center justify-center mt-0.5">
                          <b.icon className="h-3.5 w-3.5 text-tutor-green" />
                        </div>
                        {b.text}
                      </motion.li>
                    ))}
                  </ul>
                  <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}>
                    <Button onClick={handleTutorCTA}
                      className="text-sm px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg group"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                      Quero ser explicador
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>

          {/* ── 5. ROADMAP ──────────────────────────────────── */}
          <section data-s="4" style={{ ...sectionStyle, scrollSnapAlign: undefined }}
            className="relative overflow-hidden z-10"
          >
            <div className="max-w-3xl mx-auto px-6 lg:px-8 w-full py-10">
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={activeSection === 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
                transition={{ duration: 0.65 }}
                className="text-center mb-10"
              >
                <span className="inline-block px-4 py-1.5 rounded-full bg-tutor-green-light text-tutor-green text-sm font-semibold mb-3">
                  O que vem a seguir
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
                  O futuro da <span className="text-gradient">TuTmait</span>
                </h2>
                <p className="text-base text-muted-foreground max-w-lg mx-auto">
                  Estamos a construir uma plataforma completa. Aqui está o que está a chegar.
                </p>
              </motion.div>

              <div className="relative">
                {/* Centre line — draws down when section is active */}
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-primary/30 to-transparent origin-top"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={activeSection === 4
                    ? { scaleY: 1, opacity: 1 }
                    : { scaleY: 0, opacity: 0 }
                  }
                  transition={{ duration: 1.1, delay: 0.15 }}
                />

                <div className="space-y-10">
                  {ROADMAP.map((item, i) => {
                    const isLeft = i % 2 === 0
                    return (
                      <React.Fragment key={item.title}>
                        <motion.div
                          className="relative grid grid-cols-2 gap-4 items-center"
                          initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                          animate={activeSection === 4
                            ? { opacity: 1, x: 0 }
                            : { opacity: 0, x: isLeft ? -40 : 40 }
                          }
                          transition={{ duration: 0.6, delay: 0.3 + i * 0.14, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                          {/* Left */}
                          <div className="pr-6">
                            {isLeft && (
                              <div className="space-y-1.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{item.status}</span>
                                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-tutor-green-light flex-shrink-0">
                                    <item.icon className="h-4 w-4 text-tutor-green" />
                                  </div>
                                </div>
                                <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                              </div>
                            )}
                          </div>

                          {/* Dot */}
                          <motion.div
                            className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary border-[3px] border-background ring-2 ring-primary/25 z-10"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={activeSection === 4
                              ? { scale: 1, opacity: 1 }
                              : { scale: 0, opacity: 0 }
                            }
                            transition={{ duration: 0.4, delay: 0.4 + i * 0.14, ease: [0.34, 1.56, 0.64, 1] }}
                          />

                          {/* Right */}
                          <div className="pl-6">
                            {!isLeft && (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-tutor-green-light flex-shrink-0">
                                    <item.icon className="h-4 w-4 text-tutor-green" />
                                  </div>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{item.status}</span>
                                </div>
                                <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ── FOOTER ──────────────────────────────────────── */}
          <div style={{ scrollSnapAlign: undefined }} className="relative z-10 bg-white">
            <Footer />
          </div>

          </div>{/* end inner relative wrapper */}
        </div>{/* end scroll container */}
      </motion.div>
    </>
  )
}

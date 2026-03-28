import React, { useEffect, useRef } from 'react'

const letters = [
  { ch: 'T', cls: 'olive' },
  { ch: 'u', cls: 'olive' },
  { ch: 'T', cls: 'olive' },
  { ch: 'm', cls: 'gold' },
  { ch: 'a', cls: 'gold' },
  { ch: 'i', cls: 'gold' },
  { ch: 'T', cls: 'gold' },
]

const animations = [
  (el: HTMLElement, _i: number, delay: number) => {
    el.style.opacity = '0'
    el.style.animation = `tutmait-slideUp 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards`
    const bar = el.querySelector('.tutmait-underline-bar') as HTMLElement | null
    if (bar) {
      setTimeout(() => {
        bar.style.transition = 'width 0.4s ease'
        bar.style.width = '100%'
      }, delay * 1000 + 500)
    }
  },
  (el: HTMLElement, _i: number, delay: number) => {
    el.style.opacity = '0'
    el.style.clipPath = 'inset(0 100% 0 0)'
    setTimeout(() => {
      el.style.transition = `clip-path 0.45s cubic-bezier(0.77,0,0.18,1) ${delay}s, opacity 0s ${delay}s`
      el.style.opacity = '1'
      el.style.clipPath = 'inset(0 0% 0 0)'
    }, 50)
  },
  (el: HTMLElement, _i: number, delay: number) => {
    el.style.opacity = '0'
    el.style.transform = 'scaleY(0)'
    el.style.transformOrigin = 'bottom'
    setTimeout(() => {
      el.style.transition = `transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${delay}s, opacity 0s ${delay}s`
      el.style.opacity = '1'
      el.style.transform = 'scaleY(1)'
    }, 50)
  },
]

export const TuTmaiTLoading: React.FC = () => {
  const wordRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<HTMLDivElement>(null)
  const modeRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const buildWord = () => {
    const word = wordRef.current
    const dots = dotsRef.current
    if (!word || !dots) return

    word.innerHTML = ''
    dots.classList.remove('tutmait-dots-show')
    dots.style.opacity = '0'

    const anim = animations[modeRef.current % animations.length]

    letters.forEach((lt, i) => {
      const span = document.createElement('span')
      span.className = `tutmait-l tutmait-${lt.cls}`
      span.innerHTML = `<span>${lt.ch}</span><span class="tutmait-underline-bar"></span>`
      span.style.opacity = '0'
      const delay = 0.08 + i * 0.10
      word.appendChild(span)
      requestAnimationFrame(() => anim(span, i, delay))
    })

    setTimeout(() => {
      if (dots) dots.classList.add('tutmait-dots-show')
    }, letters.length * 100 + 900)

    setTimeout(() => {
      letters.forEach((lt, i) => {
        const span = word.children[i] as HTMLElement
        if (!span) return
        if (modeRef.current % 3 === 0) {
          span.style.animation = `tutmait-breathe 2s ease-in-out ${i * 0.15}s infinite`
        } else if (modeRef.current % 3 === 1) {
          span.style.animation = `tutmait-shiftColor 2.5s ease-in-out ${i * 0.2}s infinite`
        }
      })
    }, letters.length * 100 + 1200)
  }

  useEffect(() => {
    buildWord()

    intervalRef.current = setInterval(() => {
      modeRef.current++
      const word = wordRef.current
      const dots = dotsRef.current
      if (!word || !dots) return

      dots.classList.remove('tutmait-dots-show')
      dots.style.opacity = '0'
      word.style.transition = 'opacity 0.3s'
      word.style.opacity = '0'

      setTimeout(() => {
        if (!word) return
        word.style.transition = ''
        word.style.opacity = '1'
        buildWord()
      }, 350)
    }, 4000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <>
      <style>{`
        @keyframes tutmait-slideUp {
          from { transform: translateY(28px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes tutmait-breathe {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes tutmait-shiftColor {
          0%, 100% { color: #6b7040; }
          50%       { color: #b5a040; }
        }
        @keyframes tutmait-dotsSlideUp {
          from { transform: translateY(28px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .tutmait-l {
          display: inline-block;
          position: relative;
          cursor: default;
          line-height: 1;
          font-family: 'Raleway', sans-serif;
          font-size: 5rem;
          letter-spacing: 0.04em;
        }
        .tutmait-olive { font-weight: 800; color: #6b7040; }
        .tutmait-gold  { font-weight: 600; color: #b5a040; }
        .tutmait-underline-bar {
          position: absolute;
          bottom: -6px;
          left: 0;
          width: 0%;
          height: 1.5px;
          background: #b5a040;
        }
        .tutmait-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #b5a040;
          animation: tutmait-breathe 1.4s ease-in-out infinite;
        }
        .tutmait-dot:nth-child(2) { animation-delay: 0.2s; }
        .tutmait-dot:nth-child(3) { animation-delay: 0.4s; }
        .tutmait-dots-show {
          animation: tutmait-dotsSlideUp 0.5s ease forwards;
        }
      `}</style>

      <div
        style={{
          background: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 1rem' }}>
          <div
            ref={wordRef}
            style={{ display: 'flex', alignItems: 'baseline', position: 'relative' }}
          />
          <div
            ref={dotsRef}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '2rem', opacity: 0 }}
          >
            <div className="tutmait-dot" />
            <div className="tutmait-dot" />
            <div className="tutmait-dot" />
          </div>
        </div>
      </div>
    </>
  )
}

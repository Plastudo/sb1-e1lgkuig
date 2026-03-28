import { useEffect, useRef, useState } from 'react'

// Organic wide path — spans near full width, randomised each mount
function buildPath(): string {
  // Each wave goes from one edge to the other with organic control points
  const r = (base: number, spread = 6) => +(base + (Math.random() - 0.5) * spread).toFixed(2)
  return [
    `M ${r(4, 8)} 0`,
    `C ${r(92, 8)} ${r(6, 4)},  ${r(8, 8)} ${r(14, 4)},  ${r(95, 6)} ${r(20, 4)}`,
    `C ${r(5, 8)}  ${r(26, 4)},  ${r(90, 8)} ${r(34, 4)},  ${r(6, 6)}  ${r(40, 4)}`,
    `C ${r(94, 8)} ${r(46, 4)},  ${r(10, 8)} ${r(54, 4)},  ${r(92, 6)} ${r(60, 4)}`,
    `C ${r(8, 8)}  ${r(66, 4)},  ${r(90, 8)} ${r(74, 4)},  ${r(5, 6)}  ${r(80, 4)}`,
    `C ${r(95, 8)} ${r(86, 4)},  ${r(12, 8)} ${r(92, 4)},  ${r(88, 6)} ${r(98, 4)}`,
    `C ${r(40, 10)} 100, ${r(60, 10)} 100, ${r(50, 8)} 100`,
  ].join(' ')
}

// Progress target per section (0–1): at end of section N the line should be at this %
const SECTION_TARGETS = [0.18, 0.38, 0.58, 0.78, 1.0]

interface Props {
  currentSection: number
}

export const ScrollLine = ({ currentSection }: Props) => {
  const pathRef = useRef<SVGPathElement>(null)
  const [d] = useState(buildPath)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    const pathLength = path.getTotalLength()
    path.style.strokeDasharray = `${pathLength}`

    // Start at the beginning of section 0 (small amount already drawn)
    let current = pathLength * (1 - 0.05)
    path.style.strokeDashoffset = `${current}`

    let rafId: number

    const tick = () => {
      // Section-based target: draw at least to end of current section
      const sectionTarget = SECTION_TARGETS[Math.min(currentSection, SECTION_TARGETS.length - 1)]

      // Also consider scroll progress for finer control within a section
      const scrollTop = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const scrollProgress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0

      // Use whichever is further: section target or scroll progress
      const progress = Math.max(sectionTarget, scrollProgress)
      const target = pathLength * (1 - progress)

      // Organic lerp — slower than before for a pencil-drawing feel
      current += (target - current) * 0.045
      path.style.strokeDashoffset = `${current}`
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [currentSection])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,   // behind all page content
        overflow: 'hidden',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        <path
          ref={pathRef}
          d={d}
          stroke="hsl(82 25% 38% / 0.13)"
          strokeWidth="0.28"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ willChange: 'stroke-dashoffset' }}
        />
      </svg>
    </div>
  )
}

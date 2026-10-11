import { useEffect, useRef, type ReactNode } from 'react'
import './SectionHeading.css'

/** Redraws the accent word with the brand's hand-drawn underline. */
export function Accent({ children }: { children: ReactNode }) {
  return (
    <span className="sec-ul">
      {children}
      <svg className="sec-ul__svg" viewBox="0 0 240 12" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 8C40 2 80 11 120 6S190 3 238 7" />
      </svg>
    </span>
  )
}

interface SectionHeadingProps {
  /** Small pill label above the title. */
  eyebrow?: string
  /** Material Symbols icon name shown inside the eyebrow pill. */
  icon?: string
  title: ReactNode
  subtitle?: ReactNode
  align?: 'left' | 'center'
  /** Use on dark/coloured backgrounds. */
  light?: boolean
  className?: string
  /** Optional right-aligned action (rendered in a row on wider screens). */
  children?: ReactNode
}

/**
 * Shared section heading: pill eyebrow + display title (with an optionally
 * underlined `Accent` word) + subtitle. The underline draws in on scroll.
 */
export default function SectionHeading({
  eyebrow,
  icon,
  title,
  subtitle,
  align = 'left',
  light = false,
  className = '',
  children,
}: SectionHeadingProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      el.classList.add('is-in')
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('is-in')
            io.disconnect()
          }
        }),
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const cls = [
    'sec-head',
    align === 'center' && 'sec-head--center',
    light && 'sec-head--light',
    children && 'sec-head--side',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls} ref={ref}>
      <div className="sec-head__inner">
        <div className="sec-head__main">
          {eyebrow && (
            <span className="sec-eyebrow">
              {icon && (
                <span className="material-symbols-outlined sec-eyebrow__ic" aria-hidden="true">
                  {icon}
                </span>
              )}
              {eyebrow}
            </span>
          )}
          <h2 className="sec-title">{title}</h2>
          {subtitle && <p className="sec-sub">{subtitle}</p>}
        </div>
        {children && <div className="sec-head__side">{children}</div>}
      </div>
    </div>
  )
}

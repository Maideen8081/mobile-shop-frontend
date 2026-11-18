import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import './CategoryRail.css'

export default function CategoryRail({ children, className, headingClassName = '', trackClassName }: {
  children: ReactNode
  className: string
  headingClassName?: string
  trackClassName: string
}) {
  const id = useId()
  const track = useRef<HTMLDivElement>(null)
  const lastInteraction = useRef(0)
  const [overflow, setOverflow] = useState(false)
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const row = track.current
    if (!row) return
    const measure = () => setOverflow(row.scrollWidth - row.clientWidth > 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    return () => observer.disconnect()
  }, [children])

  const step = (direction: number) => {
    const row = track.current
    if (!row || row.children.length < 2) return
    const max = row.scrollWidth - row.clientWidth
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    if (direction > 0 && row.scrollLeft >= max - 2) {
      row.scrollTo({ left: 0, behavior: 'instant' })
    } else if (direction < 0 && row.scrollLeft <= 2) {
      row.scrollTo({ left: max, behavior: 'instant' })
    } else {
      const distance = row.children[1].getBoundingClientRect().left - row.children[0].getBoundingClientRect().left
      row.scrollBy({ left: distance * direction, behavior })
    }
  }

  useEffect(() => {
    if (!overflow || paused) return
    const timer = window.setInterval(() => {
      const row = track.current
      if (!row || document.hidden || row.matches(':focus-within')) return
      if (window.matchMedia('(hover: hover)').matches && row.matches(':hover')) return
      if (Date.now() - lastInteraction.current < 2800) return
      const { top, bottom } = row.getBoundingClientRect()
      if (bottom > 0 && top < window.innerHeight) step(1)
    }, 2800)
    return () => window.clearInterval(timer)
  }, [overflow, paused])

  const recordInteraction = () => { lastInteraction.current = Date.now() }
  const manualStep = (direction: number) => {
    recordInteraction()
    step(direction)
  }

  return (
    <section className={className} aria-labelledby={`${id}-heading`}>
      <div className={`category-rail-heading ${headingClassName}`}>
        <h2 id={`${id}-heading`}>Shop by Category</h2>
        {overflow && (
          <div className="category-rail-controls" role="group" aria-label="Category scrolling">
            <button type="button" onClick={() => manualStep(-1)} aria-label="Previous categories" aria-controls={id}><ChevronLeft size={17} /></button>
            <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Play category scrolling' : 'Pause category scrolling'} aria-controls={id}>
              {paused ? <Play size={15} /> : <Pause size={15} />}
            </button>
            <button type="button" onClick={() => manualStep(1)} aria-label="Next categories" aria-controls={id}><ChevronRight size={17} /></button>
          </div>
        )}
      </div>
      <div
        id={id}
        ref={track}
        className={`category-rail-track ${trackClassName}`}
        onPointerDown={recordInteraction}
        onTouchMove={recordInteraction}
        onWheel={recordInteraction}
      >
        {children}
      </div>
    </section>
  )
}

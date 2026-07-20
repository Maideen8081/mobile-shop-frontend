import { useEffect, useState, useRef } from 'react'

interface StatCounterProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
}

function useInView(ref: React.RefObject<Element | null>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref])
  return inView
}

export default function StatCounter({ value, prefix = '', suffix = '', decimals = 0 }: StatCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1500
    const start = performance.now()
    let frame: number
    function animate(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.max(0, eased * value))
      if (progress < 1) frame = requestAnimationFrame(animate)
      else setDisplay(Math.max(0, value))
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [inView, value])

  const formatted = (prefix ?? '') + display.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + (suffix ?? '')

  return <span ref={ref}>{inView ? formatted : `${prefix ?? ''}0${suffix ?? ''}`}</span>
}

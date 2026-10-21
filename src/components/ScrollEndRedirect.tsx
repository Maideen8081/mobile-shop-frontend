import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const END_TOLERANCE_PX = 4
const DELAY_MS = 1000

/**
 * Sends the visitor on to `to` once they scroll to the very bottom of the page.
 * A short countdown is shown first; scrolling back up cancels it.
 */
export default function ScrollEndRedirect({
  to,
  label = 'Opening the store…',
  bottomOffset = 28,
}: { to: string; label?: string; bottomOffset?: number }) {
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const atEnd = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      return max > 0 && window.scrollY > 0 && window.scrollY >= max - END_TOLERANCE_PX
    }
    const cancel = () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current)
        timer.current = null
        setLeaving(false)
      }
    }
    const onScroll = () => {
      if (atEnd()) {
        if (timer.current === null) {
          setLeaving(true)
          timer.current = window.setTimeout(() => navigate(to), DELAY_MS)
        }
      } else {
        cancel()
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [navigate, to])

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom))`,
        zIndex: 120,
        transform: `translate(-50%, ${leaving ? '0' : '24px'})`,
        opacity: leaving ? 1 : 0,
        pointerEvents: 'none',
        transition: 'opacity .25s ease, transform .25s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 20px',
        borderRadius: 999,
        background: 'rgba(7,4,10,0.85)',
        border: '1px solid rgba(246,239,233,0.15)',
        backdropFilter: 'blur(12px)',
        color: '#f6efe9',
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 16, height: 16, borderRadius: '50%',
          border: '2px solid rgba(255,59,78,0.3)', borderTopColor: '#ff3b4e',
        }}
        className="animate-spin"
      />
      {leaving ? label : ''}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', left: 0, bottom: 0, height: 2,
          width: leaving ? '100%' : '0%',
          background: '#ff3b4e',
          transition: leaving ? `width ${DELAY_MS}ms linear` : 'none',
        }}
      />
    </div>
  )
}

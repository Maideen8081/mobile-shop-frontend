import { useEffect, useRef, useState } from 'react'
import './LoadingScreen.css'

interface LoadingScreenProps {
  /** True once the app's data is ready; the bag then fills to 100% and the loader exits. */
  isLoaded: boolean
  /** Called after the exit animation, so the parent can unmount the loader. */
  onExitComplete?: () => void
  /** Shortest time the loader stays up, so it doesn't flash on fast networks. */
  minDuration?: number
}

const TICK_MS = 90
const EXIT_MS = 920
const EXIT_MS_REDUCED = 420

function statusFor(pct: number) {
  if (pct < 25) return 'Warming up the store'
  if (pct < 55) return 'Checking accessories…'
  if (pct < 85) return 'Syncing today’s deals'
  return 'Securing checkout'
}

const WAVE = 'M0 8 Q25 16 50 8 T100 8 T150 8 T200 8 T250 8 T300 8 T350 8 T400 8 V16 H0Z'

export default function LoadingScreen({ isLoaded, onExitComplete, minDuration = 1400 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)
  const startedAt = useRef(0)
  const loadedRef = useRef(isLoaded)
  const onExitRef = useRef(onExitComplete)

  useEffect(() => { loadedRef.current = isLoaded }, [isLoaded])
  useEffect(() => { onExitRef.current = onExitComplete }, [onExitComplete])

  // Ease toward 92% while loading; rush to 100% once the app is ready.
  useEffect(() => {
    startedAt.current = performance.now()
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100
        if (loadedRef.current) return Math.min(100, p + Math.max(3, (100 - p) * 0.22))
        return Math.min(92, p + (92 - p) * 0.045 + Math.random() * 0.4)
      })
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  const done = progress >= 100
  useEffect(() => {
    if (!done) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const wait = Math.max(300, minDuration - (performance.now() - startedAt.current))
    let exitTimer = 0
    const holdTimer = window.setTimeout(() => {
      setExiting(true)
      exitTimer = window.setTimeout(() => onExitRef.current?.(), reduced ? EXIT_MS_REDUCED : EXIT_MS)
    }, wait)
    return () => {
      window.clearTimeout(holdTimer)
      window.clearTimeout(exitTimer)
    }
  }, [done, minDuration])

  // No page scrolling behind the loader.
  useEffect(() => {
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    return () => { html.style.overflow = prev }
  }, [])

  const pct = Math.round(progress)
  const status = statusFor(pct)

  return (
    <div className={`pf-loader${exiting ? ' is-exiting' : ''}`}>
      <div className="pf-blob pf-blob--a" aria-hidden="true" />
      <div className="pf-blob pf-blob--b" aria-hidden="true" />

      <div className="pf-inner">
        <header className="pf-header">
          <div className="pf-brand">
            <span className="pf-logo">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </span>
            <span>
              <span className="pf-name">PhoneFix Pro</span>
              <span className="pf-tag">Your tech store</span>
            </span>
          </div>
          <span className="pf-live"><i aria-hidden="true" />Live</span>
        </header>

        <main className="pf-stage">
          <div className="pf-bag-wrap">
            <div className="pf-bag-in">
              <div
                className="pf-bag"
                role="progressbar"
                aria-label="Loading PhoneFix Pro"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
              >
                <div className="pf-handle" aria-hidden="true" />
                <div className="pf-body" aria-hidden="true">
                  <div className="pf-liquid" style={{ height: `${progress * 0.92}%` }}>
                    <svg className="pf-wave pf-wave--back" viewBox="0 0 400 16" preserveAspectRatio="none" aria-hidden="true">
                      <path d={WAVE} fill="#FF8A95" />
                    </svg>
                    <svg className="pf-wave pf-wave--front" viewBox="0 0 400 16" preserveAspectRatio="none" aria-hidden="true">
                      <path d={WAVE} fill="#E5243B" />
                    </svg>
                  </div>
                  <div className="pf-smile" />
                </div>
              </div>
            </div>
          </div>

          <div className="pf-text" aria-live="polite">
            <div className="pf-pct">{pct}<span>%</span></div>
            <div className="pf-status-row">
              <p key={status} className="pf-status">{status}</p>
            </div>
            <p className="pf-sub">Filling your bag with the best deals</p>
          </div>
        </main>

        <footer className="pf-dots" aria-hidden="true">
          <i /><i /><i />
        </footer>
      </div>
    </div>
  )
}

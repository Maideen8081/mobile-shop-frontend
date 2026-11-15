import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useBootHold } from './bootLoader'
import './RouteLoader.css'

/**
 * Suspense fallback while a page's code downloads. During the very first load
 * it also holds the boot splash so the splash doesn't vanish onto a blank page.
 */
export function RouteLoader() {
  useBootHold(true)
  return (
    <div className="rl-page" role="status" aria-live="polite">
      <div className="rl-bar is-running" aria-hidden="true" />
      <div className="rl-card">
        <span className="rl-mark" aria-hidden="true">
          <span className="rl-orbit" />
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="2.5" width="12" height="19" rx="2.6" />
            <path d="M10.5 18.5h3" />
          </svg>
        </span>
        <span className="rl-text">Loading<span className="rl-dots"><i>.</i><i>.</i><i>.</i></span></span>
      </div>
    </div>
  )
}

/** Thin top progress bar that runs on every page change. */
export function RouteProgressBar() {
  const { pathname } = useLocation()
  const [phase, setPhase] = useState<'idle' | 'run' | 'done'>('idle')
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setPhase('run')
    const done = window.setTimeout(() => setPhase('done'), 420)
    const idle = window.setTimeout(() => setPhase('idle'), 900)
    return () => {
      window.clearTimeout(done)
      window.clearTimeout(idle)
    }
  }, [pathname])

  if (phase === 'idle') return null
  return <div className={`rl-bar rl-bar--global ${phase === 'run' ? 'is-running' : 'is-done'}`} aria-hidden="true" />
}

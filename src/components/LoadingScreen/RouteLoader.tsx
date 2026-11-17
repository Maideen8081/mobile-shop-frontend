import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useBootHold } from './bootLoader'
import './RouteLoader.css'

/**
 * Suspense fallback while a page's code downloads. No full-page UI: during the
 * very first load the app-wide boot loader stays up, and later navigations are
 * covered by the thin top progress bar.
 */
export function RouteLoader() {
  useBootHold(true)
  return null
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

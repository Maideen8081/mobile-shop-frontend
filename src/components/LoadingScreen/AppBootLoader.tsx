import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { markBooted, useBootHolds } from './bootLoader'
import { isAdminPath } from '../../route/adminPaths'

/** Holds must stay released this long before the app counts as ready (lets pages mount). */
const SETTLE_MS = 350
/** Never keep shoppers waiting longer than this, even if an API hangs. */
const MAX_WAIT_MS = 9000
/** Fade-out length, kept in sync with the CSS transition below. */
const FADE_MS = 300

/** Single, minimal app-wide loader shown once while the storefront first loads. */
export default function AppBootLoader() {
  const { pathname } = useLocation()
  // Admin console has its own loading states; skip the shopper splash there.
  const [visible, setVisible] = useState(() => !isAdminPath(pathname))
  const holds = useBootHolds()
  const [docReady, setDocReady] = useState(() => document.readyState === 'complete')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (docReady) return
    const onLoad = () => setDocReady(true)
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [docReady])

  useEffect(() => {
    if (!visible) {
      markBooted()
      return
    }
    const cap = window.setTimeout(() => setReady(true), MAX_WAIT_MS)
    return () => window.clearTimeout(cap)
  }, [visible])

  useEffect(() => {
    if (!visible || ready || !docReady || holds > 0) return
    const t = window.setTimeout(() => setReady(true), SETTLE_MS)
    return () => window.clearTimeout(t)
  }, [visible, ready, docReady, holds])

  useEffect(() => {
    if (!ready || !visible) return
    const t = window.setTimeout(() => {
      markBooted()
      setVisible(false)
    }, FADE_MS)
    return () => window.clearTimeout(t)
  }, [ready, visible])

  if (!visible) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[100001] grid place-items-center bg-[#140720] transition-opacity duration-300 ${
        ready ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4 text-white">
        <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/20 border-t-[#ffd014]" />
        <span className="text-sm font-semibold tracking-wide text-white/70">Loading…</span>
      </div>
    </div>
  )
}

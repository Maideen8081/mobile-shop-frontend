import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { markBooted, useBootHolds } from './bootLoader'
import { isAdminPath } from '../../route/adminPaths'
import PageLoading from '../ui/PageLoading'

/** Let redirects and Suspense fallbacks register a hold before revealing the page. */
const SETTLE_MS = 120
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
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!visible) {
      markBooted()
      return
    }
    const cap = window.setTimeout(() => setReady(true), MAX_WAIT_MS)
    return () => window.clearTimeout(cap)
  }, [visible])

  useEffect(() => {
    if (!visible || ready || holds > 0) return
    const t = window.setTimeout(() => setReady(true), SETTLE_MS)
    return () => window.clearTimeout(t)
  }, [visible, ready, holds])

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
    <PageLoading label="Loading the store…" className={`fixed inset-0 z-[100001] bg-[#f7f6f2] transition-opacity duration-300 motion-reduce:transition-none ${
      ready ? 'pointer-events-none opacity-0' : 'opacity-100'
    }`} />
  )
}

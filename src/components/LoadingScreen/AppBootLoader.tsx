import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import LoadingScreen from './LoadingScreen'
import { markBooted, useBootHolds } from './bootLoader'
import { isAdminPath } from '../../route/adminPaths'

/** Holds must stay released this long before the app counts as ready (lets pages mount). */
const SETTLE_MS = 350
/** Never keep shoppers waiting longer than this, even if an API hangs. */
const MAX_WAIT_MS = 9000

/** Full-screen branded loader shown once, when the storefront first opens. */
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

  if (!visible) return null
  return (
    <LoadingScreen
      isLoaded={ready}
      onExitComplete={() => {
        markBooted()
        setVisible(false)
      }}
    />
  )
}

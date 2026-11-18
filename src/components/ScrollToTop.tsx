import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollToTopNow, startSmoothScroll, stopSmoothScroll } from '../utils/smoothScroll'
import { isAdminPath } from '../route/adminPaths'

/**
 * Starts every route at the top of the page. Runs before paint, and dispatches
 * a scroll event so SiteTopNav re-reads the position. Without this the browser
 * keeps the old offset (clamped to the new page), and the nav collapses after
 * the new page is already visible.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  const isAdmin = isAdminPath(pathname)
  useLayoutEffect(() => {
    const nativeScroll = window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)')
    const sync = () => {
      if (isAdmin || nativeScroll.matches) stopSmoothScroll()
      else startSmoothScroll()
    }
    sync()
    nativeScroll.addEventListener('change', sync)
    return () => {
      nativeScroll.removeEventListener('change', sync)
      stopSmoothScroll()
    }
  }, [isAdmin])

  useLayoutEffect(() => {
    scrollToTopNow()
    window.dispatchEvent(new Event('scroll'))
  }, [pathname])

  return null
}

import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollToTopNow, startSmoothScroll, stopSmoothScroll } from '../utils/smoothScroll'

/**
 * Starts every route at the top of the page. Runs before paint, and dispatches
 * a scroll event so SiteTopNav re-reads the position. Without this the browser
 * keeps the old offset (clamped to the new page), and the nav collapses after
 * the new page is already visible.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  /* Smooth scrolling everywhere except the admin panel. */
  const isAdmin = pathname.startsWith('/admin')
  useLayoutEffect(() => {
    if (isAdmin) stopSmoothScroll()
    else startSmoothScroll()
  }, [isAdmin])

  useLayoutEffect(() => {
    scrollToTopNow()
    window.dispatchEvent(new Event('scroll'))
  }, [pathname])

  return null
}

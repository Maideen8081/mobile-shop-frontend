import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Starts every route at the top of the page. Runs before paint, and dispatches
 * a scroll event so SiteTopNav re-reads the position. Without this the browser
 * keeps the old offset (clamped to the new page), and the nav collapses after
 * the new page is already visible.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    window.dispatchEvent(new Event('scroll'))
  }, [pathname])

  return null
}

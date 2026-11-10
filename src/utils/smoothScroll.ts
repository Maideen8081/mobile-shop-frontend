import Lenis from 'lenis'

/**
 * Site-wide smooth scrolling (Lenis), tuned like the reference site:
 * a short eased glide on mouse wheels, native scrolling on touch screens.
 *
 * One shared instance. Pages that run their own Lenis (the 3D experience)
 * call `suspendSmoothScroll()` and get a function that restores it.
 */

let lenis: Lenis | null = null
let suspended = 0

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Gentle exponential ease-out: quick to respond, soft to settle. */
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

export function startSmoothScroll() {
  if (lenis || suspended > 0 || typeof window === 'undefined' || reducedMotion()) return
  lenis = new Lenis({
    duration: 0.9,
    easing: easeOutExpo,
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.85,
    autoRaf: true,
    anchors: true,
    /* Let inner scroll areas (menus, drawers, chat, tables) scroll themselves. */
    allowNestedScroll: true,
    /* Pause while a modal locks the page with overflow: hidden. */
    autoToggle: true,
    prevent: (node) =>
      !!node.closest('[data-lenis-prevent], dialog, [role="dialog"], [aria-modal="true"], .pfn-drop'),
  })
  document.documentElement.classList.add('has-smooth-scroll')
}

export function stopSmoothScroll() {
  lenis?.destroy()
  lenis = null
  document.documentElement.classList.remove('has-smooth-scroll')
}

export function getSmoothScroll(): Lenis | null {
  return lenis
}

/** Jump instantly (route changes). Falls back to native scrolling. */
export function scrollToTopNow() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  else window.scrollTo(0, 0)
}

/** Hand scrolling over to a page with its own Lenis. Returns a restore function. */
export function suspendSmoothScroll(): () => void {
  suspended++
  stopSmoothScroll()
  return () => {
    suspended = Math.max(0, suspended - 1)
    if (suspended === 0) startSmoothScroll()
  }
}

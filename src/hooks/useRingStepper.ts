import { useCallback, useEffect, useRef, type RefObject } from 'react'
import gsap from 'gsap'
import type { ScrollTrigger } from 'gsap/ScrollTrigger'

const SWIPE_PX = 40
const WHEEL_PX = 50
const WHEEL_GESTURE_END_MS = 180
// How long a stepped-to product stays locked after its scroll finishes, so
// ScrollTrigger's end-of-scroll snap can't carry on to the next one.
const SETTLE_MS = 400
// Safety release if the scroll is interrupted and never reports completion.
const MAX_LOCK_MS = 3000

type Scroller = (y: number, done: () => void) => void

const tweenScroll: Scroller = (y, done) => {
  const pos = { y: window.scrollY }
  gsap.to(pos, {
    y,
    duration: Math.min(1.4, 0.6 + Math.abs(y - pos.y) / 4000),
    ease: 'power2.inOut',
    overwrite: true,
    onUpdate: () => window.scrollTo(0, pos.y),
    onComplete: done,
  })
}

/**
 * Left/right navigation for a scroll-scrubbed product ring.
 *
 * The ring's rotation is owned by a pinned ScrollTrigger, so stepping scrolls
 * the page to the matching snap point instead of rotating the ring directly —
 * pinning, snapping, progress bars and the active-product state stay in sync.
 *
 * Wires up on `stageRef`: horizontal swipe / mouse drag and horizontal
 * trackpad wheel. Arrow keys work while the ring is pinned. Steps wrap around.
 * Pass `snap` as the ring ScrollTrigger's `snap.snapTo`.
 */
export function useRingStepper(count: number, stageRef: RefObject<HTMLElement | null>) {
  const trigger = useRef<ScrollTrigger | null>(null)
  const scrollTo = useRef<Scroller>(tweenScroll)
  const current = useRef(0)
  const target = useRef<number | null>(null)
  const releaseTimer = useRef(0)

  /** Call once the ring's ScrollTrigger exists; `scroller` replaces the default GSAP scroll (e.g. Lenis). */
  const attach = useCallback((st: ScrollTrigger | undefined, scroller?: Scroller) => {
    trigger.current = st ?? null
    if (scroller) scrollTo.current = scroller
  }, [])

  /** Call from the ring's update handler with the product now in front. */
  const sync = useCallback((idx: number) => {
    current.current = idx
  }, [])

  /** Snap function for the ring's ScrollTrigger: nearest product, or the stepped-to one while it settles. */
  const snap = useCallback(
    (progress: number) => {
      const steps = Math.max(1, count - 1)
      return (target.current ?? Math.round(progress * steps)) / steps
    },
    [count],
  )

  const goTo = useCallback(
    (i: number) => {
      const st = trigger.current
      if (!st || count < 2) return
      const next = ((i % count) + count) % count
      // Remember where we're heading so rapid clicks queue up instead of
      // stepping from a position the ring hasn't reached yet.
      target.current = next
      const release = (ms: number) => {
        window.clearTimeout(releaseTimer.current)
        releaseTimer.current = window.setTimeout(() => (target.current = null), ms)
      }
      release(MAX_LOCK_MS)
      scrollTo.current(st.start + ((st.end - st.start) * next) / (count - 1), () => release(SETTLE_MS))
    },
    [count],
  )

  const step = useCallback((dir: 1 | -1) => goTo((target.current ?? current.current) + dir), [goTo])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    /* Swipe (touch) and drag (mouse). `touch-action: pan-y` on the stage keeps
       vertical page scroll native while horizontal moves reach us. */
    let startX = 0
    let startY = 0
    let tracking = false
    let swiped = false
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return
      tracking = true
      swiped = false
      startX = e.clientX
      startY = e.clientY
    }
    const up = (e: PointerEvent) => {
      if (!tracking) return
      tracking = false
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.2) {
        swiped = true
        step(dx < 0 ? 1 : -1)
      }
    }
    const cancel = () => (tracking = false)
    // A mouse drag that ends on a product link must not also open it.
    const click = (e: MouseEvent) => {
      if (!swiped) return
      swiped = false
      e.preventDefault()
      e.stopPropagation()
    }

    /* Horizontal trackpad swipe: one gesture (incl. momentum) = one step. */
    let acc = 0
    let locked = false
    let gestureEnd = 0
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault() // also blocks the browser's back/forward swipe here
      window.clearTimeout(gestureEnd)
      gestureEnd = window.setTimeout(() => {
        locked = false
        acc = 0
      }, WHEEL_GESTURE_END_MS)
      if (locked) return
      acc += e.deltaX
      if (Math.abs(acc) < WHEEL_PX) return
      step(acc > 0 ? 1 : -1)
      locked = true
    }

    const key = (e: KeyboardEvent) => {
      if (!trigger.current?.isActive || e.altKey || e.ctrlKey || e.metaKey) return
      if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"]')) return
      if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
      else return
      e.preventDefault()
    }

    stage.addEventListener('pointerdown', down)
    stage.addEventListener('pointerup', up)
    stage.addEventListener('pointercancel', cancel)
    stage.addEventListener('click', click, true)
    stage.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('keydown', key)
    return () => {
      stage.removeEventListener('pointerdown', down)
      stage.removeEventListener('pointerup', up)
      stage.removeEventListener('pointercancel', cancel)
      stage.removeEventListener('click', click, true)
      stage.removeEventListener('wheel', wheel)
      window.removeEventListener('keydown', key)
      window.clearTimeout(gestureEnd)
      window.clearTimeout(releaseTimer.current)
    }
  }, [stageRef, step])

  return { attach, sync, snap, goTo, step }
}

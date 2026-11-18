import { useEffect, type RefObject } from 'react'

/** Play decorative video only when it is in view and motion is allowed. */
export function useBackgroundVideo(ref: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = ref.current
    if (!video) return
    let inView = false
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      if (inView && !document.hidden && !reducedMotion.matches) {
        void video.play().catch(() => {})
      } else {
        video.pause()
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      sync()
    })
    observer.observe(video)
    document.addEventListener('visibilitychange', sync)
    reducedMotion.addEventListener('change', sync)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
      reducedMotion.removeEventListener('change', sync)
      video.pause()
    }
  }, [ref])
}

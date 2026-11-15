import { useEffect, useSyncExternalStore } from 'react'

/**
 * App-wide "first load" coordination.
 *
 * When the app opens, AppBootLoader shows the full-screen LoadingScreen.
 * Any page that is still fetching its first data calls `useBootHold(loading)`;
 * the loader stays up until every hold is released (or a safety timeout hits).
 * After the first load finishes, holds are ignored — later navigations use the
 * lighter route loader and each page's own skeletons.
 */

let holds = 0
let booted = false
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((fn) => fn())

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function useBootHolds(): number {
  return useSyncExternalStore(subscribe, () => holds, () => holds)
}

export function markBooted() {
  booted = true
  holds = 0
  emit()
}

export function isBooted() {
  return booted
}

/** Keep the first-load screen visible while `active` is true. */
export function useBootHold(active: boolean) {
  useEffect(() => {
    if (!active || booted) return
    holds++
    emit()
    return () => {
      if (booted) return
      holds = Math.max(0, holds - 1)
      emit()
    }
  }, [active])
}

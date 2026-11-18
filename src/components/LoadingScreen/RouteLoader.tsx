import { useBootHold } from './bootLoader'
import PageLoading from '../ui/PageLoading'

/** Suspense fallback while a page's code downloads. */
export function RouteLoader() {
  useBootHold(true)
  return <PageLoading label="Loading page…" className="min-h-[60vh]" />
}

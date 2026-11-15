/**
 * Short-lived cache for public GET requests.
 *
 * Several components on one page ask for the same list (header categories,
 * home sections, footer…). Identical requests made close together share one
 * network call instead of hitting the API again.
 */
const TTL_MS = 30_000

const entries = new Map<string, { at: number; promise: Promise<unknown> }>()

export function cachedRequest<T>(key: string, load: () => Promise<T>, ttl = TTL_MS): Promise<T> {
  const hit = entries.get(key)
  if (hit && Date.now() - hit.at < ttl) return hit.promise as Promise<T>
  const promise = load().catch((err) => {
    // Never cache failures: the next caller should retry.
    if (entries.get(key)?.promise === promise) entries.delete(key)
    throw err
  })
  entries.set(key, { at: Date.now(), promise })
  return promise
}

/** Drop cached entries whose key starts with `prefix` (call after a write). */
export function invalidateRequests(prefix: string) {
  for (const key of entries.keys()) if (key.startsWith(prefix)) entries.delete(key)
}

export function stableKey(params: unknown): string {
  if (!params || typeof params !== 'object') return ''
  const obj = params as Record<string, unknown>
  return JSON.stringify(
    Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort()
      .map((k) => [k, obj[k]]),
  )
}

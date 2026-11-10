import { useCallback, useMemo, useState } from 'react'

export type FieldRules<T> = { [K in keyof T]?: (value: T[K], all: T) => string }
type Errors<T> = Partial<Record<keyof T, string>>

/**
 * Form state with validation that stays quiet until a field is left once,
 * then re-checks it live on every keystroke. Server-side field errors can be
 * pushed in with setServerErrors and clear as soon as that field changes.
 */
export function useValidatedForm<T extends object>(initial: T, rules: FieldRules<T>) {
  const [values, setValues] = useState<T>(initial)
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [serverErrors, setServerErrorsState] = useState<Errors<T>>({})

  const check = useCallback(
    (data: T): Errors<T> => {
      const out: Errors<T> = {}
      for (const key in rules) {
        const msg = rules[key]?.(data[key], data)
        if (msg) out[key] = msg
      }
      return out
    },
    [rules],
  )

  const errors = useMemo(() => {
    const all = check(values)
    const shown: Errors<T> = {}
    for (const key in values) {
      const msg = (touched[key] && all[key]) || serverErrors[key]
      if (msg) shown[key] = msg
    }
    return shown
  }, [check, values, touched, serverErrors])

  const setValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    setServerErrorsState((prev) => (prev[name] ? { ...prev, [name]: '' } : prev))
  }, [])

  const touch = useCallback((name: keyof T) => {
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }))
  }, [])

  /** Marks every field touched; returns true when the form is valid. Focuses the first bad field. */
  const validateAll = useCallback((): boolean => {
    const all = check(values)
    const allTouched: Partial<Record<keyof T, boolean>> = {}
    for (const key in values) allTouched[key] = true
    setTouched(allTouched)
    const first = Object.keys(values).find((k) => all[k as keyof T])
    if (first) document.getElementById(`auth-${first}`)?.focus()
    return !first
  }, [check, values])

  const setServerErrors = useCallback((errs: Errors<T>) => setServerErrorsState(errs), [])

  return { values, errors, setValue, touch, validateAll, setServerErrors }
}

/** Pulls a readable message (and per-field messages) out of a DRF error response. */
export function parseApiError(err: unknown): { message: string; fields: Record<string, string> } {
  const raw = (err as { response?: { data?: unknown } })?.response?.data
  const fields: Record<string, string> = {}
  if (typeof raw === 'string') return { message: raw, fields }
  if (!raw || typeof raw !== 'object') return { message: '', fields }

  const data = raw as Record<string, unknown>
  for (const [key, val] of Object.entries(data)) {
    if (Array.isArray(val) && typeof val[0] === 'string') fields[key] = val[0]
    else if (typeof val === 'string' && key !== 'detail' && key !== 'message') fields[key] = val
  }
  const message =
    (typeof data.detail === 'string' && data.detail) ||
    (typeof data.message === 'string' && data.message) ||
    Object.values(fields)[0] ||
    ''
  return { message, fields }
}

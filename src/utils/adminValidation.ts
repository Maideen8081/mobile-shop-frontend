/* Client-side validation for admin forms. Each rule mirrors the matching
   server-side check (apps/common/validators.py and the serializers), so the
   admin sees the same message before submitting that the API would return. */

export type Rule = (value: string) => string

export const rules = {
  required: (label: string): Rule => (v) => (v.trim() ? '' : `${label} is required`),

  minLength: (label: string, min: number): Rule => (v) =>
    !v.trim() || v.trim().length >= min ? '' : `${label} must be at least ${min} characters`,

  maxLength: (label: string, max: number): Rule => (v) =>
    v.trim().length <= max ? '' : `${label} must be at most ${max} characters`,

  personName: (label = 'Name'): Rule => (v) => {
    const s = v.trim()
    if (!s) return ''
    if (s.length < 2) return `${label} must be at least 2 characters`
    return /^[A-Za-z][A-Za-z .'-]*$/.test(s) ? '' : `${label} can only contain letters, spaces, dots, apostrophes and hyphens`
  },

  email: (): Rule => (v) =>
    !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email address',

  /** 10-digit Indian mobile starting 6-9; tolerates spaces, dashes and +91. */
  indianMobile: (label = 'Mobile number'): Rule => (v) => {
    let d = v.replace(/\D/g, '')
    if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
    if (!d) return ''
    return /^[6-9]\d{9}$/.test(d) ? '' : `${label} must be a valid 10-digit number starting with 6-9`
  },

  /** Repair tickets accept 10-15 digits (international customers). */
  phone10to15: (label = 'Mobile number'): Rule => (v) => {
    const d = v.replace(/\D/g, '')
    if (!d) return ''
    return d.length >= 10 && d.length <= 15 ? '' : `${label} must be 10-15 digits`
  },

  imei: (): Rule => (v) => {
    const d = v.replace(/[\s-]/g, '')
    if (!d) return ''
    return /^\d{15}$/.test(d) ? '' : 'IMEI must be exactly 15 digits'
  },

  amount: (label: string, opts: { min?: number; max?: number; allowZero?: boolean } = {}): Rule => (v) => {
    if (!v.trim()) return ''
    const n = Number(v)
    if (!Number.isFinite(n)) return `${label} must be a number`
    if (n < 0) return `${label} cannot be negative`
    if (n === 0 && !opts.allowZero) return `${label} must be greater than zero`
    if (opts.min != null && n < opts.min) return `${label} must be at least ₹${opts.min.toLocaleString('en-IN')}`
    if (opts.max != null && n > opts.max) return `${label} must be at most ₹${opts.max.toLocaleString('en-IN')}`
    if (!/^\d+(\.\d{1,2})?$/.test(v.trim())) return `${label} can have at most 2 decimal places`
    return ''
  },

  intRange: (label: string, min: number, max: number): Rule => (v) => {
    if (!v.trim()) return ''
    if (!/^\d+$/.test(v.trim())) return `${label} must be a whole number`
    const n = Number(v)
    return n >= min && n <= max ? '' : `${label} must be between ${min} and ${max}`
  },

  differentFrom: (otherValue: () => string, message: string): Rule => (v) => {
    const a = v.replace(/\D/g, '')
    return a && a === otherValue().replace(/\D/g, '') ? message : ''
  },
}

export type Schema<T extends string> = Partial<Record<T, Rule[]>>

/** Runs every rule for every field and returns the first message per field. */
export function validate<T extends string>(schema: Schema<T>, values: Record<T, string>): Partial<Record<T, string>> {
  const errors: Partial<Record<T, string>> = {}
  for (const field of Object.keys(schema) as T[]) {
    for (const rule of schema[field] ?? []) {
      const msg = rule(values[field] ?? '')
      if (msg) {
        errors[field] = msg
        break
      }
    }
  }
  return errors
}

export function validateField<T extends string>(schema: Schema<T>, field: T, value: string): string {
  for (const rule of schema[field] ?? []) {
    const msg = rule(value)
    if (msg) return msg
  }
  return ''
}

/** Scrolls to and focuses the first invalid control so the admin sees why the save failed. */
export function focusFirstError(container: HTMLElement | null) {
  const el = container?.querySelector<HTMLElement>('[aria-invalid="true"]')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => el.focus({ preventScroll: true }), 250)
  }
}

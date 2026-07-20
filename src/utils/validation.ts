interface ValidationRule<T> {
  validate: (data: T) => string
}

export function createValidator<T>(rules: Record<keyof T, ValidationRule<T>[]>) {
  return (data: T): Partial<Record<keyof T, string>> => {
    const errors: Partial<Record<keyof T, string>> = {}
    for (const field in rules) {
      for (const rule of rules[field]) {
        const error = rule.validate(data)
        if (error) {
          errors[field] = error
          break
        }
      }
    }
    return errors
  }
}

export const required = <T>(field: string, getValue: (d: T) => string): ValidationRule<T> => ({
  validate: (d) => (getValue(d).trim() ? '' : `${field} is required`),
})

export const email = <T>(getValue: (d: T) => string): ValidationRule<T> => ({
  validate: (d) => {
    const v = getValue(d)
    return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Invalid email address'
  },
})

export const minLength = <T>(min: number, getValue: (d: T) => string): ValidationRule<T> => ({
  validate: (d) => (getValue(d).length >= min ? '' : `At least ${min} characters required`),
})

export const passwordStrength = <T>(getValue: (d: T) => string): ValidationRule<T> => ({
  validate: (d) =>
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(getValue(d))
      ? ''
      : 'Must include uppercase, lowercase & number',
})

export const match = <T>(getA: (d: T) => string, getB: (d: T) => string): ValidationRule<T> => ({
  validate: (d) => (getA(d) === getB(d) ? '' : 'Passwords do not match'),
})

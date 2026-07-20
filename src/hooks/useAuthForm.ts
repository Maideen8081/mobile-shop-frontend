import { useState, useCallback, type FormEvent, type ChangeEvent } from 'react'

interface UseAuthFormOptions<T> {
  initial: T
  validate: (data: T) => Partial<Record<keyof T, string>>
  onSubmit: (data: T) => void | Promise<void>
}

export function useAuthForm<T extends Record<string, any>>({
  initial,
  validate,
  onSubmit,
}: UseAuthFormOptions<T>) {
  const [formData, setFormData] = useState<T>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [loading, setLoading] = useState(false)

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, type, checked, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
      setErrors((prev) => ({ ...prev, [name]: '' }))
    },
    [],
  )

  const setField = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }, [])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const newErrors = validate(formData)
      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return
      setLoading(true)
      try {
        await onSubmit(formData)
      } finally {
        setLoading(false)
      }
    },
    [formData, validate, onSubmit],
  )

  return { formData, errors, loading, handleChange, setField, handleSubmit }
}

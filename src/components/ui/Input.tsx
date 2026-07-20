import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export default function Input({
  label,
  error,
  icon,
  className = '',
  id,
  ...props
}: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-label mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          className={`rounded-lg border bg-surface-lighter px-3 py-2.5 text-sm text-text-primary placeholder-text-label outline-none transition-all duration-150
            ${error ? 'border-danger ring-2 ring-danger/10' : 'border-border focus:border-primary/40 focus:ring-1 focus:ring-primary/20'}
            ${icon ? 'pl-10' : ''}
            ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      )}
    </div>
  )
}

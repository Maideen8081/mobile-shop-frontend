import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  loadingText?: string
}

const variantClasses = {
  primary: 'bg-primary hover:bg-primary-hover text-white shadow-sm',
  secondary: 'bg-white border border-primary/40 hover:bg-primary/5 text-primary',
  danger: 'bg-danger hover:bg-danger-hover text-white shadow-sm',
  warning: 'bg-warning hover:brightness-95 text-white shadow-sm',
  success: 'bg-success hover:bg-primary-hover text-white shadow-sm',
  ghost: 'hover:bg-surface-hover text-text-muted',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  loadingText = 'Processing...',
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`rounded-lg font-medium transition-all duration-150 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}

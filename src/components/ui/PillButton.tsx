import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface PillButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  icon?: ReactNode
  type?: 'button' | 'submit' | 'reset'
}

const variantClasses = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-surface-lighter border border-border text-text-secondary hover:bg-surface-hover',
  ghost: 'hover:bg-white/[0.04] text-text-muted',
  danger: 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20',
}

const sizeClasses = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-5 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
}

export default function PillButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  icon,
  type = 'button',
}: PillButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={!disabled && !loading ? { scale: 1.01 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={`rounded-lg font-medium inline-flex items-center justify-center gap-2
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        icon
      ) : null}
      {children}
    </motion.button>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
}

const variantClasses = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-info/10 text-info border-info/20',
  neutral: 'bg-white/[0.04] text-text-muted border-border',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`rounded-md border font-medium inline-flex items-center gap-1 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  )
}

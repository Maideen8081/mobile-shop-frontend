import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  hoverable?: boolean
  onClick?: () => void
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  hoverable = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-bg-card border border-border shadow-card rounded-xl
        ${paddingClasses[padding]}
        ${hoverable ? 'hover:shadow-card-hover hover:bg-bg-card-hover transition-all duration-200 cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}`}
    >
      {children}
    </div>
  )
}

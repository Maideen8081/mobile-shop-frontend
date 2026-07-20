import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface FloatingCardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
  onClick?: () => void
  padding?: 'sm' | 'md' | 'lg' | 'xl'
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-7',
}

export default function FloatingCard({
  children,
  className = '',
  hoverable = true,
  onClick,
  padding = 'md',
}: FloatingCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverable ? { y: -2 } : {}}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`bg-bg-card border border-border shadow-card rounded-xl
        ${paddingClasses[padding]}
        ${hoverable ? 'hover:shadow-card-hover hover:bg-bg-card-hover transition-all duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}`}
    >
      {children}
    </motion.div>
  )
}

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

export default function GlassCard({
  children,
  className = '',
  onClick,
  hoverable = true,
}: GlassCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverable ? { y: -2 } : {}}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`bg-bg-card border border-border shadow-card rounded-xl
        ${hoverable ? 'hover:shadow-card-hover transition-all duration-200 cursor-pointer' : ''}
        ${className}`}
    >
      {children}
    </motion.div>
  )
}

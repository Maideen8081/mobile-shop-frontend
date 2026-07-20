import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  delay?: number
  padding?: boolean
}

export default function GlassCard({ children, className = '', hover = true, delay = 0, padding = true }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={hover ? { y: -2 } : {}}
      className={`bg-bg-card border border-border shadow-card rounded-xl ${padding ? 'p-5 lg:p-6' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface NotificationCardProps {
  icon: ReactNode
  title: string
  description: string
  time?: string
  color?: string
  onClick?: () => void
}

export default function NotificationCard({
  icon,
  title,
  description,
  time,
  color = '#7c3aed',
  onClick,
}: NotificationCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative bg-bg-card border border-border shadow-card rounded-xl overflow-hidden cursor-pointer"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: color }}
      />
      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
              {time && <span className="text-[10px] text-text-label whitespace-nowrap">{time}</span>}
            </div>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

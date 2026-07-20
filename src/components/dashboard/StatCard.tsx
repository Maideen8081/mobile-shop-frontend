import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import StatCounter from './StatCounter'

interface StatCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  growth?: number
  trend?: 'up' | 'down'
  subtitle?: string
  icon: ReactNode
  color?: string
  delay?: number
  className?: string
}

export default function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  growth,
  trend,
  subtitle,
  icon,
  color = '#7c3aed',
  delay = 0,
  className = '',
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className={`bg-bg-card border border-border shadow-card rounded-xl p-5 ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-medium text-text-label uppercase tracking-wider">{title}</p>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}14` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>

      <div className="text-2xl font-bold text-text-primary tracking-tight">
        <StatCounter value={value} prefix={prefix} suffix={suffix} />
      </div>

      {(growth !== undefined || subtitle) && (
        <div className="flex items-center gap-1.5 mt-1.5">
          {growth !== undefined && trend && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
              <span
                className={`inline-block w-0 h-0 border-x-[4px] border-x-transparent ${
                  trend === 'up' ? 'border-b-[6px] border-b-success' : 'border-t-[6px] border-t-danger'
                } mb-0.5`}
              />
              {Math.abs(growth)}%
            </span>
          )}
          {subtitle && <span className="text-xs text-text-muted">{subtitle}</span>}
        </div>
      )}
    </motion.div>
  )
}

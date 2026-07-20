import { type ReactNode } from 'react'
import FloatingCard from './FloatingCard'

interface AnalyticsWidgetProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  height?: string
}

export default function AnalyticsWidget({
  title,
  subtitle,
  children,
  className = '',
  height = 'h-80',
}: AnalyticsWidgetProps) {
  return (
    <FloatingCard className={`p-5 ${className}`} hoverable={false} padding="md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-text-label mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className={`w-full ${height}`}>{children}</div>
    </FloatingCard>
  )
}

import { motion } from 'framer-motion'
import { FiShoppingBag, FiTool, FiClock, FiDollarSign, FiTrendingUp, FiPackage, FiAlertTriangle, FiStar } from 'react-icons/fi'
import StatCounter from './StatCounter'

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  FiShoppingBag, FiTool, FiClock, FiDollarSign, FiTrendingUp, FiPackage, FiAlertTriangle, FiStar,
}

interface KPIStatCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  growth: number
  trend: 'up' | 'down'
  subtitle: string
  color: string
  bgGlow: string
  icon: string
  sparkline: number[]
  delay: number
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 60
  const h = 24
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} style={{ opacity: 0.4 }} />
    </svg>
  )
}

export default function KPIStatCard({ title, value, prefix = '', suffix = '', growth, trend, subtitle, color, bgGlow, icon, sparkline, delay }: KPIStatCardProps) {
  const Icon = iconMap[icon] || FiShoppingBag

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="bg-bg-card border border-border shadow-card rounded-xl p-5 overflow-hidden group cursor-pointer"
    >
      <div
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"
        style={{ background: bgGlow }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-semibold text-text-label uppercase tracking-wider">{title}</p>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
            <span style={{ color }}><Icon size={17} /></span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">
              <StatCounter value={value} prefix={prefix} suffix={suffix} />
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
                <span className={`inline-block w-0 h-0 border-x-[4px] border-x-transparent ${trend === 'up' ? 'border-b-[6px] border-b-success' : 'border-t-[6px] border-t-danger'} mb-0.5`} />
                {Math.abs(growth)}%
              </span>
              <span className="text-xs text-text-muted">{subtitle}</span>
            </div>
          </div>
          <MiniSparkline data={sparkline} color={color} />
        </div>
      </div>
    </motion.div>
  )
}

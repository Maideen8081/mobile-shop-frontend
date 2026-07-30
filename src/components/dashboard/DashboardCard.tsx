import { motion } from 'framer-motion'
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiTool, FiClock, FiPackage, FiStar, FiAlertTriangle, FiShoppingBag } from 'react-icons/fi'
import StatCounter from './StatCounter'

const iconMap: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  FiShoppingBag, FiTool, FiClock, FiDollarSign, FiPackage, FiAlertTriangle, FiStar,
}

interface DashboardCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  growth: number
  trend: 'up' | 'down'
  subtitle: string
  color: string
  bgGlow: string
  delay: number
}

function getIcon(color: string) {
  const key = Object.keys(iconMap).find((k) => color.startsWith(k)) ?? 'FiShoppingBag'
  return iconMap[key] || FiShoppingBag
}

export default function DashboardCard({
  title, value, prefix = '', suffix = '', growth, trend, subtitle, color, bgGlow, delay,
}: DashboardCardProps) {
  const Icon = getIcon(color)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="bg-bg-card border border-border shadow-card rounded-xl p-5 relative overflow-hidden group cursor-pointer"
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" style={{ background: bgGlow }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-semibold text-text-label uppercase tracking-wider">{title}</p>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center`} style={{ background: `${color.replace('from-', '').split(' ')[0] || '#7c3aed'}20` }}>
            <Icon size={16} style={{ color: '#CB202D' }} />
          </div>
        </div>

        <div className="flex items-end gap-2 mb-1.5">
          <span className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">
            <StatCounter value={value} prefix={prefix} suffix={suffix} />
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
            {trend === 'up' ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
            {Math.abs(growth)}%
          </span>
          <span className="text-xs text-text-muted">{subtitle}</span>
        </div>
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { FiPackage, FiCheckCircle, FiTrendingUp, FiAward, FiAlertTriangle, FiLayers, FiSmartphone } from 'react-icons/fi'
import StatCounter from '../dashboard/StatCounter'

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  FiPackage, FiCheckCircle, FiTrendingUp, FiAward, FiAlertTriangle, FiLayers,
}

interface StatWidgetProps {
  label: string
  value: number
  icon: string
  color: string
  bgGlow: string
  delay: number
}

export default function StatWidget({ label, value, icon, color, bgGlow, delay }: StatWidgetProps) {
  const Icon = iconMap[icon] || FiSmartphone
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.06)' }}
      className="relative rounded-xl bg-bg-card border border-border shadow-sm p-4 overflow-hidden group cursor-pointer"
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" style={{ background: bgGlow }} />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted font-medium">{label}</p>
          <p className="text-2xl font-bold text-text-primary mt-1"><StatCounter value={value} /></p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}12` }}>
          <span style={{ color }}><Icon size={18} /></span>
        </div>
      </div>
    </motion.div>
  )
}

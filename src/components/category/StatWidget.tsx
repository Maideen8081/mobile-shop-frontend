import { motion } from 'framer-motion'
import { FiFolder, FiGrid, FiCheckCircle, FiXCircle, FiSmartphone } from 'react-icons/fi'
import StatCounter from '../dashboard/StatCounter'

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  FiFolder, FiGrid, FiCheckCircle, FiXCircle,
}

interface StatWidgetProps {
  label: string
  value: number
  icon: string
  color: string
  delay: number
}

export default function StatWidget({ label, value, icon, color, delay }: StatWidgetProps) {
  const Icon = iconMap[icon] || FiSmartphone

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-bg-card border border-white/5 shadow-card rounded-xl p-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">
            <StatCounter value={value} />
          </p>
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <span style={{ color }}><Icon size={16} /></span>
        </div>
      </div>
    </motion.div>
  )
}

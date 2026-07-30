import { motion } from 'framer-motion'
import { FiTool, FiSmartphone, FiClock, FiCheckCircle, FiPackage, FiAlertCircle } from 'react-icons/fi'
import { repairActivityFeed } from '../../data/repairData'

const typeConfig: Record<string, { icon: React.ComponentType<{ size?: number }>; color: string; bg: string }> = {
  created: { icon: FiSmartphone, color: 'text-info', bg: 'bg-info/10' },
  diagnosis: { icon: FiTool, color: 'text-primary', bg: 'bg-primary/10' },
  qc: { icon: FiCheckCircle, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  ready: { icon: FiClock, color: 'text-success', bg: 'bg-success/10' },
  parts: { icon: FiPackage, color: 'text-warning', bg: 'bg-warning/10' },
  progress: { icon: FiTool, color: 'text-orange-600', bg: 'bg-orange-100' },
  approval: { icon: FiAlertCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
}

export default function RepairActivityFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl bg-bg-card border border-border p-5 lg:p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-text-primary tracking-tight">Live Activity</h3>
          <p className="text-xs text-text-muted mt-0.5">Real-time repair updates</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-success/10">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-semibold text-success">Live</span>
        </div>
      </div>

      <div className="space-y-0">
        {repairActivityFeed.slice(0, 7).map((activity, i) => {
          const cfg = typeConfig[activity.type] || { icon: FiSmartphone, color: 'text-text-secondary', bg: 'bg-bg' }
          const Icon = cfg.icon
          return (
            <motion.div key={activity.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex gap-3 pb-3 last:pb-0 relative"
            >
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center relative z-10`}>
                  <Icon size={14} />
                </div>
                {i < Math.min(repairActivityFeed.length, 7) - 1 && <div className="w-px flex-1 bg-primary/10 mt-1" />}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm text-text-secondary leading-snug">{activity.text}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-text-muted">{activity.time}</span>
                  <span className="w-1 h-1 rounded-full bg-primary/20" />
                  <span className="text-[10px] text-text-muted">{activity.user}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

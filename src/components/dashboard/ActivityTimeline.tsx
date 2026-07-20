import { motion } from 'framer-motion'
import { FiShoppingCart, FiTool, FiPackage, FiStar, FiUserCheck, FiCreditCard, FiAlertTriangle, FiFileText } from 'react-icons/fi'
import GlassCard from './GlassCard'
import { recentActivities } from '../../data/dashboardData'

const typeConfig: Record<string, { icon: React.ComponentType<{ size?: number }>; color: string; bg: string }> = {
  sale: { icon: FiShoppingCart, color: 'text-success', bg: 'bg-success/10' },
  repair: { icon: FiTool, color: 'text-primary', bg: 'bg-primary/10' },
  stock: { icon: FiPackage, color: 'text-info', bg: 'bg-info/10' },
  feedback: { icon: FiStar, color: 'text-warning', bg: 'bg-warning/10' },
  assign: { icon: FiUserCheck, color: 'text-accent', bg: 'bg-accent/10' },
  payment: { icon: FiCreditCard, color: 'text-success', bg: 'bg-success/10' },
  alert: { icon: FiAlertTriangle, color: 'text-danger', bg: 'bg-danger/10' },
  invoice: { icon: FiFileText, color: 'text-secondary', bg: 'bg-secondary/10' },
}

export default function ActivityTimeline() {
  return (
    <GlassCard padding={false} className="p-5 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-text-primary tracking-tight">Recent Activities</h3>
          <p className="text-xs text-text-muted mt-0.5">Latest store updates</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10">
          <span className="w-1.5 h-1.5 rounded-full bg-success shadow-lg" />
          <span className="text-[10px] font-semibold text-success">Live</span>
        </div>
      </div>

      <div className="space-y-0">
        {recentActivities.map((activity, i) => {
          const cfg = typeConfig[activity.type] ?? { icon: FiStar, color: 'text-text-muted', bg: 'bg-white/[0.04]' }
          const Icon = cfg.icon

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06, ease: 'easeOut' }}
              className="flex gap-3 pb-4 last:pb-0 relative"
            >
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-lg ${cfg.bg} ${cfg.color} flex items-center justify-center relative z-10`}>
                  <Icon size={14} />
                </div>
                {i < recentActivities.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm text-text-secondary leading-snug">{activity.text}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-text-label">{activity.time}</span>
                  <span className="w-1 h-1 rounded-full bg-text-label" />
                  <span className="text-[10px] text-text-label">{activity.user}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
}

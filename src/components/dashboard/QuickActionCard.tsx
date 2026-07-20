import { motion } from 'framer-motion'
import GlassCard from './GlassCard'
import { quickActions } from '../../data/dashboardData'

export default function QuickActionCard() {
  return (
    <GlassCard padding={false} className="p-5 lg:p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-primary tracking-tight">Quick Actions</h3>
        <p className="text-xs text-text-muted mt-0.5">Frequently used operations</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {quickActions.map((action, i) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.03] border border-border hover:border-primary/20 transition-all cursor-pointer group"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${action.color}20` }}
            >
              {action.icon}
            </div>
            <span className="text-xs font-semibold text-text-secondary">{action.label}</span>
            <span className="text-[9px] text-text-label -mt-1">{action.desc}</span>
          </motion.button>
        ))}
      </div>
    </GlassCard>
  )
}

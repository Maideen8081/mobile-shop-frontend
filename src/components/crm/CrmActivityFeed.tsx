import { motion } from 'framer-motion'
import { FiStar, FiMessageSquare, FiShoppingCart, FiTool, FiUserPlus, FiGift, FiRefreshCw, FiAward } from 'react-icons/fi'
import { customerActivityFeed } from '../../data/crmData'

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  purchase: { icon: FiShoppingCart, color: 'text-primary', bg: 'bg-primary/10' },
  redeem: { icon: FiRefreshCw, color: 'text-primary', bg: 'bg-primary/10' },
  new: { icon: FiUserPlus, color: 'text-success', bg: 'bg-success/10' },
  review: { icon: FiStar, color: 'text-warning', bg: 'bg-warning/10' },
  repair: { icon: FiTool, color: 'text-primary', bg: 'bg-primary/10' },
  tier: { icon: FiAward, color: 'text-primary', bg: 'bg-primary/10' },
  birthday: { icon: FiGift, color: 'text-primary', bg: 'bg-primary/10' },
  referral: { icon: FiUserPlus, color: 'text-primary', bg: 'bg-primary/10' },
}

export default function CrmActivityFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-xl bg-bg-card border border-border shadow-lg shadow-black/[0.03] p-5 lg:p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-text-primary tracking-tight">Recent Activity</h3>
          <p className="text-xs text-text-muted mt-0.5">Latest customer interactions</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-success/10">
          <span className="w-1.5 h-1.5 rounded-full bg-success/100 animate-pulse" />
          <span className="text-[10px] font-semibold text-success">Live</span>
        </div>
      </div>
      <div className="space-y-0">
        {customerActivityFeed.slice(0, 7).map((activity, i) => {
          const cfg = typeConfig[activity.type] || { icon: FiMessageSquare, color: 'text-text-secondary', bg: 'bg-gray-100' }
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
                {i < Math.min(customerActivityFeed.length, 7) - 1 && <div className="w-px flex-1 border-border mt-1" />}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm text-text-secondary leading-snug">{activity.text}</p>
                <span className="text-[10px] text-text-muted">{activity.time}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

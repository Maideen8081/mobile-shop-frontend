import { motion } from 'framer-motion'
import { FiZap, FiBell, FiTrendingUp, FiShoppingCart, FiDollarSign, FiStar, FiAlertCircle, FiClock, FiUserPlus, FiRefreshCw } from 'react-icons/fi'
import GlassCard from './GlassCard'
import { aiInsights, notifications } from '../../data/dashboardData'

export default function RightPanel() {
  return (
    <div className="space-y-4">
      <GlassCard padding={false} className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiZap size={15} className="text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">AI Insights</h3>
          </div>
          <button className="text-[10px] font-medium text-primary hover:text-primary-hover transition-colors cursor-pointer">View All</button>
        </div>

        <div className="space-y-2.5">
          {aiInsights.map((insight, i) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08, ease: 'easeOut' }}
              className={`p-3 rounded-lg text-xs leading-relaxed border ${
                insight.type === 'warning' ? 'bg-warning/5 border-warning/10' :
                insight.type === 'success' ? 'bg-success/5 border-success/10' :
                'bg-primary/5 border-primary/10'
              }`}
            >
              <div className="flex items-start gap-2">
                {insight.type === 'warning' ? <FiAlertCircle size={12} className="text-warning mt-0.5 flex-shrink-0" /> :
                 insight.type === 'success' ? <FiStar size={12} className="text-success mt-0.5 flex-shrink-0" /> :
                 <FiZap size={12} className="text-primary mt-0.5 flex-shrink-0" />}
                <span className="text-text-secondary">{insight.text}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      <GlassCard padding={false} className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiBell size={15} className="text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
            <span className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-primary rounded-full">3</span>
          </div>
          <button className="text-text-label hover:text-text-muted transition-colors cursor-pointer">
            <FiRefreshCw size={12} />
          </button>
        </div>

        <div className="space-y-1">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06, ease: 'easeOut' }}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg transition-colors ${
                !notif.read ? 'bg-primary/5' : 'hover:bg-white/[0.02]'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.read ? 'bg-primary' : 'bg-text-label'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${!notif.read ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>{notif.text}</p>
                <p className="text-[9px] text-text-label mt-0.5">{notif.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      <GlassCard padding={false} className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <FiClock size={15} className="text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Quick Stats</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Active Users', value: '24', icon: FiUserPlus, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Conversion', value: '12.5%', icon: FiTrendingUp, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Avg. Order', value: '₹32,450', icon: FiShoppingCart, color: 'text-info', bg: 'bg-info/10' },
            { label: 'Today Revenue', value: '₹2.8L', icon: FiDollarSign, color: 'text-warning', bg: 'bg-warning/10' },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: 'easeOut' }}
                className="p-3 rounded-lg bg-white/[0.03] border border-border"
              >
                <div className={`w-7 h-7 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-2`}>
                  <Icon size={13} />
                </div>
                <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                <p className="text-[10px] text-text-label">{stat.label}</p>
              </motion.div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}

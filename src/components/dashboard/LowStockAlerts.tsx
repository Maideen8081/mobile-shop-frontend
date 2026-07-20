import { motion } from 'framer-motion'
import GlassCard from './GlassCard'
import { lowStockItems } from '../../data/dashboardData'

export default function LowStockAlerts() {
  return (
    <GlassCard padding={false} className="p-5 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-text-primary tracking-tight">Low Stock Alerts</h3>
          <p className="text-xs text-text-muted mt-0.5">Items below reorder point</p>
        </div>
        <button className="text-xs font-medium text-primary hover:text-primary-hover transition-colors cursor-pointer">Manage →</button>
      </div>

      <div className="space-y-3">
        {lowStockItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08, ease: 'easeOut' }}
            className="flex items-center gap-3 p-3 rounded-lg bg-warning/[0.03] hover:bg-warning/[0.06] transition-colors group border border-warning/5"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-surface-lighter flex items-center justify-center text-lg border border-border">
                {item.image}
              </div>
              {item.critical && (
                <motion.span
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-danger border-2 border-surface"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
              <p className="text-[10px] text-text-label">{item.sku}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${item.stock <= 3 ? 'text-danger' : 'text-warning'}`}>
                {item.stock}
              </p>
              <p className="text-[10px] text-text-label">min: {item.threshold}</p>
            </div>
            <button className="px-3 py-1.5 text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer whitespace-nowrap">
              Restock
            </button>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}

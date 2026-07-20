import { motion } from 'framer-motion'
import { FiUser, FiStar, FiShoppingBag, FiTool } from 'react-icons/fi'
import type { Customer } from '../../data/crmData'

const tierColors: Record<string, { bg: string; text: string; border: string }> = {
  Platinum: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  Gold: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300/30' },
  Silver: { bg: 'bg-gray-100', text: 'text-text-secondary', border: 'border-gray-300/30' },
  Bronze: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300/30' },
}

export default function CustomerCard({ customer, index = 0, onClick }: { customer: Customer; index?: number; onClick?: (c: Customer) => void }) {
  const tier = tierColors[customer.loyaltyTier] || tierColors.Bronze
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.06)' }}
      onClick={() => onClick?.(customer)}
      className="relative rounded-xl bg-bg-card border border-border shadow-sm p-4 cursor-pointer overflow-hidden group"
    >
      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-primary/5 blur-2xl group-hover:scale-150 transition-transform duration-700" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-sm font-bold text-white shadow-md">
                {customer.avatar}
              </div>
              <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${customer.status === 'active' ? 'bg-success/100' : 'bg-gray-300'}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">{customer.name}</p>
              <p className="text-[10px] text-text-muted">{customer.mobile}</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold ${tier.bg} ${tier.text} border ${tier.border}`}>
            {customer.loyaltyTier}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-text-muted">
            <FiShoppingBag size={11} className="text-purple-400" />
            <span>{customer.totalPurchases} purchases</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted">
            <FiTool size={11} className="text-blue-400" />
            <span>{customer.repairCount} repairs</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted">
            <FiStar size={11} className="text-amber-400" />
            <span>{customer.loyaltyPoints} pts</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted">
            <FiUser size={11} className="text-emerald-400" />
            <span>{customer.city}</span>
          </div>
        </div>
        {customer.vip && (
          <div className="mt-2 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-[9px] font-semibold text-primary">⭐ VIP Customer</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiDollarSign, FiTool, FiStar, FiClock, FiShoppingBag, FiMessageCircle, FiPhone, FiMail, FiMapPin, FiCalendar, FiAward } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import { customers, customerPurchaseHistory, customerRepairHistory } from '../data/crmData'
import { RepairStatusBadge } from '../components/repair/WorkflowTracker'

const tierColors: Record<string, string> = {
  Platinum: 'text-purple-700 bg-purple-100 border-purple-300/30',
  Gold: 'text-amber-700 bg-amber-100 border-amber-300/30',
  Silver: 'text-text-secondary bg-gray-100 border-gray-300/30',
  Bronze: 'text-orange-700 bg-orange-100 border-orange-300/30',
}

export default function CustomerProfile() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const customerId = Number(searchParams.get('id')) || 1
  const customer = customers.find((c) => c.id === customerId) || customers[0]
  const purchases = customerPurchaseHistory[customerId] || []
  const repairs = customerRepairHistory[customerId] || []

  return (
    <PageLayout title="Customer Profile">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary mb-2 cursor-pointer">
          <FiArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
          <span>CRM</span><span>/</span><span className="text-text-secondary font-medium">Profile</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative rounded-3xl bg-bg-card border border-border shadow-lg shadow-black/[0.03] p-5 lg:p-6 overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-2xl font-bold text-white ">
              {customer.avatar}
            </div>
            <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${customer.status === 'active' ? 'bg-success/100' : 'bg-gray-300'}`} />
            {customer.vip && (
              <span className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-[10px] shadow-md">
                ⭐
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-text-primary">{customer.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border ${tierColors[customer.loyaltyTier] || tierColors.Bronze}`}>
                {customer.loyaltyTier}
              </span>
              {customer.vip && (
                <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-[10px] font-semibold text-primary border border-primary/20">
                  ⭐ VIP
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-text-muted mt-2">
              <span className="flex items-center gap-1"><FiPhone size={12} /> {customer.mobile}</span>
              <span className="flex items-center gap-1"><FiMail size={12} /> {customer.email}</span>
              <span className="flex items-center gap-1"><FiMapPin size={12} /> {customer.city}</span>
              <span className="flex items-center gap-1"><FiCalendar size={12} /> Customer since {customer.customerSince}</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/10 text-success text-[10px] font-semibold hover:bg-success/20 transition-colors cursor-pointer">
                <FiMessageCircle size={12} /> WhatsApp
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-info/10 text-info text-[10px] font-semibold hover:bg-info/20 transition-colors cursor-pointer">
                <FiPhone size={12} /> Call
              </button>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-2xl font-bold text-text-primary">₹{(customer.totalSpent / 1000).toFixed(0)}k</p>
            <p className="text-[10px] text-text-muted">Total Spent</p>
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <FiStar size={12} /> {customer.satisfactionScore}%
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Spent', value: `₹${customer.totalSpent.toLocaleString('en-IN')}`, icon: FiDollarSign, color: '#8b5cf6' },
          { label: 'Repairs', value: customer.repairCount.toString(), icon: FiTool, color: '#4f6bff' },
          { label: 'Loyalty Pts', value: customer.loyaltyPoints.toLocaleString(), icon: FiStar, color: '#f59e0b' },
          { label: 'Pending Repairs', value: customer.pendingRepairs.toString(), icon: FiClock, color: '#ef4444' },
          { label: 'Last Purchase', value: customer.lastPurchaseDate, icon: FiShoppingBag, color: '#22c55e' },
          { label: 'Sat. Score', value: `${customer.satisfactionScore}%`, icon: FiAward, color: '#06b6d4' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
            className="rounded-xl bg-bg-card border border-border shadow-sm p-3 text-center"
          >
            <card.icon size={16} style={{ color: card.color }} className="mx-auto mb-1" />
            <p className="text-xs font-bold text-text-primary">{card.value}</p>
            <p className="text-[9px] text-text-muted">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="relative rounded-3xl bg-bg-card border border-border shadow-lg shadow-black/[0.03] p-5 lg:p-6"
        >
          <h3 className="text-sm font-bold text-text-primary tracking-tight mb-4">Purchase History</h3>
          {purchases.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">No purchases yet</p>
          ) : (
            <div className="space-y-3">
              {purchases.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-sm shrink-0">
                    <FiShoppingBag size={15} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary">{p.product}</p>
                    <p className="text-[10px] text-text-muted">{p.variant}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-semibold text-text-secondary">₹{p.price.toLocaleString('en-IN')}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-[10px] text-text-muted">{p.paymentMethod}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-[10px] text-text-muted">{p.date}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="relative rounded-3xl bg-bg-card border border-border shadow-lg shadow-black/[0.03] p-5 lg:p-6"
        >
          <h3 className="text-sm font-bold text-text-primary tracking-tight mb-4">Repair History</h3>
          {repairs.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">No repair history</p>
          ) : (
            <div className="space-y-3">
              {repairs.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-info/5 hover:bg-info/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center text-sm shrink-0">
                    <FiTool size={15} className="text-info" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-semibold text-text-primary">{r.repairId}</p>
                      <RepairStatusBadge status={r.status as any} size="sm" />
                    </div>
                    <p className="text-[10px] text-text-muted">{r.deviceModel} • {r.issue}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted">
                      <span>{r.technician}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span>₹{r.cost.toLocaleString('en-IN')}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span>{r.date}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </PageLayout>
  )
}

import { motion } from 'framer-motion'
import { FiCalendar, FiClock, FiShield, FiHash, FiTag } from 'react-icons/fi'
import type { WarrantyRecord } from '../../data/warrantyData'

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  Active: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  'Expiring Soon': { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
  Expired: { bg: 'bg-bg', text: 'text-text-muted', dot: 'bg-text-muted' },
  Claimed: { bg: 'bg-info/10', text: 'text-info', dot: 'bg-info' },
  'Under Review': { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
}

const providerBadge: Record<string, { bg: string; text: string }> = {
  Brand: { bg: 'bg-primary/10', text: 'text-primary' },
  Seller: { bg: 'bg-info/10', text: 'text-info' },
  Extended: { bg: 'bg-info/10', text: 'text-info' },
}

interface WarrantyCardProps {
  warranty: WarrantyRecord
}

export default function WarrantyCard({ warranty }: WarrantyCardProps) {
  const s = statusStyles[warranty.status] || statusStyles.Active
  const p = providerBadge[warranty.warrantyProvider] || providerBadge.Brand
  const days = warranty.remainingDays
  const isUrgent = days >= 0 && days <= 30

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, boxShadow: '0 32px 80px rgba(0,0,0,0.08)' }}
      className="relative rounded-xl bg-bg-card border border-border p-5 overflow-hidden group"
    >
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 opacity-30" style={{ background: `radial-gradient(circle, ${days < 0 ? '#64748b' : isUrgent ? '#f59e0b' : '#4f6bff'}, transparent)` }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-surface-lighter flex items-center justify-center text-2xl shadow-inner">
              {warranty.productImage}
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">{warranty.productName}</h3>
              <p className="text-[11px] text-text-muted font-medium">{warranty.productBrand}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold ${s.bg} ${s.text} border border-border`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {warranty.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 mb-4">
          <div className="flex items-center gap-2">
            <FiHash size={12} className="text-text-muted" />
            <span className="text-[11px] text-text-muted">IMEI: <span className="font-mono font-medium text-text-secondary">{warranty.imei}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <FiTag size={12} className="text-text-muted" />
            <span className="text-[11px] text-text-muted">SN: <span className="font-mono font-medium text-text-secondary">{warranty.serialNumber}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <FiCalendar size={12} className="text-text-muted" />
            <span className="text-[11px] text-text-muted">Invoice: <span className="font-medium text-text-secondary">{warranty.invoiceNumber}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <FiCalendar size={12} className="text-text-muted" />
            <span className="text-[11px] text-text-muted">Purchased: <span className="font-medium text-text-secondary">{warranty.purchaseDate}</span></span>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface-lighter border border-border">
          <div className="flex items-center gap-2">
            <FiClock size={14} className={days < 0 ? 'text-text-muted' : isUrgent ? 'text-warning' : 'text-success'} />
            <div>
              <p className={`text-lg font-bold ${days < 0 ? 'text-text-muted' : isUrgent ? 'text-warning' : 'text-success'}`}>
                {days < 0 ? 'Expired' : `${days} days`}
              </p>
              <p className="text-[10px] text-text-muted">Remaining</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold ${p.bg} ${p.text}`}>
              <FiShield size={10} />
              {warranty.warrantyProvider}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-[10px] text-text-muted">
            <span className="font-medium text-text-muted">{warranty.warrantyStart}</span> → <span className="font-medium text-text-muted">{warranty.warrantyEnd}</span>
          </p>
          <span className="text-[10px] text-text-muted">{warranty.coverageType}</span>
        </div>
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { FiClock, FiUser, FiSmartphone, FiCalendar, FiSend, FiShield } from 'react-icons/fi'

interface ExpiryAlertData {
  id: number
  customerName: string
  product: string
  expiryDate: string
  remainingDays: number
  mobile: string
  email: string
  reminded: boolean
  extendOffer: boolean
}

interface ExpiryAlertCardProps {
  alert: ExpiryAlertData
  onSendReminder?: (id: number) => void
  onExtendWarranty?: (id: number) => void
}

export default function ExpiryAlertCard({ alert, onSendReminder, onExtendWarranty }: ExpiryAlertCardProps) {
  const days = alert.remainingDays
  const isCritical = days <= 7
  const isWarning = days <= 30 && days > 7

  const urgencyColor = isCritical ? 'text-danger' : isWarning ? 'text-warning' : 'text-success'
  const urgencyBg = isCritical ? 'bg-danger/10 border-danger/20' : isWarning ? 'bg-warning/10 border-warning/20' : 'bg-success/10 border-success/20'
  const urgencyDot = isCritical ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-success'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 24px 60px rgba(0,0,0,0.06)' }}
      className="relative rounded-xl bg-bg-card border border-border p-5 overflow-hidden group"
    >
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 opacity-20" style={{ background: `radial-gradient(circle, ${isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e'}, transparent)` }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${urgencyBg}`}>
              <FiClock className={urgencyColor} size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <FiUser size={11} className="text-text-muted" />
                <span className="text-sm font-bold text-text-primary">{alert.customerName}</span>
              </div>
              <p className="text-[11px] text-text-muted flex items-center gap-1">
                <FiSmartphone size={10} />
                {alert.mobile}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${urgencyBg} ${urgencyColor} border`}>
            <span className={`w-1.5 h-1.5 rounded-full ${urgencyDot}`} />
            {days}d left
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <FiCalendar size={12} className="text-text-muted" />
          <span className="text-xs text-text-muted">Expires: <span className="font-semibold text-text-secondary">{alert.expiryDate}</span></span>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
            <span>Time remaining</span>
            <span className={`font-bold ${urgencyColor}`}>{days} days</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-lighter overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((days / 365) * 100, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${isCritical ? 'bg-gradient-to-r from-red-400 to-red-500' : isWarning ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSendReminder && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSendReminder(alert.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${alert.reminded ? 'bg-surface-lighter text-text-muted cursor-not-allowed' : 'bg-primary text-white'}`}
              disabled={alert.reminded}
            >
              <FiSend size={12} />
              {alert.reminded ? 'Reminded' : 'Send Reminder'}
            </motion.button>
          )}
          {onExtendWarranty && alert.extendOffer && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onExtendWarranty(alert.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-success/10 text-success text-xs font-semibold border border-success/20 hover:bg-success/20 transition-colors cursor-pointer"
            >
              <FiShield size={12} />
              Extend Offer
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

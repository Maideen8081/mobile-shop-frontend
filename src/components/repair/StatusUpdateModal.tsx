import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiClock, FiCheckCircle, FiSearch, FiPackage, FiTool, FiShield, FiTruck } from 'react-icons/fi'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'

interface StatusUpdateModalProps {
  open: boolean
  currentStatus: string
  onClose: () => void
  onUpdate: (status: string) => void
}

const statusOptions = [
  { value: 'Received', icon: FiClock, color: 'text-info', bg: 'bg-info/10', gradient: 'from-blue-500 to-blue-400' },
  { value: 'Diagnosing', icon: FiSearch, color: 'text-primary', bg: 'bg-primary/10', gradient: 'bg-primary' },
  { value: 'Waiting for Parts', icon: FiPackage, color: 'text-warning', bg: 'bg-warning/10', gradient: 'from-amber-500 to-amber-400' },
  { value: 'Repair In Progress', icon: FiTool, color: 'text-orange-600', bg: 'bg-orange-100', gradient: 'from-orange-500 to-orange-400' },
  { value: 'Quality Check', icon: FiShield, color: 'text-cyan-600', bg: 'bg-cyan-100', gradient: 'from-cyan-500 to-cyan-400' },
  { value: 'Ready for Delivery', icon: FiCheckCircle, color: 'text-success', bg: 'bg-success/10', gradient: 'from-emerald-500 to-emerald-400' },
  { value: 'Delivered', icon: FiTruck, color: 'text-teal-600', bg: 'bg-teal-100', gradient: 'from-teal-500 to-teal-400' },
]

export default function StatusUpdateModal({ open, currentStatus, onClose, onUpdate }: StatusUpdateModalProps) {
  useLockBodyScroll(open)
  const currentIdx = statusOptions.findIndex((s) => s.value === currentStatus)

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={onClose}
        >
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-bg-card rounded-3xl border border-border shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Update Status</h3>
                <p className="text-xs text-text-muted mt-0.5">Current: {currentStatus}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/10 cursor-pointer">
                <FiX size={14} className="text-text-muted" />
              </button>
            </div>

            <div className="space-y-2">
              {statusOptions.map((opt, i) => {
                const Icon = opt.icon
                const disabled = i < currentIdx
                const selected = opt.value === currentStatus
                return (
                  <motion.button
                    key={opt.value}
                    whileHover={disabled ? {} : { scale: 1.01 }}
                    whileTap={disabled ? {} : { scale: 0.99 }}
                    onClick={() => { if (!disabled) { onUpdate(opt.value); onClose() } }}
                    disabled={disabled}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left cursor-pointer ${
                      selected ? `${opt.bg} border-2 border-current` : disabled ? 'opacity-40 cursor-not-allowed bg-bg' : 'bg-bg-card hover:bg-primary/10 border border-primary/20'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${opt.bg} ${opt.color} flex items-center justify-center`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${selected ? opt.color : 'text-text-secondary'}`}>{opt.value}</p>
                      {i === currentIdx && <p className="text-[10px] text-text-muted">Current status</p>}
                    </div>
                    {selected && <span className={`w-6 h-6 rounded-full ${opt.bg} flex items-center justify-center`}><FiCheckCircle size={14} className={opt.color} /></span>}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

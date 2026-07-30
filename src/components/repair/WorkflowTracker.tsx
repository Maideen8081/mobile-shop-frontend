import { motion } from 'framer-motion'
import { repairStatuses, type RepairStatus } from '../../data/repairData'
import { FiCheckCircle, FiClock, FiTool, FiSearch, FiPackage, FiShield, FiTruck } from 'react-icons/fi'

const statusConfig: Record<RepairStatus, { icon: React.ComponentType<{ size?: number }>; color: string; bg: string; gradient: string }> = {
  'Received': { icon: FiClock, color: 'text-info', bg: 'bg-info/10', gradient: 'from-primary to-primary-hover' },
  'Diagnosing': { icon: FiSearch, color: 'text-primary', bg: 'bg-primary/10', gradient: 'bg-primary' },
  'Waiting for Parts': { icon: FiPackage, color: 'text-warning', bg: 'bg-warning/10', gradient: 'from-primary to-primary-hover' },
  'Repair In Progress': { icon: FiTool, color: 'text-orange-600', bg: 'bg-orange-100', gradient: 'from-orange-500 to-orange-400' },
  'Quality Check': { icon: FiShield, color: 'text-cyan-600', bg: 'bg-cyan-100', gradient: 'from-cyan-500 to-cyan-400' },
  'Ready for Delivery': { icon: FiCheckCircle, color: 'text-success', bg: 'bg-success/10', gradient: 'from-primary to-primary-hover' },
  'Delivered': { icon: FiTruck, color: 'text-teal-600', bg: 'bg-teal-100', gradient: 'from-teal-500 to-teal-400' },
}

export function RepairStatusBadge({ status, size = 'md' }: { status: RepairStatus; size?: 'sm' | 'md' }) {
  const cfg = statusConfig[status]
  const sizes = size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'
  return (
    <span className={`inline-flex items-center gap-1 ${sizes} rounded-lg font-semibold ${cfg.bg} ${cfg.color} border border-white/20`}>
      <cfg.icon size={size === 'sm' ? 10 : 12} />
      {status}
    </span>
  )
}

interface WorkflowTrackerProps {
  currentStatus: RepairStatus
  size?: 'sm' | 'lg'
}

export function WorkflowTracker({ currentStatus, size = 'lg' }: WorkflowTrackerProps) {
  const currentIdx = repairStatuses.indexOf(currentStatus)
  return (
    <div className={`flex items-center ${size === 'sm' ? 'gap-1' : 'gap-2'}`}>
      {repairStatuses.map((status, i) => {
        const cfg = statusConfig[status]
        const isComplete = i <= currentIdx
        const isCurrent = i === currentIdx
        return (
          <div key={status} className="flex items-center gap-2 flex-1">
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{ scale: isCurrent ? 1.15 : 1 }}
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  isComplete ? `${cfg.bg} ${cfg.color} shadow-md` : 'bg-bg text-text-muted'
                }`}
              >
                {isComplete ? <cfg.icon size={14} /> : i + 1}
              </motion.div>
              {size === 'lg' && (
                <span className={`text-[8px] mt-1 font-medium text-center leading-tight ${isComplete ? cfg.color : 'text-text-muted'}`}
                  style={{ maxWidth: 56 }}
                >
                  {status}
                </span>
              )}
            </div>
            {i < repairStatuses.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full ${isComplete ? 'bg-primary' : 'bg-bg'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function TimelineTracker({ currentStatus }: { currentStatus: RepairStatus }) {
  const currentIdx = repairStatuses.indexOf(currentStatus)
  const progress = ((currentIdx + 1) / repairStatuses.length) * 100

  return (
    <div className="space-y-3">
      <div className="relative h-2 rounded-full bg-bg overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
        />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {repairStatuses.map((status, i) => {
          const cfg = statusConfig[status]
          const isComplete = i <= currentIdx
          const isCurrent = i === currentIdx
          return (
            <div key={status} className="text-center">
              <motion.div
                initial={false}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  isComplete ? `${cfg.bg} ${cfg.color}` : 'bg-bg text-text-muted'
                }`}
              >
                <cfg.icon size={14} />
              </motion.div>
              <p className={`text-[7px] mt-1 font-medium leading-tight ${isComplete ? cfg.color : 'text-text-muted'}`}>
                {status.replace(/([A-Z])/g, ' $1').trim()}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

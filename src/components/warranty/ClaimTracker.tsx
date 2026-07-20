import { motion } from 'framer-motion'
import { FiCheck, FiClock, FiSearch, FiBookOpen, FiThumbsUp, FiThumbsDown, FiRefreshCw, FiCheckCircle } from 'react-icons/fi'
import type { WarrantyClaim } from '../../data/warrantyData'

const allSteps = [
  { key: 'Submitted', icon: FiClock, label: 'Submitted' },
  { key: 'Under Verification', icon: FiSearch, label: 'Verification' },
  { key: 'Brand Review', icon: FiBookOpen, label: 'Brand Review' },
  { key: 'Approved', icon: FiThumbsUp, label: 'Approved' },
  { key: 'Rejected', icon: FiThumbsDown, label: 'Rejected' },
  { key: 'Replacement Initiated', icon: FiRefreshCw, label: 'Replacement' },
  { key: 'Completed', icon: FiCheckCircle, label: 'Completed' },
]

const stepOrder: Record<string, number> = {
  Submitted: 0,
  'Under Verification': 1,
  'Brand Review': 2,
  Approved: 3,
  Rejected: 4,
  'Replacement Initiated': 5,
  Completed: 6,
}

interface ClaimTrackerProps {
  currentStatus: WarrantyClaim['status']
  className?: string
}

export default function ClaimTracker({ currentStatus, className = '' }: ClaimTrackerProps) {
  const currentIdx = stepOrder[currentStatus] ?? 0
  const isRejected = currentStatus === 'Rejected'

  const visibleSteps = isRejected
    ? allSteps.filter((s) => s.key !== 'Approved' && s.key !== 'Replacement Initiated' && s.key !== 'Completed')
    : allSteps.filter((s) => s.key !== 'Rejected')

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-start justify-between relative">
        {visibleSteps.map((step, i) => {
          const stepIdx = stepOrder[step.key]
          const isCompleted = stepIdx < currentIdx && !isRejected
          const isCurrent = step.key === currentStatus
          const isPending = stepIdx > currentIdx || (isRejected && stepIdx > currentIdx)

          let stateColor = 'bg-surface-lighter text-text-muted border-border'
          let lineColor = 'bg-surface-lighter'
          if (isCompleted) { stateColor = 'bg-success text-white border-success'; lineColor = 'bg-success' }
          if (isCurrent) { stateColor = 'bg-primary text-white border-primary'; lineColor = 'bg-primary' }
          if (step.key === 'Rejected' && isCurrent) { stateColor = 'bg-danger text-white border-danger'; lineColor = 'bg-danger' }

          const Icon = step.icon

          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative">
              {i > 0 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`absolute top-4 -left-1/2 w-full h-0.5 ${!isPending ? lineColor : 'bg-surface-lighter'} origin-left`}
                  style={{ zIndex: 0 }}
                />
              )}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-300 shadow-lg ${stateColor}`}
              >
                {isCompleted ? <FiCheck size={14} /> : <Icon size={14} />}
                {isCurrent && (
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-xl bg-primary/30 -z-10"
                  />
                )}
              </motion.div>
              <p className={`text-[9px] font-semibold mt-1.5 text-center leading-tight max-w-[60px] ${isCompleted ? 'text-success' : isCurrent ? 'text-primary' : 'text-text-muted'}`}>
                {step.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

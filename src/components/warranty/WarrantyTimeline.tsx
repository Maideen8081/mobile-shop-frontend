import { motion } from 'framer-motion'
import { FiPlus, FiFileText, FiRefreshCw, FiCalendar, FiCheckCircle } from 'react-icons/fi'

interface TimelineEvent {
  date: string
  event: string
  description: string
  type: 'created' | 'claim' | 'renewed' | 'expired'
}

interface WarrantyTimelineProps {
  events: TimelineEvent[]
}

const typeConfig: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string }> = {
  created: { icon: FiPlus, color: 'text-success', bg: 'bg-success/10' },
  claim: { icon: FiFileText, color: 'text-info', bg: 'bg-info/10' },
  renewed: { icon: FiRefreshCw, color: 'text-primary', bg: 'bg-primary/10' },
  expired: { icon: FiCalendar, color: 'text-text-muted', bg: 'bg-bg' },
}

export default function WarrantyTimeline({ events }: WarrantyTimelineProps) {
  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-muted">
        <FiCheckCircle size={32} className="mb-2" />
        <p className="text-sm font-medium">No timeline events</p>
        <p className="text-xs">Warranty history will appear here</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-primary/40 via-info/40 to-border rounded-full" />
      <div className="space-y-0">
        {events.map((event, i) => {
          const cfg = typeConfig[event.type] || typeConfig.created
          const Icon = cfg.icon

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative flex items-start gap-4 pb-6 last:pb-0"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.08 + 0.1, type: 'spring', stiffness: 300 }}
                className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${cfg.bg}`}
              >
                <Icon size={16} className={cfg.color} />
              </motion.div>

              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-text-primary">{event.event}</span>
                  <span className="text-[10px] text-text-muted font-medium">{event.date}</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">{event.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

import { motion } from 'framer-motion'
import { FiClock, FiCheckCircle, FiTool } from 'react-icons/fi'
import type { RepairTechnician } from '../../data/repairData'

interface TechnicianCardProps {
  tech: RepairTechnician
  delay?: number
  compact?: boolean
}

export default function TechnicianCard({ tech, delay = 0, compact = false }: TechnicianCardProps) {
  const initials = tech.avatar
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="relative rounded-2xl bg-bg-card border border-border shadow-sm overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br from-primary/5 to-secondary/5 blur-2xl" />
      <div className={`relative z-10 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center gap-3">
          <div className={`relative ${compact ? 'w-9 h-9' : 'w-12 h-12'}`}>
            <div className={`w-full h-full rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-white shadow-md`}
              style={{ background: `linear-gradient(135deg, ${tech.color}, ${tech.color}99)` }}
            >
              <span className={compact ? 'text-xs' : 'text-sm'}>{initials}</span>
            </div>
            <span className={`absolute -top-0.5 -right-0.5 ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-full border-2 border-white ${tech.online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-text-primary ${compact ? 'text-xs' : 'text-sm'} truncate`}>{tech.name}</p>
            <p className={`text-text-muted ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{tech.role} • {tech.speciality}</p>
          </div>
          {!compact && (
            <div className="text-right">
              <p className="text-xs font-bold text-text-primary">{tech.efficiency}%</p>
              <p className="text-[9px] text-text-muted">Efficiency</p>
            </div>
          )}
        </div>

        {!compact && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="rounded-xl bg-primary/10 p-2 text-center">
              <FiTool size={12} className="mx-auto text-primary mb-0.5" />
              <p className="text-xs font-bold text-text-primary">{tech.repairs}</p>
              <p className="text-[8px] text-text-muted">Repairs</p>
            </div>
            <div className="rounded-xl bg-info/10 p-2 text-center">
              <FiCheckCircle size={12} className="mx-auto text-info mb-0.5" />
              <p className="text-xs font-bold text-text-primary">{tech.rating}</p>
              <p className="text-[8px] text-text-muted">Rating</p>
            </div>
            <div className="rounded-xl bg-warning/10 p-2 text-center">
              <FiClock size={12} className="mx-auto text-warning mb-0.5" />
              <p className="text-xs font-bold text-text-primary">{tech.efficiency}%</p>
              <p className="text-[8px] text-text-muted">Speed</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

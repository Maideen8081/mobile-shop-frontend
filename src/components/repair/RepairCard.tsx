import { motion } from 'framer-motion'
import { FiTool, FiUser, FiCalendar, FiClock, FiDollarSign } from 'react-icons/fi'
import { RepairStatusBadge } from './WorkflowTracker'
import type { RepairTicket } from '../../data/repairData'

interface RepairCardProps {
  ticket: RepairTicket
  index?: number
  onClick?: (t: RepairTicket) => void
  compact?: boolean
}

export default function RepairCard({ ticket, index = 0, onClick, compact = false }: RepairCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.06)' }}
      onClick={() => onClick?.(ticket)}
      className="relative rounded-2xl bg-bg-card border border-border shadow-sm p-4 cursor-pointer overflow-hidden group"
    >
      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-gradient-to-br from-primary/[0.03] to-secondary/[0.03] blur-2xl group-hover:scale-150 transition-transform duration-700" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-xl shadow-sm border border-primary/20">
              {ticket.deviceBrand === 'Apple' ? '🍎' : ticket.deviceBrand === 'Samsung' ? '📱' : '📱'}
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">{ticket.repairId}</p>
              <p className="text-[10px] text-text-muted">{ticket.deviceBrand} {ticket.deviceModel}</p>
            </div>
          </div>
          <RepairStatusBadge status={ticket.status} size="sm" />
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <FiUser size={12} className="text-text-muted" />
            <span>{ticket.customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <FiCalendar size={12} className="text-text-muted" />
            <span>{ticket.createdAt}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <FiClock size={12} className="text-text-muted" />
            <span className={`font-semibold ${ticket.priority === 'Urgent' ? 'text-danger' : ticket.priority === 'High' ? 'text-orange-600' : ticket.priority === 'Medium' ? 'text-warning' : 'text-text-muted'}`}>
              {ticket.priority}
            </span>
          </div>
        </div>

        {!compact && (
          <div className="flex items-center gap-3 pt-3 border-t border-primary/20">
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <FiDollarSign size={12} />
              <span className="font-semibold text-text-secondary">₹{(ticket.estimatedCost || ticket.actualCost).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted ml-auto">
              <FiTool size={12} />
              <span>{ticket.issueCategory}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

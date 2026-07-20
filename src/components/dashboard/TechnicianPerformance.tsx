import { motion } from 'framer-motion'
import GlassCard from './GlassCard'
import { technicians } from '../../data/dashboardData'

export default function TechnicianPerformance() {
  return (
    <GlassCard padding={false} className="p-5 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-text-primary tracking-tight">Technician Performance</h3>
          <p className="text-xs text-text-muted mt-0.5">Productivity & efficiency overview</p>
        </div>
        <button className="text-xs font-medium text-primary hover:text-primary-hover transition-colors cursor-pointer">View All →</button>
      </div>

      <div className="space-y-4">
        {technicians.map((tech, i) => (
          <motion.div
            key={tech.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08, ease: 'easeOut' }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {tech.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-text-primary truncate">{tech.name}</p>
                <span className={`w-2 h-2 rounded-full ${tech.active ? 'bg-success' : 'bg-text-label'}`} />
              </div>
              <p className="text-xs text-text-muted">{tech.speciality} • {tech.repairs} repairs</p>
              <div className="mt-1.5 relative h-1.5 rounded-full bg-surface-lighter overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${tech.efficiency}%` }}
                  transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${tech.efficiency >= 90 ? 'bg-success' : tech.efficiency >= 85 ? 'bg-primary' : 'bg-warning'}`}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-text-primary">{tech.rating}</p>
              <p className="text-[10px] text-text-label">{tech.efficiency}% eff.</p>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiTool, FiCheckCircle, FiUsers, FiStar, FiTrendingUp } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import RepairCard from '../components/repair/RepairCard'
import { repairTechnicians, repairTickets } from '../data/repairData'

export default function TechnicianPanel() {
  const [selectedTech, setSelectedTech] = useState(repairTechnicians[0])

  const techTickets = repairTickets.filter((t) => t.technicianId === selectedTech.id && !['Delivered'].includes(t.status))

  return (
    <PageLayout title="Technician Panel">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <span>Repairs</span><span>/</span><span className="text-text-secondary font-medium">Technician Panel</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Technician Panel</h1>
            <p className="text-sm text-text-muted mt-0.5">Monitor and manage repair technicians and their workloads.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Techs', value: repairTechnicians.length, icon: FiUsers, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Online Now', value: repairTechnicians.filter((t) => t.online).length, icon: FiCheckCircle, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Avg Efficiency', value: `${Math.round(repairTechnicians.reduce((s, t) => s + t.efficiency, 0) / repairTechnicians.length)}%`, icon: FiTrendingUp, color: 'text-info', bg: 'bg-info/10' },
          { label: 'Total Repairs', value: repairTechnicians.reduce((s, t) => s + t.repairs, 0), icon: FiTool, color: 'text-warning', bg: 'bg-warning/10' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="relative rounded-2xl bg-bg-card border border-border shadow-sm p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-xs text-text-muted">{stat.label}</p>
                <p className="text-lg font-bold text-text-primary">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6">
        <div className="xl:col-span-1 space-y-3">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Technicians</h3>
          {repairTechnicians.map((tech, i) => (
            <motion.button
              key={tech.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedTech(tech)}
              className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer border ${
                selectedTech.id === tech.id
                  ? 'bg-primary/10 border-primary/20 shadow-sm'
                  : 'bg-bg-card border-border hover:bg-primary/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${tech.color}, ${tech.color}99)` }}
                >
                  {tech.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-primary truncate">{tech.name}</p>
                  <p className="text-[9px] text-text-muted">{tech.speciality}</p>
                </div>
                <span className={`w-2 h-2 rounded-full ${tech.online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              </div>
            </motion.button>
          ))}
        </div>

        <div className="xl:col-span-3 space-y-4">
          <motion.div key={selectedTech.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl bg-bg-card border border-border p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-sm font-bold text-white shadow-md"
                  style={{ background: `linear-gradient(135deg, ${selectedTech.color}, ${selectedTech.color}99)` }}
                >
                  {selectedTech.avatar}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{selectedTech.name}</h3>
                  <p className="text-xs text-text-muted">{selectedTech.role} • {selectedTech.speciality}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: `${selectedTech.color}15` }}>
                <FiStar size={12} className="text-warning fill-warning" />
                <span className="text-xs font-bold text-text-primary">{selectedTech.rating}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl bg-primary/10 p-3 text-center">
                <p className="text-lg font-bold text-text-primary">{selectedTech.repairs}</p>
                <p className="text-[10px] text-text-muted">Total Repairs</p>
              </div>
              <div className="rounded-xl bg-success/10 p-3 text-center">
                <p className="text-lg font-bold text-success">{selectedTech.efficiency}%</p>
                <p className="text-[10px] text-text-muted">Efficiency</p>
              </div>
              <div className="rounded-xl bg-warning/10 p-3 text-center">
                <p className="text-lg font-bold text-warning">{techTickets.length}</p>
                <p className="text-[10px] text-text-muted">Active Jobs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${selectedTech.online ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className="text-xs font-medium text-text-muted">{selectedTech.online ? 'Online' : 'Offline'}</span>
            </div>
          </motion.div>

          <div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Active Repairs ({techTickets.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {techTickets.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-sm text-text-muted">No active repairs assigned</div>
              ) : (
                techTickets.map((ticket, i) => (
                  <RepairCard key={ticket.id} ticket={ticket} index={i} compact />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

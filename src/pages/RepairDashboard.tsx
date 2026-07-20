import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiFilter } from 'react-icons/fi'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'
import PageLayout from '../components/layout/PageLayout'
import RepairCard from '../components/repair/RepairCard'
import TechnicianCard from '../components/repair/TechnicianCard'
import RepairActivityFeed from '../components/repair/RepairActivityFeed'
import StatusUpdateModal from '../components/repair/StatusUpdateModal'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { WorkflowTracker, RepairStatusBadge } from '../components/repair/WorkflowTracker'
import { repairKPIs, repairTickets, repairTechnicians, repairAnalytics, repairStatuses } from '../data/repairData'
import type { RepairTicket } from '../data/repairData'

interface KPI { id: number; title: string; value: number; prefix?: string; suffix?: string; growth: number; trend: 'up' | 'down'; subtitle: string; color: string; bgGlow: string; icon: string; sparkline: number[] }

function StatCard({ title, value, prefix, suffix, growth, trend, subtitle, color, bgGlow, sparkline, delay = 0 }: KPI & { delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="relative rounded-3xl bg-bg-card border border-border shadow-lg shadow-black/[0.03] p-4 lg:p-5 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.03]" style={{ background: `radial-gradient(120px at 80% 20%, ${color}, transparent)` }} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: bgGlow, color }} />
      </div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">{prefix || ''}{value.toLocaleString('en-IN')}{suffix || ''}</span>
        <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
          <span>{trend === 'up' ? '↑' : '↓'}</span> {Math.abs(growth)}%
        </span>
      </div>
      <p className="text-[10px] text-text-muted mb-3">{subtitle}</p>
      <svg className="w-full h-8" viewBox={`0 0 ${sparkline.length - 1} 100`} preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          points={sparkline.map((v, i) => `${i},${100 - (v / Math.max(...sparkline)) * 90}`).join(' ')} />
      </svg>
    </motion.div>
  )
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-card rounded-xl border border-border shadow-xl px-4 py-3">
      <p className="text-xs font-semibold text-text-muted mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-text-muted">{entry.name}: </span>
          <span className="font-semibold text-text-primary">{entry.value.toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  )
}

function AreaChartCard({ title, subtitle, data, dataKeys, delay = 0 }: { title: string; subtitle: string; data: any[]; dataKeys: { key: string; color: string; name: string }[]; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="relative rounded-3xl bg-bg-card border border-border shadow-lg shadow-black/[0.03] p-5 lg:p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-text-primary tracking-tight">{title}</h3>
          <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              {dataKeys.map((dk) => (
                <linearGradient key={dk.key} id={`grad-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={dk.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            {dataKeys.map((dk) => (
              <Area key={dk.key} type="monotone" dataKey={dk.key} stroke={dk.color} fill={`url(#grad-${dk.key})`} strokeWidth={2.5} name={dk.name} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

function DonutChartCard({ title, subtitle, data, delay = 0 }: { title: string; subtitle: string; data: { name: string; value: number; color: string }[]; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="relative rounded-3xl bg-bg-card border border-border shadow-lg shadow-black/[0.03] p-5 lg:p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-text-primary tracking-tight">{title}</h3>
          <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="h-52 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
            <span className="text-[10px] text-text-muted">{item.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function RepairDashboard() {
  const [statusModal, setStatusModal] = useState<{ open: boolean; ticket: RepairTicket | null }>({ open: false, ticket: null })
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useLockBodyScroll(selectedTicket !== null)

  const filteredTickets = filterStatus === 'all' ? repairTickets : repairTickets.filter((t) => t.status === filterStatus)

  return (
    <PageLayout title="Repair Service Dashboard">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <span className="hover:text-text-secondary transition-colors cursor-pointer">Repairs</span>
              <span>/</span>
              <span className="text-text-secondary font-medium">Dashboard</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">Repair Service Dashboard</h1>
            <p className="text-sm text-text-muted mt-0.5">Monitor repair workflow, technician performance, and device service status in real-time.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-card border border-border text-xs font-semibold text-text-secondary hover:bg-primary/10 transition-all cursor-pointer">
              <FiFilter size={13} /> Filter
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer">
              <FiPlus size={14} /> New Ticket
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {repairKPIs.slice(0, 8).map((card, i) => (
          <StatCard key={card.id} {...card} delay={i * 0.05} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6">
        <div className="xl:col-span-3 space-y-4 lg:space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="relative rounded-3xl bg-bg-card border border-border p-5 lg:p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-tight">Repair Workflow</h3>
                <p className="text-xs text-text-muted mt-0.5">Current pipeline status</p>
              </div>
            </div>
            <WorkflowTracker currentStatus="Repair In Progress" />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <AreaChartCard
              title="Monthly Repairs"
              subtitle="Completed vs Received"
              data={repairAnalytics.monthlyRepairs}
              dataKeys={[
                { key: 'completed', color: '#22c55e', name: 'Completed' },
                { key: 'received', color: '#8b5cf6', name: 'Received' },
              ]}
              delay={0.2}
            />
            <DonutChartCard
              title="Issue Distribution"
              subtitle="Common repair categories"
              data={repairAnalytics.issueDistribution}
              delay={0.25}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary tracking-tight">Active Repairs</h3>
              <div className="flex gap-1 overflow-x-auto">
                {['all', ...repairStatuses.filter((s) => s !== 'Delivered')].map((status) => (
                  <button key={status} onClick={() => setFilterStatus(status)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      filterStatus === status ? 'bg-primary text-white shadow-md' : 'bg-primary/10 text-text-muted hover:bg-primary/10'
                    }`}
                  >
                    {status === 'all' ? 'All' : status}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTickets.filter((t) => !['Delivered'].includes(t.status)).slice(0, 6).map((ticket, i) => (
                <RepairCard key={ticket.id} ticket={ticket} index={i} onClick={setSelectedTicket} compact />
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4 lg:space-y-6">
          <RepairActivityFeed />

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="relative rounded-3xl bg-bg-card border border-border p-5 lg:p-6"
          >
            <h3 className="text-sm font-bold text-text-primary tracking-tight mb-4">Technicians</h3>
            <div className="space-y-3">
              {repairTechnicians.slice(0, 4).map((tech, i) => (
                <TechnicianCard key={tech.id} tech={tech} delay={i * 0.05} compact />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="relative rounded-3xl bg-bg-card border border-border p-5 lg:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-primary tracking-tight">All Repair Tickets</h3>
            <p className="text-xs text-text-muted mt-0.5">{repairTickets.length} total tickets</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-primary/20">
                {['ID', 'Customer', 'Device', 'Issue', 'Status', 'Technician', 'Cost', 'Date'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider pb-3 px-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {repairTickets.slice(0, 8).map((ticket, i) => (
                <motion.tr key={ticket.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border hover:bg-primary/10 transition-colors cursor-pointer"
                  onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                >
                  <td className="py-3 px-2"><span className="text-xs font-mono font-semibold text-primary">{ticket.repairId}</span></td>
                  <td className="py-3 px-2"><span className="text-sm font-medium text-text-secondary">{ticket.customerName}</span></td>
                  <td className="py-3 px-2"><span className="text-xs text-text-muted">{ticket.deviceModel}</span></td>
                  <td className="py-3 px-2"><span className="text-xs text-text-muted">{ticket.issueCategory}</span></td>
                  <td className="py-3 px-2"><RepairStatusBadge status={ticket.status} size="sm" /></td>
                  <td className="py-3 px-2"><span className="text-xs text-text-muted">{repairTechnicians.find((t) => t.id === ticket.technicianId)?.name || '—'}</span></td>
                  <td className="py-3 px-2"><span className="text-xs font-semibold text-text-secondary">₹{(ticket.estimatedCost || ticket.actualCost).toLocaleString('en-IN')}</span></td>
                  <td className="py-3 px-2"><span className="text-xs text-text-muted">{ticket.createdAt}</span></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full lg:max-w-2xl bg-bg-card rounded-t-3xl lg:rounded-3xl border border-border shadow-xl overflow-y-auto max-h-[85vh]"
          >
            <div className="p-6 border-b border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                    {selectedTicket.deviceBrand === 'Apple' ? '🍎' : '📱'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">{selectedTicket.repairId}</h3>
                    <p className="text-xs text-text-muted">{selectedTicket.deviceBrand} {selectedTicket.deviceModel}</p>
                  </div>
                </div>
                <RepairStatusBadge status={selectedTicket.status} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-[10px] font-semibold text-text-muted uppercase">Customer</p><p className="font-medium text-text-primary">{selectedTicket.customerName}</p></div>
                <div><p className="text-[10px] font-semibold text-text-muted uppercase">Mobile</p><p className="text-text-secondary">{selectedTicket.customerMobile}</p></div>
                <div><p className="text-[10px] font-semibold text-text-muted uppercase">IMEI</p><p className="font-mono text-xs text-text-secondary">{selectedTicket.imei}</p></div>
                <div><p className="text-[10px] font-semibold text-text-muted uppercase">Issue</p><p className="text-text-secondary">{selectedTicket.issueCategory}</p></div>
                <div><p className="text-[10px] font-semibold text-text-muted uppercase">Est. Cost</p><p className="font-bold text-text-primary">₹{selectedTicket.estimatedCost.toLocaleString('en-IN')}</p></div>
                <div><p className="text-[10px] font-semibold text-text-muted uppercase">Technician</p><p className="text-text-secondary">{repairTechnicians.find((t) => t.id === selectedTicket.technicianId)?.name || '—'}</p></div>
              </div>
            </div>
            <div className="p-4 flex gap-2">
              <button onClick={() => { setStatusModal({ open: true, ticket: selectedTicket }) }}
                className="flex-1 py-2.5 rounded-2xl bg-primary text-sm font-semibold text-white shadow-md cursor-pointer"
              >Update Status</button>
              <button className="flex-1 py-2.5 rounded-2xl bg-primary/10 text-sm font-semibold text-primary hover:bg-primary/10 cursor-pointer">View Full Details</button>
            </div>
          </motion.div>
        </div>
      )}

      <StatusUpdateModal
        open={statusModal.open}
        currentStatus={statusModal.ticket?.status || 'Received'}
        onClose={() => setStatusModal({ open: false, ticket: null })}
        onUpdate={(status) => console.log('Status updated:', statusModal.ticket?.repairId, '→', status)}
      />
    </PageLayout>
  )
}

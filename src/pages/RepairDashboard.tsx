import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FiFilter, FiCheck, FiX, FiAlertTriangle, FiDollarSign, FiUser, FiPackage } from 'react-icons/fi'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'
import PageLayout from '../components/layout/PageLayout'
import RepairCard from '../components/repair/RepairCard'
import TechnicianCard from '../components/repair/TechnicianCard'
import RepairActivityFeed from '../components/repair/RepairActivityFeed'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { WorkflowTracker, RepairStatusBadge } from '../components/repair/WorkflowTracker'
import { repairTechnicians, repairAnalytics, repairStatuses, type RepairStatus } from '../data/repairData'
import { repairService, type RepairTicket } from '../services/repairService'

const priorityColors: Record<string, string> = { Low: 'text-text-muted', Medium: 'text-primary', High: 'text-primary', Urgent: 'text-danger' }

const STATUS_TRANSITIONS: Record<string, string[]> = {
  Submitted: ['Accepted', 'Rejected'],
  Accepted: ['Received'],
  Received: ['Diagnosing'],
  Diagnosing: ['Repair In Progress'],
  'Waiting for Parts': ['Repair In Progress'],
  'Repair In Progress': ['Quality Check'],
  'Quality Check': ['Ready for Delivery'],
  'Ready for Delivery': ['Delivered'],
}

const STATUS_TO_BACKEND: Record<string, string> = {
  Submitted: 'pending',
  Accepted: 'accepted',
  Rejected: 'rejected',
  Received: 'device_received',
  Diagnosing: 'inspection',
  'Waiting for Parts': 'waiting_parts',
  'Repair In Progress': 'repair_in_progress',
  'Quality Check': 'quality_check',
  'Ready for Delivery': 'ready_for_pickup',
  Delivered: 'completed',
  Cancelled: 'cancelled',
}

function parseQAPairs(text: string): { question: string; answer: string }[] {
  if (!text) return []
  const qaRegex = /Q:\s*(.+?)\s*A:\s*(.+?)(?=\s*Q:|$)/gs
  const matches = text.match(qaRegex)
  if (!matches) return []
  return matches.map((m) => {
    const q = m.replace(/^Q:\s*/, '').replace(/\s*A:[\s\S]*$/, '').trim()
    const a = m.replace(/^Q:[\s\S]*?A:\s*/, '').trim()
    return { question: q, answer: a }
  })
}

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
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useLockBodyScroll(selectedTicket !== null)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await repairService.list()
        setTickets(data as any[])
      } catch {
        setTickets([])
      }
      setLoading(false)
    }
    fetchTickets()
  }, [])

  const kpis = useMemo(() => {
    const total = tickets.length
    const submitted = tickets.filter((t: any) => t.status === 'Submitted').length
    const accepted = tickets.filter((t: any) => t.status === 'Accepted').length
    const received = tickets.filter((t: any) => t.status === 'Received').length
    const delivered = tickets.filter((t: any) => t.status === 'Delivered').length
    return [
      { id: 1, title: 'Total Bookings', value: total, suffix: '', growth: 0, trend: 'up' as const, subtitle: 'All time', color: '#CB202D', bgGlow: 'rgba(203,32,45,0.12)', icon: 'FiPackage', sparkline: [3, 5, 4, 7, 6, 8, total] },
      { id: 2, title: 'Pending Review', value: submitted, suffix: '', growth: 0, trend: submitted > 0 ? 'up' as const : 'down' as const, subtitle: 'Awaiting acceptance', color: '#CB202D', bgGlow: 'rgba(203,32,45,0.12)', icon: 'FiLoader', sparkline: submitted > 0 ? [1, 2, 1, 3, 2, submitted] : [0] },
      { id: 3, title: 'In Progress', value: accepted + received, suffix: '', growth: 0, trend: 'up' as const, subtitle: 'Active repairs', color: '#CB202D', bgGlow: 'rgba(203,32,45,0.10)', icon: 'FiTool', sparkline: [1, 2, 3, 2, 3, accepted + received] },
      { id: 4, title: 'Completed', value: delivered, suffix: '', growth: 0, trend: 'up' as const, subtitle: 'Delivered', color: '#A81D2A', bgGlow: 'rgba(203,32,45,0.08)', icon: 'FiCheck', sparkline: delivered > 0 ? [0, 1, 2, 2, 3, delivered] : [0] },
    ]
  }, [tickets])

  const filteredTickets = filterStatus === 'all' ? tickets : tickets.filter((t) => t.status === filterStatus)

  const handleAccept = async (ticket: RepairTicket) => {
    setActionLoading(ticket.repairId)
    try {
      await repairService.acceptTicket(ticket.id, 'Ticket accepted by admin')
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status: 'Accepted' as const } : t)))
      setToast({ message: `Ticket ${ticket.repairId} accepted`, type: 'success' })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to accept ticket'
      setToast({ message: msg, type: 'error' })
    }
    setActionLoading(null)
  }

  const handleReject = async (ticket: RepairTicket) => {
    const reason = window.prompt('Enter rejection reason:') || 'Not accepted'
    setActionLoading(ticket.repairId)
    try {
      await repairService.rejectTicket(ticket.id, reason)
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status: 'Rejected' as const } : t)))
      setToast({ message: `Ticket ${ticket.repairId} rejected`, type: 'success' })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to reject ticket'
      setToast({ message: msg, type: 'error' })
    }
    setActionLoading(null)
  }

  return (
    <PageLayout title="Repair Service Dashboard">
      {toast !== null && (
        <div className="fixed top-4 right-4 z-[9999] bg-white border border-border rounded-xl shadow-xl p-4 flex items-center gap-3 animate-admin-in">
          <span className={`text-sm font-medium ${toast.type === 'success' ? 'text-success' : 'text-danger'}`}>{toast.message}</span>
        </div>
      )}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <span className="hover:text-text-secondary transition-colors cursor-pointer">Repairs</span>
              <span>/</span>
              <span className="text-text-secondary font-medium">Dashboard</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">Repair Service Dashboard</h1>
            <p className="text-sm text-text-muted mt-0.5">Monitor customer repair bookings, manage workflow, and track device service status.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-card border border-border text-xs font-semibold text-text-secondary hover:bg-primary/10 transition-all cursor-pointer">
              <FiFilter size={13} /> Filter
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((card, i) => (
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
                { key: 'completed', color: '#A81D2A', name: 'Completed' },
                { key: 'received', color: '#CB202D', name: 'Received' },
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
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-surface-lighter animate-pulse" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-text-muted text-sm">No repair bookings yet</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTickets.filter((t) => !['Delivered', 'Rejected'].includes(t.status)).slice(0, 6).map((ticket, i) => (
                  <RepairCard key={ticket.id} ticket={ticket} index={i} onClick={(t) => setSelectedTicket(t as any)} compact />
                ))}
              </div>
            )}
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
            <h3 className="text-sm font-bold text-text-primary tracking-tight">All Repair Bookings</h3>
            <p className="text-xs text-text-muted mt-0.5">{tickets.length} total bookings · <span className="text-warning font-semibold">{tickets.filter(t => t.status === 'Submitted').length} pending review</span></p>
          </div>
        </div>
        {loading ? (
          <div className="h-48 rounded-xl bg-surface-lighter animate-pulse" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-primary/20">
                  {['ID', 'Customer', 'Device', 'Issue', 'Status', 'Cost', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider pb-3 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.slice(0, 20).map((ticket, i) => (
                  <motion.tr key={ticket.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-border hover:bg-primary/10 transition-colors cursor-pointer"
                    onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                  >
                    <td className="py-3 px-2"><span className="text-xs font-mono font-semibold text-primary">{ticket.repairId}</span></td>
                    <td className="py-3 px-2"><span className="text-sm font-medium text-text-secondary">{ticket.customerName}</span></td>
                    <td className="py-3 px-2"><span className="text-xs text-text-muted">{ticket.deviceModel}</span></td>
                    <td className="py-3 px-2"><span className="text-xs text-text-muted">{ticket.issueCategory}</span></td>
                    <td className="py-3 px-2"><RepairStatusBadge status={ticket.status} size="sm" /></td>
                    <td className="py-3 px-2"><span className="text-xs font-semibold text-text-secondary">₹{(ticket.estimatedCost || ticket.actualCost).toLocaleString('en-IN')}</span></td>
                    <td className="py-3 px-2"><span className="text-xs text-text-muted">{ticket.createdAt}</span></td>
                    <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                      {ticket.status === 'Submitted' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleAccept(ticket)} disabled={actionLoading === ticket.repairId}
                            className="px-2 py-1 rounded-lg bg-success/20 text-success text-[10px] font-semibold hover:bg-success/30 transition-all cursor-pointer disabled:opacity-50">
                            <FiCheck size={10} /> Accept
                          </button>
                          <button onClick={() => handleReject(ticket)} disabled={actionLoading === ticket.repairId}
                            className="px-2 py-1 rounded-lg bg-danger/20 text-danger text-[10px] font-semibold hover:bg-danger/30 transition-all cursor-pointer disabled:opacity-50">
                            <FiX size={10} /> Reject
                          </button>
                        </div>
                      )}
                      {ticket.status !== 'Submitted' && (
                        <span className="text-[10px] text-text-muted">{ticket.status}</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                <RepairStatusBadge status={selectedTicket.status as RepairStatus} />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[10px] font-semibold text-text-muted uppercase">Customer</p><p className="font-medium text-text-primary text-sm">{selectedTicket.customerName}</p></div>
                  <div><p className="text-[10px] font-semibold text-text-muted uppercase">Mobile</p><p className="text-text-secondary text-sm">{selectedTicket.customerMobile}</p></div>
                  {selectedTicket.customerEmail && <div><p className="text-[10px] font-semibold text-text-muted uppercase">Email</p><p className="text-text-secondary text-xs truncate">{selectedTicket.customerEmail}</p></div>}
                  <div><p className="text-[10px] font-semibold text-text-muted uppercase">IMEI</p><p className="font-mono text-xs text-text-secondary">{selectedTicket.imei}</p></div>
                </div>

                {(((selectedTicket as any).customerAlt) || ((selectedTicket as any).customerAddress)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                    {(selectedTicket as any).customerAlt && <div><p className="text-[10px] font-semibold text-text-muted uppercase">Alt. Mobile</p><p className="text-xs text-text-primary">{(selectedTicket as any).customerAlt}</p></div>}
                    {(selectedTicket as any).customerAddress && <div className="sm:col-span-2"><p className="text-[10px] font-semibold text-text-muted uppercase">Address</p><p className="text-xs text-text-primary">{(selectedTicket as any).customerAddress}</p></div>}
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50/60 border border-border p-3">
                  <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5"><FiAlertTriangle size={10} /> Issue</h4>
                  <p className="text-sm font-semibold text-text-primary">{selectedTicket.issueCategory}</p>
                  {parseQAPairs(selectedTicket.description).length > 0 ? (
                    <div className="mt-2 space-y-1.5">
                      {parseQAPairs(selectedTicket.description).map((qa, i) => (
                        <div key={i} className="space-y-0.5">
                          <p className="text-[10px] font-semibold text-text-muted">Q: {qa.question}</p>
                          <p className="text-[10px] text-text-secondary pl-2 border-l-2 border-primary/20">A: {qa.answer}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted leading-relaxed mt-1">{selectedTicket.description}</p>
                  )}
                  <p className={`text-[10px] font-semibold mt-1.5 ${priorityColors[selectedTicket.priority] || 'text-slate-400'}`}>Priority: {selectedTicket.priority}</p>
                </div>
                <div className="rounded-xl bg-gray-50/60 border border-border p-3">
                  <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5"><FiDollarSign size={10} /> Repair</h4>
                  <p className="text-lg font-bold text-primary">₹{selectedTicket.estimatedCost.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Est. Completion: {selectedTicket.estimatedDays} day{selectedTicket.estimatedDays > 1 ? 's' : ''}</p>
                      <p className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5"><FiUser size={10} />Technician: {(selectedTicket as any).technicianName || 'Auto Assign'}</p>
                   <div className="mt-2"><RepairStatusBadge status={selectedTicket.status as RepairStatus} /></div>
                 </div>
               </div>
                 </div>
               </div>

               {((selectedTicket as any).deviceCondition || (selectedTicket as any).warranty || (selectedTicket as any).password) && (
                 <div className="mt-4 pt-3 border-t border-border">
                   <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5"><FiPackage size={10} /> Other Details</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                     {(selectedTicket as any).deviceCondition && <div><p className="text-[10px] font-semibold text-text-muted">Device Condition</p><p className="text-xs text-text-primary">{(selectedTicket as any).deviceCondition}</p></div>}
                     {(selectedTicket as any).warranty && <div><p className="text-[10px] font-semibold text-text-muted">Warranty</p><p className="text-xs text-text-primary">{(selectedTicket as any).warranty}</p></div>}
                     {(selectedTicket as any).password && <div><p className="text-[10px] font-semibold text-text-muted">Password</p><p className="text-xs text-text-primary">{(selectedTicket as any).password}</p></div>}
                   </div>
                 </div>
               )}

              {(() => {
                const s = selectedTicket.status as string
                const next = STATUS_TRANSITIONS[s]
                if (!next || next.length === 0) return null
                return (
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {next.map((ns) => (
                      <button key={ns}
                        onClick={async () => {
                          if (ns === 'Rejected') {
                            const reason = window.prompt('Rejection reason:') || 'Not accepted'
                            setActionLoading(selectedTicket.repairId)
                            try {
                              await repairService.rejectTicket(selectedTicket.id, reason)
                              setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: 'Rejected' as const } : t)))
                              setToast({ message: `Ticket ${selectedTicket.repairId} rejected`, type: 'success' })
                              setSelectedTicket(null)
                            } catch (err: any) {
                              const msg = err?.response?.data?.message || err?.message || 'Failed to reject'
                              setToast({ message: msg, type: 'error' })
                            }
                            setActionLoading(null)
                            return
                          }
                          setActionLoading(selectedTicket.repairId)
                          try {
                            const backendStatus = STATUS_TO_BACKEND[ns]
                            await repairService.updateStatus(selectedTicket.id, backendStatus, `Status updated to ${ns}`)
                            setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: ns as any } : t)))
                            setToast({ message: `Status updated to "${ns}"`, type: 'success' })
                            setSelectedTicket(null)
                          } catch (err: any) {
                            const msg = err?.response?.data?.message || err?.message || 'Failed to update status'
                            setToast({ message: msg, type: 'error' })
                          }
                          setActionLoading(null)
                        }}
                        disabled={actionLoading === selectedTicket.repairId}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-50 ${
                          ns === 'Rejected'
                            ? 'bg-danger text-white hover:bg-danger/90'
                            : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                      >
                        {actionLoading === selectedTicket.repairId ? 'Updating...' : ns === 'Accepted' ? 'Accept Booking' : `Mark ${ns}`}
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
          </motion.div>
        </div>
      )}
    </PageLayout>
  )
}

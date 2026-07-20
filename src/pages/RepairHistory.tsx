import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiEye, FiEdit2, FiPrinter, FiSend, FiSmartphone } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import RepairCard from '../components/repair/RepairCard'
import { RepairStatusBadge } from '../components/repair/WorkflowTracker'
import { repairTickets, repairTechnicians, repairStatuses } from '../data/repairData'

export default function RepairHistory() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  const filtered = repairTickets.filter((t) => {
    const matchSearch = t.repairId.toLowerCase().includes(search.toLowerCase()) ||
      t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.imei.includes(search) ||
      t.customerMobile.includes(search)
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <PageLayout title="Repair History">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <span>Repairs</span><span>/</span><span className="text-text-secondary font-medium">History</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Repair History</h1>
            <p className="text-sm text-text-muted mt-0.5">Search and review all past and current repair tickets.</p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search by ID, customer, IMEI, or mobile..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-bg-card border border-border text-sm outline-none focus:border-primary/50 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.08)]"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="h-11 px-4 rounded-2xl bg-bg-card border border-border text-sm outline-none appearance-none cursor-pointer focus:border-primary/50"
        >
          <option value="all">All Status</option>
          {repairStatuses.map((s) => <option key={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-bg-card border border-border shadow-sm">
          {(['table', 'cards'] as const).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all cursor-pointer ${
                viewMode === mode ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-secondary'
              }`}
            >{mode}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FiSmartphone size={48} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-muted">No repair tickets found</p>
        </div>
      ) : viewMode === 'table' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto rounded-3xl bg-bg-card border border-border shadow-lg">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-primary/20">
                {['Repair ID', 'Customer', 'Device', 'IMEI', 'Technician', 'Status', 'Cost', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider px-4 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket, i) => (
                <motion.tr key={ticket.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-primary/10 hover:bg-primary/10 transition-colors group"
                >
                  <td className="px-4 py-3.5"><span className="text-xs font-mono font-semibold text-primary">{ticket.repairId}</span></td>
                  <td className="px-4 py-3.5"><span className="text-sm font-medium text-text-secondary">{ticket.customerName}</span></td>
                  <td className="px-4 py-3.5"><span className="text-xs text-text-muted">{ticket.deviceBrand} {ticket.deviceModel}</span></td>
                  <td className="px-4 py-3.5"><span className="text-xs font-mono text-text-muted">{ticket.imei}</span></td>
                  <td className="px-4 py-3.5"><span className="text-xs text-text-muted">{repairTechnicians.find((t) => t.id === ticket.technicianId)?.name || '—'}</span></td>
                  <td className="px-4 py-3.5"><RepairStatusBadge status={ticket.status} size="sm" /></td>
                  <td className="px-4 py-3.5"><span className="text-xs font-semibold text-text-secondary">₹{(ticket.estimatedCost || ticket.actualCost).toLocaleString('en-IN')}</span></td>
                  <td className="px-4 py-3.5"><span className="text-xs text-text-muted">{ticket.createdAt}</span></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {[
                        { icon: FiEye, label: 'View', color: 'text-info bg-info/10' },
                        { icon: FiEdit2, label: 'Edit', color: 'text-primary bg-primary/10' },
                        { icon: FiPrinter, label: 'Print', color: 'text-info bg-info/10' },
                        { icon: FiSend, label: 'Update', color: 'text-warning bg-warning/10' },
                      ].map((btn) => (
                        <button key={btn.label} className={`w-7 h-7 rounded-lg ${btn.color} flex items-center justify-center cursor-pointer`} title={btn.label}>
                          <btn.icon size={12} />
                        </button>
                      ))}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ticket, i) => (
            <RepairCard key={ticket.id} ticket={ticket} index={i} />
          ))}
        </motion.div>
      )}
    </PageLayout>
  )
}

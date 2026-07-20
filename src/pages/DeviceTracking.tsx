import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiSmartphone, FiUser, FiClock, FiAlertCircle } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import { RepairStatusBadge, TimelineTracker } from '../components/repair/WorkflowTracker'
import { repairTickets, repairTechnicians } from '../data/repairData'

export default function DeviceTracking() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<typeof repairTickets[0] | null>(null)

  const searchResults = searchQuery.length > 2
    ? repairTickets.filter((t) =>
        t.repairId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.imei.includes(searchQuery) ||
        t.customerMobile.includes(searchQuery) ||
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  return (
    <PageLayout title="Device Tracking">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <span>Repairs</span><span>/</span><span className="text-text-secondary font-medium">Device Tracking</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Device Tracking</h1>
            <p className="text-sm text-text-muted mt-0.5">Search and track device repair status by IMEI, Repair ID, or customer mobile.</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative rounded-3xl bg-bg-card border border-border p-5 lg:p-6"
      >
        <div className="relative max-w-xl mx-auto">
          <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search by Repair ID, IMEI, or Customer Mobile..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-primary/10 border border-primary/20 text-sm outline-none focus:border-primary/50 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.08)]"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="mt-5 space-y-3">
            {searchResults.map((ticket) => (
              <motion.div key={ticket.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                className="p-4 rounded-2xl bg-bg-card border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                      {ticket.deviceBrand === 'Apple' ? '🍎' : '📱'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-text-primary">{ticket.repairId}</h4>
                        <RepairStatusBadge status={ticket.status} size="sm" />
                      </div>
                      <p className="text-xs text-text-muted">{ticket.deviceBrand} {ticket.deviceModel} • {ticket.imei}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-text-muted"><FiUser size={12} /> {ticket.customerName}</div>
                  <div className="flex items-center gap-1.5 text-text-muted"><FiSmartphone size={12} /> {ticket.customerMobile}</div>
                  <div className="flex items-center gap-1.5 text-text-muted"><FiClock size={12} /> Est: {ticket.estimatedDays} days</div>
                  <div className="flex items-center gap-1.5 text-text-muted">
                    <FiAlertCircle size={12} className={ticket.priority === 'Urgent' ? 'text-danger' : ticket.priority === 'High' ? 'text-orange-500' : 'text-text-muted'} />
                    {ticket.priority} Priority
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {searchQuery.length > 2 && searchResults.length === 0 && (
          <div className="text-center py-10 text-sm text-text-muted">No devices found matching your search</div>
        )}

        {searchQuery.length === 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Recent Devices</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {repairTickets.slice(0, 6).map((ticket, i) => (
                <motion.div key={ticket.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                  className="p-3 rounded-2xl bg-bg-card border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-lg">{ticket.deviceBrand === 'Apple' ? '🍎' : '📱'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{ticket.repairId}</p>
                      <p className="text-[9px] text-text-muted">{ticket.deviceModel}</p>
                    </div>
                    <RepairStatusBadge status={ticket.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <FiUser size={10} /> {ticket.customerName}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {selectedTicket && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl bg-bg-card border border-border p-5 lg:p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                {selectedTicket.deviceBrand === 'Apple' ? '🍎' : '📱'}
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">{selectedTicket.repairId} - Device Tracking</h3>
                <p className="text-xs text-text-muted">{selectedTicket.deviceBrand} {selectedTicket.deviceModel} • IMEI: {selectedTicket.imei}</p>
              </div>
            </div>
            <RepairStatusBadge status={selectedTicket.status} />
          </div>

          <TimelineTracker currentStatus={selectedTicket.status} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Customer', value: selectedTicket.customerName, icon: FiUser },
              { label: 'Technician', value: repairTechnicians.find((t) => t.id === selectedTicket.technicianId)?.name || '—', icon: FiSmartphone },
              { label: 'Est. Completion', value: `${selectedTicket.estimatedDays} days`, icon: FiClock },
              { label: 'Priority', value: selectedTicket.priority, icon: FiAlertCircle },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-primary/10 p-3">
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted mb-1">
                  <item.icon size={11} /> {item.label}
                </div>
                <p className="text-sm font-semibold text-text-primary">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </PageLayout>
  )
}

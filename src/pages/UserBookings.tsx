import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiRefreshCw, FiCheck, FiLoader } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import RepairTicketManagement from '../components/repair/RepairTicketManagement'
import { repairService } from '../services/repairService'

interface BookingSummary {
  total: number
  submitted: number
  accepted: number
  rejected: number
  received: number
  delivered: number
  cancelled: number
}

export default function UserBookings() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [summary, setSummary] = useState<BookingSummary>({ total: 0, submitted: 0, accepted: 0, rejected: 0, received: 0, delivered: 0, cancelled: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await repairService.list()
        setSummary({
          total: data.length,
          submitted: data.filter((t) => t.status === 'Submitted').length,
          accepted: data.filter((t) => t.status === 'Accepted').length,
          rejected: data.filter((t) => t.status === 'Rejected').length,
          received: data.filter((t) => t.status === 'Received').length,
          delivered: data.filter((t) => t.status === 'Delivered').length,
          cancelled: data.filter((t) => t.status === 'Cancelled').length,
        })
      } catch { /* ignore */ }
      setLoading(false)
    }
    fetchData()
  }, [refreshTrigger])

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((p) => p + 1)
  }, [])

  return (
    <PageLayout title="User Bookings">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-6">
          <a href="/dashboard" className="text-text-muted hover:text-text-secondary transition-colors">
            <FiArrowLeft size={16} />
          </a>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">User Bookings</h1>
            <p className="text-sm text-text-muted mt-0.5">All repair bookings submitted by users — view, accept, reject, and manage</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-surface-lighter animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Bookings', value: summary.total, color: '#CB202D', icon: FiLoader },
              { label: 'Pending Review', value: summary.submitted, color: '#CB202D', icon: FiLoader },
              { label: 'Accepted', value: summary.accepted, color: '#A81D2A', icon: FiCheck },
              { label: 'Delivered', value: summary.delivered, color: '#CB202D', icon: FiCheck },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white border border-border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon size={14} style={{ color: s.color }} />
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{s.label}</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-text-muted">Live bookings from the repair booking form</p>
          <button onClick={handleRefresh} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-border text-xs font-semibold text-text-secondary hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
            <FiRefreshCw size={12} /> Refresh
          </button>
        </div>

        <RepairTicketManagement refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
      </motion.div>
    </PageLayout>
  )
}
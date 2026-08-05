import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiEye, FiX, FiSmartphone, FiCheck, FiUser, FiPhone, FiTrash2, FiEdit3, FiRefreshCw, FiChevronDown, FiDollarSign, FiClock, FiCheckCircle, FiXCircle, FiCreditCard } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import { tradeInService, type TradeInSubmission } from '../services/tradeInService'

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'rgba(234,179,8,0.1)', text: '#B45309', dot: '#EAB308' },
  reviewed: { bg: 'rgba(59,130,246,0.1)', text: '#2563EB', dot: '#3B82F6' },
  accepted: { bg: 'rgba(34,197,94,0.1)', text: '#16A34A', dot: '#22C55E' },
  rejected: { bg: 'rgba(239,68,68,0.1)', text: '#DC2626', dot: '#EF4444' },
  paid: { bg: 'rgba(203,32,45,0.1)', text: '#A81D2A', dot: '#CB202D' },
  cancelled: { bg: 'rgba(107,114,128,0.1)', text: '#6B7280', dot: '#6B7280' },
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  accepted: 'Accepted',
  rejected: 'Rejected',
  paid: 'Paid',
  cancelled: 'Cancelled',
}

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'rgba(234,179,8,0.1)', text: '#B45309' },
  completed: { bg: 'rgba(34,197,94,0.1)', text: '#16A34A' },
  failed: { bg: 'rgba(239,68,68,0.1)', text: '#DC2626' },
}

const NEXT_STATUS: Record<string, string | null> = {
  pending: 'reviewed',
  reviewed: 'accepted',
  accepted: 'paid',
  paid: null,
  rejected: null,
  cancelled: null,
}

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default function AdminTradeInDashboard() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<TradeInSubmission | null>(null)
  const [allTrades, setAllTrades] = useState<TradeInSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  // Edit modal state
  const [editModal, setEditModal] = useState<TradeInSubmission | null>(null)
  const [editForm, setEditForm] = useState({ finalValue: '', quotedPrice: '', adminNotes: '', paymentMethod: '' })

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  // Reject modal
  const [rejectModal, setRejectModal] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadTrades = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await tradeInService.list()
      setAllTrades(data)
    } catch {
      setError('Failed to load trade-in submissions')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTrades()
  }, [])

  const handleStatusUpdate = async (trade: TradeInSubmission, newStatus: string) => {
    setUpdatingId(trade.id)
    try {
      const updated = await tradeInService.updateStatus(trade.id, newStatus)
      setAllTrades(prev => prev.map(t => t.id === trade.id ? updated : t))
      setSelected(prev => prev?.id === trade.id ? updated : prev)
    } catch { /* ignore */ }
    setUpdatingId(null)
  }

  const handleDelete = async (id: number) => {
    setUpdatingId(id)
    try {
      await tradeInService.delete(id)
      setAllTrades(prev => prev.filter(t => t.id !== id))
      setSelected(prev => prev?.id === id ? null : prev)
      setDeleteConfirm(null)
    } catch { /* ignore */ }
    setUpdatingId(null)
  }

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) return
    setUpdatingId(id)
    try {
      const updated = await tradeInService.reject(id, rejectReason.trim())
      setAllTrades(prev => prev.map(t => t.id === id ? updated : t))
      setSelected(prev => prev?.id === id ? updated : prev)
      setRejectModal(null)
      setRejectReason('')
    } catch { /* ignore */ }
    setUpdatingId(null)
  }

  const handleEditSave = async () => {
    if (!editModal) return
    setUpdatingId(editModal.id)
    try {
      const updated = await tradeInService.update(editModal.id, {
        final_value: editForm.finalValue ? Number(editForm.finalValue) : undefined,
        quoted_price: editForm.quotedPrice ? Number(editForm.quotedPrice) : undefined,
        admin_notes: editForm.adminNotes || undefined,
        payment_method: editForm.paymentMethod || undefined,
      })
      setAllTrades(prev => prev.map(t => t.id === editModal.id ? updated : t))
      setSelected(prev => prev?.id === editModal.id ? updated : prev)
      setEditModal(null)
    } catch { /* ignore */ }
    setUpdatingId(null)
  }

  const openEditModal = (trade: TradeInSubmission) => {
    setEditForm({
      finalValue: trade.finalValue?.toString() || '',
      quotedPrice: trade.quotedPrice?.toString() || '',
      adminNotes: trade.adminNotes || '',
      paymentMethod: trade.paymentMethod || '',
    })
    setEditModal(trade)
  }

  const statuses = useMemo(() => Array.from(new Set(allTrades.map(t => t.status))), [allTrades])

  const filtered = useMemo(() => {
    return allTrades.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return t.tradeId.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q) || t.customerMobile.includes(q) || t.deviceModel.toLowerCase().includes(q)
      }
      return true
    })
  }, [allTrades, search, statusFilter])

  const stats = useMemo(() => ({
    total: allTrades.length,
    pending: allTrades.filter(t => t.status === 'pending').length,
    accepted: allTrades.filter(t => t.status === 'accepted').length,
    paid: allTrades.filter(t => t.status === 'paid').length,
    totalPayout: allTrades.filter(t => t.status === 'paid').reduce((s, t) => s + (t.finalValue || t.estimatedValue), 0),
  }), [allTrades])

  return (
    <PageLayout title="Trade-In Management">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Submissions', value: stats.total, icon: <FiSmartphone size={18} />, color: '#CB202D', glow: 'rgba(203,32,45,0.12)' },
          { label: 'Pending Review', value: stats.pending, icon: <FiClock size={18} />, color: '#EAB308', glow: 'rgba(234,179,8,0.12)' },
          { label: 'Accepted', value: stats.accepted, icon: <FiCheckCircle size={18} />, color: '#22C55E', glow: 'rgba(34,197,94,0.12)' },
          { label: 'Paid', value: stats.paid, icon: <FiCreditCard size={18} />, color: '#3B82F6', glow: 'rgba(59,130,246,0.12)' },
          { label: 'Total Payout', value: formatCurrency(stats.totalPayout), icon: <FiDollarSign size={18} />, color: '#A81D2A', glow: 'rgba(203,32,45,0.08)' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.glow, color: s.color }}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-text-primary">{s.value}</p>
              <p className="text-xs text-text-secondary font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-4 mb-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by trade ID, customer name, mobile, or device..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface border border-border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-xl bg-surface border border-border text-sm text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              {statuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
            </select>
            <FiChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
          <button onClick={loadTrades} className="h-10 px-4 rounded-xl bg-surface border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all flex items-center gap-2">
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide">Trade ID</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide hidden md:table-cell">Device</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide">Est. Value</th>
                <th className="text-center px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide hidden lg:table-cell">Payment</th>
                <th className="text-center px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-secondary">
                    <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                    <p className="font-medium text-sm">Loading trade-ins...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-secondary">
                    <FiSmartphone size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-red-500">{error}</p>
                    <p className="text-xs mt-1">Make sure you are logged in as admin</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-secondary">
                    <FiSmartphone size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No trade-in submissions yet</p>
                    <p className="text-xs mt-1">Submissions will appear here once customers submit trade-ins</p>
                  </td>
                </tr>
              ) : filtered.map(trade => {
                const sc = STATUS_COLORS[trade.status] || STATUS_COLORS.pending
                const pc = PAYMENT_STATUS_COLORS[trade.paymentStatus] || PAYMENT_STATUS_COLORS.pending
                return (
                  <tr key={trade.id} className="border-b border-border/50 last:border-b-0 hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-text-primary text-xs">{trade.tradeId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary text-sm truncate max-w-[140px]">{trade.customerName}</p>
                      <p className="text-xs text-text-secondary truncate">{trade.customerMobile}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-text-primary">{trade.deviceBrand} {trade.deviceModel}</p>
                      <p className="text-xs text-text-secondary">{trade.deviceStorage} · {trade.deviceCondition}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-text-primary text-sm">{formatCurrency(trade.estimatedValue)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                        {STATUS_LABELS[trade.status] || trade.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: pc.bg, color: pc.text }}>
                        {trade.paymentStatus === 'completed' ? 'Paid' : trade.paymentStatus === 'failed' ? 'Failed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setSelected(trade)} className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center" title="View Details">
                          <FiEye size={15} />
                        </button>
                        <button onClick={() => openEditModal(trade)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center" title="Edit">
                          <FiEdit3 size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm(trade.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center" title="Delete">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border bg-surface/30">
          <p className="text-xs text-text-secondary font-medium">Showing {filtered.length} of {allTrades.length} trade-ins</p>
        </div>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-white z-50 shadow-2xl overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center gap-3 z-10">
                <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-xl bg-surface hover:bg-surface-hover flex items-center justify-center transition-colors">
                  <FiX size={18} className="text-text-secondary" />
                </button>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-text-primary">{selected.tradeId}</h2>
                  <p className="text-xs text-text-secondary">{selected.customerName}</p>
                </div>
                {(() => {
                  const sc = STATUS_COLORS[selected.status] || STATUS_COLORS.pending
                  return (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                      {STATUS_LABELS[selected.status] || selected.status}
                    </span>
                  )
                })()}
              </div>

              <div className="p-5 space-y-5">
                {/* Customer Info */}
                <div className="bg-surface rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Customer Details</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <FiUser size={15} className="text-text-secondary flex-shrink-0" />
                      <span className="text-sm font-medium text-text-primary">{selected.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <FiPhone size={15} className="text-text-secondary flex-shrink-0" />
                      <span className="text-sm text-text-primary">{selected.customerMobile}</span>
                    </div>
                    {selected.customerEmail && (
                      <div className="flex items-center gap-2.5">
                        <FiPhone size={15} className="text-text-secondary flex-shrink-0" />
                        <span className="text-sm text-text-primary">{selected.customerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Device Info */}
                <div className="bg-surface rounded-2xl p-4">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Device Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-border/50">
                      <p className="text-[11px] text-text-secondary mb-1">Brand</p>
                      <p className="text-sm font-semibold text-text-primary">{selected.deviceBrand}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-border/50">
                      <p className="text-[11px] text-text-secondary mb-1">Model</p>
                      <p className="text-sm font-semibold text-text-primary">{selected.deviceModel}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-border/50">
                      <p className="text-[11px] text-text-secondary mb-1">Storage</p>
                      <p className="text-sm font-semibold text-text-primary">{selected.deviceStorage || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-border/50">
                      <p className="text-[11px] text-text-secondary mb-1">Condition</p>
                      <p className="text-sm font-semibold text-text-primary">{selected.deviceCondition}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-surface rounded-2xl p-4">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Pricing</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-border/50">
                      <p className="text-[11px] text-text-secondary mb-1">Estimated Value</p>
                      <p className="text-sm font-bold text-primary">{formatCurrency(selected.estimatedValue)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-border/50">
                      <p className="text-[11px] text-text-secondary mb-1">Final / Quoted</p>
                      <p className="text-sm font-bold text-primary">
                        {selected.finalValue ? formatCurrency(selected.finalValue) : selected.quotedPrice ? formatCurrency(selected.quotedPrice) : '—'}
                      </p>
                    </div>
                  </div>
                  {selected.adminNotes && (
                    <div className="mt-3 bg-white rounded-xl p-3 border border-border/50">
                      <p className="text-[11px] text-text-secondary mb-1">Admin Notes</p>
                      <p className="text-sm text-text-primary">{selected.adminNotes}</p>
                    </div>
                  )}
                  {selected.rejectionReason && (
                    <div className="mt-3 bg-red-50 rounded-xl p-3 border border-red-200">
                      <p className="text-[11px] text-red-500 mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-700">{selected.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Status Timeline */}
                <div className="bg-surface rounded-2xl p-4">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Timeline</p>
                  <div className="space-y-2 text-xs text-text-secondary">
                    <div className="flex justify-between"><span>Submitted</span><span>{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : '—'}</span></div>
                    <div className="flex justify-between"><span>Last Updated</span><span>{selected.updatedAt ? new Date(selected.updatedAt).toLocaleDateString() : '—'}</span></div>
                  </div>
                </div>

                {/* Status Update Actions */}
                {selected.status !== 'paid' && selected.status !== 'rejected' && selected.status !== 'cancelled' && (
                  <div className="bg-surface rounded-2xl p-4">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const next = NEXT_STATUS[selected.status]
                        if (!next) return null
                        const isUpdating = updatingId === selected.id
                        return (
                          <button
                            onClick={() => handleStatusUpdate(selected, next)}
                            disabled={isUpdating}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #CB202D, #A81D2A)' }}
                          >
                            {isUpdating ? <FiRefreshCw size={14} className="animate-spin" /> : <FiCheck size={14} />}
                            Mark as {STATUS_LABELS[next]}
                          </button>
                        )
                      })()}
                      {selected.status !== 'rejected' && (
                        <button
                          onClick={() => setRejectModal(selected.id)}
                          disabled={updatingId === selected.id}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                          <FiXCircle size={14} /> Reject
                        </button>
                      )}
                      <button
                        onClick={() => { setSelected(null); openEditModal(selected) }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-border text-text-secondary hover:bg-surface-hover transition-all"
                      >
                        <FiEdit3 size={14} /> Edit Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={() => setEditModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setEditModal(null)}
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-text-primary">Edit Trade-In</h3>
                  <button onClick={() => setEditModal(null)} className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-hover flex items-center justify-center transition-colors">
                    <FiX size={16} className="text-text-secondary" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Quoted Price (₹)</label>
                    <input type="number" value={editForm.quotedPrice} onChange={e => setEditForm(p => ({ ...p, quotedPrice: e.target.value }))} className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Enter quoted price" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Final Value (₹)</label>
                    <input type="number" value={editForm.finalValue} onChange={e => setEditForm(p => ({ ...p, finalValue: e.target.value }))} className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Enter final payout value" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Payment Method</label>
                    <select value={editForm.paymentMethod} onChange={e => setEditForm(p => ({ ...p, paymentMethod: e.target.value }))} className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer">
                      <option value="">Select method</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="upi">UPI</option>
                      <option value="cash">Cash</option>
                      <option value="store_credit">Store Credit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Admin Notes</label>
                    <textarea value={editForm.adminNotes} onChange={e => setEditForm(p => ({ ...p, adminNotes: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Add notes..." />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setEditModal(null)} className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-hover transition-all">Cancel</button>
                  <button onClick={handleEditSave} disabled={updatingId === editModal.id} className="flex-1 h-10 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #CB202D, #A81D2A)' }}>
                    {updatingId === editModal.id ? <FiRefreshCw size={14} className="animate-spin mx-auto" /> : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={() => setRejectModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setRejectModal(null)}
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-text-primary mb-2">Reject Trade-In</h3>
                <p className="text-sm text-text-secondary mb-4">Please provide a reason for rejection.</p>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Enter rejection reason..." />
                <div className="flex gap-3 mt-5">
                  <button onClick={() => { setRejectModal(null); setRejectReason('') }} className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-hover transition-all">Cancel</button>
                  <button onClick={() => handleReject(rejectModal)} disabled={!rejectReason.trim() || updatingId === rejectModal} className="flex-1 h-10 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50">
                    {updatingId === rejectModal ? <FiRefreshCw size={14} className="animate-spin mx-auto" /> : 'Reject'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={() => setDeleteConfirm(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setDeleteConfirm(null)}
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <FiTrash2 size={24} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-1">Delete Trade-In?</h3>
                <p className="text-sm text-text-secondary mb-5">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-hover transition-all">Cancel</button>
                  <button onClick={() => handleDelete(deleteConfirm)} disabled={updatingId === deleteConfirm} className="flex-1 h-10 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50">
                    {updatingId === deleteConfirm ? <FiRefreshCw size={14} className="animate-spin mx-auto" /> : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageLayout>
  )
}

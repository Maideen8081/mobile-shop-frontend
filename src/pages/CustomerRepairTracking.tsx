import { useState, useEffect, useMemo, useCallback, Component } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiLoader } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../components/mobile/helpers'
import EcommerceFooter from '../components/ecommerce/Footer'
import { repairService, type RepairTicket } from '../services/repairService'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import { BRAND, C } from '../components/mobile/theme'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function formatPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#ef4444',
  Urgent: '#dc2626',
}

const PRIORITY_BG: Record<string, string> = {
  Low: 'rgba(34,197,94,0.12)',
  Medium: 'rgba(245,158,11,0.12)',
  High: 'rgba(239,68,68,0.12)',
  Urgent: 'rgba(220,38,38,0.15)',
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  Submitted: { label: 'Submitted', color: '#6366f1' },
  Accepted: { label: 'Accepted', color: '#22c55e' },
  Rejected: { label: 'Rejected', color: '#ef4444' },
  Received: { label: 'Device Received', color: '#f59e0b' },
  'Awaiting Approval': { label: 'Awaiting Approval', color: '#CB202D' },
  Diagnosing: { label: 'Under Inspection', color: '#3b82f6' },
  'Waiting for Parts': { label: 'Waiting for Parts', color: '#f97316' },
  'Repair In Progress': { label: 'Repair Started', color: '#8b5cf6' },
  'Quality Check': { label: 'Quality Check', color: '#06b6d4' },
  'Ready for Delivery': { label: 'Ready for Pickup', color: '#22c55e' },
  Delivered: { label: 'Delivered', color: '#CB202D' },
  Cancelled: { label: 'Cancelled', color: '#6b7280' },
}

const FILTER_OPTIONS = ['All', 'Pending', 'In Progress', 'Completed', 'Rejected'] as const

function getAuthEmail(): string | null {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.email || payload.user_email || null
  } catch {
    return null
  }
}

async function fetchMyRepairs(): Promise<RepairTicket[]> {
  try {
    const data = await repairService.myTickets()
    console.log('[CustomerRepairTracking] myTickets response:', data)
    if (data.length > 0) return data
  } catch (e) {
    console.error('[CustomerRepairTracking] myTickets failed:', e)
  }
  try {
    const all = await repairService.list()
    const email = getAuthEmail()
    if (!email) return []
    return all.filter(t => t.customerEmail?.toLowerCase() === email.toLowerCase())
  } catch (e) {
    console.error('[CustomerRepairTracking] list fallback failed:', e)
    return []
  }
}

const PIPELINE_STEPS = [
  { key: 'submitted', label: 'Submitted', icon: 'send' },
  { key: 'accepted', label: 'Accepted', icon: 'check_circle' },
  { key: 'received', label: 'Received', icon: 'inventory_2' },
  { key: 'awaiting_approval', label: 'Awaiting Approval', icon: 'handshake' },
  { key: 'diagnosing', label: 'Diagnosing', icon: 'search' },
  { key: 'repair', label: 'Repair In Progress', icon: 'precision_manufacturing' },
  { key: 'quality', label: 'Quality Check', icon: 'verified' },
  { key: 'ready', label: 'Ready for Delivery', icon: 'rocket_launch' },
  { key: 'delivered', label: 'Delivered', icon: 'done_all' },
] as const

const TICKET_TO_PIPELINE: Record<string, number> = {
  Submitted: 0,
  Accepted: 1,
  Received: 2,
  'Awaiting Approval': 3,
  Diagnosing: 4,
  'Waiting for Parts': 4,
  'Repair In Progress': 5,
  'Quality Check': 6,
  'Ready for Delivery': 7,
  Delivered: 8,
  Rejected: -1,
  Cancelled: -1,
}

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGES[status] || { label: status, color: '#6b7280' }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
      style={{ background: `${badge.color}12`, color: badge.color, border: `1px solid ${badge.color}20` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.color }} />
      {badge.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] || '#6b7280'
  const bg = PRIORITY_BG[priority] || 'rgba(107,114,128,0.12)'
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase"
      style={{ background: bg, color, border: `1px solid ${color}15` }}
    >
      {priority}
    </span>
  )
}

function PipelineProgress({ ticket }: { ticket: RepairTicket }) {
  const stepIdx = TICKET_TO_PIPELINE[ticket.status] ?? -1
  const isCancelled = ticket.status === 'Cancelled'

  return (
    <section className="p-6 rounded-2xl" style={{
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(229,231,235,0.8)',
    }}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {PIPELINE_STEPS.map((s, idx) => {
          const isActive = !isCancelled && idx <= stepIdx
          const isCurrent = idx === stepIdx && !isCancelled
          const isPast = idx < stepIdx && !isCancelled
          return (
            <div key={s.key} className="flex flex-col items-center text-center group cursor-default flex-1">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition-all duration-500"
                style={{
                  background: isActive ? (isPast ? 'rgba(5,150,105,0.12)' : 'rgba(203,32,45,0.12)') : 'rgba(241,245,249,0.8)',
                  border: `2px solid ${isActive ? (isPast ? '#059669' : '#A81D2A') : 'rgba(229,231,235,0.8)'}`,
                  boxShadow: isCurrent ? '0 0 0 4px rgba(203,32,45,0.08)' : 'none',
                }}
              >
                {isPast ? (
                  <span className="material-symbols-outlined text-lg" style={{ color: '#059669', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                ) : isCurrent ? (
                  <div className="relative">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ background: '#CB202D' }} />
                    <div className="absolute inset-[-4px] rounded-full border-2 border-[#CB202D] animate-ping opacity-40" />
                  </div>
                ) : (
                  <span className="material-symbols-outlined text-lg" style={{ color: isCancelled && idx === 0 ? BRAND.muted : isActive ? BRAND.primaryDark : 'rgba(148,163,184,0.5)' }}>{s.icon}</span>
                )}
              </div>
              <span className="text-[10px] font-bold text-center leading-tight" style={{
                color: isActive ? BRAND.ink : isCancelled ? 'rgba(148,163,184,0.5)' : 'rgba(148,163,184,0.6)',
              }}>{s.label}</span>
              <span className="text-[9px] mt-0.5 font-medium" style={{
                color: isPast ? '#059669' : isCurrent ? BRAND.primary : isCancelled ? 'rgba(148,163,184,0.4)' : 'rgba(148,163,184,0.5)',
              }}>
                {isPast ? 'Done' : isCurrent ? 'Current' : isCancelled ? 'Cancelled' : 'Pending'}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function RepairCard({ ticket, onSelect }: { ticket: RepairTicket; onSelect: (t: RepairTicket) => void }) {
  const stepIdx = TICKET_TO_PIPELINE[ticket.status] ?? -1
  const isDelivered = ticket.status === 'Delivered'
  const progressPct = isDelivered ? 100 : stepIdx >= 0 ? Math.round((stepIdx / (PIPELINE_STEPS.length - 1)) * 100) : 0
  const navigate = useNavigate()

  return (
    <>
      {/* Mobile card */}
      <motion.div
        onClick={() => onSelect(ticket)}
        whileTap={{ scale: 0.97 }}
        className="md:hidden flex gap-3 p-3 rounded-2xl cursor-pointer active:scale-[0.97] transition-all"
        style={{
          background: '#ffffff',
          border: `1px solid ${BRAND.line}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}
      >
        <div className="relative w-[80px] h-[80px] rounded-xl overflow-hidden shrink-0 self-center" style={{ background: '#FFFBFB', border: `1px solid ${BRAND.line}` }}>
          {ticket.images && ticket.images.length > 0 ? (
            <img
              src={ticket.images[0].startsWith('http') ? ticket.images[0] : `${API_BASE_URL}/${ticket.images[0].replace(/^\//, '')}`}
              alt={ticket.deviceModel}
              className="w-full h-full object-contain p-1.5"
              loading="lazy"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '📱' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">📱</div>
          )}
          <span className="absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: isDelivered ? '#059669' : BRAND.primary }}>{isDelivered ? 'Done' : 'Active'}</span>
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h3 className="text-[13px] font-bold leading-snug truncate" style={{ color: BRAND.ink }}>{ticket.deviceBrand} {ticket.deviceModel}</h3>
              <p className="text-[10px] font-semibold" style={{ color: BRAND.primaryDark }}>{ticket.repairId}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(203,32,45,0.08)', color: BRAND.primary }}>{ticket.issueCategory}</span>
            <PriorityBadge priority={ticket.priority} />
            {ticket.estimatedCost > 0 && (
              <span className="text-[11px] font-extrabold" style={{ color: BRAND.primary }}>{formatPrice(ticket.estimatedCost)}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={ticket.status} />
            <span className="text-[9px]" style={{ color: BRAND.muted }}>{formatDate(ticket.createdAt)}</span>
          </div>
          <div className="mt-1 w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(237,238,239,0.8)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #CB202D, #A81D2A)',
            }} />
          </div>
        </div>
      </motion.div>

      {/* Desktop card */}
      <div
        onClick={() => navigate(`/my-repairs/${ticket.id}`)}
        className={`hidden md:grid ticket-card ${isDelivered ? 'st-completed' : progressPct <= 0 ? 'st-pending' : ticket.status === 'Rejected' || ticket.status === 'Cancelled' ? 'st-rejected' : 'st-progress'}`}
      >
        <div className="device-thumb">
          {ticket.images && ticket.images.length > 0 ? (
            <img
              src={ticket.images[0].startsWith('http') ? ticket.images[0] : `${API_BASE_URL}/${ticket.images[0].replace(/^\//, '')}`}
              alt={ticket.deviceModel}
              className="w-full h-full object-contain p-3"
              style={{ opacity: 0.85 }}
              loading="lazy"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="width:40px;height:40px;color:var(--red-dark);opacity:.85"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 5.2h4" stroke-linecap="round"/></svg>' }}
            />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 40, height: 40, color: '#9C0F22', opacity: 0.85 }}><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M10 5.2h4" strokeLinecap="round" /></svg>
          )}
          <span className={`state-tag ${isDelivered ? 'completed' : ticket.status === 'Rejected' || ticket.status === 'Cancelled' ? 'rejected' : progressPct <= 0 ? 'pending' : 'active'}`}>
            <span className="d" />
            {isDelivered ? 'Delivered' : ticket.status === 'Rejected' ? 'Rejected' : ticket.status === 'Cancelled' ? 'Cancelled' : progressPct <= 0 ? 'Queued' : 'Active'}
          </span>
        </div>

        <div className="ticket-mid">
          <div className="ticket-topline">
            <span className="ticket-id-label">Ticket</span>
            <span className="ticket-id mono">{ticket.repairId}</span>
          </div>
          <h3 className="device-name">{ticket.deviceBrand} {ticket.deviceModel}</h3>
          <div className="ticket-date">Logged {formatDate(ticket.createdAt)}</div>
          <div className="vitals-label"><span>Hardware Integrity Protocol</span></div>
          <div className="vitals-track">
            <div className="vitals-fill" style={{ width: `${progressPct}%` }} />
            <span className="vitals-pct">{progressPct >= 100 ? '100%' : stepIdx < 0 ? (ticket.status === 'Rejected' || ticket.status === 'Cancelled' ? 'Halted' : 'Awaiting') : `${progressPct}%`}</span>
          </div>
          <div className="tag-row">
            <span className="tag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /></svg>
              {ticket.issueCategory}
            </span>
            <span className={`tag priority-${ticket.priority === 'Urgent' ? 'critical' : ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
            <span className="tag price">{ticket.estimatedCost > 0 ? formatPrice(ticket.estimatedCost) : 'Quote pending'}</span>
          </div>
        </div>

        <div className="ticket-right">
          <span className={`status-pill ${isDelivered ? 'completed' : ticket.status === 'Rejected' || ticket.status === 'Cancelled' ? 'rejected' : progressPct <= 0 ? 'pending' : 'progress'}`}>
            <span className="d" />
            {STATUS_BADGES[ticket.status]?.label || ticket.status}
          </span>
          <span className="chevron">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M9 6l6 6-6 6" /></svg>
          </span>
        </div>
      </div>
    </>
  )
}

function ImageGallery({ images }: { images: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const resolvedImages = useMemo(() => {
    return images.map(img => {
      if (img.startsWith('http') || img.startsWith('data:')) return img
      return `${API_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`
    })
  }, [images])

  if (selectedIndex !== null) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
        onClick={() => setSelectedIndex(null)}
      >
        <button onClick={() => setSelectedIndex(null)} className="absolute top-6 right-6 text-white/80 hover:text-white z-10 cursor-pointer">
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>
        {resolvedImages.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setSelectedIndex(i => i === null ? 0 : Math.max(0, i - 1)) }}
              className="absolute left-6 text-white/80 hover:text-white cursor-pointer z-10">
              <span className="material-symbols-outlined text-4xl">chevron_left</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setSelectedIndex(i => i === null ? 0 : Math.min(resolvedImages.length - 1, i + 1)) }}
              className="absolute right-6 text-white/80 hover:text-white cursor-pointer z-10">
              <span className="material-symbols-outlined text-4xl">chevron_right</span>
            </button>
          </>
        )}
        <motion.img key={selectedIndex} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          src={resolvedImages[selectedIndex]} alt={`Photo ${selectedIndex + 1}`}
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
        <div className="absolute bottom-6 text-white/60 text-sm">{selectedIndex + 1} / {resolvedImages.length}</div>
      </motion.div>
    )
  }

  if (resolvedImages.length === 0) {
    return (
      <div className="flex items-center justify-center h-28 rounded-xl" style={{ background: 'rgba(237,238,239,0.5)', border: '1px dashed rgba(185,203,185,0.3)' }}>
        <p className="text-xs" style={{ color: 'rgba(59,75,61,0.5)' }}>No photos available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {resolvedImages.slice(0, 6).map((url, idx) => (
        <motion.button key={idx} whileHover={{ scale: 1.03 }}
          onClick={() => setSelectedIndex(idx)}
          className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative"
          style={{ background: 'rgba(241,245,249,0.5)', border: '1px solid rgba(229,231,235,0.5)' }}>
          <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          {idx === 5 && resolvedImages.length > 6 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-base">+{resolvedImages.length - 5}</span>
            </div>
          )}
        </motion.button>
      ))}
    </div>
  )
}

function RepairDetailModal({
  ticket: initialTicket,
  onClose,
  onApprove,
  onNotify,
}: {
  ticket: RepairTicket
  onClose: () => void
  onApprove: (approved: boolean) => void
  onNotify: (msg: string, type: 'success' | 'error') => void
}) {
  const [ticket, setTicket] = useState(initialTicket)
  const [message, setMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [courierName, setCourierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courierDate, setCourierDate] = useState('')
  const [courierNotes, setCourierNotes] = useState('')
  const [submittingCourier, setSubmittingCourier] = useState(false)
  const [showFullDetail, setShowFullDetail] = useState(false)
  const [approving, setApproving] = useState(false)
  const navigate = useNavigate()
  const needsApproval = ticket.status === 'Awaiting Approval'
  const canSendCourier = ticket.status === 'Accepted' && !ticket.courier
  const courierSent = ticket.status === 'Accepted' && ticket.courier

  const sendMessage = async () => {
    const text = message.trim()
    if (!text) return
    setSendingMsg(true)
    try {
      await repairService.createNote(ticket.id, text, ticket.customerName || 'Customer', false)
      setMessage('')
      const updated = await repairService.getById(ticket.id)
      setTicket(updated)
    } catch { /* ignore */ }
    setSendingMsg(false)
  }

  const handleSendCourier = async () => {
    if (!courierName.trim() || !trackingNumber.trim()) {
      onNotify('Please fill courier name and tracking number', 'error')
      return
    }
    setSubmittingCourier(true)
    try {
      await repairService.submitCourier(ticket.id, {
        courier_name: courierName.trim(),
        tracking_number: trackingNumber.trim(),
        courier_date: courierDate || new Date().toISOString().split('T')[0],
        courier_notes: courierNotes.trim(),
      })
      await repairService.updateStatus(ticket.id, 'Received', `Courier received: ${courierName.trim()} - ${trackingNumber.trim()}`)
      const updated = await repairService.getById(ticket.id)
      setTicket(updated)
      onNotify('Courier details submitted successfully!', 'success')
    } catch {
      onNotify('Failed to submit courier details', 'error')
    }
    setSubmittingCourier(false)
  }

  const isMobileDetail = useIsMobile()

  if (isMobileDetail) {
    const stepIdx = TICKET_TO_PIPELINE[ticket.status] ?? -1
    const isCancelled = ticket.status === 'Cancelled'
    const isFailed = ticket.status === 'Rejected' || isCancelled
    if (showFullDetail) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-white overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="sticky top-0 z-10 w-full" style={{ background: 'linear-gradient(135deg,#CB202D 0%,#A81D2A 100%)' }}>
            <div className="flex items-center gap-2 px-3.5 h-12">
              <button onClick={() => setShowFullDetail(false)} aria-label="Back" className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center active:scale-90 transition flex-shrink-0">
                <span className="material-symbols-outlined text-lg text-white">arrow_back</span>
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[15px] font-bold text-white truncate">Full Details</h1>
              </div>
            </div>
          </div>

          <div className="px-3.5 mt-3 space-y-3 pb-24">
            <div className="rounded-2xl p-4" style={{ background: '#ffffff', border: `1px solid ${BRAND.line}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.muted }}>Ticket Summary</span>
                <span className="text-[10px]" style={{ color: BRAND.muted }}>{formatDate(ticket.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-[17px] font-extrabold" style={{ color: BRAND.primary }}>{ticket.repairId}</p>
                  <p className="text-[12px] font-medium" style={{ color: BRAND.ink }}>{ticket.deviceBrand} {ticket.deviceModel}</p>
                </div>
                <PriorityBadge priority={ticket.priority} />
              </div>
              {ticket.estimatedCost > 0 && (
                <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${BRAND.line}` }}>
                  <span className="text-[11px] font-semibold" style={{ color: BRAND.muted }}>Estimated Cost</span>
                  <span className="text-[15px] font-extrabold" style={{ color: BRAND.primary }}>{formatPrice(ticket.estimatedCost)}</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl p-4" style={{ background: '#ffffff', border: `1px solid ${BRAND.line}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="material-symbols-outlined text-base" style={{ color: BRAND.primary }}>person</span>
                <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: BRAND.ink }}>Customer</h3>
              </div>
              <div className="space-y-2">
                <MobileInfoRow label="Name" value={ticket.customerName} />
                <MobileInfoRow label="Mobile" value={ticket.customerMobile} />
                <MobileInfoRow label="Email" value={ticket.customerEmail} />
                <MobileInfoRow label="Address" value={ticket.customerAddress} />
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: '#ffffff', border: `1px solid ${BRAND.line}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="material-symbols-outlined text-base" style={{ color: BRAND.primary }}>devices</span>
                <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: BRAND.ink }}>Device</h3>
              </div>
              <div className="space-y-2">
                <MobileInfoRow label="Brand" value={ticket.deviceBrand} />
                <MobileInfoRow label="Model" value={ticket.deviceModel} />
                <MobileInfoRow label="Category" value={ticket.deviceCategory} />
                <MobileInfoRow label="IMEI" value={ticket.imei || '—'} />
                <MobileInfoRow label="Color" value={ticket.deviceColor} />
                <MobileInfoRow label="Warranty" value={ticket.warranty} />
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: '#ffffff', border: `1px solid ${BRAND.line}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="material-symbols-outlined text-base" style={{ color: BRAND.primary }}>build</span>
                <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: BRAND.ink }}>Issue</h3>
              </div>
              <div className="space-y-2">
                <MobileInfoRow label="Category" value={ticket.issueCategory} />
                {ticket.description && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.muted }}>Description</span>
                    <div className="mt-1 space-y-2">
                      {ticket.description.split(/\n(?=Q:)/).map((block, i) => {
                        const parts = block.split(/\nA:\s*/)
                        if (parts.length === 2) {
                          return (
                            <div key={i} className="rounded-xl p-3" style={{ background: '#F8FAFC', border: `1px solid ${BRAND.line}` }}>
                              <p className="text-[11px] font-bold" style={{ color: BRAND.primaryDark }}>{parts[0]}</p>
                              <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: BRAND.ink }}>{parts[1]}</p>
                            </div>
                          )
                        }
                        return <p key={i} className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: BRAND.ink }}>{block}</p>
                      })}
                    </div>
                  </div>
                )}
                <MobileInfoRow label="Priority" value={ticket.priority} />
                <MobileInfoRow label="Accessories" value={ticket.accessories || 'None'} />
                <MobileInfoRow label="Password" value={ticket.password || 'Not required'} />
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: '#ffffff', border: `1px solid ${BRAND.line}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="material-symbols-outlined text-base" style={{ color: BRAND.primary }}>receipt_long</span>
                <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: BRAND.ink }}>Estimation</h3>
              </div>
              <div className="space-y-2">
                <MobileInfoRow label="Estimated Cost" value={formatPrice(ticket.estimatedCost)} highlight />
                <MobileInfoRow label="Est. Completion" value={ticket.estimatedDays ? `${ticket.estimatedDays} day${ticket.estimatedDays > 1 ? 's' : ''}` : '—'} />
                <MobileInfoRow label="Technician" value={ticket.technicianId ? `Technician #${ticket.technicianId}` : 'Not assigned'} />
              </div>
            </div>

            {needsApproval && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(203,32,45,0.05)', border: '1px solid rgba(203,32,45,0.18)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="material-symbols-outlined text-base" style={{ color: BRAND.primary }}>handshake</span>
                  <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: BRAND.ink }}>Repair Estimate</h3>
                </div>
                <div className="space-y-3 p-3 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: BRAND.muted }}>Reason</p>
                    <p className="text-[13px] font-medium" style={{ color: BRAND.ink }}>{ticket.repairReason || 'No diagnosis provided'}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${BRAND.line}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.muted }}>Charge</p>
                    <p className="text-[17px] font-extrabold" style={{ color: BRAND.primary }}>{ticket.repairCharge ? formatPrice(ticket.repairCharge) : '—'}</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button onClick={async () => { setApproving(true); try { await onApprove(true) } finally { setApproving(false) } }}
                    disabled={approving}
                    className="flex-1 h-11 rounded-xl text-[12.5px] font-bold text-white active:scale-[0.97] transition disabled:opacity-50"
                    style={{ background: approving ? '#9CA3AF' : 'linear-gradient(135deg, #CB202D, #A81D2A)' }}
                  >{approving ? 'Processing...' : 'Approve'} ✅</button>
                  <button onClick={async () => { setApproving(true); try { await onApprove(false) } finally { setApproving(false) } }}
                    disabled={approving}
                    className="flex-1 h-11 rounded-xl text-[12.5px] font-semibold active:scale-[0.97] transition disabled:opacity-50"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
                  >{approving ? 'Processing...' : 'Decline'} ❌</button>
                </div>
              </div>
            )}

            {ticket.images && ticket.images.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: '#ffffff', border: `1px solid ${BRAND.line}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="material-symbols-outlined text-base" style={{ color: BRAND.primary }}>photo_camera</span>
                  <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: BRAND.ink }}>Photos</h3>
                </div>
                <ImageGallery images={ticket.images} />
              </div>
            )}

            {canSendCourier && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-lg" style={{ color: '#6366f1' }}>local_shipping</span>
                  <h3 className="text-[13px] font-bold" style={{ color: BRAND.ink }}>Send via Courier</h3>
                </div>
                <p className="text-[11px] mb-3" style={{ color: BRAND.muted }}>Your repair has been accepted. Share your courier details below.</p>
                <div className="space-y-2.5">
                  <input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="Courier name (e.g. DTDC)" className="w-full h-10 px-3.5 rounded-xl text-[12.5px] outline-none" style={{ background: '#fff', border: `1px solid ${BRAND.line}`, color: BRAND.ink }} />
                  <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking number" className="w-full h-10 px-3.5 rounded-xl text-[12.5px] outline-none" style={{ background: '#fff', border: `1px solid ${BRAND.line}`, color: BRAND.ink }} />
                  <input type="date" value={courierDate} onChange={(e) => setCourierDate(e.target.value)} className="w-full h-10 px-3.5 rounded-xl text-[12.5px] outline-none" style={{ background: '#fff', border: `1px solid ${BRAND.line}`, color: BRAND.ink }} />
                  <textarea value={courierNotes} onChange={(e) => setCourierNotes(e.target.value)} rows={2} placeholder="Additional notes..." className="w-full px-3.5 py-2.5 rounded-xl text-[12.5px] outline-none resize-none" style={{ background: '#fff', border: `1px solid ${BRAND.line}`, color: BRAND.ink }} />
                  <button onClick={handleSendCourier} disabled={submittingCourier} className="w-full h-11 rounded-xl text-[13px] font-bold text-white active:scale-[0.97] transition disabled:opacity-50" style={{ background: '#6366f1' }}>
                    {submittingCourier ? 'Submitting...' : 'Submit Courier Details'}
                  </button>
                </div>
              </div>
            )}

            {courierSent && ticket.courier && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-lg" style={{ color: '#22c55e' }}>check_circle</span>
                  <h3 className="text-[13px] font-bold" style={{ color: BRAND.ink }}>Courier Sent</h3>
                </div>
                <div className="space-y-1.5">
                  <MobileInfoRow label="Courier" value={ticket.courier.courier_name || '—'} />
                  <MobileInfoRow label="Tracking" value={ticket.courier.tracking_number || '—'} />
                  <MobileInfoRow label="Date" value={ticket.courier.courier_date ? formatDate(ticket.courier.courier_date) : '—'} />
                  {ticket.courier.courier_notes && <MobileInfoRow label="Notes" value={ticket.courier.courier_notes} />}
                </div>
              </div>
            )}

            {ticket.statusHistory && ticket.statusHistory.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: '#ffffff', border: `1px solid ${BRAND.line}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="material-symbols-outlined text-base" style={{ color: BRAND.primary }}>history</span>
                  <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: BRAND.ink }}>Status History</h3>
                </div>
                <div className="relative">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5" style={{ background: 'rgba(168,29,42,0.12)' }} />
                  <div className="space-y-0">
                    {ticket.statusHistory.map((h, idx) => {
                      const badge = STATUS_BADGES[h.status] || { label: h.status, color: '#6b7280' }
                      return (
                        <div key={h.id || idx} className="flex items-start gap-3 py-2">
                          <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${badge.color}18` }}>
                            <div className="w-2 h-2 rounded-full" style={{ background: badge.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-bold" style={{ color: badge.color }}>{badge.label}</span>
                              <span className="text-[10px]" style={{ color: BRAND.muted }}>{h.created_at ? formatDate(h.created_at) : ''}</span>
                            </div>
                            {h.notes && <p className="text-[11px] mt-0.5" style={{ color: BRAND.muted }}>{h.notes}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl p-4" style={{ background: '#ffffff', border: `1px solid ${BRAND.line}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="material-symbols-outlined text-base" style={{ color: BRAND.primary }}>chat</span>
                <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: BRAND.ink }}>Messages</h3>
              </div>
              {ticket.notes && ticket.notes.length > 0 ? (
                <div className="space-y-3 max-h-52 overflow-y-auto mb-3">
                  {ticket.notes.map((note) => (
                    <div key={note.id} className={`flex ${note.is_admin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${note.is_admin ? 'rounded-bl-sm' : 'rounded-br-sm'}`}
                        style={{ background: note.is_admin ? '#F1F5F9' : BRAND.primary, color: note.is_admin ? BRAND.ink : '#fff' }}
                      >
                        <p className="text-[10px] font-bold mb-0.5 opacity-70">{note.is_admin ? 'Admin' : 'You'}</p>
                        <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap">{note.message}</p>
                        <p className="text-[9px] mt-1 opacity-50 text-right">{note.created_at ? formatDate(note.created_at) : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-center py-3" style={{ color: BRAND.muted }}>No messages yet.</p>
              )}
              <div className="flex gap-2 items-end">
                <input value={message} onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Type a message..." className="flex-1 h-10 px-3.5 rounded-xl text-[12.5px] outline-none"
                  style={{ background: '#F8FAFC', border: `1px solid ${BRAND.line}`, color: BRAND.ink }}
                />
                <button onClick={sendMessage} disabled={sendingMsg || !message.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 active:scale-90 flex-shrink-0"
                  style={{ background: BRAND.primary }}
                >
                  {sendingMsg ? <FiLoader size={14} className="animate-spin" /> : <span className="material-symbols-outlined text-lg">send</span>}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#FFFBFB] flex flex-col font-sans"
        style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
      >
        {/* Fixed header */}
        <div className="flex-shrink-0 w-full px-4 h-14 flex items-center gap-3" style={{ background: C.grad }}>
          <button onClick={onClose} aria-label="Back" className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center active:scale-90 transition flex-shrink-0">
            <span className="material-symbols-outlined text-lg text-white">arrow_back</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white truncate">{ticket.repairId}</p>
            <p className="text-[9px] text-white/70 truncate -mt-0.5">{ticket.deviceBrand} {ticket.deviceModel}</p>
          </div>
          <span className="flex-shrink-0"><StatusBadge status={ticket.status} /></span>
        </div>

        {/* Main tracking area */}
        <div className="flex-1 flex flex-col px-4 min-h-0" style={{ paddingTop: '12px', paddingBottom: '12px' }}>

          {/* Current status hero */}
          <div className="flex-shrink-0 rounded-2xl px-4 py-3.5 mb-3" style={{ background: 'linear-gradient(135deg, rgba(203,32,45,0.08), rgba(168,29,42,0.04))', border: '1px solid rgba(203,32,45,0.15)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.primary }}>Current Status</p>
                <p className="text-[18px] font-extrabold mt-0.5" style={{ color: BRAND.ink }}>
                  {STATUS_BADGES[ticket.status]?.label || ticket.status}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: BRAND.primarySoft }}>
                <span className="material-symbols-outlined text-2xl" style={{ color: BRAND.primary, fontVariationSettings: "'FILL' 1" }}>
                  {stepIdx >= PIPELINE_STEPS.length - 1 ? 'check_circle' : PIPELINE_STEPS[Math.max(0, stepIdx)]?.icon || 'precision_manufacturing'}
                </span>
              </div>
            </div>
            <div className="mt-3 w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(203,32,45,0.12)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{
                width: isFailed ? '0%' : `${Math.round(((stepIdx + 1) / PIPELINE_STEPS.length) * 100)}%`,
                background: 'linear-gradient(90deg, #CB202D, #FF5A65)',
              }} />
            </div>
            <p className="text-[10px] font-semibold mt-1.5 text-right" style={{ color: BRAND.muted }}>
              {isFailed ? ticket.status : `Step ${stepIdx + 1} of ${PIPELINE_STEPS.length}`}
            </p>
          </div>

          {/* Repair Estimate — shown inline on mobile when awaiting approval */}
          {needsApproval && (
            <div className="flex-shrink-0 rounded-2xl px-4 py-3.5 mb-3" style={{ background: 'rgba(203,32,45,0.06)', border: '1.5px solid rgba(203,32,45,0.15)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg" style={{ color: '#CB202D' }}>handshake</span>
                <h3 className="text-[13px] font-bold" style={{ color: BRAND.ink }}>Repair Estimate — Awaiting Your Approval</h3>
              </div>
              <p className="text-[10px] mb-2.5" style={{ color: BRAND.muted }}>Please review the diagnosis and estimated cost below.</p>
              <div className="space-y-2 p-3 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.6)' }}>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: BRAND.muted }}>Repair Reason</p>
                  <p className="text-[12.5px] font-medium leading-snug" style={{ color: BRAND.ink }}>{ticket.repairReason || 'No diagnosis provided'}</p>
                </div>
                <div className="flex items-center justify-between pt-1.5" style={{ borderTop: `1px solid ${BRAND.line}` }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.muted }}>Estimated Charge</p>
                  <p className="text-base font-extrabold" style={{ color: '#CB202D' }}>{ticket.repairCharge ? formatPrice(ticket.repairCharge) : '—'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => { setApproving(true); try { await onApprove(true) } finally { setApproving(false) } }}
                  disabled={approving}
                  className="flex-1 h-10 rounded-xl text-[12px] font-bold text-white active:scale-[0.97] transition disabled:opacity-50"
                  style={{ background: approving ? '#9CA3AF' : 'linear-gradient(135deg, #CB202D, #A81D2A)' }}
                >{approving ? 'Processing...' : 'Approve'} ✅</button>
                <button onClick={async () => { setApproving(true); try { await onApprove(false) } finally { setApproving(false) } }}
                  disabled={approving}
                  className="flex-1 h-10 rounded-xl text-[12px] font-semibold active:scale-[0.97] transition disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
                >{approving ? 'Processing...' : 'Decline'} ❌</button>
              </div>
            </div>
          )}

          {/* Timeline steps */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="flex flex-col">
              {PIPELINE_STEPS.map((s, idx) => {
                const active = !isFailed && idx <= stepIdx
                const current = idx === stepIdx && !isFailed
                const past = idx < stepIdx && !isFailed

                return (
                  <div key={s.key} className="flex items-center gap-3 py-2.5">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-500"
                        style={{
                          background: active ? (past ? '#059669' : BRAND.primary) : '#F1F5F9',
                          boxShadow: current ? `0 0 0 3px ${BRAND.primarySoft}` : 'none',
                        }}
                      >
                        {past || (active && idx === PIPELINE_STEPS.length - 1) ? (
                          <span className="material-symbols-outlined text-xs text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check
                          </span>
                        ) : current ? (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        ) : (
                          <span className="material-symbols-outlined text-xs" style={{ color: BRAND.muted }}>
                            {s.icon}
                          </span>
                        )}
                      </div>
                      {idx < PIPELINE_STEPS.length - 1 && (
                        <div className="w-[2px] flex-1 min-h-[6px]" style={{ background: past ? '#059669' : BRAND.line }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-semibold leading-tight" style={{ color: active ? BRAND.ink : BRAND.muted }}>
                          {s.label}
                        </p>
                        <p className="text-[9px] font-medium mt-0.5" style={{ color: current ? BRAND.primary : past ? '#059669' : BRAND.muted }}>
                          {past ? 'Completed' : current ? 'In Progress' : isFailed && idx === 0 ? ticket.status : ''}
                        </p>
                      </div>
                      {current && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="px-2 py-0.5 rounded-full text-[8px] font-bold text-white" style={{ background: BRAND.primary }}>
                            NOW
                          </div>
                        </div>
                      )}
                      {past && (
                        <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: '#059669', fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex-shrink-0 flex items-center gap-2 pt-3" style={{ borderTop: '1px solid rgba(203,32,45,0.08)' }}>
            <button
              onClick={() => setShowFullDetail(true)}
              className="flex-1 h-11 rounded-xl text-[13px] font-bold text-white active:scale-[0.97] transition shadow-lg shadow-[rgba(203,32,45,0.25)]"
              style={{ background: C.grad }}
            >
              Full Details
            </button>
            <button
              onClick={() => navigate('/repairs')}
              className="flex-1 h-11 rounded-xl text-[13px] font-semibold active:scale-[0.97] transition"
              style={{ background: '#fff', border: `1px solid ${BRAND.line}`, color: BRAND.ink }}
            >
              Book New
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto pt-16 pb-16 px-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-4xl rounded-2xl overflow-hidden relative"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
        }}
      >
        <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center z-10 cursor-pointer transition-all duration-200 hover:bg-black/5" style={{ background: 'rgba(255,255,255,0.7)' }}>
          <span className="material-symbols-outlined text-base" style={{ color: BRAND.muted }}>close</span>
        </button>

        {/* Modal Header */}
        <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(229,231,235,0.5)' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: BRAND.muted }}>Ticket</span>
                <span className="text-xl font-extrabold" style={{ color: BRAND.primaryDark }}>{ticket.repairId}</span>
              </div>
              <p className="text-sm" style={{ color: BRAND.muted }}>{ticket.deviceBrand} {ticket.deviceModel} · Created {formatDate(ticket.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <PipelineProgress ticket={ticket} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5" style={{ color: BRAND.primaryDark }}>
                <span className="material-symbols-outlined text-sm">person</span>
                Customer Information
              </h3>
              <div className="space-y-2.5 p-4 rounded-xl" style={{ background: 'rgba(241,245,249,0.6)', border: '1px solid rgba(229,231,235,0.5)' }}>
                <InfoRow label="Name" value={ticket.customerName} />
                <InfoRow label="Mobile" value={ticket.customerMobile} />
                <InfoRow label="Email" value={ticket.customerEmail} />
                <InfoRow label="Address" value={ticket.customerAddress} />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5" style={{ color: BRAND.primaryDark }}>
                <span className="material-symbols-outlined text-sm">devices</span>
                Device Information
              </h3>
              <div className="space-y-2.5 p-4 rounded-xl" style={{ background: 'rgba(241,245,249,0.6)', border: '1px solid rgba(229,231,235,0.5)' }}>
                <InfoRow label="Category" value={ticket.deviceCategory} />
                <InfoRow label="Brand" value={ticket.deviceBrand} />
                <InfoRow label="Model" value={ticket.deviceModel} />
                <InfoRow label="IMEI" value={ticket.imei ? ticket.imei.replace(/(\d{4})(?=\d)/g, '$1 ') : '—'} />
                <InfoRow label="Serial No." value={ticket.serialNumber} />
                <InfoRow label="Color" value={ticket.deviceColor} />
                <InfoRow label="Warranty" value={ticket.warranty} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5" style={{ color: BRAND.primaryDark }}>
                <span className="material-symbols-outlined text-sm">build</span>
                Issue Details
              </h3>
              <div className="space-y-2.5 p-4 rounded-xl" style={{ background: 'rgba(241,245,249,0.6)', border: '1px solid rgba(229,231,235,0.5)' }}>
                <InfoRow label="Category" value={ticket.issueCategory} />
                <div>
                  <p className="text-[9px] tracking-wider font-bold uppercase mb-1" style={{ color: BRAND.muted }}>Description</p>
                  <p className="text-sm leading-relaxed" style={{ color: BRAND.ink }}>{ticket.description}</p>
                </div>
                <InfoRow label="Priority" value={ticket.priority} />
                <InfoRow label="Accessories" value={ticket.accessories || 'None'} />
                <InfoRow label="Password" value={ticket.password || 'Not required'} />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5" style={{ color: BRAND.primaryDark }}>
                <span className="material-symbols-outlined text-sm">receipt_long</span>
                Repair Estimation
              </h3>
              <div className="space-y-2.5 p-4 rounded-xl" style={{ background: 'rgba(241,245,249,0.6)', border: '1px solid rgba(229,231,235,0.5)' }}>
                <InfoRow label="Estimated Cost" value={formatPrice(ticket.estimatedCost)} highlight />
                <InfoRow label="Est. Completion" value={ticket.estimatedDays ? `${ticket.estimatedDays} day${ticket.estimatedDays > 1 ? 's' : ''}` : '—'} />
                <InfoRow label="Technician" value={ticket.technicianId ? `Technician #${ticket.technicianId}` : 'Not assigned'} />
              </div>
            </div>
          </div>

          {needsApproval && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 rounded-2xl"
              style={{ background: 'rgba(203,32,45,0.04)', border: '1.5px solid rgba(203,32,45,0.12)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(203,32,45,0.1)' }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: '#CB202D' }}>handshake</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: BRAND.ink }}>Repair Estimate — Awaiting Your Approval</h3>
                  <p className="text-[11px]" style={{ color: BRAND.muted }}>Please review the diagnosis and estimated cost below.</p>
                </div>
              </div>
              <div className="space-y-3 p-4 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(229,231,235,0.5)' }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: BRAND.muted }}>Repair Reason</p>
                  <p className="text-sm font-medium" style={{ color: BRAND.ink }}>{ticket.repairReason || 'No diagnosis provided'}</p>
                </div>
                <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(229,231,235,0.5)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.muted }}>Estimated Charge</p>
                  <p className="text-xl font-extrabold" style={{ color: '#CB202D' }}>{ticket.repairCharge ? formatPrice(ticket.repairCharge) : '—'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={async () => { setApproving(true); try { await onApprove(true) } finally { setApproving(false) } }}
                  disabled={approving}
                  className="flex-1 h-12 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer hover:shadow-lg"
                  style={{ background: approving ? '#9CA3AF' : 'linear-gradient(135deg, #CB202D, #A81D2A)', boxShadow: '0 6px 20px rgba(203,32,45,0.3)' }}
                >{approving ? 'Processing...' : 'Approve & Start Repair'}</button>
                <button onClick={async () => { setApproving(true); try { await onApprove(false) } finally { setApproving(false) } }}
                  disabled={approving}
                  className="flex-1 h-12 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}
                >{approving ? 'Processing...' : 'Decline'}</button>
              </div>
            </motion.div>
          )}

          {ticket.images && ticket.images.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[10px] font-bold tracking-wider uppercase mb-3 flex items-center gap-1.5" style={{ color: BRAND.primaryDark }}>
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                Device Photos
              </h3>
              <ImageGallery images={ticket.images} />
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-[10px] font-bold tracking-wider uppercase mb-3 flex items-center gap-1.5" style={{ color: BRAND.primaryDark }}>
              <span className="material-symbols-outlined text-sm">chat</span>
              Conversation with Admin
            </h3>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(241,245,249,0.5)', border: '1px solid rgba(229,231,235,0.5)' }}>
              {ticket.notes && ticket.notes.length > 0 ? (
                <div className="space-y-3 max-h-52 overflow-y-auto mb-4 pr-1">
                  {ticket.notes.map((note) => (
                    <div key={note.id} className={`flex ${note.is_admin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${note.is_admin ? 'rounded-bl-sm' : 'rounded-br-sm'}`}
                        style={{ background: note.is_admin ? 'rgba(255,255,255,0.9)' : 'linear-gradient(135deg, #A81D2A, #CB202D)', color: note.is_admin ? BRAND.ink : '#ffffff', border: note.is_admin ? '1px solid rgba(229,231,235,0.5)' : 'none' }}
                      >
                        <p className="text-[10px] font-bold mb-0.5 opacity-60">{note.is_admin ? 'Admin' : 'You'}</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.message}</p>
                        <p className="text-[9px] mt-1.5 opacity-40 text-right">{note.created_at ? formatDate(note.created_at) : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center py-4" style={{ color: BRAND.muted }}>No messages yet. Send a message to the admin team.</p>
              )}
              <div className="flex gap-2">
                <input value={message} onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Type your message..." className="flex-1 h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(203,32,45,0.1)]"
                  style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(229,231,235,0.5)', color: BRAND.ink }}
                />
                <button onClick={sendMessage} disabled={sendingMsg || !message.trim()}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all duration-200 disabled:opacity-40 cursor-pointer hover:shadow-lg active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #A81D2A, #CB202D)', boxShadow: '0 4px 12px rgba(203,32,45,0.25)' }}
                >
                  {sendingMsg ? <FiLoader size={14} className="animate-spin" /> : <span className="material-symbols-outlined text-lg">send</span>}
                </button>
              </div>
            </div>
          </div>

          {canSendCourier && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 rounded-2xl"
              style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: '#6366f1' }}>local_shipping</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: BRAND.ink }}>Send Device via Courier</h3>
                  <p className="text-[11px]" style={{ color: BRAND.muted }}>Your repair has been accepted. Please send the device and share courier details.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: BRAND.muted }}>Courier Name *</label>
                    <input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. DTDC, Blue Dart"
                      className="w-full h-10 px-3.5 rounded-xl text-sm outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                      style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(229,231,235,0.5)', color: BRAND.ink }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: BRAND.muted }}>Tracking Number *</label>
                    <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. DTDC123456789"
                      className="w-full h-10 px-3.5 rounded-xl text-sm outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                      style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(229,231,235,0.5)', color: BRAND.ink }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: BRAND.muted }}>Shipment Date</label>
                  <input type="date" value={courierDate} onChange={(e) => setCourierDate(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl text-sm outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                    style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(229,231,235,0.5)', color: BRAND.ink }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: BRAND.muted }}>Additional Notes</label>
                  <textarea value={courierNotes} onChange={(e) => setCourierNotes(e.target.value)} rows={2} placeholder="Any special instructions for the courier..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                    style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(229,231,235,0.5)', color: BRAND.ink }}
                  />
                </div>
                <button onClick={handleSendCourier} disabled={submittingCourier}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50 hover:shadow-lg"
                  style={{ background: '#6366f1', boxShadow: '0 6px 20px rgba(99,102,241,0.25)' }}
                >
                  {submittingCourier ? 'Submitting...' : 'Submit Courier Details'}
                </button>
              </div>
            </motion.div>
          )}

          {courierSent && ticket.courier && (
            <div className="mb-8 p-6 rounded-2xl" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: '#22c55e' }}>check_circle</span>
                </div>
                <h3 className="text-sm font-bold" style={{ color: BRAND.ink }}>Courier Sent</h3>
              </div>
              <div className="space-y-1.5 ml-[52px]">
                <InfoRow label="Courier" value={ticket.courier.courier_name || '—'} />
                <InfoRow label="Tracking" value={ticket.courier.tracking_number || '—'} />
                <InfoRow label="Date" value={ticket.courier.courier_date ? formatDate(ticket.courier.courier_date) : '—'} />
                {ticket.courier.courier_notes && <InfoRow label="Notes" value={ticket.courier.courier_notes} />}
              </div>
            </div>
          )}

          {ticket.statusHistory && ticket.statusHistory.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[10px] font-bold tracking-wider uppercase mb-3 flex items-center gap-1.5" style={{ color: BRAND.primaryDark }}>
                <span className="material-symbols-outlined text-sm">history</span>
                Status History
              </h3>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(241,245,249,0.5)', border: '1px solid rgba(229,231,235,0.5)' }}>
                <div className="relative">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5" style={{ background: 'rgba(203,32,45,0.1)' }} />
                  <div className="space-y-0">
                    {ticket.statusHistory.map((h, idx) => {
                      const badge = STATUS_BADGES[h.status] || { label: h.status, color: '#6b7280' }
                      return (
                        <div key={h.id || idx} className="flex items-start gap-3 py-2.5">
                          <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${badge.color}15` }}>
                            <div className="w-2 h-2 rounded-full" style={{ background: badge.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: badge.color }}>{badge.label}</span>
                              <span className="text-[10px]" style={{ color: BRAND.muted }}>{h.created_at ? formatDate(h.created_at) : ''}</span>
                            </div>
                            {h.notes && <p className="text-[11px] mt-0.5" style={{ color: BRAND.muted }}>{h.notes}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      <div className="lg:hidden"><EcommerceFooter compact /></div>
      </motion.div>
    </motion.div>
  )
}

function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-8">
      <div className="bg-white rounded-xl p-8 max-w-md mx-auto text-center">
        <h2 className="text-xl font-bold text-red-600 mb-4">Component Error</h2>
        <pre className="text-left text-sm text-red-600 p-4 bg-red-50 rounded overflow-auto">{error.message}</pre>
        <div className="mt-4 flex gap-3 justify-center">
          <button onClick={resetError} className="px-6 py-2 bg-[#CB202D] text-white rounded">Retry</button>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-gray-600 text-white rounded">Reload Page</button>
        </div>
</div>
    </div>
  )
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error!} resetError={() => this.setState({ hasError: false, error: null })} />
    }
    return this.props.children
  }
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-[10px] tracking-wider font-bold uppercase flex-shrink-0" style={{ color: BRAND.muted }}>{label}</span>
      <span className="text-[13px] text-right font-semibold" style={{ color: highlight ? '#059669' : BRAND.ink, fontWeight: highlight ? 700 : 600 }}>{value || '—'}</span>
    </div>
  )
}

function MobileInfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-medium flex-shrink-0" style={{ color: BRAND.muted }}>{label}</span>
      <span className="text-[12.5px] text-right font-semibold truncate max-w-[60%]" style={{ color: highlight ? '#059669' : BRAND.ink }}>{value || '—'}</span>
    </div>
  )
}

export default function CustomerRepairTracking() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [tickets, setTickets] = useState<RepairTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await fetchMyRepairs()
        setTickets(data)
      } catch (e) {
        console.error('[CustomerRepairTracking] fetchTickets error:', e)
        setTickets([])
      }
      setLoading(false)
    }
    fetchTickets()
  }, [])

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const filteredTickets = useMemo(() => {
    let result = tickets
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.repairId.toLowerCase().includes(q) ||
        t.deviceModel.toLowerCase().includes(q) ||
        t.deviceBrand.toLowerCase().includes(q) ||
        t.imei.toLowerCase().includes(q),
      )
    }
    if (statusFilter !== 'All') {
      if (statusFilter === 'Pending') result = result.filter(t => ['Submitted', 'Accepted', 'Received'].includes(t.status))
      else if (statusFilter === 'In Progress') result = result.filter(t => ['Diagnosing', 'Waiting for Parts', 'Repair In Progress', 'Quality Check', 'Ready for Delivery'].includes(t.status))
      else if (statusFilter === 'Completed') result = result.filter(t => t.status === 'Delivered')
      else if (statusFilter === 'Rejected') result = result.filter(t => ['Rejected', 'Cancelled'].includes(t.status))
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [tickets, searchQuery, statusFilter])

  const dashboardStats = useMemo(() => {
    const total = tickets.length
    const active = tickets.filter(t => !['Delivered', 'Cancelled'].includes(t.status)).length
    const completed = tickets.filter(t => t.status === 'Delivered').length
    return { total, active, completed }
  }, [tickets])

   const handleApprove = async (approved: boolean) => {
     if (!selectedTicket) return
     try {
       if (approved) {
         await repairService.customerApprove(selectedTicket.id)
         showNotification('Repair approved! Work will begin shortly.', 'success')
       } else {
         await repairService.customerDecline(selectedTicket.id)
         showNotification('Repair estimate declined. A representative will contact you.', 'error')
       }
       try {
         const detail = await repairService.getById(selectedTicket.id)
         setSelectedTicket(detail)
         const updated = await fetchMyRepairs()
         setTickets(updated.map(t => t.id === detail.id ? detail : t))
       } catch { /* refresh non-critical */ }
     } catch {
       showNotification('Failed to update. Please try again.', 'error')
     }
   }

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: '#FCFAFA' }}>
      <style>{`
        @keyframes pulse-mint {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .7; transform: scale(0.95); }
        }
        .pulse-rail {
          height: 5px; width: 100%;
          background: linear-gradient(90deg, #9C0F22, #F03049 45%, #D2172E 55%, #9C0F22);
          background-size: 220% 100%;
          animation: railmove 6s ease-in-out infinite;
          position: sticky; top: 0; z-index: 50;
        }
        @keyframes railmove {
          0%, 100% { background-position: 0% 0; }
          50% { background-position: 100% 0; }
        }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .shell { max-width: 1180px; margin: 0 auto; padding: 0 32px; }
        header.hero {
          position: relative; padding: 56px 0 40px; overflow: hidden;
          border-bottom: 1px solid #EAE5E6;
          background: radial-gradient(560px 260px at 88% -10%, #FCEDEE 0%, transparent 70%), #FFFFFF;
        }
        .hero-inner { position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; }
        .eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12.5px; font-weight: 600; letter-spacing: .11em; text-transform: uppercase;
          color: #9C0F22; margin-bottom: 14px;
        }
        .eyebrow .dot {
          width: 7px; height: 7px; border-radius: 50%; background: #D2172E;
          box-shadow: 0 0 0 4px rgba(210,23,46,0.14);
          animation: blip 1.8s ease-in-out infinite;
        }
        @keyframes blip { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
        h1.title {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 800; font-size: clamp(40px, 6vw, 68px);
          line-height: 0.94; letter-spacing: -0.01em; margin: 0; text-transform: uppercase;
        }
        h1.title em { font-style: normal; color: #D2172E; }
        .subline { margin: 14px 0 0; max-width: 460px; color: #4A4750; font-size: 15px; line-height: 1.55; }
        .stat-chip-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .stat-chip {
          background: #FFFFFF; border: 1px solid #EAE5E6; border-radius: 12px;
          padding: 12px 18px; min-width: 128px;
          box-shadow: 0 1px 2px rgba(23,21,26,0.04), 0 12px 28px -14px rgba(23,21,26,0.18);
        }
        .stat-chip .label { font-size: 10.5px; letter-spacing: .09em; text-transform: uppercase; color: #837E88; font-weight: 600; margin-bottom: 4px; }
        .stat-chip .num { font-family: 'Big Shoulders Display', sans-serif; font-size: 30px; font-weight: 800; color: #17151A; line-height: 1; }
        .stat-chip.accent .num { color: #D2172E; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 36px 0 28px; }
        .stat-card {
          background: #FFFFFF; border: 1px solid #EAE5E6; border-radius: 14px;
          padding: 22px 22px 20px;
          box-shadow: 0 1px 2px rgba(23,21,26,0.04), 0 12px 28px -14px rgba(23,21,26,0.18);
          position: relative; overflow: hidden;
        }
        .stat-card::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #D2172E; opacity: 0; transition: opacity .2s; }
        .stat-card:hover::before { opacity: 1; }
        .stat-card .top-row { display: flex; justify-content: space-between; align-items: flex-start; }
        .stat-card .icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #FCEDEE; color: #D2172E; }
        .stat-card .value { font-family: 'Big Shoulders Display', sans-serif; font-size: 38px; font-weight: 800; margin-top: 14px; line-height: 1; }
        .stat-card .caption { margin-top: 6px; font-size: 12px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: #837E88; }
        .stat-card.total .value { color: #17151A; }
        .stat-card.active .value { color: #D2172E; }
        .stat-card.completed .value { color: #1C8A4F; }
        .stat-card.rejected .value { color: #4A4750; }
        .control-panel { background: #FFFFFF; border: 1px solid #EAE5E6; border-radius: 14px; box-shadow: 0 1px 2px rgba(23,21,26,0.04), 0 12px 28px -14px rgba(23,21,26,0.18); padding: 18px 20px; margin-bottom: 28px; }
        .search-row { display: flex; align-items: center; gap: 10px; background: #FCFAFA; border: 1px solid #EAE5E6; border-radius: 10px; padding: 11px 14px; margin-bottom: 14px; }
        .search-row input { border: none; background: transparent; outline: none; font-family: 'Inter', sans-serif; font-size: 14px; width: 100%; color: #17151A; }
        .search-row input::placeholder { color: #B2ADB4; }
        .filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .filter-pill { border: 1px solid #EAE5E6; background: #FFFFFF; color: #4A4750; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 999px; cursor: pointer; transition: all .15s ease; }
        .filter-pill:hover { border-color: #D2172E; color: #D2172E; }
        .filter-pill.is-active { background: #D2172E; border-color: #D2172E; color: #fff; }
        .ticket-list { display: flex; flex-direction: column; gap: 14px; padding-bottom: 70px; }
        .ticket-card {
          display: grid; grid-template-columns: 104px 1fr auto; gap: 22px; align-items: center;
          background: #FFFFFF; border: 1px solid #EAE5E6; border-radius: 14px; padding: 18px 20px;
          box-shadow: 0 1px 2px rgba(23,21,26,0.04), 0 12px 28px -14px rgba(23,21,26,0.18);
          cursor: pointer; transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
        }
        .ticket-card:hover { transform: translateY(-2px); border-color: #EFC7CC; box-shadow: 0 4px 10px rgba(23,21,26,0.05), 0 20px 38px -18px rgba(210,23,46,0.28); }
        .device-thumb {
          width: 104px; height: 104px; border-radius: 12px;
          background: linear-gradient(155deg, #FCEDEE, #F7DEE1 70%);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden; flex-shrink: 0;
        }
        .device-thumb .state-tag {
          position: absolute; left: 8px; bottom: 8px;
          font-size: 9.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase;
          padding: 3px 8px; border-radius: 999px;
          background: rgba(23,21,26,0.72); color: #fff;
          display: flex; align-items: center; gap: 4px;
        }
        .device-thumb .state-tag .d { width: 5px; height: 5px; border-radius: 50%; background: #fff; }
        .device-thumb .state-tag.active .d { background: #FF6B7C; animation: blip 1.6s infinite; }
        .device-thumb .state-tag.completed .d { background: #6FE39A; }
        .device-thumb .state-tag.rejected .d { background: #C9C4CB; }
        .device-thumb .state-tag.pending .d { background: #FFD28A; }
        .ticket-mid { min-width: 0; }
        .ticket-topline { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; flex-wrap: wrap; }
        .ticket-id-label { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #837E88; }
        .ticket-id { font-size: 13px; font-weight: 700; color: #9C0F22; }
        .device-name { font-family: 'Big Shoulders Display', sans-serif; font-weight: 700; font-size: 22px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: .01em; }
        .ticket-date { font-size: 12.5px; color: #837E88; margin-bottom: 12px; }
        .vitals-label { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #837E88; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
        .vitals-track {
          position: relative; height: 26px; border-radius: 6px;
          background-color: #F2EEEF;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='26'><path d='M0,13 L16,13 L21,4 L27,22 L33,13 L64,13' fill='none' stroke='%23D7D2D5' stroke-width='2'/></svg>");
          background-repeat: repeat-x; background-position: left center; overflow: hidden;
        }
        .vitals-fill {
          position: absolute; inset: 0; height: 100%;
          background-color: #FCEDEE;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='26'><path d='M0,13 L16,13 L21,4 L27,22 L33,13 L64,13' fill='none' stroke='%23D2172E' stroke-width='2.4'/></svg>");
          background-repeat: repeat-x; background-position: left center; overflow: hidden;
        }
        .ticket-card.st-completed .vitals-fill { background-color: #E5F4EB; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='26'><path d='M0,13 L16,13 L21,4 L27,22 L33,13 L64,13' fill='none' stroke='%231C8A4F' stroke-width='2.4'/></svg>"); }
        .ticket-card.st-rejected .vitals-fill { background-color: #EFEDEE; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='26'><path d='M0,13 L16,13 L21,4 L27,22 L33,13 L64,13' fill='none' stroke='%23837E88' stroke-width='2.4'/></svg>"); }
        .vitals-pct { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 600; color: #4A4750; }
        .tag-row { display: flex; gap: 8px; align-items: center; margin-top: 12px; flex-wrap: wrap; }
        .tag { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 600; padding: 5px 10px; border-radius: 8px; border: 1px solid #EAE5E6; color: #4A4750; }
        .tag.priority-low { color: #4B8A63; border-color: #CFE8D8; background: #F3FAF5; }
        .tag.priority-medium { color: #B87A12; border-color: #F1DCB2; background: #FCF6E9; }
        .tag.priority-high { color: #9C0F22; border-color: #F2C6CC; background: #FCEDEE; }
        .tag.priority-critical { color: #fff; background: #D2172E; border-color: #D2172E; }
        .tag.price { font-family: 'JetBrains Mono', monospace; color: #17151A; }
        .ticket-right { display: flex; align-items: center; gap: 18px; flex-direction: column; align-self: stretch; justify-content: space-between; padding: 2px 0; }
        .status-pill { font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; padding: 6px 13px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
        .status-pill .d { width: 6px; height: 6px; border-radius: 50%; }
        .status-pill.pending { background: #FDF3E3; color: #B87A12; }
        .status-pill.pending .d { background: #B87A12; }
        .status-pill.progress { background: #FCEDEE; color: #9C0F22; }
        .status-pill.progress .d { background: #D2172E; animation: blip 1.6s infinite; }
        .status-pill.completed { background: #E5F4EB; color: #1C8A4F; }
        .status-pill.completed .d { background: #1C8A4F; }
        .status-pill.rejected { background: #EFEDEE; color: #4A4750; }
        .status-pill.rejected .d { background: #837E88; }
        .chevron { width: 38px; height: 38px; border-radius: 50%; border: 1px solid #EAE5E6; display: flex; align-items: center; justify-content: center; color: #9C0F22; transition: background .15s, transform .15s, border-color .15s; }
        .ticket-card:hover .chevron { background: #D2172E; border-color: #D2172E; color: #fff; transform: translateX(3px); }
        .empty-state { text-align: center; padding: 70px 20px; color: #837E88; }
        .empty-state h3 { font-family: 'Big Shoulders Display', sans-serif; font-size: 22px; color: #17151A; margin: 0 0 6px; text-transform: uppercase; }
        .empty-state p { font-size: 13.5px; margin: 0; }
        footer { border-top: 1px solid #EAE5E6; padding: 22px 0 40px; text-align: center; color: #837E88; font-size: 12px; }
        footer .mono { color: #9C0F22; }
        @media (max-width: 880px) {
          .shell { padding: 0 18px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .hero-inner { flex-direction: column; align-items: flex-start; }
          .ticket-card { grid-template-columns: 76px 1fr; }
          .device-thumb { width: 76px; height: 76px; }
          .device-name { font-size: 18px; }
          .ticket-right { grid-column: 1 / -1; flex-direction: row; justify-content: space-between; padding-top: 10px; border-top: 1px dashed #EAE5E6; margin-top: 10px; }
        }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
        :focus-visible { outline: 2px solid #D2172E; outline-offset: 2px; }
      `}</style>

      {/* SiteTopNav for desktop */}
      <div className="hidden lg:block">
        <SiteTopNav />
      </div>

      {/* Mobile header */}
      <div className="lg:hidden relative z-30 w-full">
        <header className="relative w-full px-4 pt-3 pb-5 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg,#CB202D 0%,#A81D2A 100%)', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} aria-label="Back" className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center active:scale-90 transition flex-shrink-0">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[17px] font-bold leading-tight truncate">My Repairs</h1>
              <p className="text-[11px] text-white/80 mt-0.5 truncate">{loading ? '' : `${dashboardStats.active} active`}</p>
            </div>
          </div>
        </header>
      </div>

      <main className="w-full px-4 sm:px-6 md:px-8 py-4 pb-16 sm:py-6 sm:pb-20 lg:py-0 lg:pb-0" style={isMobile ? { paddingTop: '0.75rem' } : {}}>
        <div className="max-w-[1180px] mx-auto" style={isMobile ? {} : { padding: '0 32px' }}>

          {/* ========== DESKTOP UI (lg+) ========== */}
          {!isMobile && (
            <>
              {/* Pulse Rail */}
              <div className="pulse-rail" aria-hidden="true" />

              {/* Hero */}
              <header className="hero">
                <div className="shell hero-inner">
                  <div>
                    <div className="eyebrow">
                      <span className="dot" />
                      {loading ? 'Loading...' : `${dashboardStats.active} Active Repairs`} · Live Manifest
                    </div>
                    <h1 className="title">
                      Diagnostics<br /><em>Protocol</em> Manifest
                    </h1>
                    <p className="subline">
                      Every device on the bench, tracked like a vital sign — intake to delivery, one pulse line at a time.
                    </p>
                  </div>
                  <div className="stat-chip-row">
                    <div className="stat-chip">
                      <div className="label">Total Tickets</div>
                      <div className="num">{String(dashboardStats.total).padStart(2, '0')}</div>
                    </div>
                    <div className="stat-chip accent">
                      <div className="label">Completed</div>
                      <div className="num">{String(dashboardStats.completed).padStart(2, '0')}</div>
                    </div>
                  </div>
                </div>
              </header>

              <main className="shell">
                {/* Stats Grid */}
                <section className="stats-grid" aria-label="Repair summary">
                  {[
                    { label: 'Total Repairs', value: dashboardStats.total, cls: 'total', svg: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v16M4 9h16"/></> },
                    { label: 'Active', value: dashboardStats.active, cls: 'active', svg: <><path d="M2 12h5l2-7 4 14 2-7h7"/></> },
                    { label: 'Completed', value: dashboardStats.completed, cls: 'completed', svg: <><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></> },
                    { label: 'Rejected', value: tickets.filter(t => ['Rejected', 'Cancelled'].includes(t.status)).length, cls: 'rejected', svg: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5l5 5m0-5l-5 5"/></> },
                  ].map((s) => (
                    <div key={s.label} className={`stat-card ${s.cls}`}>
                      <div className="top-row">
                        <div className="icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 19, height: 19 }}>{s.svg}</svg>
                        </div>
                      </div>
                      <div className="value">{s.value}</div>
                      <div className="caption">{s.label}</div>
                    </div>
                  ))}
                </section>

                {/* Control Panel */}
                <section className="control-panel" aria-label="Search and filter">
                  <div className="search-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 17, height: 17, color: '#837E88', flexShrink: 0 }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                    <input
                      id="searchInput"
                      type="text"
                      placeholder="Search by ticket ID, device, or IMEI…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="filter-row" id="filterRow">
                    {(['all', 'pending', 'progress', 'completed', 'rejected'] as const).map(f => {
                      const label = f === 'all' ? 'All' : f === 'pending' ? 'Pending' : f === 'progress' ? 'In Progress' : f === 'completed' ? 'Completed' : 'Rejected'
                      const isActive = (f === 'all' && statusFilter === 'All') ||
                        (f === 'pending' && statusFilter === 'Pending') ||
                        (f === 'progress' && statusFilter === 'In Progress') ||
                        (f === 'completed' && statusFilter === 'Completed') ||
                        (f === 'rejected' && statusFilter === 'Rejected')
                      return (
                        <button
                          key={f}
                          className={`filter-pill${isActive ? ' is-active' : ''}`}
                          data-filter={f}
                          onClick={() => {
                            const map: Record<string, string> = { all: 'All', pending: 'Pending', progress: 'In Progress', completed: 'Completed', rejected: 'Rejected' }
                            setStatusFilter(map[f])
                          }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </section>

                {/* Ticket List */}
                {loading ? (
                  <section className="ticket-list" aria-label="Repair tickets">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="ticket-card" style={{ animation: 'none', cursor: 'default' }}>
                        <div className="device-thumb" style={{ background: '#F2EEEF' }} />
                        <div className="ticket-mid">
                          <div className="h-3 w-24 rounded" style={{ background: '#EAE5E6', marginBottom: 8 }} />
                          <div className="h-5 w-40 rounded" style={{ background: '#EAE5E6', marginBottom: 8 }} />
                          <div className="h-3 w-32 rounded" style={{ background: '#EAE5E6', marginBottom: 12 }} />
                          <div className="vitals-track"><div className="vitals-fill" style={{ width: '30%' }} /></div>
                        </div>
                        <div className="ticket-right">
                          <div className="h-6 w-24 rounded-full" style={{ background: '#EAE5E6' }} />
                          <div className="chevron" style={{ borderColor: '#EAE5E6' }} />
                        </div>
                      </div>
                    ))}
                  </section>
                ) : filteredTickets.length === 0 ? (
                  <>
                    <section className="ticket-list" aria-label="Repair tickets" style={{ display: 'none' }} />
                    <div className="empty-state show">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 40, height: 40, color: '#D2172E', marginBottom: 12 }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                      <h3>No matching tickets</h3>
                      <p>Try a different ticket ID, device name, or filter.</p>
                    </div>
                  </>
                ) : (
                  <section className="ticket-list" aria-label="Repair tickets">
                    {filteredTickets.map((ticket) => (
                      <RepairCard key={ticket.id} ticket={ticket} onSelect={setSelectedTicket} />
                    ))}
                  </section>
                )}

                <footer>
                  <span className="mono">MANIFEST//</span> updated automatically as repairs move through the bench.
                </footer>
              </main>
            </>
          )}

          {/* ========== MOBILE UI (below lg) ========== */}
          {isMobile && (
            <>
              {/* Mobile header */}
              <header className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-1.5 w-1.5 rounded-full" style={{ background: BRAND.primary }} />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.primaryDark }}>
                    {loading ? 'Loading...' : `${dashboardStats.active} Active Repairs`}
                  </span>
                </div>
                <h1 className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif', color: BRAND.ink }}>
                  My Repairs
                </h1>
              </header>

              {/* Stats Cards - Mobile */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-6">
                {[
                  { label: 'Total Repairs', value: dashboardStats.total, icon: 'inventory_2', color: BRAND.primary },
                  { label: 'Active', value: dashboardStats.active, icon: 'precision_manufacturing', color: '#0EA5E9' },
                  { label: 'Completed', value: dashboardStats.completed, icon: 'check_circle', color: '#059669' },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`${C.card} p-3 sm:p-3.5 cursor-default`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="material-symbols-outlined text-base sm:text-lg" style={{ color: s.color }}>{s.icon}</span>
                      <motion.span initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                        className="text-lg sm:text-xl font-extrabold" style={{ color: s.color }}>{s.value}</motion.span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase truncate" style={{ color: BRAND.muted }}>{s.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Search & Filter - Mobile */}
              <div className="mb-5">
                <div className={`${C.card} p-3 sm:p-3.5`}>
                  <div className="flex flex-col sm:flex-row gap-3 mb-3">
                    <div className="flex-1 relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base" style={{ color: BRAND.muted }}>search</span>
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by Ticket ID, Device, or IMEI..."
                        className="w-full pl-9 pr-3 h-10 rounded-xl text-sm font-medium outline-none transition-all"
                        style={{
                          background: 'rgba(237,238,239,0.6)',
                          border: `1.5px solid ${BRAND.line}`,
                          color: BRAND.ink,
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = BRAND.primary}
                        onBlur={e => e.currentTarget.style.borderColor = BRAND.line}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FILTER_OPTIONS.map(opt => (
                      <button key={opt} onClick={() => setStatusFilter(opt)}
                        className="px-3.5 h-8 rounded-xl text-[10px] sm:text-[11px] font-bold tracking-wider transition-all active:scale-95 cursor-pointer"
                        style={{
                          background: statusFilter === opt ? BRAND.primary : 'rgba(237,238,239,0.6)',
                          color: statusFilter === opt ? '#fff' : BRAND.muted,
                        }}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
                      <div className="flex gap-5">
                        <div className="w-20 h-20 rounded-xl" style={{ background: '#F2EEEF' }} />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 w-32 rounded-lg" style={{ background: '#EAE5E6' }} />
                          <div className="h-3.5 w-48 rounded-lg" style={{ background: '#EAE5E6' }} />
                          <div className="h-2 w-full rounded-full" style={{ background: '#EAE5E6' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="rounded-2xl p-8" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6"
                      style={{ background: '#FCEDEE', border: '1px solid #F0DEE0' }}
                    >
                      <span className="material-symbols-outlined text-5xl" style={{ color: '#9C0F22' }}>build</span>
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-2xl font-bold mb-2" style={{ color: '#17151A' }}
                    >
                      No Repair Requests Found
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="text-sm mb-8 max-w-sm"
                      style={{ color: '#837E88' }}
                    >
                      You currently don't have any repair tickets. If you need a repair, please visit our store or contact support.
                    </motion.p>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      onClick={() => navigate('/repairs')}
                      className="px-8 h-12 rounded-xl text-sm font-bold text-white cursor-pointer transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #D2172E, #9C0F22)', boxShadow: '0 6px 20px rgba(210,23,46,0.3)' }}
                    >
                      Book a Repair
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredTickets.map((ticket, idx) => (
                    <motion.div key={ticket.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04, duration: 0.4 }}>
                      <RepairCard ticket={ticket} onSelect={setSelectedTicket} />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      <AnimatePresence>
        {selectedTicket && (
          <RepairDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onApprove={handleApprove} onNotify={showNotification} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[150] px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5"
            style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(229,231,235,0.5)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
          >
            <span className="material-symbols-outlined text-base" style={{ color: notification.type === 'success' ? '#059669' : '#EF4444' }}>{notification.type === 'success' ? 'check_circle' : 'error'}</span>
            <span className="text-sm font-bold" style={{ color: BRAND.ink }}>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden lg:block"><EcommerceFooter compact /></div>
      </div>

      {/* Mobile sticky bottom bar — hidden on desktop */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${BRAND.line}` }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/repairs')}
            className={C.primaryBtn + ' flex-1 h-12 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2'}
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Book a Repair
          </button>
        </div>
      </motion.div>
    </ErrorBoundary>
  )
}

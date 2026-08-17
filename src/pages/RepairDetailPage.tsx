import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiLoader, FiArrowLeft } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import { repairService, type RepairTicket } from '../services/repairService'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function formatPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
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
  Submitted: 0, Accepted: 1, Received: 2, 'Awaiting Approval': 3,
  Diagnosing: 4, 'Waiting for Parts': 4, 'Repair In Progress': 5,
  'Quality Check': 6, 'Ready for Delivery': 7, Delivered: 8,
  Rejected: -1, Cancelled: -1,
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  Submitted: { label: 'Submitted', color: '#6366f1' },
  Accepted: { label: 'Accepted', color: '#22c55e' },
  Rejected: { label: 'Rejected', color: '#ef4444' },
  Received: { label: 'Device Received', color: '#f59e0b' },
  'Awaiting Approval': { label: 'Awaiting Approval', color: '#D91E36' },
  Diagnosing: { label: 'Under Inspection', color: '#3b82f6' },
  'Waiting for Parts': { label: 'Waiting for Parts', color: '#f97316' },
  'Repair In Progress': { label: 'Repair Started', color: '#8b5cf6' },
  'Quality Check': { label: 'Quality Check', color: '#06b6d4' },
  'Ready for Delivery': { label: 'Ready for Pickup', color: '#22c55e' },
  Delivered: { label: 'Delivered', color: '#D91E36' },
  Cancelled: { label: 'Cancelled', color: '#6b7280' },
}

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGES[status] || { label: status, color: '#6b7280' }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase"
      style={{ background: `${badge.color}12`, color: badge.color, border: `1px solid ${badge.color}20` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.color }} />
      {badge.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, { c: string; b: string }> = {
    Low: { c: '#22c55e', b: 'rgba(34,197,94,0.12)' },
    Medium: { c: '#f59e0b', b: 'rgba(245,158,11,0.12)' },
    High: { c: '#ef4444', b: 'rgba(239,68,68,0.12)' },
    Urgent: { c: '#dc2626', b: 'rgba(220,38,38,0.15)' },
  }
  const s = colors[priority] || { c: '#6b7280', b: 'rgba(107,114,128,0.12)' }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase"
      style={{ background: s.b, color: s.c, border: `1px solid ${s.c}15` }}>
      {priority}
    </span>
  )
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-3 py-1.5" style={{ borderBottom: '1px solid rgba(236,228,224,0.4)' }}>
      <span className="text-[11px] tracking-wider font-bold uppercase flex-shrink-0" style={{ color: '#857D79' }}>{label}</span>
      <span className="text-[13px] text-right font-semibold" style={{ color: highlight ? '#059669' : '#1B1210', fontWeight: highlight ? 700 : 600 }}>{value || '—'}</span>
    </div>
  )
}

function ImageGallery({ images }: { images: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const resolvedImages = useMemo(() => images.map(img => {
    if (img.startsWith('http') || img.startsWith('data:')) return img
    return `${API_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`
  }), [images])

  if (selectedIndex !== null) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center" onClick={() => setSelectedIndex(null)}>
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
      <div className="flex items-center justify-center h-28 rounded-xl" style={{ background: '#F5F0EC', border: '1px dashed #ECE4E0' }}>
        <p className="text-xs" style={{ color: '#857D79' }}>No photos available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {resolvedImages.slice(0, 6).map((url, idx) => (
        <motion.button key={idx} whileHover={{ scale: 1.03 }}
          onClick={() => setSelectedIndex(idx)}
          className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative"
          style={{ background: '#F5F0EC', border: '1px solid #ECE4E0' }}>
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

export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<RepairTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [message, setMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [courierName, setCourierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courierDate, setCourierDate] = useState('')
  const [courierNotes, setCourierNotes] = useState('')
  const [submittingCourier, setSubmittingCourier] = useState(false)
  const [approving, setApproving] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const data = await repairService.getById(Number(id))
        setTicket(data)
      } catch {
        setError(true)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const sendMessage = async () => {
    if (!ticket || !message.trim()) return
    setSendingMsg(true)
    try {
      await repairService.createNote(ticket.id, message.trim(), ticket.customerName || 'Customer', false)
      setMessage('')
      const updated = await repairService.getById(ticket.id)
      setTicket(updated)
    } catch { /* ignore */ }
    setSendingMsg(false)
  }

  const handleApprove = async (approved: boolean) => {
    if (!ticket) return
    setApproving(true)
    try {
      if (approved) {
        await repairService.customerApprove(ticket.id)
        showNotification('Repair approved! Work will begin shortly.', 'success')
      } else {
        await repairService.customerDecline(ticket.id)
        showNotification('Repair estimate declined.', 'error')
      }
      const updated = await repairService.getById(ticket.id)
      setTicket(updated)
    } catch {
      showNotification('Failed to update. Please try again.', 'error')
    }
    setApproving(false)
  }

  const handleSendCourier = async () => {
    if (!ticket) return
    if (!courierName.trim() || !trackingNumber.trim()) {
      showNotification('Please fill courier name and tracking number', 'error')
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
      showNotification('Courier details submitted successfully!', 'success')
    } catch {
      showNotification('Failed to submit courier details', 'error')
    }
    setSubmittingCourier(false)
  }

  if (loading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: '#FBF8F6', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
        <div className="pulse-rail" />
        <div className="shell" style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ padding: '40px 0' }}>
            <div className="h-4 w-32 rounded" style={{ background: '#ECE4E0', marginBottom: 16 }} />
            <div className="h-8 w-64 rounded" style={{ background: '#ECE4E0', marginBottom: 24 }} />
            <div className="h-40 w-full rounded-xl" style={{ background: '#ECE4E0' }} />
          </div>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: '#FBF8F6', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
        <div className="pulse-rail" />
        <div className="shell" style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px', textAlign: 'center', paddingTop: 80 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: '#1B1210', marginBottom: 12 }}>Ticket Not Found</h2>
          <p style={{ color: '#857D79', marginBottom: 24 }}>The repair ticket you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/my-repairs')} style={{ background: 'linear-gradient(135deg, #D91E36, #A3122A)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(217,30,54,0.3)' }}>
            Back to My Repairs
          </button>
        </div>
      </div>
    )
  }

  const stepIdx = TICKET_TO_PIPELINE[ticket.status] ?? -1
  const isDelivered = ticket.status === 'Delivered'
  const progressPct = isDelivered ? 100 : stepIdx >= 0 ? Math.round((stepIdx / (PIPELINE_STEPS.length - 1)) * 100) : 0
  const needsApproval = ticket.status === 'Awaiting Approval'
  const canSendCourier = ticket.status === 'Accepted' && !ticket.courier
  const courierSent = ticket.status === 'Accepted' && ticket.courier

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#FBF8F6', minHeight: '100vh', color: '#1B1210', WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        .pulse-rail { height: 4px; width: 100%; background: linear-gradient(90deg, #A3122A, #D91E36 45%, #E8304A 55%, #A3122A); background-size: 220% 100%; animation: railmove 6s ease-in-out infinite; position: sticky; top: 0; z-index: 50; }
        @keyframes railmove { 0%, 100% { background-position: 0% 0; } 50% { background-position: 100% 0; } }
        .shell { max-width: 1180px; margin: 0 auto; padding: 0 32px; }
        .detail-card { background: #FFFFFF; border: 1px solid #ECE4E0; border-radius: 20px; box-shadow: 0 8px 24px -12px rgba(27,18,16,0.08); }
        .detail-section { padding: 24px; }
        .detail-section + .detail-section { border-top: 1px solid #ECE4E0; }
        .section-title { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #A3122A; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .section-title .material-symbols-outlined { font-size: 16px; }
        .vitals-track { position: relative; height: 28px; border-radius: 6px; background-color: #F5F0EC; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='28'><path d='M0,14 L16,14 L21,4 L27,24 L33,14 L64,14' fill='none' stroke='%23ECE4E0' stroke-width='2'/></svg>"); background-repeat: repeat-x; background-position: left center; overflow: hidden; }
        .vitals-fill { position: absolute; inset: 0; height: 100%; background-color: rgba(217,30,54,0.08); background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='28'><path d='M0,14 L16,14 L21,4 L27,24 L33,14 L64,14' fill='none' stroke='%23D91E36' stroke-width='2.4'/></svg>"); background-repeat: repeat-x; background-position: left center; }
        .vitals-fill.done { background-color: #ECFDF5; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='28'><path d='M0,14 L16,14 L21,4 L27,24 L33,14 L64,14' fill='none' stroke='%23059669' stroke-width='2.4'/></svg>"); }
        .vitals-fill.rejected { background-color: #F5F0EC; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='28'><path d='M0,14 L16,14 L21,4 L27,24 L33,14 L64,14' fill='none' stroke='%23857D79' stroke-width='2.4'/></svg>"); }
        .vitals-pct { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 600; color: #4A403D; }
        footer { border-top: 1px solid #ECE4E0; padding: 22px 0 40px; text-align: center; color: #857D79; font-size: 12px; }
        footer .mono { color: #D91E36; font-weight: 600; }
        :focus-visible { outline: 2px solid #D91E36; outline-offset: 2px; }
      `}</style>

      {/* SiteTopNav for desktop */}
      <div className="hidden lg:block">
        <SiteTopNav />
      </div>

      {/* Pulse Rail */}
      <div className="pulse-rail" />

      {/* Back Navigation */}
      <div style={{ borderBottom: '1px solid #ECE4E0', background: 'rgba(251,248,246,0.8)', backdropFilter: 'blur(8px)' }}>
        <div className="shell">
          <button onClick={() => navigate('/my-repairs')}
            className="flex items-center gap-2 h-12 text-sm font-medium cursor-pointer transition-colors hover:text-[#1B1210]"
            style={{ color: '#857D79', background: 'none', border: 'none' }}>
            <FiArrowLeft size={16} />
            Back to My Repairs
          </button>
        </div>
      </div>

      {/* Page Header */}
      <header style={{ borderBottom: '1px solid #ECE4E0', background: '#FFFFFF' }}>
        <div className="shell" style={{ padding: '32px 32px 28px' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#857D79' }}>Ticket</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: '#A3122A' }}>{ticket.repairId}</span>
              </div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 'clamp(22px, 3.5vw, 32px)', margin: 0, color: '#1B1210' }}>
                {ticket.deviceBrand} {ticket.deviceModel}
              </h1>
              <p style={{ fontSize: 14, color: '#857D79', marginTop: 6 }}>
                {ticket.deviceColor} · Logged {formatDate(ticket.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </div>
      </header>

      <main className="shell" style={{ padding: '28px 32px 60px' }}>
        {/* Progress Bar */}
        <div className="detail-card" style={{ marginBottom: 24 }}>
          <div className="detail-section">
            <div className="vitals-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#857D79', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
              <span>Hardware Integrity Protocol</span>
              <span style={{ color: progressPct >= 100 ? '#059669' : '#A3122A' }}>
                {progressPct >= 100 ? '100%' : stepIdx < 0 ? (ticket.status === 'Rejected' || ticket.status === 'Cancelled' ? 'Halted' : 'Awaiting') : `${progressPct}%`}
              </span>
            </div>
            <div className={`vitals-track ${isDelivered ? '' : ticket.status === 'Rejected' || ticket.status === 'Cancelled' ? '' : ''}`}>
              <div className={`vitals-fill ${isDelivered ? 'done' : ticket.status === 'Rejected' || ticket.status === 'Cancelled' ? 'rejected' : ''}`}
                style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* Two Column Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ marginBottom: 24 }}>
          {/* Customer Info */}
          <div className="detail-card">
            <div className="detail-section">
              <h3 className="section-title">
                <span className="material-symbols-outlined">person</span>
                Customer Information
              </h3>
              <InfoRow label="Name" value={ticket.customerName} />
              <InfoRow label="Mobile" value={ticket.customerMobile} />
              <InfoRow label="Email" value={ticket.customerEmail} />
              <InfoRow label="Address" value={ticket.customerAddress} />
            </div>
          </div>
          {/* Device Info */}
          <div className="detail-card">
            <div className="detail-section">
              <h3 className="section-title">
                <span className="material-symbols-outlined">devices</span>
                Device Information
              </h3>
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

        {/* Issue + Estimation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ marginBottom: 24 }}>
          <div className="detail-card">
            <div className="detail-section">
              <h3 className="section-title">
                <span className="material-symbols-outlined">build</span>
                Issue Details
              </h3>
              <InfoRow label="Category" value={ticket.issueCategory} />
              <div style={{ padding: '12px 0' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#857D79', marginBottom: 6 }}>Description</p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: '#1B1210', whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
              </div>
              <InfoRow label="Priority" value={ticket.priority} />
              <InfoRow label="Accessories" value={ticket.accessories || 'None'} />
              <InfoRow label="Password" value={ticket.password || 'Not required'} />
            </div>
          </div>
          <div className="detail-card">
            <div className="detail-section">
              <h3 className="section-title">
                <span className="material-symbols-outlined">receipt_long</span>
                Repair Estimation
              </h3>
              <InfoRow label="Estimated Cost" value={formatPrice(ticket.estimatedCost)} highlight />
              <InfoRow label="Est. Completion" value={ticket.estimatedDays ? `${ticket.estimatedDays} day${ticket.estimatedDays > 1 ? 's' : ''}` : '—'} />
              <InfoRow label="Technician" value={ticket.technicianId ? `Technician #${ticket.technicianId}` : 'Not assigned'} />
            </div>
          </div>
        </div>

        {/* Approval Section */}
        {needsApproval && (
          <div className="detail-card" style={{ marginBottom: 24, border: '1.5px solid rgba(217,30,54,0.12)' }}>
            <div className="detail-section" style={{ background: 'rgba(217,30,54,0.03)' }}>
              <h3 className="section-title">
                <span className="material-symbols-outlined">handshake</span>
                Repair Estimate — Awaiting Your Approval
              </h3>
              <p style={{ fontSize: 13, color: '#857D79', marginBottom: 16 }}>Please review the diagnosis and estimated cost below.</p>
              <div style={{ padding: '16px', borderRadius: 12, background: '#FFFFFF', border: '1px solid #ECE4E0', marginBottom: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#857D79', marginBottom: 4 }}>Repair Reason</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#1B1210' }}>{ticket.repairReason || 'No diagnosis provided'}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #ECE4E0' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#857D79' }}>Estimated Charge</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#D91E36' }}>{ticket.repairCharge ? formatPrice(ticket.repairCharge) : '—'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleApprove(true)} disabled={approving}
                  className="flex-1 h-12 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer hover:shadow-lg"
                  style={{ background: approving ? '#9CA3AF' : 'linear-gradient(135deg, #D91E36, #A3122A)', boxShadow: '0 6px 20px rgba(217,30,54,0.3)' }}>
                  {approving ? 'Processing...' : 'Approve & Start Repair'}
                </button>
                <button onClick={() => handleApprove(false)} disabled={approving}
                  className="flex-1 h-12 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}>
                  {approving ? 'Processing...' : 'Decline'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photos */}
        {ticket.images && ticket.images.length > 0 && (
          <div className="detail-card" style={{ marginBottom: 24 }}>
            <div className="detail-section">
              <h3 className="section-title">
                <span className="material-symbols-outlined">photo_camera</span>
                Device Photos
              </h3>
              <ImageGallery images={ticket.images} />
            </div>
          </div>
        )}

        {/* Conversation */}
        <div className="detail-card" style={{ marginBottom: 24 }}>
          <div className="detail-section">
            <h3 className="section-title">
              <span className="material-symbols-outlined">chat</span>
              Conversation with Admin
            </h3>
            {ticket.notes && ticket.notes.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-1">
                {ticket.notes.map((note) => (
                    <div key={note.id} className={`flex ${note.is_admin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${note.is_admin ? 'rounded-bl-sm' : 'rounded-br-sm'}`}
                        style={{ background: note.is_admin ? '#F5F0EC' : 'linear-gradient(135deg, #A3122A, #D91E36)', color: note.is_admin ? '#1B1210' : '#ffffff' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, marginBottom: 2, opacity: 0.6 }}>{note.is_admin ? 'Admin' : 'You'}</p>
                      <p style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{note.message}</p>
                      <p style={{ fontSize: 9, marginTop: 6, opacity: 0.4, textAlign: 'right' }}>{note.created_at ? formatDate(note.created_at) : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, textAlign: 'center', padding: '16px 0', color: '#857D79' }}>No messages yet. Send a message to the admin team.</p>
            )}
            <div className="flex gap-2">
              <input value={message} onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Type your message..."
                className="flex-1 h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(217,30,54,0.1)]"
                style={{ background: '#FBF8F6', border: '1px solid #ECE4E0', color: '#1B1210' }} />
              <button onClick={sendMessage} disabled={sendingMsg || !message.trim()}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 cursor-pointer hover:shadow-lg active:scale-95"
                style={{ background: 'linear-gradient(135deg, #D91E36, #A3122A)' }}>
                {sendingMsg ? <FiLoader size={14} className="animate-spin" /> : <span className="material-symbols-outlined text-lg">send</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Courier Form */}
        {canSendCourier && (
          <div className="detail-card" style={{ marginBottom: 24, border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="detail-section" style={{ background: 'rgba(99,102,241,0.03)' }}>
              <h3 className="section-title" style={{ color: '#6366f1' }}>
                <span className="material-symbols-outlined">local_shipping</span>
                Send Device via Courier
              </h3>
              <p style={{ fontSize: 13, color: '#857D79', marginBottom: 16 }}>Your repair has been accepted. Please send the device and share courier details.</p>
              <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#857D79', marginBottom: 6 }}>Courier Name *</label>
                  <input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. DTDC, Blue Dart"
                    className="w-full h-10 px-3.5 rounded-xl text-sm outline-none" style={{ background: '#fff', border: '1px solid #ECE4E0', color: '#1B1210' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#857D79', marginBottom: 6 }}>Tracking Number *</label>
                  <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. DTDC123456789"
                    className="w-full h-10 px-3.5 rounded-xl text-sm outline-none" style={{ background: '#fff', border: '1px solid #ECE4E0', color: '#1B1210' }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#857D79', marginBottom: 6 }}>Shipment Date</label>
                <input type="date" value={courierDate} onChange={(e) => setCourierDate(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl text-sm outline-none" style={{ background: '#fff', border: '1px solid #ECE4E0', color: '#1B1210' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#857D79', marginBottom: 6 }}>Additional Notes</label>
                <textarea value={courierNotes} onChange={(e) => setCourierNotes(e.target.value)} rows={2} placeholder="Any special instructions..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: '#fff', border: '1px solid #ECE4E0', color: '#1B1210' }} />
              </div>
              <button onClick={handleSendCourier} disabled={submittingCourier}
                className="w-full h-11 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 hover:shadow-lg"
                style={{ background: '#6366f1', boxShadow: '0 6px 20px rgba(99,102,241,0.25)' }}>
                {submittingCourier ? 'Submitting...' : 'Submit Courier Details'}
              </button>
            </div>
          </div>
        )}

        {/* Courier Sent */}
        {courierSent && ticket.courier && (
          <div className="detail-card" style={{ marginBottom: 24, border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="detail-section" style={{ background: 'rgba(34,197,94,0.03)' }}>
              <h3 className="section-title" style={{ color: '#059669' }}>
                <span className="material-symbols-outlined">check_circle</span>
                Courier Sent
              </h3>
              <InfoRow label="Courier" value={ticket.courier.courier_name || '—'} />
              <InfoRow label="Tracking" value={ticket.courier.tracking_number || '—'} />
              <InfoRow label="Date" value={ticket.courier.courier_date ? formatDate(ticket.courier.courier_date) : '—'} />
              {ticket.courier.courier_notes && <InfoRow label="Notes" value={ticket.courier.courier_notes} />}
            </div>
          </div>
        )}

        {/* Status History */}
        {ticket.statusHistory && ticket.statusHistory.length > 0 && (
          <div className="detail-card">
            <div className="detail-section">
              <h3 className="section-title">
                <span className="material-symbols-outlined">history</span>
                Status History
              </h3>
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5" style={{ background: 'rgba(217,30,54,0.1)' }} />
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
                              <span className="text-[10px]" style={{ color: '#857D79' }}>{h.created_at ? formatDate(h.created_at) : ''}</span>
                          </div>
                          {h.notes && <p className="text-[11px] mt-0.5" style={{ color: '#837E88' }}>{h.notes}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer>
        <div className="shell">
          <span className="mono">MANIFEST//</span> updated automatically as repairs move through the bench.
        </div>
      </footer>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-8 left-1/2 z-[150] px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 -translate-x-1/2"
          style={{ background: '#FFFFFF', border: '1px solid #ECE4E0', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}>
          <span className="material-symbols-outlined text-base" style={{ color: notification.type === 'success' ? '#059669' : '#EF4444' }}>
            {notification.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-bold" style={{ color: '#1B1210' }}>{notification.message}</span>
        </div>
      )}
    </div>
  )
}

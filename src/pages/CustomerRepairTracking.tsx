import { useState, useEffect, useMemo, useCallback, Component } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiLoader } from 'react-icons/fi'
import StorefrontNavbar from '../components/ecommerce/StorefrontNavbar'
import BackBar from '../components/ecommerce/BackBar'
import EcommerceFooter from '../components/ecommerce/Footer'
import { repairService, type RepairTicket } from '../services/repairService'

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
    if (email) return all.filter(t => t.customerEmail?.toLowerCase() === email.toLowerCase())
    return all
  } catch (e) {
    console.error('[CustomerRepairTracking] list fallback failed:', e)
    return []
  }
}

const PIPELINE_STEPS = [
  { key: 'submitted', label: 'Submitted', icon: 'send' },
  { key: 'accepted', label: 'Accepted', icon: 'check_circle' },
  { key: 'received', label: 'Device Received', icon: 'inventory_2' },
  { key: 'repair', label: 'Repair In Progress', icon: 'precision_manufacturing' },
  { key: 'quality', label: 'Quality Check', icon: 'verified' },
  { key: 'ready', label: 'Ready for Pickup', icon: 'rocket_launch' },
] as const

const TICKET_TO_PIPELINE: Record<string, number> = {
  Submitted: 0,
  Accepted: 1,
  Received: 2,
  Diagnosing: 2,
  'Waiting for Parts': 2,
  'Repair In Progress': 3,
  'Quality Check': 4,
  'Ready for Delivery': 5,
  Delivered: 5,
  Rejected: -1,
  Cancelled: -1,
}

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGES[status] || { label: status, color: '#6b7280' }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
      style={{ background: `${badge.color}15`, color: badge.color }}
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
      style={{ background: bg, color }}
    >
      {priority}
    </span>
  )
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8"
        style={{
          background: 'linear-gradient(135deg, rgba(203,32,45,0.15), rgba(168,29,42,0.08))',
          border: '1px solid rgba(203,32,45,0.25)',
        }}
      >
        <span className="material-symbols-outlined text-5xl" style={{ color: '#A81D2A' }}>build</span>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-2xl font-bold text-[#191c1d] mb-2"
      >
        No Repair Requests Found
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="text-sm mb-8 max-w-sm"
        style={{ color: 'rgba(59,75,61,0.7)' }}
      >
        You currently don't have any repair tickets. If you need a repair, please visit our store or contact support.
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        onClick={onBrowse}
        className="px-8 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 active:scale-[0.98]"
        style={{
          background: '#A81D2A',
          boxShadow: '0 4px 15px rgba(168,29,42,0.3)',
        }}
      >
        Book a Repair
      </motion.button>
    </div>
  )
}

function PipelineProgress({ ticket }: { ticket: RepairTicket }) {
  const stepIdx = TICKET_TO_PIPELINE[ticket.status] ?? -1
  const isCancelled = ticket.status === 'Cancelled'

  return (
    <section className="p-5 rounded-xl" style={{
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(168,29,42,0.05)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
    }}>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {PIPELINE_STEPS.map((s, idx) => {
          const isActive = !isCancelled && idx <= stepIdx
          const isCurrent = idx === stepIdx && !isCancelled
          const isPast = idx < stepIdx && !isCancelled
          return (
            <div key={s.key} className="flex flex-col items-center text-center group cursor-default flex-1">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all duration-500"
                style={{
                  background: isActive ? 'rgba(203,32,45,0.2)' : 'rgba(237,238,239,0.8)',
                  border: `2px solid ${isActive ? '#A81D2A' : 'rgba(185,203,185,0.3)'}`,
                  boxShadow: isActive ? '0 0 15px rgba(203,32,45,0.2)' : 'none',
                }}
              >
                {isPast ? (
                  <span className="material-symbols-outlined text-xl" style={{ color: '#A81D2A', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                ) : isCurrent ? (
                  <div className="relative">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#CB202D' }} />
                    <div className="absolute inset-[-4px] rounded-full border-2 border-[#CB202D] animate-ping opacity-50" />
                  </div>
                ) : (
                  <span className="material-symbols-outlined text-xl" style={{ color: isCancelled && idx === 0 ? '#6b7280' : isActive ? '#A81D2A' : 'rgba(59,75,61,0.3)' }}>{s.icon}</span>
                )}
              </div>
              <span className="text-xs font-bold text-center" style={{
                color: isActive ? '#191c1d' : isCancelled ? 'rgba(107,114,128,0.5)' : 'rgba(59,75,61,0.4)',
              }}>{s.label}</span>
              <span className="text-[10px] mt-0.5" style={{
                color: isPast ? '#A81D2A' : isCurrent ? '#A81D2A' : isCancelled ? 'rgba(107,114,128,0.4)' : 'rgba(185,203,185,0.6)',
              }}>
                {isPast ? 'Completed' : isCurrent ? 'In Progress' : isCancelled ? 'Cancelled' : 'Queue'}
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

  return (
    <div
      onClick={() => onSelect(ticket)}
      className="p-5 rounded-xl flex flex-col md:flex-row gap-5 cursor-pointer group transition-all"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(168,29,42,0.05)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(203,32,45,0.3)'; e.currentTarget.style.boxShadow = '0 4px 25px rgba(0,0,0,0.07)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(168,29,42,0.05)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)' }}
    >
      <div className="w-full md:w-48 h-36 rounded-lg overflow-hidden shrink-0 relative" style={{ background: 'rgba(237,238,239,0.5)' }}>
        <div className="w-full h-full flex items-center justify-center text-5xl opacity-60">
          {ticket.images && ticket.images.length > 0 ? (
            <img
              src={ticket.images[0].startsWith('http') ? ticket.images[0] : `${API_BASE_URL}/${ticket.images[0].replace(/^\//, '')}`}
              alt={ticket.deviceModel}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '📱' }}
            />
          ) : (
            <span>📱</span>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#A81D2A]/30 to-transparent" />
        <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: isDelivered ? '#CB202D' : '#A81D2A' }} />
          <span className="text-[9px] font-bold uppercase" style={{ color: '#A81D2A' }}>{isDelivered ? 'Completed' : 'Active'}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(59,75,61,0.5)' }}>Ticket</span>
              <span className="text-sm font-bold" style={{ color: '#A81D2A' }}>{ticket.repairId}</span>
            </div>
            <h3 className="text-base font-bold text-[#191c1d] truncate">{ticket.deviceBrand} {ticket.deviceModel}</h3>
            <span className="text-[11px]" style={{ color: 'rgba(59,75,61,0.6)' }}>{ticket.deviceColor} | {formatDate(ticket.createdAt)}</span>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        <div className="mb-3 mt-3">
          <div className="flex justify-between text-[10px] mb-1" style={{ color: 'rgba(59,75,61,0.6)' }}>
            <span>Hardware Integrity Protocol</span>
            <span style={{ color: progressPct >= 100 ? '#CB202D' : '#A81D2A' }}>{progressPct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(237,238,239,0.8)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: progressPct >= 100 ? 'linear-gradient(90deg, #CB202D, #CB202D)' : 'linear-gradient(90deg, #CB202D, #A81D2A)',
                boxShadow: '0 0 8px rgba(168,29,42,0.3)',
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(237,238,239,0.6)' }}>
            <span className="material-symbols-outlined text-xs" style={{ color: '#A81D2A' }}>build_circle</span>
            <span style={{ color: 'rgba(59,75,61,0.8)' }}>{ticket.issueCategory}</span>
          </div>
          <PriorityBadge priority={ticket.priority} />
          <div className="font-bold" style={{ color: '#A81D2A' }}>{formatPrice(ticket.estimatedCost)}</div>
        </div>
      </div>

      <div className="hidden md:flex flex-col items-center justify-center">
        <motion.div
          whileHover={{ x: 3 }}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(203,32,45,0.1)' }}
        >
          <span className="material-symbols-outlined text-sm" style={{ color: '#A81D2A' }}>chevron_right</span>
        </motion.div>
      </div>
    </div>
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
    <div className="grid grid-cols-3 gap-2">
      {resolvedImages.slice(0, 6).map((url, idx) => (
        <motion.button key={idx} whileHover={{ scale: 1.05 }}
          onClick={() => setSelectedIndex(idx)}
          className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative"
          style={{ background: 'rgba(237,238,239,0.3)', border: '1px solid rgba(185,203,185,0.2)' }}>
          <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover"
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
  const needsApproval = ['Diagnosing', 'Waiting for Parts'].includes(ticket.status) && ticket.estimatedCost > 0
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto pt-20 pb-20 px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-3xl rounded-2xl overflow-hidden relative"
        style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
        }}
      >
        <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center z-10 cursor-pointer" style={{ background: 'rgba(255,255,255,0.7)' }}>
          <span className="material-symbols-outlined text-base text-[#3b4b3d]">close</span>
        </button>

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(59,75,61,0.5)' }}>Ticket</span>
                <span className="text-base font-extrabold" style={{ color: '#A81D2A' }}>{ticket.repairId}</span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(59,75,61,0.6)' }}>Created on {formatDate(ticket.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>

          <div className="mb-6">
            <PipelineProgress ticket={ticket} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#A81D2A' }}>Customer Information</h3>
              <div className="space-y-2 p-3 rounded-lg" style={{ background: 'rgba(237,238,239,0.4)' }}>
                <InfoRow label="Name" value={ticket.customerName} />
                <InfoRow label="Mobile" value={ticket.customerMobile} />
                <InfoRow label="Email" value={ticket.customerEmail} />
                <InfoRow label="Address" value={ticket.customerAddress} />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#A81D2A' }}>Device Information</h3>
              <div className="space-y-2 p-3 rounded-lg" style={{ background: 'rgba(237,238,239,0.4)' }}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#A81D2A' }}>Issue Details</h3>
              <div className="space-y-2 p-3 rounded-lg" style={{ background: 'rgba(237,238,239,0.4)' }}>
                <InfoRow label="Category" value={ticket.issueCategory} />
                <div>
                  <p className="text-[9px] tracking-wider font-bold uppercase mb-1" style={{ color: 'rgba(59,75,61,0.5)' }}>Description</p>
                  <p className="text-sm text-[#191c1d] leading-relaxed">{ticket.description}</p>
                </div>
                <InfoRow label="Priority" value={ticket.priority} />
                <InfoRow label="Accessories" value={ticket.accessories || 'None'} />
                <InfoRow label="Password" value={ticket.password || 'Not required'} />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#A81D2A' }}>Repair Estimation</h3>
              <div className="space-y-2 p-3 rounded-lg" style={{ background: 'rgba(237,238,239,0.4)' }}>
                <InfoRow label="Estimated Cost" value={formatPrice(ticket.estimatedCost)} highlight />
                <InfoRow label="Est. Completion" value={ticket.estimatedDays ? `${ticket.estimatedDays} day${ticket.estimatedDays > 1 ? 's' : ''}` : '—'} />
                <InfoRow label="Technician" value={ticket.technicianId ? `Technician #${ticket.technicianId}` : 'Not assigned'} />
              </div>
            </div>
          </div>

          {ticket.images && ticket.images.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[10px] font-bold tracking-wider uppercase mb-3" style={{ color: '#A81D2A' }}>Device Photos</h3>
              <ImageGallery images={ticket.images} />
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-[10px] font-bold tracking-wider uppercase mb-3" style={{ color: '#A81D2A' }}>Conversation with Admin</h3>
            <div className="rounded-xl p-4" style={{ background: 'rgba(237,238,239,0.4)', border: '1px solid rgba(185,203,185,0.2)' }}>
              {ticket.notes && ticket.notes.length > 0 ? (
                <div className="space-y-3 max-h-48 overflow-y-auto mb-3 pr-1">
                  {ticket.notes.map((note) => (
                    <div key={note.id} className={`flex ${note.is_admin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                        note.is_admin
                          ? 'rounded-bl-sm'
                          : 'rounded-br-sm'
                      }`}
                        style={{
                          background: note.is_admin ? 'rgba(168,29,42,0.1)' : '#A81D2A',
                          color: note.is_admin ? '#191c1d' : '#ffffff',
                        }}
                      >
                        <p className="text-xs font-semibold mb-0.5 opacity-70">
                          {note.is_admin ? 'Admin' : 'You'}
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.message}</p>
                        <p className="text-[10px] mt-1 opacity-50 text-right">
                          {note.created_at ? formatDate(note.created_at) : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center py-3" style={{ color: 'rgba(59,75,61,0.5)' }}>
                  No messages yet. Send a message to the admin team.
                </p>
              )}
              <div className="flex gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Type your message..."
                  className="flex-1 h-10 px-3 rounded-lg text-xs outline-none"
                  style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(185,203,185,0.3)', color: '#191c1d' }}
                />
                <button onClick={sendMessage} disabled={sendingMsg || !message.trim()}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white transition-all disabled:opacity-40 cursor-pointer"
                  style={{ background: '#A81D2A' }}
                >
                  {sendingMsg ? (
                    <FiLoader size={14} className="animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-lg">send</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {canSendCourier && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-5 rounded-xl"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-xl" style={{ color: '#6366f1' }}>local_shipping</span>
                <div>
                  <h3 className="text-sm font-bold text-[#191c1d]">Send Device via Courier</h3>
                  <p className="text-[11px]" style={{ color: 'rgba(59,75,61,0.6)' }}>Your repair has been accepted. Please send the device and share courier details.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(59,75,61,0.5)' }}>Courier Name *</label>
                    <input value={courierName} onChange={(e) => setCourierName(e.target.value)}
                      placeholder="e.g. DTDC, Blue Dart"
                      className="w-full h-9 px-3 rounded-lg text-xs outline-none"
                      style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(185,203,185,0.3)', color: '#191c1d' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(59,75,61,0.5)' }}>Tracking Number *</label>
                    <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. DTDC123456789"
                      className="w-full h-9 px-3 rounded-lg text-xs outline-none"
                      style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(185,203,185,0.3)', color: '#191c1d' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(59,75,61,0.5)' }}>Shipment Date</label>
                  <input type="date" value={courierDate} onChange={(e) => setCourierDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg text-xs outline-none"
                    style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(185,203,185,0.3)', color: '#191c1d' }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(59,75,61,0.5)' }}>Additional Notes</label>
                  <textarea value={courierNotes} onChange={(e) => setCourierNotes(e.target.value)} rows={2}
                    placeholder="Any special instructions for the courier..."
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(185,203,185,0.3)', color: '#191c1d' }}
                  />
                </div>
                <button onClick={handleSendCourier} disabled={submittingCourier}
                  className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  style={{ background: '#6366f1' }}
                >
                  {submittingCourier ? 'Submitting...' : 'Submit Courier Details'}
                </button>
              </div>
            </motion.div>
          )}

          {courierSent && (
            <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg" style={{ color: '#22c55e' }}>check_circle</span>
                <h3 className="text-sm font-bold text-[#191c1d]">Courier Sent</h3>
              </div>
              <div className="space-y-1">
                <InfoRow label="Courier" value={ticket.courier?.courier_name || '—'} />
                <InfoRow label="Tracking" value={ticket.courier?.tracking_number || '—'} />
                <InfoRow label="Date" value={ticket.courier?.courier_date ? formatDate(ticket.courier.courier_date) : '—'} />
                {ticket.courier?.courier_notes && <InfoRow label="Notes" value={ticket.courier.courier_notes} />}
              </div>
            </div>
          )}

          {ticket.statusHistory && ticket.statusHistory.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[10px] font-bold tracking-wider uppercase mb-3" style={{ color: '#A81D2A' }}>Status History</h3>
              <div className="rounded-xl p-4" style={{ background: 'rgba(237,238,239,0.4)', border: '1px solid rgba(185,203,185,0.2)' }}>
                <div className="relative">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5" style={{ background: 'rgba(168,29,42,0.15)' }} />
                  <div className="space-y-0">
                    {ticket.statusHistory.map((h, idx) => {
                      const badge = STATUS_BADGES[h.status] || { label: h.status, color: '#6b7280' }
                      return (
                        <div key={h.id || idx} className="flex items-start gap-3 py-2">
                          <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: `${badge.color}20` }}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ background: badge.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: badge.color }}>{badge.label}</span>
                              <span className="text-[10px]" style={{ color: 'rgba(59,75,61,0.4)' }}>
                                {h.created_at ? formatDate(h.created_at) : ''}
                              </span>
                            </div>
                            {h.notes && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(59,75,61,0.6)' }}>{h.notes}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {needsApproval && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-5 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-xl" style={{ color: '#f59e0b' }}>handshake</span>
                <div>
                  <h3 className="text-sm font-bold text-[#191c1d]">Customer Approval Required</h3>
                  <p className="text-[11px]" style={{ color: 'rgba(59,75,61,0.6)' }}>Please review the repair estimate below</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg mb-3" style={{ background: 'rgba(255,255,255,0.6)' }}>
                <span className="text-sm" style={{ color: 'rgba(59,75,61,0.8)' }}>Estimated Cost</span>
                <span className="text-lg font-extrabold" style={{ color: '#A81D2A' }}>{formatPrice(ticket.estimatedCost)}</span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'rgba(59,75,61,0.6)' }}>Do you approve the repair work to proceed at the estimated cost?</p>
              <div className="flex gap-2">
                <button onClick={() => onApprove(true)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
                  style={{
                    background: '#A81D2A',
                    boxShadow: '0 4px 15px rgba(168,29,42,0.3)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#C22535'}
                  onMouseLeave={e => e.currentTarget.style.background = '#A81D2A'}
                >Approve</button>
                <button onClick={() => onApprove(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                >Reject</button>
              </div>
            </motion.div>
          )}

          <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid rgba(185,203,185,0.3)' }}>
            <button onClick={() => navigator.clipboard.writeText(ticket.repairId)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
              style={{ background: 'rgba(203,32,45,0.1)', color: '#A81D2A', border: '1px solid rgba(203,32,45,0.2)' }}
            >
              <span className="material-symbols-outlined text-xs">content_copy</span>
              Copy Ticket ID
            </button>
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
              style={{ background: '#A81D2A' }}
            >Close</button>
          </div>
        </div>
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
    <div className="flex justify-between items-start gap-2">
      <span className="text-[9px] tracking-wider font-bold uppercase flex-shrink-0" style={{ color: 'rgba(59,75,61,0.5)' }}>{label}</span>
      <span className="text-sm text-right font-medium" style={{ color: highlight ? '#006d37' : '#191c1d', fontWeight: highlight ? 700 : 500 }}>{value || '—'}</span>
    </div>
  )
}

export default function CustomerRepairTracking() {
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
        await repairService.updateStatus(selectedTicket.id, 'Repair In Progress')
        showNotification('Repair approved! Work will begin shortly.', 'success')
      } else {
        await repairService.updateStatus(selectedTicket.id, 'Received')
        showNotification('Repair estimate rejected. A representative will contact you.', 'error')
      }
      const detail = await repairService.getById(selectedTicket.id)
      setSelectedTicket(detail)
      const updated = await fetchMyRepairs()
      setTickets(updated.map(t => t.id === detail.id ? detail : t))
    } catch {
      showNotification('Failed to update. Please try again.', 'error')
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
      <style>{`
        @keyframes pulse-mint {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .7; transform: scale(0.95); }
        }
      `}</style>

      <StorefrontNavbar activeLabel="Repairs" />
      <div className="pt-24"><BackBar label="Back to Home" to="/" /></div>

      <main className="max-w-[1440px] mx-auto px-4 md:px-8 pt-4 pb-16">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2 w-2 rounded-full" style={{ background: '#CB202D' }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#A81D2A' }}>
                {loading ? 'Loading...' : `${dashboardStats.active} Active Repairs`}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#191c1d] tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Diagnostics Protocol Manifest
            </h1>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-2 rounded-lg flex items-center gap-2" style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(168,29,42,0.05)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}>
              <span className="material-symbols-outlined text-base" style={{ color: '#A81D2A' }}>terminal</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold" style={{ color: 'rgba(59,75,61,0.5)' }}>Repair ID</span>
                <span className="text-xs font-bold text-[#191c1d]">{dashboardStats.total} Tickets</span>
              </div>
            </div>
            <div className="px-3 py-2 rounded-lg flex items-center gap-2" style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(168,29,42,0.05)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}>
              <span className="material-symbols-outlined text-base" style={{ color: 'rgba(59,75,61,0.5)' }}>update</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold" style={{ color: 'rgba(59,75,61,0.5)' }}>Completed</span>
                <span className="text-xs font-bold text-[#191c1d]">{dashboardStats.completed}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total Repairs', value: dashboardStats.total, icon: 'inventory_2', color: '#A81D2A' },
            { label: 'Active Repairs', value: dashboardStats.active, icon: 'precision_manufacturing', color: '#3b82f6' },
            { label: 'Completed', value: dashboardStats.completed, icon: 'check_circle', color: '#CB202D' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="rounded-xl p-4 cursor-default"
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${stat.color}10`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-lg" style={{ color: stat.color }}>{stat.icon}</span>
                <motion.span key={stat.value} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                  className="text-2xl font-extrabold" style={{ color: stat.color }}>{stat.value}</motion.span>
              </div>
              <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: `${stat.color}cc` }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="rounded-xl p-5 mb-8" style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(168,29,42,0.05)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: 'rgba(59,75,61,0.3)' }}>search</span>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Ticket ID, Device, or IMEI..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm border outline-none transition-all"
                style={{
                  background: 'rgba(237,238,239,0.5)',
                  borderColor: 'rgba(185,203,185,0.3)',
                  color: '#191c1d',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#A81D2A'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(185,203,185,0.3)'}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTER_OPTIONS.map(opt => (
              <button key={opt} onClick={() => setStatusFilter(opt)}
                className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all cursor-pointer"
                style={{
                  background: statusFilter === opt ? '#A81D2A' : 'rgba(237,238,239,0.6)',
                  color: statusFilter === opt ? '#fff' : 'rgba(59,75,61,0.7)',
                }}
              >{opt}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl p-5 animate-pulse" style={{ background: 'rgba(255,255,255,0.3)' }}>
                <div className="flex gap-5">
                  <div className="w-48 h-36 rounded-lg" style={{ background: 'rgba(237,238,239,0.5)' }} />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-32 rounded" style={{ background: 'rgba(237,238,239,0.5)' }} />
                    <div className="h-3 w-48 rounded" style={{ background: 'rgba(237,238,239,0.5)' }} />
                    <div className="h-2 w-full rounded" style={{ background: 'rgba(237,238,239,0.5)' }} />
                    <div className="h-3 w-24 rounded" style={{ background: 'rgba(237,238,239,0.5)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-xl p-8" style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(168,29,42,0.05)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}>
            <EmptyState onBrowse={() => window.location.href = '/repairs'} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredTickets.map((ticket, idx) => (
              <motion.div key={ticket.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                <RepairCard ticket={ticket} onSelect={setSelectedTicket} />
              </motion.div>
            ))}
          </div>
        )}
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
            className="fixed bottom-8 left-1/2 z-[150] px-5 py-3 rounded-xl shadow-xl flex items-center gap-2"
            style={{
              background: notification.type === 'success' ? '#A81D2A' : '#dc2626',
              color: '#fff',
            }}
          >
            <span className="material-symbols-outlined text-sm">{notification.type === 'success' ? 'check_circle' : 'error'}</span>
            <span className="text-sm font-bold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

<EcommerceFooter />
      </div>
    </ErrorBoundary>
  )
}

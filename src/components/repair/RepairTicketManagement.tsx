import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch, FiGrid, FiList, FiEye, FiEdit2, FiTrash2, FiX, FiClock, FiCheckCircle,
  FiAlertTriangle, FiTool, FiSmartphone, FiDollarSign, FiUser, FiCalendar, FiChevronDown,
  FiRefreshCw, FiPhone, FiMail, FiStar, FiTrendingUp, FiBarChart2, FiPackage, FiSave,
  FiMapPin, FiCamera, FiImage, FiSend, FiMessageSquare,
} from 'react-icons/fi'
import { repairService, type RepairTicket } from '../../services/repairService'
import { deviceCategories, deviceBrands, issueCategories, repairTechnicians } from '../../data/repairData'
import CreatableSelect from '../ui/CreatableSelect'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Received: { label: 'Received', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <FiClock size={12} /> },
  Diagnosing: { label: 'Diagnosing', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: <FiSearch size={12} /> },
  'Waiting for Parts': { label: 'Waiting for Parts', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: <FiPackage size={12} /> },
  'Repair In Progress': { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: <FiTool size={12} /> },
  'Quality Check': { label: 'Quality Check', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: <FiStar size={12} /> },
  'Ready for Delivery': { label: 'Ready', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <FiCheckCircle size={12} /> },
  Delivered: { label: 'Delivered', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: <FiCheckCircle size={12} /> },
  Cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <FiX size={12} /> },
}

const statusOptions = Object.keys(statusConfig)
const priorityColors: Record<string, string> = { Low: 'text-slate-400', Medium: 'text-amber-400', High: 'text-orange-400', Urgent: 'text-red-400' }


const getTechName = (id: number | null): string => {
  if (!id) return 'Auto Assign'
  const t = repairTechnicians.find((t) => t.id === id)
  return t ? `${t.name} — ${t.speciality}` : 'Auto Assign'
}

const statCards = [
  { key: 'total', label: 'Total Tickets', icon: FiBarChart2, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { key: 'Received', label: 'Pending', icon: FiClock, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { key: 'Repair In Progress', label: 'In Progress', icon: FiTool, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'Delivered', label: 'Delivered', icon: FiCheckCircle, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  { key: 'completed', label: 'Completed', icon: FiTrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { key: 'Cancelled', label: 'Cancelled', icon: FiAlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
]

const timelineSteps = ['Received', 'Diagnosing', 'Repair In Progress', 'Quality Check', 'Ready for Delivery', 'Delivered']

function StatCard({ label, value, icon: Icon, color, bg, index }: { label: string; value: number; icon: any; color: string; bg: string; index: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const duration = 800; const steps = 30; const increment = value / steps; let current = 0
    const timer = setInterval(() => { current += increment; if (current >= value) { setDisplay(value); clearInterval(timer) } else setDisplay(Math.floor(current)) }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.06 }} className="relative group">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative rounded-2xl border border-white/[0.06] backdrop-blur-xl p-4 overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl" style={{ backgroundColor: 'rgba(15,23,42,0.6)' }}>
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" style={{ backgroundColor: color, transform: 'translate(30%, -30%)' }} />
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}><Icon size={18} style={{ color }} /></div>
          <span className="text-[10px] font-medium text-text-muted">This Month</span>
        </div>
        <p className="text-2xl font-bold text-white mb-0.5 font-mono">{display.toLocaleString()}</p>
        <p className="text-xs font-medium" style={{ color: `${color}cc` }}>{label}</p>
      </div>
    </motion.div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.Received
  return (
    <motion.span whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${cfg.bg} ${cfg.border} ${cfg.color} whitespace-nowrap`}
    >{cfg.icon}{cfg.label}</motion.span>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />)}
    </div>
  )
}

function Toast({ message, type = 'success', onClose }: { message: string; type?: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-xl ${
        type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
      }`}
    >
      {type === 'success' ? <FiCheckCircle size={16} /> : <FiAlertTriangle size={16} />}
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><FiX size={14} /></button>
    </motion.div>
  )
}

function PhotoThumbnails({ images, className }: { images: string[]; className?: string }) {
  if (!images.length) return null
  return (
    <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 ${className || ''}`}>
      {images.map((img, i) => (
        <a key={i} href={img} target="_blank" rel="noopener noreferrer"
          className="aspect-square rounded-lg bg-[#0F172A] border border-white/[0.06] overflow-hidden hover:border-primary/30 transition-all group"
        >
          <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
        </a>
      ))}
    </div>
  )
}

export default function RepairTicketManagement({ refreshTrigger, onRefresh }: { refreshTrigger: number; onRefresh: () => void }) {
  const [tickets, setTickets] = useState<RepairTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  useLockBodyScroll(viewModalOpen || editModalOpen || deleteModalOpen)

  const [editForm, setEditForm] = useState({
    customerName: '', customerMobile: '', customerAlt: '', customerEmail: '', customerAddress: '',
    deviceCategory: '', deviceBrand: '', deviceModel: '', imei: '', serial: '', deviceColor: '',
    deviceCondition: '', warranty: '',
    issueCategory: '', description: '', priority: 'Medium', accessories: '', password: '',
    status: 'Received', estimatedCost: 0, estimatedDays: 1, technician: 0,
  })
  const [editImageFiles, setEditImageFiles] = useState<File[]>([])
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([])
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customBrands, setCustomBrands] = useState<string[]>([])
  const [customWarranties, setCustomWarranties] = useState<string[]>([])
  const [customIssues, setCustomIssues] = useState<string[]>([])
  const [customPriorities, setCustomPriorities] = useState<string[]>([])
  const allCategories = useMemo(() => [...deviceCategories, ...customCategories], [customCategories])
  const allBrands = useMemo(() => [...deviceBrands, ...customBrands], [customBrands])
  const allWarranties = useMemo(() => ['In Warranty', 'Out of Warranty', 'Expired', ...customWarranties], [customWarranties])
  const allIssues = useMemo(() => [...issueCategories, ...customIssues], [customIssues])
  const allPriorities = useMemo(() => ['Low', 'Medium', 'High', 'Urgent', ...customPriorities], [customPriorities])

  const fetchTickets = useCallback(async () => {
    try { setLoading(true); const data = await repairService.list(); setTickets(data) }
    catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets, refreshTrigger])

  const filteredTickets = useMemo(() => {
    let result = [...tickets]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((t) =>
        t.repairId.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q) ||
        t.customerMobile.includes(q) || t.deviceBrand.toLowerCase().includes(q) ||
        t.deviceModel.toLowerCase().includes(q) || t.issueCategory.toLowerCase().includes(q)
      )
    }
    if (filterStatus) result = result.filter((t) => t.status === filterStatus)
    if (filterCategory) result = result.filter((t) => (t.deviceCategory || t.deviceBrand) === filterCategory)
    result.sort((a, b) => sortOrder === 'newest'
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    return result
  }, [tickets, search, filterStatus, sortOrder])

  const counts = useMemo(() => {
    const total = tickets.length
    const received = tickets.filter((t) => t.status === 'Received').length
    const inProgress = tickets.filter((t) => ['Repair In Progress', 'Diagnosing', 'Waiting for Parts', 'Quality Check'].includes(t.status)).length
    const delivered = tickets.filter((t) => t.status === 'Delivered').length
    const cancelled = tickets.filter((t) => t.status === 'Cancelled').length
    const completed = tickets.filter((t) => ['Ready for Delivery', 'Delivered'].includes(t.status)).length
    return { total, Received: received, 'Repair In Progress': inProgress, Delivered: delivered, Cancelled: cancelled, completed }
  }, [tickets])

  const openView = async (ticket: RepairTicket) => {
    try { const full = await repairService.getById(ticket.id); setSelectedTicket(full) }
    catch { setSelectedTicket(ticket) }
    setReplyMessage('')
    setViewModalOpen(true)
  }

  const openEdit = async (ticket: RepairTicket) => {
    let full = ticket
    try { full = await repairService.getById(ticket.id) } catch { /* use ticket data */ }
    setSelectedTicket(full)
    setEditForm({
      customerName: full.customerName,
      customerMobile: full.customerMobile,
      customerAlt: full.customerAlt || '',
      customerEmail: full.customerEmail || '',
      customerAddress: full.customerAddress || '',
      deviceCategory: full.deviceCategory || full.deviceBrand,
      deviceBrand: full.deviceBrand,
      deviceModel: full.deviceModel,
      imei: full.imei || '',
      serial: full.serialNumber || '',
      deviceColor: full.deviceColor || '',
      deviceCondition: full.deviceCondition || '',
      warranty: full.warranty || '',
      issueCategory: full.issueCategory,
      description: full.description,
      priority: full.priority,
      accessories: full.accessories || '',
      password: full.password || '',
      status: full.status,
      estimatedCost: full.estimatedCost,
      estimatedDays: full.estimatedDays,
      technician: full.technicianId || 0,
    })
    setEditImageFiles([])
    setEditImagePreviews([])
    setEditModalOpen(true)
  }

  const openDelete = (ticket: RepairTicket) => { setSelectedTicket(ticket); setDeleteModalOpen(true) }

  const handleDelete = async () => {
    if (!selectedTicket) return
    setDeleting(true)
    try {
      await repairService.delete(selectedTicket.id)
      setDeleteModalOpen(false); setSelectedTicket(null)
      setToast({ message: `Ticket ${selectedTicket.repairId} deleted successfully`, type: 'success' })
      await fetchTickets(); onRefresh()
    } catch { setToast({ message: 'Failed to delete ticket', type: 'error' }) }
    finally { setDeleting(false) }
  }

  const handleEditImageFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return
    const newFiles = Array.from(fileList)
    setEditImageFiles((prev) => [...prev, ...newFiles])
    newFiles.forEach((f) => {
      const url = URL.createObjectURL(f)
      setEditImagePreviews((prev) => [...prev, url])
    })
  }

  const removeEditImage = (idx: number) => {
    URL.revokeObjectURL(editImagePreviews[idx])
    setEditImageFiles((prev) => prev.filter((_, i) => i !== idx))
    setEditImagePreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleEditSubmit = async () => {
    if (!selectedTicket) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('customer_name', editForm.customerName.trim())
      fd.append('customer_mobile', editForm.customerMobile.trim())
      fd.append('customer_alternate_mobile', editForm.customerAlt.trim())
      fd.append('email', editForm.customerEmail.trim())
      fd.append('address', editForm.customerAddress.trim())
      fd.append('device_category', editForm.deviceCategory)
      fd.append('device_brand', editForm.deviceBrand)
      fd.append('device_model', editForm.deviceModel.trim())
      fd.append('imei_number', editForm.imei.trim())
      fd.append('serial_number', editForm.serial.trim())
      fd.append('device_color', editForm.deviceColor.trim())
      fd.append('device_condition', editForm.deviceCondition.trim())
      fd.append('warranty_status', editForm.warranty)
      fd.append('issue_category', editForm.issueCategory)
      fd.append('problem_description', editForm.description.trim())
      fd.append('priority', editForm.priority.toLowerCase())
      fd.append('accessories_submitted', editForm.accessories.trim())
      fd.append('device_password', editForm.password.trim())
      fd.append('estimated_cost', String(editForm.estimatedCost))
      fd.append('estimated_completion_days', String(editForm.estimatedDays))
      fd.append('assigned_technician', editForm.technician > 0 ? String(editForm.technician) : '')
      fd.append('status', editForm.status)
      if (selectedTicket.images.length > 0) {
        fd.append('existing_photos', JSON.stringify(selectedTicket.images))
      }
      editImageFiles.forEach((file) => fd.append('photos', file))
      await repairService.update(selectedTicket.id, fd)
      setEditModalOpen(false); setSelectedTicket(null)
      setEditImageFiles([]); setEditImagePreviews([])
      setToast({ message: `Ticket ${selectedTicket.repairId} updated successfully`, type: 'success' })
      await fetchTickets(); onRefresh()
    } catch { setToast({ message: 'Failed to update ticket', type: 'error' }) }
    finally { setSaving(false) }
  }

  const tableHeaders = ['Ticket', 'Customer', 'Mobile', 'Category', 'Device', 'Issue', 'Technician', 'Cost', 'Status', 'Created', 'Actions']

  const statusIndex = (status: string) => {
    const idx = timelineSteps.indexOf(status)
    return idx >= 0 ? idx : -1
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, i) => {
          const { key: statKey, ...cardProps } = card
          return <StatCard key={statKey} {...cardProps} value={counts[statKey as keyof typeof counts] || 0} index={i} />
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Repair Tickets Management</h2>
          <p className="text-sm text-text-muted">Manage all customer repair tickets efficiently.</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { fetchTickets(); onRefresh() }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-medium text-text-secondary hover:text-white hover:border-primary/30 transition-all"
        ><FiRefreshCw size={14} /> Refresh</motion.button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket ID, customer, device..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white placeholder-text-muted outline-none focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"><FiX size={14} /></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="h-11 px-4 pr-10 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none appearance-none cursor-pointer focus:border-primary/40 transition-all"
            >
              <option value="">All Status</option>
              {statusOptions.map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}
            </select>
            <FiChevronDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="h-11 px-4 pr-10 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none appearance-none cursor-pointer focus:border-primary/40 transition-all"
            >
              <option value="">All Categories</option>
              {deviceCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <FiChevronDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
          <div className="relative">
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}
              className="h-11 px-4 pr-10 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none appearance-none cursor-pointer focus:border-primary/40 transition-all"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <FiChevronDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
          <div className="flex bg-[rgba(15,23,42,0.8)] border border-white/[0.08] rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('table')}
              className={`p-2.5 transition-all ${viewMode === 'table' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-white'}`}
            ><FiList size={16} /></button>
            <button onClick={() => setViewMode('cards')}
              className={`p-2.5 transition-all ${viewMode === 'cards' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-white'}`}
            ><FiGrid size={16} /></button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : filteredTickets.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 rounded-2xl bg-[rgba(15,23,42,0.4)] border border-white/[0.06]"
        >
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4"><FiTool size={32} className="text-primary/60" /></div>
          <h3 className="text-lg font-semibold text-white mb-1">No Repair Tickets Found</h3>
          <p className="text-sm text-text-muted">{search || filterStatus ? 'Try adjusting your search or filters' : 'Create your first repair ticket to get started.'}</p>
        </motion.div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[rgba(15,23,42,0.4)]">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {tableHeaders.map((h) => (
                  <th key={h} className="text-left px-3 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredTickets.map((ticket, i) => (
                  <motion.tr key={ticket.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-3 py-3"><span className="text-xs font-mono font-bold text-primary">{ticket.repairId}</span></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {ticket.customerName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white truncate max-w-[130px]">{ticket.customerName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-text-muted whitespace-nowrap">{ticket.customerMobile}</td>
                    <td className="px-3 py-3"><span className="text-xs text-text-secondary">{ticket.deviceCategory || ticket.deviceBrand}</span></td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{ticket.deviceBrand}</span>
                        <span className="text-[11px] text-text-muted">{ticket.deviceModel}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3"><span className="text-xs text-text-secondary truncate max-w-[100px] inline-block" title={ticket.issueCategory}>{ticket.issueCategory}</span></td>
                    <td className="px-3 py-3"><span className="text-xs text-text-muted whitespace-nowrap">{getTechName(ticket.technicianId)}</span></td>
                    <td className="px-3 py-3 text-sm font-semibold text-emerald-400 whitespace-nowrap">₹{ticket.estimatedCost.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-3"><StatusBadge status={ticket.status} /></td>
                    <td className="px-3 py-3 text-xs text-text-muted whitespace-nowrap">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-0.5">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => openView(ticket)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="View"
                        ><FiEye size={15} /></motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => openEdit(ticket)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-amber-400 hover:bg-amber-500/10 transition-all" title="Edit"
                        ><FiEdit2 size={15} /></motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => openDelete(ticket)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete"
                        ><FiTrash2 size={15} /></motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredTickets.map((ticket, i) => (
              <motion.div key={ticket.id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.04 }} whileHover={{ y: -4 }}
                className="group relative rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[rgba(15,23,42,0.8)] to-[rgba(15,23,42,0.4)] backdrop-blur-xl p-5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                        <FiSmartphone size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-mono font-bold text-primary">{ticket.repairId}</p>
                        <p className="text-sm font-semibold text-white">{ticket.customerName}</p>
                        <p className="text-[11px] text-text-muted flex items-center gap-1"><FiPhone size={10} />{ticket.customerMobile}</p>
                      </div>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <FiSmartphone size={12} />
                      <span className="font-medium text-text-secondary">{ticket.deviceCategory || ticket.deviceBrand}</span>
                      <span>{ticket.deviceBrand} {ticket.deviceModel}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-text-muted">
                      <FiAlertTriangle size={12} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{ticket.issueCategory}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                      <span className="flex items-center gap-1"><FiDollarSign size={12} /><span className="text-emerald-400 font-semibold">₹{ticket.estimatedCost.toLocaleString('en-IN')}</span></span>
                      <span className="flex items-center gap-1"><FiUser size={12} /><span className="truncate max-w-[100px]">{getTechName(ticket.technicianId)}</span></span>
                      <span className="flex items-center gap-1"><FiCalendar size={12} />{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => openView(ticket)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-all"
                    ><FiEye size={13} /> View</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => openEdit(ticket)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all"
                    ><FiEdit2 size={13} /> Edit</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => openDelete(ticket)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all"
                    ><FiTrash2 size={13} /> Delete</motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-text-muted pt-2">
        <span>Showing {filteredTickets.length} of {tickets.length} tickets</span>
      </div>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {viewModalOpen && selectedTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewModalOpen(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0F172A] border border-white/[0.08] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/[0.06] bg-[#0F172A]/90 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><FiEye size={18} className="text-primary" /></div>
                  <div>
                    <h3 className="text-base font-bold text-white">Ticket Details</h3>
                    <p className="text-xs font-mono text-primary">{selectedTicket.repairId}</p>
                  </div>
                </div>
                <button onClick={() => setViewModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-text-muted hover:text-white hover:bg-white/[0.1] transition-all"
                ><FiX size={16} /></button>
              </div>

              <div className="p-5 space-y-5">
                {/* CUSTOMER */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-[rgba(15,23,42,0.6)] border border-white/[0.06] p-4">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiUser size={12} /> Customer</h4>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-white">{selectedTicket.customerName}</p>
                      <p className="text-xs text-text-muted flex items-center gap-1.5"><FiPhone size={11} />{selectedTicket.customerMobile}</p>
                      {selectedTicket.customerAlt && <p className="text-xs text-text-muted flex items-center gap-1.5"><FiPhone size={11} />Alt: {selectedTicket.customerAlt}</p>}
                      {selectedTicket.customerEmail && <p className="text-xs text-text-muted flex items-center gap-1.5"><FiMail size={11} />{selectedTicket.customerEmail}</p>}
                      {selectedTicket.customerAddress && <p className="text-xs text-text-muted flex items-center gap-1.5"><FiMapPin size={11} />{selectedTicket.customerAddress}</p>}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[rgba(15,23,42,0.6)] border border-white/[0.06] p-4">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiSmartphone size={12} /> Device</h4>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-white">{selectedTicket.deviceBrand} {selectedTicket.deviceModel}</p>
                      <p className="text-xs text-text-muted">Category: {selectedTicket.deviceCategory || '—'}</p>
                      {selectedTicket.deviceColor && <p className="text-xs text-text-muted">Color: {selectedTicket.deviceColor}</p>}
                      <p className="text-xs text-text-muted">IMEI: {selectedTicket.imei || '—'}</p>
                      <p className="text-xs text-text-muted">Serial: {selectedTicket.serialNumber || '—'}</p>
                      {selectedTicket.warranty && <p className="text-xs text-text-muted">Warranty: {selectedTicket.warranty}</p>}
                    </div>
                  </div>
                </div>

                {/* ISSUE + REPAIR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-[rgba(15,23,42,0.6)] border border-white/[0.06] p-4">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiAlertTriangle size={12} /> Issue</h4>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-white">{selectedTicket.issueCategory}</p>
                      <p className="text-xs text-text-muted leading-relaxed">{selectedTicket.description}</p>
                      <p className={`text-xs font-semibold ${priorityColors[selectedTicket.priority] || 'text-slate-400'}`}>Priority: {selectedTicket.priority}</p>
                      {selectedTicket.accessories && <p className="text-xs text-text-muted">Accessories: {selectedTicket.accessories}</p>}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[rgba(15,23,42,0.6)] border border-white/[0.06] p-4">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiDollarSign size={12} /> Repair</h4>
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-emerald-400">₹{selectedTicket.estimatedCost.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-text-muted">Est. Completion: {selectedTicket.estimatedDays} day{selectedTicket.estimatedDays > 1 ? 's' : ''}</p>
                      <p className="text-xs text-text-muted flex items-center gap-1.5"><FiUser size={11} />Technician: {getTechName(selectedTicket.technicianId)}</p>
                      <div className="pt-1"><StatusBadge status={selectedTicket.status} /></div>
                    </div>
                  </div>
                </div>

                {/* PHOTOS */}
                {selectedTicket.images.length > 0 && (
                  <div className="rounded-xl bg-[rgba(15,23,42,0.6)] border border-white/[0.06] p-4">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiCamera size={12} /> Device Photos</h4>
                    <PhotoThumbnails images={selectedTicket.images} />
                  </div>
                )}

                {/* STATUS TIMELINE */}
                <div className="rounded-xl bg-[rgba(15,23,42,0.6)] border border-white/[0.06] p-4">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2"><FiClock size={12} /> Status Timeline</h4>
                  <div className="relative">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-white/[0.06]" />
                    <div className="space-y-0">
                      {timelineSteps.map((step, idx) => {
                        const currentIdx = statusIndex(selectedTicket.status)
                        const isCompleted = idx <= currentIdx && currentIdx >= 0
                        const isActive = idx === currentIdx
                        return (
                          <div key={step} className="flex items-center gap-3 py-2">
                            <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                              isActive ? 'bg-primary shadow-lg shadow-primary/30' :
                              isCompleted ? 'bg-emerald-500/20' : 'bg-white/[0.04]'
                            }`}>
                              {isCompleted ? <FiCheckCircle size={12} className="text-emerald-400" /> :
                               isActive ? <div className="w-2 h-2 rounded-full bg-white" /> :
                               <div className="w-1.5 h-1.5 rounded-full bg-white/[0.15]" />}
                            </div>
                            <span className={`text-xs font-medium ${
                              isActive ? 'text-white font-semibold' : isCompleted ? 'text-emerald-400' : 'text-text-muted'
                            }`}>{step}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-text-muted">
                    Created: {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString('en-IN') : '—'}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editModalOpen && selectedTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditModalOpen(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0F172A] border border-white/[0.08] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/[0.06] bg-[#0F172A]/90 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><FiEdit2 size={18} className="text-amber-400" /></div>
                  <div>
                    <h3 className="text-base font-bold text-white">Edit Repair Ticket</h3>
                    <p className="text-xs font-mono text-amber-400">{selectedTicket.repairId}</p>
                  </div>
                </div>
                <button onClick={() => setEditModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-text-muted hover:text-white hover:bg-white/[0.1] transition-all"
                ><FiX size={16} /></button>
              </div>

              <div className="p-5 space-y-5">
                {/* CUSTOMER SECTION */}
                <div className="rounded-xl bg-[rgba(15,23,42,0.4)] border border-white/[0.06] p-4">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiUser size={12} /> Customer Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Customer Name</label>
                      <input value={editForm.customerName} onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none focus:border-primary/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Mobile Number</label>
                      <input value={editForm.customerMobile} onChange={(e) => setEditForm({ ...editForm, customerMobile: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none focus:border-primary/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Alternate Number</label>
                      <input value={editForm.customerAlt} onChange={(e) => setEditForm({ ...editForm, customerAlt: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none focus:border-primary/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
                      <input value={editForm.customerEmail} onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none focus:border-primary/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Address</label>
                      <input value={editForm.customerAddress} onChange={(e) => setEditForm({ ...editForm, customerAddress: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none focus:border-primary/40 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* DEVICE SECTION */}
                <div className="rounded-xl bg-[rgba(15,23,42,0.4)] border border-white/[0.06] p-4">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiSmartphone size={12} /> Device Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <CreatableSelect label="Device Category" options={allCategories} value={editForm.deviceCategory}
                        onChange={(v) => setEditForm({ ...editForm, deviceCategory: v })} placeholder="Select"
                        onCreate={(v) => setCustomCategories((p) => [...p, v])}
                      />
                    </div>
                    <div>
                      <CreatableSelect label="Device Brand" options={allBrands} value={editForm.deviceBrand}
                        onChange={(v) => setEditForm({ ...editForm, deviceBrand: v })}
                        onCreate={(v) => setCustomBrands((p) => [...p, v])} placeholder="Select"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Device Model</label>
                      <input value={editForm.deviceModel} onChange={(e) => setEditForm({ ...editForm, deviceModel: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none focus:border-primary/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">IMEI Number</label>
                      <input value={editForm.imei} onChange={(e) => setEditForm({ ...editForm, imei: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none focus:border-primary/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Serial Number</label>
                      <input value={editForm.serial} onChange={(e) => setEditForm({ ...editForm, serial: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none focus:border-primary/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Device Color</label>
                      <input value={editForm.deviceColor} onChange={(e) => setEditForm({ ...editForm, deviceColor: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none focus:border-primary/40 transition-all"
                      />
                    </div>
                    <div>
                      <CreatableSelect label="Warranty Status" options={allWarranties} value={editForm.warranty}
                        onChange={(v) => setEditForm({ ...editForm, warranty: v })} placeholder="Select Warranty"
                        onCreate={(v) => setCustomWarranties((p) => [...p, v])}
                      />
                    </div>
                  </div>
                </div>

                {/* ISSUE SECTION */}
                <div className="rounded-xl bg-[rgba(15,23,42,0.4)] border border-white/[0.06] p-4">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiAlertTriangle size={12} /> Issue Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <CreatableSelect label="Issue Category" options={allIssues} value={editForm.issueCategory}
                        onChange={(v) => setEditForm({ ...editForm, issueCategory: v })}
                        onCreate={(v) => setCustomIssues((p) => [...p, v])} placeholder="Select issue"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Problem Description</label>
                      <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3} className="w-full px-4 py-3 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none focus:border-primary/40 transition-all resize-none"
                      />
                    </div>
                    <div>
                      <CreatableSelect label="Priority" options={allPriorities} value={editForm.priority}
                        onChange={(v) => setEditForm({ ...editForm, priority: v })} placeholder="Select"
                        onCreate={(v) => setCustomPriorities((p) => [...p, v])}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Accessories Submitted</label>
                      <input value={editForm.accessories} onChange={(e) => setEditForm({ ...editForm, accessories: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none focus:border-primary/40 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* REPAIR SECTION */}
                <div className="rounded-xl bg-[rgba(15,23,42,0.4)] border border-white/[0.06] p-4">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiTool size={12} /> Repair Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Estimated Cost (₹)</label>
                      <input type="number" value={editForm.estimatedCost} onChange={(e) => setEditForm({ ...editForm, estimatedCost: Number(e.target.value) || 0 })}
                        className="w-full h-10 px-4 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none focus:border-primary/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Est. Completion Days</label>
                      <input type="number" value={editForm.estimatedDays} onChange={(e) => setEditForm({ ...editForm, estimatedDays: Number(e.target.value) || 1 })}
                        className="w-full h-10 px-4 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none focus:border-primary/40 transition-all"
                      />
                    </div>
                    <div>
                      <CreatableSelect label="Assign Technician"
                        options={repairTechnicians.filter((t) => t.online).map((t) => `${t.name} — ${t.speciality}`)}
                        value={editForm.technician === 0 ? '' : (() => {
                          const t = repairTechnicians.find((t) => t.id === editForm.technician)
                          return t ? `${t.name} — ${t.speciality}` : ''
                        })()}
                        onChange={(v) => {
                          const found = repairTechnicians.find((t) => `${t.name} — ${t.speciality}` === v)
                          setEditForm({ ...editForm, technician: found ? found.id : 0 })
                        }}
                        placeholder="Auto Assign"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Repair Status</label>
                      <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-[rgba(15,23,42,0.8)] border border-white/[0.08] text-sm text-white outline-none appearance-none cursor-pointer focus:border-primary/40 transition-all"
                      >{statusOptions.map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}</select>
                    </div>
                  </div>
                </div>

                {/* PHOTOS SECTION */}
                <div className="rounded-xl bg-[rgba(15,23,42,0.4)] border border-white/[0.06] p-4">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiCamera size={12} /> Device Photos</h4>
                  {selectedTicket.images.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[11px] text-text-muted mb-2">Existing photos:</p>
                      <PhotoThumbnails images={selectedTicket.images} />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input ref={editInputRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => { handleEditImageFiles(e.target.files); e.target.value = '' }} />
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => editInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-dashed border-white/[0.12] text-xs text-text-muted hover:text-white hover:border-primary/30 transition-all"
                    ><FiImage size={14} /> Add Photos</motion.button>
                  </div>
                  {editImagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-3">
                      {editImagePreviews.map((url, i) => (
                        <div key={i} className="relative group aspect-square rounded-lg bg-[#0F172A] border border-white/[0.06] overflow-hidden">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removeEditImage(i)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-md bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          ><FiX size={10} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 flex items-center justify-end gap-3 p-5 border-t border-white/[0.06] bg-[#0F172A]/90 backdrop-blur-xl">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/[0.08] text-sm font-semibold text-text-secondary hover:text-white transition-all"
                >Cancel</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleEditSubmit} disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all"
                ><FiSave size={14} /> {saving ? 'Saving...' : 'Save Changes'}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteModalOpen && selectedTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteModalOpen(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md rounded-2xl bg-[#0F172A] border border-white/[0.08] shadow-2xl p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4"
              ><FiAlertTriangle size={28} className="text-red-400" /></motion.div>
              <h3 className="text-lg font-bold text-white mb-2">Delete Ticket</h3>
              <p className="text-sm text-text-muted mb-2">
                Are you sure you want to delete ticket <span className="font-mono font-semibold text-red-400">{selectedTicket.repairId}</span>?
              </p>
              <p className="text-xs text-text-muted mb-6">This action cannot be undone.</p>
              <div className="flex items-center justify-center gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/[0.08] text-sm font-semibold text-text-secondary hover:text-white transition-all"
                >Cancel</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDelete} disabled={deleting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold shadow-lg shadow-red-500/25 disabled:opacity-50 transition-all"
                ><FiTrash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch, FiEye, FiEdit2, FiTrash2, FiX, FiClock, FiCheckCircle,
  FiAlertTriangle, FiTool, FiSmartphone, FiDollarSign, FiUser, 
  FiRefreshCw, FiPhone, FiMail, FiStar, FiBarChart2, FiPackage, FiSave,
  FiMapPin, FiCamera, FiImage, FiSend,
} from 'react-icons/fi'
import { repairService, type RepairTicket } from '../../services/repairService'
import { deviceCategories, deviceBrands, issueCategories, repairTechnicians } from '../../data/repairData'
import CreatableSelect from '../ui/CreatableSelect'
import {
  Btn, EmptyState, ExportBtn, FilterMenu, FilterSelect, KpiCard, PageHeader, Pagination, RowMenu, SearchBox, ShowingSelect,
  Skeleton, SortTh, StatusPill, Thumb, exportCsv, toneForStatus, useTable,
} from '../admin/AdminUI'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'

const STATUS_TRANSITIONS: Record<string, string[]> = {
  Submitted: ['Accepted', 'Rejected'],
  Accepted: ['Received'],
  Received: ['Diagnosing'],
  'Awaiting Approval': [],
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
  'Awaiting Approval': 'awaiting_approval',
  Diagnosing: 'inspection',
  'Waiting for Parts': 'waiting_parts',
  'Repair In Progress': 'repair_in_progress',
  'Quality Check': 'quality_check',
  'Ready for Delivery': 'ready_for_pickup',
  Delivered: 'completed',
  Cancelled: 'cancelled',
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Submitted: { label: 'Submitted', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: <FiClock size={12} /> },
  Accepted: { label: 'Accepted', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: <FiCheckCircle size={12} /> },
  Rejected: { label: 'Rejected', color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', icon: <FiX size={12} /> },
  Received: { label: 'Received', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: <FiClock size={12} /> },
  'Awaiting Approval': { label: 'Awaiting Approval', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', icon: <FiAlertTriangle size={12} /> },
  Diagnosing: { label: 'Diagnosing', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: <FiSearch size={12} /> },
  'Waiting for Parts': { label: 'Waiting for Parts', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: <FiPackage size={12} /> },
  'Repair In Progress': { label: 'In Progress', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: <FiTool size={12} /> },
  'Quality Check': { label: 'Quality Check', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: <FiStar size={12} /> },
  'Ready for Delivery': { label: 'Ready', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: <FiCheckCircle size={12} /> },
  Delivered: { label: 'Delivered', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', icon: <FiCheckCircle size={12} /> },
  Cancelled: { label: 'Cancelled', color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', icon: <FiX size={12} /> },
}

const statusOptions = Object.keys(statusConfig)
const priorityColors: Record<string, string> = { Low: 'text-text-muted', Medium: 'text-primary', High: 'text-primary', Urgent: 'text-danger' }

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


const getTechName = (id: number | null): string => {
  if (!id) return 'Auto Assign'
  const t = repairTechnicians.find((t) => t.id === id)
  return t ? `${t.name} — ${t.speciality}` : 'Auto Assign'
}

const timelineSteps = ['Submitted', 'Accepted', 'Received', 'Diagnosing', 'Repair In Progress', 'Quality Check', 'Ready for Delivery', 'Delivered']

function StatusBadge({ status }: { status: string }) {
  return <StatusPill tone={toneForStatus(status)}>{statusConfig[status]?.label ?? status}</StatusPill>
}

function Toast({ message, type = 'success', onClose }: { message: string; type?: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-xl ${
        type === 'success' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-danger/10 border-danger/20 text-danger'
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
          className="aspect-square rounded-lg bg-gray-50 border border-border overflow-hidden hover:border-primary/30 transition-all group"
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
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  // Newest first by default; column headers re-sort from there.
  const sortOrder = 'newest' as 'newest' | 'oldest'
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
   const [saving, setSaving] = useState(false)
   const [statusUpdating, setStatusUpdating] = useState(false)
   const [repairModalOpen, setRepairModalOpen] = useState(false)
  const [repairReason, setRepairReason] = useState('')
  const [repairCharge, setRepairCharge] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)
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
  }, [tickets, search, filterStatus, filterCategory, sortOrder])

const counts = useMemo(() => {
    const total = tickets.length
    const submitted = tickets.filter((t) => t.status === 'Submitted').length
    const accepted = tickets.filter((t) => t.status === 'Accepted').length
    const received = tickets.filter((t) => t.status === 'Received').length
    const inProgress = tickets.filter((t) => ['Repair In Progress', 'Diagnosing', 'Waiting for Parts', 'Quality Check'].includes(t.status)).length
    const delivered = tickets.filter((t) => t.status === 'Delivered').length
    const cancelled = tickets.filter((t) => t.status === 'Cancelled').length
    const rejected = tickets.filter((t) => t.status === 'Rejected').length
    const completed = tickets.filter((t) => ['Ready for Delivery', 'Delivered'].includes(t.status)).length
    return { total, Submitted: submitted, Accepted: accepted, Received: received, 'Repair In Progress': inProgress, Delivered: delivered, Cancelled: cancelled, completed, Rejected: rejected }
  }, [tickets])

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

  const table = useTable(filteredTickets, {
    resetKey: `${search}|${filterStatus}|${filterCategory}`,
    sorters: {
      id: (t) => t.repairId,
      customer: (t) => t.customerName,
      device: (t) => `${t.deviceBrand} ${t.deviceModel}`,
      issue: (t) => t.issueCategory,
      tech: (t) => getTechName(t.technicianId),
      cost: (t) => t.estimatedCost,
      created: (t) => new Date(t.createdAt).getTime() || 0,
      status: (t) => statusConfig[t.status]?.label ?? t.status,
    },
  })
  const th = { sort: table.sort, onSort: table.toggleSort }

  const exportTickets = () =>
    exportCsv(
      'online-bookings',
      ['Ticket ID', 'Customer', 'Mobile', 'Category', 'Brand', 'Model', 'Issue', 'Technician', 'Estimated cost (INR)', 'Status', 'Created'],
      table.sorted.map((t) => [t.repairId, t.customerName, t.customerMobile, t.deviceCategory, t.deviceBrand, t.deviceModel, t.issueCategory,
        getTechName(t.technicianId), t.estimatedCost, statusConfig[t.status]?.label ?? t.status, t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : '']),
    )

  const openViewModal = async (ticket: RepairTicket) => {
    try { const full = await repairService.getById(ticket.id); setSelectedTicket(full) }
    catch { setSelectedTicket(ticket) }
    setViewModalOpen(true)
  }

  const statusIndex = (status: string) => {
    const idx = timelineSteps.indexOf(status)
    return idx >= 0 ? idx : -1
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Online Booking"
        actions={
          <>
            <SearchBox value={search} onChange={setSearch} placeholder="Search ticket, customer, device" />
            <ShowingSelect value={table.pageSize} onChange={table.setPageSize} />
            <FilterMenu
              activeCount={(filterStatus ? 1 : 0) + (filterCategory ? 1 : 0)}
              onReset={() => { setFilterStatus(''); setFilterCategory('') }}
            >
              <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus}
                options={[{ value: '', label: 'All status' }, ...statusOptions.map((s) => ({ value: s, label: statusConfig[s].label }))]} />
              <FilterSelect label="Device category" value={filterCategory} onChange={setFilterCategory}
                options={[{ value: '', label: 'All categories' }, ...deviceCategories.map((c) => ({ value: c, label: c }))]} />
            </FilterMenu>
            <ExportBtn onClick={exportTickets} disabled={filteredTickets.length === 0} />
            <Btn variant="primary" className="h-11 px-5" icon={<FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
              onClick={() => { fetchTickets(); onRefresh() }}>
              Refresh
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard loading={loading && !tickets.length} label="Total bookings" tone="brand" icon={<FiBarChart2 size={16} />} value={counts.total} />
        <KpiCard loading={loading && !tickets.length} label="New requests" tone="warning" icon={<FiSend size={16} />} value={counts.Submitted} hint="Waiting for review" />
        <KpiCard loading={loading && !tickets.length} label="In progress" tone="info" icon={<FiTool size={16} />} value={counts['Repair In Progress'] + counts.Accepted + counts.Received} />
        <KpiCard loading={loading && !tickets.length} label="Delivered" tone="success" icon={<FiCheckCircle size={16} />} value={counts.Delivered} />
        <KpiCard loading={loading && !tickets.length} label="Rejected / cancelled" tone="danger" icon={<FiX size={16} />} value={counts.Rejected + counts.Cancelled} />
      </div>

      {loading && !tickets.length ? (
        <div className="table-wrap p-4 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : filteredTickets.length === 0 ? (
        <div className="table-wrap">
          <EmptyState
            icon={<FiTool size={20} />}
            title="No bookings found"
            description={search || filterStatus || filterCategory ? 'Try adjusting your search or filters.' : 'Repair bookings from the storefront appear here.'}
          />
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="min-w-[1000px] [&_td]:!px-4 [&_th]:!px-4">
              <thead>
                <tr>
                  <SortTh label="Ticket ID" sortKey="id" {...th} />
                  <SortTh label="Customer" sortKey="customer" {...th} />
                  <SortTh label="Device" sortKey="device" {...th} />
                  <SortTh label="Issue" sortKey="issue" {...th} />
                  <SortTh label="Technician" sortKey="tech" {...th} />
                  <SortTh label="Cost" sortKey="cost" {...th} />
                  <SortTh label="Created" sortKey="created" {...th} />
                  <SortTh label="Status" sortKey="status" {...th} />
                  <SortTh label="Action" align="center" />
                </tr>
              </thead>
              <tbody>
                {table.rows.map((ticket) => (
                  <tr key={ticket.id} className="cursor-pointer" onClick={() => openViewModal(ticket)}>
                    <td className="whitespace-nowrap">#{ticket.repairId}</td>
                    <td>
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <Thumb name={ticket.customerName} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate max-w-[160px]">{ticket.customerName}</p>
                          <p className="text-xs text-text-muted">{ticket.customerMobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <p className="text-text-primary">{ticket.deviceBrand} {ticket.deviceModel}</p>
                      <p className="text-xs text-text-muted">{ticket.deviceCategory || '—'}</p>
                    </td>
                    <td><span className="inline-block truncate max-w-[130px] align-middle" title={ticket.issueCategory}>{ticket.issueCategory}</span></td>
                    <td className="whitespace-nowrap">{getTechName(ticket.technicianId)}</td>
                    <td className="whitespace-nowrap">₹{ticket.estimatedCost.toLocaleString('en-IN')}</td>
                    <td className="whitespace-nowrap">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td><StatusBadge status={ticket.status} /></td>
                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                      <RowMenu
                        label={`Actions for ${ticket.repairId}`}
                        items={[{ label: 'View details', icon: <FiEye size={15} />, onClick: () => openViewModal(ticket) }]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} summary={`${table.total} of ${tickets.length} bookings`} />
        </div>
      )}

      {/* VIEW MODAL */}
      <AnimatePresence>
        {viewModalOpen && selectedTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewModalOpen(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-border bg-white/95 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><FiEye size={18} className="text-primary" /></div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary">Ticket Details</h3>
                    <p className="text-xs font-mono text-primary">{selectedTicket.repairId}</p>
                  </div>
                </div>
                <button onClick={() => setViewModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-gray-200 transition-all"
                ><FiX size={16} /></button>
              </div>

              <div className="p-5 space-y-5">
                {/* CUSTOMER */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-gray-50/60 border border-border p-4">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiUser size={12} /> Customer</h4>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-text-primary">{selectedTicket.customerName}</p>
                      <p className="text-xs text-text-muted flex items-center gap-1.5"><FiPhone size={11} />{selectedTicket.customerMobile}</p>
                      {selectedTicket.customerAlt && <p className="text-xs text-text-muted flex items-center gap-1.5"><FiPhone size={11} />Alt: {selectedTicket.customerAlt}</p>}
                      {selectedTicket.customerEmail && <p className="text-xs text-text-muted flex items-center gap-1.5"><FiMail size={11} />{selectedTicket.customerEmail}</p>}
                      {selectedTicket.customerAddress && <p className="text-xs text-text-muted flex items-center gap-1.5"><FiMapPin size={11} />{selectedTicket.customerAddress}</p>}
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50/60 border border-border p-4">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiSmartphone size={12} /> Device</h4>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-text-primary">{selectedTicket.deviceBrand} {selectedTicket.deviceModel}</p>
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
                  <div className="rounded-xl bg-gray-50/60 border border-border p-4">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiAlertTriangle size={12} /> Issue Details</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-text-primary">{selectedTicket.issueCategory}</p>
                        <p className="text-xs text-text-secondary">{selectedTicket.description}</p>
                      </div>
                      {parseQAPairs(selectedTicket.description).length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border">
                          {parseQAPairs(selectedTicket.description).map((qa, i) => (
                            <div key={i} className="space-y-0.5">
                              <p className="text-[11px] font-semibold text-text-muted">Q: {qa.question}</p>
                              <p className="text-[11px] text-text-secondary pl-3 border-l-2 border-primary/20">A: {qa.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 pt-1">
                        <p className={`text-xs font-semibold ${priorityColors[selectedTicket.priority] || 'text-slate-400'}`}>Priority: {selectedTicket.priority}</p>
                        {selectedTicket.accessories && <p className="text-xs text-text-muted">Accessories: {selectedTicket.accessories}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50/60 border border-border p-4">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiDollarSign size={12} /> Repair</h4>
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-primary">₹{selectedTicket.estimatedCost.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-text-muted">Est. Completion: {selectedTicket.estimatedDays} day{selectedTicket.estimatedDays > 1 ? 's' : ''}</p>
                      <p className="text-xs text-text-muted flex items-center gap-1.5"><FiUser size={11} />Technician: {getTechName(selectedTicket.technicianId)}</p>
                      <div className="pt-1"><StatusBadge status={selectedTicket.status} /></div>
                    </div>
                  </div>
                </div>

                {/* OTHER DETAILS */}
                {(selectedTicket.deviceCondition || selectedTicket.warranty || selectedTicket.password || selectedTicket.customerAlt || selectedTicket.customerEmail || selectedTicket.customerAddress) && (
                  <div className="rounded-xl bg-gray-50/60 border border-border p-4">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiPackage size={12} /> Other Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedTicket.deviceCondition && <div><p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Device Condition</p><p className="text-xs text-text-primary">{selectedTicket.deviceCondition}</p></div>}
                      {selectedTicket.warranty && <div><p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Warranty</p><p className="text-xs text-text-primary">{selectedTicket.warranty}</p></div>}
                      {selectedTicket.password && <div><p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Device Password</p><p className="text-xs text-text-primary">{selectedTicket.password}</p></div>}
                      {selectedTicket.customerAlt && <div><p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Alt. Mobile</p><p className="text-xs text-text-primary">{selectedTicket.customerAlt}</p></div>}
                      {selectedTicket.customerEmail && <div><p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Email</p><p className="text-xs text-text-primary">{selectedTicket.customerEmail}</p></div>}
                      {selectedTicket.customerAddress && <div className="sm:col-span-2"><p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Address</p><p className="text-xs text-text-primary">{selectedTicket.customerAddress}</p></div>}
                    </div>
                  </div>
                )}

                {/* PHOTOS */}
                {selectedTicket.images.length > 0 && (
                  <div className="rounded-xl bg-gray-50/60 border border-border p-4">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiCamera size={12} /> Device Photos</h4>
                    <PhotoThumbnails images={selectedTicket.images} />
                  </div>
                )}

                {/* STATUS TIMELINE */}
                <div className="rounded-xl bg-gray-50/60 border border-border p-4">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2"><FiClock size={12} /> Status Timeline</h4>
                  <div className="relative">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
                    <div className="space-y-0">
                      {timelineSteps.map((step, idx) => {
                        const currentIdx = statusIndex(selectedTicket.status)
                        const isCompleted = idx <= currentIdx && currentIdx >= 0
                        const isActive = idx === currentIdx
                        return (
                          <div key={step} className="flex items-center gap-3 py-2">
                            <div className={`relative z-10 w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0 ${
                              isActive ? 'bg-primary shadow-lg shadow-primary/30' :
                              isCompleted ? 'bg-primary/20' : 'bg-gray-200'
                            }`}>
                              {isCompleted ? <FiCheckCircle size={12} className="text-primary" /> :
                               isActive ? <div className="w-2 h-2 rounded-[8px] bg-white" /> :
                               <div className="w-1.5 h-1.5 rounded-[8px] bg-gray-400" />}
                            </div>
                            <span className={`text-xs font-medium ${
                              isActive ? 'text-text-primary font-semibold' : isCompleted ? 'text-primary' : 'text-text-muted'
                            }`}>{step}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border text-[11px] text-text-muted">
                    Created: {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString('en-IN') : '—'}
                  </div>
                </div>

                {/* ADMIN ACTIONS */}
                {(() => {
                  const status = selectedTicket.status
                  const nextStatuses = STATUS_TRANSITIONS[status]
                  if (!nextStatuses || nextStatuses.length === 0) return null
                  return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/10"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Update Status</h4>
                        <StatusBadge status={status} />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {nextStatuses.map((nextStatus) => (
                          <motion.button
                            key={nextStatus}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                              if (nextStatus === 'Rejected') {
                                const reason = prompt('Rejection reason:')
                                if (!reason) return
                                setStatusUpdating(true)
                                try {
                                  await repairService.rejectTicket(selectedTicket.id, reason)
                                  setToast({ message: `Ticket ${selectedTicket.repairId} rejected`, type: 'success' })
                                  await fetchTickets(); onRefresh()
                                  setViewModalOpen(false)
                                } catch { setToast({ message: 'Failed to reject ticket', type: 'error' }) }
                                setStatusUpdating(false)
                                return
                              }
                              if (nextStatus === 'Diagnosing' && selectedTicket.status === 'Received') {
                                setRepairReason(''); setRepairCharge(''); setRepairModalOpen(true)
                                return
                              }
                              setStatusUpdating(true)
                              try {
                                const backendStatus = STATUS_TO_BACKEND[nextStatus]
                                const updated = await repairService.updateStatus(selectedTicket.id, backendStatus, `Status updated to ${nextStatus}`)
                                setSelectedTicket(updated)
                                setTickets((prev) => prev.map(t => t.id === selectedTicket.id ? updated : t))
                                setToast({ message: `Status updated to "${nextStatus}"`, type: 'success' })
                                await fetchTickets(); onRefresh()
                              } catch (err: any) {
                                const msg = err?.response?.data?.message || err?.message || 'Failed to update status'
                                setToast({ message: msg, type: 'error' })
                              }
                              setStatusUpdating(false)
                            }}
                            disabled={statusUpdating}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                              nextStatus === 'Rejected'
                                ? 'bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20'
                                : 'bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20'
                            }`}
                          >
                            {statusUpdating ? 'Updating...' : nextStatus === 'Accepted' ? 'Accept' : `Mark ${nextStatus}`}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REPAIR ESTIMATE MODAL */}
      <AnimatePresence>
        {repairModalOpen && selectedTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setRepairModalOpen(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg rounded-2xl bg-white border border-border shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center"><FiAlertTriangle size={18} className="text-warning" /></div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Repair Estimate</h3>
                  <p className="text-xs font-mono text-text-muted">{selectedTicket.repairId}</p>
                </div>
                <button onClick={() => setRepairModalOpen(false)} className="ml-auto w-8 h-8 rounded-[8px] bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"><FiX size={14} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Repair Reason / Diagnosis <span className="text-danger">*</span></label>
                  <textarea value={repairReason} onChange={(e) => setRepairReason(e.target.value)} rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-border text-sm text-text-primary outline-none focus:border-primary/40 transition-all resize-none"
                    placeholder="Describe what needs to be repaired..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Repair Charge <span className="text-danger">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted font-semibold">₹</span>
                    <input value={repairCharge} onChange={(e) => setRepairCharge(e.target.value.replace(/[^0-9.]/g, ''))}
                      className="w-full h-11 pl-8 pr-4 rounded-xl bg-gray-50 border border-border text-sm text-text-primary outline-none focus:border-primary/40 transition-all"
                      placeholder="0.00" type="text" inputMode="decimal"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button onClick={() => setRepairModalOpen(false)} className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-text-muted hover:bg-gray-50 transition">Cancel</button>
                <button onClick={async () => {
                  if (!repairReason.trim() || !repairCharge.trim()) {
                    setToast({ message: 'Please provide a reason and charge', type: 'error' })
                    return
                  }
                  setStatusUpdating(true)
                  try {
                    const charge = parseFloat(repairCharge)
                    if (isNaN(charge) || charge <= 0) {
                      setToast({ message: 'Enter a valid repair charge', type: 'error' })
                      setStatusUpdating(false)
                      return
                    }
                    const updated = await repairService.updateStatus(
                      selectedTicket.id, 'awaiting_approval',
                      `Repair estimate: ${repairReason.trim()}`,
                      repairReason.trim(), charge,
                    )
                    setSelectedTicket(updated)
                    setTickets((prev) => prev.map(t => t.id === selectedTicket.id ? updated : t))
                    setToast({ message: 'Repair estimate sent for customer approval', type: 'success' })
                    setRepairModalOpen(false)
                    await fetchTickets(); onRefresh()
                  } catch (err: any) {
                    const msg = err?.response?.data?.message || err?.message || 'Failed to send estimate'
                    setToast({ message: msg, type: 'error' })
                  }
                  setStatusUpdating(false)
                }} disabled={statusUpdating}
                  className="flex-1 h-11 rounded-xl text-sm font-bold text-white transition"
                  style={{ background: statusUpdating ? '#9CA3AF' : 'linear-gradient(135deg, #CB202D, #A81D2A)' }}
                >{statusUpdating ? 'Sending...' : 'Send for Approval'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editModalOpen && selectedTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditModalOpen(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-border bg-white/95 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><FiEdit2 size={18} className="text-primary" /></div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary">Edit Repair Ticket</h3>
                    <p className="text-xs font-mono text-primary">{selectedTicket.repairId}</p>
                  </div>
                </div>
                <button onClick={() => setEditModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-gray-200 transition-all"
                ><FiX size={16} /></button>
              </div>

              <div className="p-5 space-y-5">
                {/* CUSTOMER SECTION */}
                <div className="rounded-xl bg-gray-50/60 border border-border p-4">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiUser size={12} /> Customer Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Customer Name</label>
                      <input value={editForm.customerName} onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Mobile Number</label>
                      <input value={editForm.customerMobile} onChange={(e) => setEditForm({ ...editForm, customerMobile: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Alternate Number</label>
                      <input value={editForm.customerAlt} onChange={(e) => setEditForm({ ...editForm, customerAlt: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
                      <input value={editForm.customerEmail} onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Address</label>
                      <input value={editForm.customerAddress} onChange={(e) => setEditForm({ ...editForm, customerAddress: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* DEVICE SECTION */}
                <div className="rounded-xl bg-gray-50/60 border border-border p-4">
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
                        className="w-full h-10 px-4 rounded-xl bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">IMEI Number</label>
                      <input value={editForm.imei} onChange={(e) => setEditForm({ ...editForm, imei: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Serial Number</label>
                      <input value={editForm.serial} onChange={(e) => setEditForm({ ...editForm, serial: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Device Color</label>
                      <input value={editForm.deviceColor} onChange={(e) => setEditForm({ ...editForm, deviceColor: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
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
                <div className="rounded-xl bg-gray-50/60 border border-border p-4">
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
                        rows={3} className="w-full px-4 py-3 rounded-xl bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all resize-none shadow-sm"
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
                        className="w-full h-10 px-4 rounded-xl bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* REPAIR SECTION */}
                <div className="rounded-xl bg-gray-50/60 border border-border p-4">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2"><FiTool size={12} /> Repair Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Estimated Cost (₹)</label>
                      <input type="number" value={editForm.estimatedCost} onChange={(e) => setEditForm({ ...editForm, estimatedCost: Number(e.target.value) || 0 })}
                        className="w-full h-10 px-4 rounded-xl bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Est. Completion Days</label>
                      <input type="number" value={editForm.estimatedDays} onChange={(e) => setEditForm({ ...editForm, estimatedDays: Number(e.target.value) || 1 })}
                        className="w-full h-10 px-4 rounded-xl bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
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
                        className="w-full h-10 px-4 rounded-xl bg-white border border-border text-sm text-text-primary outline-none appearance-none cursor-pointer focus:border-primary/40 transition-all shadow-sm"
                      >{statusOptions.map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}</select>
                    </div>
                  </div>
                </div>

                {/* PHOTOS SECTION */}
                <div className="rounded-xl bg-gray-50/60 border border-border p-4">
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
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-dashed border-border text-xs text-text-secondary hover:text-text-primary hover:border-primary/40 transition-all shadow-sm"
                    ><FiImage size={14} /> Add Photos</motion.button>
                  </div>
                  {editImagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-3">
                      {editImagePreviews.map((url, i) => (
                        <div key={i} className="relative group aspect-square rounded-lg bg-gray-50 border border-border overflow-hidden">
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

              <div className="sticky bottom-0 flex items-center justify-end gap-3 p-5 border-t border-border bg-white/95 backdrop-blur-xl">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-gray-50 transition-all cursor-pointer"
                >Cancel</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleEditSubmit} disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 transition-all cursor-pointer"
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
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteModalOpen(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md rounded-2xl bg-white border border-border shadow-2xl p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4"
              ><FiAlertTriangle size={28} className="text-danger" /></motion.div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Delete Ticket</h3>
              <p className="text-sm text-text-muted mb-2">
                Are you sure you want to delete ticket <span className="font-mono font-semibold text-danger">{selectedTicket.repairId}</span>?
              </p>
              <p className="text-xs text-text-muted mb-6">This action cannot be undone.</p>
              <div className="flex items-center justify-center gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-gray-50 transition-all cursor-pointer"
                >Cancel</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDelete} disabled={deleting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-danger text-white text-sm font-semibold shadow-lg shadow-danger/25 disabled:opacity-50 transition-all cursor-pointer"
                ><FiTrash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

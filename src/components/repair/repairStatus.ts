import type { RepairTicket } from '../../services/repairService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export type StatusTone = 'pending' | 'action' | 'progress' | 'done' | 'closed'

export interface StatusMeta {
  label: string
  tone: StatusTone
  /** One line, written for the customer, explaining what is happening now. */
  hint: string
  icon: string
}

export const STATUS_META: Record<string, StatusMeta> = {
  Submitted: { label: 'Request received', tone: 'pending', icon: 'schedule', hint: 'We are reviewing your request and will confirm it shortly.' },
  Accepted: { label: 'Accepted', tone: 'progress', icon: 'task_alt', hint: 'Your repair is confirmed. Send or drop off your device to get started.' },
  Received: { label: 'Device received', tone: 'progress', icon: 'inventory_2', hint: 'Your device has reached our service bench.' },
  'Awaiting Approval': { label: 'Estimate ready', tone: 'action', icon: 'request_quote', hint: 'Review the diagnosis and approve the estimate so we can start.' },
  Diagnosing: { label: 'Diagnosing', tone: 'progress', icon: 'troubleshoot', hint: 'A technician is inspecting your device.' },
  'Waiting for Parts': { label: 'Waiting for parts', tone: 'progress', icon: 'hourglass_top', hint: 'We have ordered the parts needed for your repair.' },
  'Repair In Progress': { label: 'Repairing', tone: 'progress', icon: 'build', hint: 'Your device is being repaired.' },
  'Quality Check': { label: 'Quality check', tone: 'progress', icon: 'verified', hint: 'Final testing before we hand it back.' },
  'Ready for Delivery': { label: 'Ready for pickup', tone: 'done', icon: 'storefront', hint: 'Your device is repaired and ready to collect.' },
  Delivered: { label: 'Delivered', tone: 'done', icon: 'done_all', hint: 'Repair completed and delivered.' },
  Rejected: { label: 'Not accepted', tone: 'closed', icon: 'block', hint: 'We could not take this repair. Check messages for details.' },
  Cancelled: { label: 'Cancelled', tone: 'closed', icon: 'cancel', hint: 'This repair request was cancelled.' },
}

export function statusMeta(status: string): StatusMeta {
  return STATUS_META[status] ?? { label: status || 'Unknown', tone: 'pending', icon: 'help', hint: '' }
}

/** Customer-facing journey, collapsed from the 12 back-office statuses. */
export const STAGES = [
  { key: 'booked', label: 'Booked', icon: 'event_available' },
  { key: 'received', label: 'Received', icon: 'inventory_2' },
  { key: 'diagnosis', label: 'Diagnosis', icon: 'troubleshoot' },
  { key: 'repair', label: 'Repair', icon: 'build' },
  { key: 'ready', label: 'Ready', icon: 'storefront' },
  { key: 'delivered', label: 'Delivered', icon: 'done_all' },
] as const

const STAGE_INDEX: Record<string, number> = {
  Submitted: 0,
  Accepted: 0,
  Received: 1,
  'Awaiting Approval': 2,
  Diagnosing: 2,
  'Waiting for Parts': 2,
  'Repair In Progress': 3,
  'Quality Check': 3,
  'Ready for Delivery': 4,
  Delivered: 5,
}

/** Index into STAGES, or -1 for closed tickets. */
export function stageIndex(status: string): number {
  return STAGE_INDEX[status] ?? -1
}

export function isClosed(t: RepairTicket): boolean {
  return t.status === 'Rejected' || t.status === 'Cancelled'
}

export function isCompleted(t: RepairTicket): boolean {
  return t.status === 'Delivered'
}

export function needsShipping(t: RepairTicket): boolean {
  return t.status === 'Accepted' && !t.courier
}

export function needsAction(t: RepairTicket): boolean {
  return t.status === 'Awaiting Approval' || needsShipping(t)
}

export function canCancel(t: RepairTicket): boolean {
  return t.status === 'Submitted' || t.status === 'Accepted'
}

export type FilterKey = 'all' | 'action' | 'active' | 'completed' | 'closed'

export const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'action', label: 'Needs action' },
  { key: 'active', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'closed', label: 'Closed' },
]

export function matchesFilter(t: RepairTicket, f: FilterKey): boolean {
  switch (f) {
    case 'action': return needsAction(t)
    case 'active': return !isClosed(t) && !isCompleted(t)
    case 'completed': return isCompleted(t)
    case 'closed': return isClosed(t)
    default: return true
  }
}

/** The amount the customer should expect to pay: the approved charge if quoted, else the estimate. */
export function ticketAmount(t: RepairTicket): number | null {
  if (t.repairCharge && t.repairCharge > 0) return t.repairCharge
  if (t.estimatedCost > 0) return t.estimatedCost
  return null
}

export function lastActivity(t: RepairTicket): string {
  return t.lastUpdate?.created_at || t.updatedAt || t.createdAt
}

export function resolveMediaUrl(src: string): string {
  if (/^(https?:|data:|blob:)/.test(src)) return src
  return `${API_BASE_URL.replace(/\/$/, '')}/${src.replace(/^\//, '')}`
}

export function formatPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export function timeAgo(dateStr: string, now = Date.now()): string {
  if (!dateStr) return ''
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return ''
  const s = Math.max(0, Math.round((now - then) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  return formatDate(dateStr)
}

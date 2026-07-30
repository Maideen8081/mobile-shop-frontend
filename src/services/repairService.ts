import api from './api'

const REPAIRS_URL = '/api/v1/repairs'

export interface RepairService {
  id: number
  name: string
  slug: string
  description: string
  estimated_price: number
  estimated_days: number
  is_active: boolean
}

export interface RepairNote {
  id: number
  message: string
  author_name: string
  is_admin: boolean
  created_at: string
}

export interface RepairStatusHistory {
  id: number
  status: string
  notes: string
  created_at: string
}

export interface CourierDetails {
  courier_name: string
  tracking_number: string
  courier_date: string
  courier_notes: string
}

export interface RepairTicket {
  id: number
  repairId: string
  customerName: string
  customerMobile: string
  customerAlt: string
  customerEmail: string
  customerAddress: string
  deviceCategory: string
  deviceBrand: string
  deviceModel: string
  imei: string
  serialNumber: string
  deviceColor: string
  deviceCondition: string
  warranty: string
  repairReason: string
  repairCharge: number | null
  customerApproved: boolean
  issueCategory: string
  description: string
  priority: string
  accessories: string
  password: string
  status: string
  estimatedCost: number
  estimatedDays: number
  technicianId: number | null
  technicianName: string
  source: string
  createdAt: string
  updatedAt: string
  images: string[]
  notes: RepairNote[]
  statusHistory: RepairStatusHistory[]
  courier: CourierDetails | null
  adminNotes: string
}

export interface RepairDashboardCounts {
  active_repairs: number
  devices_received_today: number
  in_progress: number
  waiting_for_parts: number
  ready_for_delivery: number
  delivered_today: number
  pending_approval: number
  technician_workload: number
}

function unwrapData<T>(res: { data: any }): T {
  const body = res.data
  return body?.success === true && 'data' in body ? body.data : body
}

function mapBackendStatus(status: string, statusLabel: string): string {
  const map: Record<string, string> = {
    pending: 'Submitted',
    accepted: 'Accepted',
    rejected: 'Rejected',
    device_received: 'Received',
    received: 'Received',
    awaiting_approval: 'Awaiting Approval',
    inspection: 'Diagnosing',
    diagnosing: 'Diagnosing',
    waiting_parts: 'Waiting for Parts',
    waiting_for_parts: 'Waiting for Parts',
    repair_in_progress: 'Repair In Progress',
    quality_check: 'Quality Check',
    ready_for_pickup: 'Ready for Delivery',
    ready_for_delivery: 'Ready for Delivery',
    shipped: 'Delivered',
    delivered: 'Delivered',
    completed: 'Delivered',
    cancelled: 'Cancelled',
  }
  if (map[status.toLowerCase()] !== undefined) return map[status.toLowerCase()]
  return statusLabel || status || 'Received'
}

function normalizeTicket(raw: any): RepairTicket {
  return {
    id: raw.id,
    repairId: raw.ticket_number ?? raw.repair_id ?? raw.repairId ?? `RPR-${raw.id}`,
    customerName: raw.customer_name ?? raw.customerName ?? '',
    customerMobile: raw.customer_mobile ?? raw.customerMobile ?? raw.mobile_number ?? '',
    customerAlt: raw.customer_alternate_mobile ?? raw.customerAlt ?? '',
    customerEmail: raw.customer_email ?? raw.customerEmail ?? raw.email ?? '',
    customerAddress: raw.customer_address ?? raw.customerAddress ?? raw.address ?? '',
    deviceCategory: raw.device_category ?? raw.deviceCategory ?? '',
    deviceBrand: raw.device_brand ?? raw.deviceBrand ?? '',
    deviceModel: raw.device_model ?? raw.deviceModel ?? '',
    imei: raw.imei_number ?? raw.imei ?? '',
    serialNumber: raw.serial_number ?? raw.serialNumber ?? '',
    deviceColor: raw.device_color ?? raw.deviceColor ?? '',
    deviceCondition: raw.device_condition ?? raw.deviceCondition ?? '',
    warranty: raw.warranty_status ?? raw.warranty ?? '',
    repairReason: raw.repair_reason ?? raw.repairReason ?? '',
    repairCharge: raw.repair_charge !== undefined && raw.repair_charge !== null ? Number(raw.repair_charge) : null,
    customerApproved: raw.customer_approved ?? raw.customerApproved ?? false,
    issueCategory: raw.issue_category ?? raw.issueCategory ?? '',
    description: raw.problem_description ?? raw.description ?? '',
    priority: raw.priority ? (raw.priority.charAt(0).toUpperCase() + raw.priority.slice(1)) : 'Medium',
    accessories: raw.accessories_submitted ?? raw.accessories ?? '',
    password: raw.device_password ?? raw.password ?? '',
    status: mapBackendStatus(raw.status, raw.status_label),
    estimatedCost: Number(raw.estimated_cost ?? raw.estimatedCost ?? 0),
    estimatedDays: Number(raw.estimated_days ?? raw.estimatedDays ?? 1),
    technicianId: raw.assigned_technician ?? raw.technician_id ?? raw.technicianId ?? null,
    technicianName: raw.technician_name ?? raw.technicianName ?? '',
    source: raw.source ?? 'online',
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
    images: Array.isArray(raw.photos)
      ? raw.photos.map((img: any) => (typeof img === 'string' ? img : img.image ?? img.photo ?? ''))
      : Array.isArray(raw.images)
        ? raw.images.map((img: any) => (typeof img === 'string' ? img : img.image ?? ''))
        : [],
    notes: Array.isArray(raw.notes)
      ? raw.notes.map((n: any) => ({
          id: n.id,
          message: n.message,
          author_name: n.author_name ?? '',
          is_admin: n.is_admin ?? false,
          created_at: n.created_at ?? '',
        }))
      : [],
    statusHistory: Array.isArray(raw.status_history)
      ? raw.status_history.map((h: any) => ({
          id: h.id,
          status: h.status ?? '',
          notes: h.notes ?? '',
          created_at: h.created_at ?? '',
        }))
      : Array.isArray(raw.statusHistory)
        ? raw.statusHistory
        : [],
    courier: raw.courier_details || raw.courier || null,
    adminNotes: raw.admin_notes || '',
  }
}

function toArray(data: any): any[] {
  if (Array.isArray(data)) return data
  if (data?.results && Array.isArray(data.results)) return data.results
  if (data?.results?.data && Array.isArray(data.results.data)) return data.results.data
  if (data?.data && Array.isArray(data.data)) return data.data
  return []
}

export const repairService = {
  getServices: () =>
    api.get(`${REPAIRS_URL}/services/`).then((r) => {
      const raw = unwrapData<any>(r as any)
      return toArray(raw).map((s: any): RepairService => ({
        id: s.id,
        name: s.name ?? '',
        slug: s.slug ?? '',
        description: s.description ?? '',
        estimated_price: Number(s.estimated_price ?? s.price ?? 0),
        estimated_days: Number(s.estimated_days ?? s.days ?? 1),
        is_active: s.is_active ?? true,
      }))
    }),

  list: () =>
    api.get(`${REPAIRS_URL}/`).then((r) =>
      toArray(unwrapData<any>(r as any)).map(normalizeTicket),
    ),

  myTickets: () =>
    api.get(`${REPAIRS_URL}/my-tickets/`).then((r) =>
      toArray(unwrapData<any>(r as any)).map(normalizeTicket),
    ),

  getTicketById: (id: number) =>
    api.get(`${REPAIRS_URL}/my-tickets/${id}/`).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  create: (formData: FormData) =>
    api.post(`${REPAIRS_URL}/book/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  adminCreate: (formData: FormData) =>
    api.post(`${REPAIRS_URL}/create/`, formData).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  update: (id: number, formData: FormData) =>
    api.patch(`${REPAIRS_URL}/${id}/`, formData).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  getById: (id: number) =>
    api.get(`${REPAIRS_URL}/${id}/`).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  delete: (id: number) =>
    api.delete(`${REPAIRS_URL}/${id}/`).then((r) => r.data),

  dashboardCounts: () =>
    api.get(`${REPAIRS_URL}/dashboard-counts/`).then((r) =>
      unwrapData<RepairDashboardCounts>(r as any),
    ),

  updateStatus: (id: number, status: string, notes?: string, repairReason?: string, repairCharge?: number) =>
    api.put(`${REPAIRS_URL}/${id}/status/`, { status, notes, repair_reason: repairReason, repair_charge: repairCharge }).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  assignTechnician: (id: number, technicianId: number) =>
    api.put(`${REPAIRS_URL}/${id}/assign-technician/`, { technician_id: technicianId }).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  listNotes: (ticketId: number) =>
    api.get(`${REPAIRS_URL}/${ticketId}/notes/`).then((r) => {
      const raw = unwrapData<any[]>(r as any)
      return Array.isArray(raw) ? raw.map((n: any) => ({
        id: n.id,
        message: n.message,
        author_name: n.author_name ?? '',
        is_admin: n.is_admin ?? false,
        created_at: n.created_at ?? '',
      })) : []
    }),

  createNote: (ticketId: number, message: string, authorName: string, isAdmin: boolean) =>
    api.post(`${REPAIRS_URL}/${ticketId}/notes/create/`, {
      message,
      author_name: authorName,
      is_admin: isAdmin,
    }).then((r) => {
      const raw = unwrapData<any>(r as any)
      return {
        id: raw.id,
        message: raw.message,
        author_name: raw.author_name ?? '',
        is_admin: raw.is_admin ?? false,
        created_at: raw.created_at ?? '',
      }
    }),

  submitCourier: (ticketId: number, courier: CourierDetails) =>
    api.put(`${REPAIRS_URL}/${ticketId}/courier/`, courier).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  acceptTicket: async (ticketId: number, notes?: string) => {
    return api.put(`${REPAIRS_URL}/${ticketId}/status/`, { status: 'accepted', notes: notes || 'Ticket accepted by admin' }).then((r) => normalizeTicket(unwrapData<any>(r as any)))
  },

  rejectTicket: async (ticketId: number, reason: string) => {
    return api.put(`${REPAIRS_URL}/${ticketId}/status/`, { status: 'rejected', notes: reason }).then((r) => normalizeTicket(unwrapData<any>(r as any)))
  },

  markReceived: (ticketId: number, notes?: string) =>
    api.put(`${REPAIRS_URL}/${ticketId}/status/`, {
      status: 'received',
      notes: notes || 'Device received by admin',
    }).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  customerApprove: (ticketId: number, notes?: string) =>
    api.post(`${REPAIRS_URL}/${ticketId}/customer-approve/`, { action: 'approve', notes: notes || 'Customer approved the repair estimate' }).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  customerDecline: (ticketId: number, notes?: string) =>
    api.post(`${REPAIRS_URL}/${ticketId}/customer-approve/`, { action: 'decline', notes: notes || 'Customer declined the repair estimate' }).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  getNotifications: () =>
    api.get(`${REPAIRS_URL}/notifications/`).then((r) => {
      const raw = unwrapData<any>(r as any)
      return toArray(raw).map((n: any) => ({
        id: n.id,
        title: n.title ?? '',
        message: n.message ?? '',
        is_read: n.is_read ?? false,
        created_at: n.created_at ?? '',
        ticket_id: n.ticket_id ?? n.repair_ticket ?? null,
      }))
    }),

  markNotificationRead: (id: number) =>
    api.put(`${REPAIRS_URL}/notifications/${id}/read/`).then((r) => r.data),

  markAllNotificationsRead: () =>
    api.put(`${REPAIRS_URL}/notifications/read-all/`).then((r) => r.data),
}

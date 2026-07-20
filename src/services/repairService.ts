import api from './api'

const REPAIRS_URL = '/api/v1/repairs'

export interface RepairNote {
  id: number
  message: string
  author_name: string
  is_admin: boolean
  created_at: string
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
  issueCategory: string
  description: string
  priority: string
  accessories: string
  password: string
  status: string
  estimatedCost: number
  estimatedDays: number
  technicianId: number | null
  createdAt: string
  images: string[]
  notes: RepairNote[]
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

function normalizeTicket(raw: any): RepairTicket {
  return {
    id: raw.id,
    repairId: raw.repair_id ?? raw.repairId ?? raw.ticket_number ?? `#REP-${raw.id}`,
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
    issueCategory: raw.issue_category ?? raw.issueCategory ?? '',
    description: raw.problem_description ?? raw.description ?? '',
    priority: raw.priority ? (raw.priority.charAt(0).toUpperCase() + raw.priority.slice(1)) : 'Medium',
    accessories: raw.accessories_submitted ?? raw.accessories ?? '',
    password: raw.device_password ?? raw.password ?? '',
    status: raw.status ?? 'Received',
    estimatedCost: Number(raw.estimated_cost ?? raw.estimatedCost ?? 0),
    estimatedDays: Number(raw.estimated_days ?? raw.estimatedDays ?? 1),
    technicianId: raw.assigned_technician ?? raw.technicianId ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    images: Array.isArray(raw.images)
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
  }
}

function toArray(data: any): any[] {
  if (Array.isArray(data)) return data
  if (data?.results && Array.isArray(data.results)) return data.results
  if (data?.data && Array.isArray(data.data)) return data.data
  return []
}

export const repairService = {
  list: () =>
    api.get(`${REPAIRS_URL}/`).then((r) =>
      toArray(unwrapData<any>(r as any)).map(normalizeTicket),
    ),

  myRepairs: () =>
    api.get(`${REPAIRS_URL}/my-repairs/`).then((r) =>
      toArray(unwrapData<any>(r as any)).map(normalizeTicket),
    ),

  create: (formData: FormData) =>
    api.post(`${REPAIRS_URL}/create/`, formData).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  update: (id: number, formData: FormData) =>
    api.patch(`${REPAIRS_URL}/${id}/update/`, formData).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  getById: (id: number) =>
    api.get(`${REPAIRS_URL}/${id}/`).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  delete: (id: number) =>
    api.delete(`${REPAIRS_URL}/${id}/delete/`).then((r) => r.data),

  dashboardCounts: () =>
    api.get(`${REPAIRS_URL}/dashboard-counts/`).then((r) =>
      unwrapData<RepairDashboardCounts>(r as any),
    ),

  updateStatus: (id: number, status: string) =>
    api.patch(`${REPAIRS_URL}/${id}/status/`, { status }).then((r) =>
      normalizeTicket(unwrapData<any>(r as any)),
    ),

  assignTechnician: (id: number, technicianId: number) =>
    api.patch(`${REPAIRS_URL}/${id}/assign-technician/`, { technician_id: technicianId }).then((r) =>
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
}

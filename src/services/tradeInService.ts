import api from './api'

const BASE = '/api/v1/trade-ins'

export interface TradeInSubmission {
  id: number
  tradeId: string
  userId: number | null
  customerName: string
  customerMobile: string
  customerEmail: string
  deviceBrand: string
  deviceModel: string
  deviceStorage: string
  deviceCondition: string
  estimatedValue: number
  finalValue: number | null
  status: string
  adminNotes: string
  rejectionReason: string
  quotedPrice: number | null
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  updatedAt: string
}

export interface TradeInCreatePayload {
  customer_name: string
  customer_mobile: string
  customer_email?: string
  device_brand: string
  device_model: string
  device_storage?: string
  device_condition: string
  estimated_value: number
}

export interface TradeInUpdatePayload {
  status?: string
  admin_notes?: string
  final_value?: number
  rejection_reason?: string
  quoted_price?: number
  payment_method?: string
  payment_status?: string
}

export interface TradeInDashboardCounts {
  total: number
  pending: number
  reviewed: number
  accepted: number
  rejected: number
  paid: number
  totalPayout: number
}

function unwrapData<T>(res: { data: any }): T {
  const body = res.data
  return body?.success === true && 'data' in body ? body.data : body
}

function toArray(data: any): any[] {
  if (Array.isArray(data)) return data
  if (data?.results && Array.isArray(data.results)) return data.results
  if (data?.results?.data && Array.isArray(data.results.data)) return data.results.data
  if (data?.data && Array.isArray(data.data)) return data.data
  return []
}

function formatTradeId(raw: string | number): string {
  const s = String(raw).trim()
  if (!s) return ''
  if (/^TRD-/i.test(s)) return s.toUpperCase()
  const num = parseInt(s, 10)
  if (!isNaN(num)) return `TRD-${String(num).padStart(6, '0')}`
  return `TRD-${s.toUpperCase()}`
}

function normalizeTradeIn(raw: any): TradeInSubmission {
  return {
    id: raw.id,
    tradeId: formatTradeId(raw.trade_id ?? raw.id),
    userId: raw.user ?? raw.user_id ?? null,
    customerName: raw.customer_name ?? raw.customerName ?? '',
    customerMobile: raw.customer_mobile ?? raw.customerMobile ?? '',
    customerEmail: raw.customer_email ?? raw.customerEmail ?? '',
    deviceBrand: raw.device_brand ?? raw.deviceBrand ?? '',
    deviceModel: raw.device_model ?? raw.deviceModel ?? '',
    deviceStorage: raw.device_storage ?? raw.deviceStorage ?? '',
    deviceCondition: raw.device_condition ?? raw.deviceCondition ?? '',
    estimatedValue: Number(raw.estimated_value ?? raw.estimatedValue ?? 0),
    finalValue: raw.final_value != null ? Number(raw.final_value) : null,
    status: raw.status ?? 'pending',
    adminNotes: raw.admin_notes ?? raw.adminNotes ?? '',
    rejectionReason: raw.rejection_reason ?? raw.rejectionReason ?? '',
    quotedPrice: raw.quoted_price != null ? Number(raw.quoted_price) : null,
    paymentMethod: raw.payment_method ?? raw.paymentMethod ?? '',
    paymentStatus: raw.payment_status ?? raw.paymentStatus ?? 'pending',
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
  }
}

export const tradeInService = {
  list: () =>
    api.get(`${BASE}/`).then((r) =>
      toArray(unwrapData<any>(r as any)).map(normalizeTradeIn),
    ),

  getById: (id: number) =>
    api.get(`${BASE}/${id}/`).then((r) =>
      normalizeTradeIn(unwrapData<any>(r as any)),
    ),

  create: (payload: TradeInCreatePayload) =>
    api.post(`${BASE}/`, payload).then((r) =>
      normalizeTradeIn(unwrapData<any>(r as any)),
    ),

  update: (id: number, payload: TradeInUpdatePayload) =>
    api.patch(`${BASE}/${id}/`, payload).then((r) =>
      normalizeTradeIn(unwrapData<any>(r as any)),
    ),

  delete: (id: number) =>
    api.delete(`${BASE}/${id}/`).then((r) => r.data),

  updateStatus: (id: number, status: string, notes?: string) =>
    api.put(`${BASE}/${id}/status/`, { status, notes }).then((r) =>
      normalizeTradeIn(unwrapData<any>(r as any)),
    ),

  quotePrice: (id: number, quotedPrice: number, notes?: string) =>
    api.put(`${BASE}/${id}/quote/`, { quoted_price: quotedPrice, notes }).then((r) =>
      normalizeTradeIn(unwrapData<any>(r as any)),
    ),

  accept: (id: number, finalValue: number, notes?: string) =>
    api.put(`${BASE}/${id}/accept/`, { final_value: finalValue, notes }).then((r) =>
      normalizeTradeIn(unwrapData<any>(r as any)),
    ),

  reject: (id: number, reason: string) =>
    api.put(`${BASE}/${id}/reject/`, { rejection_reason: reason }).then((r) =>
      normalizeTradeIn(unwrapData<any>(r as any)),
    ),

  markPaid: (id: number, paymentMethod: string, notes?: string) =>
    api.put(`${BASE}/${id}/pay/`, { payment_method: paymentMethod, notes }).then((r) =>
      normalizeTradeIn(unwrapData<any>(r as any)),
    ),

  dashboardCounts: () =>
    api.get(`${BASE}/dashboard-counts/`).then((r) =>
      unwrapData<TradeInDashboardCounts>(r as any),
    ),

  mySubmissions: () =>
    api.get(`${BASE}/my-submissions/`).then((r) =>
      toArray(unwrapData<any>(r as any)).map(normalizeTradeIn),
    ),
}

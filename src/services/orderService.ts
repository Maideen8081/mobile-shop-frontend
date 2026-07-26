import api from './api'

const BASE = '/api/v1/orders'

export function formatOrderId(raw: string | number): string {
  const s = String(raw).trim()
  if (!s) return ''
  if (/^ORD-/i.test(s)) return s.toUpperCase()
  const num = parseInt(s, 10)
  if (!isNaN(num)) return `ORD-${String(num).padStart(8, '0')}`
  return `ORD-${s.toUpperCase()}`
}

const STATUS_MAP: Record<string, string> = {
  'order placed': 'order_placed',
  'placed': 'order_placed',
  'order accepted': 'accepted',
  'accepted': 'accepted',
  'packed': 'processing',
  'processing': 'processing',
  'shipped': 'shipped',
  'out for delivery': 'out_for_delivery',
  'out_for_delivery': 'out_for_delivery',
  'delivered': 'delivered',
  'cancelled': 'cancelled',
  'confirmed': 'order_placed',
}

export function normalizeStatus(raw: string): string {
  if (!raw) return 'order_placed'
  const lower = raw.toLowerCase().trim()
  return STATUS_MAP[lower] || lower.replace(/\s+/g, '_')
}

export interface OrderItemPayload {
  product_id: number
  variant_id?: number | null
  name: string
  brand?: string
  price: number
  quantity: number
  emoji?: string
  image?: string
  storage?: string
  ram?: string
  color?: string
  category?: string
}

export interface OrderCreatePayload {
  items: OrderItemPayload[]
  total: number
  subtotal: number
  shipping: number
  tax: number
  payment_method: string
  delivery_address?: string
  delivery_address_id?: number | null
  discount?: number
  coupon_code?: string
}

export interface OrderItemResponse {
  id: number
  product_id: number
  variant_id: number | null
  product_name: string
  image: string
  selected_color: string
  selected_ram: string
  selected_storage: string
  quantity: number
  price: string
  total_price: string
}

export interface OrderResponse {
  id: number
  order_id: string
  order_number: string
  customer_name: string
  customer_mobile: string
  grand_total: string
  subtotal: string
  shipping_charge: string
  tax: string
  delivery_status: string
  payment_status: string
  payment_status_display: string
  payment_method: string
  items: OrderItemResponse[]
  delivery_partner: string
  tracking_id: string
  delivery_address_text: string
  shipping_address: Record<string, string> | null
  discount: number
  coupon_code: string
  est_delivery: string
  delivered_at: string | null
  order_status: string
  created_at: string
  updated_at: string
}

function extractItems(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) return body
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>
    for (const key of ['results', 'data', 'orders', 'items']) {
      const val = obj[key]
      if (Array.isArray(val)) return val
    }
    if (obj.data && typeof obj.data === 'object') {
      const nested = obj.data as Record<string, unknown>
      for (const key of ['results', 'data', 'orders', 'items']) {
        const val = nested[key]
        if (Array.isArray(val)) return val
      }
    }
  }
  return []
}

function normalizeOrder(raw: Record<string, unknown>): OrderResponse {
  return {
    id: Number(raw.id ?? 0),
    order_id: formatOrderId(String(raw.order_id ?? raw.id ?? '')),
    order_number: String(raw.order_number ?? ''),
    customer_name: String(raw.customer_name ?? ''),
    customer_mobile: String(raw.customer_mobile ?? ''),
    grand_total: String(raw.grand_total ?? raw.total ?? '0'),
    subtotal: String(raw.subtotal ?? '0'),
    shipping_charge: String(raw.shipping_charge ?? raw.shipping ?? '0'),
    tax: String(raw.tax ?? '0'),
    delivery_status: normalizeStatus(String(raw.delivery_status ?? raw.status ?? 'Order Placed')),
    payment_status: String(raw.payment_status ?? 'pending'),
    payment_status_display: String(raw.payment_status_display ?? raw.payment_status ?? 'Pending'),
    payment_method: String(raw.payment_method ?? ''),
    items: Array.isArray(raw.items) ? (raw.items as Record<string, unknown>[]).map(i => ({
      id: Number(i.id ?? 0),
      product_id: Number(i.product_id ?? 0),
      variant_id: i.variant_id != null ? Number(i.variant_id) : null,
      product_name: String(i.product_name ?? i.name ?? ''),
      image: String(i.image ?? ''),
      selected_color: String(i.selected_color ?? i.color ?? ''),
      selected_ram: String(i.selected_ram ?? i.ram ?? ''),
      selected_storage: String(i.selected_storage ?? i.storage ?? ''),
      quantity: Number(i.quantity ?? 1),
      price: String(i.price ?? '0'),
      total_price: String(i.total_price ?? '0'),
    })) : [],
    delivery_partner: String(raw.delivery_partner ?? ''),
    tracking_id: String(raw.tracking_id ?? ''),
    delivery_address_text: String(raw.delivery_address_text ?? (raw.shipping_address ? JSON.stringify(raw.shipping_address) : raw.delivery_address) ?? ''),
    shipping_address: raw.shipping_address && typeof raw.shipping_address === 'object' ? raw.shipping_address as Record<string, string> : null,
    discount: Number(raw.discount ?? 0),
    coupon_code: String(raw.coupon_code ?? ''),
    est_delivery: String(raw.est_delivery ?? ''),
    delivered_at: raw.delivered_at ? String(raw.delivered_at) : null,
    order_status: String(raw.order_status ?? ''),
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
  }
}

export const orderService = {
  create: async (payload: OrderCreatePayload): Promise<OrderResponse> => {
    const r = await api.post(`${BASE}/create/`, payload)
    const body = r.data
    const raw = body?.success === true && 'data' in body ? body.data : body
    if (!raw || !raw.order_id) {
      throw new Error('Invalid order response from server')
    }
    return normalizeOrder(raw)
  },

  list: async (params?: Record<string, string>): Promise<OrderResponse[]> => {
    try {
      const r = await api.get(`${BASE}/list/`, { params })
      const raw = extractItems(r.data)
      return raw.map(i => normalizeOrder(i))
    } catch {
      return []
    }
  },

  detail: async (orderNumber: string): Promise<OrderResponse | null> => {
    try {
      const r = await api.get(`${BASE}/detail/${orderNumber}/`)
      const body = r.data
      const raw = body?.success === true && 'data' in body ? body.data : body
      return normalizeOrder(raw)
    } catch {
      return null
    }
  },

  updateStatus: async (orderNumber: string, orderStatus: string): Promise<OrderResponse | null> => {
    try {
      const r = await api.put(`${BASE}/update-status/${orderNumber}/`, { status: orderStatus })
      const body = r.data
      const raw = body?.success === true && 'data' in body ? body.data : body
      return normalizeOrder(raw)
    } catch {
      return null
    }
  },
}

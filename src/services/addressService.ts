import api from './api'

const BASE = '/api/v1/address'
const LS_KEY = 'phonehub_addresses'

export interface AddressData {
  id?: number
  userId?: number
  fullName: string
  mobile: string
  alternateMobile?: string
  addressLine1: string
  addressLine2?: string
  landmark?: string
  country: string
  state: string
  city: string
  zipCode: string
  addressType: 'Home' | 'Office' | 'Other'
  isDefault: boolean
  createdAt?: string
  updatedAt?: string
}

function lsRead(): AddressData[] {
  try {
    const all: AddressData[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    const cleaned = all.filter(a => a.id != null && Number(a.id) > 0)
    if (cleaned.length !== all.length) lsWrite(cleaned)
    return cleaned
  } catch { return [] }
}

function lsWrite(data: AddressData[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

function now(): string {
  return new Date().toISOString()
}

function toSnake( data: Record<string, unknown> ): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    out[k.replace(/[A-Z]/g, c => '_' + c.toLowerCase())] = v
  }
  return out
}

function normalize(raw: Record<string, unknown>): AddressData {
  const rawId = raw.id ?? raw.address_id
  return {
    id: rawId != null ? Number(rawId) : undefined,
    fullName: (raw.fullName ?? raw.full_name ?? raw.name ?? '') as string,
    mobile: (raw.mobile ?? raw.phone ?? '') as string,
    alternateMobile: (raw.alternateMobile ?? raw.alternate_mobile ?? '') as string,
    addressLine1: (raw.addressLine1 ?? raw.address_line1 ?? raw.address ?? '') as string,
    addressLine2: (raw.addressLine2 ?? raw.address_line2 ?? '') as string,
    landmark: (raw.landmark ?? '') as string,
    country: (raw.country ?? '') as string,
    state: (raw.state ?? '') as string,
    city: (raw.city ?? '') as string,
    zipCode: (raw.zipCode ?? raw.zip_code ?? raw.pincode ?? '') as string,
    addressType: (raw.addressType ?? raw.address_type ?? raw.type ?? 'Home') as AddressData['addressType'],
    isDefault: !!(raw.isDefault ?? raw.is_default ?? raw.default),
  }
}

function extractItems(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) return body
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>
    for (const key of ['results', 'data', 'addresses', 'items']) {
      const val = obj[key]
      if (Array.isArray(val)) return val
    }
    if (obj.data && typeof obj.data === 'object') {
      const nested = obj.data as Record<string, unknown>
      for (const key of ['results', 'data', 'addresses', 'items']) {
        const val = nested[key]
        if (Array.isArray(val)) return val
      }
    }
    if (typeof obj.id !== 'undefined' || typeof obj.full_name !== 'undefined' || typeof obj.fullName !== 'undefined') {
      return [obj]
    }
  }
  return []
}

export const addressService = {
  list: async (): Promise<AddressData[]> => {
    try {
      const r = await api.get(`${BASE}/list/`)
      const raw = extractItems(r.data)
      if (raw.length > 0) {
        const apiAddrs = raw.map(i => normalize(i))
        const local = lsRead()
        const localIds = new Set(local.map(a => a.id))
        for (const apiAddr of apiAddrs) {
          if (apiAddr.id && !localIds.has(apiAddr.id)) {
            local.push(apiAddr)
          }
        }
        if (local.length > 0) lsWrite(local)
        else lsWrite(apiAddrs)
        return local.length > 0 ? local : apiAddrs
      }
      return lsRead()
    } catch {
      return lsRead()
    }
  },

  create: async (data: Omit<AddressData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AddressData> => {
    const payload = { ...data, isDefault: data.isDefault || false }
    const r = await api.post(`${BASE}/create/`, toSnake(payload as Record<string, unknown>))
    const body = r.data
    const raw = body?.success === true && 'data' in body ? body.data : body
    const created = normalize(raw)
    const all = lsRead().filter(a => a.id !== created.id)
    if (created.isDefault) all.forEach(a => { a.isDefault = false })
    all.push(created)
    lsWrite(all)
    return created
  },

  update: async (id: number, data: Partial<AddressData>): Promise<AddressData> => {
    try {
      const r = await api.put(`${BASE}/update/${id}/`, toSnake(data as Record<string, unknown>))
      const body = r.data
      const raw = body?.success === true && 'data' in body ? body.data : body
      const updated = normalize(raw)
      const all = lsRead().filter(a => a.id !== id)
      if (updated.isDefault) all.forEach(a => { a.isDefault = false })
      all.push(updated)
      lsWrite(all)
      return updated
    } catch {
      const all = lsRead()
      const idx = all.findIndex(a => a.id === id)
      if (idx === -1) throw new Error('Address not found')
      if (data.isDefault) all.forEach(a => { a.isDefault = false })
      all[idx] = { ...all[idx], ...data, updatedAt: now() }
      lsWrite(all)
      return all[idx]
    }
  },

  delete: async (id: number): Promise<void> => {
    const numId = Number(id)
    lsWrite(lsRead().filter(a => Number(a.id) !== numId))
    try {
      await api.delete(`${BASE}/delete/${numId}/`, { timeout: 5000 })
    } catch { /* already removed locally */ }
  },

  setDefault: async (id: number): Promise<AddressData> => {
    try {
      await api.put(`${BASE}/set-default/${id}/`, {})
      const all = lsRead()
      const target = all.find(a => Number(a.id) === Number(id))
      if (!target) throw new Error('Address not found')
      all.forEach(a => { a.isDefault = Number(a.id) === Number(id) })
      lsWrite(all)
      return { ...target, isDefault: true }
    } catch {
      const all = lsRead()
      if (!all.some(a => Number(a.id) === Number(id))) throw new Error('Address not found')
      all.forEach(a => { a.isDefault = Number(a.id) === Number(id) })
      lsWrite(all)
      const found = all.find(a => Number(a.id) === Number(id))!
      return { ...found, isDefault: true }
    }
  },
}

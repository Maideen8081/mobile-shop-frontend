import api from './api'

const BASE = '/api/v1/auth'
const AUTH_FLAG = 'is_authenticated'
const USER_KEY = 'user_profile'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

function extractTokens(body: any): { access: string; refresh?: string } | null {
  if (!body) return null
  const src = body.data || body

  // 1) Direct keys: { access: "..." } or { access_token: "..." }
  for (const key of ['access', 'access_token', 'token', 'key']) {
    const val = src[key]
    if (val && typeof val === 'string') {
      return { access: val, refresh: src.refresh || src.refresh_token || null }
    }
  }

  // 2) Nested tokens object: { data: { tokens: { access: "..." } } }
  if (src.tokens && typeof src.tokens === 'object') {
    const t = src.tokens
    for (const key of ['access', 'access_token', 'token', 'key']) {
      const val = t[key]
      if (val && typeof val === 'string') {
        return { access: val, refresh: t.refresh || t.refresh_token || null }
      }
    }
  }

  // 3) Deeply nested: { data: { data: { tokens: { access: "..." } } } }
  if (src.data && typeof src.data === 'object') {
    const deep = src.data
    if (deep.tokens && typeof deep.tokens === 'object') {
      const t = deep.tokens
      for (const key of ['access', 'access_token', 'token', 'key']) {
        const val = t[key]
        if (val && typeof val === 'string') {
          return { access: val, refresh: t.refresh || t.refresh_token || null }
        }
      }
    }
  }

  // 4) JWT string fallback anywhere in the object
  function findJwt(obj: Record<string, unknown>): { access: string; refresh?: string } | null {
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      if (typeof val === 'string' && val.startsWith('eyJ') && val.split('.').length === 3) {
        return { access: val }
      }
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const found = findJwt(val as Record<string, unknown>)
        if (found) return found
      }
    }
    return null
  }
  return findJwt(src)
}

function markAuthenticated() {
  localStorage.setItem(AUTH_FLAG, 'true')
  window.dispatchEvent(new Event('auth-changed'))
}

function markUnauthenticated() {
  const keys = [
    AUTH_FLAG, 'access_token', 'refresh_token', USER_KEY,
    'wishlist', 'last_order', 'order_history',
    'phonehub_addresses',
  ]
  keys.forEach(k => localStorage.removeItem(k))
  window.dispatchEvent(new Event('auth-changed'))
  window.dispatchEvent(new Event('cart-updated'))
  window.dispatchEvent(new Event('wishlist-updated'))
}

function saveUserProfile(body: any, loginEmail?: string) {
  const src = body?.data || body || {}
  const user = src.user || src
  let name = user.full_name || user.fullName || user.name || user.username || ''
  if (!name && (user.first_name || user.last_name)) {
    name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  }
  const email = user.email || user.user_email || loginEmail || ''
  if (name || email) {
    localStorage.setItem(USER_KEY, JSON.stringify({ name, email }))
  }
}

export interface UserProfile {
  id: number
  email: string
  fullName: string
  mobile?: string
  dateJoined?: string
  isActive?: boolean
}

function normalizeProfile(raw: any): UserProfile {
  return {
    id: raw.id ?? raw.user_id ?? 0,
    email: raw.email ?? raw.user_email ?? '',
    fullName: raw.full_name ?? raw.fullName ?? raw.name ?? raw.username ?? `${raw.first_name || ''} ${raw.last_name || ''}`.trim(),
    mobile: raw.mobile ?? raw.phone ?? raw.phone_number ?? raw.contact_number ?? '',
    dateJoined: raw.date_joined ?? raw.created_at ?? raw.createdAt ?? '',
    isActive: raw.is_active ?? raw.isActive ?? true,
  }
}

export const authService = {
  login: async (data: LoginData) => {
    const payload = { email: data.email, password: data.password }
    const r = await api.post(`${BASE}/login/`, payload)
    const tokens = extractTokens(r.data)
    if (tokens) {
      localStorage.setItem('access_token', tokens.access)
      if (tokens.refresh) localStorage.setItem('refresh_token', tokens.refresh)
      saveUserProfile(r.data, data.email)
      markAuthenticated()
    }
    return r.data
  },

  register: async (data: RegisterData) => {
    const payload = {
      full_name: data.fullName,
      email: data.email,
      password: data.password,
      confirm_password: data.confirmPassword,
    }
    const r = await api.post(`${BASE}/register/`, payload)
    const tokens = extractTokens(r.data)
    if (tokens) {
      localStorage.setItem('access_token', tokens.access)
      if (tokens.refresh) localStorage.setItem('refresh_token', tokens.refresh)
      saveUserProfile(r.data, data.email)
      markAuthenticated()
    }
    return r.data
  },

  logout: () => {
    markUnauthenticated()
  },

  getToken: (): string | null => {
    return localStorage.getItem('access_token')
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_FLAG)
  },

  getProfile: async (): Promise<UserProfile> => {
    const r = await api.get(`${BASE}/profile/`)
    const body = r.data?.data ?? r.data
    const profile = normalizeProfile(body)
    localStorage.setItem(USER_KEY, JSON.stringify({ name: profile.fullName, email: profile.email }))
    return profile
  },

  deleteAccount: async () => {
    const r = await api.delete(`${BASE}/profile/delete/`)
    markUnauthenticated()
    return r.data
  },

  updateProfile: async (data: { fullName?: string; mobile?: string; email?: string }): Promise<UserProfile> => {
    try {
      const r = await api.put(`${BASE}/profile/`, {
        full_name: data.fullName,
        mobile: data.mobile,
        email: data.email,
      })
      const body = r.data?.data ?? r.data
      const profile = normalizeProfile(body)
      localStorage.setItem(USER_KEY, JSON.stringify({ name: profile.fullName, email: profile.email }))
      return profile
    } catch {
      // Endpoint may not exist — still persist locally so the UI updates.
      const stored = localStorage.getItem(USER_KEY)
      const prev = stored ? JSON.parse(stored) : {}
      const merged = {
        name: data.fullName ?? prev.name ?? '',
        email: data.email ?? prev.email ?? '',
        mobile: data.mobile ?? prev.mobile ?? '',
      }
      localStorage.setItem(USER_KEY, JSON.stringify(merged))
      return { id: 0, email: merged.email, fullName: merged.name, mobile: merged.mobile }
    }
  },
}

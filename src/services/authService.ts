import api, { refreshCsrfToken } from './api'

const BASE = '/api/v1/auth'
const ADMIN_BASE = '/api/v1/admin/auth'
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

export interface UserProfile {
  id: number
  email: string
  fullName: string
  mobile?: string
  dateJoined?: string
  isActive?: boolean
  role?: string
  isAdmin?: boolean
}

function markAuthenticated() {
  localStorage.setItem(AUTH_FLAG, 'true')
  window.dispatchEvent(new Event('auth-changed'))
}

function markUnauthenticated() {
  const keys = [
    AUTH_FLAG, USER_KEY, 'access_token', 'refresh_token',
    'wishlist', 'last_order', 'order_history', 'phonehub_addresses',
  ]
  keys.forEach(k => localStorage.removeItem(k))
  window.dispatchEvent(new Event('auth-changed'))
  window.dispatchEvent(new Event('cart-updated'))
  window.dispatchEvent(new Event('wishlist-updated'))
}

interface ProfileLike {
  user?: Record<string, unknown> | null
  data?: Record<string, unknown> | null
  id?: number
  user_id?: number
  email?: string
  user_email?: string
  full_name?: string
  fullName?: string
  name?: string
  username?: string
  first_name?: string
  last_name?: string
  mobile?: string
  phone?: string
  phone_number?: string
  contact_number?: string
  date_joined?: string
  created_at?: string
  createdAt?: string
  is_active?: boolean
  isActive?: boolean
  role?: string
  is_admin?: boolean
  isAdmin?: boolean
}

function unwrapProfile(body: unknown): ProfileLike {
  if (typeof body !== 'object' || body === null) return {}
  const record = body as Record<string, unknown>
  const inner = (typeof record.user === 'object' && record.user !== null) ? record.user as Record<string, unknown> : record
  return inner as ProfileLike
}

function saveUserProfile(body: unknown, loginEmail?: string) {
  const user = unwrapProfile((body as ProfileLike)?.data)
  let name = user.full_name || user.fullName || user.name || user.username || ''
  if (!name && (user.first_name || user.last_name)) {
    name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  }
  const email = user.email || user.user_email || loginEmail || ''
  if (name || email) {
    localStorage.setItem(USER_KEY, JSON.stringify({ name, email }))
  }
}

function normalizeProfile(raw: ProfileLike): UserProfile {
  const user = unwrapProfile(raw)
  return {
    id: user.id ?? user.user_id ?? 0,
    email: user.email ?? user.user_email ?? '',
    fullName: user.full_name ?? user.fullName ?? user.name ?? user.username ?? `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    mobile: user.mobile ?? user.phone ?? user.phone_number ?? user.contact_number ?? '',
    dateJoined: user.date_joined ?? user.created_at ?? user.createdAt ?? '',
    isActive: user.is_active ?? user.isActive ?? true,
    role: user.role ?? undefined,
    isAdmin: Boolean(user.is_admin ?? user.isAdmin),
  }
}

/** Prime the CSRF cookie for the API origin (must run once at app boot). */
export function bootstrapCsrf(): Promise<void> {
  return refreshCsrfToken().then(() => undefined)
}

export const authService = {
  login: async (data: LoginData) => {
    localStorage.removeItem(USER_KEY)
    const payload = { email: data.email, password: data.password }
    const r = await api.post(`${BASE}/login/`, payload)
    saveUserProfile(r.data, data.email)
    markAuthenticated()
    // Login rotates the CSRF secret server-side; pick up the new token.
    await refreshCsrfToken()
    return r.data
  },

  /** Exchange a Google ID token (from Google Identity Services) for a session. */
  googleLogin: async (credential: string) => {
    localStorage.removeItem(USER_KEY)
    const r = await api.post(`${BASE}/google/`, { credential })
    saveUserProfile(r.data)
    markAuthenticated()
    // Login rotates the CSRF secret server-side; pick up the new token.
    await refreshCsrfToken()
    return r.data as { data?: { created?: boolean } }
  },

  register: async (data: RegisterData) => {
    localStorage.removeItem(USER_KEY)
    const payload = {
      full_name: data.fullName,
      email: data.email,
      password: data.password,
      confirm_password: data.confirmPassword,
    }
    const r = await api.post(`${BASE}/register/`, payload)
    saveUserProfile(r.data, data.email)
    markAuthenticated()
    // Login rotates the CSRF secret server-side; pick up the new token.
    await refreshCsrfToken()
    return r.data
  },

  logout: async () => {
    try {
      await api.post(`${BASE}/logout/`)
    } catch {
      // Session already invalid — local cleanup still proceeds.
    }
    markUnauthenticated()
  },

  adminLogin: async (data: LoginData) => {
    const r = await api.post(`${ADMIN_BASE}/login/`, { email: data.email, password: data.password })
    saveUserProfile(r.data, data.email)
    localStorage.setItem('is_admin_session', 'true')
    markAuthenticated()
    // Login rotates the CSRF secret server-side; pick up the new token.
    await refreshCsrfToken()
    return r.data
  },

  adminLogout: async () => {
    try {
      await api.post(`${ADMIN_BASE}/logout/`)
    } catch {
      // proceed with cleanup
    }
    localStorage.removeItem('is_admin_session')
    markUnauthenticated()
  },

  getToken: (): string | null => {
    // Sessions are HTTP-only; tokens are never available to the browser.
    return null
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_FLAG)
  },

  getProfile: async (opts?: { skipAuthRedirect?: boolean }): Promise<UserProfile> => {
    const r = await api.get(`${BASE}/profile/`, opts)
    const body = r.data?.data ?? r.data
    const profile = normalizeProfile(unwrapProfile(body))
    localStorage.setItem(USER_KEY, JSON.stringify({ name: profile.fullName, email: profile.email }))
    return profile
  },

  getAdminProfile: async (opts?: { skipAuthRedirect?: boolean }): Promise<UserProfile> => {
    const r = await api.get(`${ADMIN_BASE}/profile/`, opts)
    const body = r.data?.data ?? r.data
    const profile = normalizeProfile(unwrapProfile(body))
    localStorage.setItem(USER_KEY, JSON.stringify({ name: profile.fullName, email: profile.email }))
    return profile
  },

  deleteAccount: async () => {
    const r = await api.delete(`${BASE}/profile/delete/`)
    markUnauthenticated()
    return r.data
  },

  changePassword: async (data: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
    return api.post(`${BASE}/change-password/`, {
      old_password: data.oldPassword,
      new_password: data.newPassword,
      confirm_password: data.confirmPassword,
    })
  },

  updateProfile: async (data: { fullName?: string; mobile?: string; email?: string; dateOfBirth?: string; gender?: string }): Promise<UserProfile> => {
    const r = await api.put(`${BASE}/profile/`, {
      full_name: data.fullName,
      mobile: data.mobile,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
    })
    const body = r.data?.data ?? r.data
    const profile = normalizeProfile(unwrapProfile(body))
    localStorage.setItem(USER_KEY, JSON.stringify({ name: profile.fullName, email: profile.email }))
    return profile
  },
}
import axios from 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Skip the global 401 → login redirect (used for passive auth checks). */
    skipAuthRedirect?: boolean
    /** Internal: set once a request has been retried after a CSRF refresh. */
    _csrfRetried?: boolean
  }
}

// In dev, requests go through the Vite proxy (see vite.config.ts) so they're
// same-origin; production builds call the API directly.
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000')

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : ''
}

const UNSAFE_METHODS = ['post', 'put', 'patch', 'delete']

const AUTH_FLAG = 'is_authenticated'
const USER_KEY = 'user_profile'

function clearLocalAuthState() {
  localStorage.removeItem(AUTH_FLAG)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem('wishlist')
  window.dispatchEvent(new Event('auth-changed'))
  window.dispatchEvent(new Event('wishlist-updated'))
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Sessions handle identity; CSRF tokens protect unsafe requests. The cookie is
// set by the server on GET /api/v1/auth/csrf/ and echoed back on write calls.
// In production the API lives on another site, so document.cookie can't see
// the API's csrftoken — the endpoint also returns the token in its body.
const CSRF_PATH = '/api/v1/auth/csrf/'
let csrfToken = ''

export async function refreshCsrfToken(): Promise<string> {
  try {
    const r = await axios.get(CSRF_PATH, { baseURL: API_BASE_URL, withCredentials: true })
    csrfToken = r.data?.data?.csrf_token || ''
  } catch {
    csrfToken = ''
  }
  return csrfToken
}

function isCsrfFailure(error: any): boolean {
  const detail = error?.response?.data?.detail
  return error?.response?.status === 403 && typeof detail === 'string' && detail.toLowerCase().includes('csrf')
}

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase()
  if (UNSAFE_METHODS.includes(method)) {
    const csrf = csrfToken || getCookie('csrftoken')
    if (csrf) config.headers['X-CSRFToken'] = csrf
  }
  return config
})

let isRedirecting = false

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url = error?.config?.url || 'unknown'
    const method = error?.config?.method?.toUpperCase() || 'unknown'
    const skipRedirect = Boolean(error?.config?.skipAuthRedirect)

    if (status === 401 && !skipRedirect && !isRedirecting) {
      isRedirecting = true
      clearLocalAuthState()

      const path = window.location.pathname + window.location.search
      const isAdminRoute = window.location.pathname.startsWith('/admin')
      const loginPath = isAdminRoute ? '/admin/login' : '/login'
      if (!path.startsWith(loginPath)) {
        sessionStorage.setItem('redirect_after_login', path)
      }
      window.location.href = loginPath
      setTimeout(() => { isRedirecting = false }, 2000)
    }

    // Django rotates the CSRF secret on login/logout, so a stale token is
    // expected occasionally: fetch a fresh one and retry the request once.
    if (isCsrfFailure(error) && error.config && !error.config._csrfRetried) {
      error.config._csrfRetried = true
      return refreshCsrfToken().then(() => api.request(error.config))
    }
    if (isCsrfFailure(error)) {
      console.error(`[api] ${method} ${url} → CSRF token missing or invalid`)
    }

    if (status === 500) {
      console.error(`[api] ${method} ${url} → 500 Internal Server Error`, error?.response?.data || error.message)
    }

    return Promise.reject(error)
  }
)

export default api
import axios from 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Skip the global 401 → login redirect (used for passive auth checks). */
    skipAuthRedirect?: boolean
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

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
  window.dispatchEvent(new Event('auth-changed'))
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
api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase()
  if (UNSAFE_METHODS.includes(method)) {
    const csrf = getCookie('csrftoken')
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

    if (status === 403 && error?.response?.data?.detail?.toLowerCase().includes('csrf')) {
      console.error(`[api] ${method} ${url} → CSRF token missing or invalid`)
    }

    if (status === 500) {
      console.error(`[api] ${method} ${url} → 500 Internal Server Error`, error?.response?.data || error.message)
    }

    return Promise.reject(error)
  }
)

export default api
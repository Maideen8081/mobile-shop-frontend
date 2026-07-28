import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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

    if (status === 401 && !isRedirecting) {
      isRedirecting = true
      const AUTH_FLAG = 'is_authenticated'
      const USER_KEY = 'user_profile'
      ;[AUTH_FLAG, 'access_token', 'refresh_token', USER_KEY].forEach(k => localStorage.removeItem(k))
      window.dispatchEvent(new Event('auth-changed'))

      const currentPath = window.location.pathname + window.location.search
      if (!currentPath.startsWith('/login')) {
        sessionStorage.setItem('redirect_after_login', currentPath)
      }
      window.location.href = '/login'
      setTimeout(() => { isRedirecting = false }, 2000)
    }

    if (status === 500) {
      console.error(`[api] ${method} ${url} → 500 Internal Server Error`, error?.response?.data || error.message)
    }

    return Promise.reject(error)
  }
)

export default api

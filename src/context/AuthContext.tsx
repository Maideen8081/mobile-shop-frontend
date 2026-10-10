import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react'
import { authService, bootstrapCsrf, type UserProfile } from '../services/authService'

interface AuthContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean
  login: (data: { email: string; password: string }) => Promise<void>
  register: (data: { fullName: string; email: string; password: string; confirmPassword: string }) => Promise<void>
  adminLogin: (data: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  adminLogout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  const refresh = useCallback(async () => {
    try {
      const profile = await authService.getProfile({ skipAuthRedirect: true })
      localStorage.setItem('is_authenticated', 'true')
      setUser(profile)
      setIsAuthenticated(true)
      setIsAdmin(Boolean(profile.isAdmin))
    } catch {
      try {
        const adminProfile = await authService.getAdminProfile({ skipAuthRedirect: true })
        localStorage.setItem('is_authenticated', 'true')
        setUser(adminProfile)
        setIsAuthenticated(true)
        setIsAdmin(true)
      } catch {
        localStorage.removeItem('is_authenticated')
        localStorage.removeItem('user_profile')
        setUser(null)
        setIsAuthenticated(false)
        setIsAdmin(false)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await bootstrapCsrf()
      if (!cancelled) await refresh()
      if (!cancelled) setInitialized(true)
    })()
    return () => { cancelled = true }
  }, [refresh])

  // Keep in-memory auth state in sync with the localStorage fast-path flag.
  useEffect(() => {
    const sync = () => setIsAuthenticated(authService.isAuthenticated())
    window.addEventListener('auth-changed', sync)
    return () => window.removeEventListener('auth-changed', sync)
  }, [])

  const login = useCallback(async (data: { email: string; password: string }) => {
    await authService.login(data)
    await refresh()
  }, [refresh])

  const register = useCallback(async (data: { fullName: string; email: string; password: string; confirmPassword: string }) => {
    await authService.register(data)
    await refresh()
  }, [refresh])

  const adminLogin = useCallback(async (data: { email: string; password: string }) => {
    await authService.adminLogin(data)
    const profile = await authService.getAdminProfile()
    setUser(profile)
    setIsAuthenticated(true)
    setIsAdmin(true)
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    setIsAuthenticated(false)
    setIsAdmin(false)
  }, [])

  const adminLogout = useCallback(async () => {
    await authService.adminLogout()
    setUser(null)
    setIsAuthenticated(false)
    setIsAdmin(false)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated,
    isAdmin: isAdmin || Boolean(user?.isAdmin),
    loading: !initialized,
    login,
    register,
    adminLogin,
    logout,
    adminLogout,
    refresh,
  }), [user, isAuthenticated, isAdmin, initialized, login, register, adminLogin, logout, adminLogout, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
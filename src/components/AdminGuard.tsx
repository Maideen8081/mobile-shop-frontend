import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface AdminGuardProps {
  children: React.ReactNode
}

/**
 * Restricts a route to authorized administrators.
 *
 * The server is the source of truth: an admin account is one with
 * is_staff/is_superuser or an admin role, verified server-side via
 * /api/v1/admin/auth/login/ and /api/v1/admin/auth/profile/. This guard only
 * mirrors that decision on the client; the API itself enforces it.
 */
export default function AdminGuard({ children }: AdminGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isAdmin, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated || !isAdmin) {
      sessionStorage.setItem('redirect_after_login', location.pathname + location.search)
      navigate('/admin/login', { replace: true })
    }
  }, [isAuthenticated, isAdmin, loading, navigate, location])

  if (loading) return null
  if (!isAuthenticated || !isAdmin) return null

  return <>{children}</>
}
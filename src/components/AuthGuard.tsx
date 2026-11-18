import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoading from './ui/PageLoading'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) {
      sessionStorage.setItem('redirect_after_login', location.pathname + location.search)
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, loading, navigate, location])

  if (loading) return <PageLoading label="Checking your account…" className="min-h-[60vh]" />
  if (!isAuthenticated) return null

  return <>{children}</>
}

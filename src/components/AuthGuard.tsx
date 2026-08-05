import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../services/authService'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', location.pathname)
      navigate('/login', { replace: true })
    }
  }, [navigate, location])

  if (!authService.isAuthenticated()) return null

  return <>{children}</>
}

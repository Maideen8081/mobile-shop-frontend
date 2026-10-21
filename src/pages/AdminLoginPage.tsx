import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiSmartphone, FiArrowLeft } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function getFriendlyError(msg: string): string {
  if (!msg) return 'Sign in failed.'
  const lower = msg.toLowerCase()
  if (lower.includes('not authorized') || lower.includes('admin area'))
    return 'This account is not authorized for the admin area.'
  if (lower.includes('locked'))
    return 'Account temporarily locked. Please try again later.'
  if (lower.includes('invalid') || lower.includes('incorrect'))
    return 'Invalid email or password.'
  return msg
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const showToast = useToast().show
  const { adminLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: typeof errors = {}
    if (!email.trim()) nextErrors.email = 'Email is required.'
    if (!password) nextErrors.password = 'Password is required.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      await adminLogin({ email, password })
      showToast('Admin login successful!', 'success')
      const redirect = sessionStorage.getItem('redirect_after_login')
      sessionStorage.removeItem('redirect_after_login')
      const target = redirect && redirect.startsWith('/admin') ? redirect : '/admin/dashboard'
      navigate(target, { replace: true })
    } catch (err: any) {
      const raw = err?.response?.data
      let backendMsg = ''
      if (typeof raw === 'string') backendMsg = raw
      else if (raw?.detail) backendMsg = raw.detail
      else if (raw?.non_field_errors?.[0]) backendMsg = raw.non_field_errors[0]
      else if (raw?.message) backendMsg = raw.message
      showToast(getFriendlyError(backendMsg), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-theme min-h-screen bg-bg flex flex-col">
      <header className="border-b border-border bg-white/80 backdrop-blur-md px-6 h-16 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center" style={{ boxShadow: '0 4px 12px rgba(203,32,45,0.35)' }}>
            <FiSmartphone size={18} className="text-white" />
          </div>
          <div>
            <span className="block text-base font-bold text-text-primary leading-tight">MobileShop</span>
            <span className="block text-[10px] font-medium text-text-label">Admin Console</span>
          </div>
        </div>
        <Link to="/home" className="flex items-center gap-2 text-sm font-medium text-text-label hover:text-text-primary transition-colors">
          <FiArrowLeft size={15} /> Back to store
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
            <div className="mb-8">
              <h1 className="text-xl font-bold text-text-primary">Admin sign in</h1>
              <p className="text-sm text-text-label mt-1">
                Restricted area. Only authorized administrators can access this console.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-text-label block mb-1.5">EMAIL ADDRESS</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-label" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-lighter border border-border text-sm text-text-primary placeholder-text-label outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 transition-all"
                  />
                </div>
                {errors.email && <p className="text-xs text-primary mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-text-label block mb-1.5">PASSWORD</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-label" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-lighter border border-border text-sm text-text-primary placeholder-text-label outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 transition-all"
                  />
                </div>
                {errors.password && <p className="text-xs text-primary mt-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg font-semibold text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #D91E36, #A3122A)', boxShadow: '0 4px 16px rgba(217,30,54,0.3)' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-text-label mt-6">
            Administrators are provisioned by the platform owner. No self-service admin signup exists.
          </p>
        </div>
      </main>
    </div>
  )
}
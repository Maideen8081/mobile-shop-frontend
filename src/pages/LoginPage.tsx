import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthForm } from '../hooks/useAuthForm'
import { createValidator, required, email } from '../utils/validation'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import MobileLogin from '../components/mobile/MobileLogin'
import { useIsMobile } from '../components/mobile/helpers'
import EyeIcon from '../components/auth/EyeIcon'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'

interface LoginFormData {
  email: string
  password: string
}

const validateLogin = createValidator<LoginFormData>({
  email: [required('Email', (d) => d.email), email((d) => d.email)],
  password: [required('Password', (d) => d.password)],
})

function getFriendlyLoginError(msg: string): string {
  if (!msg) return 'Invalid email or password.'
  const lower = msg.toLowerCase()
  if (lower.includes('no active account') || lower.includes('not found') || lower.includes('invalid') || lower.includes('incorrect'))
    return 'Invalid email or password. Please check your credentials and try again.'
  if (lower.includes('disabled') || lower.includes('inactive'))
    return 'This account has been disabled. Please contact support.'
  return msg
}

const carouselSlides = [
  { src: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=1200&q=80&auto=format', label: 'Smartphones', desc: 'Flagship mobile devices at your fingertips' },
  { src: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=1200&q=80&auto=format', label: 'TWS Earbuds', desc: 'True wireless audio, redefined' },
  { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80&auto=format', label: 'Smart Watches', desc: 'Wearable innovation on your wrist' },
  { src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80&auto=format', label: 'Headphones', desc: 'Premium audio for every moment' },
]

function DesktopLogin() {
  const navigate = useNavigate()
  const showToast = useToast().show
  const { login } = useAuth()
  const { formData, errors, loading, handleChange, handleSubmit } = useAuthForm<LoginFormData>({
    initial: { email: '', password: '' },
    validate: validateLogin,
    onSubmit: async (data) => {
      try {
        await login(data)
        showToast('Welcome back!', 'success')
        const redirect = sessionStorage.getItem('redirect_after_login')
        sessionStorage.removeItem('redirect_after_login')
        navigate(redirect || '/home', { replace: true })
      } catch (err: any) {
        const raw = err?.response?.data
        let backendMsg = ''
        if (typeof raw === 'string') backendMsg = raw
        else if (raw?.detail) backendMsg = raw.detail
        else if (raw?.message) backendMsg = raw.message
        else {
          const firstKey = raw && Object.keys(raw)[0]
          if (firstKey && Array.isArray(raw[firstKey])) backendMsg = raw[firstKey][0]
          else if (firstKey && typeof raw[firstKey] === 'string') backendMsg = raw[firstKey]
        }
        showToast(getFriendlyLoginError(backendMsg), 'error')
        throw err
      }
    },
  })

  const [showPassword, setShowPassword] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  const nextSlide = useCallback(() => setActiveSlide((p) => (p + 1) % carouselSlides.length), [])
  useEffect(() => { const t = setInterval(nextSlide, 4500); return () => clearInterval(t) }, [nextSlide])

  return (
    <div className="min-h-screen flex" style={{ background: '#FBF8F6', fontFamily: 'var(--font-ui)' }}>
      {/* Left – image carousel */}
      <div className="hidden lg:flex lg:flex-col lg:w-[52%] h-screen sticky top-0 overflow-hidden" style={{ background: '#151110' }}>
        {/* brand */}
        <div className="flex items-center gap-2 px-10 pt-10 pb-6 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#D91E36' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          </div>
          <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>MobileShop</span>
        </div>
        <div className="relative flex-1 min-h-0 mx-10 mb-8 rounded-3xl overflow-hidden" style={{ background: '#1f1a18' }}>
          {carouselSlides.map((slide, i) => (
            <div
              key={slide.label}
              className="absolute inset-0 transition-all duration-700"
              style={{ opacity: i === activeSlide ? 1 : 0, transform: i === activeSlide ? 'scale(1)' : 'scale(1.03)' }}
            >
              <img src={slide.src} alt={slide.label} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
        {/* slide info */}
        <div className="px-10 pb-10 shrink-0">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] mb-3 block" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Premium Collection
          </span>
          <h2 className="text-white font-extrabold mb-2" style={{ fontSize: 'var(--text-headline)', fontFamily: 'var(--font-display)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {carouselSlides[activeSlide].label}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'var(--text-body)', lineHeight: 1.6 }}>
            {carouselSlides[activeSlide].desc}
          </p>
          <div className="flex gap-2 mt-6">
            {carouselSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className="rounded-full transition-all duration-300"
                style={{ width: i === activeSlide ? 28 : 8, height: 8, background: i === activeSlide ? '#D91E36' : 'rgba(255,255,255,0.35)' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right – form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16 xl:px-24">
        {/* Mobile brand */}
        <div className="flex lg:hidden items-center gap-2 mb-10 w-full max-w-[480px]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#D91E36' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          </div>
          <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: '#1b1210' }}>MobileShop</span>
        </div>

        <div className="w-full max-w-[480px]">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-extrabold mb-2" style={{ fontSize: 'var(--text-heading)', fontFamily: 'var(--font-display)', lineHeight: 1.2, letterSpacing: '-0.02em', color: '#1b1210' }}>
              Welcome back
            </h1>
            <p style={{ color: '#857d79', fontSize: 'var(--text-body)', lineHeight: 1.6 }}>
              Sign in to your account to continue shopping.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#4a403d' }}>
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#c9c0bc' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  id="email" name="email" type="email"
                  value={formData.email} onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all outline-none"
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${errors.email ? '#D91E36' : '#ece4e0'}`,
                    color: '#1b1210',
                    fontFamily: 'var(--font-ui)',
                    boxShadow: errors.email ? '0 0 0 3px rgba(217,30,54,0.08)' : 'none',
                  }}
                  onFocus={e => { e.target.style.border = '1.5px solid #D91E36'; e.target.style.boxShadow = '0 0 0 3px rgba(217,30,54,0.1)' }}
                  onBlur={e => { e.target.style.border = `1.5px solid ${errors.email ? '#D91E36' : '#ece4e0'}`; e.target.style.boxShadow = errors.email ? '0 0 0 3px rgba(217,30,54,0.08)' : 'none' }}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs" style={{ color: '#D91E36' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a403d' }}>Password</label>
                <Link to="#" className="text-xs font-semibold transition-colors hover:opacity-80" style={{ color: '#D91E36' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#c9c0bc' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password} onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm transition-all outline-none"
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${errors.password ? '#D91E36' : '#ece4e0'}`,
                    color: '#1b1210',
                    fontFamily: 'var(--font-ui)',
                    boxShadow: errors.password ? '0 0 0 3px rgba(217,30,54,0.08)' : 'none',
                  }}
                  onFocus={e => { e.target.style.border = '1.5px solid #D91E36'; e.target.style.boxShadow = '0 0 0 3px rgba(217,30,54,0.1)' }}
                  onBlur={e => { e.target.style.border = `1.5px solid ${errors.password ? '#D91E36' : '#ece4e0'}`; e.target.style.boxShadow = errors.password ? '0 0 0 3px rgba(217,30,54,0.08)' : 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70"
                  style={{ color: '#857d79', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs" style={{ color: '#D91E36' }}>{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #D91E36 0%, #A3122A 100%)',
                fontFamily: 'var(--font-ui)',
                boxShadow: '0 4px 20px rgba(217,30,54,0.3)',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(217,30,54,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(217,30,54,0.3)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity=".25"/><path d="M21 12a9 9 0 0 1-9 9"/>
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: '#ece4e0' }} />
            <span className="text-xs font-medium" style={{ color: '#c9c0bc' }}>or continue with</span>
            <div className="flex-1 h-px" style={{ background: '#ece4e0' }} />
          </div>

          <GoogleSignInButton mode="signin" className="mb-8" />

          <p className="text-center text-sm" style={{ color: '#857d79' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold transition-colors hover:opacity-80" style={{ color: '#D91E36' }}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileLogin />
  return <DesktopLogin />
}

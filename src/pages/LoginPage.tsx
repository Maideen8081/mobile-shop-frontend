import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthForm } from '../hooks/useAuthForm'
import { createValidator, required, email } from '../utils/validation'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import MobileLogin from '../components/mobile/MobileLogin'
import { useIsMobile } from '../components/mobile/helpers'
import EyeIcon from '../components/auth/EyeIcon'

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
  { src: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=900&fit=crop&auto=format', label: 'Smartphones', desc: 'Flagship mobile devices at your fingertips' },
  { src: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&h=900&fit=crop&auto=format', label: 'TWS Earbuds', desc: 'True wireless audio, redefined' },
  { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=900&fit=crop&auto=format', label: 'Smart Watches', desc: 'Wearable innovation on your wrist' },
  { src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=900&fit=crop&auto=format', label: 'Headphones', desc: 'Premium audio for every moment' },
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
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        {carouselSlides.map((slide, i) => (
          <div
            key={slide.label}
            className="absolute inset-0 transition-all duration-700"
            style={{ opacity: i === activeSlide ? 1 : 0, transform: i === activeSlide ? 'scale(1)' : 'scale(1.04)' }}
          >
            <img src={slide.src} alt={slide.label} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
        {/* overlay */}
        <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(170deg, rgba(163,18,42,0.55) 0%, rgba(0,0,0,0.65) 100%)' }} />
        {/* brand */}
        <div className="absolute top-10 left-10 z-20 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#D91E36' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          </div>
          <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>MobileShop</span>
        </div>
        {/* slide info */}
        <div className="absolute bottom-12 left-10 right-10 z-20">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] mb-3 block" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Premium Collection
          </span>
          <h2 className="text-white font-extrabold mb-2" style={{ fontSize: '40px', fontFamily: 'var(--font-display)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {carouselSlides[activeSlide].label}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px', lineHeight: 1.6 }}>
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
            <h1 className="font-extrabold mb-2" style={{ fontSize: '32px', fontFamily: 'var(--font-display)', lineHeight: 1.2, letterSpacing: '-0.02em', color: '#1b1210' }}>
              Welcome back
            </h1>
            <p style={{ color: '#857d79', fontSize: '15px', lineHeight: 1.6 }}>
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

          {/* Social */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { label: 'Google', icon: (
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              )},
              { label: 'Apple', icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              )},
            ].map(({ label, icon }) => (
              <button
                key={label}
                type="button"
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: '#fff', border: '1.5px solid #ece4e0', color: '#1b1210', fontFamily: 'var(--font-ui)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fbf8f6'; e.currentTarget.style.borderColor = '#c9c0bc' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#ece4e0' }}
              >
                {icon}{label}
              </button>
            ))}
          </div>

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

import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiLock } from 'react-icons/fi'
import { useAuthForm } from '../hooks/useAuthForm'
import { createValidator, required, email } from '../utils/validation'
import { authService } from '../services/authService'
import { useToast } from '../context/ToastContext'
import MobileLogin from '../components/mobile/MobileLogin'
import { useIsMobile } from '../components/mobile/helpers'

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
  { src: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=900&fit=crop&auto=format', label: 'Smartphones', desc: 'Flagship mobile devices' },
  { src: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&h=900&fit=crop&auto=format', label: 'TWS Earbuds', desc: 'True wireless sound' },
  { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=900&fit=crop&auto=format', label: 'Smart Watches', desc: 'Wearable innovation' },
  { src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=900&fit=crop&auto=format', label: 'Headphones', desc: 'Premium audio experience' },
]

export default function LoginPage() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileLogin />
  const navigate = useNavigate()
  const showToast = useToast().show
  const { formData, errors, loading, handleChange, handleSubmit } = useAuthForm<LoginFormData>({
    initial: { email: '', password: '' },
    validate: validateLogin,
    onSubmit: async (data) => {
      try {
        await authService.login(data)
        showToast('Logged in successfully!', 'success')
        const redirect = sessionStorage.getItem('redirect_after_login')
        sessionStorage.removeItem('redirect_after_login')
        navigate(redirect || '/', { replace: true })
      } catch (err: any) {
        const raw = err?.response?.data
        let backendMsg = ''
        if (typeof raw === 'string') {
          backendMsg = raw
        } else if (raw?.detail) {
          backendMsg = raw.detail
        } else if (raw?.message) {
          backendMsg = raw.message
        } else {
          const firstKey = raw && Object.keys(raw)[0]
          if (firstKey && Array.isArray(raw[firstKey])) {
            backendMsg = raw[firstKey][0]
          } else if (firstKey && typeof raw[firstKey] === 'string') {
            backendMsg = raw[firstKey]
          }
        }
        const friendly = getFriendlyLoginError(backendMsg)
        showToast(friendly, 'error')
        throw err
      }
    },
  })

  const [activeSlide, setActiveSlide] = useState(0)

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % carouselSlides.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000)
    return () => clearInterval(timer)
  }, [nextSlide])

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <main className="flex-grow flex flex-col md:flex-row w-full gap-0 md:gap-20" style={{ maxWidth: '1440px', margin: '0 auto', padding: '48px 64px' }}>
        <div className="hidden md:flex flex-1 relative rounded-xl overflow-hidden">
          {carouselSlides.map((slide, index) => (
            <div
              key={slide.label}
              className="absolute inset-0 transition-all duration-700"
              style={{
                opacity: index === activeSlide ? 1 : 0,
                transform: index === activeSlide ? 'scale(1)' : 'scale(1.05)',
              }}
            >
              <img
                alt={slide.label}
                className="w-full h-full object-cover"
                src={slide.src}
                loading="lazy"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-12 z-10">
            <span className="text-white text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
              Premium Collection
            </span>
            <h2 className="text-white font-bold leading-tight mb-2" style={{ fontSize: '42px', fontFamily: "'Inter', sans-serif", lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {carouselSlides[activeSlide].label}
            </h2>
            <p className="text-white/70 max-w-md" style={{ fontSize: '16px', fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
              {carouselSlides[activeSlide].desc}
            </p>
            <div className="flex gap-2 mt-6">
              {carouselSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: index === activeSlide ? '28px' : '8px',
                    height: '8px',
                    backgroundColor: index === activeSlide ? '#22C55E' : 'rgba(255,255,255,0.4)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto md:mx-0 w-full">
          <div className="w-full space-y-12">
            <div className="space-y-2">
              <h1 className="font-bold tracking-tight" style={{ fontSize: '36px', fontFamily: "'Inter', sans-serif", lineHeight: 1.2, letterSpacing: '-0.02em', color: '#191c1d' }}>
                Welcome back
              </h1>
              <p className="text-base" style={{ fontFamily: "'Inter', sans-serif", color: '#5d5f5f' }}>
                Log in to manage your premium hardware and exclusive services.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold tracking-wider" style={{ color: '#6d7a72', fontFamily: "'Inter', sans-serif" }}>
                    EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#bccac0' }} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className="w-full bg-transparent border-0 border-b py-2 text-base transition-colors placeholder:text-[#bccac0] pl-10"
                      style={{
                        borderBottom: `1px solid ${errors.email ? '#ba1a1a' : '#bccac0'}`,
                        fontFamily: "'Inter', sans-serif",
                        color: '#191c1d',
                        outline: 'none',
                      }}
                      onFocus={e => { e.target.style.borderBottomColor = '#22C55E' }}
                      onBlur={e => { if (!e.target.value) e.target.style.borderBottomColor = errors.email ? '#ba1a1a' : '#bccac0' }}
                    />
                  </div>
                  {errors.email && (
                    <span className="text-xs mt-1" style={{ color: '#ba1a1a', fontFamily: "'Inter', sans-serif" }}>
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold tracking-wider" style={{ color: '#6d7a72', fontFamily: "'Inter', sans-serif" }}>
                      PASSWORD
                    </label>
                    <Link to="#" className="text-xs font-semibold hover:underline" style={{ color: '#22C55E', fontFamily: "'Inter', sans-serif" }}>
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#bccac0' }} />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-transparent border-0 border-b py-2 text-base transition-colors placeholder:text-[#bccac0] pl-10"
                      style={{
                        borderBottom: `1px solid ${errors.password ? '#ba1a1a' : '#bccac0'}`,
                        fontFamily: "'Inter', sans-serif",
                        color: '#191c1d',
                        outline: 'none',
                      }}
                      onFocus={e => { e.target.style.borderBottomColor = '#22C55E' }}
                      onBlur={e => { if (!e.target.value) e.target.style.borderBottomColor = errors.password ? '#ba1a1a' : '#bccac0' }}
                    />
                  </div>
                  {errors.password && (
                    <span className="text-xs mt-1" style={{ color: '#ba1a1a', fontFamily: "'Inter', sans-serif" }}>
                      {errors.password}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-lg font-semibold text-white transition-all active:scale-95 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                  fontSize: '20px',
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.9)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="pt-6 border-t text-center space-y-4" style={{ borderTop: '1px solid #bccac0' }}>
              <p className="text-base" style={{ color: '#5d5f5f', fontFamily: "'Inter', sans-serif" }}>
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold hover:underline" style={{ color: '#22C55E' }}>
                  Register
                </Link>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className="flex items-center justify-center gap-2 py-2 border rounded-lg text-sm font-medium transition-colors"
                  style={{ borderColor: '#bccac0', color: '#191c1d', fontFamily: "'Inter', sans-serif" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#edeeef' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <span className="text-base">G</span>
                  Google
                </button>
                <button
                  className="flex items-center justify-center gap-2 py-2 border rounded-lg text-sm font-medium transition-colors"
                  style={{ borderColor: '#bccac0', color: '#191c1d', fontFamily: "'Inter', sans-serif" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#edeeef' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <span className="text-base"></span>
                  Apple
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer
        className="w-full flex flex-col md:flex-row justify-between items-center gap-6 border-t"
        style={{
          padding: '48px 64px',
          maxWidth: '1440px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #bccac0',
        }}
      >
        <div className="text-xl font-semibold" style={{ color: '#006948', fontFamily: "'Inter', sans-serif" }}>
          PhonePremium
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-base" style={{ fontFamily: "'Inter', sans-serif", color: '#5d5f5f' }}>
          <Link to="#" className="hover:underline opacity-80 hover:opacity-100 transition-all" style={{ color: '#5d5f5f' }}>Privacy Policy</Link>
          <Link to="#" className="hover:underline opacity-80 hover:opacity-100 transition-all" style={{ color: '#5d5f5f' }}>Terms of Service</Link>
          <Link to="#" className="hover:underline opacity-80 hover:opacity-100 transition-all" style={{ color: '#5d5f5f' }}>Shipping Info</Link>
          <Link to="#" className="hover:underline opacity-80 hover:opacity-100 transition-all" style={{ color: '#5d5f5f' }}>Contact Us</Link>
        </div>
        <p className="text-base" style={{ color: '#5d5f5f', fontFamily: "'Inter', sans-serif" }}>
          &copy; 2024 PhonePremium. Engineering Excellence.
        </p>
      </footer>
    </div>
  )
}

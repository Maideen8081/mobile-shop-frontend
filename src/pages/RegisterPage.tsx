import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiUserPlus, FiCheck, FiShield, FiHeadphones } from 'react-icons/fi'
import { useAuthForm } from '../hooks/useAuthForm'
import { createValidator, required, email, minLength, passwordStrength } from '../utils/validation'
import { authService } from '../services/authService'
import { useToast } from '../context/ToastContext'
import MobileRegister from '../components/mobile/MobileRegister'
import { useIsMobile } from '../components/mobile/helpers'

interface RegisterFormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
}

const validateRegister = createValidator<RegisterFormData>({
  fullName: [required('Full name', (d) => d.fullName)],
  email: [required('Email', (d) => d.email), email((d) => d.email)],
  password: [required('Password', (d) => d.password), minLength(8, (d) => d.password), passwordStrength((d) => d.password)],
  confirmPassword: [
    required('Confirm password', (d) => d.confirmPassword),
    {
      validate: (d) => (d.password === d.confirmPassword ? '' : 'Passwords do not match'),
    },
  ],
  agreeTerms: [
    {
      validate: (d) => (d.agreeTerms ? '' : 'You must accept the Terms & Conditions'),
    },
  ],
})

function getFriendlyRegisterError(msg: string): string {
  if (!msg) return 'Something went wrong. Please try again.'
  const lower = msg.toLowerCase()
  if (lower.includes('already exists') || lower.includes('already registered') || lower.includes('duplicate'))
    return 'This email is already registered. Please log in instead.'
  if (lower.includes('invalid password') || lower.includes('password'))
    return 'Password is too weak. Use at least 8 characters with uppercase, lowercase, and a number.'
  if (lower.includes('invalid email') || lower.includes('enter a valid email'))
    return 'Please enter a valid email address.'
  return msg
}

const carouselSlides = [
  { src: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=900&fit=crop&auto=format', label: 'Smartphones', desc: 'Flagship mobile devices' },
  { src: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&h=900&fit=crop&auto=format', label: 'TWS Earbuds', desc: 'True wireless sound' },
  { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=900&fit=crop&auto=format', label: 'Smart Watches', desc: 'Wearable innovation' },
  { src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=900&fit=crop&auto=format', label: 'Headphones', desc: 'Premium audio experience' },
]

export default function RegisterPage() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileRegister />
  const navigate = useNavigate()
  const showToast = useToast().show
  const { formData, errors, loading, handleChange, setField, handleSubmit } = useAuthForm<RegisterFormData>({
    initial: { fullName: '', email: '', password: '', confirmPassword: '', agreeTerms: false },
    validate: validateRegister,
    onSubmit: async (data) => {
      try {
        await authService.register(data)
        showToast('Account created successfully!', 'success')
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
        const friendly = getFriendlyRegisterError(backendMsg)
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
      <main className="flex-grow flex items-center justify-center relative overflow-hidden" style={{ padding: '80px 64px' }}>
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <div
            className="absolute rounded-full"
            style={{
              top: '-12rem',
              left: '-12rem',
              width: '24rem',
              height: '24rem',
              backgroundColor: '#FF5A65',
              filter: 'blur(120px)',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              bottom: '-12rem',
              right: '-12rem',
              width: '24rem',
              height: '24rem',
              backgroundColor: '#A81D2A',
              filter: 'blur(120px)',
            }}
          />
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10" style={{ maxWidth: '1440px' }}>
          <div className="hidden md:block md:col-span-7 h-[700px] rounded-xl overflow-hidden relative">
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
                      backgroundColor: index === activeSlide ? '#CB202D' : 'rgba(255,255,255,0.4)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col justify-center">
            <div
              className="p-12 rounded-xl transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(229, 231, 235, 0.5)',
                boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.05)',
              }}
            >
              <div className="mb-8">
                <h1 className="font-bold mb-1" style={{ fontSize: '36px', fontFamily: "'Inter', sans-serif", lineHeight: 1.2, letterSpacing: '-0.02em', color: '#191c1d' }}>
                  Join PhonePremium
                </h1>
                <p className="text-base" style={{ color: '#5d5f5f', fontFamily: "'Inter', sans-serif" }}>
                  Experience the pinnacle of mobile engineering and exclusive privileges.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold tracking-wider mb-2" style={{ color: '#6d7a72', fontFamily: "'Inter', sans-serif" }}>
                    FULL NAME
                  </label>
                  <div className="relative">
                    <FiUserPlus className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#bccac0' }} />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full bg-transparent border-0 border-b py-2 text-base transition-all placeholder:text-[#c6c6c7] pl-10"
                      style={{
                        borderBottom: `1px solid ${errors.fullName ? '#ba1a1a' : '#bccac0'}`,
                        fontFamily: "'Inter', sans-serif",
                        color: '#191c1d',
                        outline: 'none',
                      }}
                      onFocus={e => { e.target.style.borderBottomColor = '#CB202D' }}
                      onBlur={e => { if (!e.target.value) e.target.style.borderBottomColor = errors.fullName ? '#ba1a1a' : '#bccac0' }}
                    />
                  </div>
                  {errors.fullName && (
                    <span className="text-xs mt-1" style={{ color: '#ba1a1a', fontFamily: "'Inter', sans-serif" }}>
                      {errors.fullName}
                    </span>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold tracking-wider mb-2" style={{ color: '#6d7a72', fontFamily: "'Inter', sans-serif" }}>
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
                      placeholder="john@example.com"
                      className="w-full bg-transparent border-0 border-b py-2 text-base transition-all placeholder:text-[#c6c6c7] pl-10"
                      style={{
                        borderBottom: `1px solid ${errors.email ? '#ba1a1a' : '#bccac0'}`,
                        fontFamily: "'Inter', sans-serif",
                        color: '#191c1d',
                        outline: 'none',
                      }}
                      onFocus={e => { e.target.style.borderBottomColor = '#CB202D' }}
                      onBlur={e => { if (!e.target.value) e.target.style.borderBottomColor = errors.email ? '#ba1a1a' : '#bccac0' }}
                    />
                  </div>
                  {errors.email && (
                    <span className="text-xs mt-1" style={{ color: '#ba1a1a', fontFamily: "'Inter', sans-serif" }}>
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold tracking-wider mb-2" style={{ color: '#6d7a72', fontFamily: "'Inter', sans-serif" }}>
                    PASSWORD
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#bccac0' }} />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-transparent border-0 border-b py-2 text-base transition-all placeholder:text-[#c6c6c7] pl-10"
                      style={{
                        borderBottom: `1px solid ${errors.password ? '#ba1a1a' : '#bccac0'}`,
                        fontFamily: "'Inter', sans-serif",
                        color: '#191c1d',
                        outline: 'none',
                      }}
                      onFocus={e => { e.target.style.borderBottomColor = '#CB202D' }}
                      onBlur={e => { if (!e.target.value) e.target.style.borderBottomColor = errors.password ? '#ba1a1a' : '#bccac0' }}
                    />
                  </div>
                  {errors.password && (
                    <span className="text-xs mt-1" style={{ color: '#ba1a1a', fontFamily: "'Inter', sans-serif" }}>
                      {errors.password}
                    </span>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold tracking-wider mb-2" style={{ color: '#6d7a72', fontFamily: "'Inter', sans-serif" }}>
                    CONFIRM PASSWORD
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#bccac0' }} />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-transparent border-0 border-b py-2 text-base transition-all placeholder:text-[#c6c6c7] pl-10"
                      style={{
                        borderBottom: `1px solid ${errors.confirmPassword ? '#ba1a1a' : '#bccac0'}`,
                        fontFamily: "'Inter', sans-serif",
                        color: '#191c1d',
                        outline: 'none',
                      }}
                      onFocus={e => { e.target.style.borderBottomColor = '#CB202D' }}
                      onBlur={e => { if (!e.target.value) e.target.style.borderBottomColor = errors.confirmPassword ? '#ba1a1a' : '#bccac0' }}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-xs mt-1" style={{ color: '#ba1a1a', fontFamily: "'Inter', sans-serif" }}>
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 py-2">
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-all"
                      style={{
                        backgroundColor: formData.agreeTerms ? '#CB202D' : 'transparent',
                        border: formData.agreeTerms ? '1px solid transparent' : `1px solid ${errors.agreeTerms ? '#ba1a1a' : '#bccac0'}`,
                      }}
                      onClick={() => setField('agreeTerms', !formData.agreeTerms)}
                    >
                      {formData.agreeTerms && <FiCheck size={10} className="text-white" />}
                    </div>
                    <label className="text-sm cursor-pointer" style={{ color: '#5d5f5f', fontFamily: "'Inter', sans-serif" }} onClick={() => setField('agreeTerms', !formData.agreeTerms)}>
                      I agree to the{' '}
                      <Link to="#" className="font-semibold hover:underline" style={{ color: '#CB202D' }}>
                        Terms &amp; Conditions
                      </Link>
                    </label>
                  </div>
                  {errors.agreeTerms && (
                    <span className="text-xs" style={{ color: '#ba1a1a', fontFamily: "'Inter', sans-serif" }}>
                      {errors.agreeTerms}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-lg font-semibold text-white uppercase tracking-wider transition-all active:scale-[0.98] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #CB202D, #A81D2A)',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    boxShadow: '0 4px 16px rgba(203,32,45,0.3)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.9)' }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
                >
                  {loading ? 'Creating account...' : 'Register'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t text-center" style={{ borderTop: '1px solid #bccac0' }}>
                <p className="text-base" style={{ color: '#5d5f5f', fontFamily: "'Inter', sans-serif" }}>
                  Already have an account?{' '}
                  <Link to="/login" className="font-bold hover:underline ml-1" style={{ color: '#CB202D' }}>
                    Login
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-between px-2 opacity-60">
              <div className="flex items-center gap-1">
                <FiShield size={16} />
                <span className="text-xs font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>Secure Data</span>
              </div>
              <div className="flex items-center gap-1">
                <FiHeadphones size={16} />
                <span className="text-xs font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>24/7 Priority Support</span>
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
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="text-xl font-semibold" style={{ color: '#006948', fontFamily: "'Inter', sans-serif" }}>
            PhonePremium
          </div>
          <p className="text-base" style={{ color: '#5d5f5f', fontFamily: "'Inter', sans-serif" }}>
            &copy; 2024 PhonePremium. Engineering Excellence.
          </p>
        </div>
        <nav className="flex gap-6 flex-wrap justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
          <Link to="#" className="text-base hover:underline opacity-80 hover:opacity-100 transition-all" style={{ color: '#5d5f5f' }}>Privacy Policy</Link>
          <Link to="#" className="text-base hover:underline opacity-80 hover:opacity-100 transition-all" style={{ color: '#5d5f5f' }}>Terms of Service</Link>
          <Link to="#" className="text-base hover:underline opacity-80 hover:opacity-100 transition-all" style={{ color: '#5d5f5f' }}>Shipping Info</Link>
          <Link to="#" className="text-base hover:underline opacity-80 hover:opacity-100 transition-all" style={{ color: '#5d5f5f' }}>Contact Us</Link>
        </nav>
      </footer>
    </div>
  )
}

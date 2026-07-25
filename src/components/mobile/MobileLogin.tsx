import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiChevronLeft } from 'react-icons/fi'
import { useAuthForm } from '../../hooks/useAuthForm'
import { createValidator, required, email } from '../../utils/validation'
import { authService } from '../../services/authService'
import { useMobileToast } from './useMobileToast'

const PURPLE = '#CB202D'
const PURPLE_DEEP = '#A81D2A'

interface LoginFormData { email: string; password: string }

const validateLogin = createValidator<LoginFormData>({
  email: [required('Email', (d) => d.email), email((d) => d.email)],
  password: [required('Password', (d) => d.password)],
})

function getFriendlyLoginError(msg: string): string {
  if (!msg) return 'Invalid email or password.'
  const lower = msg.toLowerCase()
  if (lower.includes('no active account') || lower.includes('not found') || lower.includes('invalid') || lower.includes('incorrect'))
    return 'Invalid email or password. Please check your credentials and try again.'
  if (lower.includes('disabled') || lower.includes('inactive')) return 'This account has been disabled. Please contact support.'
  return msg
}

export default function MobileLogin() {
  const navigate = useNavigate()
  const { show: showToast, Toast } = useMobileToast()
  const [activeSlide, setActiveSlide] = useState(0)

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

  const slides = [
    { src: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=900&fit=crop&auto=format', label: 'Smartphones' },
    { src: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&h=900&fit=crop&auto=format', label: 'TWS Earbuds' },
    { src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=900&fit=crop&auto=format', label: 'Headphones' },
  ]
  const nextSlide = useCallback(() => setActiveSlide(p => (p + 1) % slides.length), [])
  useEffect(() => { const t = setInterval(nextSlide, 4000); return () => clearInterval(t) }, [nextSlide])

  return (
    <div className="min-h-screen bg-[#FFFBFB] max-w-[480px] mx-auto font-sans text-[#1F2937] flex flex-col" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* Brand header */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="w-9 h-9 rounded-full bg-[#FEE2E6] flex items-center justify-center active:scale-90 transition">
          <FiChevronLeft size={20} style={{ color: PURPLE }} />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>P</div>
        <span className="text-[16px] font-extrabold">PhonePremium</span>
      </div>

      {/* Hero image carousel */}
      <div className="relative mx-4 h-[180px] rounded-[24px] overflow-hidden">
        {slides.map((s, i) => (
          <div key={s.label} className="absolute inset-0 transition-all duration-700" style={{ opacity: i === activeSlide ? 1 : 0, transform: i === activeSlide ? 'scale(1)' : 'scale(1.05)' }}>
            <img src={s.src} alt={s.label} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
        <div className="absolute inset-0 flex flex-col justify-end p-4" style={{ background: 'linear-gradient(to top, rgba(203,32,45,0.85), transparent)' }}>
          <p className="text-white text-[20px] font-bold leading-tight">{slides[activeSlide].label}</p>
          <p className="text-white/80 text-[12px]">Premium mobile engineering</p>
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5">
          {slides.map((_, i) => (
            <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === activeSlide ? '18px' : '6px', background: i === activeSlide ? '#fff' : 'rgba(255,255,255,0.5)' }} />
          ))}
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 px-4 mt-4">
        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-5">
          <h1 className="text-[24px] font-extrabold">Welcome back</h1>
          <p className="text-[13px] text-[#6B7280] mt-1 mb-5">Log in to your premium account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#9CA3AF' }} />
                <input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                  placeholder="name@example.com" className="w-full h-12 pl-10 pr-3 rounded-2xl text-[14px] bg-[#FFFBFB] border outline-none transition"
                  style={{ borderColor: errors.email ? '#EF4444' : '#E5E7EB', color: '#1F2937' }} />
              </div>
              {errors.email && <p className="text-[11px] text-[#EF4444] mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">Password</label>
                <Link to="#" className="text-[12px] font-semibold" style={{ color: PURPLE }}>Forgot Password?</Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#9CA3AF' }} />
                <input id="password" name="password" type="password" value={formData.password} onChange={handleChange}
                  placeholder="••••••••" className="w-full h-12 pl-10 pr-3 rounded-2xl text-[14px] bg-[#FFFBFB] border outline-none transition"
                  style={{ borderColor: errors.password ? '#EF4444' : '#E5E7EB', color: '#1F2937' }} />
              </div>
              {errors.password && <p className="text-[11px] text-[#EF4444] mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-13 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center disabled:opacity-60 active:scale-[0.98] transition"
              style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})`, height: 52 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-[#E5E7EB] text-[13px] font-semibold text-[#1F2937]">G Google</button>
            <button className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-[#E5E7EB] text-[13px] font-semibold text-[#1F2937]"> Apple</button>
          </div>
        </div>

        <p className="text-center text-[13px] text-[#6B7280] mt-5">
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold" style={{ color: PURPLE }}>Register</Link>
        </p>
      </div>
      {Toast}
    </div>
  )
}

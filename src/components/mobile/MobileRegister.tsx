import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiUserPlus, FiCheck, FiChevronLeft } from 'react-icons/fi'
import { useAuthForm } from '../../hooks/useAuthForm'
import { createValidator, required, email, minLength, passwordStrength } from '../../utils/validation'
import { authService } from '../../services/authService'
import { useMobileToast } from './useMobileToast'

const PURPLE = '#6C3BFF'
const PURPLE_DEEP = '#4B2ECC'

interface RegisterFormData { fullName: string; email: string; password: string; confirmPassword: string; agreeTerms: boolean }

const validateRegister = createValidator<RegisterFormData>({
  fullName: [required('Full name', (d) => d.fullName)],
  email: [required('Email', (d) => d.email), email((d) => d.email)],
  password: [required('Password', (d) => d.password), minLength(8, (d) => d.password), passwordStrength((d) => d.password)],
  confirmPassword: [
    required('Confirm password', (d) => d.confirmPassword),
    { validate: (d) => (d.password === d.confirmPassword ? '' : 'Passwords do not match') },
  ],
  agreeTerms: [{ validate: (d) => (d.agreeTerms ? '' : 'You must accept the Terms & Conditions') }],
})

function getFriendlyRegisterError(msg: string): string {
  if (!msg) return 'Something went wrong. Please try again.'
  const lower = msg.toLowerCase()
  if (lower.includes('already exists') || lower.includes('already registered') || lower.includes('duplicate')) return 'This email is already registered. Please log in instead.'
  if (lower.includes('invalid password') || lower.includes('password')) return 'Password is too weak. Use at least 8 characters with uppercase, lowercase, and a number.'
  if (lower.includes('invalid email') || lower.includes('enter a valid email')) return 'Please enter a valid email address.'
  return msg
}

export default function MobileRegister() {
  const navigate = useNavigate()
  const { show: showToast, Toast } = useMobileToast()
  const [activeSlide, setActiveSlide] = useState(0)

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
        if (typeof raw === 'string') backendMsg = raw
        else if (raw?.detail) backendMsg = raw.detail
        else if (raw?.message) backendMsg = raw.message
        else {
          const firstKey = raw && Object.keys(raw)[0]
          if (firstKey && Array.isArray(raw[firstKey])) backendMsg = raw[firstKey][0]
          else if (firstKey && typeof raw[firstKey] === 'string') backendMsg = raw[firstKey]
        }
        showToast(getFriendlyRegisterError(backendMsg), 'error')
        throw err
      }
    },
  })

  const slides = [
    { src: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=900&fit=crop&auto=format', label: 'Smartphones' },
    { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=900&fit=crop&auto=format', label: 'Smart Watches' },
    { src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=900&fit=crop&auto=format', label: 'Headphones' },
  ]
  const nextSlide = useCallback(() => setActiveSlide(p => (p + 1) % slides.length), [])
  useEffect(() => { const t = setInterval(nextSlide, 4000); return () => clearInterval(t) }, [nextSlide])

  const inputCls = 'w-full h-12 px-3.5 rounded-2xl text-[14px] bg-[#F8F9FF] border outline-none transition'

  return (
    <div className="min-h-screen bg-[#F8F9FF] max-w-[480px] mx-auto font-sans text-[#1F2937] flex flex-col" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <div className="px-4 pt-5 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="w-9 h-9 rounded-full bg-[#F1ECFF] flex items-center justify-center active:scale-90 transition">
          <FiChevronLeft size={20} style={{ color: PURPLE }} />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>P</div>
        <span className="text-[16px] font-extrabold">PhonePremium</span>
      </div>

      <div className="relative mx-4 h-[150px] rounded-[24px] overflow-hidden">
        {slides.map((s, i) => (
          <div key={s.label} className="absolute inset-0 transition-all duration-700" style={{ opacity: i === activeSlide ? 1 : 0, transform: i === activeSlide ? 'scale(1)' : 'scale(1.05)' }}>
            <img src={s.src} alt={s.label} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
        <div className="absolute inset-0 flex flex-col justify-end p-4" style={{ background: 'linear-gradient(to top, rgba(75,46,204,0.85), transparent)' }}>
          <p className="text-white text-[20px] font-bold leading-tight">{slides[activeSlide].label}</p>
          <p className="text-white/80 text-[12px]">Join the premium club</p>
        </div>
      </div>

      <div className="flex-1 px-4 mt-4">
        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-5">
          <h1 className="text-[24px] font-extrabold">Create Account</h1>
          <p className="text-[13px] text-[#6B7280] mt-1 mb-5">Sign up for exclusive privileges</p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">Full Name</label>
              <input id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} placeholder="John Doe" className={inputCls} style={{ borderColor: errors.fullName ? '#EF4444' : '#E5E7EB', color: '#1F2937' }} />
              {errors.fullName && <p className="text-[11px] text-[#EF4444] mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#9CA3AF' }} />
                <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" className={`${inputCls} pl-10`} style={{ borderColor: errors.email ? '#EF4444' : '#E5E7EB', color: '#1F2937' }} />
              </div>
              {errors.email && <p className="text-[11px] text-[#EF4444] mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#9CA3AF' }} />
                <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className={`${inputCls} pl-10`} style={{ borderColor: errors.password ? '#EF4444' : '#E5E7EB', color: '#1F2937' }} />
              </div>
              {errors.password && <p className="text-[11px] text-[#EF4444] mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#9CA3AF' }} />
                <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className={`${inputCls} pl-10`} style={{ borderColor: errors.confirmPassword ? '#EF4444' : '#E5E7EB', color: '#1F2937' }} />
              </div>
              {errors.confirmPassword && <p className="text-[11px] text-[#EF4444] mt-1">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <span onClick={() => setField('agreeTerms', !formData.agreeTerms)} className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center transition flex-shrink-0 ${formData.agreeTerms ? 'text-white' : ''}`} style={{ background: formData.agreeTerms ? PURPLE : '#F8F9FF', border: formData.agreeTerms ? 'none' : '1px solid #E5E7EB' }}>
                {formData.agreeTerms && <FiCheck size={12} />}
              </span>
              <label className="text-[12px] text-[#4B5563] cursor-pointer" onClick={() => setField('agreeTerms', !formData.agreeTerms)}>
                I agree to the <Link to="#" className="font-semibold" style={{ color: PURPLE }}>Terms &amp; Conditions</Link>
              </label>
            </div>
            {errors.agreeTerms && <p className="text-[11px] text-[#EF4444] -mt-2">{errors.agreeTerms}</p>}

            <button type="submit" disabled={loading}
              className="w-full rounded-2xl text-[15px] font-bold text-white flex items-center justify-center disabled:opacity-60 active:scale-[0.98] transition"
              style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})`, height: 52 }}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#6B7280] mt-5">
            Already have an account?{' '}
            <Link to="/login" className="font-bold" style={{ color: PURPLE }}>Login</Link>
          </p>
        </div>
      </div>
      {Toast}
    </div>
  )
}

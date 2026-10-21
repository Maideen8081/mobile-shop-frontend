import { useState, useEffect, useCallback } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthForm } from '../hooks/useAuthForm'
import { createValidator, required, email, minLength, passwordStrength } from '../utils/validation'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import MobileRegister from '../components/mobile/MobileRegister'
import { useIsMobile } from '../components/mobile/helpers'
import EyeIcon from '../components/auth/EyeIcon'

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
    { validate: (d) => (d.password === d.confirmPassword ? '' : 'Passwords do not match') },
  ],
  agreeTerms: [{ validate: (d) => (d.agreeTerms ? '' : 'You must accept the Terms & Conditions') }],
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
  { src: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=900&fit=crop&auto=format', label: 'Smartphones', desc: 'Flagship mobile devices at your fingertips' },
  { src: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&h=900&fit=crop&auto=format', label: 'TWS Earbuds', desc: 'True wireless audio, redefined' },
  { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=900&fit=crop&auto=format', label: 'Smart Watches', desc: 'Wearable innovation on your wrist' },
  { src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=900&fit=crop&auto=format', label: 'Headphones', desc: 'Premium audio for every moment' },
]

const perks = ['Track orders & repairs in one place', 'Save addresses for faster checkout', 'Wishlist and exclusive member offers']

const passwordRules = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /\d/.test(p) },
]

const strengthLevels = [
  { label: 'Too weak', color: '#D91E36' },
  { label: 'Weak', color: '#D91E36' },
  { label: 'Fair', color: '#F59E0B' },
  { label: 'Good', color: '#10B981' },
  { label: 'Strong', color: '#059669' },
]

const icons = {
  user: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
  mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
}

function Field({
  label, name, type, value, onChange, placeholder, error, icon, trailing, valid,
}: {
  label: string
  name: string
  type: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  error?: string
  icon: ReactNode
  trailing?: ReactNode
  valid?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const borderColor = error ? '#D91E36' : focused ? '#D91E36' : valid ? '#10B981' : '#ece4e0'
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#4a403d' }}>
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: focused ? '#D91E36' : '#c9c0bc' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
        </span>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={name === 'email' ? 'email' : name === 'fullName' ? 'name' : 'new-password'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full pl-10 pr-12 py-3 rounded-xl text-sm transition-all outline-none"
          style={{
            background: '#fff',
            border: `1.5px solid ${borderColor}`,
            color: '#1b1210',
            fontFamily: 'var(--font-ui)',
            boxShadow: focused || error ? '0 0 0 3px rgba(217,30,54,0.08)' : 'none',
          }}
        />
        {trailing && <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">{trailing}</div>}
      </div>
      {error && <p className="mt-1.5 text-xs" style={{ color: '#D91E36' }}>{error}</p>}
    </div>
  )
}

function ToggleEye({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="transition-opacity hover:opacity-70"
      style={{ color: '#857d79', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      aria-label={shown ? 'Hide password' : 'Show password'}
    >
      <EyeIcon open={shown} />
    </button>
  )
}

function DesktopRegister() {
  const navigate = useNavigate()
  const showToast = useToast().show
  const { register } = useAuth()
  const { formData, errors, loading, handleChange, setField, handleSubmit } = useAuthForm<RegisterFormData>({
    initial: { fullName: '', email: '', password: '', confirmPassword: '', agreeTerms: false },
    validate: validateRegister,
    onSubmit: async (data) => {
      try {
        await register(data)
        showToast('Account created successfully!', 'success')
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
        showToast(getFriendlyRegisterError(backendMsg), 'error')
        throw err
      }
    },
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  const nextSlide = useCallback(() => setActiveSlide((p) => (p + 1) % carouselSlides.length), [])
  useEffect(() => { const t = setInterval(nextSlide, 4500); return () => clearInterval(t) }, [nextSlide])

  const passed = passwordRules.filter((r) => r.test(formData.password)).length
  const strength = strengthLevels[passed]
  const confirmMatches = formData.confirmPassword.length > 0 && formData.confirmPassword === formData.password

  return (
    <div className="min-h-screen flex" style={{ background: '#FBF8F6', fontFamily: 'var(--font-ui)' }}>
      {/* Left – image carousel */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden">
        {carouselSlides.map((slide, i) => (
          <div
            key={slide.label}
            className="absolute inset-0 transition-all duration-700"
            style={{ opacity: i === activeSlide ? 1 : 0, transform: i === activeSlide ? 'scale(1)' : 'scale(1.04)' }}
          >
            <img src={slide.src} alt={slide.label} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
        <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(170deg, rgba(163,18,42,0.55) 0%, rgba(0,0,0,0.7) 100%)' }} />
        <Link to="/home" className="absolute top-10 left-10 z-20 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#D91E36' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></svg>
          </div>
          <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>MobileShop</span>
        </Link>
        <div className="absolute bottom-12 left-10 right-10 z-20">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] mb-3 block" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Join the community
          </span>
          <h2 className="text-white font-extrabold mb-5" style={{ fontSize: '38px', fontFamily: 'var(--font-display)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {carouselSlides[activeSlide].label}
          </h2>
          <ul className="space-y-2.5 mb-6">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            {carouselSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                aria-label={`Show slide ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{ width: i === activeSlide ? 28 : 8, height: 8, background: i === activeSlide ? '#D91E36' : 'rgba(255,255,255,0.35)' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right – form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 lg:px-16 xl:px-24">
        <Link to="/home" className="flex lg:hidden items-center gap-2 mb-8 w-full max-w-[480px]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#D91E36' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></svg>
          </div>
          <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: '#1b1210' }}>MobileShop</span>
        </Link>

        <div className="w-full max-w-[480px]">
          <div className="mb-7">
            <h1 className="font-extrabold mb-2" style={{ fontSize: '32px', fontFamily: 'var(--font-display)', lineHeight: 1.2, letterSpacing: '-0.02em', color: '#1b1210' }}>
              Create your account
            </h1>
            <p style={{ color: '#857d79', fontSize: '15px', lineHeight: 1.6 }}>
              It only takes a minute. Start shopping and tracking repairs.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Full Name" name="fullName" type="text" value={formData.fullName} onChange={handleChange} placeholder="John Doe" error={errors.fullName} icon={icons.user} />
            <Field label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" error={errors.email} icon={icons.mail} />

            <div>
              <Field
                label="Password" name="password" type={showPassword ? 'text' : 'password'}
                value={formData.password} onChange={handleChange} placeholder="Create a password"
                error={errors.password} icon={icons.lock}
                trailing={<ToggleEye shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
              />
              {formData.password && (
                <div className="mt-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 grid grid-cols-4 gap-1">
                      {passwordRules.map((_, i) => (
                        <div key={i} className="h-1.5 rounded-full transition-colors duration-300" style={{ background: i < passed ? strength.color : '#ece4e0' }} />
                      ))}
                    </div>
                    <span className="text-xs font-semibold w-16 text-right" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {passwordRules.map((r) => {
                      const ok = r.test(formData.password)
                      return (
                        <span key={r.label} className="flex items-center gap-1 text-[11px] font-medium transition-colors" style={{ color: ok ? '#059669' : '#a8a09c' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            {ok ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="4" />}
                          </svg>
                          {r.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <Field
              label="Confirm Password" name="confirmPassword" type={showConfirm ? 'text' : 'password'}
              value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter your password"
              error={errors.confirmPassword} icon={icons.lock} valid={confirmMatches}
              trailing={
                <span className="flex items-center gap-2">
                  {confirmMatches && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                  <ToggleEye shown={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
                </span>
              }
            />

            <div>
              <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setField('agreeTerms', e.target.checked)}
                  className="sr-only"
                />
                <span
                  className="mt-0.5 w-[18px] h-[18px] rounded-md flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: formData.agreeTerms ? '#D91E36' : '#fff',
                    border: `1.5px solid ${formData.agreeTerms ? '#D91E36' : errors.agreeTerms ? '#D91E36' : '#c9c0bc'}`,
                  }}
                >
                  {formData.agreeTerms && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </span>
                <span className="text-sm" style={{ color: '#4a403d' }}>
                  I agree to the{' '}
                  <Link to="#" className="font-semibold hover:underline" style={{ color: '#D91E36' }} onClick={(e) => e.stopPropagation()}>Terms &amp; Conditions</Link>
                  {' '}and{' '}
                  <Link to="#" className="font-semibold hover:underline" style={{ color: '#D91E36' }} onClick={(e) => e.stopPropagation()}>Privacy Policy</Link>
                </span>
              </label>
              {errors.agreeTerms && <p className="mt-1.5 text-xs" style={{ color: '#D91E36' }}>{errors.agreeTerms}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #D91E36 0%, #A3122A 100%)', boxShadow: '0 4px 20px rgba(217,30,54,0.3)', letterSpacing: '0.02em' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(217,30,54,0.45)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(217,30,54,0.3)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity=".25" /><path d="M21 12a9 9 0 0 1-9 9" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm mt-7" style={{ color: '#857d79' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-bold transition-opacity hover:opacity-80" style={{ color: '#D91E36' }}>
              Sign in
            </Link>
          </p>

          <div className="mt-8 flex justify-center gap-6 text-xs font-medium" style={{ color: '#a8a09c' }}>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Secure &amp; encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z" /></svg>
              24/7 support
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileRegister />
  return <DesktopRegister />
}

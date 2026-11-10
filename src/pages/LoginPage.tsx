import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBattery, FiFeather, FiLock, FiMail, FiSmartphone, FiWatch, FiZap, FiCamera, FiHeart, FiActivity } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import MobileLogin from '../components/mobile/MobileLogin'
import { useIsMobile } from '../components/mobile/helpers'
import {
  AuthField, AuthHeading, AuthLayout, AuthSwitch, PasswordToggle, SocialSignIn, SubmitButton,
  type ShowcaseSlide,
} from '../components/auth/AuthLayout'
import { parseApiError, useValidatedForm, type FieldRules } from '../components/auth/useValidatedForm'

interface LoginForm {
  email: string
  password: string
  remember: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const REMEMBER_KEY = 'auth_remembered_email'

const rules: FieldRules<LoginForm> = {
  email: (v) => {
    const s = v.trim()
    if (!s) return 'Email address is required'
    if (!EMAIL_RE.test(s)) return 'Enter a valid email address (e.g. name@example.com)'
    return ''
  },
  password: (v) => (v ? '' : 'Password is required'),
}

function friendlyLoginError(msg: string): string {
  const lower = msg.toLowerCase()
  if (!msg || lower.includes('no active account') || lower.includes('not found') || lower.includes('invalid') || lower.includes('incorrect'))
    return 'Invalid email or password. Please check your details and try again.'
  if (lower.includes('disabled') || lower.includes('inactive')) return 'This account has been disabled. Please contact support.'
  if (lower.includes('locked') || lower.includes('too many')) return 'Too many attempts. Please wait a few minutes and try again.'
  return msg
}

function readRemembered(): string {
  try { return localStorage.getItem(REMEMBER_KEY) || '' } catch { return '' }
}

function SoundWave() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 6v12M23 11v2" />
    </svg>
  )
}

const productPhoto = (src: string, alt: string) => (
  <div className="auth-podium">
    <img src={src} alt={alt} loading="lazy" />
    <div className="auth-podium__tint" />
  </div>
)

const slides: ShowcaseSlide[] = [
  {
    eyebrow: 'Premium collection',
    title: 'TWS Earbuds',
    description: 'True wireless audio, redefined.',
    features: [
      { icon: <SoundWave />, label: 'Immersive Sound' },
      { icon: <FiBattery size={17} />, label: 'Long Battery Life' },
      { icon: <FiFeather size={17} />, label: 'Light & Comfortable' },
    ],
    visual: productPhoto('https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=900&q=80&auto=format', 'Wireless earbuds in a charging case'),
  },
  {
    eyebrow: 'Premium collection',
    title: 'Smartphones',
    description: 'Flagship devices at your fingertips.',
    features: [
      { icon: <FiCamera size={17} />, label: 'Pro-grade Cameras' },
      { icon: <FiZap size={17} />, label: 'Fast Charging' },
      { icon: <FiSmartphone size={17} />, label: 'Stunning Displays' },
    ],
    visual: productPhoto('https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=900&q=80&auto=format', 'Flagship smartphones'),
  },
  {
    eyebrow: 'Premium collection',
    title: 'Smart Watches',
    description: 'Wearable innovation on your wrist.',
    features: [
      { icon: <FiHeart size={17} />, label: 'Health Tracking' },
      { icon: <FiActivity size={17} />, label: 'Fitness Modes' },
      { icon: <FiWatch size={17} />, label: 'All-day Battery' },
    ],
    visual: productPhoto('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80&auto=format', 'Smart watch'),
  },
]

function DesktopLogin() {
  const navigate = useNavigate()
  const toast = useToast()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [remembered] = useState(readRemembered)
  const { values, errors, setValue, touch, validateAll } = useValidatedForm<LoginForm>(
    { email: remembered, password: '', remember: !!remembered },
    rules,
  )

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading || !validateAll()) return
    setLoading(true)
    const email = values.email.trim().toLowerCase()
    try {
      await login({ email, password: values.password })
      try {
        if (values.remember) localStorage.setItem(REMEMBER_KEY, email)
        else localStorage.removeItem(REMEMBER_KEY)
      } catch { /* storage unavailable */ }
      toast.show('Welcome back!', 'success')
      const redirect = sessionStorage.getItem('redirect_after_login')
      sessionStorage.removeItem('redirect_after_login')
      navigate(redirect || '/home', { replace: true })
    } catch (err) {
      toast.show(friendlyLoginError(parseApiError(err).message), 'error')
      setLoading(false)
    }
  }

  return (
    <AuthLayout slides={slides} variant="signin">
      <AuthHeading title="Welcome back" subtitle="Sign in to your account to continue shopping." />

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <AuthField
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Enter your email"
          icon={<FiMail size={18} />}
          value={values.email}
          onChange={(e) => setValue('email', e.target.value)}
          onBlur={() => touch('email')}
          error={errors.email}
        />

        <AuthField
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
          icon={<FiLock size={18} />}
          value={values.password}
          onChange={(e) => setValue('password', e.target.value)}
          onBlur={() => touch('password')}
          error={errors.password}
          labelAside={
            <button
              type="button"
              className="auth-link"
              onClick={() => toast.show('Password reset is not available yet. Please contact support to reset your password.', 'error')}
            >
              Forgot password?
            </button>
          }
          trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
        />

        <label className="auth-check">
          <input type="checkbox" checked={values.remember} onChange={(e) => setValue('remember', e.target.checked)} />
          Remember me
        </label>

        <SubmitButton loading={loading} label="Sign In" loadingLabel="Signing in…" />
      </form>

      <SocialSignIn mode="signin" />

      <AuthSwitch text="Don't have an account?" linkText="Create account" to="/signup" />
    </AuthLayout>
  )
}

export default function LoginPage() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileLogin />
  return <DesktopLogin />
}

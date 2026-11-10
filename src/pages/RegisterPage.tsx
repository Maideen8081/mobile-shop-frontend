import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiGift, FiHeadphones, FiLock, FiMail, FiPhone, FiShield, FiSmartphone, FiTruck, FiUser, FiWatch, FiTag, FiTool, FiStar } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import MobileRegister from '../components/mobile/MobileRegister'
import { useIsMobile } from '../components/mobile/helpers'
import {
  AuthField, AuthHeading, AuthLayout, AuthSwitch, BrandMark, PasswordToggle, SocialSignIn, SubmitButton,
  type ShowcaseSlide,
} from '../components/auth/AuthLayout'
import { parseApiError, useValidatedForm, type FieldRules } from '../components/auth/useValidatedForm'

interface RegisterForm {
  fullName: string
  email: string
  mobile: string
  password: string
}

// Same pattern the API uses, so anything accepted here is accepted there.
const EMAIL_RE = /^[\w.-]+@[\w-]+\.\w{2,4}$/
const NAME_RE = /^[\p{L}][\p{L} .'-]*$/u
const cleanMobile = (v: string) => v.replace(/[\s\-()]/g, '')
const passwordChecks = (p: string) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p)

const rules: FieldRules<RegisterForm> = {
  fullName: (v) => {
    const s = v.trim()
    if (!s) return 'Full name is required'
    if (s.length < 2) return 'Full name must be at least 2 characters'
    if (!NAME_RE.test(s)) return 'Use letters only (spaces, dots, hyphens and apostrophes are fine)'
    const [first, rest = ''] = s.split(/\s+(.*)/)
    if (first.length > 30 || rest.length > 30) return 'First and last name must each be 30 characters or fewer'
    return ''
  },
  email: (v) => {
    const s = v.trim().toLowerCase()
    if (!s) return 'Email address is required'
    if (!EMAIL_RE.test(s)) return 'Enter a valid email address (e.g. name@example.com)'
    return ''
  },
  mobile: (v) => {
    const s = cleanMobile(v)
    if (!s) return 'Mobile number is required'
    if (!/^\+?\d+$/.test(s)) return 'Mobile number can only contain digits and a leading +'
    if (!/^\+?\d{10,15}$/.test(s)) return 'Enter a valid mobile number (10–15 digits)'
    return ''
  },
  password: (v) => {
    if (!v) return 'Password is required'
    if (v.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Za-z]/.test(v)) return 'Password must include at least one letter'
    if (!/\d/.test(v)) return 'Password must include at least one number'
    if (v.length > 128) return 'Password must be 128 characters or fewer'
    return ''
  },
}

// API field name -> form field name
const API_FIELDS: Record<string, keyof RegisterForm> = {
  full_name: 'fullName', first_name: 'fullName', last_name: 'fullName',
  email: 'email', mobile: 'mobile', password: 'password', confirm_password: 'password',
}

function friendlyRegisterError(msg: string): string {
  if (!msg) return 'Something went wrong. Please try again.'
  if (/already exists|already registered|duplicate/i.test(msg)) return 'This email is already registered. Please sign in instead.'
  return msg
}

function BagScene() {
  return (
    <div className="auth-bag-scene" aria-hidden="true">
      <div className="auth-bag-scene__ring" />
      <span className="auth-bubble auth-bubble--phone"><FiSmartphone size={24} /></span>
      <span className="auth-bubble auth-bubble--audio"><FiHeadphones size={24} /></span>
      <span className="auth-bubble auth-bubble--watch"><FiWatch size={24} /></span>
      <div className="auth-bag">
        <div className="auth-bag__handle" />
        <div className="auth-bag__body" />
        <div className="auth-bag__logo"><BrandMark /></div>
      </div>
    </div>
  )
}

const slides: ShowcaseSlide[] = [
  {
    title: 'Create your account',
    description: 'Join MobileShop and enjoy a seamless shopping experience.',
    visual: <BagScene />,
    features: [
      { icon: <FiGift size={17} />, label: 'Exclusive Deals' },
      { icon: <FiShield size={17} />, label: 'Secure Payments' },
      { icon: <FiTruck size={17} />, label: 'Fast & Reliable Delivery' },
    ],
  },
  {
    title: 'Shop smarter',
    description: 'Save addresses, build a wishlist and check out in seconds.',
    visual: <BagScene />,
    features: [
      { icon: <FiTag size={17} />, label: 'Member-only Prices' },
      { icon: <FiStar size={17} />, label: 'Personal Wishlist' },
      { icon: <FiTruck size={17} />, label: 'Live Order Tracking' },
    ],
  },
  {
    title: 'Repairs made easy',
    description: 'Book repairs and follow every step from one account.',
    visual: <BagScene />,
    features: [
      { icon: <FiTool size={17} />, label: 'Doorstep Repair Booking' },
      { icon: <FiShield size={17} />, label: 'Genuine Parts' },
      { icon: <FiPhone size={17} />, label: 'Support When You Need It' },
    ],
  },
]

function DesktopRegister() {
  const navigate = useNavigate()
  const toast = useToast()
  const { register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { values, errors, setValue, touch, validateAll, setServerErrors } = useValidatedForm<RegisterForm>(
    { fullName: '', email: '', mobile: '', password: '' },
    rules,
  )

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading || !validateAll()) return
    setLoading(true)
    try {
      await register({
        fullName: values.fullName.trim().replace(/\s+/g, ' '),
        email: values.email.trim().toLowerCase(),
        mobile: cleanMobile(values.mobile),
        password: values.password,
        confirmPassword: values.password,
      })
      toast.show('Account created successfully!', 'success')
      const redirect = sessionStorage.getItem('redirect_after_login')
      sessionStorage.removeItem('redirect_after_login')
      navigate(redirect || '/home', { replace: true })
    } catch (err) {
      const { message, fields } = parseApiError(err)
      const mapped: Partial<Record<keyof RegisterForm, string>> = {}
      for (const [key, msg] of Object.entries(fields)) {
        const field = API_FIELDS[key]
        if (field && !mapped[field]) mapped[field] = friendlyRegisterError(msg)
      }
      setServerErrors(mapped)
      const first = Object.keys(mapped)[0]
      if (first) document.getElementById(`auth-${first}`)?.focus()
      else toast.show(friendlyRegisterError(message), 'error')
      setLoading(false)
    }
  }

  const passwordOk = passwordChecks(values.password)

  return (
    <AuthLayout slides={slides} variant="signup">
      <AuthHeading title="Create an account" subtitle="Get started with your MobileShop account." />

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <AuthField
          name="fullName"
          label="Full name"
          autoComplete="name"
          placeholder="Enter your full name"
          maxLength={61}
          icon={<FiUser size={18} />}
          value={values.fullName}
          onChange={(e) => setValue('fullName', e.target.value)}
          onBlur={() => touch('fullName')}
          error={errors.fullName}
        />

        <AuthField
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Enter your email"
          maxLength={254}
          icon={<FiMail size={18} />}
          value={values.email}
          onChange={(e) => setValue('email', e.target.value)}
          onBlur={() => touch('email')}
          error={errors.email}
        />

        <AuthField
          name="mobile"
          label="Mobile number"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="Enter your mobile number"
          maxLength={20}
          icon={<FiPhone size={18} />}
          value={values.mobile}
          // Only allow characters a phone number can contain.
          onChange={(e) => setValue('mobile', e.target.value.replace(/[^\d+\s\-()]/g, ''))}
          onBlur={() => touch('mobile')}
          error={errors.mobile}
        />

        <AuthField
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Create a password"
          icon={<FiLock size={18} />}
          value={values.password}
          onChange={(e) => setValue('password', e.target.value)}
          onBlur={() => touch('password')}
          error={errors.password}
          hint={
            <span className={passwordOk ? 'is-ok' : undefined} style={passwordOk ? { color: 'var(--auth-ok)' } : undefined}>
              Use at least 8 characters with a number and a letter.
            </span>
          }
          trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
        />

        <SubmitButton loading={loading} label="Create Account" loadingLabel="Creating account…" />
      </form>

      <SocialSignIn mode="signup" />

      <AuthSwitch text="Already have an account?" linkText="Sign in" to="/login" />
    </AuthLayout>
  )
}

export default function RegisterPage() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileRegister />
  return <DesktopRegister />
}

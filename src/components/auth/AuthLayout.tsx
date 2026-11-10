import type { InputHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FiAlertCircle, FiArrowRight, FiEye, FiEyeOff, FiShoppingBag } from 'react-icons/fi'
import GoogleSignInButton from './GoogleSignInButton'
import './AuthLayout.css'

type Mode = 'signin' | 'signup'

interface AuthLayoutProps {
  mode: Mode
  /** dark = purple header (sign in), light = lavender header (sign up) */
  tone: 'dark' | 'light'
  title: ReactNode
  subtitle: string
  perks?: { icon: ReactNode; label: string }[]
  image: { src: string; alt: string }
  children: ReactNode
}

/** Full-screen auth page: product header across the top, form panel below. The page never scrolls. */
export function AuthLayout({ mode, tone, title, subtitle, perks, image, children }: AuthLayoutProps) {
  return (
    <div className={`auth-page auth-page--${mode}`}>
      <header className={`auth-hero auth-hero--${tone}`}>
        <div className="auth-hero__glow" aria-hidden="true" />
        <div className="auth-hero__inner">
          <div className="auth-hero__copy">
            <Link to="/home" className="auth-brand">
              <span className="auth-brand__mark" aria-hidden="true"><FiShoppingBag size={22} /></span>
              <span className="auth-brand__text">
                <strong>MobileShop</strong>
                <small>Premium Mobile Store</small>
              </span>
            </Link>
            <h1 className="auth-hero__title">{title}</h1>
            <p className="auth-hero__sub">{subtitle}</p>
            {perks && (
              <ul className="auth-hero__perks">
                {perks.map((p) => <li key={p.label}>{p.icon}{p.label}</li>)}
              </ul>
            )}
          </div>
          <div className="auth-hero__art" aria-hidden="true">
            <img src={image.src} alt="" />
          </div>
        </div>
      </header>

      <main className="auth-panel">
        <div className="auth-panel__inner">
          <AuthTabs active={mode} />
          {children}
        </div>
      </main>
    </div>
  )
}

function AuthTabs({ active }: { active: Mode }) {
  return (
    <nav className="auth-tabs" aria-label="Account">
      <span className={`auth-tabs__pill auth-tabs__pill--${active}`} aria-hidden="true" />
      <Link to="/login" replace className={active === 'signin' ? 'is-active' : ''} aria-current={active === 'signin' ? 'page' : undefined}>
        Sign In
      </Link>
      <Link to="/signup" replace className={active === 'signup' ? 'is-active' : ''} aria-current={active === 'signup' ? 'page' : undefined}>
        Create Account
      </Link>
    </nav>
  )
}

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  name: string
  label: string
  icon: ReactNode
  error?: string
  hint?: ReactNode
  labelAside?: ReactNode
  trailing?: ReactNode
}

export function AuthField({ name, label, icon, error, hint, labelAside, trailing, ...input }: FieldProps) {
  const id = `auth-${name}`
  const msgId = `${id}-msg`
  return (
    <div className={`auth-field ${error ? 'has-error' : ''} ${trailing ? 'has-trailing' : ''}`}>
      <div className="auth-field__label-row">
        <label htmlFor={id}>
          <span className="auth-field__icon" aria-hidden="true">{icon}</span>
          {label}
        </label>
        {labelAside}
      </div>
      <div className="auth-field__control">
        <input id={id} name={name} aria-invalid={!!error} aria-describedby={error || hint ? msgId : undefined} {...input} />
        {trailing && <span className="auth-field__trailing">{trailing}</span>}
      </div>
      {error ? (
        <p id={msgId} className="auth-field__error" role="alert">
          <FiAlertCircle size={13} aria-hidden="true" /> {error}
        </p>
      ) : hint ? (
        <div id={msgId} className="auth-field__hint">{hint}</div>
      ) : null}
    </div>
  )
}

export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="auth-icon-btn" onClick={onToggle} aria-label={shown ? 'Hide password' : 'Show password'}>
      {shown ? <FiEye size={19} /> : <FiEyeOff size={19} />}
    </button>
  )
}

/** Three-step strength meter shown under a new password. */
export function PasswordStrength({ password, ok, text }: { password: string; ok: boolean; text: string }) {
  const score = !password ? 0
    : password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
      ? (password.length >= 12 || /[^A-Za-z0-9]/.test(password) ? 3 : 2)
      : 1
  const label = ['', 'Weak', 'Good', 'Strong'][score]
  return (
    <div className={`auth-strength auth-strength--${score}`}>
      <span className="auth-strength__bars" aria-hidden="true"><i /><i /><i /></span>
      <span className={`auth-strength__text ${ok ? 'is-ok' : ''}`}>
        {text}
        {label && <span className="sr-only"> Password strength: {label}.</span>}
      </span>
    </div>
  )
}

export function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button type="submit" className="auth-submit" disabled={loading}>
      {loading ? (
        <><span className="auth-spinner" aria-hidden="true" /> {loadingLabel}</>
      ) : (
        <>{label} <FiArrowRight size={19} aria-hidden="true" /></>
      )}
    </button>
  )
}

export function SocialSignIn({ mode }: { mode: Mode }) {
  return (
    <>
      <div className="auth-divider"><span>{mode === 'signup' ? 'Or sign up with' : 'Or continue with'}</span></div>
      <GoogleSignInButton mode={mode} shape="rectangular" />
    </>
  )
}

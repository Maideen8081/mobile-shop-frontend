import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FiAlertCircle, FiArrowRight, FiEye, FiEyeOff, FiShoppingBag } from 'react-icons/fi'
import GoogleSignInButton from './GoogleSignInButton'
import './AuthLayout.css'

type Mode = 'signin' | 'signup'

export interface ShowcaseSlide {
  eyebrow?: string
  title: string
  description: string
  features?: { icon: ReactNode; label: string }[]
  visual?: ReactNode
}

interface AuthLayoutProps {
  variant: Mode
  slides: ShowcaseSlide[]
  children: ReactNode
}

const SLIDE_MS = 6000

/** The MobileShop logo glyph. */
export function BrandMark() {
  return <span className="auth-brand__mark" aria-hidden="true"><FiShoppingBag size={22} /></span>
}

function Brand({ className = '' }: { className?: string }) {
  return (
    <Link to="/home" className={`auth-brand ${className}`}>
      <BrandMark />
      MobileShop
    </Link>
  )
}

/** Full-screen auth page: rotating product showcase on the left, form on the right. The page never scrolls. */
export function AuthLayout({ variant, slides, children }: AuthLayoutProps) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || slides.length < 2) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setTimeout(() => setActive((i) => (i + 1) % slides.length), SLIDE_MS)
    return () => window.clearTimeout(t)
  }, [active, paused, slides.length])

  return (
    <div className="auth-page">
      <div className={`auth-card auth-card--${variant}`}>
        <aside
          className="auth-showcase"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="auth-showcase__glow" aria-hidden="true" />
          <Brand />
          <div className="auth-showcase__slides" aria-live="polite">
            {slides.map((slide, i) => (
              <section
                key={slide.title}
                className={`auth-slide ${i === active ? 'is-active' : ''}`}
                aria-hidden={i !== active}
              >
                {slide.eyebrow && <p className="auth-slide__eyebrow">{slide.eyebrow}</p>}
                <h2 className="auth-slide__title">{slide.title}</h2>
                <p className="auth-slide__desc">{slide.description}</p>
                {slide.visual && <div className="auth-slide__visual">{slide.visual}</div>}
                {slide.features && (
                  <ul className="auth-slide__features">
                    {slide.features.map((f) => (
                      <li key={f.label}>
                        <span className="auth-slide__feature-icon" aria-hidden="true">{f.icon}</span>
                        {f.label}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
          {slides.length > 1 && (
            <div className="auth-dots" role="tablist" aria-label="Showcase slides">
              {slides.map((slide, i) => (
                <button
                  key={slide.title}
                  type="button"
                  role="tab"
                  className={i === active ? 'is-active' : ''}
                  aria-selected={i === active}
                  aria-label={`Show slide ${i + 1}: ${slide.title}`}
                  onClick={() => setActive(i)}
                />
              ))}
            </div>
          )}
        </aside>

        <main className="auth-form-side">
          <div>
            <Brand className="auth-brand--dark auth-brand--compact" />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="auth-heading">
      <h1>
        {title}
        <span className="auth-heading__spark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
          </svg>
        </span>
      </h1>
      <p>{subtitle}</p>
    </div>
  )
}

export function AuthSwitch({ text, linkText, to }: { text: string; linkText: string; to: string }) {
  return (
    <p className="auth-switch">
      {text}
      <Link to={to} replace>{linkText}</Link>
    </p>
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
        <label htmlFor={id}>{label}</label>
        {labelAside}
      </div>
      <div className="auth-field__control">
        <span className="auth-field__icon" aria-hidden="true">{icon}</span>
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

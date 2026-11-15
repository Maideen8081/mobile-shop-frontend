import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { BUSINESS, tradeInUpTo } from '../../config/business'
import { Link } from 'react-router-dom'
import {
  FiAlertCircle, FiArrowLeft, FiArrowRight, FiEye, FiEyeOff, FiLock, FiRefreshCw, FiRepeat, FiShield,
  FiShoppingBag, FiStar, FiTool, FiTruck,
} from 'react-icons/fi'
import GoogleSignInButton from './GoogleSignInButton'
import './AuthLayout.css'

type Mode = 'signin' | 'signup'

export interface ShowcaseSlide {
  eyebrow?: string
  title: string
  description: string
  features?: { icon: ReactNode; label: string }[]
  visual?: ReactNode
  /** Full-bleed background photo for the showcase tile. */
  image?: string
  /** Shown if `image` fails to load (e.g. the local file hasn't been added). */
  imageFallback?: string
}

const unsplash = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`

/**
 * Tile photos. Drop your own images into `public/auth/` with these names and
 * they are used automatically; until then the fallback photo shows.
 */
const TILE_PHOTOS = {
  rating: { src: '/auth/rating.jpg', fallback: unsplash('1592899677977-9c10ca588bbd', 700) },
  repair: { src: '/auth/repair.jpg', fallback: '/products/repair-internals.jpg' },
  trade: { src: '/auth/trade.jpg', fallback: unsplash('1556656793-08538906a9f8', 700) },
}

/** Swap to the fallback photo once if the preferred file is missing. */
function fallbackTo(fallback: string) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    if (img.dataset.fellBack) return
    img.dataset.fellBack = '1'
    img.src = fallback
  }
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

function Brand() {
  return (
    <Link to="/home" className="auth-brand">
      <span className="auth-brand__mark" aria-hidden="true"><FiTool size={20} /></span>
      <span className="auth-brand__text">
        <span>PhoneFix<i>.</i></span>
        <small>Premium Mobile Store</small>
      </span>
    </Link>
  )
}

const AVATARS = ['AS', 'PK', 'RM', 'AR']

/**
 * Full-screen auth page (never scrolls as a whole).
 * Left: the form card with Sign in / Create account tabs.
 * Right: a bento grid — rotating product showcase plus trust tiles.
 */
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
      <div className={`auth-shell auth-shell--${variant}`}>
        <main className="auth-panel">
          <header className="auth-panel__top">
            <Brand />
            <Link to="/home" className="auth-back">
              <FiArrowLeft size={15} aria-hidden="true" /> Back to store
            </Link>
          </header>

          <div className="auth-panel__body">
            <div className="auth-panel__inner">
              <nav className={`auth-tabs auth-tabs--${variant}`} aria-label="Account">
                <span className="auth-tabs__thumb" aria-hidden="true" />
                <Link to="/login" replace aria-current={variant === 'signin' ? 'page' : undefined}>Sign in</Link>
                <Link to="/signup" replace aria-current={variant === 'signup' ? 'page' : undefined}>Create account</Link>
              </nav>
              {children}
            </div>
          </div>

          <footer className="auth-panel__foot">
            <FiLock size={13} aria-hidden="true" />
            <span>Secure, encrypted sign-in</span>
            <span className="auth-panel__dot" aria-hidden="true" />
            <Link to="/support">Need help?</Link>
          </footer>
        </main>

        <aside className="auth-bento" aria-label="Why shop with PhoneFix">
          <section
            className="bento bento--hero"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <span className="bento-hero__glow" aria-hidden="true" />
            {slides.map((slide, i) => slide.image && (
              <img
                key={`bg-${slide.title}`}
                src={slide.image}
                onError={slide.imageFallback ? fallbackTo(slide.imageFallback) : undefined}
                alt=""
                aria-hidden="true"
                className={`bento-hero__photo${i === active ? ' is-active' : ''}`}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            ))}
            <div className="bento-hero__slides" aria-live="polite">
              {slides.map((slide, i) => (
                <div
                  key={slide.title}
                  className={`auth-slide ${i === active ? 'is-active' : ''}`}
                  aria-hidden={i !== active}
                >
                  <div className="auth-slide__copy">
                    {slide.eyebrow && <p className="auth-slide__eyebrow">{slide.eyebrow}</p>}
                    <h2 className="auth-slide__title">{slide.title}</h2>
                    <p className="auth-slide__desc">{slide.description}</p>
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
                  </div>
                  {slide.visual && <div className="auth-slide__visual">{slide.visual}</div>}
                </div>
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
          </section>

          <div className="bento bento--rating">
            <img className="bento-rating__photo" src={TILE_PHOTOS.rating.src} onError={fallbackTo(TILE_PHOTOS.rating.fallback)} alt="" aria-hidden="true" loading="lazy" />
            <div className="bento-rating__score">
              <b>4.8</b>
              <span className="bento-rating__stars" aria-label="4.8 out of 5 stars">
                {[0, 1, 2, 3, 4].map((i) => <FiStar key={i} size={14} aria-hidden="true" />)}
              </span>
            </div>
            <p><b>{BUSINESS.devicesRepaired}</b> devices repaired at our {BUSINESS.city.split(',')[0]} store</p>
            <div className="bento-rating__faces" aria-hidden="true">
              {AVATARS.map((a) => <span key={a}>{a}</span>)}
            </div>
          </div>

          <div className="bento bento--repair">
            <img className="bento-photo" src={TILE_PHOTOS.repair.src} onError={fallbackTo(TILE_PHOTOS.repair.fallback)} alt="" aria-hidden="true" loading="lazy" />
            <span className="bento-icon"><FiTool size={20} /></span>
            <span className="bento-big">{BUSINESS.expressRepairMinutes}<small>min</small></span>
            <span className="bento-label">Express screen &amp; battery repairs</span>
          </div>

          <div className="bento bento--trade">
            <img className="bento-photo" src={TILE_PHOTOS.trade.src} onError={fallbackTo(TILE_PHOTOS.trade.fallback)} alt="" aria-hidden="true" loading="lazy" />
            <span className="bento-icon"><FiRepeat size={20} /></span>
            <span className="bento-kicker">Trade-in value up to</span>
            <span className="bento-big">{tradeInUpTo()}</span>
            <span className="bento-label">for your old phone</span>
          </div>

          <ul className="bento bento--perks">
            <li><FiTruck size={18} aria-hidden="true" /><span><b>Free delivery</b> over ₹500</span></li>
            <li><FiShield size={18} aria-hidden="true" /><span><b>100% genuine</b> products</span></li>
            <li><FiRefreshCw size={18} aria-hidden="true" /><span><b>7-day</b> easy returns</span></li>
            <li><FiShoppingBag size={18} aria-hidden="true" /><span><b>No-cost EMI</b> available</span></li>
          </ul>
        </aside>
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

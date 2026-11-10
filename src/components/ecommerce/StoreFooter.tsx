import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Wrench } from 'lucide-react'
import { socials } from './Footer'
import './StoreFooter.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'Smartphones', to: '/collection/Smartphones' },
      { label: 'Tablets', to: '/collection/Tablets' },
      { label: 'Smart Watches', to: '/collection/Smart%20Watches' },
      { label: 'Earbuds', to: '/collection/Earbuds' },
      { label: 'Headphones', to: '/collection/Headphones' },
      { label: 'Power Banks', to: '/collection/Power%20Banks' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Phone Repair', to: '/book-repair' },
      { label: 'Trade-In', to: '/trade-in' },
      { label: 'Refurbished Phones', to: '/collection/Refurbished%20Devices' },
      { label: 'Track My Repair', to: '/my-repairs' },
      { label: 'Track Your Order', to: '/orders' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Support Chat', to: '/support' },
      { label: 'Repair Services', to: '/repairs' },
      { label: 'About Us', to: '/about' },
      { label: 'My Account', to: '/profile' },
      { label: 'Wishlist', to: '/wishlist' },
    ],
  },
]

const PAYMENTS = ['VISA', 'Mastercard', 'UPI', 'RuPay']

/** Storefront footer (home page): dark purple band with link columns and newsletter. */
export default function StoreFooter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)

  const subscribe = (e: FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setStatus({ ok: false, text: 'Please enter a valid email address.' })
      return
    }
    // No newsletter API yet: remember the address in this browser only.
    try { localStorage.setItem('newsletter_email', value) } catch { /* storage blocked */ }
    setEmail('')
    setStatus({ ok: true, text: 'Thanks! You’ll hear about new launches and offers first.' })
  }

  return (
    <footer className="sf">
      <div className="sf-inner">
        <div className="sf-grid">
          <div className="sf-brand">
            <Link to="/home" className="sf-logo" aria-label="PhoneFix home">
              <span className="sf-logo-mark"><Wrench size={22} /></span>
              <span>
                <span className="sf-logo-name">PhoneFix.</span>
                <span className="sf-logo-tag">Premium Mobile Store</span>
              </span>
            </Link>
            <p>Your one-stop destination for smartphones, accessories, and expert repair services.</p>
            <div className="sf-social">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d={s.path} fill="currentColor" /></svg>
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="sf-col">
              <h2>{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}><Link to={l.to}>{l.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}

          <form className="sf-news" onSubmit={subscribe} noValidate>
            <h2>Stay Updated</h2>
            <p>Subscribe to get the latest deals, new arrivals and exclusive offers.</p>
            <div className="sf-news-row">
              <label htmlFor="sf-email" className="sf-sr">Email address</label>
              <input
                id="sf-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus(null) }}
              />
              <button type="submit" aria-label="Subscribe"><ArrowRight size={18} /></button>
            </div>
            {status && (
              <p className={status.ok ? 'sf-ok' : 'sf-err'} role="status">{status.text}</p>
            )}
          </form>
        </div>

        <div className="sf-bottom">
          <p>© {new Date().getFullYear()} PhoneFix. All rights reserved.</p>
          <ul className="sf-pay" aria-label="Payment methods we accept">
            {PAYMENTS.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </div>
    </footer>
  )
}

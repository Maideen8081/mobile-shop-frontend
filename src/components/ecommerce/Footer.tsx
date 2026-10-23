import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone, Wrench } from 'lucide-react'
import './Footer.css'

const columns = [
  {
    title: 'Quick Links',
    links: [
      { label: 'Home', to: '/home' },
      { label: 'Shop Phones', to: '/phones' },
      { label: 'Accessories', to: '/accessories' },
      { label: 'All Products', to: '/collection/all' },
    ],
  },
  {
    title: 'Customer Care',
    links: [
      { label: 'My Orders', to: '/orders' },
      { label: 'Track My Repair', to: '/my-repairs' },
      { label: 'Wishlist', to: '/wishlist' },
      { label: 'Support Chat', to: '/support' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Repair Services', to: '/repairs' },
      { label: 'Book a Repair', to: '/book-repair' },
      { label: 'Trade-In', to: '/trade-in' },
    ],
  },
]

// Swap these for the shop's own social pages when they exist.
const socials = [
  {
    label: 'WhatsApp',
    href: 'https://wa.me/919876543210',
    path: 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/',
    path: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM21.9 7.9a6 6 0 0 0-1.6-4.2A6 6 0 0 0 16 2.1C14.4 2 9.6 2 8 2.1a6 6 0 0 0-4.2 1.6A6 6 0 0 0 2.1 8C2 9.6 2 14.4 2.1 16a6 6 0 0 0 1.6 4.2A6 6 0 0 0 8 21.9c1.6.1 6.4.1 8 0a6 6 0 0 0 4.2-1.6 6 6 0 0 0 1.6-4.2c.1-1.6.1-6.4 0-8Zm-2.1 9.9a3.3 3.3 0 0 1-1.9 1.9c-1.3.5-4.4.4-5.9.4s-4.6.1-5.9-.4a3.3 3.3 0 0 1-1.9-1.9c-.5-1.3-.4-4.4-.4-5.8s-.1-4.6.4-5.9a3.3 3.3 0 0 1 1.9-1.9C7.4 3.7 10.5 3.8 12 3.8s4.6-.1 5.9.4a3.3 3.3 0 0 1 1.9 1.9c.5 1.3.4 4.4.4 5.9s.1 4.5-.4 5.8Z',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/',
    path: 'M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/',
    path: 'M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15V9l5.8 3-5.8 3Z',
  },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function EcommerceFooter() {
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
    <footer className="pff">
      <div className="pff-inner">
        <div className="pff-top">
          <div className="pff-brand">
            <Link to="/home" className="pff-logo" aria-label="PhoneFix home">
              <span className="pff-logo-mark"><Wrench size={22} /></span>
              <span>
                <span className="pff-logo-name">PhoneFix<b>.</b></span>
                <span className="pff-logo-tag">Premium Mobile Store</span>
              </span>
            </Link>
            <p>
              PhoneFix is where genuine devices meet honest repairs. We sell original smartphones and
              accessories, and fix phones with tested parts and a warranty on every repair.
            </p>
          </div>

          <form className="pff-news" onSubmit={subscribe} noValidate>
            <h2>Newsletter</h2>
            <div className="pff-news-row">
              <label htmlFor="pff-email" className="pff-sr">Email address</label>
              <input
                id="pff-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus(null) }}
              />
              <button type="submit">Subscribe</button>
            </div>
            {status ? (
              <p className={status.ok ? 'pff-news-ok' : 'pff-news-err'} role="status">{status.text}</p>
            ) : (
              <p>Get updates on new phone launches, exclusive deals and repair tips.</p>
            )}
          </form>
        </div>

        <div className="pff-cols">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2>{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}><Link to={l.to}>{l.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="pff-connect">
            <h2>Connect With Us</h2>
            <ul>
              <li><a href="mailto:support@phonefixpro.com"><Mail size={15} /> support@phonefixpro.com</a></li>
              <li><a href="tel:+919876543210"><Phone size={15} /> +91 98765 43210</a></li>
              <li><span><MapPin size={15} /> Chennai, Tamil Nadu</span></li>
            </ul>
            <div className="pff-social">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={s.path} fill="currentColor" /></svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <p className="pff-copy">© {new Date().getFullYear()} PhoneFix Pro. All Rights Reserved.</p>
      </div>

    </footer>
  )
}

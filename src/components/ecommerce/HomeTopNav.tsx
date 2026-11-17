import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  Heart,
  Lock,
  Menu,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  User,
} from 'lucide-react'
import { BUSINESS } from '../../config/business'
import { categoryHref } from './navConfig'
import { useHeaderCategories, useNavState } from './useNavState'
import './HomeTopNav.css'

const NAV_LINKS = [
  { label: 'Home', to: '/home' },
  { label: 'Shop', to: '/collection/all' },
  { label: 'Deals', to: '/collection/all?tab=deals' },
  { label: 'New Arrivals', to: '/collection/all?tab=new' },
  { label: 'Repairs', to: '/repairs' },
  { label: 'Trade In', to: '/trade-in' },
  { label: 'Track Order', to: '/orders' },
]

export function Logo({ light = false }: { light?: boolean } = {}) {
  return (
    <Link to="/home" className={`vv-logo${light ? ' is-light' : ''}`} aria-label={`${BUSINESS.name} home`}>
      <svg className="vv-logo-mark" viewBox="0 0 40 44" aria-hidden="true">
        <path d="M6 14h28l-2.2 24.5a3 3 0 0 1-3 2.7H11.2a3 3 0 0 1-3-2.7L6 14Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M14 14v-3a6 6 0 0 1 12 0v3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M20 35c0-6 1.5-10 6.5-12.5C27 28 24.5 33 20 35Zm0 0c0-5-1.2-8.2-5.3-10.2-.4 4.6 1.6 8.6 5.3 10.2Z" className="vv-logo-leaf" />
      </svg>
      <span className="vv-logo-text">
        <b>{BUSINESS.name}</b>
        <small>Fix · Buy · Upgrade</small>
      </span>
    </Link>
  )
}

export default function HomeTopNav() {
  const navigate = useNavigate()
  const { cartCount, wishlistCount, isAuth, user, displayName, initials } = useNavState()
  const headerCats = useHeaderCategories()
  const [query, setQuery] = useState('')
  const [catsOpen, setCatsOpen] = useState(false)
  const catsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!catsOpen) return
    const onDown = (e: PointerEvent) => {
      if (!catsRef.current?.contains(e.target as Node)) setCatsOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCatsOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [catsOpen])

  const submitSearch = (e: FormEvent) => {
    e.preventDefault()
    const term = query.trim()
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search')
  }

  return (
    <div className="vv vv-nav-shell">
      <div className="vv-topbar">
        <span><Truck size={14} /> Free Shipping on Orders Over ₹{BUSINESS.freeDeliveryOver}</span>
        <i aria-hidden="true" />
        <span><ShieldCheck size={14} /> {BUSINESS.returnDays}-Day Easy Returns</span>
        <i aria-hidden="true" />
        <span><Lock size={14} /> Secure Payments</span>
      </div>

      <header className="vv-header">
        <div className="vv-container vv-header-row">
          <Logo />
          <form className="vv-search" role="search" onSubmit={submitSearch}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search phones, accessories and more..."
              aria-label="Search products"
            />
            <button type="submit" aria-label="Search"><Search size={18} /></button>
          </form>
          <nav className="vv-actions" aria-label="Account">
            <Link
              to={isAuth ? '/profile' : '/login'}
              data-tip={isAuth ? `${displayName || 'Account'}${user.email ? ` · ${user.email}` : ''}` : 'Sign in to your account'}
            >
              {isAuth && initials ? (
                <span className="vv-avatar" title={displayName}>{initials}</span>
              ) : (
                <User size={21} strokeWidth={1.7} />
              )}
              <span>{isAuth ? displayName.split(' ')[0] || 'Account' : 'Sign In'}</span>
            </Link>
            <Link to="/wishlist">
              <span className="vv-ico">
                <Heart size={21} strokeWidth={1.7} />
                {wishlistCount > 0 && <b>{wishlistCount}</b>}
              </span>
              <span>Wishlist</span>
            </Link>
            <Link to="/cart">
              <span className="vv-ico">
                <ShoppingCart size={21} strokeWidth={1.7} />
                {cartCount > 0 && <b>{cartCount}</b>}
              </span>
              <span>Cart</span>
            </Link>
          </nav>
        </div>
        <div className="vv-container vv-nav-row">
          <div className="vv-cats" ref={catsRef}>
            <button type="button" className="vv-cats-btn" aria-expanded={catsOpen} onClick={() => setCatsOpen((o) => !o)}>
              <Menu size={17} /> All Categories <ChevronDown size={15} className="vv-caret" />
            </button>
            {catsOpen && (
              <ul className="vv-cats-menu">
                {headerCats.map((c) => (
                  <li key={c.id}>
                    <Link to={categoryHref(c.name)} onClick={() => setCatsOpen(false)}>{c.name} <ChevronRight size={14} /></Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <nav className="vv-nav" aria-label="Main">
            {NAV_LINKS.map((l) => (
              <Link key={l.label} to={l.to} className={l.to === '/home' ? 'is-active' : ''}>{l.label}</Link>
            ))}
          </nav>
        </div>
      </header>
    </div>
  )
}

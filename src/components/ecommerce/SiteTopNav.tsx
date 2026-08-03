import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categoryService } from '../../services/categoryService'
import { authService } from '../../services/authService'
import { cartService } from '../../services/cartService'
import './SiteTopNav.css'

let cachedHeaderCategories: any[] | null = null

const CATEGORY_ICONS: Record<string, React.ReactElement> = {
  Smartphones: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>,
  Tablets: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/></svg>,
  'Smart Watches': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 2h6M9 22h6"/></svg>,
  'Earbuds (TWS)': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M3 18a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3zM21 18a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/></svg>,
  Headphones: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M3 18a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3zM21 18a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/></svg>,
  'Power Banks': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="18" height="11" rx="2"/><path d="M22 11v3M7 11v2M12 11v2"/></svg>,
  Chargers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  'Charging Cables': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
  'Mobile Cases & Covers': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="2" width="12" height="20" rx="3"/></svg>,
  'Screen Protectors': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
}

const DefaultIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
)

export default function SiteTopNav() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [acctOpen, setAcctOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const [user, setUser] = useState<{ name: string; email: string }>({ name: '', email: '' })
  const [categories, setCategories] = useState<any[]>(() => cachedHeaderCategories || [])

  const rootRef = useRef<HTMLDivElement>(null)
  const acctRef = useRef<HTMLDivElement>(null)
  const megaRef = useRef<HTMLDivElement>(null)
  const [navH, setNavH] = useState(0)

  /* ── auth ── */
  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem('user_profile')
        if (stored) setUser(JSON.parse(stored))
      } catch { /* ignore */ }
    }
    load()
    window.addEventListener('auth-changed', load)
    return () => window.removeEventListener('auth-changed', load)
  }, [])

  /* ── wishlist ── */
  useEffect(() => {
    const update = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('wishlist') || '[]')
        setWishlistCount(Array.isArray(stored) ? stored.length : 0)
      } catch { setWishlistCount(0) }
    }
    update()
    window.addEventListener('wishlist-updated', update)
    return () => window.removeEventListener('wishlist-updated', update)
  }, [])

  /* ── cart ── */
  useEffect(() => {
    const update = () => setCartCount(cartService.getCachedCartCount())
    update()
    window.addEventListener('cart-updated', update)
    return () => window.removeEventListener('cart-updated', update)
  }, [])

  /* ── categories ── */
  useEffect(() => {
    if (cachedHeaderCategories) { setCategories(cachedHeaderCategories); return }
    categoryService.list().then((cats) => {
      const mapped = cats
        .filter((c: any) => c.status === 'active')
        .map((c: any) => ({ id: c.id, name: c.name }))
      cachedHeaderCategories = mapped
      setCategories(mapped)
    }).catch(() => {})
  }, [])

  /* ── measure nav height for spacer ── */
  useEffect(() => {
    const measure = () => { if (rootRef.current) setNavH(rootRef.current.offsetHeight) }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [scrolled])

  /* ── scroll compact ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── close dropdowns on outside click ── */
  useEffect(() => {
    if (!acctOpen && !megaOpen) return
    const close = (e: MouseEvent) => {
      if (acctRef.current && !acctRef.current.contains(e.target as Node)) setAcctOpen(false)
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [acctOpen, megaOpen])

  const isAuth = authService.isAuthenticated()
  const initials = user.name
    ? user.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) navigate(`/collection/all?search=${encodeURIComponent(q.trim())}`)
  }

  const handleLogout = () => {
    authService.logout()
    window.dispatchEvent(new Event('auth-changed'))
    setAcctOpen(false)
    navigate('/')
  }

  const catChunks: any[][] = []
  for (let i = 0; i < categories.length; i += 4) catChunks.push(categories.slice(i, i + 4))

  return (
    <>
      <div className={`pfn-root${scrolled ? ' pfn-scrolled' : ''}`} ref={rootRef}>

        {/* ══ ROW 1: UTILITY BAR ══ */}
        {!scrolled && (
          <div className="pfn-util-bar">
            <div className="pfn-util-inner">
              <div className="pfn-util-left">
                <a href="tel:+919876543210">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.7 2z"/>
                  </svg>
                  +91 98765 43210
                </a>
                <div className="pfn-util-sep"/>
                <a href="mailto:support@phonefixpro.com">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  support@phonefixpro.com
                </a>
                <div className="pfn-util-sep"/>
                <span>Free delivery on orders over ₹500</span>
              </div>
              <div className="pfn-util-right">
                <span className="pfn-util-badge sale">Sale</span>
                <span className="pfn-util-badge new">New Arrivals</span>
                <div className="pfn-util-sep"/>
                <Link to="/book-repair">Book Repair</Link>
                <Link to="/track-repair">Track Device</Link>
                {!isAuth && (
                  <>
                    <div className="pfn-util-sep"/>
                    <Link to="/login">Sign In</Link>
                    <Link to="/register">Register</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ ROW 2: MAIN BAR (white) ══ */}
        <div className="pfn-main-bar">
          <div className="pfn-main-inner">

            {/* Logo */}
            <Link to="/" className="pfn-logo">
              <div className="pfn-logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18v3h3l5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7z"/>
                </svg>
              </div>
              <div className="pfn-logo-text">
                <span className="pfn-logo-name">PhoneFix<span>.</span></span>
                <span className="pfn-logo-sub">Premium Mobile Store</span>
              </div>
            </Link>

            {/* Search */}
            <div className="pfn-search-wrap">
              <form className="pfn-search-form" onSubmit={handleSearch}>
                <svg className="pfn-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>
                </svg>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search phones, earbuds, accessories…"
                  aria-label="Search products"
                />
                <button type="submit" className="pfn-search-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>
                  </svg>
                  <span className="pfn-btn-label">Search</span>
                </button>
              </form>
            </div>

            {/* Icon cluster */}
            <div className="pfn-icon-cluster">
              {/* Wishlist */}
              <Link to="/wishlist" className="pfn-icon-btn" aria-label="Wishlist">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
                </svg>
                {wishlistCount > 0 && <span className="pfn-badge">{wishlistCount > 99 ? '99+' : wishlistCount}</span>}
              </Link>

              {/* Cart */}
              <Link to="/cart" className="pfn-cart-btn" aria-label="Cart">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>
                </svg>
                <span className="pfn-cart-label">Cart</span>
                {cartCount > 0 && <span className="pfn-cart-count">{cartCount > 99 ? '99+' : cartCount}</span>}
              </Link>

              {/* Account */}
              {isAuth ? (
                <div className="pfn-acc-wrap" ref={acctRef}>
                  <button
                    className={`pfn-acc-btn${acctOpen ? ' open' : ''}`}
                    onClick={() => setAcctOpen((v) => !v)}
                    aria-label="Account menu"
                  >
                    <div className="pfn-acc-avatar">{initials}</div>
                    <div className="pfn-acc-info">
                      <span className="pfn-acc-label">Account</span>
                      <span className="pfn-acc-name">{user.name || 'My Account'}</span>
                    </div>
                    <svg className="pfn-acc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>

                  {acctOpen && (
                    <div className="pfn-acc-drop">
                      <div className="pfn-drop-header">
                        <div className="pfn-drop-avatar">{initials}</div>
                        <div className="pfn-drop-id">
                          <b>{user.name || 'User'}</b>
                          <span>{user.email || ''}</span>
                        </div>
                      </div>
                      {[
                        { to: '/profile', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>, label: 'My Profile' },
                        { to: '/orders', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4h18l-2 13H5L3 4z"/><path d="M8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM16 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>, label: 'My Orders' },
                        { to: '/my-repairs', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18v3h3l5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7z"/></svg>, label: 'My Repairs' },
                        { to: '/profile/addresses', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-5.3-7-11a7 7 0 1 1 14 0c0 5.7-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>, label: 'My Addresses' },
                        { to: '/wishlist', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>, label: 'Wishlist' },
                      ].map(({ to, icon, label }) => (
                        <Link key={to} to={to} className="pfn-drop-item" onClick={() => setAcctOpen(false)}>
                          {icon}{label}
                        </Link>
                      ))}
                      <div className="pfn-drop-sep"/>
                      <button className="pfn-drop-item pfn-drop-logout" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="pfn-login-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
                  </svg>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ══ ROW 3: MEGA NAV BAR (dark/red) ══ */}
        <div className="pfn-mega-bar">
          <div className="pfn-mega-inner">

            {/* All Categories mega-menu */}
            <div className="pfn-nav-item" ref={megaRef}>
              <button
                className={`pfn-nav-link${megaOpen ? ' pfn-active' : ''}`}
                onClick={() => setMegaOpen((v) => !v)}
                aria-label="All categories"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}>
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
                All Categories
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {megaOpen && (
                <div className="pfn-mega-drop">
                  <div className="pfn-mega-section">
                    <div className="pfn-mega-head">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2h-4.5v-6h-5v6H5a2 2 0 0 1-2-2V9.5z"/></svg>
                      Shop
                    </div>
                    {[
                      { to: '/collection/all', label: 'All Products', sub: 'Browse everything' },
                      { to: '/collection/all?tab=new', label: 'New Arrivals', sub: 'Fresh this week' },
                      { to: '/collection/all?tab=popular', label: 'Popular', sub: 'Top sellers' },
                      { to: '/collection/all?tab=deals', label: 'Deals & Offers', sub: 'Best prices' },
                    ].map(({ to, label, sub }) => (
                      <Link key={to} to={to} className="pfn-mega-link" onClick={() => setMegaOpen(false)}>
                        <div className="pfn-mega-link-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </div>
                        <div className="pfn-mega-link-text"><b>{label}</b><span>{sub}</span></div>
                      </Link>
                    ))}
                  </div>
                  <div className="pfn-mega-section">
                    <div className="pfn-mega-head">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
                      Devices
                    </div>
                    {categories.slice(0, 4).map((c) => (
                      <Link key={c.id} to={`/collection/${encodeURIComponent(c.name)}`} className="pfn-mega-link" onClick={() => setMegaOpen(false)}>
                        <div className="pfn-mega-link-icon">
                          {CATEGORY_ICONS[c.name] || <DefaultIcon/>}
                        </div>
                        <div className="pfn-mega-link-text"><b>{c.name}</b></div>
                      </Link>
                    ))}
                  </div>
                  <div className="pfn-mega-section">
                    <div className="pfn-mega-head">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18v3h3l5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7z"/></svg>
                      Services
                    </div>
                    {[
                      { to: '/book-repair', label: 'Book a Repair', sub: 'Fast & reliable' },
                      { to: '/track-repair', label: 'Track Repair', sub: 'Live updates' },
                      { to: '/trade-in', label: 'Trade-In', sub: 'Exchange & save' },
                    ].map(({ to, label, sub }) => (
                      <Link key={to} to={to} className="pfn-mega-link" onClick={() => setMegaOpen(false)}>
                        <div className="pfn-mega-link-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18v3h3l5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7z"/></svg>
                        </div>
                        <div className="pfn-mega-link-text"><b>{label}</b><span>{sub}</span></div>
                      </Link>
                    ))}
                    {categories.slice(4, 7).map((c) => (
                      <Link key={c.id} to={`/collection/${encodeURIComponent(c.name)}`} className="pfn-mega-link" onClick={() => setMegaOpen(false)}>
                        <div className="pfn-mega-link-icon">
                          {CATEGORY_ICONS[c.name] || <DefaultIcon/>}
                        </div>
                        <div className="pfn-mega-link-text"><b>{c.name}</b></div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pfn-nav-divider"/>

            {/* Primary nav links */}
            <Link to="/collection/all?tab=new" className="pfn-nav-link">New Arrivals</Link>
            <Link to="/collection/all?tab=popular" className="pfn-nav-link">Popular</Link>

            <div className="pfn-nav-divider"/>

            {/* Category pills from API */}
            {categories.slice(0, 6).map((c) => (
              <Link key={c.id} to={`/collection/${encodeURIComponent(c.name)}`} className="pfn-nav-link">
                {c.name}
              </Link>
            ))}

            <div className="pfn-nav-divider"/>

            {/* Services */}
            <Link to="/book-repair" className="pfn-nav-link pfn-accent">Book Repair</Link>
            <Link to="/trade-in" className="pfn-nav-link pfn-accent">Trade-In</Link>
          </div>
        </div>
      </div>

      {/* Spacer to push content below fixed nav */}
      <div className="pfn-spacer" style={{ height: navH || undefined }} />
    </>
  )
}
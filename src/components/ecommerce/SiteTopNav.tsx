import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  X,
  ArrowLeftRight,
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  LogIn,
  LogOut,
  Menu,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  User,
  Wrench,
} from 'lucide-react'
import {
  ACCOUNT_LINKS,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  DEFAULT_HEADER_CATEGORIES,
  GUEST_LINKS,
  HELP_LINKS,
  NAV_CATEGORIES,
  SERVICE_LINKS,
  SHOP_BY_CATEGORY_ICON,
  SHOP_LINKS,
  STORE_HOURS,
  categoryHref,
  collectionCategoryFromPath,
  iconForCategory,
  resolveCategoryName,
  type HeaderCategory,
} from './navConfig'
import { useHeaderCategories, useNavState } from './useNavState'
import NavDrawer from './NavDrawer'
import './SiteTopNav.css'

type OpenMenu = 'shop' | 'account' | null

export default function SiteTopNav({ transparent = false }: { transparent?: boolean }) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const categories = useHeaderCategories()
  const { wishlistCount, cartCount, user, isAuth, displayName, initials, logout } = useNavState()

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  // On the search page the box shows the current search; elsewhere it starts empty.
  const urlQuery = pathname === '/search' ? new URLSearchParams(search).get('q') || '' : ''
  const [q, setQ] = useState(urlQuery)
  const [syncedQuery, setSyncedQuery] = useState(urlQuery)
  if (syncedQuery !== urlQuery) {
    setSyncedQuery(urlQuery)
    setQ(urlQuery)
  }
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 8)
  const [navH, setNavH] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)

  /* ── Keep the fixed header visually separate once the page scrolls ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── Measure the fixed header so page content sits below it ── */
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    /* Always measure the header as if the announcement strip were open, so
       the spacer (and the Home hero) don't jump while it collapses on scroll. */
    const measure = () => {
      const strip = stripRef.current
      const full = el.offsetHeight - (strip?.offsetHeight ?? 0) + (strip?.scrollHeight ?? 0)
      setNavH(full)
      /* Exposed so full-screen sections (the Home hero) can fill what's left. */
      document.documentElement.style.setProperty('--pfn-h', `${full}px`)
    }
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    observer?.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  /* ── Close open menus on route change / outside click / Escape ── */
  useEffect(() => {
    setOpenMenu(null)
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!openMenu) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Element | null
      if (!target?.closest('.pfn-drop-wrap')) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [openMenu])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null)
        setDrawerOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const allCategories: HeaderCategory[] = useMemo(
    () => (categories.length > 0 ? categories : DEFAULT_HEADER_CATEGORIES),
    [categories],
  )

  // Category rail: show scroll arrows only when items are hidden off either edge.
  const catRail = useRef<HTMLElement>(null)
  const [catEdges, setCatEdges] = useState({ left: false, right: false })
  useEffect(() => {
    const el = catRail.current
    if (!el) return
    const update = () => {
      const max = el.scrollWidth - el.clientWidth
      setCatEdges({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', update); ro.disconnect() }
  }, [])
  const scrollCats = (dir: 1 | -1) => catRail.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })

  const primaryCategories = useMemo(
    () =>
      NAV_CATEGORIES.map((category) => ({
        ...category,
        to: categoryHref(resolveCategoryName(category.label, categories)),
      })),
    [categories],
  )

  const activeCollection = collectionCategoryFromPath(pathname)
  const isCategoryActive = (to: string) =>
    activeCollection !== '' &&
    collectionCategoryFromPath(to).toLowerCase() === activeCollection.toLowerCase()

  const shopActive =
    pathname.startsWith('/collection') &&
    !primaryCategories.some((category) => isCategoryActive(category.to))
  const serviceActive = ['/book-repair', '/repairs', '/trade-in', '/my-repairs'].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const term = q.trim()
    if (term) navigate(`/search?q=${encodeURIComponent(term)}`)
    else navigate('/search')
  }

  const clearSearch = () => {
    setQ('')
    if (pathname === '/search') navigate('/search')
  }

  const handleLogout = async () => {
    setOpenMenu(null)
    setDrawerOpen(false)
    await logout()
    navigate('/home')
  }

  const badgeText = (count: number) => (count > 99 ? '99+' : String(count))

  const accountMenuItems = isAuth ? ACCOUNT_LINKS : GUEST_LINKS
  const firstName = displayName.split(' ')[0]

  return (
    <>
      <div
        className={`pfn-root${scrolled ? ' pfn-scrolled' : ''}`}
        ref={rootRef}
        data-transparent={transparent ? 'true' : undefined}
      >
        {/* ═══════════════ Desktop / tablet ═══════════════ */}
        <div className="pfn-desktop">
          {/* Announcement strip */}
          <div className="pfn-strip" ref={stripRef} aria-hidden={scrolled || undefined}>
            <div className="pfn-inner pfn-strip-inner">
              <span className="pfn-strip-item">
                <Truck size={17} aria-hidden="true" />
                <b>Free Delivery</b>&nbsp;<span>on Orders Over ₹500</span>
              </span>
              <span className="pfn-strip-item">
                <BadgeCheck size={17} aria-hidden="true" />
                <b>100% Genuine Products</b>
              </span>
              <span className="pfn-strip-item">
                <RotateCcw size={17} aria-hidden="true" />
                <b>Easy 7-Day Returns</b>
              </span>
              <span className="pfn-strip-item">
                <ShieldCheck size={17} aria-hidden="true" />
                <b>1-Year Service Support</b>
              </span>
              <Link to="/collection/all?tab=deals" className="pfn-strip-deal">
                <Flame size={15} aria-hidden="true" />
                Deals of the Day
              </Link>
            </div>
          </div>

          <div className="pfn-inner">
            <div className="pfn-main">
              <Link to="/home" className="pfn-logo" aria-label="PhoneFix home">
                <span className="pfn-logo-icon">
                  <Wrench size={22} />
                </span>
                <span className="pfn-logo-text">
                  <span className="pfn-logo-name">
                    PhoneFix<span>.</span>
                  </span>
                  <span className="pfn-logo-sub">Premium Mobile Store</span>
                </span>
              </Link>

              <form className="pfn-search" onSubmit={handleSearch} role="search">
                <Search className="pfn-search-icon" size={19} aria-hidden="true" />
                <input
                  type="text"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Search for smartphones, accessories, repairs..."
                  aria-label="Search products"
                  autoComplete="off"
                />
                {q && (
                  <button type="button" className="pfn-search-clear" onClick={clearSearch} aria-label="Clear search">
                    <X size={17} />
                  </button>
                )}
                <button type="submit" className="pfn-search-btn">
                  Search
                </button>
              </form>

              <div className="pfn-contact">
                {CONTACT_PHONE_TEL && (
                  <a href={`tel:${CONTACT_PHONE_TEL}`} className="pfn-contact-phone">
                    <Phone size={14} aria-hidden="true" />
                    {CONTACT_PHONE_DISPLAY}
                  </a>
                )}
                <span className="pfn-contact-hours">
                  <Clock size={14} aria-hidden="true" />
                  {STORE_HOURS}
                </span>
              </div>

              <div className="pfn-actions">
                <div className="pfn-drop-wrap pfn-account-wrap">
                  {isAuth ? (
                    <button
                      type="button"
                      className={`pfn-account-btn${openMenu === 'account' ? ' is-open' : ''}`}
                      onClick={() => setOpenMenu((current) => (current === 'account' ? null : 'account'))}
                      aria-label={`Account menu for ${displayName || 'your account'}`}
                      aria-haspopup="menu"
                      aria-expanded={openMenu === 'account'}
                      title={displayName || 'My Account'}
                    >
                      <span className="pfn-avatar">
                        <User size={16} />
                      </span>
                      <span className="pfn-account-label">{firstName || 'My Account'}</span>
                      <ChevronDown className="pfn-caret" size={14} aria-hidden="true" />
                    </button>
                  ) : (
                    <Link to="/login" className="pfn-account-btn pfn-login-btn" aria-label="Log in" onClick={() => setOpenMenu(null)}>
                      <LogIn size={17} aria-hidden="true" />
                      <span className="pfn-account-label">Login</span>
                    </Link>
                  )}

                  {isAuth && openMenu === 'account' && (
                    <div className="pfn-drop pfn-account-drop" role="menu">
                      <div className="pfn-drop-head">
                        <span className="pfn-avatar pfn-avatar-lg">
                          {isAuth ? initials || '?' : <User size={20} />}
                        </span>
                        <span className="pfn-drop-id">
                          <b>{isAuth ? displayName || 'My Account' : 'Welcome to PhoneFix'}</b>
                          <span>
                            {isAuth
                              ? user.email || 'Signed in'
                              : 'Sign in for orders, repairs and saved devices.'}
                          </span>
                        </span>
                      </div>

                      {accountMenuItems.map(({ to, label, icon: Icon }) => (
                        <Link
                          key={to}
                          to={to}
                          className="pfn-drop-row"
                          role="menuitem"
                          onClick={() => setOpenMenu(null)}
                        >
                          <Icon size={16} />
                          <span>{label}</span>
                        </Link>
                      ))}

                      <div className="pfn-drop-sep" />
                      {HELP_LINKS.map(({ to, label, icon: Icon }) => (
                        <Link
                          key={to}
                          to={to}
                          className="pfn-drop-row"
                          role="menuitem"
                          onClick={() => setOpenMenu(null)}
                        >
                          <Icon size={16} />
                          <span>{label}</span>
                        </Link>
                      ))}

                      {isAuth && (
                        <>
                          <div className="pfn-drop-sep" />
                          <button
                            type="button"
                            className="pfn-drop-row pfn-logout"
                            role="menuitem"
                            onClick={handleLogout}
                          >
                            <LogOut size={16} />
                            <span>Logout</span>
                          </button>
                        </>
                      )}

                      {!isAuth && (
                        <>
                          <div className="pfn-drop-sep" />
                          <Link
                            to="/login"
                            className="pfn-drop-signin"
                            onClick={() => setOpenMenu(null)}
                          >
                            <LogIn size={16} />
                            Sign in to your account
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Link
                  to="/wishlist"
                  className="pfn-icon-btn"
                  aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : 'Wishlist'}
                  title="Wishlist"
                >
                  <Heart size={19} />
                  {wishlistCount > 0 && <span className="pfn-badge">{badgeText(wishlistCount)}</span>}
                </Link>

                <Link
                  to="/cart"
                  className="pfn-icon-btn"
                  aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'}
                  title="Cart"
                >
                  <ShoppingCart size={19} />
                  {cartCount > 0 && <span className="pfn-badge">{badgeText(cartCount)}</span>}
                </Link>
              </div>
            </div>
          </div>

          <div className="pfn-catbar">
            <div className="pfn-inner pfn-catbar-inner">
              <div className="pfn-cats-wrap">
                <div className="pfn-drop-wrap pfn-shop-wrap">
                  <button
                    type="button"
                    className={`pfn-cat pfn-shop-btn${openMenu === 'shop' ? ' is-open' : ''}${
                      shopActive ? ' is-current' : ''
                    }`}
                    onClick={() => setOpenMenu((current) => (current === 'shop' ? null : 'shop'))}
                    aria-haspopup="menu"
                    aria-expanded={openMenu === 'shop'}
                  >
                    {(() => {
                      const Icon = SHOP_BY_CATEGORY_ICON
                      return <Icon size={16} />
                    })()}
                    <span>All Categories</span>
                    <ChevronDown className="pfn-caret" size={14} aria-hidden="true" />
                  </button>

                  {openMenu === 'shop' && (
                    <div className="pfn-drop pfn-shop-drop" role="menu">
                      <div className="pfn-shop-cols">
                        <div className="pfn-shop-col">
                          <p className="pfn-drop-heading">Discover</p>
                          {SHOP_LINKS.map(({ to, label, sub, icon: Icon }) => (
                            <Link
                              key={to}
                              to={to}
                              className="pfn-shop-link"
                              role="menuitem"
                              onClick={() => setOpenMenu(null)}
                            >
                              <span className="pfn-shop-link-icon">
                                <Icon size={16} />
                              </span>
                              <span className="pfn-shop-link-text">
                                <b>{label}</b>
                                {sub && <small>{sub}</small>}
                              </span>
                            </Link>
                          ))}
                        </div>

                        <div className="pfn-shop-col">
                          <p className="pfn-drop-heading">Categories</p>
                          <div className="pfn-shop-cat-grid">
                            {allCategories.map((category) => {
                              const Icon = iconForCategory(category.name)
                              return (
                                <Link
                                  key={category.id}
                                  to={categoryHref(category.name)}
                                  className="pfn-shop-cat"
                                  role="menuitem"
                                  onClick={() => setOpenMenu(null)}
                                >
                                  <Icon size={15} />
                                  <span>{category.name}</span>
                                </Link>
                              )
                            })}
                          </div>
                        </div>

                        <div className="pfn-shop-col">
                          <p className="pfn-drop-heading">Services</p>
                          {SERVICE_LINKS.map(({ to, label, sub, icon: Icon }) => (
                            <Link
                              key={to}
                              to={to}
                              className="pfn-shop-link"
                              role="menuitem"
                              onClick={() => setOpenMenu(null)}
                            >
                              <span className="pfn-shop-link-icon">
                                <Icon size={16} />
                              </span>
                              <span className="pfn-shop-link-text">
                                <b>{label}</b>
                                {sub && <small>{sub}</small>}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {catEdges.left && (
                  <button type="button" className="pfn-cats-arrow" onClick={() => scrollCats(-1)} aria-label="Show previous categories">
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>
                )}
                <nav
                  ref={catRail}
                  className={`pfn-cats-scroll${catEdges.left ? ' fade-l' : ''}${catEdges.right ? ' fade-r' : ''}`}
                  aria-label="Product categories"
                >
                  {primaryCategories.map(({ label, to, icon: Icon }) => (
                    <Link
                      key={label}
                      to={to}
                      className={`pfn-cat${isCategoryActive(to) ? ' is-current' : ''}`}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </nav>
                {catEdges.right && (
                  <button type="button" className="pfn-cats-arrow" onClick={() => scrollCats(1)} aria-label="Show more categories">
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="pfn-services">
                <span className="pfn-divider" aria-hidden="true" />
                <Link
                  to="/book-repair"
                  className={`pfn-cta pfn-cta-repair${
                    serviceActive && pathname.startsWith('/book-repair') ? ' is-current' : ''
                  }`}
                >
                  <Wrench size={16} aria-hidden="true" />
                  <span>Book Repair</span>
                </Link>
                <Link
                  to="/trade-in"
                  className={`pfn-cta pfn-cta-trade${
                    pathname === '/trade-in' ? ' is-current' : ''
                  }`}
                >
                  <ArrowLeftRight size={16} aria-hidden="true" />
                  <span>Trade-In</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ Mobile ═══════════════ */}
        <div className="pfn-mobile">
          <div className="pfn-m-inner">
            <div className="pfn-m-top">
              <button
                type="button"
                className="pfn-icon-btn pfn-menu-btn"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                aria-expanded={drawerOpen}
              >
                <Menu size={20} />
              </button>

              <Link to="/home" className="pfn-logo pfn-logo-mobile" aria-label="PhoneFix home">
                <span className="pfn-logo-icon">
                  <Wrench size={19} />
                </span>
                <span className="pfn-logo-text">
                  <span className="pfn-logo-name">
                    PhoneFix<span>.</span>
                  </span>
                  <span className="pfn-logo-sub">Premium Mobile Store</span>
                </span>
              </Link>

              <div className="pfn-m-actions">
                <Link
                  to="/wishlist"
                  className="pfn-icon-btn"
                  aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : 'Wishlist'}
                >
                  <Heart size={18} />
                  {wishlistCount > 0 && <span className="pfn-badge">{badgeText(wishlistCount)}</span>}
                </Link>
                <Link
                  to="/cart"
                  className="pfn-icon-btn"
                  aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'}
                >
                  <ShoppingCart size={18} />
                  {cartCount > 0 && <span className="pfn-badge">{badgeText(cartCount)}</span>}
                </Link>
              </div>
            </div>

            <form className="pfn-search pfn-search-mobile" onSubmit={handleSearch} role="search">
              <Search className="pfn-search-icon" size={18} aria-hidden="true" />
              <input
                type="text"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search smartphones, accessories and more..."
                aria-label="Search products"
                autoComplete="off"
              />
              {q && (
                <button type="button" className="pfn-search-clear" onClick={clearSearch} aria-label="Clear search">
                  <X size={17} />
                </button>
              )}
              <button type="submit" className="pfn-search-btn">
                Search
              </button>
            </form>

            <nav className="pfn-m-cats" aria-label="Product categories">
              {primaryCategories.map(({ label, to, icon: Icon }) => (
                <Link
                  key={label}
                  to={to}
                  className={`pfn-m-cat${isCategoryActive(to) ? ' is-current' : ''}`}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              ))}
              <Link
                to="/book-repair"
                className={`pfn-m-cat pfn-m-cat-service${
                  pathname.startsWith('/book-repair') ? ' is-current' : ''
                }`}
              >
                <Wrench size={14} aria-hidden="true" />
                <span>Book Repair</span>
              </Link>
              <Link
                to="/trade-in"
                className={`pfn-m-cat pfn-m-cat-service${
                  pathname === '/trade-in' ? ' is-current' : ''
                }`}
              >
                <ArrowLeftRight size={14} aria-hidden="true" />
                <span>Trade-In</span>
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {!transparent && <div className="pfn-spacer" style={navH ? { height: navH } : undefined} />}

      <NavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        isAuth={isAuth}
        displayName={displayName}
        initials={initials}
        userEmail={user.email}
        onLogout={handleLogout}
      />
    </>
  )
}

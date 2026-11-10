import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  ArrowLeftRight,
  ChevronRight,
  Heart,
  LayoutGrid,
  LogIn,
  LogOut,
  Phone,
  Wrench,
  X,
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
  SHOP_LINKS,
  STORE_HOURS,
  categoryHref,
  resolveCategoryName,
  type HeaderCategory,
} from './navConfig'
import './NavDrawer.css'

interface NavDrawerProps {
  open: boolean
  onClose: () => void
  categories: HeaderCategory[]
  isAuth: boolean
  displayName: string
  initials: string
  userEmail: string
  onLogout: () => void | Promise<void>
}

export default function NavDrawer({
  open,
  onClose,
  categories,
  isAuth,
  displayName,
  initials,
  userEmail,
  onLogout,
}: NavDrawerProps) {
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const pooled = categories.length > 0 ? categories : DEFAULT_HEADER_CATEGORIES
  const categoryLinks = NAV_CATEGORIES.map((category) => ({
    ...category,
    to: categoryHref(resolveCategoryName(category.label, pooled)),
  }))

  const handleLogout = () => {
    onClose()
    void onLogout()
  }

  return createPortal(
    <div className="nd-root">
      <div className="nd-overlay" onMouseDown={onClose} />
      <aside className="nd-panel" role="dialog" aria-modal="true" aria-label="Store menu">
        <div className="nd-head">
          <Link to="/home" className="nd-brand" onClick={onClose}>
            <span className="nd-brand-icon">
              <Wrench size={20} />
            </span>
            <span className="nd-brand-text">
              <b>
                PhoneFix<span>.</span>
              </b>
              <small>Premium Mobile Store</small>
            </span>
          </Link>
          <button className="nd-close" type="button" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="nd-scroll">
          {isAuth ? (
            <div className="nd-user">
              <span className="nd-avatar">{initials || '?'}</span>
              <span className="nd-user-text">
                <b>{displayName || 'My Account'}</b>
                <small>{userEmail || 'Signed in'}</small>
              </span>
            </div>
          ) : (
            <Link to="/login" className="nd-signin" onClick={onClose}>
              <span className="nd-avatar">
                <LogIn size={17} />
              </span>
              <span className="nd-user-text">
                <b>Sign in to PhoneFix</b>
                <small>Orders, repairs and saved devices</small>
              </span>
              <ChevronRight size={16} />
            </Link>
          )}

          <section className="nd-section">
            <p className="nd-heading">Shop by category</p>
            <div className="nd-cats">
              {categoryLinks.map(({ label, to, icon: Icon }) => (
                <Link key={label} to={to} className="nd-cat" onClick={onClose}>
                  <span className="nd-cat-icon">
                    <Icon size={18} />
                  </span>
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="nd-section">
            <p className="nd-heading">Discover</p>
            {SHOP_LINKS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="nd-row" onClick={onClose}>
                <Icon size={17} />
                <span>{label}</span>
                <ChevronRight size={15} className="nd-row-caret" />
              </Link>
            ))}
          </section>

          <section className="nd-section">
            <p className="nd-heading">Repairs &amp; services</p>
            <div className="nd-service-grid">
              <Link to="/book-repair" className="nd-service nd-service-primary" onClick={onClose}>
                <Wrench size={19} />
                <span>Book Repair</span>
              </Link>
              <Link to="/trade-in" className="nd-service" onClick={onClose}>
                <ArrowLeftRight size={19} />
                <span>Trade-In</span>
              </Link>
            </div>
            {SERVICE_LINKS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="nd-row" onClick={onClose}>
                <Icon size={17} />
                <span>{label}</span>
                <ChevronRight size={15} className="nd-row-caret" />
              </Link>
            ))}
          </section>

          <section className="nd-section">
            <p className="nd-heading">My account</p>
            {(isAuth ? ACCOUNT_LINKS : GUEST_LINKS).map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="nd-row" onClick={onClose}>
                <Icon size={17} />
                <span>{label}</span>
                <ChevronRight size={15} className="nd-row-caret" />
              </Link>
            ))}
          </section>

          <section className="nd-section">
            <p className="nd-heading">Help</p>
            {HELP_LINKS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="nd-row" onClick={onClose}>
                <Icon size={17} />
                <span>{label}</span>
                <ChevronRight size={15} className="nd-row-caret" />
              </Link>
            ))}
          </section>
        </div>

        <div className="nd-foot">
          <a href={`tel:${CONTACT_PHONE_TEL}`} className="nd-phone">
            <Phone size={16} />
            <span>{CONTACT_PHONE_DISPLAY}</span>
          </a>
          <span className="nd-hours">{STORE_HOURS}</span>
          <div className="nd-foot-row">
            <Link to="/wishlist" className="nd-foot-link" onClick={onClose}>
              <Heart size={15} />
              Wishlist
            </Link>
            <Link to="/collection/all" className="nd-foot-link" onClick={onClose}>
              <LayoutGrid size={15} />
              All products
            </Link>
            {isAuth && (
              <button className="nd-logout" type="button" onClick={handleLogout}>
                <LogOut size={15} />
                Logout
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  )
}

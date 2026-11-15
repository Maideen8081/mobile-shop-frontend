import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Bell, Headphones, Heart, LogOut, MapPin, Package, User, Wrench,
} from 'lucide-react'
import { authService } from '../../services/authService'
import { orderService } from '../../services/orderService'
import { addressService } from '../../services/addressService'
import { useToast } from '../../context/ToastContext'
import { readWishlistIds } from '../../utils/wishlist'
import './AccountLayout.css'

export type AccountSection = 'profile' | 'orders' | 'repairs' | 'addresses' | 'wishlist' | 'notifications' | 'support'

type Counts = { orders?: number; addresses?: number }

/** Decorative phone drawn in CSS. Used in account banners and the trade-in card. */
export function AccountPhone({ className = '' }: { className?: string }) {
  return <span className={`acc-phone ${className}`} aria-hidden="true"><i /><i /><i /></span>
}

/**
 * Shared shell for "My Account" pages: account sidebar and a main column.
 * Pass counts the page already has so the sidebar doesn't fetch them again.
 */
export default function AccountLayout({ active, counts, compact = false, children }: {
  active: AccountSection
  /** Kept for existing callers; breadcrumbs are no longer shown. */
  crumb?: string
  counts?: Counts
  /** Hide sidebar below 1024px (for pages with their own mobile header). */
  compact?: boolean
  children: ReactNode
}) {
  const navigate = useNavigate()
  const showToast = useToast().show
  const [fetched, setFetched] = useState<Counts>({})
  const [wishlistCount] = useState(() => readWishlistIds().length)

  const needOrders = counts?.orders === undefined
  const needAddresses = counts?.addresses === undefined
  useEffect(() => {
    let alive = true
    if (needOrders) orderService.listMine().then((o) => { if (alive) setFetched((p) => ({ ...p, orders: o.length })) }).catch(() => {})
    if (needAddresses) addressService.list().then((a) => { if (alive) setFetched((p) => ({ ...p, addresses: a.length })) }).catch(() => {})
    return () => { alive = false }
  }, [needOrders, needAddresses])

  const orders = counts?.orders ?? fetched.orders
  const addresses = counts?.addresses ?? fetched.addresses

  const signOut = async () => {
    await authService.logout()
    showToast('Signed out', 'success')
    navigate('/home')
  }

  const item = (key: AccountSection, to: string, icon: ReactNode, label: string, extra?: ReactNode) => (
    <Link to={to} className={active === key ? 'is-active' : undefined} aria-current={active === key ? 'page' : undefined}>
      {icon} {label} {extra}
    </Link>
  )
  const count = (n?: number) => <span className="acc-nav-count">{n ?? '·'}</span>

  return (
    <div className={`acc-wrap${compact ? ' is-compact' : ''}`}>
      <div className="acc-shell">
        <aside className="acc-side">
          <nav className="acc-nav" aria-label="Account">
            {item('profile', '/profile', <User size={20} />, 'Profile')}
            {item('orders', '/orders', <Package size={20} />, 'My Orders', count(orders))}
            {item('repairs', '/my-repairs', <Wrench size={20} />, 'My Repairs')}
            {item('addresses', '/profile/addresses', <MapPin size={20} />, 'Addresses', count(addresses))}
            {item('wishlist', '/wishlist', <Heart size={20} />, 'Wishlist', count(wishlistCount))}
            {item('notifications', '/notifications', <Bell size={20} />, 'Notifications')}
            {item('support', '/support', <Headphones size={20} />, 'Help & Support')}
            <button type="button" className="acc-signout" onClick={signOut}><LogOut size={20} /> Sign Out</button>
          </nav>

          <div className="acc-promo">
            <div className="acc-promo-text">
              <h3>Trade In<br />Your Old Phone</h3>
              <p>Get the best value<br />for your device.</p>
              <Link to="/trade-in" className="acc-promo-btn">Trade In Now <ArrowRight size={15} /></Link>
            </div>
            <AccountPhone className="acc-phone-sm" />
          </div>
        </aside>

        <div className="acc-main">{children}</div>
      </div>
    </div>
  )
}

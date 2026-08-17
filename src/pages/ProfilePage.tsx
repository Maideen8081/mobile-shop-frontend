import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService, type UserProfile } from '../services/authService'
import { orderService, type OrderResponse } from '../services/orderService'
import { addressService, type AddressData } from '../services/addressService'
import { useToast } from '../context/ToastContext'
import MobileProfile from '../components/mobile/MobileProfile'
import { useIsMobile } from '../components/mobile/helpers'
import DesktopPageLoader from '../components/ui/DesktopPageLoader'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import EcommerceFooter from '../components/ecommerce/Footer'
import '../components/ecommerce/SiteTopNav.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const FALLBACK_IMG = 'https://picsum.photos/seed/product/300/300'

function getProductImage(item: { image?: string; img?: string; thumbnail?: string }): string {
  const raw = item.image || item.img || item.thumbnail || ''
  if (!raw) return FALLBACK_IMG
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  return `${API_BASE_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`
}

interface WishlistItem {
  id: number
  name: string
  price: number
  img: string
}

type TabId = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'payments'

export default function ProfilePage() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const showToast = useToast().show

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ fullName: '', email: '', mobile: '' })
  const [saving, setSaving] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setLoading(false)
      return
    }
    let cancelled = false
    authService.getProfile()
      .then(p => { if (!cancelled) setProfile(p) })
      .catch(() => {
        if (cancelled) return
        const stored = localStorage.getItem('user_profile')
        if (stored) {
          try {
            const { name, email } = JSON.parse(stored)
            setProfile({ id: 0, email: email || '', fullName: name || 'User' })
          } catch { /* ignore */ }
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!authService.isAuthenticated()) return
    orderService.list().then(setOrders).catch(() => {})
    addressService.list().then(setAddresses).catch(() => {})
    try {
      const stored = JSON.parse(localStorage.getItem('wishlist') || '[]')
      if (Array.isArray(stored)) setWishlist(stored)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (showEditModal || showDeleteConfirm) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showEditModal, showDeleteConfirm])

  if (isMobile) return <MobileProfile />

  const user = profile || { id: 0, email: '', fullName: 'User' }

  const initials = user.fullName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const openEditModal = () => {
    setEditForm({ fullName: user.fullName, email: user.email, mobile: user.mobile || '' })
    setShowEditModal(true)
  }

  const handleSaveProfile = async () => {
    if (!editForm.fullName.trim()) { showToast('Name is required', 'error'); return }
    setSaving(true)
    try {
      const updated = await authService.updateProfile(editForm)
      setProfile(updated)
      setShowEditModal(false)
      showToast('Profile updated successfully', 'success')
    } catch {
      showToast('Failed to update profile', 'error')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await authService.deleteAccount()
      showToast('Account deleted successfully', 'success')
      navigate('/')
    } catch {
      showToast('Failed to delete account. Please try again.', 'error')
    }
    setDeleting(false)
    setShowDeleteConfirm(false)
  }

  const formatDate = (d: string) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const statusClass = (status: string): string => {
    if (status === 'delivered') return 'delivered'
    if (['shipped', 'out_for_delivery', 'in_transit'].includes(status)) return 'transit'
    return 'processing'
  }

  const statusLabel = (status: string): string => {
    const map: Record<string, string> = {
      order_placed: 'Placed',
      accepted: 'Accepted',
      processing: 'Processing',
      shipped: 'Shipped',
      out_for_delivery: 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    }
    return map[status] || status.replace(/_/g, ' ')
  }

  if (!authService.isAuthenticated()) {
    return (
      <div className="pp-root">
        <SiteTopNav />
        <div className="pp-not-authed">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="56" height="56">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h2>Not Logged In</h2>
          <p>Please log in to view your profile.</p>
          <button className="pp-login-btn" onClick={() => navigate('/login')}>Go to Login</button>
        </div>
        <EcommerceFooter compact />
        <style>{NOT_AUTHED_CSS}</style>
      </div>
    )
  }

  if (loading) {
    return (
      <>
        <SiteTopNav />
        <DesktopPageLoader text="Loading your profile..." />
      </>
    )
  }

  return (
    <div className="dp-root">
      <SiteTopNav />

      <div className="dp-shell">
        {/* SIDEBAR */}
        <aside className="dp-sidebar">
          <div className="dp-nav-eyebrow">Account</div>
          <ul className="dp-nav-list">
            <li className={`dp-nav-item ${activeTab === 'overview' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Profile Overview
              </a>
            </li>
            <li className={`dp-nav-item ${activeTab === 'orders' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('orders'); }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                My Orders
              </a>
            </li>
            <li className={`dp-nav-item ${activeTab === 'wishlist' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('wishlist'); }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                Wishlist
              </a>
            </li>
            <li className={`dp-nav-item ${activeTab === 'addresses' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('addresses'); }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                Addresses
              </a>
            </li>
            <li className={`dp-nav-item ${activeTab === 'payments' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('payments'); }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
                Payment Methods
              </a>
            </li>
          </ul>

          <div className="dp-nav-eyebrow">Preferences</div>
          <ul className="dp-nav-list">
            <li className="dp-nav-item">
              <a href="#" onClick={(e) => { e.preventDefault(); }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"/></svg>
                Rewards &amp; Loyalty
              </a>
            </li>
            <li className="dp-nav-item">
              <a href="#" onClick={(e) => { e.preventDefault(); }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Notifications
              </a>
            </li>
            <li className="dp-nav-item">
              <a href="#" onClick={(e) => { e.preventDefault(); }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Security &amp; Password
              </a>
            </li>
          </ul>

          <div className="dp-nav-eyebrow">Support</div>
          <ul className="dp-nav-list">
            <li className="dp-nav-item">
              <a href="#" onClick={(e) => { e.preventDefault(); }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Help Center
              </a>
            </li>
            <li className="dp-nav-item logout">
              <a href="#" onClick={(e) => { e.preventDefault(); }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </a>
            </li>
          </ul>

          {/* Membership Card */}
          <div className="dp-member-card">
            <div className="dp-member-card-top">
              <div className="dp-chip"></div>
              <span className="dp-tier-pill">Gold Member</span>
            </div>
            <div className="dp-member-card-number">•••• &nbsp;•••• &nbsp;•••• &nbsp;4821</div>
            <div className="dp-member-card-name">{user.fullName}</div>
            <div className="dp-member-progress-label">
              <span>2,480 pts</span>
              <span>520 to Platinum</span>
            </div>
            <div className="dp-member-progress-track"><div className="dp-member-progress-fill"></div></div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="dp-main">

          {/* Profile Header */}
          <section className="dp-profile-header">
            <div className="dp-profile-header-inner">
              <div className="dp-profile-id">
                <div className="dp-avatar-ring">
                  <div className="dp-avatar">{initials}</div>
                </div>
                <div>
                  <div className="dp-profile-name-row">
                    <span className="dp-profile-name">{user.fullName}</span>
                    <span className="dp-badge-gold">★ Gold Member</span>
                  </div>
                  <div className="dp-profile-meta">
                    <span>{user.email || 'No email'}</span>
                    <span>{user.mobile || 'No phone'}</span>
                    <span>Member since {new Date().getFullYear()}</span>
                  </div>
                </div>
              </div>
              <div className="dp-header-actions">
                <button className="dp-btn dp-btn-outline" onClick={openEditModal}>Edit Profile</button>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="dp-stat-grid">
            <div className="dp-stat-card">
              <div className="dp-stat-top">
                <div className="dp-stat-icon">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </div>
              </div>
              <div className="dp-stat-value">{orders.length}</div>
              <div className="dp-stat-label">Total Orders</div>
            </div>
            <div className="dp-stat-card">
              <div className="dp-stat-top">
                <div className="dp-stat-icon">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </div>
              </div>
              <div className="dp-stat-value">{wishlist.length}</div>
              <div className="dp-stat-label">Wishlist Items</div>
            </div>
            <div className="dp-stat-card">
              <div className="dp-stat-top">
                <div className="dp-stat-icon">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"/></svg>
                </div>
              </div>
              <div className="dp-stat-value">2,480</div>
              <div className="dp-stat-label">Reward Points</div>
            </div>
            <div className="dp-stat-card">
              <div className="dp-stat-top">
                <div className="dp-stat-icon">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
                </div>
              </div>
              <div className="dp-stat-value">{orders.length > 0 ? '\u20B9' + orders.reduce((sum, o) => sum + Number(o.grand_total), 0).toLocaleString('en-IN') : '\u20B90'}</div>
              <div className="dp-stat-label">Lifetime Spend</div>
            </div>
          </section>

          {/* Personal Info */}
          <section className="dp-section" id="personal-info">
            <div className="dp-section-head">
              <div>
                <span className="dp-section-eyebrow">Account details</span>
                <h2 className="dp-section-title">Personal Information</h2>
              </div>
              <a href="#" className="dp-link-action" onClick={(e) => { e.preventDefault(); openEditModal(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                Edit
              </a>
            </div>
            <div className="dp-form-grid">
              <div className="dp-field">
                <label>Full Name</label>
                <input type="text" value={user.fullName} readOnly />
              </div>
              <div className="dp-field">
                <label>Email Address</label>
                <input type="email" value={user.email || ''} readOnly />
              </div>
              <div className="dp-field">
                <label>Phone Number</label>
                <input type="tel" value={user.mobile || ''} readOnly />
              </div>
              <div className="dp-field">
                <label>Member Since</label>
                <input type="text" value={new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} readOnly />
              </div>
            </div>
          </section>

          {/* Orders */}
          <section className="dp-section" id="orders">
            <div className="dp-section-head">
              <div>
                <span className="dp-section-eyebrow">Purchase history</span>
                <h2 className="dp-section-title">Recent Orders</h2>
              </div>
              <a href="#" className="dp-link-action" onClick={(e) => { e.preventDefault(); navigate('/orders'); }}>
                View All
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
              </a>
            </div>
            {orders.length === 0 ? (
              <div className="dp-empty">No orders yet.</div>
            ) : (
              <table className="dp-orders-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(order => (
                    <tr key={order.id}>
                      <td>
                        <div className="dp-order-product">
                          <div className="dp-order-thumb">
                            {order.items[0]?.image ? (
                              <img src={getProductImage(order.items[0])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                            ) : null}
                          </div>
                          <div>
                            <div className="dp-order-product-name">{order.items[0]?.product_name || 'Order'}</div>
                            <div className="dp-order-product-sub">Order #{order.order_id}</div>
                          </div>
                        </div>
                      </td>
                      <td>#{order.order_id}</td>
                      <td>{formatDate(order.created_at)}</td>
                      <td>{'\u20B9'}{Number(order.grand_total).toLocaleString('en-IN')}</td>
                      <td><span className={`dp-status-pill dp-status-${statusClass(order.delivery_status)}`}>{statusLabel(order.delivery_status)}</span></td>
                      <td>
                        <a href="#" className="dp-row-action" onClick={(e) => { e.preventDefault(); navigate('/orders'); }}>
                          {['shipped', 'out_for_delivery'].includes(order.delivery_status) ? 'Track' : 'Details'}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Wishlist */}
          <section className="dp-section" id="wishlist">
            <div className="dp-section-head">
              <div>
                <span className="dp-section-eyebrow">Saved for later</span>
                <h2 className="dp-section-title">Wishlist</h2>
              </div>
              <a href="#" className="dp-link-action" onClick={(e) => { e.preventDefault(); navigate('/wishlist'); }}>
                View All
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
              </a>
            </div>
            {wishlist.length === 0 ? (
              <div className="dp-empty">Your wishlist is empty.</div>
            ) : (
              <div className="dp-wishlist-grid">
                {wishlist.slice(0, 4).map(item => (
                  <div key={item.id} className="dp-wish-item" onClick={() => navigate(`/product/${item.id}`)}>
                    <div className="dp-wish-thumb">
                      <img src={item.img || FALLBACK_IMG} alt={item.name} />
                      <div className="dp-wish-heart">&#9829;</div>
                    </div>
                    <div className="dp-wish-body">
                      <div className="dp-wish-name">{item.name}</div>
                      <div className="dp-wish-price">{'\u20B9'}{Number(item.price).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Addresses + Payments */}
          <div className="dp-two-col">
            <section className="dp-section" id="addresses">
              <div className="dp-section-head">
                <div>
                  <span className="dp-section-eyebrow">Delivery details</span>
                  <h2 className="dp-section-title">Addresses</h2>
                </div>
              </div>
              {addresses.length === 0 ? (
                <div className="dp-empty">No saved addresses. <button className="dp-inline-link" onClick={() => navigate('/profile/addresses')}>Add one</button></div>
              ) : (
                <div className="dp-card-list">
                  {addresses.map(addr => (
                    <div key={addr.id} className={`dp-info-card ${addr.isDefault ? 'default' : ''}`}>
                      <div>
                        <div className="dp-info-card-title">
                          {addr.addressType}
                          {addr.isDefault && <span className="dp-default-tag">Default</span>}
                        </div>
                        <div className="dp-info-card-body">
                          {addr.fullName}<br />
                          {addr.addressLine1}{addr.addressLine2 ? <><br />{addr.addressLine2}</> : ''}<br />
                          {addr.city}, {addr.state} {addr.zipCode}
                        </div>
                      </div>
                      <div className="dp-info-card-actions">
                        <button className="dp-icon-action" aria-label="Edit address" onClick={() => navigate('/profile/addresses')}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="dp-add-card" onClick={() => navigate('/profile/addresses')}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add New Address
                  </button>
                </div>
              )}
            </section>

            <section className="dp-section" id="payments">
              <div className="dp-section-head">
                <div>
                  <span className="dp-section-eyebrow">Billing details</span>
                  <h2 className="dp-section-title">Payment Methods</h2>
                </div>
              </div>
              <div className="dp-card-list">
                <div className="dp-info-card default">
                  <div>
                    <div className="dp-card-brand-row">
                      <div className="dp-card-brand visa">VISA</div>
                      <div className="dp-info-card-title" style={{ margin: 0 }}>•••• 4821 <span className="dp-default-tag">Default</span></div>
                    </div>
                    <div className="dp-info-card-body">Expires 08/28</div>
                  </div>
                </div>
                <div className="dp-info-card">
                  <div>
                    <div className="dp-card-brand-row">
                      <div className="dp-card-brand mc">MC</div>
                      <div className="dp-info-card-title" style={{ margin: 0 }}>•••• 1190</div>
                    </div>
                    <div className="dp-info-card-body">Expires 03/27</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Rewards */}
          <section className="dp-section" id="rewards">
            <div className="dp-section-head">
              <div>
                <span className="dp-section-eyebrow">Loyalty program</span>
                <h2 className="dp-section-title">Rewards &amp; Loyalty</h2>
              </div>
            </div>
            <div className="dp-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 0 }}>
              <div className="dp-stat-card">
                <div className="dp-stat-value">2,480</div>
                <div className="dp-stat-label">Available Points</div>
              </div>
              <div className="dp-stat-card">
                <div className="dp-stat-value">Gold</div>
                <div className="dp-stat-label">Current Tier</div>
              </div>
              <div className="dp-stat-card">
                <div className="dp-stat-value">520 pts</div>
                <div className="dp-stat-label">To Reach Platinum</div>
              </div>
            </div>
          </section>

        </main>
      </div>

      <EcommerceFooter compact />

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="dp-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="dp-modal" onClick={e => e.stopPropagation()}>
            <div className="dp-modal-header">
              <h2>Edit Profile</h2>
              <button className="dp-modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <div className="dp-modal-body">
              <div className="dp-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="dp-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
              <div className="dp-field">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={editForm.mobile}
                  onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            <div className="dp-modal-footer">
              <button className="dp-btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="dp-btn-save" onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteConfirm && (
        <div className="dp-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="dp-modal dp-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="dp-modal-header">
              <h2>Delete Account</h2>
              <button className="dp-modal-close" onClick={() => setShowDeleteConfirm(false)}>&times;</button>
            </div>
            <div className="dp-modal-body">
              <div className="dp-delete-warning">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div>
                  <p className="dp-delete-title">Are you sure you want to delete your account?</p>
                  <p className="dp-delete-desc">This action is permanent and cannot be undone. All your data, orders, and preferences will be permanently removed.</p>
                </div>
              </div>
            </div>
            <div className="dp-modal-footer">
              <button className="dp-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="dp-btn-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{DP_CSS}</style>
    </div>
  )
}

const NOT_AUTHED_CSS = `
.dp-not-authed {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 60vh; text-align: center; padding: 40px 20px;
}
.dp-not-authed svg { color: #A39C8E; margin-bottom: 16px; }
.dp-not-authed h2 { font-family: 'Fraunces', serif; font-size: 24px; color: #1B1414; margin-bottom: 8px; }
.dp-not-authed p { font-size: 14px; color: #6E5C5C; margin-bottom: 24px; }
.pp-login-btn {
  padding: 14px 32px; border-radius: 999px; border: none; cursor: pointer;
  font-size: 13px; font-weight: 700; color: #fff; letter-spacing: 0.02em;
  background: linear-gradient(135deg, #D6001C, #8C0016);
  box-shadow: 0 4px 15px rgba(214,0,28,0.35);
  transition: transform .2s, box-shadow .2s;
}
.pp-login-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(214,0,28,0.45); }
`

const DP_CSS = `
.dp-root{
  font-family:'Inter', sans-serif;
  background: var(--color-paper, #FBF8F6);
  color: var(--color-ink, #1B1210);
  -webkit-font-smoothing:antialiased;
  min-height:100vh;
}

/* Shell layout */
.dp-shell{
  display:grid;
  grid-template-columns:280px 1fr;
  max-width:1400px;
  margin:0 auto;
  align-items:start;
}
@media (max-width:960px){ .dp-shell{ grid-template-columns:1fr; } }

/* Sidebar */
.dp-sidebar{
  padding:36px 24px 40px;
  position:sticky;
  top:0;
  height:calc(100vh - 72px);
  overflow-y:auto;
  border-right:1px solid var(--color-line, #ECE4E0);
}
@media (max-width:960px){ .dp-sidebar{ display:none; } }
.dp-nav-eyebrow{
  font-size:11px; font-weight:700; letter-spacing:0.12em;
  text-transform:uppercase; color:var(--color-gray, #857D79);
  margin:22px 12px 10px;
}
.dp-nav-eyebrow:first-child{ margin-top:0; }
.dp-nav-list{ list-style:none; display:flex; flex-direction:column; gap:2px; }
.dp-nav-item a{
  display:flex; align-items:center; gap:12px;
  padding:11px 12px;
  border-radius:10px;
  font-size:14.5px; font-weight:500;
  color:var(--color-ink-soft, #4A403D);
  transition:background .16s ease, color .16s ease, transform .16s ease;
}
.dp-nav-item a svg{ flex-shrink:0; opacity:0.75; }
.dp-nav-item a:hover{
  background:rgba(214,0,28,0.06);
  color:var(--color-red-dark, #8C0016);
  transform:translateX(2px);
}
.dp-nav-item.active a{
  background:linear-gradient(135deg, var(--color-mint, #D6001C), var(--color-red-dark, #8C0016));
  color:var(--white, #fff);
  box-shadow:0 8px 24px -12px rgba(27,18,16,0.12);
}
.dp-nav-item.active a svg{ opacity:1; }
.dp-nav-item.logout a{ color:var(--color-gray, #857D79); margin-top:8px; }
.dp-nav-item.logout a:hover{ background:rgba(239,68,68,0.08); color:var(--color-red-dark, #8C0016); }

/* Membership card */
.dp-member-card{
  margin-top:30px;
  border-radius:20px;
  padding:22px;
  background:linear-gradient(155deg, var(--color-mint, #D6001C) 0%, var(--color-red-dark, #8C0016) 55%, var(--color-maroon, #5C0A1C) 100%);
  color:var(--white, #fff);
  position:relative;
  overflow:hidden;
  box-shadow:0 20px 50px -20px rgba(92,10,28,0.18);
}
.dp-member-card::after{
  content:"";
  position:absolute; right:-40px; bottom:-50px;
  width:160px; height:160px; border-radius:50%;
  background:rgba(255,255,255,0.06);
}
.dp-member-card-top{
  display:flex; justify-content:space-between; align-items:flex-start;
  margin-bottom:26px;
}
.dp-chip{
  width:34px; height:24px; border-radius:5px;
  background:linear-gradient(135deg,#E8CB93,#B08D57);
}
.dp-tier-pill{
  font-size:10px; font-weight:700; letter-spacing:0.08em;
  text-transform:uppercase;
  background:rgba(255,255,255,0.18);
  padding:4px 10px; border-radius:20px;
}
.dp-member-card-number{
  font-family:'Fraunces', serif;
  font-size:17px; letter-spacing:0.08em;
  margin-bottom:18px;
}
.dp-member-card-name{
  font-size:12px; text-transform:uppercase; letter-spacing:0.06em;
  opacity:0.85; margin-bottom:14px;
}
.dp-member-progress-label{
  display:flex; justify-content:space-between;
  font-size:11px; opacity:0.9; margin-bottom:6px;
}
.dp-member-progress-track{
  height:5px; border-radius:10px; background:rgba(255,255,255,0.22);
  overflow:hidden;
}
.dp-member-progress-fill{
  height:100%; width:58%; border-radius:10px;
  background:linear-gradient(90deg,#F3D9A4,#B08D57);
}

/* Main content */
.dp-main{ padding:36px 40px 80px; min-width:0; }
@media (max-width:960px){ .dp-main{ padding:20px 16px 60px; } }

/* Profile header */
.dp-profile-header{
  position:relative;
  border-radius:24px;
  overflow:hidden;
  background:linear-gradient(120deg, var(--color-maroon, #5C0A1C) 0%, var(--color-red-dark, #8C0016) 45%, var(--color-mint, #D6001C) 100%);
  padding:44px 44px 34px;
  color:var(--white, #fff);
  box-shadow:0 20px 50px -20px rgba(92,10,28,0.18);
  margin-bottom:28px;
}
.dp-profile-header::before{
  content:"";
  position:absolute; inset:0;
  background-image:
    radial-gradient(circle at 85% 20%, rgba(255,255,255,0.14) 0, transparent 45%),
    radial-gradient(circle at 15% 110%, rgba(255,255,255,0.10) 0, transparent 40%);
}
.dp-profile-header-inner{
  position:relative; display:flex; align-items:center; justify-content:space-between; gap:24px;
}
.dp-profile-id{ display:flex; align-items:center; gap:22px; }
.dp-avatar-ring{
  width:96px; height:96px; border-radius:50%;
  padding:4px;
  background:linear-gradient(135deg, #B08D57, #F3D9A4);
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.dp-avatar{
  width:100%; height:100%; border-radius:50%;
  background:linear-gradient(135deg,#7A1B2B,#3A0410);
  display:flex; align-items:center; justify-content:center;
  font-family:'Fraunces', serif; font-size:32px; font-weight:600;
  border:3px solid var(--color-maroon, #5C0A1C);
}
.dp-profile-name-row{ display:flex; align-items:center; gap:12px; margin-bottom:6px; }
.dp-profile-name{
  font-family:'Fraunces', serif; font-size:30px; font-weight:600;
}
.dp-badge-gold{
  display:inline-flex; align-items:center; gap:5px;
  font-size:10.5px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase;
  background:linear-gradient(135deg, #B08D57, #E8CB93);
  color:#3D2A0C;
  padding:5px 11px; border-radius:20px;
}
.dp-profile-meta{ font-size:14px; opacity:0.85; display:flex; gap:16px; flex-wrap:wrap; }
.dp-profile-meta span{ display:flex; align-items:center; gap:6px; }
.dp-header-actions{ display:flex; gap:10px; flex-shrink:0; }

/* Buttons */
.dp-btn{
  display:inline-flex; align-items:center; gap:8px;
  padding:12px 22px; border-radius:12px;
  font-size:13.5px; font-weight:600;
  transition:transform .16s ease, box-shadow .16s ease, background .16s ease;
  white-space:nowrap;
}
.dp-btn-light{
  background:var(--white, #fff); color:var(--color-red-dark, #8C0016);
}
.dp-btn-light:hover{ transform:translateY(-2px); box-shadow:0 12px 24px -10px rgba(0,0,0,0.35); }
.dp-btn-outline{
  background:transparent; color:var(--white, #fff);
  border:1.5px solid rgba(255,255,255,0.5);
}
.dp-btn-outline:hover{ background:rgba(255,255,255,0.12); }

/* Stat cards */
.dp-stat-grid{
  display:grid; grid-template-columns:repeat(4, 1fr); gap:18px;
  margin-bottom:32px;
}
@media (max-width:960px){ .dp-stat-grid{ grid-template-columns:repeat(2, 1fr); } }
@media (max-width:600px){ .dp-stat-grid{ grid-template-columns:1fr; } }
.dp-stat-card{
  background:var(--white, #fff);
  border:1px solid var(--color-line, #ECE4E0);
  border-radius:18px;
  padding:22px 22px 20px;
  box-shadow:0 8px 24px -12px rgba(27,18,16,0.12);
  transition:transform .18s ease, box-shadow .18s ease;
}
.dp-stat-card:hover{ transform:translateY(-3px); box-shadow:0 20px 50px -20px rgba(92,10,28,0.18); }
.dp-stat-top{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
.dp-stat-icon{
  width:40px; height:40px; border-radius:12px;
  display:flex; align-items:center; justify-content:center;
  background:rgba(214,0,28,0.06); color:var(--color-red-dark, #8C0016);
}
.dp-stat-value{ font-family:'Fraunces', serif; font-size:28px; font-weight:600; margin-bottom:4px; }
.dp-stat-label{ font-size:13px; color:var(--color-gray, #857D79); }

/* Section */
.dp-section{
  background:var(--white, #fff);
  border:1px solid var(--color-line, #ECE4E0);
  border-radius:20px;
  padding:30px 32px 32px;
  margin-bottom:24px;
  box-shadow:0 8px 24px -12px rgba(27,18,16,0.12);
}
.dp-section-head{
  display:flex; justify-content:space-between; align-items:center;
  margin-bottom:24px;
}
.dp-section-eyebrow{
  font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase;
  color:var(--color-red-dark, #8C0016); margin-bottom:6px; display:block;
}
.dp-section-title{ font-family:'Fraunces', serif; font-size:22px; font-weight:600; }
.dp-link-action{
  font-size:13.5px; font-weight:600; color:var(--color-red-dark, #8C0016);
  display:flex; align-items:center; gap:5px;
}
.dp-link-action:hover{ text-decoration:underline; }

/* Form */
.dp-form-grid{
  display:grid; grid-template-columns:1fr 1fr; gap:20px 24px;
}
@media (max-width:600px){ .dp-form-grid{ grid-template-columns:1fr; } }
.dp-field{ display:flex; flex-direction:column; gap:8px; }
.dp-field.full{ grid-column:1 / -1; }
.dp-field label{
  font-size:12.5px; font-weight:600; color:var(--color-ink-soft, #4A403D);
  letter-spacing:0.01em;
}
.dp-field input, .dp-field select{
  padding:13px 15px;
  border:1.5px solid var(--color-line, #ECE4E0);
  border-radius:11px;
  font-size:14px;
  color:var(--color-ink, #1B1210);
  background:var(--color-paper, #FBF8F6);
  transition:border-color .16s ease, background .16s ease;
}
.dp-field input:focus, .dp-field select:focus{
  outline:none; border-color:var(--color-mint, #D6001C); background:var(--white, #fff);
}

/* Orders table */
.dp-orders-table{ width:100%; border-collapse:collapse; }
.dp-orders-table thead th{
  text-align:left; font-size:11.5px; font-weight:700; letter-spacing:0.06em;
  text-transform:uppercase; color:var(--color-gray, #857D79);
  padding:0 14px 14px; border-bottom:1.5px solid var(--color-line, #ECE4E0);
}
.dp-orders-table tbody td{
  padding:18px 14px; font-size:14px; border-bottom:1px solid var(--color-line, #ECE4E0);
  vertical-align:middle;
}
.dp-orders-table tbody tr:last-child td{ border-bottom:none; }
.dp-orders-table tbody tr{ transition:background .15s ease; }
.dp-orders-table tbody tr:hover{ background:rgba(251,248,246,0.8); }
.dp-order-product{ display:flex; align-items:center; gap:14px; }
.dp-order-thumb{
  width:46px; height:46px; border-radius:10px;
  background:linear-gradient(135deg,#F3E4E2,#EBD3D0);
  flex-shrink:0; overflow:hidden;
}
.dp-order-product-name{ font-weight:600; font-size:14px; }
.dp-order-product-sub{ font-size:12.5px; color:var(--color-gray, #857D79); }
.dp-status-pill{
  display:inline-flex; align-items:center; gap:6px;
  font-size:12px; font-weight:700; padding:5px 12px; border-radius:20px;
}
.dp-status-delivered{ background:#E7F6ED; color:#1A8A4B; }
.dp-status-transit{ background:#FDF1E2; color:#B4740E; }
.dp-status-processing{ background:#EDEBFB; color:#5B4CC4; }
.dp-row-action{ color:var(--color-red-dark, #8C0016); font-weight:600; font-size:13px; }
.dp-row-action:hover{ text-decoration:underline; }

/* Two column */
.dp-two-col{ display:grid; grid-template-columns:1fr 1fr; gap:24px; }
@media (max-width:960px){ .dp-two-col{ grid-template-columns:1fr; } }
.dp-card-list{ display:flex; flex-direction:column; gap:14px; }
.dp-info-card{
  border:1.5px solid var(--color-line, #ECE4E0);
  border-radius:14px;
  padding:18px 20px;
  display:flex; justify-content:space-between; align-items:flex-start;
  gap:14px;
  transition:border-color .16s ease, background .16s ease;
}
.dp-info-card:hover{ border-color:var(--color-gray-light, #C9C0BC); background:rgba(252,250,249,0.6); }
.dp-info-card.default{ border-color:var(--color-mint, #D6001C); background:rgba(253,246,245,0.6); }
.dp-info-card-title{ font-weight:700; font-size:14.5px; margin-bottom:5px; display:flex; align-items:center; gap:8px; }
.dp-default-tag{
  font-size:10px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase;
  background:var(--color-mint, #D6001C); color:var(--white, #fff); padding:3px 8px; border-radius:20px;
}
.dp-info-card-body{ font-size:13.5px; color:var(--color-ink-soft, #4A403D); line-height:1.55; }
.dp-info-card-actions{ display:flex; flex-direction:column; gap:8px; flex-shrink:0; }
.dp-icon-action{
  width:32px; height:32px; border-radius:9px; background:var(--color-paper, #FBF8F6);
  display:flex; align-items:center; justify-content:center; color:var(--color-gray, #857D79);
  transition:background .15s ease, color .15s ease;
}
.dp-icon-action:hover{ background:rgba(214,0,28,0.06); color:var(--color-red-dark, #8C0016); }
.dp-add-card{
  border:1.5px dashed var(--color-gray-light, #C9C0BC);
  border-radius:14px;
  padding:18px 20px;
  display:flex; align-items:center; justify-content:center; gap:8px;
  color:var(--color-gray, #857D79); font-weight:600; font-size:13.5px;
  transition:border-color .16s ease, color .16s ease;
  cursor:pointer;
}
.dp-add-card:hover{ border-color:var(--color-mint, #D6001C); color:var(--color-red-dark, #8C0016); }

.dp-card-brand-row{ display:flex; align-items:center; gap:10px; margin-bottom:5px; }
.dp-card-brand{
  width:38px; height:26px; border-radius:5px;
  background:linear-gradient(135deg, #1B1210, #3A2C29);
  display:flex; align-items:center; justify-content:center;
  color:var(--white, #fff); font-size:9px; font-weight:800; letter-spacing:0.03em;
}
.dp-card-brand.visa{ background:linear-gradient(135deg,#1A1F71,#2E3AA8); }
.dp-card-brand.mc{ background:linear-gradient(135deg,#EB001B,#F79E1B); }

/* Wishlist */
.dp-wishlist-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
@media (max-width:960px){ .dp-wishlist-grid{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:600px){ .dp-wishlist-grid{ grid-template-columns:1fr; } }
.dp-wish-item{
  border:1px solid var(--color-line, #ECE4E0);
  border-radius:16px;
  overflow:hidden;
  transition:transform .18s ease, box-shadow .18s ease;
  cursor:pointer;
}
.dp-wish-item:hover{ transform:translateY(-4px); box-shadow:0 8px 24px -12px rgba(27,18,16,0.12); }
.dp-wish-thumb{
  height:120px;
  background:linear-gradient(135deg,#F6E9E7,#EAD0CE);
  position:relative;
  overflow:hidden;
}
.dp-wish-thumb img{ width:100%; height:100%; object-fit:cover; }
.dp-wish-heart{
  position:absolute; top:10px; right:10px;
  width:30px; height:30px; border-radius:50%;
  background:rgba(255,255,255,0.9);
  display:flex; align-items:center; justify-content:center;
  color:var(--color-mint, #D6001C);
  font-size:14px;
}
.dp-wish-body{ padding:14px 16px 16px; }
.dp-wish-name{ font-size:13.5px; font-weight:600; margin-bottom:4px; }
.dp-wish-price{ font-size:13px; color:var(--color-red-dark, #8C0016); font-weight:700; }

/* Empty */
.dp-empty{ font-size:13px; color:var(--color-gray, #857D79); padding:20px 0; }
.dp-inline-link{ color:var(--color-red-dark, #8C0016); font-weight:600; background:none; border:none; cursor:pointer; text-decoration:underline; }

/* Modal */
.dp-modal-overlay{
  position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9999;
  display:flex; align-items:center; justify-content:center;
  padding:20px; backdrop-filter:blur(4px);
  animation:dpFadeIn .2s ease;
}
@keyframes dpFadeIn { from { opacity:0; } to { opacity:1; } }
.dp-modal{
  background:var(--white, #fff); border-radius:18px; width:100%; max-width:460px;
  box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);
  animation:dpSlideUp .25s cubic-bezier(.2,.7,.3,1);
}
.dp-modal-sm{ max-width:420px; }
@keyframes dpSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
.dp-modal-header{
  display:flex; justify-content:space-between; align-items:center;
  padding:20px 24px 0;
}
.dp-modal-header h2{ font-family:'Fraunces', serif; font-size:18px; font-weight:600; }
.dp-modal-close{
  width:32px; height:32px; border-radius:50%; border:none;
  background:var(--color-paper, #FBF8F6); font-size:20px; color:var(--color-gray, #857D79);
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:all .15s;
}
.dp-modal-close:hover{ background:var(--color-line, #ECE4E0); color:var(--color-ink, #1B1210); }
.dp-modal-body{ padding:20px 24px; display:flex; flex-direction:column; gap:16px; }
.dp-modal-footer{
  display:flex; gap:10px; padding:0 24px 20px; justify-content:flex-end;
}
.dp-btn-cancel{
  padding:10px 20px; border-radius:12px; border:1px solid var(--color-line, #ECE4E0);
  background:transparent; color:var(--color-gray, #857D79); font-size:13px; font-weight:600;
  cursor:pointer; transition:all .15s;
}
.dp-btn-cancel:hover{ background:var(--color-paper, #FBF8F6); }
.dp-btn-save{
  padding:10px 24px; border-radius:12px; border:none;
  background:linear-gradient(135deg, var(--color-mint, #D6001C), var(--color-red-dark, #8C0016));
  color:var(--white, #fff); font-size:13px; font-weight:700; cursor:pointer;
  box-shadow:0 4px 12px rgba(214,0,28,0.3); transition:all .2s;
}
.dp-btn-save:hover{ box-shadow:0 6px 16px rgba(214,0,28,0.4); transform:translateY(-1px); }
.dp-btn-save:disabled{ opacity:0.6; cursor:not-allowed; transform:none; }
.dp-btn-delete{
  padding:10px 24px; border-radius:12px; border:none;
  background:#ef4444; color:var(--white, #fff); font-size:13px; font-weight:700;
  cursor:pointer; transition:all .2s;
}
.dp-btn-delete:hover{ background:#dc2626; }
.dp-btn-delete:disabled{ opacity:0.6; cursor:not-allowed; }
.dp-delete-warning{
  display:flex; gap:14px; align-items:flex-start;
  padding:16px; background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.15);
  border-radius:14px;
}
.dp-delete-warning svg{ color:#ef4444; flex-shrink:0; margin-top:2px; }
.dp-delete-title{ font-size:14px; font-weight:700; color:var(--color-ink, #1B1210); }
.dp-delete-desc{ font-size:12.5px; color:var(--color-gray, #857D79); margin-top:4px; line-height:1.5; }
`

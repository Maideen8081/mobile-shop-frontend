import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, CalendarDays, ChevronRight, Heart, KeyRound, LayoutDashboard, Loader2, LogOut, Mail, MapPin,
  MessageCircle, Package, Pencil, Phone, ShoppingBag, Trash2, Truck, Wallet, Wrench, X,
} from 'lucide-react'
import { authService, type UserProfile } from '../services/authService'
import { orderService, type OrderResponse } from '../services/orderService'
import { addressService, type AddressData } from '../services/addressService'
import { useToast } from '../context/ToastContext'
import { readWishlistIds } from '../utils/wishlist'
import MobileProfile from '../components/mobile/MobileProfile'
import { useIsMobile } from '../components/mobile/helpers'
import DesktopPageLoader from '../components/ui/DesktopPageLoader'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import './ProfilePage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const STATUS: Record<string, { label: string; tone: string }> = {
  order_placed: { label: 'Placed', tone: 'tone-blue' },
  accepted: { label: 'Accepted', tone: 'tone-blue' },
  processing: { label: 'Processing', tone: 'tone-amber' },
  shipped: { label: 'Shipped', tone: 'tone-amber' },
  out_for_delivery: { label: 'Out for delivery', tone: 'tone-amber' },
  delivered: { label: 'Delivered', tone: 'tone-green' },
  cancelled: { label: 'Cancelled', tone: 'tone-red' },
}

const imageUrl = (raw?: string) => {
  if (!raw) return ''
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  return `${API_BASE_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`
}
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const formatDate = (d?: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!d) return ''
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', opts)
}
const initialsOf = (name: string) =>
  name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'U'
const errorMessage = (err: unknown, fallback: string) => {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
  if (data) {
    if (typeof data.message === 'string' && data.message) return data.message
    if (typeof data.detail === 'string') return data.detail
    const first = Object.values(data).flat()[0]
    if (typeof first === 'string') return first
  }
  return fallback
}

export default function ProfilePage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileProfile /> : <DesktopProfile />
}

function DesktopProfile() {
  const navigate = useNavigate()
  const showToast = useToast().show

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [wishlistCount] = useState(() => readWishlistIds().length)

  const [modal, setModal] = useState<'edit' | 'password' | 'delete' | null>(null)

  useEffect(() => {
    let alive = true
    authService.getProfile()
      .then((p) => { if (alive) setProfile(p) })
      .catch(() => {
        if (!alive) return
        try {
          const { name, email } = JSON.parse(localStorage.getItem('user_profile') || '{}')
          setProfile({ id: 0, email: email || '', fullName: name || 'User' })
        } catch { /* nothing cached */ }
      })
      .finally(() => { if (alive) setLoading(false) })
    orderService.listMine().then((o) => { if (alive) setOrders(o) }).catch(() => {})
    addressService.list().then((a) => { if (alive) setAddresses(a) }).catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!modal) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [modal])

  const stats = useMemo(() => {
    const live = orders.filter((o) => o.delivery_status !== 'cancelled')
    return {
      total: orders.length,
      active: live.filter((o) => o.delivery_status !== 'delivered').length,
      spend: live.reduce((s, o) => s + Number(o.grand_total || 0), 0),
    }
  }, [orders])

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 4),
    [orders],
  )
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0]

  const signOut = async () => {
    await authService.logout()
    showToast('Signed out', 'success')
    navigate('/home')
  }

  if (loading) {
    return (
      <div className="pf">
        <SiteTopNav />
        <DesktopPageLoader text="Loading your profile..." />
      </div>
    )
  }

  const user = profile || { id: 0, email: '', fullName: 'User' }
  const joined = formatDate(user.dateJoined, { month: 'long', year: 'numeric' })

  return (
    <div className="pf">
      <SiteTopNav />

      <div className="pf-shell">
        {/* ── Sidebar ── */}
        <aside className="pf-side">
          <div className="pf-side-user">
            <span className="pf-avatar">{initialsOf(user.fullName)}</span>
            <div style={{ minWidth: 0 }}>
              <strong>{user.fullName}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <nav className="pf-nav" aria-label="Account">
            <div className="pf-nav-label">Account</div>
            <Link to="/profile" className="is-active" aria-current="page"><LayoutDashboard size={17} /> Overview</Link>
            <Link to="/orders"><ShoppingBag size={17} /> My orders <span className="pf-nav-count">{stats.total}</span></Link>
            <Link to="/my-repairs"><Wrench size={17} /> My repairs</Link>
            <Link to="/wishlist"><Heart size={17} /> Wishlist <span className="pf-nav-count">{wishlistCount}</span></Link>
            <Link to="/profile/addresses"><MapPin size={17} /> Addresses <span className="pf-nav-count">{addresses.length}</span></Link>
            <div className="pf-nav-label">Help</div>
            <Link to="/support"><MessageCircle size={17} /> Support chat</Link>
            <div className="pf-nav-sep" />
            <button type="button" className="pf-signout" onClick={signOut}><LogOut size={17} /> Sign out</button>
          </nav>
        </aside>

        {/* ── Main ── */}
        <main className="pf-main">
          <section className="pf-hero" aria-labelledby="pf-name">
            <span className="pf-avatar lg">{initialsOf(user.fullName)}</span>
            <div className="pf-hero-text">
              <small>Welcome back</small>
              <h1 id="pf-name">{user.fullName}</h1>
              <div className="pf-hero-meta">
                {user.email && <span><Mail size={13} /> {user.email}</span>}
                {user.mobile
                  ? <span><Phone size={13} /> {user.mobile}</span>
                  : <span className="is-missing"><Phone size={13} /> No mobile added</span>}
                {joined && <span><CalendarDays size={13} /> Member since {joined}</span>}
              </div>
            </div>
            <button className="pf-btn pf-btn-light" onClick={() => setModal('edit')}><Pencil size={15} /> Edit profile</button>
          </section>

          <section className="pf-stats" aria-label="Account summary">
            <Link to="/orders" className="pf-stat">
              <span className="pf-stat-icon tone-red"><ShoppingBag size={18} /></span>
              <strong>{stats.total}</strong><span>Total orders</span>
            </Link>
            <Link to="/orders" className="pf-stat">
              <span className="pf-stat-icon tone-amber"><Truck size={18} /></span>
              <strong>{stats.active}</strong><span>In progress</span>
            </Link>
            <Link to="/wishlist" className="pf-stat">
              <span className="pf-stat-icon tone-blue"><Heart size={18} /></span>
              <strong>{wishlistCount}</strong><span>Wishlist items</span>
            </Link>
            <div className="pf-stat">
              <span className="pf-stat-icon tone-green"><Wallet size={18} /></span>
              <strong>{inr(stats.spend)}</strong><span>Total spent</span>
            </div>
          </section>

          <section className="pf-actions" aria-label="Quick actions">
            <Link to="/orders" className="pf-action"><span className="pf-stat-icon tone-amber"><Truck size={18} /></span><div><strong>Track orders</strong><span>See delivery status</span></div></Link>
            <Link to="/book-repair" className="pf-action"><span className="pf-stat-icon tone-red"><Wrench size={18} /></span><div><strong>Book a repair</strong><span>Same-day fixes</span></div></Link>
            <Link to="/trade-in" className="pf-action"><span className="pf-stat-icon tone-green"><Package size={18} /></span><div><strong>Trade in</strong><span>Get value for old phones</span></div></Link>
            <Link to="/support" className="pf-action"><span className="pf-stat-icon tone-blue"><MessageCircle size={18} /></span><div><strong>Get help</strong><span>Chat with support</span></div></Link>
          </section>

          <section className="pf-card" aria-labelledby="pf-orders">
            <div className="pf-card-head">
              <div><h2 id="pf-orders">Recent orders</h2><p>Your latest purchases</p></div>
              {orders.length > 0 && <Link to="/orders" className="pf-link">View all <ChevronRight size={15} /></Link>}
            </div>
            {recentOrders.length === 0 ? (
              <div className="pf-empty">
                You haven’t placed any orders yet.
                <div><Link to="/collection/all" className="pf-btn pf-btn-primary"><ShoppingBag size={16} /> Start shopping</Link></div>
              </div>
            ) : (
              <ul className="pf-orders">
                {recentOrders.map((o) => {
                  const first = o.items[0]
                  const more = o.items.length - 1
                  const status = STATUS[o.delivery_status] || { label: o.delivery_status.replace(/_/g, ' '), tone: 'tone-blue' }
                  const img = imageUrl(first?.image)
                  return (
                    <li key={o.id} className="pf-order">
                      <span className="pf-order-thumb">{img ? <img src={img} alt="" /> : <Package size={20} />}</span>
                      <div className="pf-order-info">
                        <strong>{first?.product_name || 'Order'}{more > 0 ? ` + ${more} more` : ''}</strong>
                        <span>#{o.order_number || o.order_id} · {formatDate(o.created_at)}</span>
                      </div>
                      <span className={`pf-pill ${status.tone}`}>{status.label}</span>
                      <span className="pf-order-total">{inr(Number(o.grand_total))}</span>
                      <Link to={`/orders?order_id=${o.id}`} className="pf-order-link" aria-label={`View order ${o.order_number || o.order_id}`}>
                        <ChevronRight size={18} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <div className="pf-two">
            <section className="pf-card" aria-labelledby="pf-details">
              <div className="pf-card-head">
                <h2 id="pf-details">Personal details</h2>
                <button className="pf-link" onClick={() => setModal('edit')}><Pencil size={14} /> Edit</button>
              </div>
              <dl className="pf-details">
                <div><dt>Full name</dt><dd>{user.fullName}</dd></div>
                <div><dt>Mobile</dt><dd className={user.mobile ? '' : 'is-missing'}>{user.mobile || 'Not added'}</dd></div>
                <div><dt>Email</dt><dd>{user.email || '—'}</dd></div>
                <div><dt>Member since</dt><dd className={joined ? '' : 'is-missing'}>{joined || 'Not available'}</dd></div>
              </dl>
            </section>

            <section className="pf-card" aria-labelledby="pf-address">
              <div className="pf-card-head">
                <h2 id="pf-address">Default address</h2>
                <Link to="/profile/addresses" className="pf-link">{addresses.length ? 'Manage' : 'Add'} <ChevronRight size={15} /></Link>
              </div>
              <div className="pf-card-body">
                {defaultAddress ? (
                  <div className="pf-address">
                    <span className="pf-stat-icon tone-red"><MapPin size={18} /></span>
                    <p>
                      <strong>{defaultAddress.fullName} · {defaultAddress.addressType}</strong>
                      {defaultAddress.addressLine1}{defaultAddress.addressLine2 ? `, ${defaultAddress.addressLine2}` : ''}<br />
                      {defaultAddress.city}, {defaultAddress.state} – {defaultAddress.zipCode}<br />
                      {defaultAddress.mobile}
                    </p>
                  </div>
                ) : (
                  <p className="pf-empty" style={{ padding: 0 }}>No saved address yet — add one to check out faster.</p>
                )}
              </div>
            </section>
          </div>

          <section className="pf-card" aria-labelledby="pf-security">
            <div className="pf-card-head"><h2 id="pf-security">Security & account</h2></div>
            <div className="pf-row">
              <div><strong>Password</strong><span>Change the password you use to sign in</span></div>
              <button className="pf-btn pf-btn-ghost" onClick={() => setModal('password')}><KeyRound size={15} /> Change password</button>
            </div>
            <div className="pf-row">
              <div><strong>Sign out</strong><span>Sign out of this device</span></div>
              <button className="pf-btn pf-btn-ghost" onClick={signOut}><LogOut size={15} /> Sign out</button>
            </div>
            <div className="pf-row">
              <div><strong>Delete account</strong><span>Permanently remove your account and data</span></div>
              <button className="pf-btn pf-btn-danger-outline" onClick={() => setModal('delete')}><Trash2 size={15} /> Delete account</button>
            </div>
          </section>
        </main>
      </div>


      {modal === 'edit' && (
        <EditProfileModal
          user={user}
          onClose={() => setModal(null)}
          onSaved={(p) => { setProfile(p); setModal(null); showToast('Profile updated', 'success') }}
        />
      )}
      {modal === 'password' && (
        <ChangePasswordModal
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); showToast('Password changed', 'success') }}
        />
      )}
      {modal === 'delete' && (
        <DeleteAccountModal
          onClose={() => setModal(null)}
          onDeleted={() => { showToast('Your account has been deleted', 'success'); navigate('/home') }}
        />
      )}
    </div>
  )
}

function Modal({ title, onClose, busy, children, footer }: {
  title: string; onClose: () => void; busy: boolean; children: React.ReactNode; footer: React.ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])
  return (
    <div className="pf-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <div className="pf-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="pf-modal-head">
          <h2>{title}</h2>
          <button type="button" className="pf-close" onClick={onClose} disabled={busy} aria-label="Close"><X size={17} /></button>
        </div>
        {children}
        <div className="pf-modal-foot">{footer}</div>
      </div>
    </div>
  )
}

function EditProfileModal({ user, onClose, onSaved }: {
  user: UserProfile; onClose: () => void; onSaved: (p: UserProfile) => void
}) {
  const [fullName, setFullName] = useState(user.fullName)
  const [mobile, setMobile] = useState((user.mobile || '').replace(/\D/g, '').slice(-10))
  const [errors, setErrors] = useState<{ fullName?: string; mobile?: string }>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const found: typeof errors = {}
    if (fullName.trim().length < 2) found.fullName = 'Enter your full name'
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) found.mobile = 'Enter a valid 10-digit mobile number'
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    setFormError('')
    try {
      onSaved(await authService.updateProfile({ fullName: fullName.trim(), mobile }))
    } catch (err) {
      setFormError(errorMessage(err, 'Couldn’t update your profile. Please try again.'))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} noValidate>
      <Modal
        title="Edit profile"
        onClose={onClose}
        busy={saving}
        footer={<>
          <button type="button" className="pf-btn pf-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="pf-btn pf-btn-primary" disabled={saving}>
            {saving ? <><Loader2 size={16} className="pf-spin" /> Saving…</> : 'Save changes'}
          </button>
        </>}
      >
        <div className="pf-modal-body">
          <div className={`pf-field${errors.fullName ? ' has-error' : ''}`}>
            <label htmlFor="pf-fullname">Full name</label>
            <input id="pf-fullname" value={fullName} autoFocus autoComplete="name" onChange={(e) => setFullName(e.target.value)} />
            {errors.fullName && <small className="pf-err">{errors.fullName}</small>}
          </div>
          <div className={`pf-field${errors.mobile ? ' has-error' : ''}`}>
            <label htmlFor="pf-mobile">Mobile number</label>
            <input
              id="pf-mobile" value={mobile} inputMode="tel" autoComplete="tel-national" placeholder="10-digit number"
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
            {errors.mobile && <small className="pf-err">{errors.mobile}</small>}
          </div>
          <div className="pf-field">
            <label htmlFor="pf-email">Email</label>
            <input id="pf-email" value={user.email} readOnly />
            <small>Your email is your login and can’t be changed here.</small>
          </div>
          {formError && <p className="pf-form-error" role="alert">{formError}</p>}
        </div>
      </Modal>
    </form>
  )
}

function ChangePasswordModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.oldPassword) return setError('Enter your current password')
    if (form.newPassword.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.newPassword)) {
      return setError('New password needs 8+ characters with upper and lower case letters and a number')
    }
    if (form.newPassword !== form.confirmPassword) return setError('New passwords don’t match')
    setSaving(true)
    setError('')
    try {
      await authService.changePassword(form)
      onSaved()
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t change your password. Please try again.'))
      setSaving(false)
    }
  }

  const input = (key: keyof typeof form, label: string, autoComplete: string) => (
    <div className="pf-field">
      <label htmlFor={`pf-${key}`}>{label}</label>
      <input
        id={`pf-${key}`} type="password" autoComplete={autoComplete} value={form[key]} autoFocus={key === 'oldPassword'}
        onChange={(e) => { setForm((p) => ({ ...p, [key]: e.target.value })); setError('') }}
      />
    </div>
  )

  return (
    <form onSubmit={save} noValidate>
      <Modal
        title="Change password"
        onClose={onClose}
        busy={saving}
        footer={<>
          <button type="button" className="pf-btn pf-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="pf-btn pf-btn-primary" disabled={saving}>
            {saving ? <><Loader2 size={16} className="pf-spin" /> Updating…</> : 'Update password'}
          </button>
        </>}
      >
        <div className="pf-modal-body">
          {input('oldPassword', 'Current password', 'current-password')}
          {input('newPassword', 'New password', 'new-password')}
          {input('confirmPassword', 'Confirm new password', 'new-password')}
          {error && <p className="pf-form-error" role="alert">{error}</p>}
        </div>
      </Modal>
    </form>
  )
}

function DeleteAccountModal({ onClose, onDeleted }: { onClose: () => void; onDeleted: () => void }) {
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const remove = async () => {
    setDeleting(true)
    setError('')
    try {
      await authService.deleteAccount()
      onDeleted()
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t delete your account. Please try again.'))
      setDeleting(false)
    }
  }

  return (
    <Modal
      title="Delete account"
      onClose={onClose}
      busy={deleting}
      footer={<>
        <button type="button" className="pf-btn pf-btn-ghost" onClick={onClose} disabled={deleting}>Keep my account</button>
        <button type="button" className="pf-btn pf-btn-danger" onClick={remove} disabled={deleting || confirmText !== 'DELETE'}>
          {deleting ? <><Loader2 size={16} className="pf-spin" /> Deleting…</> : 'Delete permanently'}
        </button>
      </>}
    >
      <div className="pf-modal-body">
        <div className="pf-warning">
          <AlertTriangle size={20} />
          <span>This permanently removes your account, saved addresses and order history. It can’t be undone.</span>
        </div>
        <div className="pf-field">
          <label htmlFor="pf-confirm">Type <strong>DELETE</strong> to confirm</label>
          <input id="pf-confirm" value={confirmText} autoFocus onChange={(e) => setConfirmText(e.target.value)} />
        </div>
        {error && <p className="pf-form-error" role="alert">{error}</p>}
      </div>
    </Modal>
  )
}

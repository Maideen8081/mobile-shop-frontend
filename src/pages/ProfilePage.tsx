import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Bell, CalendarDays, Camera, ChevronRight, Crown, Heart, Home, KeyRound,
  Loader2, Lock, Mail, MapPin, Pencil, Phone, ShieldCheck, ShoppingBag, SlidersHorizontal,
  Trash2, User, Wallet, Wrench, X,
} from 'lucide-react'
import { authService, type UserProfile } from '../services/authService'
import { orderService, type OrderResponse } from '../services/orderService'
import { addressService, type AddressData } from '../services/addressService'
import { repairService, type RepairTicket } from '../services/repairService'
import { isClosed, isCompleted } from '../components/repair/repairStatus'
import { useToast } from '../context/ToastContext'
import { readWishlistIds } from '../utils/wishlist'
import MobileProfile from '../components/mobile/MobileProfile'
import { useIsMobile } from '../components/mobile/helpers'
import PageLoading from '../components/ui/PageLoading'
import AccountLayout, { AccountPhone } from '../components/account/AccountLayout'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import './ProfilePage.css'

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const formatDate = (d?: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!d) return ''
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', opts)
}
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

const PREFS_KEY = 'profile_prefs'
type Prefs = { orderUpdates: boolean; promotions: boolean }
const readPrefs = (): Prefs => {
  try {
    return { orderUpdates: true, promotions: false, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }
  } catch {
    return { orderUpdates: true, promotions: false }
  }
}

function Toggle({ on, onChange, label, disabled }: { on: boolean; onChange?: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled}
      className={`pf-toggle${on ? ' is-on' : ''}`} onClick={() => onChange?.(!on)}
    >
      <span />
    </button>
  )
}

function DesktopProfile() {
  const navigate = useNavigate()
  const showToast = useToast().show

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [repairs, setRepairs] = useState<RepairTicket[]>([])
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [wishlistCount] = useState(() => readWishlistIds().length)
  const [prefs, setPrefs] = useState<Prefs>(readPrefs)

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
    repairService.myTickets().then((r) => { if (alive) setRepairs(r) }).catch(() => {})
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
    // Only money actually spent: paid orders, or COD orders that were delivered.
    const spent = orders.filter((o) => {
      if (/cancel/i.test(o.delivery_status)) return false
      if (String(o.payment_status).toLowerCase() === 'paid') return true
      return /^delivered$/i.test(String(o.delivery_status).trim())
    })
    return {
      total: orders.length,
      spend: spent.reduce((s, o) => s + Number(o.grand_total || 0), 0),
      activeRepairs: repairs.filter((t) => !isClosed(t) && !isCompleted(t)).length,
    }
  }, [orders, repairs])

  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0]

  const updatePref = (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
    showToast('Preferences saved', 'success')
  }

  if (loading) {
    return (
      <div className="pf">
        <SiteTopNav />
        <PageLoading label="Loading your profile…" className="min-h-[60vh]" />
      </div>
    )
  }

  const user = profile || { id: 0, email: '', fullName: 'User' }
  const joined = formatDate(user.dateJoined, { month: 'long', year: 'numeric' })
  const joinedShort = formatDate(user.dateJoined, { month: 'short', year: 'numeric' })
  const initial = (user.fullName.trim()[0] || 'U').toUpperCase()

  return (
    <div className="pf">
      <SiteTopNav />

      <AccountLayout active="profile" crumb="My Account" counts={{ orders: stats.total, addresses: addresses.length }}>
          <main className="pf-main">
            <section className="acc-hero pf-hero" aria-labelledby="pf-name">
              <div className="pf-hero-avatar">
                <span>{initial}</span>
                <button type="button" className="pf-hero-cam" onClick={() => setModal('edit')} aria-label="Edit profile">
                  <Camera size={16} />
                </button>
              </div>
              <div className="pf-hero-text">
                <small>Welcome back,</small>
                <div className="pf-hero-title">
                  <h1 id="pf-name">{user.fullName}</h1>
                  <span className="pf-badge"><Crown size={14} /> Member</span>
                </div>
                <div className="pf-hero-meta">
                  {user.email && <span><Mail size={15} /> {user.email}</span>}
                  {user.mobile
                    ? <span><Phone size={15} /> {user.mobile}</span>
                    : <span className="is-missing"><Phone size={15} /> No mobile added</span>}
                  {joinedShort && <span><CalendarDays size={15} /> Member since {joinedShort}</span>}
                </div>
              </div>
              <AccountPhone className="acc-phone-lg" />
            </section>

            <section className="pf-stats" aria-label="Account summary">
              <Link to="/orders" className="pf-stat is-violet">
                <span className="pf-stat-icon"><ShoppingBag size={24} /></span>
                <div><strong>{stats.total}</strong><span>Total Orders</span></div>
                <ChevronRight size={20} className="pf-stat-go" />
              </Link>
              <Link to="/my-repairs" className="pf-stat is-amber">
                <span className="pf-stat-icon"><Wrench size={24} /></span>
                <div><strong>{stats.activeRepairs}</strong><span>Active Repairs</span></div>
                <ChevronRight size={20} className="pf-stat-go" />
              </Link>
              <Link to="/wishlist" className="pf-stat is-blue">
                <span className="pf-stat-icon"><Heart size={24} /></span>
                <div><strong>{wishlistCount}</strong><span>Wishlist Items</span></div>
                <ChevronRight size={20} className="pf-stat-go" />
              </Link>
              <Link to="/orders" className="pf-stat is-green">
                <span className="pf-stat-icon"><Wallet size={24} /></span>
                <div><strong>{inr(stats.spend)}</strong><span>Total Spent</span></div>
                <ChevronRight size={20} className="pf-stat-go" />
              </Link>
            </section>

            <div className="pf-two">
              <section className="pf-card" aria-labelledby="pf-details">
                <div className="pf-card-head">
                  <h2 id="pf-details"><User size={22} /> Personal Information</h2>
                  <button className="pf-chip-btn" onClick={() => setModal('edit')}><Pencil size={14} /> Edit</button>
                </div>
                <dl className="pf-details">
                  <div><dt><User size={16} /> Full Name</dt><dd>{user.fullName}</dd></div>
                  <div><dt><Mail size={16} /> Email</dt><dd>{user.email || '—'}</dd></div>
                  <div><dt><Phone size={16} /> Mobile</dt><dd className={user.mobile ? '' : 'is-missing'}>{user.mobile || 'Not added'}</dd></div>
                  <div><dt><CalendarDays size={16} /> Member Since</dt><dd className={joined ? '' : 'is-missing'}>{joined || 'Not available'}</dd></div>
                </dl>
              </section>

              <section className="pf-card" aria-labelledby="pf-address">
                <div className="pf-card-head">
                  <h2 id="pf-address"><MapPin size={22} /> Default Address</h2>
                  <Link to="/profile/addresses" className="pf-chip-btn">{addresses.length ? 'Manage' : 'Add'} <ChevronRight size={14} /></Link>
                </div>
                {defaultAddress ? (
                  <Link to="/profile/addresses" className="pf-address">
                    <span className="pf-address-icon"><Home size={20} /></span>
                    <div className="pf-address-text">
                      <div className="pf-address-tags">
                        <span className="pf-tag">{defaultAddress.addressType || 'Home'}</span>
                        {defaultAddress.isDefault && <span className="pf-tag is-accent">Default</span>}
                      </div>
                      <p>
                        {defaultAddress.addressLine1}{defaultAddress.addressLine2 ? `, ${defaultAddress.addressLine2}` : ''}<br />
                        {defaultAddress.city}, {defaultAddress.state} – {defaultAddress.zipCode}<br />
                        {defaultAddress.mobile}
                      </p>
                    </div>
                    <span className="pf-address-pin" aria-hidden="true"><MapPin size={30} /></span>
                    <ChevronRight size={20} className="pf-address-go" />
                  </Link>
                ) : (
                  <div className="pf-address is-empty">
                    <span className="pf-address-icon"><Home size={20} /></span>
                    <p>No saved address yet — add one to check out faster.</p>
                  </div>
                )}
              </section>

              <section className="pf-card" aria-labelledby="pf-security">
                <div className="pf-card-head">
                  <h2 id="pf-security"><ShieldCheck size={22} /> Security &amp; Account</h2>
                </div>
                <button type="button" className="pf-row is-click" onClick={() => setModal('password')}>
                  <span className="pf-row-icon"><KeyRound size={20} /></span>
                  <div><strong>Change Password</strong><span>Update your password to keep your account secure</span></div>
                  <ChevronRight size={20} className="pf-row-go" />
                </button>
                <div className="pf-row">
                  <span className="pf-row-icon"><Lock size={20} /></span>
                  <div><strong>Two-Factor Authentication</strong><span>Add an extra layer of security to your account</span></div>
                  <Toggle on={false} disabled label="Two-factor authentication (coming soon)" />
                </div>
                <button type="button" className="pf-row is-click is-danger" onClick={() => setModal('delete')}>
                  <span className="pf-row-icon"><Trash2 size={20} /></span>
                  <div><strong>Delete Account</strong><span>Permanently remove your account and data</span></div>
                  <ChevronRight size={20} className="pf-row-go" />
                </button>
              </section>

              <section className="pf-card" aria-labelledby="pf-prefs">
                <div className="pf-card-head">
                  <h2 id="pf-prefs"><SlidersHorizontal size={22} /> Preferences</h2>
                </div>
                <div className="pf-row">
                  <span className="pf-row-icon"><Bell size={20} /></span>
                  <div><strong>Order Notifications</strong><span>Get updates on your orders, repairs and more</span></div>
                  <Toggle on={prefs.orderUpdates} label="Order notifications" onChange={(v) => updatePref('orderUpdates', v)} />
                </div>
                <div className="pf-row">
                  <span className="pf-row-icon"><Mail size={20} /></span>
                  <div><strong>Offers &amp; Promotions</strong><span>Receive deals, discounts and special offers</span></div>
                  <Toggle on={prefs.promotions} label="Offers and promotions" onChange={(v) => updatePref('promotions', v)} />
                </div>
              </section>
            </div>
          </main>
      </AccountLayout>

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

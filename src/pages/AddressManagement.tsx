import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell, Briefcase, Check, ChevronDown, CreditCard, Heart, Home, Loader2, LogOut, MapPin,
  MessageSquare, MoreVertical, Package, Pencil, Phone, Plus, Save, ShieldCheck, Star, Trash2, User,
  UserRound, Wrench,
} from 'lucide-react'
import { addressService, type AddressData } from '../services/addressService'
import { authService, type UserProfile } from '../services/authService'
import { orderService } from '../services/orderService'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import DesktopPageLoader from '../components/ui/DesktopPageLoader'
import MobileAddressManagement from '../components/mobile/MobileAddressManagement'
import { useIsMobile } from '../components/mobile/helpers'
import { useToast } from '../context/ToastContext'
import { readWishlistIds } from '../utils/wishlist'
import { INDIAN_STATES } from '../utils/indianStates'
import './AddressManagement.css'

type AddressForm = Omit<AddressData, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
type FormErrors = Partial<Record<keyof AddressForm, string>>

const TYPE_ICONS = { Home, Office: Briefcase, Other: MapPin } as const

const CITY_SUGGESTIONS = [
  'Virudhunagar', 'Madurai', 'Chennai', 'Coimbatore', 'Tiruchirappalli', 'Salem', 'Tirunelveli',
  'Sivakasi', 'Thoothukudi', 'Erode', 'Vellore', 'Thanjavur', 'Dindigul', 'Karur', 'Rajapalayam',
]

const emptyForm: AddressForm = {
  fullName: '',
  mobile: '',
  alternateMobile: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  country: 'India',
  state: 'Tamil Nadu',
  city: '',
  zipCode: '',
  addressType: 'Home',
  isDefault: false,
}

function validate(f: AddressForm): FormErrors {
  const e: FormErrors = {}
  if (f.fullName.trim().length < 2) e.fullName = 'Enter the full name'
  if (!/^[6-9]\d{9}$/.test(f.mobile)) e.mobile = 'Enter a valid 10-digit mobile number'
  if (f.addressLine1.trim().length < 3) e.addressLine1 = 'Enter house no., building and street'
  if (!/^\d{6}$/.test(f.zipCode)) e.zipCode = 'Enter a valid 6-digit pincode'
  if (!f.city.trim()) e.city = 'Enter the city'
  if (!f.state.trim()) e.state = 'Select the state'
  return e
}

function formatPhone(p: string) {
  const d = p.replace(/\D/g, '').slice(-10)
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : p
}

// Default first, then newest.
const sortAddresses = (list: AddressData[]) =>
  [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || Number(b.id) - Number(a.id))

const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

export default function AddressManagement() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileAddressManagement /> : <DesktopAddressManagement />
}

/* ── Sidebar ─────────────────────────────────────────────── */

function AccountSidebar() {
  const navigate = useNavigate()
  const showToast = useToast().show
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<number | null>(null)
  const [wishlist] = useState(() => readWishlistIds().length)

  useEffect(() => {
    let alive = true
    authService.getProfile().then((p) => { if (alive) setProfile(p) }).catch(() => {})
    orderService.listMine().then((o) => { if (alive) setOrders(o.length) }).catch(() => {})
    return () => { alive = false }
  }, [])

  const signOut = async () => {
    await authService.logout()
    showToast('Signed out', 'success')
    navigate('/home')
  }

  const link = (to: string, icon: ReactNode, label: string, extra?: ReactNode, active = false) => (
    <Link to={to} className={`am-nav-item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
      {icon}<span>{label}</span>{extra}
    </Link>
  )
  const badge = (n: number | null) => <span className="am-nav-badge">{n ?? '·'}</span>

  return (
    <aside className="am-side" aria-label="My account">
      <div className="am-user">
        <span className="am-user-avatar"><User size={22} /></span>
        <div className="am-user-text">
          <strong>{profile?.fullName || 'My Account'}</strong>
          {profile?.email && <span title={profile.email}>{profile.email}</span>}
        </div>
      </div>

      <nav className="am-nav">
        <p className="am-nav-label">My Account</p>
        {link('/profile', <UserRound size={20} />, 'Profile')}
        {link('/orders', <Package size={20} />, 'My Orders', badge(orders))}
        {link('/my-repairs', <Wrench size={20} />, 'My Repairs')}
        {link('/profile/addresses', <MapPin size={20} />, 'Addresses', null, true)}
        {link('/wishlist', <Heart size={20} />, 'Wishlist', badge(wishlist))}
        {link('/orders', <CreditCard size={20} />, 'Payments')}
        {link('/notifications', <Bell size={20} />, 'Notifications', <span className="am-nav-dot" aria-label="New" />)}
        {link('/profile', <ShieldCheck size={20} />, 'Security')}
      </nav>

      <nav className="am-nav am-nav-help">
        <p className="am-nav-label">Help</p>
        {link('/support', <MessageSquare size={20} />, 'Support Chat')}
        <button type="button" className="am-nav-item" onClick={signOut}><LogOut size={20} /><span>Log Out</span></button>
      </nav>
    </aside>
  )
}

/* ── Decorative map illustration ─────────────────────────── */

function MapArt() {
  return (
    <svg className="am-map-art" viewBox="0 0 180 110" aria-hidden="true">
      <defs>
        <linearGradient id="amMapA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#efe7ff" />
          <stop offset="1" stopColor="#d9c8fb" />
        </linearGradient>
        <linearGradient id="amPin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#5b21b6" />
        </linearGradient>
      </defs>
      <ellipse cx="96" cy="98" rx="72" ry="8" fill="#5b21b6" opacity="0.08" />
      <path d="M20 62 L62 44 L100 62 L142 44 L164 78 L122 96 L84 78 L42 96 Z" fill="url(#amMapA)" stroke="#c4b0f3" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M62 44 L42 96 M100 62 L84 78 M142 44 L122 96" stroke="#c4b0f3" strokeWidth="1.5" />
      <path d="M38 74 Q70 66 92 76 T150 66" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <path d="M86 6 C72 6 62 16 62 30 C62 46 86 70 86 70 C86 70 110 46 110 30 C110 16 100 6 86 6 Z" fill="url(#amPin)" />
      <circle cx="86" cy="29" r="9" fill="#fff" />
    </svg>
  )
}

/* ── Page ────────────────────────────────────────────────── */

function DesktopAddressManagement() {
  const showToast = useToast().show
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState<AddressData | null>(null)
  const [form, setForm] = useState<AddressForm>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const [menuId, setMenuId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<AddressData | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [defaultBusyId, setDefaultBusyId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setAddresses(sortAddresses(await addressService.list()))
  }, [])

  useEffect(() => {
    let alive = true
    addressService.list()
      .then((list) => { if (alive) setAddresses(sortAddresses(list)) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  // Close the card menu on outside click / Escape.
  useEffect(() => {
    if (menuId == null) return
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.am-menu-wrap')) setMenuId(null)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuId(null) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuId])

  // Delete confirmation: lock scroll + Escape to close.
  useEffect(() => {
    if (!deleting) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !deleteBusy) setDeleting(null) }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [deleting, deleteBusy])

  const focusForm = () => {
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      nameRef.current?.focus({ preventScroll: true })
    })
  }

  const resetForm = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setFormError('')
  }

  const openAdd = () => {
    resetForm()
    focusForm()
  }

  const openEdit = (addr: AddressData) => {
    setMenuId(null)
    setEditing(addr)
    setForm({
      fullName: addr.fullName,
      mobile: addr.mobile.replace(/\D/g, '').slice(-10),
      alternateMobile: addr.alternateMobile || '',
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      landmark: addr.landmark || '',
      country: addr.country || 'India',
      state: addr.state,
      city: addr.city,
      zipCode: addr.zipCode,
      addressType: addr.addressType,
      isDefault: addr.isDefault,
    })
    setErrors({})
    setFormError('')
    focusForm()
  }

  const setField = <K extends keyof AddressForm>(key: K, value: AddressForm[K]) => {
    setForm((p) => ({ ...p, [key]: value }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        ...form,
        fullName: form.fullName.trim(),
        city: form.city.trim(),
        country: form.country.trim() || 'India',
        // The first saved address becomes the default.
        isDefault: editing ? form.isDefault : addresses.length === 0,
      }
      if (editing?.id != null) await addressService.update(editing.id, payload)
      else await addressService.create(payload)
      await refresh()
      showToast(editing ? 'Address updated' : 'Address added', 'success')
      resetForm()
    } catch (err) {
      setFormError(errorText(err, 'Couldn’t save the address. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting?.id) return
    setDeleteBusy(true)
    try {
      await addressService.delete(deleting.id)
      if (editing?.id === deleting.id) resetForm()
      await refresh()
      setDeleting(null)
      showToast('Address removed', 'success')
    } catch (err) {
      showToast(errorText(err, 'Couldn’t delete the address'), 'error')
    } finally {
      setDeleteBusy(false)
    }
  }

  const handleSetDefault = async (id: number | undefined) => {
    setMenuId(null)
    if (id == null || defaultBusyId != null) return
    setDefaultBusyId(id)
    try {
      await addressService.setDefault(id)
      await refresh()
      showToast('Default address updated', 'success')
    } catch (err) {
      showToast(errorText(err, 'Couldn’t set the default address'), 'error')
    } finally {
      setDefaultBusyId(null)
    }
  }

  const err = (key: keyof AddressForm) =>
    errors[key] ? <span id={`am-${key}-err`} className="am-field-error">{errors[key]}</span> : null
  const aria = (key: keyof AddressForm) => ({
    id: `am-${key}`,
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `am-${key}-err` : undefined,
  })
  const digits = (v: string, n: number) => v.replace(/\D/g, '').slice(0, n)
  const stateOptions = form.state && !INDIAN_STATES.includes(form.state) ? [form.state, ...INDIAN_STATES] : INDIAN_STATES

  return (
    <div className="am">
      <SiteTopNav />

      <main className="am-layout">
        <AccountSidebar />

        <section className="am-center">
          <header className="am-head">
            <span className="am-head-icon"><MapPin size={26} /></span>
            <div>
              <h1>My Addresses</h1>
              <p>Manage your delivery addresses for a faster checkout.</p>
            </div>
          </header>

          <div className="am-list-card">
            <div className="am-list-head">
              <h2>Saved Addresses{!loading && ` (${addresses.length})`}</h2>
              <button type="button" className="am-btn am-btn-primary am-btn-sm" onClick={openAdd}>
                <Plus size={18} /> Add New Address
              </button>
            </div>

            {loading ? (
              <DesktopPageLoader text="Loading your addresses..." />
            ) : addresses.length === 0 ? (
              <div className="am-empty">
                <span className="am-empty-icon"><MapPin size={26} /></span>
                <h3>No saved addresses yet</h3>
                <p>Fill in the form to save your first delivery address.</p>
              </div>
            ) : (
              <div className="am-cards">
                {addresses.map((addr) => {
                  const TypeIcon = TYPE_ICONS[addr.addressType] || MapPin
                  const busy = defaultBusyId === addr.id
                  const isEditing = editing?.id === addr.id
                  return (
                    <article
                      key={addr.id}
                      className={`am-card${addr.isDefault ? ' is-default' : ''}${isEditing ? ' is-editing' : ''}`}
                    >
                      <div className="am-card-body">
                        <span className="am-type-icon"><TypeIcon size={20} /></span>
                        <div className="am-card-info">
                          <div className="am-name-row">
                            <span className="am-name">{addr.fullName}</span>
                            <span className="am-pill am-pill-type">{addr.addressType}</span>
                            {addr.isDefault && <span className="am-pill am-pill-default"><Check size={12} strokeWidth={3} /> Default</span>}
                          </div>
                          <span className="am-phone"><Phone size={16} /> {formatPhone(addr.mobile)}</span>
                          <p className="am-address">
                            {addr.addressLine1}
                            {addr.addressLine2 && <>, {addr.addressLine2}</>}
                            {addr.landmark && <>, near {addr.landmark}</>}
                            <br />
                            {addr.city}, {addr.state} – <strong>{addr.zipCode}</strong>{addr.country && <>, {addr.country}</>}
                          </p>
                        </div>

                        <div className="am-menu-wrap">
                          <button
                            type="button"
                            className="am-kebab"
                            aria-label={`More options for ${addr.fullName}`}
                            aria-haspopup="menu"
                            aria-expanded={menuId === addr.id}
                            onClick={() => setMenuId(menuId === addr.id ? null : addr.id ?? null)}
                          >
                            <MoreVertical size={20} />
                          </button>
                          {menuId === addr.id && (
                            <div className="am-menu" role="menu">
                              <button type="button" role="menuitem" onClick={() => openEdit(addr)}><Pencil size={15} /> Edit</button>
                              {!addr.isDefault && (
                                <button type="button" role="menuitem" onClick={() => handleSetDefault(addr.id)}><Star size={15} /> Set as default</button>
                              )}
                              <button type="button" role="menuitem" className="is-danger" onClick={() => { setMenuId(null); setDeleting(addr) }}>
                                <Trash2 size={15} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="am-card-foot">
                        {addr.isDefault ? (
                          <span className="am-default-note"><Check size={17} strokeWidth={2.5} /> Used at checkout</span>
                        ) : (
                          <button type="button" className="am-link-btn" onClick={() => handleSetDefault(addr.id)} disabled={defaultBusyId != null}>
                            {busy ? <Loader2 size={17} className="am-spin" /> : <Star size={17} />}
                            {busy ? 'Setting…' : 'Set as default'}
                          </button>
                        )}
                        <button type="button" className="am-icon-btn" onClick={() => openEdit(addr)} aria-label={`Edit address of ${addr.fullName}`}>
                          <Pencil size={16} /> Edit
                        </button>
                        <button type="button" className="am-icon-btn is-danger" onClick={() => setDeleting(addr)} aria-label={`Delete address of ${addr.fullName}`}>
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <form ref={formRef} className="am-form-card" onSubmit={handleSave} noValidate aria-labelledby="am-form-title">
          <div className="am-form-hero">
            <span className="am-hero-icon">{editing ? <Pencil size={24} /> : <Plus size={28} strokeWidth={1.75} />}</span>
            <div>
              <h2 id="am-form-title">{editing ? 'Edit Address' : 'Add New Address'}</h2>
              <p>{editing ? `Update the address saved for ${editing.fullName}.` : 'Add a delivery address to your account.'}</p>
            </div>
            <MapArt />
          </div>

          <div className="am-form-body">
            <div className="am-section"><UserRound size={19} /> Contact Details</div>
            <div className="am-grid-2">
              <div className={`am-field${errors.fullName ? ' has-error' : ''}`}>
                <label htmlFor="am-fullName">Full Name <span>*</span></label>
                <input
                  {...aria('fullName')}
                  ref={nameRef}
                  value={form.fullName}
                  placeholder="e.g. Maideen"
                  autoComplete="name"
                  onChange={(e) => setField('fullName', e.target.value)}
                />
                {err('fullName')}
              </div>
              <div className={`am-field${errors.mobile ? ' has-error' : ''}`}>
                <label htmlFor="am-mobile">Mobile Number <span>*</span></label>
                <div className="am-phone-input">
                  <span className="am-prefix">+91</span>
                  <input
                    {...aria('mobile')}
                    value={form.mobile}
                    placeholder="10-digit mobile number"
                    inputMode="tel"
                    autoComplete="tel-national"
                    onChange={(e) => setField('mobile', digits(e.target.value, 10))}
                  />
                </div>
                {err('mobile')}
              </div>
            </div>

            <div className="am-section"><MapPin size={19} /> Address Details</div>
            <div className="am-grid-2">
              <div className={`am-field full${errors.addressLine1 ? ' has-error' : ''}`}>
                <label htmlFor="am-addressLine1">House / Building / Street <span>*</span></label>
                <input
                  {...aria('addressLine1')}
                  value={form.addressLine1}
                  placeholder="e.g. 12, Gandhi Street"
                  autoComplete="address-line1"
                  onChange={(e) => setField('addressLine1', e.target.value)}
                />
                {err('addressLine1')}
              </div>
              <div className="am-field">
                <label htmlFor="am-addressLine2">Area / Colony <em>(Optional)</em></label>
                <input
                  {...aria('addressLine2')}
                  value={form.addressLine2 || ''}
                  placeholder="e.g. Anna Nagar"
                  autoComplete="address-line2"
                  onChange={(e) => setField('addressLine2', e.target.value)}
                />
              </div>
              <div className="am-field">
                <label htmlFor="am-landmark">Landmark <em>(Optional)</em></label>
                <input
                  {...aria('landmark')}
                  value={form.landmark || ''}
                  placeholder="e.g. Near bus stand"
                  onChange={(e) => setField('landmark', e.target.value)}
                />
              </div>
              <div className={`am-field${errors.zipCode ? ' has-error' : ''}`}>
                <label htmlFor="am-zipCode">Pincode <span>*</span></label>
                <input
                  {...aria('zipCode')}
                  value={form.zipCode}
                  placeholder="6-digit pincode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  onChange={(e) => setField('zipCode', digits(e.target.value, 6))}
                />
                {err('zipCode')}
              </div>
              <div className={`am-field${errors.city ? ' has-error' : ''}`}>
                <label htmlFor="am-city">City <span>*</span></label>
                <div className="am-select">
                  <input
                    {...aria('city')}
                    list="am-city-list"
                    value={form.city}
                    placeholder="e.g. Virudhunagar"
                    autoComplete="address-level2"
                    onChange={(e) => setField('city', e.target.value)}
                  />
                  <ChevronDown size={18} aria-hidden="true" />
                </div>
                <datalist id="am-city-list">
                  {CITY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
                </datalist>
                {err('city')}
              </div>
              <div className={`am-field${errors.state ? ' has-error' : ''}`}>
                <label htmlFor="am-state">State <span>*</span></label>
                <div className="am-select">
                  <select {...aria('state')} value={form.state} autoComplete="address-level1" onChange={(e) => setField('state', e.target.value)}>
                    <option value="" disabled>Select state</option>
                    {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={18} aria-hidden="true" />
                </div>
                {err('state')}
              </div>
            </div>

            {formError && <p className="am-form-error" role="alert">{formError}</p>}

            <div className="am-form-foot">
              <button type="button" className="am-btn am-btn-ghost" onClick={resetForm} disabled={saving}>
                {editing ? 'Cancel' : 'Clear'}
              </button>
              <button type="submit" className="am-btn am-btn-primary am-btn-save" disabled={saving}>
                {saving ? <><Loader2 size={18} className="am-spin" /> Saving…</> : <><Save size={19} /> {editing ? 'Save Changes' : 'Save Address'}</>}
              </button>
            </div>
          </div>
        </form>
      </main>

      {deleting && (
        <div className="am-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !deleteBusy) setDeleting(null) }}>
          <div className="am-modal am-confirm" role="alertdialog" aria-modal="true" aria-labelledby="am-del-title" aria-describedby="am-del-desc">
            <span className="am-confirm-icon"><Trash2 size={24} /></span>
            <h2 id="am-del-title">Delete this address?</h2>
            <p id="am-del-desc">
              {deleting.fullName}, {deleting.city} – {deleting.zipCode} will be removed from your saved addresses.
              {deleting.isDefault && ' You’ll need to choose a new default at checkout.'}
            </p>
            <div className="am-confirm-actions">
              <button className="am-btn am-btn-ghost" onClick={() => setDeleting(null)} disabled={deleteBusy} autoFocus>Keep it</button>
              <button className="am-btn am-btn-danger" onClick={handleDelete} disabled={deleteBusy}>
                {deleteBusy ? <><Loader2 size={16} className="am-spin" /> Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

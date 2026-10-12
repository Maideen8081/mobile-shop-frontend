import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Briefcase, Check, Home, Loader2, Lock, MapPin, Pencil,
  Phone, Plus, RotateCcw, ShieldCheck, Trash2, Truck,
} from 'lucide-react'
import { addressService, type AddressData } from '../services/addressService'
import { cartService, type CartItem } from '../services/cartService'
import { useToast } from '../context/ToastContext'
import { authService } from '../services/authService'
import { useIsMobile } from '../components/mobile/helpers'
import { FREE_SHIPPING_THRESHOLD } from '../components/mobile/cartLogic'
import OrderSummary from '../components/checkout/OrderSummary'
import { apiErrorMessage, formatINR as fmt, readCheckoutCoupon } from '../utils/checkout'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import MobileCheckoutAddress from '../components/mobile/MobileCheckoutAddress'
import './CartPage.css'
import './CheckoutAddress.css'

type AddressType = AddressData['addressType']

const STEPS = ['Cart', 'Address', 'Payment']
const TYPE_ICONS: Record<AddressType, typeof Home> = { Home, Office: Briefcase, Other: MapPin }

const addressLines = (a: AddressData) => [
  [a.addressLine1, a.addressLine2].filter(Boolean).join(', '),
  a.landmark ? `Near ${a.landmark}` : '',
  `${a.city}, ${a.state} – ${a.zipCode}`,
].filter(Boolean)

/* ── Address form ─────────────────────────────────────────────────────── */

function Field({ label, value, onChange, error, type = 'text', maxLength, optional, autoComplete, wide }: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  type?: string
  maxLength?: number
  optional?: boolean
  autoComplete?: string
  wide?: boolean
}) {
  const id = `ca-${label.toLowerCase().replace(/\W+/g, '-')}`
  return (
    <div className={`ca-field${wide ? ' is-wide' : ''}${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}{optional && <span> (optional)</span>}</label>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p id={`${id}-err`} className="ca-field-err">{error}</p>}
    </div>
  )
}

function AddressForm({ initialAddress, onSaved, onCancel, canCancel }: {
  initialAddress?: AddressData | null
  onSaved: (addr: AddressData) => void
  onCancel: () => void
  canCancel: boolean
}) {
  const showToast = useToast().show
  const [form, setForm] = useState({
    fullName: initialAddress?.fullName || '', mobile: initialAddress?.mobile || '',
    addressLine1: initialAddress?.addressLine1 || '', addressLine2: initialAddress?.addressLine2 || '',
    landmark: initialAddress?.landmark || '', city: initialAddress?.city || '', state: initialAddress?.state || '',
    zipCode: initialAddress?.zipCode || '', country: initialAddress?.country || 'India',
    addressType: (initialAddress?.addressType || 'Home') as AddressType, isDefault: initialAddress?.isDefault || false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form, v: string | boolean) => {
    if (k === 'mobile') v = (v as string).replace(/\D/g, '').slice(0, 10)
    if (k === 'zipCode') v = (v as string).replace(/\D/g, '').slice(0, 6)
    setForm((p) => ({ ...p, [k]: v }))
    if (errors[k]) setErrors((p) => { const n = { ...p }; delete n[k]; return n })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    else if (form.fullName.trim().length < 3) e.fullName = 'Minimum 3 characters'
    if (!form.mobile) e.mobile = 'Phone number is required'
    else if (!/^\d{10}$/.test(form.mobile)) e.mobile = 'Must be exactly 10 digits'
    if (!form.addressLine1.trim()) e.addressLine1 = 'Address is required'
    else if (form.addressLine1.trim().length < 10) e.addressLine1 = 'Minimum 10 characters'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.state.trim()) e.state = 'State is required'
    if (!form.zipCode.trim()) e.zipCode = 'Pincode is required'
    else if (!/^\d{5,6}$/.test(form.zipCode)) e.zipCode = 'Must be 5-6 digits'
    return e
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      const saved = initialAddress?.id
        ? await addressService.update(initialAddress.id, { ...form })
        : await addressService.create({ ...form, country: 'India', isDefault: form.isDefault })
      onSaved(saved)
    } catch (err: any) {
      showToast(apiErrorMessage(err, 'Failed to save address'), 'error')
    }
    setSaving(false)
  }

  return (
    <form className="ca-form" onSubmit={handleSave} noValidate>
      <div className="ca-form-head">
        <h3>{initialAddress ? 'Edit address' : 'Add a new address'}</h3>
        {canCancel && <button type="button" className="cx-link-btn" onClick={onCancel}>Cancel</button>}
      </div>

      <div className="ca-form-grid">
        <Field label="Full name" value={form.fullName} onChange={(v) => set('fullName', v)} error={errors.fullName} autoComplete="name" />
        <Field label="Phone number" value={form.mobile} onChange={(v) => set('mobile', v)} error={errors.mobile} type="tel" maxLength={10} autoComplete="tel-national" />
        <Field label="House no., building, street" value={form.addressLine1} onChange={(v) => set('addressLine1', v)} error={errors.addressLine1} autoComplete="address-line1" wide />
        <Field label="Area, locality" value={form.addressLine2} onChange={(v) => set('addressLine2', v)} optional autoComplete="address-line2" />
        <Field label="Landmark" value={form.landmark} onChange={(v) => set('landmark', v)} optional />
        <Field label="City" value={form.city} onChange={(v) => set('city', v)} error={errors.city} autoComplete="address-level2" />
        <Field label="State" value={form.state} onChange={(v) => set('state', v)} error={errors.state} autoComplete="address-level1" />
        <Field label="Pincode" value={form.zipCode} onChange={(v) => set('zipCode', v)} error={errors.zipCode} type="tel" maxLength={6} autoComplete="postal-code" />
      </div>

      <fieldset className="ca-type">
        <legend>Address type</legend>
        <div>
          {(['Home', 'Office', 'Other'] as const).map((type) => {
            const Icon = TYPE_ICONS[type]
            return (
              <button
                key={type}
                type="button"
                className={form.addressType === type ? 'is-active' : ''}
                aria-pressed={form.addressType === type}
                onClick={() => set('addressType', type)}
              >
                <Icon size={15} /> {type}
              </button>
            )
          })}
        </div>
      </fieldset>

      <label className="ca-check">
        <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} />
        <span className="ca-check-box"><Check size={12} /></span>
        Make this my default address
      </label>

      <div className="ca-form-actions">
        {canCancel && <button type="button" className="cx-btn cx-btn-ghost" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="cx-btn cx-btn-primary" disabled={saving}>
          {saving ? <Loader2 size={16} className="ca-spin" /> : <Check size={16} />}
          {saving ? 'Saving…' : initialAddress?.id ? 'Update address' : 'Save & deliver here'}
        </button>
      </div>
    </form>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function CheckoutAddress() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileCheckoutAddress /> : <DesktopCheckoutAddress />
}

function DesktopCheckoutAddress() {
  const navigate = useNavigate()
  const showToast = useToast().show
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formMode, setFormMode] = useState<'closed' | 'new' | 'edit'>('closed')
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [items, setItems] = useState<CartItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [coupon] = useState(readCheckoutCoupon)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', '/checkout/address')
      navigate('/login', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    let mounted = true
    addressService.list()
      .then((data) => {
        if (!mounted) return
        const saved = data.filter((a) => a.id && a.id > 0)
        setAddresses(saved)
        const preferred = Number(localStorage.getItem('checkout_address_id') || 0)
        const pick = saved.find((a) => a.id === preferred) || saved.find((a) => a.isDefault) || saved[0]
        setSelectedId(pick?.id ?? null)
        if (saved.length === 0) setFormMode('new')
      })
      .catch(() => { if (mounted) setFormMode('new') })
      .finally(() => { if (mounted) setLoading(false) })

    cartService.getCart(true)
      .then(({ items }) => { if (mounted) setItems(items) })
      .catch(() => {})
      .finally(() => { if (mounted) setItemsLoading(false) })
    return () => { mounted = false }
  }, [])

  const selected = addresses.find((a) => a.id === selectedId) || null

  const openNew = () => { setEditingAddress(null); setFormMode('new') }
  const openEdit = (a: AddressData) => { setEditingAddress(a); setFormMode('edit') }
  const closeForm = () => { setEditingAddress(null); setFormMode('closed') }

  const handleSaved = (addr: AddressData) => {
    setAddresses((prev) => {
      const others = addr.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev
      return formMode === 'edit' ? others.map((a) => (a.id === addr.id ? addr : a)) : [...others, addr]
    })
    if (addr.id) setSelectedId(addr.id)
    showToast(formMode === 'edit' ? 'Address updated' : 'Address saved', 'success')
    closeForm()
  }

  const handleDelete = async (id: number) => {
    setDeleting(id)
    try {
      await addressService.delete(id)
      const remaining = addresses.filter((a) => a.id !== id)
      setAddresses(remaining)
      if (selectedId === id) setSelectedId(remaining[0]?.id ?? null)
      if (remaining.length === 0) setFormMode('new')
      showToast('Address deleted', 'success')
    } catch {
      showToast('Failed to delete address', 'error')
    }
    setDeleting(null)
    setConfirmDelete(null)
  }

  const handleContinue = () => {
    if (!selectedId) { showToast('Please select or add a delivery address', 'error'); return }
    localStorage.setItem('checkout_address_id', String(selectedId))
    navigate('/checkout/payment')
  }

  return (
    <div className="cx-root">
      <SiteTopNav />

      <main className="cx-wrap">
        <header className="cx-head">
          <div>
            <nav className="cx-crumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link><span>/</span><Link to="/cart">Cart</Link><span>/</span><span aria-current="page">Address</span>
            </nav>
            <h1>Delivery address</h1>
            <p className="cx-head-sub">Choose where you’d like your order delivered.</p>
          </div>
          <ol className="cx-steps" aria-label="Checkout progress">
            {STEPS.map((label, i) => (
              <li key={label} className={i === 1 ? 'is-active' : i === 0 ? 'is-done' : ''}>
                <span className="cx-step-num">{i === 0 ? <Check size={13} /> : i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        </header>

        <div className="cx-grid">
          <section className="cx-main">
            <div className="cx-card">
              <div className="cx-card-head">
                <h2>Saved addresses {!loading && <span>({addresses.length})</span>}</h2>
                {!loading && formMode === 'closed' && (
                  <button className="cx-link-btn" onClick={openNew}><Plus size={15} /> Add new address</button>
                )}
              </div>

              {loading ? (
                <div className="ca-list">
                  {[0, 1].map((n) => <div key={n} className="ca-skel" />)}
                </div>
              ) : (
                <>
                  {addresses.length > 0 && formMode !== 'edit' && (
                    <div className="ca-list" role="radiogroup" aria-label="Delivery address">
                      {addresses.map((a) => {
                        const isSelected = a.id === selectedId
                        const Icon = TYPE_ICONS[a.addressType] || MapPin
                        return (
                          <div
                            key={a.id}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={isSelected || (!selectedId && a === addresses[0]) ? 0 : -1}
                            className={`ca-addr${isSelected ? ' is-selected' : ''}`}
                            onClick={() => setSelectedId(a.id!)}
                            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setSelectedId(a.id!) } }}
                          >
                            <span className="ca-radio" aria-hidden="true" />
                            <div className="ca-addr-body">
                              <div className="ca-addr-top">
                                <strong>{a.fullName}</strong>
                                <span className="ca-chip"><Icon size={12} /> {a.addressType}</span>
                                {a.isDefault && <span className="ca-chip is-default">Default</span>}
                              </div>
                              {addressLines(a).map((line) => <p key={line}>{line}</p>)}
                              <p className="ca-phone"><Phone size={13} /> {a.mobile}</p>

                              {confirmDelete === a.id ? (
                                <div className="ca-confirm" onClick={(e) => e.stopPropagation()}>
                                  <span>Delete this address?</span>
                                  <button className="cx-link-btn" onClick={() => setConfirmDelete(null)}>Keep</button>
                                  <button className="ca-danger" onClick={() => handleDelete(a.id!)} disabled={deleting === a.id}>
                                    {deleting === a.id ? <Loader2 size={14} className="ca-spin" /> : <Trash2 size={14} />} Delete
                                  </button>
                                </div>
                              ) : (
                                <div className="ca-addr-actions" onClick={(e) => e.stopPropagation()}>
                                  <button className="cx-link-btn" onClick={() => openEdit(a)}><Pencil size={14} /> Edit</button>
                                  <button className="cx-link-btn is-danger" onClick={() => setConfirmDelete(a.id!)}><Trash2 size={14} /> Delete</button>
                                </div>
                              )}
                            </div>
                            {isSelected && <span className="ca-deliver-tag"><Check size={13} /> Delivering here</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {formMode !== 'closed' && (
                    <AddressForm
                      key={editingAddress?.id ?? 'new'}
                      initialAddress={editingAddress}
                      onSaved={handleSaved}
                      onCancel={closeForm}
                      canCancel={addresses.length > 0}
                    />
                  )}

                  {formMode === 'closed' && (
                    <button className="ca-add" onClick={openNew}>
                      <Plus size={16} /> Add a new address
                    </button>
                  )}
                </>
              )}
            </div>

            <Link to="/cart" className="cx-back"><ArrowLeft size={16} /> Back to cart</Link>
          </section>

          <aside className="cx-side">
            <OrderSummary items={items} coupon={coupon} loading={itemsLoading}>
              <div className="osum-deliver">
                <MapPin size={16} />
                {selected ? (
                  <div>
                    <span>Delivering to <strong>{selected.fullName}</strong></span>
                    <span>{selected.city}, {selected.zipCode} · 3–5 days</span>
                  </div>
                ) : (
                  <div><span>No address selected yet</span></div>
                )}
              </div>

              <button
                className="cx-btn cx-btn-primary cx-checkout"
                disabled={!selectedId || formMode === 'edit' || items.length === 0}
                onClick={handleContinue}
              >
                <Lock size={16} /> Continue to payment <ArrowRight size={16} />
              </button>
              {items.length === 0 && !itemsLoading && <p className="cx-warn">Your cart is empty.</p>}
            </OrderSummary>

            <ul className="cx-trust">
              <li><ShieldCheck size={18} /><div><strong>Secure checkout</strong><span>Your details are encrypted</span></div></li>
              <li><Truck size={18} /><div><strong>Fast delivery</strong><span>Free over {fmt(FREE_SHIPPING_THRESHOLD)}</span></div></li>
              <li><RotateCcw size={18} /><div><strong>7-day returns</strong><span>No-questions-asked</span></div></li>
            </ul>
          </aside>
        </div>
      </main>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Bookmark, Briefcase, Check, Headphones, Home, Loader2, MapPin, Pencil,
  Phone, Plus, RotateCcw, ShieldCheck, Trash2, Truck,
} from 'lucide-react'
import { addressService, type AddressData } from '../services/addressService'
import { cartService, type CartItem } from '../services/cartService'
import { useToast } from '../context/ToastContext'
import { authService } from '../services/authService'
import { useIsMobile } from '../components/mobile/helpers'
import { FREE_SHIPPING_THRESHOLD } from '../components/mobile/cartLogic'
import OrderSummary from '../components/checkout/OrderSummary'
import { formatINR as fmt, readCheckoutCoupon } from '../utils/checkout'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import MobileCheckoutAddress from '../components/mobile/MobileCheckoutAddress'
import AddressForm from './CheckoutAddressForm'
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

  const canContinue = Boolean(selectedId) && formMode !== 'edit' && items.length > 0

  return (
    <div className="cx-root ca-page">
      <SiteTopNav />

      <main className="cx-wrap ca-wrap">
        <ol className="ca-steps" aria-label="Checkout progress">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`is-step-${i + 1}${i === 1 ? ' is-active' : i === 0 ? ' is-done' : ''}`}
              aria-current={i === 1 ? 'step' : undefined}
            >
              {i === 0 ? (
                <Link to="/cart" className="ca-step">
                  <span className="ca-step-num"><Check size={18} strokeWidth={3} /></span>
                  <span className="ca-step-label">{label}</span>
                </Link>
              ) : (
                <span className="ca-step">
                  <span className="ca-step-num">{i + 1}</span>
                  <span className="ca-step-label">{label}</span>
                </span>
              )}
            </li>
          ))}
        </ol>

        <div className="cx-grid ca-grid">
          <section className="ca-main">
            <header className="ca-head">
              <span className="ca-head-icon"><MapPin size={26} /></span>
              <div>
                <h1>Delivery Address</h1>
                <p>Choose a delivery address or add a new one.</p>
              </div>
            </header>

            <div className={`ca-card${!loading && addresses.length === 0 ? ' is-bare' : ''}`}>
              {(loading || addresses.length > 0) && (
                <div className="ca-card-head">
                  <h2>
                    <span className="ca-card-icon"><Bookmark size={18} /></span>
                    Saved Addresses {!loading && <span>({addresses.length})</span>}
                  </h2>
                  {!loading && formMode === 'closed' && (
                    <button className="ca-add-btn" onClick={openNew}><Plus size={18} /> Add New Address</button>
                  )}
                </div>
              )}

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
                            <span className="ca-addr-icon" aria-hidden="true"><Icon size={28} strokeWidth={1.75} /></span>
                            <div className="ca-addr-body">
                              <div className="ca-addr-chips">
                                <span className="ca-chip"><Icon size={13} /> {a.addressType}</span>
                                {a.isDefault && <span className="ca-chip is-default">Default</span>}
                              </div>
                              <strong className="ca-addr-name">{a.fullName}</strong>
                              {addressLines(a).map((line) => <p key={line}>{line}</p>)}
                              <p className="ca-phone"><Phone size={16} /> {a.mobile}</p>
                            </div>

                            <div className="ca-addr-side" onClick={(e) => e.stopPropagation()}>
                              {isSelected && <span className="ca-deliver-tag"><Check size={15} strokeWidth={2.5} /> Deliver Here</span>}
                              {confirmDelete === a.id ? (
                                <div className="ca-confirm">
                                  <span>Delete this address?</span>
                                  <button className="ca-text-btn" onClick={() => setConfirmDelete(null)}>Keep</button>
                                  <button className="ca-danger" onClick={() => handleDelete(a.id!)} disabled={deleting === a.id}>
                                    {deleting === a.id ? <Loader2 size={14} className="ca-spin" /> : <Trash2 size={14} />} Delete
                                  </button>
                                </div>
                              ) : (
                                <div className="ca-addr-actions">
                                  <button className="ca-text-btn" onClick={() => openEdit(a)}><Pencil size={18} /> Edit</button>
                                  <span className="ca-divider" aria-hidden="true" />
                                  <button className="ca-text-btn" onClick={() => setConfirmDelete(a.id!)}><Trash2 size={18} /> Delete</button>
                                </div>
                              )}
                            </div>
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
                </>
              )}
            </div>

            <div className="ca-actions">
              <Link to="/cart" className="ca-back"><ArrowLeft size={20} /> Back to Cart</Link>
            </div>
          </section>

          <aside className="cx-side">
            <OrderSummary items={items} coupon={coupon} loading={itemsLoading}>
              {selected && formMode !== 'edit' ? (
                <p className="ca-deliver-note">
                  <MapPin size={16} />
                  <span>Delivering to <strong>{selected.fullName}</strong> · {selected.city} {selected.zipCode} · 3–5 days</span>
                </p>
              ) : null}
              <button className="ca-continue" disabled={!canContinue} onClick={handleContinue}>
                Continue to Payment <ArrowRight size={20} />
              </button>
              {!canContinue && !loading && !itemsLoading && (
                <p className="ca-warn">
                  {items.length === 0
                    ? 'Your cart is empty — add something before checking out.'
                    : formMode === 'edit'
                      ? 'Finish editing the address to continue.'
                      : 'Save or select a delivery address to continue.'}
                </p>
              )}
            </OrderSummary>
          </aside>
        </div>

        <ul className="ca-benefits">
          <li><span><ShieldCheck size={24} /></span><div><strong>Secure Checkout</strong><small>Your details are encrypted</small></div></li>
          <li><span><Truck size={24} /></span><div><strong>Free Delivery</strong><small>On orders over {fmt(FREE_SHIPPING_THRESHOLD)}</small></div></li>
          <li><span><RotateCcw size={24} /></span><div><strong>Easy 7-Day Returns</strong><small>Hassle-free returns</small></div></li>
          <li><span><Headphones size={24} /></span><div><strong>Expert Support</strong><small>Mon – Sat, 10 AM – 8 PM</small></div></li>
        </ul>
      </main>
    </div>
  )
}

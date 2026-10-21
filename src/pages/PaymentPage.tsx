import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Banknote, Building2, Check, CreditCard, Globe, Loader2, Lock, MapPin,
  Phone, RotateCcw, ShieldCheck, Smartphone, Truck,
} from 'lucide-react'
import { useToast } from '../context/ToastContext'
import MobilePayment from '../components/mobile/MobilePayment'
import { useIsMobile } from '../components/mobile/helpers'
import { orderService } from '../services/orderService'
import { authService } from '../services/authService'
import { cartService, type CartItem } from '../services/cartService'
import { addressService, type AddressData } from '../services/addressService'
import OrderSummary from '../components/checkout/OrderSummary'
import { apiErrorMessage, computeTotals, formatINR, readCheckoutCoupon, saveCheckoutCoupon } from '../utils/checkout'
import ExitIntentOffer from '../components/checkout/ExitIntentOffer'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import './CartPage.css'
import './CheckoutAddress.css'
import './PaymentPage.css'

type PaymentMethod = 'cod' | 'card' | 'upi' | 'netbanking' | 'paypal'

const STEPS = ['Cart', 'Address', 'Payment']

const METHODS: { id: PaymentMethod; label: string; detail: string; icon: typeof Banknote; available: boolean }[] = [
  { id: 'cod', label: 'Cash on Delivery', detail: 'Pay in cash or UPI when your order arrives', icon: Banknote, available: true },
  { id: 'upi', label: 'UPI', detail: 'GPay, PhonePe, Paytm', icon: Smartphone, available: false },
  { id: 'card', label: 'Credit / Debit card', detail: 'Visa, Mastercard, RuPay', icon: CreditCard, available: false },
  { id: 'netbanking', label: 'Net banking', detail: 'All major Indian banks', icon: Building2, available: false },
  { id: 'paypal', label: 'PayPal', detail: 'International payments', icon: Globe, available: false },
]

export default function PaymentPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobilePayment /> : <DesktopPayment />
}

function DesktopPayment() {
  const navigate = useNavigate()
  const showToast = useToast().show
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [address, setAddress] = useState<AddressData | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('cod')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [coupon, setCoupon] = useState(readCheckoutCoupon)
  const [addressId] = useState(() => Number(localStorage.getItem('checkout_address_id') || 0) || null)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', '/checkout/payment')
      navigate('/login', { replace: true })
      return
    }
    if (!addressId) {
      navigate('/checkout/address', { replace: true })
      return
    }
    let mounted = true
    Promise.all([
      cartService.getCart(true).then(({ items }) => items).catch(() => [] as CartItem[]),
      addressService.list().catch(() => [] as AddressData[]),
    ]).then(([cartItems, addresses]) => {
      if (!mounted) return
      setItems(cartItems)
      const match = addresses.find((a) => a.id === addressId) || null
      setAddress(match)
      if (!match) {
        localStorage.removeItem('checkout_address_id')
        showToast('Please choose a delivery address', 'error')
        navigate('/checkout/address', { replace: true })
      }
    }).finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [addressId, navigate, showToast])

  const totals = computeTotals(items, coupon?.discount || 0)

  const handlePlaceOrder = async () => {
    if (placing || !address || items.length === 0) return
    setPlacing(true)
    setError('')
    try {
      const order = await orderService.create({
        items: items.map((it) => ({
          product_id: it.productId,
          variant_id: it.variantId || null,
          name: it.name || '',
          brand: it.brand || '',
          price: it.price || 0,
          quantity: it.quantity || 1,
          emoji: it.emoji || '',
          image: it.image || '',
          storage: it.storage || '',
          ram: it.ram || '',
          color: it.color || '',
          category: '',
        })),
        total: totals.total,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        tax: totals.tax,
        payment_method: method,
        delivery_address_id: address.id ?? null,
        discount: totals.discount,
        coupon_code: coupon?.code || undefined,
      })

      // The server prices the order; show its numbers on the success page.
      const lastOrder = {
        orderId: order.id,
        items,
        total: Number(order.grand_total) || totals.total,
        subtotal: Number(order.subtotal) || totals.subtotal,
        shipping: Number(order.shipping_charge ?? totals.shipping),
        tax: Number(order.tax) || totals.tax,
        discount: Number(order.discount ?? totals.discount),
        couponCode: coupon?.code || '',
        paymentMethod: 'Cash on Delivery',
        deliveryDate: order.est_delivery || '',
        orderDate: order.created_at || new Date().toISOString(),
        status: order.delivery_status || 'order_placed',
      }
      localStorage.setItem('last_order', JSON.stringify(lastOrder))
      try {
        const history = JSON.parse(localStorage.getItem('order_history') || '[]')
        localStorage.setItem('order_history', JSON.stringify([lastOrder, ...history].slice(0, 50)))
      } catch { /* history is a convenience only */ }

      await cartService.clearCart()
      localStorage.removeItem('checkout_coupon')
      localStorage.removeItem('checkout_address_id')
      localStorage.removeItem('checkout_delivery_tip')
      showToast('Order placed successfully!', 'success')
      navigate(`/checkout/success?order_id=${order.id}`, { replace: true })
    } catch (err: any) {
      const message = apiErrorMessage(err, 'We couldn’t place your order. Please try again.')
      if (err?.response?.status === 404 && /address/i.test(message)) {
        localStorage.removeItem('checkout_address_id')
        showToast('That address is no longer available — please choose another.', 'error')
        navigate('/checkout/address')
        return
      }
      setError(message)
      showToast(message, 'error')
      setPlacing(false)
    }
  }

  return (
    <div className="cx-root">
      <SiteTopNav />

      <main className="cx-wrap">
        <header className="cx-head">
          <div>
            <nav className="cx-crumbs" aria-label="Breadcrumb">
              <Link to="/home">Home</Link><span>/</span><Link to="/cart">Cart</Link><span>/</span>
              <Link to="/checkout/address">Address</Link><span>/</span><span aria-current="page">Payment</span>
            </nav>
            <h1>Payment</h1>
            <p className="cx-head-sub">Review your order and choose how you’d like to pay.</p>
          </div>
          <ol className="cx-steps" aria-label="Checkout progress">
            {STEPS.map((label, i) => (
              <li key={label} className={i === 2 ? 'is-active' : 'is-done'}>
                <span className="cx-step-num">{i === 2 ? 3 : <Check size={13} />}</span>
                {label}
              </li>
            ))}
          </ol>
        </header>

        <div className="cx-grid">
          <section className="cx-main">
            <div className="cx-card">
              <div className="cx-card-head">
                <h2>Delivery address</h2>
                <Link to="/checkout/address" className="cx-link-btn">Change</Link>
              </div>
              {loading || !address ? (
                <div className="ca-list"><div className="ca-skel pp-skel" /></div>
              ) : (
                <div className="pp-address">
                  <span className="pp-address-icon"><MapPin size={18} /></span>
                  <div>
                    <div className="ca-addr-top">
                      <strong>{address.fullName}</strong>
                      <span className="ca-chip">{address.addressType}</span>
                    </div>
                    <p>{[address.addressLine1, address.addressLine2].filter(Boolean).join(', ')}</p>
                    <p>{address.city}, {address.state} – {address.zipCode}</p>
                    <p className="ca-phone"><Phone size={13} /> {address.mobile}</p>
                  </div>
                  <span className="pp-eta"><Truck size={15} /> Delivery in 3–5 days</span>
                </div>
              )}
            </div>

            <div className="cx-card">
              <div className="cx-card-head">
                <h2>Payment method</h2>
                <span className="pp-secure"><Lock size={13} /> Secure checkout</span>
              </div>
              <div className="pp-methods" role="radiogroup" aria-label="Payment method">
                {METHODS.map((m) => {
                  const Icon = m.icon
                  const selected = method === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={!m.available}
                      className={`pp-method${selected ? ' is-selected' : ''}`}
                      onClick={() => setMethod(m.id)}
                    >
                      <span className="ca-radio" aria-hidden="true" />
                      <span className="pp-method-icon"><Icon size={20} /></span>
                      <span className="pp-method-text">
                        <strong>{m.label}</strong>
                        <span>{m.detail}</span>
                      </span>
                      {!m.available && <span className="pp-soon">Coming soon</span>}
                    </button>
                  )
                })}
              </div>
              {method === 'cod' && (
                <p className="pp-note">
                  Keep <strong>{formatINR(totals.total)}</strong> ready — you can pay the delivery partner in cash or by UPI.
                </p>
              )}
            </div>

            <Link to="/checkout/address" className="cx-back"><ArrowLeft size={16} /> Back to address</Link>
          </section>

          <aside className="cx-side">
            <OrderSummary items={items} coupon={coupon} loading={loading}>
              {error && <p className="pp-error" role="alert">{error}</p>}
              <button
                className="cx-btn cx-btn-primary cx-checkout"
                disabled={loading || placing || !address || items.length === 0}
                onClick={handlePlaceOrder}
              >
                {placing
                  ? <><Loader2 size={16} className="ca-spin" /> Placing order…</>
                  : <><Lock size={16} /> Place order · {formatINR(totals.total)}</>}
              </button>
              {!loading && items.length === 0 && <p className="cx-warn">Your cart is empty.</p>}
              <p className="pp-terms">By placing this order you agree to our <Link to="/terms">terms</Link>.</p>
            </OrderSummary>

            <ul className="cx-trust">
              <li><ShieldCheck size={18} /><div><strong>Secure checkout</strong><span>Your details are encrypted</span></div></li>
              <li><RotateCcw size={18} /><div><strong>7-day returns</strong><span>No-questions-asked</span></div></li>
            </ul>
          </aside>
        </div>
      </main>

      <ExitIntentOffer
        productIds={items.map((it) => it.productId)}
        subtotal={totals.subtotal}
        cartItems={items}
        enabled={!loading && !placing && !!address && items.length > 0}
        appliedCoupon={coupon}
        onApplyCoupon={(c) => {
          saveCheckoutCoupon(c)
          setCoupon(c)
          showToast(`${c.code} applied — you save ${formatINR(c.discount)}`, 'success')
        }}
      />
    </div>
  )
}

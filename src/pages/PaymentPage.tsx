import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, AtSign, Banknote, Check, CreditCard, Headphones, Landmark, Loader2, Lock,
  MapPin, RotateCcw, ShieldCheck, Smartphone, Truck, Wallet, Zap,
} from 'lucide-react'
import { FREE_SHIPPING_THRESHOLD } from '../components/mobile/cartLogic'
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

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod'

const STEPS = ['Cart', 'Address', 'Payment']

// Only Cash on Delivery is live; the others show their UI but can't be paid with yet.
const METHODS: { id: PaymentMethod; label: string; detail: string; icon: typeof Banknote; available: boolean }[] = [
  { id: 'upi', label: 'UPI', detail: 'Pay instantly via UPI', icon: Smartphone, available: false },
  { id: 'card', label: 'Credit / Debit Card', detail: 'Visa, Mastercard, RuPay', icon: CreditCard, available: false },
  { id: 'netbanking', label: 'Net Banking', detail: 'All major banks', icon: Landmark, available: false },
  { id: 'wallet', label: 'Wallets', detail: 'Paytm, PhonePe & more', icon: Wallet, available: false },
  { id: 'cod', label: 'Cash on Delivery', detail: 'Pay when you receive', icon: Banknote, available: true },
]

const UPI_APPS = ['PhonePe', 'Google Pay', 'Paytm', 'BHIM UPI', 'Amazon Pay']
const BANKS = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Other Banks']
const WALLETS = ['Paytm', 'PhonePe', 'Amazon Pay', 'MobiKwik']

const initials = (name: string) => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

function SoonNote() {
  return (
    <p className="pp-soon-note">
      <Zap size={16} /> Online payments are launching soon. For now, please use <strong>Cash on Delivery</strong>.
    </p>
  )
}

function OptionGrid({ options }: { options: string[] }) {
  return (
    <div className="pp-options">
      {options.map((name) => (
        <button key={name} type="button" className="pp-option" disabled>
          <span className="pp-option-mark">{initials(name)}</span>
          <span>{name}</span>
        </button>
      ))}
    </div>
  )
}

function Perks({ items }: { items: string[] }) {
  return (
    <div className="pp-perks">
      <Zap size={18} />
      {items.map((p, i) => <span key={p}>{i > 0 && <i aria-hidden="true">•</i>}{p}</span>)}
    </div>
  )
}

function MethodPanel({ method, total }: { method: PaymentMethod; total: number }) {
  switch (method) {
    case 'upi':
      return (
        <>
          <h2>Pay via UPI</h2>
          <p className="pp-panel-sub">Complete your payment instantly using any UPI app.</p>
          <SoonNote />
          <OptionGrid options={UPI_APPS} />
          <div className="pp-or"><span>OR</span></div>
          <label className="pp-label" htmlFor="pp-upi">Enter UPI ID</label>
          <div className="ca-input pp-input-row">
            <AtSign size={18} className="ca-input-icon" />
            <input id="pp-upi" placeholder="yourname@upi" disabled />
            <button type="button" className="pp-verify" disabled>Verify</button>
          </div>
          <Perks items={['Instant Payment', 'No Extra Charges', '100% Secure']} />
        </>
      )
    case 'card':
      return (
        <>
          <h2>Pay with Card</h2>
          <p className="pp-panel-sub">We accept Visa, Mastercard and RuPay cards.</p>
          <SoonNote />
          <div className="pp-form">
            <div className="ca-field is-wide">
              <label htmlFor="pp-card">Card number</label>
              <div className="ca-input"><CreditCard size={18} className="ca-input-icon" /><input id="pp-card" placeholder="1234 5678 9012 3456" disabled /></div>
            </div>
            <div className="ca-field is-wide">
              <label htmlFor="pp-name">Name on card</label>
              <div className="ca-input"><input id="pp-name" placeholder="As printed on the card" disabled /></div>
            </div>
            <div className="ca-field">
              <label htmlFor="pp-exp">Expiry</label>
              <div className="ca-input"><input id="pp-exp" placeholder="MM / YY" disabled /></div>
            </div>
            <div className="ca-field">
              <label htmlFor="pp-cvv">CVV</label>
              <div className="ca-input"><Lock size={16} className="ca-input-icon" /><input id="pp-cvv" placeholder="•••" disabled /></div>
            </div>
          </div>
          <Perks items={['No-cost EMI', 'Card details never stored', '100% Secure']} />
        </>
      )
    case 'netbanking':
      return (
        <>
          <h2>Net Banking</h2>
          <p className="pp-panel-sub">Choose your bank and you’ll be taken to its secure login page.</p>
          <SoonNote />
          <OptionGrid options={BANKS} />
          <Perks items={['All major banks', 'No Extra Charges', '100% Secure']} />
        </>
      )
    case 'wallet':
      return (
        <>
          <h2>Pay with Wallet</h2>
          <p className="pp-panel-sub">Use your wallet balance for a one-tap checkout.</p>
          <SoonNote />
          <OptionGrid options={WALLETS} />
          <Perks items={['One-tap Payment', 'No Extra Charges', '100% Secure']} />
        </>
      )
    default:
      return (
        <>
          <h2>Cash on Delivery</h2>
          <p className="pp-panel-sub">Pay the delivery partner when your order arrives.</p>
          <div className="pp-cod">
            <span className="pp-cod-icon"><Banknote size={30} strokeWidth={1.75} /></span>
            <div>
              <span>Amount to pay at delivery</span>
              <strong>{formatINR(total)}</strong>
            </div>
          </div>
          <ul className="pp-cod-list">
            <li><Check size={16} strokeWidth={3} /> Pay in cash or scan a UPI QR at your doorstep</li>
            <li><Check size={16} strokeWidth={3} /> No extra charges for Cash on Delivery</li>
            <li><Check size={16} strokeWidth={3} /> Keep the exact amount ready for a faster handover</li>
          </ul>
          <Perks items={['Pay on Delivery', 'No Extra Charges', '100% Secure']} />
        </>
      )
  }
}

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
    if (placing || method !== 'cod' || !address || items.length === 0) return
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

  const isCod = method === 'cod'
  const canPay = isCod && !loading && !placing && !!address && items.length > 0

  return (
    <div className="cx-root ca-page pp-page">
      <SiteTopNav />

      <main className="cx-wrap ca-wrap">
        <ol className="ca-steps" aria-label="Checkout progress">
          {STEPS.map((label, i) => (
            <li key={label}               className={`is-step-${i + 1} ${i === 2 ? 'is-active' : 'is-done'}`} aria-current={i === 2 ? 'step' : undefined}>
              {i < 2 ? (
                <Link to={i === 0 ? '/cart' : '/checkout/address'} className="ca-step">
                  <span className="ca-step-num"><Check size={18} strokeWidth={3} /></span>
                  <span className="ca-step-label">{label}</span>
                </Link>
              ) : (
                <span className="ca-step">
                  <span className="ca-step-num">3</span>
                  <span className="ca-step-label">{label}</span>
                </span>
              )}
            </li>
          ))}
        </ol>

        <div className="cx-grid ca-grid">
          <section className="ca-main">
            <header className="ca-head pp-head">
              <span className="ca-head-icon"><CreditCard size={26} /></span>
              <div>
                <h1>Complete Your Payment</h1>
                <p>Choose your preferred payment method to place the order.</p>
              </div>
              <span className="pp-secure-pill"><ShieldCheck size={18} /> Secure &amp; Encrypted Payment</span>
            </header>

            <div className="ca-card pp-card">
              <div className="pp-tabs" role="radiogroup" aria-label="Payment method">
                {METHODS.map((m) => {
                  const Icon = m.icon
                  const selected = method === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`pp-tab${selected ? ' is-selected' : ''}`}
                      onClick={() => setMethod(m.id)}
                    >
                      <span className="pp-tab-icon"><Icon size={24} strokeWidth={1.75} /></span>
                      <span className="pp-tab-text">
                        <strong>{m.label}</strong>
                        <span>{m.detail}</span>
                      </span>
                      {!m.available && <span className="pp-soon">Soon</span>}
                    </button>
                  )
                })}
              </div>

              <div className="pp-panel">
                <MethodPanel method={method} total={totals.total} />
              </div>
            </div>

            <div className="ca-actions">
              <Link to="/checkout/address" className="ca-back"><ArrowLeft size={20} /> Back to Address</Link>
            </div>
          </section>

          <aside className="cx-side">
            <OrderSummary items={items} coupon={coupon} loading={loading}>
              {address && (
                <p className="ca-deliver-note">
                  <MapPin size={16} />
                  <span>
                    Delivering to <strong>{address.fullName}</strong> · {address.city} {address.zipCode} · 3–5 days{' '}
                    <Link to="/checkout/address" className="pp-change">Change</Link>
                  </span>
                </p>
              )}
              {error && <p className="pp-error" role="alert">{error}</p>}
              <button className="ca-continue pp-pay" data-place-order disabled={!canPay} onClick={handlePlaceOrder}>
                {placing
                  ? <><Loader2 size={20} className="ca-spin" /> Placing order…</>
                  : <><Lock size={20} /> {isCod ? `Place Order · Pay ${formatINR(totals.total)} on delivery` : `Pay ${formatINR(totals.total)}`} <ArrowRight size={20} /></>}
              </button>
              {!isCod && !loading && (
                <p className="ca-warn">Online payments are coming soon. Choose Cash on Delivery to place your order.</p>
              )}
              {!loading && items.length === 0 && <p className="ca-warn">Your cart is empty.</p>}
              <p className="pp-terms">By placing this order you agree to our <Link to="/terms">Terms</Link> and <Link to="/refund-policy">Refund Policy</Link>.</p>
            </OrderSummary>
          </aside>
        </div>

        <ul className="ca-benefits">
          <li><span><ShieldCheck size={24} /></span><div><strong>Secure Checkout</strong><small>Your details are encrypted</small></div></li>
          <li><span><Truck size={24} /></span><div><strong>Free Delivery</strong><small>On orders over {formatINR(FREE_SHIPPING_THRESHOLD)}</small></div></li>
          <li><span><RotateCcw size={24} /></span><div><strong>Easy 7-Day Returns</strong><small>Hassle-free returns</small></div></li>
          <li><span><Headphones size={24} /></span><div><strong>Need Help?</strong><small>Mon – Sat, 10 AM – 8 PM</small></div></li>
        </ul>
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

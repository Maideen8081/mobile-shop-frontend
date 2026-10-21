import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Banknote, Calendar, Check, CircleCheck, Home, LifeBuoy, MessageCircle, Package, PackageCheck,
  Receipt, ShoppingBag, Truck,
} from 'lucide-react'
import EcommerceFooter from '../components/ecommerce/Footer'
import MobileOrderSuccess from '../components/mobile/MobileOrderSuccess'
import { useIsMobile } from '../components/mobile/helpers'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import './OrderSuccess.css'

interface OrderItem {
  productId: number
  name: string
  price: number
  quantity: number
  emoji?: string
  image?: string
  storage?: string
  ram?: string
  color?: string
}

interface LastOrder {
  orderId?: number | string
  items?: OrderItem[]
  total?: number
  subtotal?: number
  shipping?: number
  tax?: number
  discount?: number
  couponCode?: string
  paymentMethod?: string
  deliveryDate?: string
  orderDate?: string
  status?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const STEPS = [
  { key: 'order_placed', label: 'Order placed', icon: Receipt },
  { key: 'accepted', label: 'Accepted by store', icon: CircleCheck },
  { key: 'processing', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck },
] as const

const STATUS_INDEX: Record<string, number> = {
  order_placed: 0, accepted: 1, processing: 2, shipped: 3, out_for_delivery: 3, delivered: 4,
}

function resolveImage(item: OrderItem): string {
  const img = item.image || ''
  if (!img || /^\p{Extended_Pictographic}/u.test(img)) return ''
  if (img.startsWith('http') || img.startsWith('data:')) return img
  return `${API_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`
}

const formatPrice = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

function formatDate(value: string | undefined, opts: Intl.DateTimeFormatOptions): string {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', opts)
}

function readLastOrder(): LastOrder | null {
  try {
    const saved = localStorage.getItem('last_order')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export default function OrderSuccess() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileOrderSuccess /> : <DesktopOrderSuccess />
}

function DesktopOrderSuccess() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [order] = useState<LastOrder | null>(readLastOrder)
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})

  const orderId = params.get('order_id') || (order?.orderId != null ? String(order.orderId) : '')
  const items = order?.items || []
  const subtotal = order?.subtotal ?? items.reduce((s, i) => s + i.price * i.quantity, 0)
  const shipping = order?.shipping ?? 0
  const tax = order?.tax ?? 0
  const discount = order?.discount ?? 0
  const total = order?.total ?? subtotal + shipping + tax - discount
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  const isCod = !order?.paymentMethod || /cod|cash/i.test(order.paymentMethod)
  const stepIndex = STATUS_INDEX[order?.status || 'order_placed'] ?? 0

  const placedOn = formatDate(order?.orderDate, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  const [fallbackDelivery] = useState(() => new Date(Date.now() + 5 * 86400000).toISOString())
  const deliveryBy = formatDate(order?.deliveryDate || fallbackDelivery, { weekday: 'short', day: 'numeric', month: 'short' })

  const trackUrl = orderId ? `/orders?order_id=${orderId}` : '/orders'

  return (
    <div className="osx">
      <SiteTopNav />

      <main className="osx-main">
        <section className="osx-hero" aria-labelledby="osx-title">
          <span className="osx-check" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <div className="osx-hero-text">
            <h1 id="osx-title">Order placed successfully!</h1>
            <p>
              Thanks for shopping with us. We’ve received your order and will update you in My Orders as it moves along.
            </p>
            <div className="osx-hero-meta">
              {orderId && <span className="osx-chip"><Receipt size={14} /> Order #{orderId}</span>}
              <span className="osx-chip"><Truck size={14} /> Arrives by {deliveryBy}</span>
              {placedOn && <span className="osx-chip"><Calendar size={14} /> {placedOn}</span>}
            </div>
          </div>
          <div className="osx-hero-actions">
            <button className="osx-btn osx-btn-light" onClick={() => navigate(trackUrl)}>
              <Truck size={17} /> Track order
            </button>
            <button className="osx-btn osx-btn-outline-light" onClick={() => navigate('/collection/all')}>
              <ShoppingBag size={17} /> Continue shopping
            </button>
          </div>
        </section>

        <div className="osx-grid">
          <div>
            <section className="osx-card" aria-labelledby="osx-status">
              <div className="osx-card-head">
                <h2 id="osx-status">Order status</h2>
                <span>Estimated delivery: <strong style={{ color: 'var(--osx-ink)' }}>{deliveryBy}</strong></span>
              </div>
              <div className="osx-card-body">
                <ol className="osx-timeline">
                  {STEPS.map((step, i) => {
                    const done = i <= stepIndex
                    const current = i === stepIndex + 1
                    const Icon = step.icon
                    return (
                      <li key={step.key} className={`osx-step${done ? ' is-done' : ''}${current ? ' is-current' : ''}`}>
                        <span className="osx-dot">{done ? <Check size={16} strokeWidth={3} /> : <Icon size={15} />}</span>
                        <div className="osx-step-text">
                          <strong>{step.label}</strong>
                          <span>
                            {i === 0 && placedOn ? placedOn
                              : done ? 'Completed'
                              : current ? 'Up next'
                              : step.key === 'delivered' ? `Expected ${deliveryBy}` : 'Pending'}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </section>

            <section className="osx-card" aria-labelledby="osx-items">
              <div className="osx-card-head">
                <h2 id="osx-items">Items in this order</h2>
                <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
              </div>
              {items.length === 0 ? (
                <p className="osx-empty">
                  Item details aren’t available on this device. You can see them in <Link to={trackUrl}>My Orders</Link>.
                </p>
              ) : (
                <ul className="osx-items">
                  {items.map((item, idx) => {
                    const key = `${item.productId}-${idx}`
                    const img = resolveImage(item)
                    return (
                      <li key={key} className="osx-item">
                        <Link to={`/product/${item.productId}`} className="osx-thumb" aria-label={`View ${item.name}`}>
                          {img && !imgErrors[key]
                            ? <img src={img} alt="" onError={() => setImgErrors((p) => ({ ...p, [key]: true }))} />
                            : <span aria-hidden="true">{item.emoji || '📦'}</span>}
                        </Link>
                        <div className="osx-item-info">
                          <strong>{item.name}</strong>
                          <div className="osx-item-meta">
                            <span className="osx-tag">Qty {item.quantity}</span>
                            {[item.storage, item.ram, item.color].filter(Boolean).map((v) => (
                              <span key={v} className="osx-tag">{v}</span>
                            ))}
                          </div>
                        </div>
                        <span className="osx-item-price">{formatPrice(item.price * item.quantity)}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>

          <aside>
            <section className="osx-card" aria-labelledby="osx-summary">
              <div className="osx-card-head"><h2 id="osx-summary">Price details</h2></div>
              <div className="osx-card-body">
                <dl className="osx-rows">
                  <div className="osx-row"><dt>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</dt><dd>{formatPrice(subtotal)}</dd></div>
                  <div className={`osx-row${shipping === 0 ? ' is-green' : ''}`}><dt>Delivery</dt><dd>{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd></div>
                  <div className="osx-row"><dt>GST (18%)</dt><dd>{formatPrice(tax)}</dd></div>
                  {discount > 0 && (
                    <div className="osx-row is-green">
                      <dt>Discount{order?.couponCode ? ` (${order.couponCode})` : ''}</dt>
                      <dd>−{formatPrice(discount)}</dd>
                    </div>
                  )}
                </dl>
                <div className="osx-total">
                  <span>{isCod ? 'Amount to pay' : 'Total paid'}</span>
                  <strong>{formatPrice(total)}</strong>
                </div>
              </div>
            </section>

            <section className="osx-card">
              <div className="osx-card-body">
                <div className="osx-info">
                  <span className="osx-info-icon"><Banknote size={18} /></span>
                  <div>
                    <strong>{isCod ? 'Cash on Delivery' : order?.paymentMethod}</strong>
                    <p>
                      {isCod
                        ? <>Keep {formatPrice(total)} ready — pay in cash or by UPI when your order arrives.</>
                        : 'Your payment was received.'}
                    </p>
                  </div>
                </div>
                <div className="osx-info">
                  <span className="osx-info-icon is-green"><Truck size={18} /></span>
                  <div>
                    <strong>Delivery by {deliveryBy}</strong>
                    <p>Free 7-day returns on eligible items after delivery.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="osx-card">
              <div className="osx-card-body">
                <div className="osx-info" style={{ marginBottom: 14 }}>
                  <span className="osx-info-icon"><LifeBuoy size={18} /></span>
                  <div>
                    <strong>Need help with this order?</strong>
                    <p>Our team can help with changes, delivery or returns.</p>
                  </div>
                </div>
                <div className="osx-help">
                  <button className="osx-btn osx-btn-ghost" onClick={() => navigate('/support')}>
                    <MessageCircle size={15} /> Chat with us
                  </button>
                  <button className="osx-btn osx-btn-ghost" onClick={() => navigate('/home')}>
                    <Home size={15} /> Home
                  </button>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <EcommerceFooter compact />
    </div>
  )
}

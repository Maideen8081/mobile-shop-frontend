import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Box, CalendarDays, Check, ClipboardList, Copy, Download, Headphones, Home,
  MapPin, MessageSquareText, PackageCheck, PackageOpen, PartyPopper, Pencil, Share2, ShoppingBag, Store,
  Truck, X, XCircle,
} from 'lucide-react'
import { TAX_RATE } from '../components/mobile/cartLogic'
import './OrderTrackingDetail.css'

export interface TrackOrderItem {
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

export interface TrackOrder {
  orderId: string
  displayOrderId: string
  items: TrackOrderItem[]
  total: number
  subtotal: number
  shipping: number
  tax: number
  discount: number
  couponCode: string
  deliveryDate: string
  orderDate: string
  status: string
  paymentMethod?: string
  deliveryPartner?: string
  trackingId?: string
  address?: string
  deliveredAt?: string | null
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export function itemImage(item: TrackOrderItem): string {
  const raw = item.image || ''
  if (!raw || /^\p{Extended_Pictographic}/u.test(raw)) return ''
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  return `${API_BASE_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`
}

const inr = (n: number) => '₹' + Math.round(n || 0).toLocaleString('en-IN')

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}
const dayLabel = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
const stampLabel = (d: Date) =>
  `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery', upi: 'UPI', card: 'Card', netbanking: 'Net Banking', wallet: 'Wallet', razorpay: 'Online Payment',
}

// Five customer-facing steps; "out for delivery" is shown as part of Shipped.
const STEPS = [
  { label: 'Order Placed', icon: ShoppingBag },
  { label: 'Accepted by Store', icon: Store },
  { label: 'Packed', icon: Box },
  { label: 'Shipped', icon: Truck },
  { label: 'Delivered', icon: Home },
]
const STEP_OF: Record<string, number> = {
  order_placed: 0, accepted: 1, processing: 2, shipped: 3, out_for_delivery: 3, delivered: 4,
}
const MESSAGES = [
  { title: 'Order placed successfully', text: 'We’ve received your order and will confirm it shortly.', icon: ShoppingBag },
  { title: 'Order accepted by the store', text: 'Our team has confirmed your order and is getting it ready.', icon: Store },
  { title: 'Your order is being packed', text: 'We’re carefully packing your items and preparing them for shipment.', icon: PackageOpen },
  { title: 'Your order is on the way', text: 'Your package is with our delivery partner and heading to you.', icon: Truck },
  { title: 'Delivered — enjoy your purchase!', text: 'Your order has been delivered. We hope you love it.', icon: PartyPopper },
]

function buildInvoice(order: TrackOrder, id: string, payment: string): string {
  const rows = order.items.map((i) =>
    `<tr><td>${i.name}${[i.color, i.storage].filter(Boolean).length ? `<br><small>${[i.color, i.storage].filter(Boolean).join(' · ')}</small>` : ''}</td><td>${i.quantity}</td><td>${inr(i.price)}</td><td>${inr(i.price * i.quantity)}</td></tr>`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${id}</title>
<style>body{font-family:Poppins,system-ui,sans-serif;color:#210d35;padding:40px;max-width:760px;margin:auto}
h1{margin:0}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{text-align:left;padding:10px;border-bottom:1px solid #eee}
th{background:#f4ecff}small{color:#777}.tot td{border:0;padding:4px 10px}.grand td{font-weight:800;font-size:18px}
.head{display:flex;justify-content:space-between;align-items:flex-start}</style></head><body>
<div class="head"><div><h1>PhoneFix.</h1><p>Premium Mobile Store</p></div><div><strong>Invoice</strong><br>Order ${id}<br>${order.orderDate}</div></div>
${order.address ? `<p><strong>Deliver to:</strong> ${order.address}</p>` : ''}<p><strong>Payment:</strong> ${payment}</p>
<table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
<table class="tot"><tr><td>Subtotal</td><td align="right">${inr(order.subtotal)}</td></tr>
${order.discount ? `<tr><td>Discount${order.couponCode ? ` (${order.couponCode})` : ''}</td><td align="right">– ${inr(order.discount)}</td></tr>` : ''}
<tr><td>Delivery</td><td align="right">${order.shipping ? inr(order.shipping) : 'Free'}</td></tr>
<tr><td>GST (${Math.round(TAX_RATE * 100)}%)</td><td align="right">${inr(order.tax)}</td></tr>
<tr class="grand"><td>Total</td><td align="right">${inr(order.total)}</td></tr></table>
<script>window.onload=()=>window.print()</script></body></html>`
}

export default function OrderTrackingDetail({ order }: { order: TrackOrder }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState('')
  const [now] = useState(() => Date.now())
  const [showDetails, setShowDetails] = useState(false)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})

  const id = order.displayOrderId || order.orderId
  const cancelled = order.status === 'cancelled'
  const step = STEP_OF[order.status] ?? 0
  const delivered = order.status === 'delivered'
  const placedAt = parseDate(order.orderDate)
  const eta = parseDate(order.deliveredAt) || parseDate(order.deliveryDate)
  const daysLeft = eta && placedAt ? Math.max(0, Math.ceil((eta.getTime() - now) / 86_400_000)) : null
  const payment = PAYMENT_LABELS[(order.paymentMethod || '').toLowerCase()] || order.paymentMethod || 'Cash on Delivery'
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0)
  const msg = MESSAGES[step]
  const MsgIcon = msg.icon
  const canChange = !cancelled && step < 3
  // Route progress on the mini map: 0 at the store, 1 at home.
  const progress = delivered ? 1 : [0.06, 0.18, 0.3, 0.68, 1][step]

  const flash = (what: string) => {
    setCopied(what)
    window.setTimeout(() => setCopied(''), 1800)
  }

  const copyId = async () => {
    try { await navigator.clipboard.writeText(id); flash('id') } catch { /* clipboard blocked */ }
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: `PhoneFix order ${id}`, text: `Track my PhoneFix order ${id}`, url })
      else { await navigator.clipboard.writeText(url); flash('link') }
    } catch { /* share cancelled */ }
  }

  const downloadInvoice = () => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(buildInvoice(order, id, payment))
    w.document.close()
  }

  const stepNote = (i: number) => {
    if (i === 0) return placedAt ? stampLabel(placedAt) : order.orderDate
    if (i === 4) {
      if (delivered) { const d = parseDate(order.deliveredAt); return d ? stampLabel(d) : 'Completed' }
      return eta ? <>Expected<br />{dayLabel(eta)}</> : 'Expected soon'
    }
    if (i < step) return 'Completed'
    if (i === step) return 'In progress'
    return 'Upcoming'
  }

  return (
    <main className="otd">
      <header className="otd-head">
        <span className="otd-head-icon"><Box aria-hidden="true" /></span>
        <div className="otd-head-text">
          <h1>Track Your <em>Order</em></h1>
          <p>Get real-time updates on your order, from confirmation to delivery.</p>
        </div>
        <div className="otd-head-actions">
          <button type="button" onClick={share}><Share2 aria-hidden="true" /> {copied === 'link' ? 'Link copied!' : 'Share'}</button>
          <button type="button" onClick={downloadInvoice}><Download aria-hidden="true" /> Download Invoice</button>
          <Link to="/support"><Headphones aria-hidden="true" /> Need Help?</Link>
        </div>
      </header>

      {/* ── Row 1 ── */}
      <div className="otd-row otd-row--top">
        <section className="otd-card otd-eta">
          <div className="otd-eta-inner">
            <span className="otd-eta-label"><CalendarDays aria-hidden="true" /> {delivered ? 'Delivered On' : cancelled ? 'Order Status' : 'Estimated Delivery'}</span>
            <strong className="otd-eta-date">{cancelled ? 'Cancelled' : eta ? dayLabel(eta) : order.deliveryDate || 'To be confirmed'}</strong>
            {!cancelled && (
              <span className="otd-chip">
                <PackageCheck aria-hidden="true" />
                {delivered ? 'Delivered' : daysLeft === null ? 'Arriving in 3–5 days' : daysLeft <= 1 ? 'Arriving soon' : `Arriving in ${daysLeft} days`}
              </span>
            )}
            <div className="otd-box" aria-hidden="true">
              <span className="otd-box-glow" />
              <span className="otd-box-body">
                <span className="otd-box-lid" />
                <span className="otd-box-tape" />
                <span className="otd-box-brand">PhoneFix.</span>
              </span>
            </div>
          </div>
        </section>

        <section className="otd-card otd-progress" aria-label="Order progress">
          {cancelled ? (
            <div className="otd-cancelled"><XCircle aria-hidden="true" /> This order was cancelled. Any payment will be refunded to the original method.</div>
          ) : (
            <ol className="otd-steps">
              {STEPS.map(({ label, icon: Icon }, i) => {
                const state = delivered || i < step ? 'done' : i === step ? 'current' : 'todo'
                return (
                  <li key={label} className={`is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                    <span className="otd-step-dot">{state === 'done' ? <Check aria-hidden="true" strokeWidth={3} /> : <Icon aria-hidden="true" />}</span>
                    <strong>{label}</strong>
                    <small>{stepNote(i)}</small>
                  </li>
                )
              })}
            </ol>
          )}

          {!cancelled && (
            <div className="otd-status">
              <span className="otd-status-icon"><MsgIcon aria-hidden="true" /></span>
              <div>
                <strong>{msg.title}</strong>
                <p>{msg.text}</p>
              </div>
              <span className="otd-status-art" aria-hidden="true">
                <i /><i /><i />
                <span className="otd-mini-box" />
              </span>
            </div>
          )}
        </section>

        <section className="otd-card otd-map-card">
          <div className="otd-map" aria-hidden="true">
            <svg viewBox="0 0 300 200" preserveAspectRatio="none">
              <g className="otd-map-roads">
                <path d="M0 40 H300 M0 120 H300 M0 170 H300 M60 0 V200 M150 0 V200 M240 0 V200 M0 0 L300 200 M300 20 L120 200" />
              </g>
              <path className="otd-route-bg" d="M60 45 V100 H155 V150 H240 V145" />
              <path className="otd-route" d="M60 45 V100 H155 V150 H240 V145" pathLength={1} style={{ strokeDashoffset: 1 - progress }} />
            </svg>
            <span className="otd-pin otd-pin--store"><Store /></span>
            <span className="otd-pin otd-pin--home"><Home /></span>
          </div>
          <button type="button" className="otd-map-btn" onClick={() => setShowDetails((v) => !v)} aria-expanded={showDetails}>
            <Truck aria-hidden="true" />
            <span>{showDetails ? 'Hide Tracking Details' : 'View Tracking Details'}</span>
            <ArrowRight aria-hidden="true" className={showDetails ? 'is-open' : ''} />
          </button>
          {showDetails && (
            <dl className="otd-track-info">
              <div><dt>Delivery partner</dt><dd>{order.deliveryPartner || 'PhoneFix Express'}</dd></div>
              <div><dt>Tracking ID</dt><dd>{order.trackingId || 'Shared once shipped'}</dd></div>
              {order.address && <div className="is-wide"><dt><MapPin aria-hidden="true" /> Delivering to</dt><dd>{order.address}</dd></div>}
            </dl>
          )}
        </section>
      </div>

      {/* ── Row 2 ── */}
      <div className="otd-row otd-row--bottom">
        <section className="otd-card otd-items">
          <h2 className="otd-card-title"><CalendarDays aria-hidden="true" /> Items in this order ({itemCount})</h2>
          <ul>
            {order.items.map((item) => {
              const src = itemImage(item)
              const meta = [item.color, item.storage, item.ram].filter((v) => v && v.toUpperCase() !== 'N/A')
              return (
                <li key={`${item.productId}-${item.color}-${item.storage}`}>
                  <button type="button" className="otd-item-img" onClick={() => item.productId && navigate(`/product/${item.productId}`)} aria-label={`View ${item.name}`}>
                    {src && !imgErrors[item.productId]
                      ? <img src={src} alt="" onError={() => setImgErrors((p) => ({ ...p, [item.productId]: true }))} />
                      : <span>{item.emoji || '📦'}</span>}
                  </button>
                  <div className="otd-item-info">
                    <strong>{item.name}</strong>
                    <div className="otd-item-tags">
                      {meta.map((m) => <span key={m}>{m}</span>)}
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="otd-item-price">{inr(item.price * item.quantity)}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="otd-card otd-details">
          <h2 className="otd-card-title"><ClipboardList aria-hidden="true" /> Order Details</h2>
          <dl>
            <div>
              <dt>Order ID</dt>
              <dd className="otd-id">
                #{id}
                <button type="button" onClick={copyId} aria-label="Copy order ID" title={copied === 'id' ? 'Copied!' : 'Copy'}>
                  {copied === 'id' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                </button>
              </dd>
            </div>
            <div><dt>Payment Method</dt><dd>{payment}</dd></div>
          </dl>
          <dl className="otd-prices">
            <div><dt>Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
            {order.discount > 0 && (
              <div><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</dt><dd className="is-save">– {inr(order.discount)}</dd></div>
            )}
            <div><dt>Delivery</dt><dd className={order.shipping ? '' : 'is-free'}>{order.shipping ? inr(order.shipping) : 'Free'}</dd></div>
            <div><dt>GST ({Math.round(TAX_RATE * 100)}%)</dt><dd>{inr(order.tax)}</dd></div>
          </dl>
          <div className="otd-total"><span>Total Amount</span><strong>{inr(order.total)}</strong></div>
        </section>

        <section className="otd-help">
          <div className="otd-help-head">
            <span><Headphones aria-hidden="true" /></span>
            <div>
              <strong>Need Help?</strong>
              <p>Our support team is here to assist you.</p>
            </div>
          </div>
          <Link to="/support" className="otd-help-btn otd-help-btn--primary">
            <MessageSquareText aria-hidden="true" /> Chat with Support <ArrowRight aria-hidden="true" />
          </Link>
          {canChange && (
            <>
              <Link to="/support" className="otd-help-btn"><Pencil aria-hidden="true" /> Modify Order</Link>
              <Link to="/support" className="otd-help-btn"><X aria-hidden="true" /> Cancel Order</Link>
            </>
          )}
          {delivered && (
            <button
              type="button"
              className="otd-help-btn"
              onClick={() => {
                const first = order.items[0]
                if (first?.productId) navigate(`/product/${first.productId}?${new URLSearchParams({ order_id: order.orderId, rate: 'true' })}`)
              }}
            >
              <PartyPopper aria-hidden="true" /> Rate Your Purchase
            </button>
          )}
        </section>
      </div>
    </main>
  )
}

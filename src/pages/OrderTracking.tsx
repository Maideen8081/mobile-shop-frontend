import PageLoading from '../components/ui/PageLoading'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, CheckCircle2, ChevronRight, Package, ShoppingBag, Truck, Wrench, XCircle } from 'lucide-react'
import { orderService } from '../services/orderService'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import AccountLayout from '../components/account/AccountLayout'
import OrderTrackingDetail, { itemImage, type TrackOrder } from './OrderTrackingDetail'
import './OrderTracking.css'

const inr = (n: number) => '₹' + Math.round(n || 0).toLocaleString('en-IN')

/** The five steps shown on each card. Backend statuses map onto these. */
const STEPS = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered']
const STEP_OF: Record<string, number> = {
  order_placed: 0, accepted: 0, processing: 1, shipped: 2, out_for_delivery: 3, delivered: 4,
}

type Filter = 'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All Orders' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

function filterOf(status: string): Filter {
  if (status === 'cancelled') return 'cancelled'
  if (status === 'delivered') return 'delivered'
  if (status === 'shipped' || status === 'out_for_delivery') return 'shipped'
  return 'processing'
}

function formatOrderDate(value: string): string {
  const d = new Date(value)
  if (!value || Number.isNaN(d.getTime())) return value || '—'
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
  return `${date}, ${time}`
}

function readCache(): TrackOrder[] {
  try {
    const saved = localStorage.getItem('order_history')
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

function StatusPill({ status }: { status: string }) {
  if (status === 'cancelled') return <span className="mo-pill is-cancelled"><XCircle size={14} /> Cancelled</span>
  if (status === 'delivered') return <span className="mo-pill is-delivered"><CheckCircle2 size={14} /> Delivered</span>
  if (status === 'shipped') return <span className="mo-pill"><Truck size={14} /> Shipped</span>
  if (status === 'out_for_delivery') return <span className="mo-pill"><Truck size={14} /> Out for Delivery</span>
  if (status === 'processing') return <span className="mo-pill"><span className="mo-pill-dot" /> Processing</span>
  if (status === 'accepted') return <span className="mo-pill"><span className="mo-pill-dot" /> Accepted</span>
  return <span className="mo-pill"><span className="mo-pill-dot" /> Order Placed</span>
}

function Stepper({ status }: { status: string }) {
  const current = STEP_OF[status] ?? 0
  return (
    <ol className="mo-steps" aria-label={`Progress: ${STEPS[current]}`}>
      {STEPS.map((label, i) => (
        <li key={label} className={i <= current ? 'is-done' : undefined}>
          <span className={`mo-step-line${i < current ? ' is-done' : ''}`} aria-hidden="true" />
          <span className="mo-step-dot" aria-hidden="true">{i <= current && <Check size={12} strokeWidth={3} />}</span>
          <span className="mo-step-label">{label}</span>
        </li>
      ))}
    </ol>
  )
}

function OrderCard({ order, index, onOpen }: { order: TrackOrder; index: number; onOpen: () => void }) {
  const first = order.items[0]
  const img = first ? itemImage(first) : ''
  const qty = order.items.reduce((s, i) => s + i.quantity, 0)
  const extra = order.items.length - 1
  const variant = first ? [first.storage, first.color].filter(Boolean).join(' · ') : ''

  return (
    <motion.button
      type="button"
      className="mo-card"
      onClick={onOpen}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04 }}
      aria-label={`Order ${order.displayOrderId || order.orderId}, view details`}
    >
      <span className="mo-thumb">
        {img ? <img src={img} alt="" loading="lazy" /> : <Package size={34} />}
      </span>

      <span className="mo-info">
        <span className="mo-id">Order #{order.displayOrderId || order.orderId}</span>
        <span className="mo-name">
          {first?.name || 'Order'}
          {variant && <span className="mo-variant"> ({variant})</span>}
        </span>
        {extra > 0 && <span className="mo-more">+ {extra} more {extra === 1 ? 'item' : 'items'}</span>}
        <span className="mo-meta">
          <span>Qty: {qty}</span>
          <span className="mo-meta-sep" aria-hidden="true" />
          <span>Ordered on {formatOrderDate(order.orderDate)}</span>
        </span>
      </span>

      <span className="mo-track">
        <span className="mo-track-head"><StatusPill status={order.status} /></span>
        {order.status === 'cancelled'
          ? <span className="mo-cancel-note">This order was cancelled. Any payment made will be refunded to the original method.</span>
          : <Stepper status={order.status} />}
      </span>

      <span className="mo-price">{inr(order.total)}</span>
      <span className="mo-go" aria-hidden="true"><ChevronRight size={20} /></span>
    </motion.button>
  )
}

export default function OrderTracking() {
  const [params, setParams] = useSearchParams()
  const urlOrderId = params.get('order_id')
  const [orders, setOrders] = useState<TrackOrder[]>(readCache)
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    let cancelled = false
    orderService.listMine().then((apiOrders) => {
      if (cancelled) return
      setLoaded(true)
      if (apiOrders.length === 0) return
      const mapped: TrackOrder[] = apiOrders.map(o => ({
        orderId: String(o.id),
        displayOrderId: o.order_id,
        items: (o.items || []).map(it => ({
          productId: it.product_id,
          name: it.product_name,
          price: Number(it.price),
          quantity: it.quantity,
          emoji: '',
          image: it.image,
          storage: it.selected_storage,
          ram: it.selected_ram,
          color: it.selected_color,
        })),
        total: Number(o.grand_total),
        subtotal: Number(o.subtotal),
        shipping: Number(o.shipping_charge),
        tax: Number(o.tax),
        tax_rate: o.tax_rate,
        discount: o.discount || 0,
        couponCode: o.coupon_code || '',
        deliveryDate: o.est_delivery,
        orderDate: o.created_at,
        status: o.delivery_status || 'order_placed',
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        orderNumber: o.order_number,
        deliveryPartner: o.delivery_partner,
        trackingId: o.tracking_id,
        address: o.delivery_address_text,
        deliveredAt: o.delivered_at,
      }))
      setOrders(mapped)
      try { localStorage.setItem('order_history', JSON.stringify(mapped.slice(0, 50))) } catch { /* storage full or blocked */ }
    })
    return () => { cancelled = true }
  }, [])

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: orders.length, processing: 0, shipped: 0, delivered: 0, cancelled: 0 }
    orders.forEach(o => { c[filterOf(o.status)]++ })
    return c
  }, [orders])

  const visible = filter === 'all' ? orders : orders.filter(o => filterOf(o.status) === filter)
  const selected = urlOrderId ? orders.find(o => String(o.orderId) === urlOrderId) : undefined

  if (selected) {
    return (
      <div className="min-h-screen otd-page">
        <SiteTopNav />
        <OrderTrackingDetail order={selected} />
      </div>
    )
  }

  const showLoading = !loaded && orders.length === 0

  return (
    <div className="mo">
      <SiteTopNav />

      <AccountLayout active="orders" counts={{ orders: orders.length }}>
        <section className="mo-hero">
          <div className="mo-hero-text">
            <h1>My Orders</h1>
            <p>Track, manage and view details of your orders in one place.</p>
          </div>
          <div className="mo-hero-art" aria-hidden="true">
            <span className="mo-box mo-box-a" />
            <span className="mo-box mo-box-b" />
            <span className="mo-bag"><span className="mo-bag-badge"><Wrench size={22} /></span></span>
          </div>
        </section>

        <div className="mo-tabs" role="tablist" aria-label="Filter orders">
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={filter === f.key ? 'is-active' : undefined}
              onClick={() => setFilter(f.key)}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>

        {showLoading ? (
          <PageLoading label="Loading your orders…" className="py-16" />
        ) : visible.length === 0 ? (
          <div className="mo-empty">
            <span className="mo-empty-icon"><ShoppingBag size={34} /></span>
            <h2>{filter === 'all' ? 'No orders yet' : `No ${FILTERS.find(f => f.key === filter)?.label.toLowerCase()} orders`}</h2>
            <p>{filter === 'all' ? 'Complete your first purchase to see it here.' : 'Orders with this status will show up here.'}</p>
            {filter === 'all'
              ? <Link to="/collection/all" className="mo-empty-btn">Browse Products</Link>
              : <button type="button" className="mo-empty-btn" onClick={() => setFilter('all')}>View all orders</button>}
          </div>
        ) : (
          <div className="mo-list">
            {visible.map((order, i) => (
              <OrderCard
                key={order.orderId}
                order={order}
                index={i}
                onOpen={() => setParams({ order_id: String(order.orderId) })}
              />
            ))}
          </div>
        )}
      </AccountLayout>
    </div>
  )
}

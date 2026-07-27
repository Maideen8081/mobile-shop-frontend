import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiEye, FiX, FiPackage, FiTruck, FiCheck, FiUser, FiPhone, FiMapPin, FiCreditCard, FiShoppingBag, FiChevronDown, FiRefreshCw } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import { orderService, type OrderResponse } from '../services/orderService'

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'delivered': { bg: 'rgba(203,32,45,0.1)', text: '#A81D2A', dot: '#CB202D' },
  'out_for_delivery': { bg: 'rgba(14,165,233,0.1)', text: '#0ea5e9', dot: '#0ea5e9' },
  'shipped': { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6', dot: '#8b5cf6' },
  'processing': { bg: 'rgba(245,158,11,0.1)', text: '#d97706', dot: '#f59e0b' },
  'accepted': { bg: 'rgba(6,182,212,0.1)', text: '#0891b2', dot: '#06b6d4' },
  'order_placed': { bg: 'rgba(107,114,128,0.1)', text: '#6b7280', dot: '#9ca3af' },
  'cancelled': { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', dot: '#ef4444' },
}

const STATUS_LABELS: Record<string, string> = {
  order_placed: 'Order Placed',
  accepted: 'Order Accepted',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const PAYMENT_COLORS: Record<string, { bg: string; text: string }> = {
  'Paid': { bg: 'rgba(203,32,45,0.1)', text: '#A81D2A' },
  'Pending': { bg: 'rgba(245,158,11,0.1)', text: '#d97706' },
  'Refunded': { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6' },
}

const DELIVERY_STEPS = ['order_placed', 'accepted', 'processing', 'shipped', 'out_for_delivery', 'delivered']
const STEP_INDEX: Record<string, number> = { order_placed: 0, accepted: 1, processing: 2, shipped: 3, out_for_delivery: 4, delivered: 5, cancelled: -1 }
const NEXT_STATUS: Record<string, string | null> = {
  order_placed: 'accepted',
  accepted: 'processing',
  processing: 'shipped',
  shipped: 'out_for_delivery',
  out_for_delivery: 'delivered',
  delivered: null,
  cancelled: null,
}

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

interface AdminOrder {
  id: number
  orderId: string
  customerName: string
  customerMobile: string
  total: number
  subtotal: number
  shipping: number
  tax: number
  discount: number
  couponCode: string
  deliveryStatus: string
  paymentStatus: string
  paymentMethod: string
  products: { name: string; qty: number; price: number }[]
  deliveryPartner: string
  trackingId: string
  deliveryAddress: string
  estDelivery: string
  deliveredAt?: string
  rawOrderId: string
}

export default function AdminOrders() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selected, setSelected] = useState<AdminOrder | null>(null)
  const [allOrders, setAllOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const apiOrders = await orderService.list()
      const mapped: AdminOrder[] = apiOrders.map((o: OrderResponse, i: number) => ({
        id: o.id || i + 1,
        orderId: o.order_id,
        rawOrderId: String(o.order_number || o.id),
        customerName: o.customer_name || 'Customer',
        customerMobile: o.customer_mobile || '-',
        total: Number(o.grand_total) || 0,
        subtotal: Number(o.subtotal) || 0,
        shipping: Number(o.shipping_charge) || 0,
        tax: Number(o.tax) || 0,
        discount: o.discount || 0,
        couponCode: o.coupon_code || '',
        deliveryStatus: o.delivery_status || 'order_placed',
        paymentStatus: o.payment_status_display || (o.payment_method === 'Cash on Delivery' ? 'Pending' : 'Paid'),
        paymentMethod: o.payment_method || 'N/A',
        products: (o.items || []).map((it) => ({ name: it.product_name, qty: it.quantity, price: Number(it.price) })),
        deliveryPartner: o.delivery_partner || 'N/A',
        trackingId: o.tracking_id || '-',
        deliveryAddress: o.delivery_address_text || '-',
        estDelivery: o.est_delivery || '-',
        deliveredAt: o.delivered_at || undefined,
      }))
      setAllOrders(mapped)
    } catch {
      setError('Failed to load orders from server')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleStatusUpdate = async (order: AdminOrder, newStatus: string) => {
    setUpdatingStatus(order.rawOrderId)
    try {
      const updated = await orderService.updateStatus(order.rawOrderId, newStatus)
      if (updated) {
        setAllOrders(prev => prev.map(o =>
          o.rawOrderId === order.rawOrderId
            ? { ...o, deliveryStatus: updated.delivery_status }
            : o
        ))
        setSelected(prev => prev && prev.rawOrderId === order.rawOrderId
          ? { ...prev, deliveryStatus: updated.delivery_status }
          : prev
        )
      }
    } catch {
      // status update failed
    }
    setUpdatingStatus(null)
  }

  const mergedOrders = allOrders

  const statuses = useMemo(() => Array.from(new Set(mergedOrders.map(o => o.deliveryStatus))), [mergedOrders])
  const paymentStatuses = useMemo(() => Array.from(new Set(mergedOrders.map(o => o.paymentStatus))), [mergedOrders])

  const filtered = useMemo(() => {
    return mergedOrders.filter(o => {
      if (statusFilter !== 'all' && o.deliveryStatus !== statusFilter) return false
      if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return o.orderId.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerMobile.includes(q)
      }
      return true
    })
  }, [mergedOrders, search, statusFilter, paymentFilter])

  const stats = useMemo(() => ({
    total: mergedOrders.length,
    delivered: mergedOrders.filter(o => o.deliveryStatus === 'delivered').length,
    inTransit: mergedOrders.filter(o => ['shipped', 'out_for_delivery'].includes(o.deliveryStatus)).length,
    revenue: mergedOrders.filter(o => o.paymentStatus === 'Paid').reduce((s, o) => s + o.total, 0),
  }), [mergedOrders])

  return (
    <PageLayout title="Online Orders">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Orders', value: stats.total, icon: <FiShoppingBag size={18} />, color: '#8b5cf6', glow: 'rgba(139,92,246,0.12)' },
          { label: 'Delivered', value: stats.delivered, icon: <FiCheck size={18} />, color: '#CB202D', glow: 'rgba(203,32,45,0.12)' },
          { label: 'In Transit', value: stats.inTransit, icon: <FiTruck size={18} />, color: '#0ea5e9', glow: 'rgba(14,165,233,0.12)' },
          { label: 'Revenue', value: formatCurrency(stats.revenue), icon: <FiCreditCard size={18} />, color: '#f59e0b', glow: 'rgba(245,158,11,0.12)' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.glow, color: s.color }}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-text-primary">{s.value}</p>
              <p className="text-xs text-text-secondary font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-4 mb-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order ID, customer name, or mobile..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface border border-border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-xl bg-surface border border-border text-sm text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              {statuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
            </select>
            <FiChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-xl bg-surface border border-border text-sm text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
            >
              <option value="all">All Payment</option>
              {paymentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <FiChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide">Order ID</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide hidden md:table-cell">Products</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide">Amount</th>
                <th className="text-center px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide hidden lg:table-cell">Payment</th>
                <th className="text-center px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-secondary">
                    <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                    <p className="font-medium text-sm">Loading orders from server…</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-secondary">
                    <FiPackage size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-red-500">{error}</p>
                    <p className="text-xs mt-1">Make sure you are logged in as admin</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-secondary">
                    <FiPackage size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No orders yet</p>
                    <p className="text-xs mt-1">Orders will appear here once customers make purchases</p>
                  </td>
                </tr>
              ) : filtered.map(order => {
                const sc = STATUS_COLORS[order.deliveryStatus] || STATUS_COLORS['order_placed']
                const pc = PAYMENT_COLORS[order.paymentStatus] || PAYMENT_COLORS['Pending']
                return (
                  <tr key={order.id} className="border-b border-border/50 last:border-b-0 hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-text-primary text-xs">{order.orderId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary text-sm truncate max-w-[140px]">{order.customerName}</p>
                      <p className="text-xs text-text-secondary truncate">{order.customerMobile}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {order.products.map((p: { name: string; qty: number }, i: number) => (
                          <p key={i} className="text-xs text-text-primary truncate max-w-[200px]">
                            {p.name} {p.qty > 1 ? <span className="text-text-secondary">×{p.qty}</span> : ''}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-text-primary text-sm">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                        {STATUS_LABELS[order.deliveryStatus] || order.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: pc.bg, color: pc.text }}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelected(order)}
                        className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center mx-auto"
                        title="View Details"
                      >
                        <FiEye size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border bg-surface/30">
          <p className="text-xs text-text-secondary font-medium">Showing {filtered.length} of {mergedOrders.length} orders</p>
        </div>
      </div>

      {/* Order Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-white z-50 shadow-2xl overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center gap-3 z-10">
                <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-xl bg-surface hover:bg-surface-hover flex items-center justify-center transition-colors">
                  <FiX size={18} className="text-text-secondary" />
                </button>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-text-primary">{selected.orderId}</h2>
                  <p className="text-xs text-text-secondary">{selected.customerName}</p>
                </div>
                {(() => {
                  const sc = STATUS_COLORS[selected.deliveryStatus] || STATUS_COLORS['order_placed']
                  return (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                      {STATUS_LABELS[selected.deliveryStatus] || selected.deliveryStatus}
                    </span>
                  )
                })()}
              </div>

              <div className="p-5 space-y-5">
                {/* Customer Info */}
                <div className="bg-surface rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Customer Details</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <FiUser size={15} className="text-text-secondary flex-shrink-0" />
                      <span className="text-sm font-medium text-text-primary">{selected.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <FiPhone size={15} className="text-text-secondary flex-shrink-0" />
                      <span className="text-sm text-text-primary">{selected.customerMobile}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <FiMapPin size={15} className="text-text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-text-primary">{selected.deliveryAddress}</span>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="bg-surface rounded-2xl p-4">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Products ({selected.products.length})</p>
                  <div className="space-y-2">
                    {selected.products.map((p, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-border/50">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FiPackage size={14} className="text-primary" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-text-primary">{p.name}</span>
                            {p.price ? <span className="text-xs text-text-secondary ml-1.5">@ {formatCurrency(p.price)}</span> : null}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-text-secondary">×{p.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Timeline */}
                <div className="bg-surface rounded-2xl p-4">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">Delivery Progress</p>
                  <div className="space-y-0">
                    {DELIVERY_STEPS.map((step, i) => {
                      const currentIdx = STEP_INDEX[selected.deliveryStatus] ?? 0
                      const isDone = i <= currentIdx && currentIdx >= 0
                      const isCurrent = i === currentIdx
                      const isCancelled = selected.deliveryStatus === 'cancelled'
                      return (
                        <div key={step} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCancelled ? 'bg-red-50 text-red-400 border-2 border-red-200' :
                              isDone ? 'bg-primary text-white shadow-md' : 'bg-white text-text-secondary border-2 border-border'
                            }`}>
                              {isDone && !isCancelled ? <FiCheck size={13} /> : i + 1}
                            </div>
                            {i < DELIVERY_STEPS.length - 1 && (
                              <div className={`w-0.5 h-6 ${isDone && !isCancelled ? 'bg-primary' : 'bg-border'}`} />
                            )}
                          </div>
                          <div className="pb-4">
                            <p className={`text-sm font-semibold ${isDone && !isCancelled ? 'text-text-primary' : 'text-text-secondary'}`}>
                              {STATUS_LABELS[step] || step}
                            </p>
                            {isCurrent && !isCancelled && <p className="text-xs text-primary font-medium mt-0.5">Current step</p>}
                            {isCancelled && i === 0 && <p className="text-xs text-red-400 font-medium mt-0.5">Order was cancelled</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {selected.deliveredAt && (
                    <div className="mt-2 p-2.5 bg-green-50 rounded-xl text-xs text-green-700 font-medium flex items-center gap-1.5">
                      <FiCheck size={13} /> Delivered on {selected.deliveredAt}
                    </div>
                  )}

                  {/* Status Update */}
                  {selected.deliveryStatus !== 'delivered' && selected.deliveryStatus !== 'cancelled' && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const next = NEXT_STATUS[selected.deliveryStatus]
                          if (!next) return null
                          const isUpdating = updatingStatus === selected.rawOrderId
                          return (
                            <button
                              onClick={() => handleStatusUpdate(selected, next)}
                              disabled={isUpdating}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                              style={{ background: 'linear-gradient(135deg, #CB202D, #A81D2A)' }}
                            >
                              {isUpdating ? (
                                <FiRefreshCw size={14} className="animate-spin" />
                              ) : (
                                <FiChevronDown size={14} />
                              )}
                              Mark as {STATUS_LABELS[next]}
                            </button>
                          )
                        })()}
                        <button
                          onClick={() => handleStatusUpdate(selected, 'cancelled')}
                          disabled={updatingStatus === selected.rawOrderId}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                          Cancel Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment & Shipping */}
                <div className="bg-surface rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Payment & Shipping</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-border/50">
                      <p className="text-[11px] text-text-secondary mb-1">Grand Total</p>
                      <p className="text-sm font-bold text-text-primary">{formatCurrency(selected.total)}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {(() => {
                          const pc = PAYMENT_COLORS[selected.paymentStatus] || PAYMENT_COLORS['Pending']
                          return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: pc.bg, color: pc.text }}>{selected.paymentStatus}</span>
                        })()}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-border/50">
                      <p className="text-[11px] text-text-secondary mb-1">Method</p>
                      <p className="text-sm font-semibold text-text-primary">{selected.paymentMethod}</p>
                    </div>
                  </div>
                  {/* Price Breakdown */}
                  {(selected.subtotal || selected.shipping || selected.tax || selected.discount) ? (
                    <div className="bg-white rounded-xl p-3 border border-border/50 space-y-1.5">
                      <p className="text-[11px] text-text-secondary mb-2 font-semibold uppercase">Price Breakdown</p>
                      {selected.subtotal ? <div className="flex justify-between text-xs"><span className="text-text-secondary">Subtotal</span><span className="font-medium text-text-primary">{formatCurrency(selected.subtotal)}</span></div> : null}
                      {selected.shipping != null ? <div className="flex justify-between text-xs"><span className="text-text-secondary">Shipping</span><span className="font-medium" style={{ color: selected.shipping === 0 ? '#A81D2A' : undefined }}>{selected.shipping === 0 ? 'FREE' : formatCurrency(selected.shipping)}</span></div> : null}
                      {selected.tax ? <div className="flex justify-between text-xs"><span className="text-text-secondary">Tax (GST)</span><span className="font-medium text-text-primary">{formatCurrency(selected.tax)}</span></div> : null}
                      {selected.discount ? <div className="flex justify-between text-xs"><span className="text-text-secondary">Coupon ({selected.couponCode})</span><span className="font-medium" style={{ color: '#A81D2A' }}>-{formatCurrency(selected.discount)}</span></div> : null}
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-border/50">
                      <p className="text-[11px] text-text-secondary mb-1">Delivery Partner</p>
                      <p className="text-sm font-semibold text-text-primary">{selected.deliveryPartner}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-border/50">
                      <p className="text-[11px] text-text-secondary mb-1">Tracking ID</p>
                      <p className="text-sm font-semibold text-primary">{selected.trackingId}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-border/50 col-span-2">
                      <p className="text-[11px] text-text-secondary mb-1">Estimated Delivery</p>
                      <p className="text-sm font-semibold text-text-primary">{selected.estDelivery}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageLayout>
  )
}

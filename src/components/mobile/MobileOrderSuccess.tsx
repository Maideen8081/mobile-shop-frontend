import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiChevronLeft, FiCheck, FiCopy, FiTruck, FiShoppingBag, FiStar } from 'react-icons/fi'
import { orderService, type OrderResponse } from '../../services/orderService'

const PURPLE = '#CB202D'
const PURPLE_DEEP = '#A81D2A'
const SUCCESS = '#16A34A'
const card = 'bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const emojiToImage: Record<string, string> = {
  '📱': 'https://pngimg.com/d/iphone16_PNG37.png',
  '📲': 'https://pngimg.com/d/samsung_PNG2.png',
  '🎧': 'https://pngimg.com/d/headphones_PNG7645.png',
  '⌚': 'https://pngimg.com/d/apple_watch_PNG19558.png',
  '📟': 'https://pngimg.com/d/ipad_PNG2133.png',
  '💻': 'https://pngimg.com/d/laptop_PNG101814.png',
  '🎮': 'https://pngimg.com/d/ps5_PNG31.png',
  '📷': 'https://pngimg.com/d/camera_PNG101583.png',
  '🛡️': 'https://pngimg.com/d/iphone15_PNG40.png',
}
function resolveImage(item: any): string {
  if (item.image) {
    if (item.image.startsWith('http') || item.image.startsWith('data:')) return item.image
    const mapped = emojiToImage[item.image]
    if (mapped) return mapped
    return `${API_BASE_URL.replace(/\/$/, '')}/${item.image.replace(/^\//, '')}`
  }
  if (item.emoji && emojiToImage[item.emoji]) return emojiToImage[item.emoji]
  return ''
}
function formatPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const STATUS_STEPS = ['order_placed', 'accepted', 'processing', 'shipped', 'out_for_delivery', 'delivered']
const STATUS_LABELS: Record<string, string> = {
  order_placed: 'Order Placed', accepted: 'Order Accepted', processing: 'Processing',
  shipped: 'Shipped', out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
}
const statusIndex = (s: string) => {
  const l = s.toLowerCase().replace(/\s+/g, '_')
  const map: Record<string, number> = {
    order_placed: 0, confirmed: 0, placed: 0,
    accepted: 1,
    processing: 2, packed: 2,
    shipped: 3,
    out_for_delivery: 4,
    delivered: 5,
  }
  for (const [key, idx] of Object.entries(map)) {
    if (l === key || l.includes(key)) return idx
  }
  return 0
}

export default function MobileOrderSuccess() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const orderId = params.get('order_id') || ''

  const [apiOrder, setApiOrder] = useState<OrderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState(false)

  const localOrder = (() => {
    try { return JSON.parse(localStorage.getItem('last_order') || 'null') } catch { return null }
  })()

  useEffect(() => {
    if (!orderId) { setLoading(false); return }
    let mounted = true
    orderService.detail(orderId)
      .then(o => { if (mounted) setApiOrder(o) })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [orderId])

  useEffect(() => {
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  const order = apiOrder
  const displayOrderId = order?.order_id || orderId || localOrder?.orderId || ''
  const deliveryDate = order?.est_delivery || localOrder?.deliveryDate || (() => {
    const d = new Date(); d.setDate(d.getDate() + 5)
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  })()

  const items = order?.items?.map(it => ({
    productId: it.product_id,
    name: it.product_name,
    image: it.image,
    storage: it.selected_storage,
    ram: it.selected_ram,
    color: it.selected_color,
    quantity: it.quantity,
    price: Number(it.price),
  })) || localOrder?.items || []

  const grandTotal = order ? Number(order.grand_total) : (localOrder?.total ?? items.reduce((s: number, i: any) => s + i.price * i.quantity, 0))
  const subtotal = order ? Number(order.subtotal) : (localOrder?.subtotal ?? 0)
  const shipping = order ? Number(order.shipping_charge) : (localOrder?.shipping ?? 0)
  const tax = order ? Number(order.tax) : (localOrder?.tax ?? 0)
  const discount = localOrder?.discount || 0
  const couponCode = localOrder?.couponCode || ''
  const paymentMethod = order?.payment_method || localOrder?.paymentMethod || ''

  const deliveryStatus = order?.delivery_status || localOrder?.status || 'order_placed'
  const currentStep = statusIndex(deliveryStatus)

  const copyId = () => {
    navigator.clipboard?.writeText(displayOrderId)
    setCopied(true)
  }

  const confetti = ['#CB202D', '#16A34A', '#F59E0B', '#EF4444', '#0EA5E9', '#FF5A65']

  return (
    <div className="min-h-screen bg-[#FFFBFB] max-w-[480px] mx-auto pb-28 relative overflow-hidden" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {confetti.map((c, i) => (
          <span key={i} className="absolute top-[-10px] w-2 h-2 rounded-sm animate-[fall_2.4s_ease-in_forwards]"
            style={{ left: `${(i * 16 + 5) % 100}%`, background: c, animationDelay: `${(i % 5) * 0.25}s`, transform: `rotate(${i * 40}deg)` }} />
        ))}
      </div>

      {/* Top banner */}
      <div className="relative px-4 pt-4 pb-24 text-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${SUCCESS}, #15803D)` }}>
        <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-12 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <button onClick={() => navigate('/home')} className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center z-10">
          <FiChevronLeft size={20} className="text-white" />
        </button>
        <div className="relative w-24 h-24 mx-auto mt-6">
          <span className="absolute inset-0 rounded-full bg-white/25 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-xl">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${SUCCESS}, #15803D)` }}>
              <FiCheck size={34} className="text-white" />
            </div>
          </div>
        </div>
        <h1 className="text-[22px] font-bold text-white mt-4">Order Confirmed!</h1>
        <p className="text-[13px] text-white/80 mt-1">Thank you — your order has been placed.</p>
        <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-white/20 text-[11px] font-semibold text-white">
          <FiCheck size={12} /> Payment Successful
        </span>
      </div>

      <div className="px-4 -mt-16 space-y-3 relative z-10">
        {/* Order id card */}
        <div className={`${card} rounded-[20px] p-4 flex items-center justify-between`}>
          <div>
            <p className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wide">Order ID</p>
            <p className="text-[16px] font-bold text-[#1F2937]">{displayOrderId}</p>
          </div>
          <button onClick={copyId} className="flex items-center gap-1.5 h-9 px-3 rounded-full text-[12px] font-semibold" style={{ background: 'rgba(203,32,45,0.1)', color: PURPLE }}>
            {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}{copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Delivery estimate */}
        <div className={`${card} rounded-[20px] p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl" style={{ background: 'rgba(22,163,74,0.1)' }}>🚚</div>
            <div className="flex-1">
              <p className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wide">Estimated Delivery</p>
              <p className="text-[15px] font-bold text-[#1F2937]">{deliveryDate}</p>
            </div>
          </div>
          {/* Timeline */}
          <div className="flex items-center justify-between mt-4">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep
              const label = STATUS_LABELS[step] || step
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${done ? 'text-white' : 'bg-[#F1F5F9] text-[#9CA3AF]'}`}
                      style={done ? { background: `linear-gradient(135deg, ${SUCCESS}, #15803D)` } : undefined}>
                      {done ? <FiCheck size={14} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                    </div>
                    <span className={`text-[9px] mt-1 font-semibold text-center leading-tight ${done ? 'text-[#15803D]' : 'text-[#9CA3AF]'}`}>{label}</span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-[2px] mx-1 rounded-full ${done && i < currentStep ? '' : 'bg-[#E5E7EB]'}`} style={done && i < currentStep ? { background: SUCCESS } : undefined} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Items */}
        <div className={`${card} rounded-[20px] p-4`}>
          <p className="text-[14px] font-bold text-[#1F2937] mb-3">Order Items ({items.length})</p>
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-[12px] bg-[#F1F5F9]" />
                    <div className="flex-1 space-y-2"><div className="h-3 bg-[#F1F5F9] rounded w-3/4" /><div className="h-2.5 bg-[#F1F5F9] rounded w-1/2" /></div>
                    <div className="h-3 bg-[#F1F5F9] rounded w-16" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="text-[12px] text-[#9CA3AF]">No items found</p>
            ) : items.map((item: any, idx: number) => {
              const imgUrl = resolveImage(item)
              const hasImg = imgUrl && !imgErrors[item.productId ?? idx]
              return (
                <div key={item.productId ?? idx} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[12px] bg-[#FFFBFB] flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {hasImg ? (
                      <img src={imgUrl} alt={item.name} className="w-full h-full object-contain" onError={() => setImgErrors(p => ({ ...p, [item.productId ?? idx]: true }))} />
                    ) : (
                      <span className="text-xl">{item.emoji || '📦'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#1F2937] truncate">{item.name}</p>
                    <p className="text-[11px] text-[#6B7280]">Qty: {item.quantity}{item.storage ? ` · ${item.storage}` : ''}{item.ram ? ` · ${item.ram}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#1F2937]">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="h-px bg-[#EEF0F6] my-3" />
          <div className="space-y-1.5 text-[12px]">
            <div className="flex justify-between text-[#6B7280]"><span>Subtotal</span><span className="font-semibold text-[#1F2937]">{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-[#6B7280]"><span>Shipping</span><span className="font-semibold" style={{ color: shipping === 0 ? SUCCESS : '#1F2937' }}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
            <div className="flex justify-between text-[#6B7280]"><span>Tax (GST)</span><span className="font-semibold text-[#1F2937]">{formatPrice(tax)}</span></div>
            {discount > 0 && <div className="flex justify-between text-[#6B7280]"><span>Coupon ({couponCode})</span><span className="font-semibold" style={{ color: SUCCESS }}>-{formatPrice(discount)}</span></div>}
          </div>
          <div className="h-px bg-[#EEF0F6] my-3" />
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-[#6B7280] font-semibold uppercase tracking-wide">Total Paid</span>
            <span className="text-[18px] font-bold text-[#1F2937]">{formatPrice(grandTotal)}</span>
          </div>
          {paymentMethod && (
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-[#6B7280]">Payment Method</span>
              <span className="text-[11px] font-semibold text-[#1F2937]">{paymentMethod}</span>
            </div>
          )}
        </div>

        {/* Review CTA - only when delivered */}
        {currentStep >= 4 && (
          <div className={`${card} rounded-[20px] p-4`}>
            <p className="text-[14px] font-bold text-[#1F2937] mb-3">Rate & Review Your Purchase</p>
            <div className="space-y-2.5">
              {items.map((item: any, idx: number) => (
                <button key={item.productId ?? idx} onClick={() => navigate(`/product/${item.productId}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-[14px] border border-[#FEE2E6] bg-[#FFFBFB] active:bg-[#FEE2E6] transition-colors">
                  <div className="w-9 h-9 rounded-[10px] bg-[#FEE2E6] flex items-center justify-center flex-shrink-0">
                    <FiStar size={16} className="text-[#CB202D]" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[13px] font-semibold text-[#1F2937] truncate">{item.name}</p>
                    <p className="text-[11px] text-[#6B7280]">Tap to rate & write a review</p>
                  </div>
                  <FiChevronLeft size={16} className="text-[#9CA3AF] rotate-180 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTAs */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-white border-t border-[#EEF0F6] px-4 py-3 flex gap-2.5">
        <button onClick={() => navigate(`/orders?order_id=${orderId}`)} className="flex-1 h-12 rounded-full text-[14px] font-semibold text-white inline-flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})` }}>
          <FiTruck size={15} /> Track Order
        </button>
        <button onClick={() => navigate('/collection/all')} className="flex-1 h-12 rounded-full text-[14px] font-semibold border border-[#E5E7EB] text-[#1F2937] inline-flex items-center justify-center gap-2">
          <FiShoppingBag size={15} /> Shop More
        </button>
      </div>
    </div>
  )
}

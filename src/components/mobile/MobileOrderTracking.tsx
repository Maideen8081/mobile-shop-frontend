import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Copy, Check, Package, Truck, ShoppingBag, MapPin, Receipt, Star } from 'lucide-react'

const PURPLE = '#CB202D'
const PURPLE_DEEP = '#A81D2A'
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
  if (item?.image) {
    if (item.image.startsWith('http') || item.image.startsWith('data:')) return item.image
    const mapped = emojiToImage[item.image]
    if (mapped) return mapped
    return `${API_BASE_URL.replace(/\/$/, '')}/${item.image.replace(/^\//, '')}`
  }
  if (item?.emoji && emojiToImage[item.emoji]) return emojiToImage[item.emoji]
  return ''
}
function formatPrice(n: number): string {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', desc: 'Order placed & payment verified', icon: Package },
  { key: 'processing', label: 'Processing', desc: 'Items being packed & prepared', icon: Package },
  { key: 'shipped', label: 'Shipped', desc: 'Package handed to courier partner', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Delivery agent is on the way', icon: Truck },
  { key: 'delivered', label: 'Delivered', desc: 'Package delivered successfully', icon: Check },
] as const

const STATUS_INDEX: Record<string, number> = {
  confirmed: 0,
  processing: 1,
  shipped: 2,
  out_for_delivery: 3,
  delivered: 4,
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Confirmed', color: '#CB202D' },
  processing: { label: 'Processing', color: '#F59E0B' },
  shipped: { label: 'Shipped', color: '#3B82F6' },
  out_for_delivery: { label: 'Out for Delivery', color: '#FF5A65' },
  delivered: { label: 'Delivered', color: '#16A34A' },
}

export default function MobileOrderTracking() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const urlOrderId = params.get('order_id')

  const [orders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('order_history')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const [selectedOrder, setSelectedOrder] = useState<any | null>(() => {
    try {
      const list: any[] = JSON.parse(localStorage.getItem('order_history') || '[]')
      return urlOrderId ? list.find((o) => o.orderId === urlOrderId) || null : null
    } catch { return null }
  })

  if (selectedOrder) {
    return <OrderDetailView order={selectedOrder} onBack={() => (urlOrderId ? navigate('/orders') : setSelectedOrder(null))} />
  }

  return <OrderList orders={orders} onSelect={(o) => setSelectedOrder(o)} />
}

function OrderList({ orders, onSelect }: { orders: any[]; onSelect: (o: any) => void }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#FFFBFB] max-w-[480px] mx-auto pb-28 font-sans" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <MobileHeader title="My Orders" onBack={() => navigate(-1)} />

      <div className="px-4 mt-3">
        {orders.length === 0 ? (
          <div className={`${card} p-8 flex flex-col items-center text-center`}>
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4" style={{ background: 'rgba(203,32,45,0.1)' }}>
              <Package size={36} style={{ color: PURPLE }} />
            </div>
            <h2 className="text-[17px] font-bold text-[#1F2937]">No orders yet</h2>
            <p className="text-[12.5px] text-[#6B7280] mt-1.5 max-w-[240px]">Complete your first purchase to see orders here.</p>
            <button onClick={() => navigate('/collection/all')} className="mt-5 h-11 px-7 rounded-full text-white text-[13px] font-bold active:scale-95 transition"
              style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})` }}>
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, idx) => {
              const itemCount = order.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 0
              const currentStepIndex = STATUS_INDEX[order.status] ?? 0
              const badge = STATUS_BADGE[order.status] || STATUS_BADGE.confirmed
              const first = order.items?.[0]
              const imgUrl = resolveImage(first)
              return (
                <motion.button
                  key={order.orderId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => onSelect(order)}
                  className={`${card} p-3.5 w-full text-left active:scale-[0.99] transition flex items-center gap-3`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#FFFBFB] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {imgUrl ? <img src={imgUrl} alt="" className="w-full h-full object-contain p-1.5" onError={(e) => { (e.target as HTMLImageElement).src = '' }} /> : <Package size={22} className="text-[#9CA3AF]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-bold text-[#1F2937] truncate">{order.orderId}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: `${badge.color}1A`, color: badge.color }}>{badge.label}</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] truncate">{first?.name || 'Order'}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden max-w-[140px]">
                        <div className="h-full rounded-full" style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`, background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-[#6B7280] flex-shrink-0">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-bold" style={{ color: PURPLE }}>{formatPrice(order.total)}</p>
                    <ChevronRight size={16} className="text-[#C4C7D0] ml-auto mt-1" />
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function OrderDetailView({ order, onBack }: { order: any; onBack: () => void }) {
  const navigate = useNavigate()
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState(false)

  const currentStepIndex = STATUS_INDEX[order.status] ?? 0
  const isDelivered = order.status === 'delivered'
  const badge = STATUS_BADGE[order.status] || STATUS_BADGE.confirmed
  const items: any[] = order.items || []
  const itemCount = items.reduce((s, i) => s + (i.quantity || 1), 0)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  const copyId = () => {
    navigator.clipboard?.writeText(order.orderId)
    setCopied(true)
  }

  const progressPct = isDelivered ? 100 : Math.round(((currentStepIndex) / (STEPS.length - 1)) * 100)

  return (
    <div className="min-h-screen bg-[#FFFBFB] max-w-[480px] mx-auto pb-28 font-sans overflow-x-hidden" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <MobileHeader title="Track Order" onBack={onBack} />

      {/* Status banner */}
      <div className="relative px-4 pt-2 pb-6 overflow-hidden" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})` }}>
        <div className="absolute -top-10 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-8 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Truck size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white/80 text-[11px] font-semibold uppercase tracking-wide">Status</p>
            <p className="text-white text-[18px] font-bold leading-tight">{badge.label}</p>
          </div>
        </div>

        {/* vertical stepper */}
        <div className="relative mt-5 pl-1">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            const done = idx < currentStepIndex
            const active = idx === currentStepIndex
            const state = done ? 'done' : active ? 'active' : 'pending'
            return (
              <div key={step.key} className="flex gap-3 relative">
                {idx < STEPS.length - 1 && (
                  <span className="absolute left-[15px] top-9 bottom-1 w-[2px] rounded-full" style={{ background: done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.18)' }} />
                )}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${state === 'done' ? 'bg-white' : state === 'active' ? 'bg-white/90' : 'bg-white/15'}`}>
                  {state === 'done' ? (
                    <Check size={15} className="text-[#16A34A]" />
                  ) : state === 'active' ? (
                    <span className="w-3 h-3 rounded-full bg-[#16A34A] animate-pulse" />
                  ) : (
                    <Icon size={14} className="text-white/70" />
                  )}
                </div>
                <div className={`pb-5 ${state === 'pending' ? 'opacity-55' : ''}`}>
                  <p className="text-[13.5px] font-bold leading-tight" style={{ color: idx <= currentStepIndex ? '#fff' : 'rgba(255,255,255,0.7)' }}>{step.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-3">
        {/* Order id + delivery */}
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wide">Order ID</p>
              <p className="text-[15px] font-bold text-[#1F2937]">{order.orderId}</p>
            </div>
            <button onClick={copyId} className="flex items-center gap-1 h-9 px-3 rounded-full text-[12px] font-semibold" style={{ background: 'rgba(203,32,45,0.1)', color: PURPLE }}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="h-px bg-[#EEF0F6] my-3" />
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(203,32,45,0.1)' }}>
              <MapPin size={20} style={{ color: PURPLE }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wide">Estimated Delivery</p>
              <p className="text-[13.5px] font-bold text-[#1F2937] truncate">{order.deliveryDate || '—'}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[11px] font-semibold text-[#6B7280]">{isDelivered ? 'Completed' : 'Order Progress'}</span>
              <span className="text-[12px] font-bold" style={{ color: PURPLE }}>{progressPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${PURPLE}, ${PURPLE_DEEP})` }} />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className={`${card} p-4`}>
          <p className="text-[14px] font-bold text-[#1F2937] mb-3">Items ({itemCount})</p>
          <div className="space-y-1">
            {items.map((item, idx) => {
              const imgUrl = resolveImage(item)
              const hasImg = imgUrl && !imgErrors[item.productId]
              return (
                <div key={item.productId}>
                  {idx > 0 && <div className="h-px my-3 bg-[#EEF0F6]" />}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#FFFBFB] flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {hasImg ? (
                        <img src={imgUrl} alt={item.name} className="w-full h-full object-contain p-1.5" onError={() => setImgErrors(p => ({ ...p, [item.productId]: true }))} />
                      ) : (
                        <span className="text-2xl">{item.emoji || '📦'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1F2937] truncate">{item.name}</p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">Qty: {item.quantity}{item.storage ? ` · ${item.storage}` : ''}{item.color ? ` · ${item.color}` : ''}</p>
                    </div>
                    <span className="text-[13px] font-bold text-[#1F2937]">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Price summary */}
        <div className={`${card} p-4`}>
          <p className="text-[14px] font-bold text-[#1F2937] mb-3">Price Summary</p>
          <div className="space-y-2.5">
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />
            <Row label="Shipping" value={Number(order.shipping) === 0 ? 'FREE' : formatPrice(order.shipping)} highlight={Number(order.shipping) === 0} />
            <Row label="Tax" value={formatPrice(order.tax)} />
            <div className="h-px bg-[#EEF0F6] my-1" />
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-bold text-[#1F2937]">Total Paid</span>
              <span className="text-[17px] font-bold" style={{ color: PURPLE }}>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Review CTA */}
        <button onClick={() => navigate('/collection/all')} className={`${card} p-3.5 w-full flex items-center gap-3 active:scale-[0.99] transition`}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}><Star size={18} /></div>
          <div className="flex-1 text-left">
            <p className="text-[13px] font-semibold text-[#1F2937]">Rate your experience</p>
            <p className="text-[11px] text-[#6B7280]">Help others by reviewing your purchase</p>
          </div>
          <ChevronRight size={16} className="text-[#C4C7D0]" />
        </button>

        {/* Receipt */}
        <button
          onClick={() => {
            const receipt = `Order: ${order.orderId}\nDate: ${order.orderDate}\nTotal: ${formatPrice(order.total)}\nStatus: ${badge.label}`
            const blob = new Blob([receipt], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `receipt-${order.orderId}.txt`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className={`${card} p-3.5 w-full flex items-center gap-3 active:scale-[0.99] transition`}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(203,32,45,0.1)', color: PURPLE }}><Receipt size={18} /></div>
          <div className="flex-1 text-left">
            <p className="text-[13px] font-semibold text-[#1F2937]">Digital Receipt</p>
            <p className="text-[11px] text-[#6B7280]">Download order summary</p>
          </div>
          <ChevronRight size={16} className="text-[#C4C7D0]" />
        </button>
      </div>

      {/* Sticky CTAs */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-white border-t border-[#EEF0F6] px-4 py-3 flex gap-2.5 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <button onClick={() => navigate('/collection/all')} className="flex-1 h-12 rounded-full text-[14px] font-semibold border border-[#E5E7EB] text-[#1F2937] inline-flex items-center justify-center gap-2 active:scale-95 transition">
          <ShoppingBag size={15} /> Shop More
        </button>
        <button onClick={() => navigate('/orders')} className="flex-1 h-12 rounded-full text-[14px] font-semibold text-white inline-flex items-center justify-center gap-2 active:scale-95 transition"
          style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})` }}>
          <Package size={15} /> All Orders
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[12.5px]">
      <span className="text-[#6B7280]">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-[#16A34A]' : 'text-[#1F2937]'}`}>{value}</span>
    </div>
  )
}

function MobileHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-40 w-full bg-[#FFFBFB]/95 backdrop-blur-xl border-b border-[#EEF1F4]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="px-3 py-2.5 flex items-center gap-2.5">
        <button onClick={onBack} aria-label="Back" className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] shadow-[0_4px_14px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-90 transition flex-shrink-0">
          <ChevronLeft size={22} className="text-[#1F2937]" />
        </button>
        <h1 className="text-[16px] font-bold text-[#1F2937]">{title}</h1>
      </div>
    </div>
  )
}

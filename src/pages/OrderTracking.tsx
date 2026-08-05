import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { orderService } from '../services/orderService'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import BackBar from '../components/ecommerce/BackBar'
import EcommerceFooter from '../components/ecommerce/Footer'

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

interface OrderData {
  orderId: string
  displayOrderId: string
  items: OrderItem[]
  total: number
  subtotal: number
  shipping: number
  tax: number
  discount: number
  couponCode: string
  deliveryDate: string
  orderDate: string
  status: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const emojiToImage: Record<string, string> = {
  '📱': 'https://pngimg.com/d/iphone16_PNG37.png',
  '📲': 'https://pngimg.com/d/samsung_PNG2.png',
  '🎧': 'https://pngimg.com/d/headphones_PNGC7645.png',
  '⌚': 'https://pngimg.com/d/apple_watch_PNG19558.png',
  '📟': 'https://pngimg.com/d/ipad_PNG2133.png',
  '💻': 'https://pngimg.com/d/laptop_PNG101814.png',
  '🎮': 'https://pngimg.com/d/ps5_PNG31.png',
  '📷': 'https://pngimg.com/d/camera_PNG101583.png',
  '🛡️': 'https://pngimg.com/d/iphone15_PNG40.png',
}

function resolveImage(item: OrderItem): string {
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

const STEPS = [
  { key: 'order_placed', label: 'Order Placed', desc: 'Order placed & payment verified', icon: 'receipt_long' },
  { key: 'accepted', label: 'Order Accepted', desc: 'Order accepted by seller', icon: 'verified' },
  { key: 'processing', label: 'Processing', desc: 'Items being packed & prepared', icon: 'package_2' },
  { key: 'shipped', label: 'Shipped', desc: 'Package handed to courier partner', icon: 'local_shipping' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Delivery agent is on the way', icon: 'local_shipping' },
  { key: 'delivered', label: 'Delivered', desc: 'Package delivered successfully', icon: 'check_circle' },
] as const

const STATUS_INDEX: Record<string, number> = {
  order_placed: 0,
  accepted: 1,
  processing: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  order_placed: { label: 'Order Placed', color: '#6b7280' },
  accepted: { label: 'Accepted', color: '#0891b2' },
  processing: { label: 'Processing', color: '#f59e0b' },
  shipped: { label: 'Shipped', color: '#3b82f6' },
  out_for_delivery: { label: 'Out for Delivery', color: '#8b5cf6' },
  delivered: { label: 'Delivered', color: '#A81D2A' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
}

function emptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8" style={{
        background: 'linear-gradient(135deg, rgba(203,32,45,0.15), rgba(168,29,42,0.08))',
        border: '1px solid rgba(203,32,45,0.25)',
      }}>
        <span className="material-symbols-outlined text-5xl" style={{ color: '#A81D2A' }}>inventory_2</span>
      </div>
      <h2 className="text-2xl font-bold text-[#191c1d] mb-2">No orders yet</h2>
      <p className="text-sm text-[#3b4b3d]/70 mb-8">Complete your first purchase to see orders here.</p>
      <a href="/collection/all"
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold text-white transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
        style={{
          background: '#A81D2A',
          boxShadow: '0 4px 15px rgba(168,29,42,0.3)',
        }}
      >
        <span className="material-symbols-outlined">shopping_cart</span>
        Browse Products
      </a>
    </div>
  )
}

function StageIndicator({ currentStepIndex, order }: { currentStepIndex: number; order: OrderData }) {
  return (
    <section className="rounded-xl p-6 md:p-8 relative overflow-hidden" style={{
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.5)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
    }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-[#191c1d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Order Progress</h2>
        <span className="text-xs font-bold text-[#3b4b3d]/60" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {order.status === 'delivered' ? 'COMPLETED' : `Estimated Delivery: ${order.deliveryDate}`}
        </span>
      </div>
      <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-0">
        <div className="absolute top-8 left-8 right-8 h-0.5 bg-[#b9cbb9]/30 hidden md:block" />
        {STEPS.map((step, idx) => {
          const isActive = idx <= currentStepIndex
          const isCurrent = idx === currentStepIndex && order.status !== 'delivered'
          const statusLabel = () => {
            if (idx < currentStepIndex) return 'Completed'
            if (isCurrent) return step.label
            return 'Pending'
          }
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center text-center md:w-1/5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-500"
                style={{
                  background: isActive ? 'rgba(203,32,45,0.2)' : 'rgba(237,238,239,0.8)',
                  border: `2px solid ${isActive ? '#A81D2A' : 'rgba(185,203,185,0.3)'}`,
                  boxShadow: isActive ? '0 0 20px rgba(203,32,45,0.2)' : 'none',
                }}
              >
                {idx < currentStepIndex ? (
                  <span className="material-symbols-outlined text-xl" style={{ color: '#A81D2A', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                ) : isCurrent ? (
                  <div className="relative">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#CB202D' }} />
                    <div className="absolute inset-[-4px] rounded-full border-2 border-[#CB202D] animate-ping opacity-50" />
                  </div>
                ) : (
                  <span className="material-symbols-outlined text-xl" style={{ color: isActive ? '#A81D2A' : 'rgba(59,75,61,0.3)' }}>{step.icon}</span>
                )}
              </div>
              <h3 className="text-xs font-bold text-center" style={{
                fontFamily: 'Manrope, sans-serif',
                color: isActive ? '#191c1d' : 'rgba(59,75,61,0.4)',
              }}>{step.label}</h3>
              <p className="text-[10px] mt-1" style={{
                fontFamily: 'Manrope, sans-serif',
                color: isActive ? '#A81D2A' : 'rgba(59,75,61,0.3)',
              }}>
                {statusLabel()}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function OrderDetailView({ order, onBack }: { order: OrderData; onBack: () => void }) {
  const navigate = useNavigate()
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const currentStepIndex = STATUS_INDEX[order.status] ?? 0
  const isDelivered = order.status === 'delivered'
  const badge = STATUS_BADGE[order.status] || { label: 'Confirmed', color: '#A81D2A' }
  const items = order.items
  const firstItem = items[0]

  return (
    <main className="relative min-h-screen pb-16 overflow-hidden" style={{ background: '#f8f9fa' }}>
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-8 pt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold mb-6 transition-colors cursor-pointer"
          style={{ color: 'rgba(59,75,61,0.6)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#A81D2A'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(59,75,61,0.6)'}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Orders
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#191c1d] tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Order <span style={{ color: '#A81D2A' }}>#{order.displayOrderId || order.orderId}</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(59,75,61,0.7)' }}>Placed on {order.orderDate}</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full" style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${badge.color}20`,
          }}>
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: badge.color }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: badge.color, fontFamily: 'Manrope, sans-serif' }}>{badge.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <StageIndicator currentStepIndex={currentStepIndex} order={order} />

            <section className="rounded-xl p-6 relative overflow-hidden group" style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}>
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold" style={{
                  background: 'rgba(203,32,45,0.1)',
                  border: '1px solid rgba(203,32,45,0.2)',
                  color: '#A81D2A',
                }}>
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  PAYMENT CONFIRMED
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-full md:w-1/2 aspect-square relative flex items-center justify-center">
                  {firstItem && (() => {
                    const imgUrl = resolveImage(firstItem)
                    const hasImg = imgUrl && !imgErrors[firstItem.productId]
                    return hasImg ? (
                      <img
                        src={imgUrl}
                        alt={firstItem.name}
                        className="w-full h-full object-contain rounded-xl transition-transform duration-700 group-hover:scale-105"
                        onError={() => setImgErrors(p => ({ ...p, [firstItem.productId]: true }))}
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl flex items-center justify-center text-6xl" style={{ background: 'rgba(237,238,239,0.5)' }}>
                        {firstItem.emoji || '📦'}
                      </div>
                    )
                  })()}
                  <div className="absolute -bottom-3 -right-3 px-3 py-2 rounded-lg" style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(203,32,45,0.3)',
                  }}>
                    <div className="text-[8px] font-bold mb-0.5" style={{ color: '#A81D2A' }}>ORDER ID</div>
                    <div className="text-xs font-mono text-[#191c1d]" style={{ fontFamily: 'Manrope, sans-serif' }}>{order.displayOrderId || order.orderId}</div>
                  </div>
                </div>

                <div className="w-full md:w-1/2 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#191c1d]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {items.length} {items.length === 1 ? 'Item' : 'Items'}
                    </h2>
                    {firstItem && (
                      <p className="text-xs font-bold tracking-widest uppercase mt-1" style={{ color: 'rgba(59,75,61,0.6)' }}>
                        {firstItem.name}{firstItem.storage ? ` | ${firstItem.storage}` : ''}{firstItem.color ? ` | ${firstItem.color}` : ''}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-semibold" style={{ color: 'rgba(59,75,61,0.7)' }}>Order Progress</span>
                        <span className="text-sm font-bold" style={{ color: '#A81D2A' }}>{isDelivered ? '100%' : `${(currentStepIndex / (STEPS.length - 1)) * 100}%`}</span>
                      </div>
                      <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(237,238,239,0.8)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: isDelivered ? '100%' : `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #CB202D, #A81D2A)' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg" style={{ background: 'rgba(237,238,239,0.5)', border: '1px solid rgba(185,203,185,0.2)' }}>
                      <div className="text-[9px] uppercase font-bold mb-0.5" style={{ color: 'rgba(59,75,61,0.7)' }}>Items Count</div>
                      <div className="text-sm font-bold text-[#191c1d]">{items.reduce((s, i) => s + i.quantity, 0)} items</div>
                    </div>
                    <div className="p-2.5 rounded-lg" style={{ background: 'rgba(237,238,239,0.5)', border: '1px solid rgba(185,203,185,0.2)' }}>
                      <div className="text-[9px] uppercase font-bold mb-0.5" style={{ color: 'rgba(59,75,61,0.7)' }}>Total Value</div>
                      <div className="text-sm font-bold" style={{ color: '#A81D2A' }}>{formatPrice(order.total)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl p-6" style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}>
              <h2 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: 'rgba(59,75,61,0.7)' }}>Order Items</h2>
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const imgUrl = resolveImage(item)
                  const hasImg = imgUrl && !imgErrors[item.productId]
                  return (
                    <div key={item.productId}>
                      {idx > 0 && <div className="h-px my-3" style={{ background: 'rgba(185,203,185,0.3)' }} />}
                      <div className="flex items-center gap-4">
                        {hasImg ? (
                          <img src={imgUrl} alt={item.name}
                            className="w-14 h-14 rounded-xl object-cover"
                            onError={() => setImgErrors(p => ({ ...p, [item.productId]: true }))}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(237,238,239,0.8)' }}>
                            {item.emoji || '📦'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#191c1d] truncate">{item.name}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(59,75,61,0.6)' }}>
                            Qty: {item.quantity}
                            {item.storage && ` | ${item.storage}`}
                            {item.ram && ` | ${item.ram}`}
                            {item.color && ` | ${item.color}`}
                          </p>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#A81D2A' }}>{formatPrice(item.price)}</span>
                        <span className="material-symbols-outlined text-sm" style={{ color: '#A81D2A' }}>check_circle</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-xl p-6" style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(203,32,45,0.1)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}>
              <h3 className="text-xs font-bold mb-4 flex items-center gap-2 uppercase tracking-wider" style={{ color: 'rgba(59,75,61,0.7)' }}>
                <span className="material-symbols-outlined text-sm">list_alt</span>
                Order Details
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold" style={{ color: 'rgba(59,75,61,0.6)' }}>Estimated Delivery</span>
                  <span className="text-sm font-semibold text-[#191c1d]">{order.deliveryDate}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold" style={{ color: 'rgba(59,75,61,0.6)' }}>Shipping Method</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg" style={{ color: '#A81D2A' }}>speed</span>
                    <span className="text-sm font-bold text-[#191c1d]">{order.shipping === 0 ? 'Free Shipping' : 'Express Delivery'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold" style={{ color: 'rgba(59,75,61,0.6)' }}>Order Date</span>
                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: 'rgba(203,32,45,0.05)', color: '#A81D2A' }}>{order.orderDate}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold" style={{ color: 'rgba(59,75,61,0.6)' }}>Payment Status</span>
                  <span className="text-xs italic" style={{ color: '#A81D2A' }}>Completed ✓</span>
                </div>
              </div>

              <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(185,203,185,0.3)' }}>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(248,249,250,0.8)', border: '1px solid rgba(185,203,185,0.1)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: '#A81D2A' }}>
                    PF
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#191c1d]">PhoneFix Pro</div>
                    <div className="text-[9px] uppercase" style={{ color: 'rgba(59,75,61,0.6)' }}>Verified Merchant</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl p-6" style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}>
              <h3 className="text-xs font-bold mb-4 uppercase tracking-wider" style={{ color: 'rgba(59,75,61,0.7)' }}>Price Summary</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs" style={{ color: 'rgba(59,75,61,0.8)' }}>
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#191c1d]">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: 'rgba(59,75,61,0.8)' }}>
                  <span>Shipping</span>
                  <span className="font-semibold" style={{ color: order.shipping === 0 ? '#A81D2A' : '#191c1d' }}>
                    {order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: 'rgba(59,75,61,0.8)' }}>
                  <span>Tax (12%)</span>
                  <span className="font-semibold text-[#191c1d]">{formatPrice(order.tax)}</span>
                </div>
                {order.discount ? (
                  <div className="flex justify-between text-xs" style={{ color: 'rgba(59,75,61,0.8)' }}>
                    <span>Coupon ({order.couponCode})</span>
                    <span className="font-semibold" style={{ color: '#A81D2A' }}>-{formatPrice(order.discount)}</span>
                  </div>
                ) : null}
                <div className="h-px" style={{ background: 'rgba(185,203,185,0.3)' }} />
                <div className="flex justify-between text-sm font-bold text-[#191c1d] pt-1">
                  <span>Total</span>
                  <span style={{ color: '#A81D2A' }}>{formatPrice(order.total)}</span>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3">
              {isDelivered && items.length > 0 && (
                <button
                  onClick={() => {
                    const first = items[0]
                    if (first?.productId) {
                      const params = new URLSearchParams({ order_id: String(order.orderId), rate: 'true' })
                      navigate(`/product/${first.productId}?${params.toString()}`)
                    }
                  }}
                  className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff',
                    boxShadow: '0 4px 15px rgba(245,158,11,0.25)',
                  }}
                >
                  <span className="material-symbols-outlined">star</span>
                  Rate Your Experience
                </button>
              )}
              <button
                onClick={() => navigate('/collection/all')}
                className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                style={{
                  background: '#A81D2A',
                  color: '#fff',
                  boxShadow: '0 4px 15px rgba(168,29,42,0.25)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#C0232E'; e.currentTarget.style.boxShadow = '0 6px 25px rgba(168,29,42,0.35)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#A81D2A'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(168,29,42,0.25)' }}
              >
                <span className="material-symbols-outlined">dashboard_customize</span>
                Continue Shopping
              </button>
              <button
                onClick={() => {
                  const displayId = order.displayOrderId || order.orderId
                  const receipt = `Order: ${displayId}\nDate: ${order.orderDate}\nTotal: ${formatPrice(order.total)}\nStatus: ${badge.label}`
                  const blob = new Blob([receipt], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `receipt-${displayId}.txt`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                style={{
                  background: 'rgba(237,238,239,0.6)',
                  color: '#191c1d',
                  border: '1px solid rgba(185,203,185,0.3)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(237,238,239,0.9)'; e.currentTarget.style.borderColor = 'rgba(185,203,185,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(237,238,239,0.6)'; e.currentTarget.style.borderColor = 'rgba(185,203,185,0.3)' }}
              >
                <span className="material-symbols-outlined">download</span>
                Export Digital Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGE[status] || { label: 'Confirmed', color: '#A81D2A' }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
      style={{ background: `${badge.color}15`, color: badge.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.color }} />
      {badge.label}
    </span>
  )
}

export default function OrderTracking() {
  const [params] = useSearchParams()
  const urlOrderId = params.get('order_id')

  const [orders, setOrders] = useState<OrderData[]>(() => {
    try {
      const saved = localStorage.getItem('order_history')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(() => {
    if (!urlOrderId) return null
    try {
      const saved = localStorage.getItem('order_history')
      const list: OrderData[] = saved ? JSON.parse(saved) : []
      return list.find(o => String(o.orderId) === urlOrderId) || null
    } catch { return null }
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const apiOrders = await orderService.list()
        if (cancelled || apiOrders.length === 0) return
        const mapped: OrderData[] = apiOrders.map(o => ({
          orderId: String(o.id),
          displayOrderId: o.order_id,
          items: (o.items || []).map((it: any) => ({
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
          discount: o.discount || 0,
          couponCode: o.coupon_code || '',
          deliveryDate: o.est_delivery,
          orderDate: o.created_at,
          status: (o.delivery_status as any) || 'order_placed',
        }))
        if (!cancelled) {
          setOrders(mapped)
          localStorage.setItem('order_history', JSON.stringify(mapped.slice(0, 50)))
        }
        if (urlOrderId && !cancelled) {
          const found = mapped.find(o => o.orderId === urlOrderId)
          if (found) setSelectedOrder(found)
        }
      } catch {}
    }
    load()
    return () => { cancelled = true }
  }, [urlOrderId])

  if (selectedOrder) {
    return (
      <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
        <SiteTopNav />
        <BackBar label="Back to Orders" to="/orders" />
        <OrderDetailView order={selectedOrder} onBack={() => setSelectedOrder(null)} />
        <EcommerceFooter compact />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>

      <SiteTopNav />
      <BackBar label="Back to Home" to="/" />

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 pt-4 pb-16">
        <div className="rounded-xl p-6 md:p-8" style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, rgba(203,32,45,0.15), rgba(168,29,42,0.08))',
              border: '1px solid rgba(203,32,45,0.25)',
            }}>
              <span className="material-symbols-outlined text-2xl" style={{ color: '#A81D2A' }}>inventory_2</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1d] tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>My Orders</h1>
              <p className="text-sm" style={{ color: 'rgba(59,75,61,0.7)' }}>Track and manage your orders</p>
            </div>
          </div>

          {orders.length === 0 ? (
            emptyState()
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map((order, idx) => {
                const itemCount = order.items.reduce((s, i) => s + i.quantity, 0)
                const currentStepIndex = STATUS_INDEX[order.status] ?? 0
                return (
                  <motion.button
                    key={order.orderId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => setSelectedOrder(order)}
                    className="w-full text-left rounded-xl p-5 transition-all cursor-pointer group"
                    style={{
                      background: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(185,203,185,0.3)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; e.currentTarget.style.borderColor = 'rgba(203,32,45,0.3)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(185,203,185,0.3)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(59,75,61,0.5)' }}>Order</span>
                          <span className="text-sm font-bold" style={{ color: '#A81D2A' }}>{order.displayOrderId || order.orderId}</span>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="text-xs mb-2" style={{ color: 'rgba(59,75,61,0.6)' }}>{order.orderDate}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-[11px]" style={{ color: 'rgba(59,75,61,0.6)' }}>
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </span>
                          <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
                            {[0, 1, 2, 3, 4].map(i => (
                              <div
                                key={i}
                                className="h-1.5 flex-1 rounded-full transition-all"
                                style={{
                                  background: i <= currentStepIndex
                                    ? 'linear-gradient(90deg, #CB202D, #A81D2A)'
                                    : 'rgba(185,203,185,0.3)',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-center gap-4">
                        <div>
                          <p className="text-base font-extrabold" style={{ color: '#A81D2A' }}>{formatPrice(order.total)}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(59,75,61,0.5)' }}>
                            {STEPS[Math.min(currentStepIndex, STEPS.length - 1)]?.label || 'Confirmed'}
                          </p>
                        </div>
                        <motion.div
                          whileHover={{ x: 3 }}
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(203,32,45,0.1)' }}
                        >
                          <span className="material-symbols-outlined text-sm" style={{ color: '#A81D2A' }}>chevron_right</span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <EcommerceFooter compact />
    </div>
  )
}

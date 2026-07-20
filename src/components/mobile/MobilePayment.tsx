import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLoader, FiCheck, FiChevronLeft } from 'react-icons/fi'
import { getImageUrl, useIsMobile } from './helpers'
import { useMobileToast } from './useMobileToast'

const PURPLE = '#6C3BFF'
const PURPLE_DEEP = '#4B2ECC'
const SUCCESS = '#16A34A'
const card = 'bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]'

const FREE_SHIPPING_THRESHOLD = 1200
const TAX_RATE = 0.12
const DELIVERY_CHARGE = 49
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

type PaymentMethod = 'card' | 'razorpay' | 'paypal' | 'netbanking' | 'cod'

const paymentMethods: { id: PaymentMethod; label: string; subtitle: string; icon: any }[] = [
  { id: 'card', label: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, RuPay', icon: '💳' },
  { id: 'razorpay', label: 'UPI / Razorpay', subtitle: 'GPay, PhonePe, Paytm', icon: '📲' },
  { id: 'paypal', label: 'PayPal', subtitle: 'International payments', icon: '🌐' },
  { id: 'netbanking', label: 'Net Banking', subtitle: 'All major banks', icon: '🏦' },
  { id: 'cod', label: 'Cash on Delivery', subtitle: 'Pay on delivery', icon: '💵' },
]

export default function MobilePayment() {
  const navigate = useNavigate()
  const { show: showToast, Toast } = useMobileToast()
  const [items, setItems] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
  })
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const handler = () => {
      try { setItems(JSON.parse(localStorage.getItem('cart') || '[]')) } catch { setItems([]) }
    }
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_CHARGE
  const tax = Math.round(subtotal * TAX_RATE)
  const grandTotal = subtotal + shipping + tax

  const isCartEmpty = items.length === 0 && !processing && !success

  const handlePayment = async () => {
    setProcessing(true)
    try {
      if (selectedMethod !== 'cod') await new Promise((resolve) => setTimeout(resolve, 2000))
      setSuccess(true)
      const isCod = selectedMethod === 'cod'
      showToast(isCod ? 'Order placed successfully!' : 'Payment successful!', 'success')
      const orderId = 'ORD-' + String(Math.random()).slice(2, 10).toUpperCase()
      const d = new Date()
      d.setDate(d.getDate() + 5)
      const lastOrder = {
        orderId, items, total: grandTotal, subtotal, shipping, tax,
        paymentMethod: isCod ? 'Cash on Delivery' : selectedMethod,
        deliveryDate: d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        orderDate: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        status: 'confirmed' as const,
      }
      localStorage.setItem('last_order', JSON.stringify(lastOrder))
      const history = JSON.parse(localStorage.getItem('order_history') || '[]')
      history.unshift(lastOrder)
      localStorage.setItem('order_history', JSON.stringify(history.slice(0, 50)))
      localStorage.removeItem('cart')
      window.dispatchEvent(new Event('cart-updated'))
      setTimeout(() => navigate(`/checkout/success?order_id=${orderId}`), 1500)
    } catch {
      showToast('Payment failed. Please try again.', 'error')
    }
    setProcessing(false)
  }

  if (isCartEmpty) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] max-w-[480px] mx-auto flex flex-col" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
        <div className="sticky top-0 z-30 bg-[#F8F9FF] px-4 pt-3 pb-3 border-b border-[#EEF0F6] flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-[0_4px_14px_rgba(108,59,255,0.12)]">
            <FiChevronLeft size={20} style={{ color: PURPLE }} />
          </button>
          <h1 className="text-[18px] font-bold text-[#1F2937]">Payment</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className={`${card} w-16 h-16 rounded-2xl flex items-center justify-center mb-5 text-3xl`}>🛒</div>
          <h2 className="text-[18px] font-bold text-[#1F2937] mb-1">No items to settle</h2>
          <p className="text-[13px] text-[#6B7280] mb-6">Add items to cart before checkout</p>
          <button onClick={() => navigate('/collection/all')} className="h-12 px-7 rounded-full text-[14px] font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})` }}>
            Continue Shopping
          </button>
        </div>
      {Toast}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] max-w-[480px] mx-auto pb-28" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <div className="sticky top-0 z-30 bg-[#F8F9FF] px-4 pt-3 pb-3 border-b border-[#EEF0F6] flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-[0_4px_14px_rgba(108,59,255,0.12)]">
          <FiChevronLeft size={20} style={{ color: PURPLE }} />
        </button>
        <div className="flex-1">
          <h1 className="text-[18px] font-bold text-[#1F2937]">Complete Payment</h1>
          <p className="text-[11px] text-[#6B7280]">Step 3 of 3 · Secure checkout</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="px-5 pt-1 pb-2 flex items-center">
        {['Cart', 'Address', 'Payment'].map((label, i) => {
          const step = i + 1
          const done = step < 3
          const active = step === 3
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition ${done ? 'text-white' : active ? 'text-white' : 'bg-white text-[#9CA3AF] border border-[#E5E7EB]'}`}
                  style={done || active ? { background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` } : undefined}>
                  {done ? <FiCheck size={14} /> : step}
                </div>
                <span className={`text-[10px] mt-1 font-semibold ${active ? '' : 'text-[#9CA3AF]'}`} style={active ? { color: PURPLE } : undefined}>{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-[2px] mx-1.5 rounded-full ${done ? '' : 'bg-[#E5E7EB]'}`} style={done ? { background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` } : undefined} />}
            </div>
          )
        })}
      </div>

      <div className="px-4 pt-2 space-y-4">
        {/* Order summary */}
        <div className={`${card} rounded-[20px] p-4`}>
          <h3 className="text-[14px] font-bold text-[#1F2937] mb-3">Order Summary</h3>
          <div className="space-y-3">
            {items.map((item) => {
              const imgUrl = resolveImage(item)
              const hasImg = imgUrl && !imgErrors[item.productId]
              return (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-[14px] bg-[#F8F9FF] flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                    {hasImg ? (
                      <img src={imgUrl} alt={item.name} className="w-full h-full object-contain"
                        onError={() => setImgErrors((p) => ({ ...p, [item.productId]: true }))} />
                    ) : (
                      <span className="text-2xl">{item.emoji || '📦'}</span>
                    )}
                    {item.quantity > 1 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center" style={{ background: PURPLE }}>{item.quantity}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#1F2937] truncate">{item.name}</p>
                    {item.storage && <p className="text-[11px] text-[#6B7280]">{item.storage}</p>}
                  </div>
                  <span className="text-[13px] font-bold text-[#1F2937]">{formatPrice(item.price * item.quantity)}</span>
                </div>
              )
            })}
          </div>
          <div className="h-px bg-[#EEF0F6] my-3" />
          <div className="space-y-1.5 text-[12px]">
            <div className="flex justify-between text-[#6B7280]"><span>Subtotal</span><span className="font-semibold text-[#1F2937]">{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-[#6B7280]"><span>Shipping</span><span className="font-semibold" style={{ color: shipping === 0 ? SUCCESS : '#1F2937' }}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
            <div className="flex justify-between text-[#6B7280]"><span>Tax (GST)</span><span className="font-semibold text-[#1F2937]">{formatPrice(tax)}</span></div>
          </div>
          <div className="h-px bg-[#EEF0F6] my-3" />
          <div className="flex justify-between items-end">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">Grand Total</span>
            <span className="text-[20px] font-bold text-[#1F2937]">{formatPrice(grandTotal)}</span>
          </div>
        </div>

        {/* Payment methods */}
        <div>
          <h3 className="text-[14px] font-bold text-[#1F2937] mb-2 px-1">Payment Method</h3>
          <div className="space-y-2.5">
            {paymentMethods.map((pm) => {
              const active = selectedMethod === pm.id
              return (
                <button key={pm.id} onClick={() => setSelectedMethod(pm.id)}
                  className={`w-full ${card} rounded-[18px] p-3.5 flex items-center gap-3 border-2 transition`}
                  style={{ borderColor: active ? PURPLE : 'transparent' }}>
                  <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl flex-shrink-0" style={{ background: active ? 'rgba(108,59,255,0.1)' : '#F8F9FF' }}>{pm.icon}</div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[13px] font-semibold text-[#1F2937]">{pm.label}</p>
                    <p className="text-[11px] text-[#6B7280]">{pm.subtitle}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? 'border-[#4FE3C1]' : 'border-[#D1D5DB]'}`}
                    style={active ? { background: SUCCESS } : undefined}>
                    {active && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Contextual method panel */}
          {selectedMethod === 'razorpay' && (
            <div className={`${card} rounded-[18px] p-4 mt-2`}>
              <p className="text-[12px] font-semibold text-[#6B7280] mb-3">Pay using UPI apps</p>
              <div className="grid grid-cols-4 gap-2.5">
                {[{ n: 'GPay', e: '🟢' }, { n: 'PhonePe', e: '🟣' }, { n: 'Paytm', e: '🔵' }, { n: 'UPI', e: '🅰️' }].map(a => (
                  <button key={a.n} onClick={handlePayment} disabled={processing}
                    className="h-16 rounded-[14px] bg-[#F8F9FF] flex flex-col items-center justify-center gap-1 active:scale-95 transition disabled:opacity-60">
                    <span className="text-xl">{a.e}</span>
                    <span className="text-[10px] font-semibold text-[#1F2937]">{a.n}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <input placeholder="enter UPI ID (name@bank)" className="flex-1 h-11 px-3 rounded-2xl text-[13px] bg-[#F8F9FF] border border-[#E5E7EB] outline-none" style={{ color: '#1F2937' }} />
                <button onClick={handlePayment} disabled={processing} className="h-11 px-5 rounded-2xl text-[13px] font-bold text-white disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>Pay</button>
              </div>
            </div>
          )}
          {selectedMethod === 'card' && (
            <div className={`${card} rounded-[18px] p-4 mt-2 space-y-3`}>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">Card Number</label>
                <input inputMode="numeric" placeholder="1234 5678 9012 3456" className="w-full h-12 px-3.5 rounded-2xl text-[14px] bg-[#F8F9FF] border border-[#E5E7EB] outline-none" style={{ color: '#1F2937' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">Expiry</label>
                  <input placeholder="MM/YY" className="w-full h-12 px-3.5 rounded-2xl text-[14px] bg-[#F8F9FF] border border-[#E5E7EB] outline-none" style={{ color: '#1F2937' }} />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">CVV</label>
                  <input placeholder="•••" className="w-full h-12 px-3.5 rounded-2xl text-[14px] bg-[#F8F9FF] border border-[#E5E7EB] outline-none" style={{ color: '#1F2937' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 pt-1">
          <span style={{ color: SUCCESS }}>🔒</span>
          <p className="text-[11px] text-[#6B7280]">256-bit encrypted · PCI DSS compliant</p>
        </div>
      </div>

      {/* Fixed pay button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-white border-t border-[#EEF0F6] px-4 py-3">
        <button onClick={handlePayment} disabled={processing}
          className="w-full h-12 rounded-full text-[14px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})` }}>
          {processing ? <><FiLoader size={18} className="animate-spin" /> PAYING…</> : <>Pay {formatPrice(grandTotal)}</>}
        </button>
      </div>

      {success && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-8" style={{ backdropFilter: 'blur(6px)' }}>
          <div className={`${card} rounded-[24px] p-8 flex flex-col items-center text-center animate-[fadeInUp_.4s_ease]`}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${SUCCESS}, #15803D)` }}>
              <FiCheck size={36} className="text-white" />
            </div>
            <p className="text-[18px] font-bold text-[#1F2937]">Payment Successful!</p>
            <p className="text-[12px] text-[#6B7280] mt-1">Your order has been placed</p>
            <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF] mt-4">
              <FiLoader size={12} className="animate-spin" /> Redirecting to confirmation…
            </div>
          </div>
        </div>
      )}
      {Toast}
    </div>
  )
}

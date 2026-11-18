import { useState, useEffect, useMemo } from 'react'
import { apiErrorMessage, computeTotals, formatINR as formatPrice, gstLabel } from '../../utils/checkout'
import { useNavigate } from 'react-router-dom'
import { FiCheck, FiChevronLeft } from 'react-icons/fi'
import { useMobileToast } from './useMobileToast'
import { orderService } from '../../services/orderService'
import { authService } from '../../services/authService'
import { cartService } from '../../services/cartService'
import { readCheckoutCoupon, saveCheckoutCoupon, saveOrderConfirmation } from '../../utils/checkout'
import CheckoutOffers from '../checkout/CheckoutOffers'
import PlaceOrderButton from '../checkout/PlaceOrderButton'
import PageLoading from '../ui/PageLoading'

const STEP_COLORS = ['#0f3b2c', '#b4462f', '#b45309']
const STEP_DEEP = ['#18503c', '#8f3523', '#8a3d08']
const PURPLE = '#0f3b2c'
const PURPLE_DEEP = '#18503c'
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

type PaymentMethod = 'card' | 'razorpay' | 'paypal' | 'netbanking' | 'cod'

const paymentMethods: { id: PaymentMethod; label: string; subtitle: string; icon: string; comingSoon?: boolean }[] = [
  { id: 'cod', label: 'Cash on Delivery', subtitle: 'Pay on delivery', icon: '💵' },
  { id: 'card', label: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, RuPay', icon: '💳', comingSoon: true },
  { id: 'razorpay', label: 'UPI / Razorpay', subtitle: 'GPay, PhonePe, Paytm', icon: '📲', comingSoon: true },
  { id: 'paypal', label: 'PayPal', subtitle: 'International payments', icon: '🌐', comingSoon: true },
  { id: 'netbanking', label: 'Net Banking', subtitle: 'All major banks', icon: '🏦', comingSoon: true },
]

export default function MobilePayment() {
  const navigate = useNavigate()
  const { show: showToast, Toast } = useMobileToast()
  const [items, setItems] = useState<any[]>([])
  const [cartLoading, setCartLoading] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cod')
  const [processing, setProcessing] = useState(false)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})

  useEffect(() => {
    setCartLoading(true)
    cartService.getItems().then(setItems).catch(() => setItems([])).finally(() => setCartLoading(false))
    const handler = () => {
      cartService.getItems().then(setItems)
    }
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  const checkoutAddressId = useMemo(() => {
    try { return Number(localStorage.getItem('checkout_address_id') || '0') || null } catch { return null }
  }, [])

  useEffect(() => {
    if (!checkoutAddressId) navigate('/checkout/address', { replace: true })
  }, [checkoutAddressId, navigate])

  const [checkoutCoupon, setCheckoutCoupon] = useState(readCheckoutCoupon)

  // Use the same pricing rules as the order API.
  // grandTotal is declared below; canPlace is derived after it.
  const { subtotal, shipping, tax, discount, total: grandTotal } = useMemo(
    () => computeTotals(items, checkoutCoupon?.discount || 0),
    [items, checkoutCoupon],
  )
  const canPlace = selectedMethod === 'cod' && items.length > 0

  if (!checkoutAddressId || cartLoading) return <PageLoading label="Loading payment details…" className="min-h-dvh" />

  const isCartEmpty = items.length === 0 && !processing

  const handlePayment = async () => {
    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', '/checkout/payment')
      showToast('Please login to complete your order', 'error')
      navigate('/login')
      return
    }
    // Only Cash on Delivery is live; never pretend an online payment happened.
    if (!canPlace) return
    setProcessing(true)
    try {
      const apiOrder = await orderService.create({
        items: items.map((it: any) => ({
          product_id: it.productId || 0,
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
          category: it.category || '',
        })),
        total: grandTotal,
        subtotal,
        shipping,
        tax,
        payment_method: 'cod',
        delivery_address_id: checkoutAddressId,
        discount: checkoutCoupon?.discount || 0,
        coupon_code: checkoutCoupon?.code || undefined,
      })

      const d = new Date()
      d.setDate(d.getDate() + 5)

      const lastOrder = {
        orderId: apiOrder.id,
        items,
        total: Number(apiOrder.grand_total ?? grandTotal),
        subtotal: Number(apiOrder.subtotal ?? subtotal),
        shipping: Number(apiOrder.shipping_charge ?? shipping),
        tax: Number(apiOrder.tax ?? tax),
        discount: Number(apiOrder.discount ?? discount),
        couponCode: apiOrder.coupon_code || '',
        paymentMethod: 'Cash on Delivery',
        deliveryDate: apiOrder.est_delivery || d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        orderDate: apiOrder.created_at || new Date().toISOString(),
        status: apiOrder.delivery_status || 'order_placed',
      }
      saveOrderConfirmation(lastOrder)
      await cartService.clearCart().catch(() => {})
      showToast('Order placed successfully!', 'success')
      navigate(`/checkout/success?order_id=${apiOrder.id}`, { replace: true })
    } catch (error) {
      showToast(apiErrorMessage(error, 'We couldn’t place your order. Please try again.'), 'error')
      setProcessing(false)
    }
  }

  if (isCartEmpty) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] max-w-[480px] mx-auto flex flex-col" style={{ fontFamily: 'var(--font-ui)' }}>
        <div className="sticky top-0 z-30 bg-[#f7f6f2] px-4 pt-3 pb-3 border-b border-[#ece9e2] flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-[8px] bg-white flex items-center justify-center shadow-[0_4px_14px_rgba(15,59,44,0.12)]">
            <FiChevronLeft size={20} style={{ color: PURPLE }} />
          </button>
          <h1 className="text-title-sm font-bold text-[#1d2522]">Payment</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className={`${card} w-16 h-16 rounded-2xl flex items-center justify-center mb-5 text-3xl`}>🛒</div>
          <h2 className="text-title-sm font-bold text-[#1d2522] mb-1">No items to settle</h2>
          <p className="text-label text-[#5d6762] mb-6">Add items to cart before checkout</p>
          <button onClick={() => navigate('/collection/all')} className="h-12 px-7 rounded-[8px] text-body-sm font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})` }}>
            Continue Shopping
          </button>
        </div>
      {Toast}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] max-w-[480px] mx-auto pb-28" style={{ fontFamily: 'var(--font-ui)' }}>
      <div className="sticky top-0 z-30 bg-[#f7f6f2] px-4 pt-3 pb-3 border-b border-[#ece9e2] flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-[8px] bg-white flex items-center justify-center shadow-[0_4px_14px_rgba(15,59,44,0.12)]">
          <FiChevronLeft size={20} style={{ color: PURPLE }} />
        </button>
        <div className="flex-1">
          <h1 className="text-title-sm font-bold text-[#1d2522]">Complete Payment</h1>
          <p className="text-micro text-[#5d6762]">Step 3 of 3 · Secure checkout</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="px-5 pt-1 pb-2 flex items-center">
        {['Cart', 'Address', 'Payment'].map((label, i) => {
          const step = i + 1
          const done = step < 3
          const active = step === 3
          const color = STEP_COLORS[i]
          const deep = STEP_DEEP[i]
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center text-micro font-bold transition ${done ? 'text-white' : active ? 'text-white' : 'bg-white text-[#9aa29e] border border-[#ece9e2]'}`}
                  style={done || active ? { background: `linear-gradient(135deg,${color},${deep})` } : undefined}>
                  {done ? <FiCheck size={14} /> : step}
                </div>
                <span className={`text-micro mt-1 font-semibold ${active ? '' : 'text-[#9aa29e]'}`} style={active ? { color } : undefined}>{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-[2px] mx-1.5 rounded-[8px] ${done ? '' : 'bg-[#ece9e2]'}`} style={done ? { background: `linear-gradient(135deg,${color},${deep})` } : undefined} />}
            </div>
          )
        })}
      </div>

      <div className="px-4 pt-2 space-y-4">
        {/* Order summary */}
        <div className={`${card} rounded-[20px] p-4`}>
          <h3 className="text-body-sm font-bold text-[#1d2522] mb-3">Order Summary</h3>
          <div className="space-y-3">
            {items.map((item) => {
              const imgUrl = resolveImage(item)
              const hasImg = imgUrl && !imgErrors[item.productId]
              return (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-[14px] bg-[#f7f6f2] flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                    {hasImg ? (
                      <img src={imgUrl} alt={item.name} className="w-full h-full object-contain"
                        onError={() => setImgErrors((p) => ({ ...p, [item.productId]: true }))} />
                    ) : (
                      <span className="text-2xl">{item.emoji || '📦'}</span>
                    )}
                    {item.quantity > 1 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-[8px] text-white text-micro font-bold flex items-center justify-center" style={{ background: PURPLE }}>{item.quantity}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-label font-semibold text-[#1d2522] truncate">{item.name}</p>
                    {item.storage && <p className="text-micro text-[#5d6762]">{item.storage}</p>}
                  </div>
                  <span className="text-label font-bold text-[#1d2522]">{formatPrice(item.price * item.quantity)}</span>
                </div>
              )
            })}
          </div>
          <div className="h-px bg-[#ece9e2] my-3" />
          <div className="space-y-1.5 text-caption">
            <div className="flex justify-between text-[#5d6762]"><span>Subtotal</span><span className="font-semibold text-[#1d2522]">{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-[#5d6762]"><span>Shipping</span><span className="font-semibold" style={{ color: shipping === 0 ? SUCCESS : '#1d2522' }}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
            <div className="flex justify-between text-[#5d6762]"><span>{gstLabel()}</span><span className="font-semibold text-[#1d2522]">{formatPrice(tax)}</span></div>
            {discount > 0 && <div className="flex justify-between text-[#5d6762]"><span>Coupon ({checkoutCoupon?.code})</span><span className="font-semibold" style={{ color: SUCCESS }}>-{formatPrice(discount)}</span></div>}
          </div>
          <div className="h-px bg-[#ece9e2] my-3" />
          <div className="flex justify-between items-end">
            <span className="text-micro font-semibold uppercase tracking-wide text-[#5d6762]">Grand Total</span>
            <span className="text-title font-bold text-[#1d2522]">{formatPrice(grandTotal)}</span>
          </div>
        </div>

        {items.length > 0 && (
          <CheckoutOffers
            productIds={items.map((item) => Number(item.productId)).filter(Boolean)}
            subtotal={subtotal}
            disabled={processing}
            appliedCoupon={checkoutCoupon}
            onChange={(next) => {
              saveCheckoutCoupon(next)
              setCheckoutCoupon(next)
            }}
          />
        )}
        {/* Payment methods */}
        <div>
          <h3 className="text-body-sm font-bold text-[#1d2522] mb-2 px-1">Payment Method</h3>
          <div className="space-y-2.5">
            {paymentMethods.map((pm) => {
              const active = selectedMethod === pm.id
              const disabled = !!pm.comingSoon
              return (
                <button key={pm.id} onClick={() => {
                    if (pm.comingSoon) { showToast('Coming soon — Currently only Cash on Delivery is available', 'error'); return }
                    setSelectedMethod(pm.id)
                  }}
                  disabled={disabled && !active}
                  className={`w-full ${card} rounded-[18px] p-3.5 flex items-center gap-3 border-2 transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ borderColor: active ? PURPLE : 'transparent' }}>
                  <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl flex-shrink-0" style={{ background: active ? 'rgba(15,59,44,0.1)' : '#f7f6f2' }}>{pm.icon}</div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-label font-semibold text-[#1d2522]">{pm.label}</p>
                      {pm.comingSoon && <span className="text-micro font-bold px-1.5 py-0.5 rounded-[8px] bg-amber-100 text-amber-700">Coming Soon</span>}
                    </div>
                    <p className="text-micro text-[#5d6762]">{pm.subtitle}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-[8px] border-2 flex items-center justify-center ${active ? 'border-[#4FE3C1]' : 'border-[#D1D5DB]'}`}
                    style={active ? { background: SUCCESS } : undefined}>
                    {active && <div className="w-2 h-2 rounded-[8px] bg-white" />}
                  </div>
                </button>
              )
            })}
          </div>

          <p className="mt-2 text-micro text-[#5d6762]">
            By placing this order you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/refund-policy" className="underline">Refund Policy</a>.
          </p>
        </div>
      </div>

      {/* Fixed pay button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-white border-t border-[#ece9e2] px-4 py-3">
        <PlaceOrderButton total={grandTotal} disabled={!canPlace} placing={processing} onPlaceOrder={handlePayment} />
      </div>

      {Toast}
    </div>
  )
}

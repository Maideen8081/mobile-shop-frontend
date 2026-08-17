import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLoader } from 'react-icons/fi'
import DesktopPageLoader from '../components/ui/DesktopPageLoader'
import EcommerceFooter from '../components/ecommerce/Footer'
import { useToast } from '../context/ToastContext'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import MobilePayment from '../components/mobile/MobilePayment'
import { useIsMobile } from '../components/mobile/helpers'
import { orderService } from '../services/orderService'
import { authService } from '../services/authService'
import { cartService } from '../services/cartService'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'

interface CartItem {
  productId: number
  variantId?: number | null
  name: string
  brand?: string
  price: number
  quantity: number
  emoji?: string
  image?: string
  storage?: string
  ram?: string
  color?: string
}

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

function resolveImage(item: CartItem): string {
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

type PaymentMethod = 'card' | 'cod' | 'razorpay' | 'paypal' | 'netbanking'

const paymentMethods: { id: PaymentMethod; label: string; subtitle: string; icon: string; comingSoon?: boolean }[] = [
  { id: 'cod', label: 'Cash on Delivery', subtitle: 'Pay when your order arrives', icon: '💵', comingSoon: false },
  { id: 'card', label: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, RuPay', icon: '💳', comingSoon: true },
  { id: 'razorpay', label: 'UPI / Razorpay', subtitle: 'GPay, PhonePe, Paytm, UPI', icon: '📱', comingSoon: true },
  { id: 'paypal', label: 'PayPal', subtitle: 'International payments accepted', icon: '🔒', comingSoon: true },
  { id: 'netbanking', label: 'Net Banking', subtitle: 'All major Indian banks', icon: '🏦', comingSoon: true },
]

export default function PaymentPage() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobilePayment />
  const navigate = useNavigate()
  const showToast = useToast().show
  const [items, setItems] = useState<CartItem[]>([])
  const [cartLoading, setCartLoading] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cod')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})

  useLockBodyScroll(success)

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

  const checkoutCoupon = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('checkout_coupon') || 'null') } catch { return null }
  }, [])

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_CHARGE
  const tax = Math.round(subtotal * TAX_RATE)
  const discount = checkoutCoupon?.discount || 0
  const grandTotal = subtotal + shipping + tax - discount

  const handlePayment = async () => {
    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', '/checkout/payment')
      showToast('Please login to complete your order', 'error')
      navigate('/login')
      return
    }
    setProcessing(true)
    try {
      if (selectedMethod !== 'cod') {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      const isCod = selectedMethod === 'cod'

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
        payment_method: isCod ? 'Cash on Delivery' : selectedMethod,
        delivery_address_id: checkoutAddressId,
        discount: checkoutCoupon?.discount || 0,
        coupon_code: checkoutCoupon?.code || undefined,
      })

      setSuccess(true)
      showToast(isCod ? 'Order placed successfully!' : 'Payment successful!', 'success')

      const d = new Date()
      d.setDate(d.getDate() + 5)

      const lastOrder = {
        orderId: apiOrder.id,
        items,
        total: grandTotal,
        subtotal,
        shipping,
        tax,
        discount: checkoutCoupon?.discount || 0,
        couponCode: checkoutCoupon?.code || '',
        paymentMethod: isCod ? 'Cash on Delivery' : selectedMethod,
        deliveryDate: apiOrder.est_delivery || d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        orderDate: apiOrder.created_at || new Date().toISOString(),
        status: apiOrder.delivery_status || 'order_placed',
      }
      localStorage.setItem('last_order', JSON.stringify(lastOrder))
      const history = JSON.parse(localStorage.getItem('order_history') || '[]')
      history.unshift(lastOrder)
      localStorage.setItem('order_history', JSON.stringify(history.slice(0, 50)))
      await cartService.clearCart()
      localStorage.removeItem('checkout_coupon')
      localStorage.removeItem('checkout_address_id')
      localStorage.removeItem('checkout_delivery_tip')
      setTimeout(() => navigate(`/checkout/success?order_id=${apiOrder.id}`), 1500)
    } catch {
      showToast('Payment failed. Please try again.', 'error')
    }
    setProcessing(false)
  }

  if (cartLoading) {
    return (
      <>
        <SiteTopNav />
        <DesktopPageLoader text="Loading your cart..." />
      </>
    )
  }

  return (
    <>
      <style>{`
        :root{
          --red-900:#4a0509;
          --red-700:#7a0d13;
          --red-600:#a3121a;
          --red-500:#c81824;
          --red-400:#e2202c;
          --gold-500:#b8935a;
          --gold-300:#d9bd8d;
          --ink-900:#1c1414;
          --ink-600:#5c4c4c;
          --ink-400:#8a7a7a;
          --paper:#FBF8F6;
          --paper-dim:#F5F0EC;
          --line:#ecdedc;
          --shadow:0 20px 50px -20px rgba(74,5,9,0.25);
        }
        .pp-body{
          background:radial-gradient(1200px 600px at 15% -10%, #fff 0%, var(--paper) 45%),var(--paper-dim);
          font-family:'Inter',sans-serif;
          color:var(--ink-900);
          min-height:100vh;
          padding-bottom:0;
        }
        .pp-ribbon{height:5px;background:linear-gradient(90deg,var(--red-700),var(--red-400) 30%,var(--gold-300) 55%,var(--red-500) 80%,var(--red-900));background-size:200% 100%;animation:ppRibbon 8s linear infinite;}
        @keyframes ppRibbon{from{background-position:0% 0;}to{background-position:200% 0;}}
        .pp-topbar{max-width:1180px;margin:0 auto;display:flex;justify-content:flex-end;padding:22px 32px 0;}
        .pp-back{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;letter-spacing:.02em;color:var(--ink-600);text-decoration:none;background:var(--paper);border:1px solid var(--line);padding:10px 18px;border-radius:999px;transition:.2s ease;cursor:pointer;}
        .pp-back:hover{border-color:var(--red-500);color:var(--red-600);transform:translateX(-2px);}
        .pp-stepper{max-width:640px;margin:34px auto 0;display:flex;align-items:center;padding:0 20px;}
        .pp-step{display:flex;flex-direction:column;align-items:center;gap:10px;position:relative;}
        .pp-step-circle{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;position:relative;z-index:2;transition:.3s ease;}
        .pp-step.done .pp-step-circle{background:linear-gradient(145deg,var(--red-500),var(--red-700));box-shadow:0 8px 20px -6px rgba(168,18,26,.55);color:#fff;}
        .pp-step.active .pp-step-circle{background:var(--paper);border:2.5px solid var(--red-500);color:var(--red-600);box-shadow:0 0 0 6px rgba(200,24,36,.10);}
        .pp-step-label{font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-400);}
        .pp-step.done .pp-step-label,.pp-step.active .pp-step-label{color:var(--red-600);}
        .pp-step-track{flex:1;height:2px;background:var(--line);margin:0 -2px 26px;position:relative;}
        .pp-step-track.filled{background:linear-gradient(90deg,var(--red-600),var(--red-400));}
        .pp-layout{max-width:1180px;margin:56px auto 0;display:grid;grid-template-columns:1.55fr 1fr;gap:44px;padding:0 32px;align-items:start;}
        .pp-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--red-600);margin-bottom:14px;}
        .pp-eyebrow::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--red-500);box-shadow:0 0 0 4px rgba(200,24,36,.15);}
        .pp-title{font-family:'Fraunces',serif;font-weight:600;font-size:clamp(36px,4.4vw,52px);line-height:1.02;letter-spacing:-0.01em;color:var(--ink-900);margin-bottom:10px;}
        .pp-title em{font-style:italic;color:var(--red-600);}
        .pp-sub{font-size:14.5px;color:var(--ink-600);margin-bottom:36px;max-width:460px;}
        .pp-options{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .pp-opt{position:relative;background:var(--paper);border:1.5px solid var(--line);border-radius:16px;padding:22px 20px 20px;cursor:pointer;transition:.22s ease;overflow:hidden;}
        .pp-opt::before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(200,24,36,.05),transparent 55%);opacity:0;transition:.25s ease;}
        .pp-opt:hover{border-color:#e6b9bb;transform:translateY(-2px);box-shadow:0 14px 28px -18px rgba(74,5,9,.30);}
        .pp-opt:hover::before{opacity:1;}
        .pp-opt.selected{border-color:var(--red-500);background:linear-gradient(180deg,#fff 0%,#fff8f7 100%);box-shadow:var(--shadow);}
        .pp-opt.selected::after{content:"";position:absolute;inset:0;border-radius:16px;padding:1.5px;background:linear-gradient(120deg,var(--gold-300),var(--red-500) 45%,var(--gold-300) 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;}
        .pp-opt.disabled{cursor:not-allowed;opacity:.55;}
        .pp-opt.disabled:hover{transform:none;box-shadow:none;border-color:var(--line);}
        .pp-opt-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;}
        .pp-opt-icon{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--paper-dim);color:var(--ink-600);font-size:20px;transition:.2s ease;}
        .pp-opt.selected .pp-opt-icon{background:linear-gradient(145deg,var(--red-500),var(--red-700));color:#fff;box-shadow:0 8px 18px -6px rgba(168,18,26,.5);}
        .pp-radio{width:22px;height:22px;border-radius:50%;border:2px solid var(--line);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .pp-opt.selected .pp-radio{border-color:var(--red-500);}
        .pp-radio-dot{width:11px;height:11px;border-radius:50%;background:var(--red-500);transform:scale(0);transition:.18s ease;}
        .pp-opt.selected .pp-radio-dot{transform:scale(1);}
        .pp-opt-name{font-size:16px;font-weight:700;color:var(--ink-900);margin-bottom:4px;}
        .pp-opt-desc{font-size:12px;color:var(--ink-400);letter-spacing:.02em;line-height:1.5;}
        .pp-badge-soon{position:absolute;top:14px;right:14px;font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:#fdf1e4;color:#b0742a;padding:4px 9px;border-radius:999px;border:1px solid #f2ddb8;}
        .pp-cta{margin-top:32px;width:100%;padding:19px 24px;border:none;border-radius:14px;background:linear-gradient(120deg,var(--red-600),var(--red-500) 55%,var(--red-700));background-size:220% 100%;color:#fff;font-family:'Inter',sans-serif;font-size:15.5px;font-weight:700;letter-spacing:.02em;display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;box-shadow:0 18px 34px -14px rgba(168,18,26,.55);transition:.3s ease;}
        .pp-cta:hover{background-position:100% 0;transform:translateY(-1px);box-shadow:0 22px 40px -14px rgba(168,18,26,.65);}
        .pp-cta:active{transform:translateY(0);}
        .pp-cta:disabled{opacity:.7;cursor:not-allowed;}
        .pp-note{text-align:center;margin-top:14px;font-size:12px;color:var(--ink-400);display:flex;align-items:center;justify-content:center;gap:6px;}
        .pp-note svg{width:13px;height:13px;color:var(--gold-500);}
        .pp-summary{background:var(--paper);border:1px solid var(--line);border-radius:20px;padding:28px 26px;box-shadow:var(--shadow);position:sticky;top:28px;}
        .pp-summary-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
        .pp-summary-title{display:flex;align-items:center;gap:10px;font-family:'Fraunces',serif;font-weight:600;font-size:19px;}
        .pp-summary-title svg{width:19px;height:19px;color:var(--red-500);}
        .pp-item-count{font-size:11px;font-weight:700;color:var(--red-600);background:#fdeceb;padding:4px 10px;border-radius:999px;}
        .pp-cart-item{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid var(--line);}
        .pp-cart-item:last-of-type{border-bottom:none;}
        .pp-thumb{width:56px;height:56px;border-radius:12px;background:var(--paper-dim);display:flex;align-items:center;justify-content:center;font-size:22px;border:1px solid var(--line);flex-shrink:0;position:relative;}
        .pp-thumb img{width:40px;height:40px;object-fit:contain;}
        .pp-qty{position:absolute;top:-7px;right:-7px;width:18px;height:18px;border-radius:50%;background:var(--red-600);color:#fff;font-size:9.5px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid var(--paper);}
        .pp-item-info{flex:1;min-width:0;}
        .pp-item-name{font-size:13.5px;font-weight:700;color:var(--ink-900);margin-bottom:3px;}
        .pp-item-meta{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--ink-400);margin-bottom:2px;}
        .pp-stock-dot{width:5px;height:5px;border-radius:50%;background:#2f9e59;}
        .pp-item-variant{font-size:10.5px;color:var(--ink-400);}
        .pp-item-price{font-family:'JetBrains Mono',monospace;font-weight:600;font-size:13px;color:var(--ink-900);white-space:nowrap;}
        .pp-price-breakdown{margin-top:18px;padding-top:18px;border-top:1px dashed var(--line);}
        .pp-pb-label{display:flex;justify-content:space-between;align-items:center;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-400);margin-bottom:12px;}
        .pp-pb-live{font-size:9px;color:#2f9e59;background:#eafaf1;padding:3px 8px;border-radius:999px;font-weight:700;}
        .pp-pb-row{display:flex;justify-content:space-between;font-size:13.5px;color:var(--ink-600);margin-bottom:10px;}
        .pp-pb-row span:last-child{font-family:'JetBrains Mono',monospace;color:var(--ink-900);font-weight:500;}
        .pp-pb-row.free span:last-child{color:#2f9e59;font-weight:700;}
        .pp-pb-total{display:flex;justify-content:space-between;align-items:baseline;margin-top:16px;padding-top:16px;border-top:1px solid var(--line);}
        .pp-pb-total-label{font-size:14px;font-weight:700;color:var(--ink-900);}
        .pp-pb-total-value{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:var(--red-600);}
        .pp-trust-row{margin-top:20px;padding-top:18px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;}
        .pp-trust-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:9.5px;font-weight:600;color:var(--ink-400);text-align:center;letter-spacing:.02em;}
        .pp-trust-item svg{width:18px;height:18px;color:var(--gold-500);}
        @media(max-width:920px){
          .pp-layout{grid-template-columns:1fr;}
          .pp-summary{position:static;}
          .pp-options{grid-template-columns:1fr;}
          .pp-stepper{max-width:100%;}
        }
      `}</style>

      <div className="pp-body">
        <div className="pp-ribbon" />

        <SiteTopNav />

        <div className="pp-topbar">
          <button onClick={() => navigate('/checkout/address')} className="pp-back">
            &larr; Back to Address
          </button>
        </div>

        <div className="pp-stepper">
          <div className="pp-step done">
            <div className="pp-step-circle">&#10003;</div>
            <div className="pp-step-label">Cart Review</div>
          </div>
          <div className="pp-step-track filled" />
          <div className="pp-step done">
            <div className="pp-step-circle">&#10003;</div>
            <div className="pp-step-label">Address</div>
          </div>
          <div className="pp-step-track filled" />
          <div className="pp-step active">
            <div className="pp-step-circle">&#8226;</div>
            <div className="pp-step-label">Payment</div>
          </div>
        </div>

        <div className="pp-layout">
          <div>
            <div className="pp-eyebrow">Step 3 of 3 &middot; Secure checkout</div>
            <h1 className="pp-title">Complete your <em>payment</em></h1>
            <p className="pp-sub">Choose how you'd like to pay. Your order ships the moment it's confirmed.</p>

            <div className="pp-options">
              {paymentMethods.map(pm => {
                const disabled = !!pm.comingSoon
                const isSelected = selectedMethod === pm.id
                return (
                  <div
                    key={pm.id}
                    className={`pp-opt${isSelected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                    onClick={() => { if (!disabled) setSelectedMethod(pm.id) }}
                  >
                    {disabled && <div className="pp-badge-soon">Coming soon</div>}
                    {!disabled && (
                      <div className="pp-opt-top" style={{marginBottom:0,position:'absolute',top:14,right:14}}>
                        <div className="pp-radio"><div className="pp-radio-dot" /></div>
                      </div>
                    )}
                    <div className="pp-opt-top">
                      <div className="pp-opt-icon">{pm.icon}</div>
                    </div>
                    <div className="pp-opt-name">{pm.label}</div>
                    <div className="pp-opt-desc">{pm.subtitle}</div>
                  </div>
                )
              })}
            </div>

            <button className="pp-cta" onClick={handlePayment} disabled={processing}>
              {processing ? (
                <>
                  <FiLoader size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Place Order &nbsp;&middot;&nbsp; {formatPrice(grandTotal)}
                </>
              )}
            </button>
            <div className="pp-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="11" width="14" height="9" rx="2"/>
                <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
              </svg>
              256-bit encrypted &middot; Your payment details are never stored
            </div>
          </div>

          <div>
            <div className="pp-summary">
              <div className="pp-summary-head">
                <div className="pp-summary-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  Order Summary
                </div>
                <span className="pp-item-count">{items.length} items</span>
              </div>

              <div>
                {items.map(item => {
                  const imgUrl = resolveImage(item)
                  const hasImg = imgUrl && !imgErrors[item.productId]
                  return (
                    <div key={item.productId} className="pp-cart-item">
                      <div className="pp-thumb">
                        {hasImg ? (
                          <img src={imgUrl} alt={item.name} onError={() => setImgErrors(p => ({...p, [item.productId]: true}))} />
                        ) : (
                          <span>{item.emoji || '📦'}</span>
                        )}
                        {item.quantity > 1 && <div className="pp-qty">{item.quantity}</div>}
                      </div>
                      <div className="pp-item-info">
                        <div className="pp-item-name">{item.name}</div>
                        <div className="pp-item-meta"><span className="pp-stock-dot" />In stock</div>
                        {item.storage && <div className="pp-item-variant">{item.storage}</div>}
                      </div>
                      <div className="pp-item-price">{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  )
                })}
              </div>

              <div className="pp-price-breakdown">
                <div className="pp-pb-label">Price breakdown <span className="pp-pb-live">Live</span></div>
                <div className="pp-pb-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                <div className={`pp-pb-row${shipping === 0 ? ' free' : ''}`}><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
                {tax > 0 && <div className="pp-pb-row"><span>Tax (GST)</span><span>{formatPrice(tax)}</span></div>}
                {discount > 0 && <div className="pp-pb-row"><span>Coupon ({checkoutCoupon?.code})</span><span>-{formatPrice(discount)}</span></div>}
                <div className="pp-pb-total">
                  <span className="pp-pb-total-label">Total</span>
                  <span className="pp-pb-total-value">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <div className="pp-trust-row">
                <div className="pp-trust-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Secure Payment
                </div>
                <div className="pp-trust-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>
                  Easy Returns
                </div>
                <div className="pp-trust-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  Fast Delivery
                </div>
              </div>
            </div>
          </div>
        </div>

        <EcommerceFooter compact />
      </div>
    </>
  )
}

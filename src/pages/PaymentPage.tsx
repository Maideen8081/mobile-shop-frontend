import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiLoader, FiCheck } from 'react-icons/fi'
import StorefrontNavbar from '../components/ecommerce/StorefrontNavbar'
import DoubleRingLoader from '../components/ui/DoubleRingLoader'
import BackBar from '../components/ecommerce/BackBar'
import EcommerceFooter from '../components/ecommerce/Footer'
import { useToast } from '../context/ToastContext'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import MobilePayment from '../components/mobile/MobilePayment'
import { useIsMobile } from '../components/mobile/helpers'
import { orderService } from '../services/orderService'
import { authService } from '../services/authService'
import { cartService } from '../services/cartService'

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

type PaymentMethod = 'card' | 'razorpay' | 'paypal' | 'netbanking' | 'cod'

const paymentMethods: { id: PaymentMethod; label: string; subtitle: string; icon: string; comingSoon?: boolean }[] = [
  { id: 'cod', label: 'Cash on Delivery', subtitle: 'Pay when you receive your order', icon: 'payments' },
  { id: 'card', label: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, RuPay', icon: 'credit_card', comingSoon: true },
  { id: 'razorpay', label: 'UPI / Razorpay', subtitle: 'GPay, PhonePe, Paytm, UPI', icon: 'qr_code_2', comingSoon: true },
  { id: 'paypal', label: 'PayPal', subtitle: 'International payments accepted', icon: 'shield_with_heart', comingSoon: true },
  { id: 'netbanking', label: 'Net Banking', subtitle: 'All major Indian banks', icon: 'account_balance', comingSoon: true },
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
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
    if (!gl) return
    const cv = canvas
    const glc = gl

    function syncSize() {
      const w = cv.clientWidth || 1280
      const h = cv.clientHeight || 720
      if (cv.width !== w || cv.height !== h) {
        cv.width = w
        cv.height = h
      }
    }
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(syncSize).observe(canvas)
    syncSize()

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`
    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}
void main() {
    vec2 uv = v_texCoord;
    vec2 m = u_mouse / u_resolution;
    vec3 col = vec3(0.96, 0.97, 0.99);
    float n = 0.0;
    vec2 p = uv * 2.5;
    float t = u_time * 0.15;
    for(float i=1.0; i<5.0; i++) {
        p += vec2(sin(p.y + t), cos(p.x + t));
        n += (1.0/i) * abs(sin(dot(p, vec2(0.8, 1.2)) + t));
    }
    vec3 mint = vec3(0.796, 0.125, 0.176);
    col = mix(col, mint, n * 0.035);
    float dist = length(uv - m);
    col += mint * (0.06 / (dist + 0.3)) * smoothstep(0.4, 0.0, dist);
    col *= 1.0 - 0.12 * length(uv - 0.5);
    gl_FragColor = vec4(col, 1.0);
}`
    function cs(type: number, src: string) {
      const s = glc.createShader(type)
      if (!s) return null
      glc.shaderSource(s, src)
      glc.compileShader(s)
      return s
    }
    const prog = glc.createProgram()
    if (!prog) return
    const vsh = cs(glc.VERTEX_SHADER, vs)
    const fsh = cs(glc.FRAGMENT_SHADER, fs)
    if (!vsh || !fsh) return
    glc.attachShader(prog, vsh)
    glc.attachShader(prog, fsh)
    glc.linkProgram(prog)
    glc.useProgram(prog)
    const buf = glc.createBuffer()
    glc.bindBuffer(glc.ARRAY_BUFFER, buf)
    glc.bufferData(glc.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), glc.STATIC_DRAW)
    const pos = glc.getAttribLocation(prog, 'a_position')
    glc.enableVertexAttribArray(pos)
    glc.vertexAttribPointer(pos, 2, glc.FLOAT, false, 0, 0)
    const uTime = glc.getUniformLocation(prog, 'u_time')
    const uRes = glc.getUniformLocation(prog, 'u_resolution')
    const uMouse = glc.getUniformLocation(prog, 'u_mouse')

    let mouse = { x: cv.width / 2, y: cv.height / 2 }
    const onMove = (event: MouseEvent) => {
      const rect = cv.getBoundingClientRect()
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width
        const ny = 1.0 - (event.clientY - rect.top) / rect.height
        mouse.x = nx * cv.width
        mouse.y = ny * cv.height
      }
    }
    window.addEventListener('mousemove', onMove)

    let animId = 0
    function render(t: number) {
      if (typeof ResizeObserver === 'undefined') syncSize()
      glc.viewport(0, 0, cv.width, cv.height)
      if (uTime) glc.uniform1f(uTime, t * 0.001)
      if (uRes) glc.uniform2f(uRes, cv.width, cv.height)
      if (uMouse) glc.uniform2f(uMouse, mouse.x, mouse.y)
      glc.drawArrays(glc.TRIANGLE_STRIP, 0, 4)
      animId = requestAnimationFrame(render)
    }
    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMove)
    }
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

  const isCartEmpty = items.length === 0 && !processing && !success

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-[#f7fafd] text-[#181c1e] font-sans relative flex flex-col items-center selection:bg-[#CB202D]/30">
        <div className="w-full max-w-[720px]">
          <StorefrontNavbar />
        </div>
        <div className="flex-1 w-full max-w-[720px] flex flex-col items-center justify-center px-6">
          <DoubleRingLoader size={48} />
          <p className="text-sm text-[#6B7280] mt-4">Loading your cart…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7fafd] text-[#181c1e] font-sans relative flex flex-col items-center selection:bg-[#CB202D]/30">
      <style>{`
        .nova-glass {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
        }
        .deep-glass {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(60px);
          -webkit-backdrop-filter: blur(60px);
          border: 1px solid rgba(217, 222, 229, 0.5);
          box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.3);
        }
        .protocol-module {
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .protocol-module:hover {
          transform: translateY(-4px) scale(1.01);
          background: rgba(255, 255, 255, 0.6);
          border-color: #CB202D;
        }
        .protocol-module.active {
          border-color: #CB202D;
          box-shadow: 0 0 30px rgba(203, 32, 45, 0.15);
        }
        .emerald-glow-btn {
          background: linear-gradient(135deg, #CB202D 0%, #A81D2A 100%);
          box-shadow: 0 0 25px rgba(203, 32, 45, 0.5);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .emerald-glow-btn::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
          transform: scale(0);
          transition: transform 0.6s ease;
        }
        .emerald-glow-btn:hover::after {
          transform: scale(1);
        }
        .emerald-glow-btn:hover {
          box-shadow: 0 0 45px rgba(203, 32, 45, 0.7);
          transform: translateY(-2px);
        }
        .emerald-glow-btn:active {
          transform: translateY(0);
        }
        .fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
          opacity: 0;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .scanning-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #CB202D, transparent);
          top: 0;
          left: -100%;
          animation: scan 3s infinite linear;
          display: none;
        }
        .protocol-module:hover .scanning-line,
        .protocol-module.active .scanning-line {
          display: block;
        }
        @keyframes scan {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>

      {/* WebGL Background */}
      <div className="fixed inset-0 w-full h-full -z-10" style={{ display: 'block' }}>
        <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
      </div>

      <StorefrontNavbar activeLabel="Home" />
      <div className="pt-24"><BackBar label="Back to Address" to="/checkout/address" /></div>

      {isCartEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-center px-4">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 nova-glass">
            <span className="material-symbols-outlined text-3xl text-[#9CA3AF]">shopping_cart</span>
          </div>
          <h2 className="text-xl font-bold text-[#454747] mb-2">No items to settle</h2>
          <p className="text-sm text-[#434748] mb-6">Add items to cart before checkout</p>
          <button onClick={() => navigate('/collection/all')}
            className="emerald-glow-btn px-8 py-3 rounded-full text-sm font-bold text-white"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          <main className="w-full max-w-[1200px] pt-4 pb-24 px-4 relative z-10">
            {/* Coordinate Pipeline */}
            <div className="mb-20 fade-in-up">
              <div className="flex justify-between items-center max-w-4xl mx-auto px-4">
                <div className="flex flex-col items-center relative group">
                  <div className="w-12 h-12 rounded-full bg-[#CB202D] flex items-center justify-center text-white shadow-[0_0_15px_rgba(203,32,45,0.4)]">
                    <span className="material-symbols-outlined text-xl">verified_user</span>
                  </div>
                  <span className="mt-3 font-bold text-[9px] tracking-[0.2em] text-[#CB202D]">CART REVIEW</span>
                  <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[8px] bg-white px-2 py-1 rounded border border-[rgba(217,222,229,0.5)]">STEP 1 OF 3</div>
                </div>
                <div className="flex-1 mx-4 h-[2px] bg-[#CB202D]/30 overflow-hidden">
                  <div className="h-full bg-[#CB202D] w-full" />
                </div>
                <div className="flex flex-col items-center relative group">
                  <div className="w-12 h-12 rounded-full bg-[#CB202D] flex items-center justify-center text-white shadow-[0_0_15px_rgba(203,32,45,0.4)]">
                    <span className="material-symbols-outlined text-xl">location_searching</span>
                  </div>
                  <span className="mt-3 font-bold text-[9px] tracking-[0.2em] text-[#CB202D]">DELIVERY ADDRESS</span>
                  <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[8px] bg-white px-2 py-1 rounded border border-[rgba(217,222,229,0.5)]">STEP 2 OF 3</div>
                </div>
                <div className="flex-1 mx-4 h-[2px] bg-[#e0e3e6] overflow-hidden">
                  <div className="h-full bg-[#CB202D] w-2/3 animate-pulse" />
                </div>
                <div className="flex flex-col items-center relative group">
                  <div className="w-12 h-12 rounded-full border-2 border-[#CB202D] bg-white/50 flex items-center justify-center text-[#CB202D] animate-pulse">
                    <span className="material-symbols-outlined text-xl">payments</span>
                  </div>
                  <span className="mt-3 font-bold text-[9px] tracking-[0.2em] text-[#454747]">PAYMENT</span>
                  <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[8px] bg-white px-2 py-1 rounded border border-[rgba(217,222,229,0.5)]">STEP 3 OF 3</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Settlement Terminal (Main) */}
              <div className="lg:col-span-8 space-y-8">
                <div className="mb-10 fade-in-up delay-1">
                  <h1 className="text-[3.5rem] font-black leading-tight text-[#454747]" style={{ letterSpacing: '-0.02em' }}>Complete Payment</h1>
                  <div className="flex items-center gap-3 mt-4 text-[#434748]/70">
                    <span className="w-2 h-2 rounded-full bg-[#CB202D] animate-ping" />
                    <p className="text-sm uppercase tracking-widest">Select your payment method to complete your order</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 fade-in-up delay-2">
                  {paymentMethods.map(pm => {
                    const disabled = !!pm.comingSoon
                    return (
                    <label
                      key={pm.id}
                      className={`protocol-module deep-glass p-6 rounded-xl flex items-start space-x-5 relative overflow-hidden group border border-transparent ${selectedMethod === pm.id ? 'active' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={(e) => { if (pm.comingSoon) { e.preventDefault(); showToast('Coming soon — Currently only Cash on Delivery is available', 'error') } }}
                    >
                      <div className="scanning-line" />
                      <input type="radio" name="payment" className="hidden"
                        checked={selectedMethod === pm.id}
                        onChange={() => setSelectedMethod(pm.id)}
                        disabled={disabled}
                      />
                      <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-[#ebeef1] flex items-center justify-center text-[#454747] group-hover:text-[#CB202D] transition-colors">
                        <span className="material-symbols-outlined text-3xl">{pm.icon}</span>
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            {pm.comingSoon && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Coming Soon</span>}
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedMethod === pm.id ? 'border-[#CB202D] bg-[#CB202D]' : 'border-[#747878]'}`}>
                            {selectedMethod === pm.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                        <h4 className="text-base font-black text-[#181c1e]">{pm.label}</h4>
                        <p className="text-[10px] text-[#434748]/60 uppercase mt-1">{pm.subtitle}</p>
                      </div>
                    </label>
                  )})}
                </div>

                <div className="mt-14 fade-in-up delay-3">
                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="emerald-glow-btn w-full py-8 rounded-2xl flex items-center justify-center space-x-4 text-white group"
                  >
                    {processing ? (
                      <>
                        <FiLoader size={22} className="animate-spin" />
                        <span className="text-lg tracking-[0.15em] font-black">PAY NOW</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">lock_open</span>
                        <span className="text-lg tracking-[0.15em] font-black">PAY NOW</span>
                      </>
                    )}
                  </button>

                  {/* Security Badges */}
                  <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-[rgba(217,222,229,0.5)]">
                      {[
                        { icon: 'verified_user', title: '256-bit Encrypted', sub: 'SSL SECURE PAYMENT' },
                        { icon: 'security', title: 'Secure Checkout', sub: 'PCI DSS COMPLIANT' },
                        { icon: 'science', title: '100% Safe', sub: 'TRUSTED BY THOUSANDS' },
                      ].map(b => (
                      <div key={b.title} className="flex flex-col items-center text-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[#CB202D]">{b.icon}</span>
                        <div>
                          <div className="text-[9px] font-bold tracking-widest uppercase">{b.title}</div>
                          <div className="text-[8px] text-[#434748]">{b.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inventory Manifest Sidebar */}
              <aside className="lg:col-span-4 sticky top-32 fade-in-up delay-4">
                <div className="nova-glass p-8 rounded-[2rem] space-y-8 border border-white/80">
                  <div className="flex justify-between items-center pb-4 border-b border-[rgba(217,222,229,0.5)]">
                    <h3 className="text-lg text-[#454747] flex items-center font-black">
                      <span className="material-symbols-outlined mr-3 text-[#CB202D]">shopping_cart</span>
                      Order Summary
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-sm text-[#434748]/60">No items in manifest</div>
                    ) : items.map(item => {
                      const imgUrl = resolveImage(item)
                      const hasImg = imgUrl && !imgErrors[item.productId]
                      return (
                        <div key={item.productId} className="group">
                          <div className="flex items-center space-x-4 pb-4">
                            <div className="relative flex-shrink-0">
                              {hasImg ? (
                                <img src={imgUrl} alt={item.name}
                                  className="w-16 h-16 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-[#CB202D] transition-all"
                                  onError={() => setImgErrors(p => ({ ...p, [item.productId]: true }))}
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-xl bg-[#ebeef1] flex items-center justify-center text-2xl ring-2 ring-transparent group-hover:ring-[#CB202D] transition-all">
                                  {item.emoji || '📦'}
                                </div>
                              )}
                              {item.quantity > 1 && (
                                <div className="absolute -top-1 -right-1 bg-[#CB202D] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                  {item.quantity}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-black text-[#181c1e] group-hover:text-[#CB202D] transition-colors truncate">{item.name}</h5>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="material-symbols-outlined text-[10px] text-[#CB202D]">check_circle</span>
                                <span className="text-[#CB202D] font-bold text-[8px] tracking-widest uppercase">In Stock</span>
                              </div>
                              {item.storage && <span className="text-[10px] text-[#434748]">{item.storage}</span>}
                            </div>
                            <span className="text-sm font-bold text-[#181c1e]">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-4 pt-6 border-t border-dashed border-[rgba(217,222,229,0.5)]">
                    <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase text-[#434748]/60">
                      <span>Price Breakdown</span>
                      <span className="text-[8px] px-1 bg-[#ebeef1] rounded italic uppercase">Live</span>
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between text-[11px] text-[#181c1e]">
                        <span>Subtotal</span>
                        <span className="font-bold">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#181c1e]">
                        <span className="flex items-center gap-2">
                          Shipping
                          <span className="material-symbols-outlined text-[12px] text-[#CB202D]">check_circle</span>
                        </span>
                        <span className="text-[#CB202D] font-black uppercase tracking-[0.1em]">
                          {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#181c1e]">
                        <span>Tax (GST)</span>
                        <span className="font-bold">{formatPrice(tax)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-[11px] text-[#181c1e]">
                          <span>Coupon ({checkoutCoupon?.code})</span>
                          <span className="font-bold text-[#16A34A]">-{formatPrice(discount)}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-6 mt-4 border-t-2 border-[#454747]/10 flex justify-between items-end bg-[#f1f4f7]/30 p-4 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-[9px] tracking-widest text-[#434748] font-black">GRAND TOTAL</span>
                        <span className="text-[1.5rem] font-black text-[#454747] mt-1">{formatPrice(grandTotal)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="material-symbols-outlined text-[#CB202D] text-3xl animate-pulse">verified</span>
                        <span className="text-[7px] text-[#CB202D] font-bold mt-1 tracking-tighter">SECURE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </main>

          {/* Success Overlay */}
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.cos((i / 12) * Math.PI * 2) * (80 + Math.random() * 60),
                    y: Math.sin((i / 12) * Math.PI * 2) * (80 + Math.random() * 60),
                  }}
                  transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{ background: ['#CB202D', '#A81D2A', '#D94452', '#FF7A85', '#FF8A00'][i % 5] }}
                />
              ))}
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className="flex flex-col items-center gap-5 p-10 rounded-3xl bg-white border border-[#CB202D]/30 shadow-2xl"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #CB202D 0%, #A81D2A 100%)', boxShadow: '0 0 25px rgba(203,32,45,0.4)' }}
                  >
                    <FiCheck size={32} className="text-white" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="absolute inset-0 rounded-2xl bg-[#CB202D]/20 -z-10"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-center"
                >
                  <p className="text-xl font-bold text-[#454747]">Payment Successful!</p>
                  <p className="text-xs text-[#434748] mt-2">Your order has been placed successfully</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                  className="flex items-center gap-2 text-xs text-[#9CA3AF]"
                >
                  <FiLoader size={12} className="animate-spin" />
                  Redirecting to confirmation...
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}

      {/* Footer */}
      <EcommerceFooter />
    </div>
  )
}

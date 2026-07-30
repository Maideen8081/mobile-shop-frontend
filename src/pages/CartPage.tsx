import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import StorefrontNavbar from '../components/ecommerce/StorefrontNavbar'
import BackBar from '../components/ecommerce/BackBar'
import { useToast } from '../context/ToastContext'
import { useCart, useStockInfo, VALID_COUPONS, FREE_SHIPPING_THRESHOLD, TAX_RATE, DELIVERY_CHARGE } from '../components/mobile/cartLogic'

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

interface StockInfo {
  stock: number
  name: string
  loading: boolean
  error?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function resolveImage(item: CartItem): string {
  if (item.image) {
    if (item.image.startsWith('http') || item.image.startsWith('data:')) return item.image
    return `${API_BASE_URL.replace(/\/$/, '')}/${item.image.replace(/^\//, '')}`
  }
  return ''
}

function CountUp({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number | null>(null)

  useEffect(() => {
    let start: number | null = null
    const duration = 1500
    const from = 0

    function step(ts: number) {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setDisplay(progress * (value - from) + from)
      if (progress < 1) ref.current = requestAnimationFrame(step)
    }
    ref.current = requestAnimationFrame(step)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [value])

  return <>{prefix}{display.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
}

export default function CartPage() {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, subtotal, totalItems } = useCart()
  const stockMap = useStockInfo(items)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [activeCoupon, setActiveCoupon] = useState<string | null>(null)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const settlementBtnRef = useRef<HTMLButtonElement>(null)
  const showToast = useToast().show

  useEffect(() => {
    const el = settlementBtnRef.current
    if (!el) return

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2)
      const magnetism = 25
      if (dist < 150) {
        const dx = (e.clientX - cx) / magnetism
        const dy = (e.clientY - cy) / magnetism
        el.style.transform = `translate(${dx}px, ${dy}px)`
      } else {
        el.style.transform = 'translate(0px, 0px)'
      }
    }
    const onLeave = () => { el.style.transform = 'translate(0px, 0px)' }

    document.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      document.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl') || (canvas.getContext as any)('experimental-webgl')
    if (!gl) return

    function syncSize() {
      const w = canvas!.clientWidth || 1280
      const h = canvas!.clientHeight || 720
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w
        canvas!.height = h
      }
    }
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncSize).observe(canvas)
    }
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
    vec3 col = vec3(0.933, 0.945, 0.957);
    float n = 0.0;
    vec2 p = uv * 2.5;
    float t = u_time * 0.15;
    for(float i=1.0; i<5.0; i++) {
        p += vec2(cos(p.y + t), sin(p.x + t));
        n += (1.0/i) * abs(sin(dot(p, vec2(1.0, 1.0)) + t));
    }
    vec3 mint = vec3(0.796, 0.125, 0.176);
    col = mix(col, mint, n * 0.025);
    float dist = length(uv - m);
    col += mint * (0.04 / (dist + 0.6)) * smoothstep(0.4, 0.0, dist);
    col *= 1.0 - 0.05 * length(uv - 0.5);
    gl_FragColor = vec4(col, 1.0);
}`
    function cs(type: number, src: string) {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs))
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(prog)
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes = gl.getUniformLocation(prog, 'u_resolution')
    const uMouse = gl.getUniformLocation(prog, 'u_mouse')

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 }
    const onMouse = (event: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect()
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width
        const ny = 1.0 - (event.clientY - rect.top) / rect.height
        mouse.x = nx * canvas!.width
        mouse.y = ny * canvas!.height
      }
    }
    window.addEventListener('mousemove', onMouse)

    let animId: number
    function render(t: number) {
      if (typeof ResizeObserver === 'undefined') syncSize()
      gl.viewport(0, 0, canvas!.width, canvas!.height)
      if (uTime) gl.uniform1f(uTime, t * 0.001)
      if (uRes) gl.uniform2f(uRes, canvas!.width, canvas!.height)
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animId = requestAnimationFrame(render)
    }
    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_CHARGE
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)
  const tax = Math.round(subtotal * TAX_RATE)
  const discount = couponApplied && activeCoupon
    ? (VALID_COUPONS[activeCoupon]?.fixed
      ? VALID_COUPONS[activeCoupon].discount
      : Math.round(subtotal * (VALID_COUPONS[activeCoupon]?.discount || 0)))
    : 0
  const grandTotal = subtotal + shipping + tax - discount

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    if (VALID_COUPONS[code]) {
      setCouponApplied(true)
      setActiveCoupon(code)
      showToast(`Coupon "${code}" applied — ${VALID_COUPONS[code].label}`, 'success')
    } else {
      showToast(`Invalid coupon code "${code}"`, 'error')
    }
  }

  const handleUpdateQty = (item: CartItem, delta: number) => {
    const key = `${item.productId}-${item.variantId || 'default'}`
    const stockInfo = stockMap[key]
    const newQty = item.quantity + delta

    if (delta > 0 && stockInfo && newQty > stockInfo.stock) {
      const msg = stockInfo.stock === 0
        ? `${item.name} is currently out of stock`
        : `Only ${stockInfo.stock} available. You already have ${item.quantity} in cart.`
      showToast(msg, 'error')
      return
    }
    updateQuantity(item.productId, delta)
  }

  return (
    <div className="min-h-screen relative flex flex-col" style={{ backgroundColor: '#f7fafd', color: '#181c1e' }}>
      <StorefrontNavbar activeLabel="Home" />
      <div className="pt-24"><BackBar label="Continue Shopping" to="/collection/all" /></div>
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10" />      <main className="flex-grow pt-4 pb-24 w-full px-4 md:px-8 lg:px-12" style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <header className="mb-8 flex items-end justify-between" style={{ opacity: 0, transform: 'translateY(30px)', animation: 'revealUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
          <div>
            <h1 className="font-bold tracking-tight mb-1" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: '#454747' }}>
              Shopping Cart
            </h1>
            <p className="text-sm" style={{ color: '#434748' }}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'} — Review your selections before checkout
            </p>
          </div>
          {items.length > 0 && (
            <button onClick={() => navigate('/collection/all')}
              className="hidden md:inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0"
              style={{ background: 'linear-gradient(135deg, #CB202D, #A81D2A)', color: 'white', border: 'none' }}>
              <ArrowLeft size={13} />
              Continue Shopping
            </button>
          )}
        </header>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Product Modules */}
            <div className="lg:col-span-8 space-y-5">
              <AnimatePresence mode="popLayout">
                {items.map((item, idx) => {
                  const imgUrl = resolveImage(item)
                  const hasImg = !!imgUrl && !imgErrors[item.productId]
                  const totalPrice = item.price * item.quantity
                  const key = `${item.productId}-${item.variantId || 'default'}`
                  const stockInfo = stockMap[key]
                  const atMax = stockInfo && !stockInfo.loading && item.quantity >= stockInfo.stock
                  const noStock = stockInfo && !stockInfo.loading && stockInfo.stock === 0

                  return (
                    <CartItemCard
                      key={item.productId}
                      item={item}
                      imgUrl={imgUrl}
                      hasImg={hasImg}
                      totalPrice={totalPrice}
                      stockInfo={stockInfo}
                      atMax={atMax}
                      noStock={noStock}
                      idx={idx}
                      onImgError={() => setImgErrors(p => ({ ...p, [item.productId]: true }))}
                      onUpdateQty={handleUpdateQty}
                      onRemove={() => removeItem(item.productId)}
                      onViewProduct={() => navigate(`/product/${item.productId}`)}
                    />
                  )
                })}
              </AnimatePresence>

            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-4 sticky top-28 space-y-5"
              style={{ opacity: 0, transform: 'translateY(30px)', animation: 'revealUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards', animationDelay: '0.3s' }}>
              {/* Diagnostic Summary */}
              <div className="rounded-[2rem] overflow-hidden border" style={{ borderColor: '#e5e7eb', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}>
                <div className="px-8 py-6 text-white" style={{ background: '#454747' }}>
                  <h2 className="text-xl font-bold">Diagnostic Summary</h2>
                  <p className="text-xs opacity-70 mt-1 font-mono uppercase tracking-widest">
                    Ref: PX-ORD-{Date.now().toString(36).toUpperCase()}
                  </p>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex justify-between text-sm" style={{ color: '#434748' }}>
                    <span>Hardware Subtotal</span>
                    <span className="font-bold tabular-nums" style={{ color: '#181c1e' }}>
                      <CountUp value={subtotal} prefix="₹" />
                    </span>
                  </div>
                  <div className="flex justify-between text-sm" style={{ color: '#434748' }}>
                    <span>Calibration Fee</span>
                    <span className="font-bold uppercase tracking-wider" style={{ color: '#CB202D' }}>Free</span>
                  </div>
                  <div className="flex justify-between text-sm" style={{ color: '#434748' }}>
                    <span>Shipping</span>
                    <span className="font-bold tabular-nums" style={{ color: shipping === 0 ? '#CB202D' : '#181c1e' }}>
                      {shipping === 0 ? 'FREE' : <CountUp value={shipping} prefix="₹" />}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm" style={{ color: '#434748' }}>
                    <span>System Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                    <span className="font-bold tabular-nums" style={{ color: '#181c1e' }}>
                      <CountUp value={tax} prefix="₹" />
                    </span>
                  </div>

                  {couponApplied && activeCoupon && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="flex justify-between text-sm pt-1">
                      <span className="flex items-center gap-1" style={{ color: '#CB202D' }}>
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>sell</span>
                        {activeCoupon} — {VALID_COUPONS[activeCoupon]?.label}
                      </span>
                      <span className="font-bold" style={{ color: '#CB202D' }}>-₹{discount.toLocaleString('en-IN')}</span>
                    </motion.div>
                  )}

                  <div className="pt-6 mt-6" style={{ borderTop: '1px solid #c4c7c7' }}>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex flex-col">
                        <span className="text-xs mb-1" style={{ color: '#434748' }}>Total Settlement</span>
                        <span className="flex items-center gap-1 text-[10px] font-bold tracking-tighter uppercase" style={{ color: '#CB202D' }}>
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          Mint Guarantee Active
                        </span>
                      </div>
                      <span className="text-[2.5rem] leading-none font-bold tabular-nums" style={{ color: '#181c1e' }}>
                        <CountUp value={grandTotal} prefix="₹" />
                      </span>
                    </div>
                  </div>

                  {/* Coupon */}
                  <div className="pt-4" style={{ borderTop: '1px solid #c4c7c7' }}>
                    <p className="text-xs font-semibold mb-2.5 flex items-center gap-1.5" style={{ color: '#434748' }}>
                      <span className="material-symbols-outlined text-[14px]" style={{ color: '#CB202D', fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
                      Have a coupon?
                    </p>
                    {couponApplied ? (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border"
                        style={{ background: 'rgba(203,32,45,0.1)', color: '#A81D2A', borderColor: 'rgba(203,32,45,0.3)' }}>
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        {activeCoupon && `Coupon "${activeCoupon}" applied — ${VALID_COUPONS[activeCoupon]?.label}`}
                      </motion.div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter coupon (PHONE10, FIX20, MINT50)"
                          className="flex-1 h-11 px-4 rounded-xl text-xs font-medium outline-none"
                          style={{ border: '1px solid #c4c7c7', background: 'rgba(255,255,255,0.8)', color: '#181c1e' }}
                        />
                        <button onClick={handleApplyCoupon}
                          className="px-5 h-11 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          style={{ background: 'linear-gradient(135deg, #CB202D, #A81D2A)', color: 'white' }}>
                          Apply
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Precision Shipping Progress */}
                  <div className="pt-4">
                    <div className="flex items-center justify-between text-xs mb-2" style={{ color: '#CB202D' }}>
                      <span>Precision Shipping Progress</span>
                      <span>{shipping === 0 ? 'Unlocked' : `₹${(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString('en-IN')} left`}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#e0e3e6' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${shippingProgress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: '#CB202D', boxShadow: '0 0 10px rgba(203,32,45,0.8)' }}
                      />
                    </div>
                    <p className="text-[11px] mt-2 text-center" style={{ color: 'rgba(116,120,120,0.6)' }}>
                      Free premium shipping unlocked for orders over ₹{FREE_SHIPPING_THRESHOLD.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Initiate Settlement Button */}
                  <Link to="/checkout/address" className="block">
                    <button ref={settlementBtnRef}
                      className="w-full mt-4 py-5 rounded-full flex items-center justify-center gap-3 text-sm font-bold tracking-tight transition-all cursor-pointer group"
                      style={{
                        background: 'linear-gradient(135deg, #CB202D 0%, #A81D2A 100%)',
                        color: 'white',
                        boxShadow: '0 0 0 0 rgba(203, 32, 45, 0.4)',
                        animation: 'pulseMint 2s infinite',
                      }}>
                      <span>Initiate Settlement</span>
                      <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform text-[18px]">arrow_forward</span>
                    </button>
                  </Link>

                  <div className="flex justify-center gap-6 mt-6" style={{ color: 'rgba(116,120,120,0.4)' }}>
                    <span className="material-symbols-outlined">credit_card</span>
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                    <span className="material-symbols-outlined">token</span>
                  </div>
                </div>
              </div>

              {/* Laboratory Shield */}
              <div className="rounded-2xl p-6 flex items-start gap-4" style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'
              }}>
                <span className="material-symbols-outlined" style={{ color: '#A81D2A', fontVariationSettings: "'FILL' 1" }}>shield</span>
                <div>
                  <h4 className="font-bold text-sm" style={{ color: '#181c1e' }}>Laboratory Shield</h4>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: '#434748' }}>
                    Your hardware is protected by 256-bit encryption during settlement. All repairs are covered by our 2-year precision warranty.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile sticky checkout bar */}
      {items.length > 0 && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4"
          style={{ background: '#ffffff', borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs" style={{ color: '#434748' }}>Total Settlement</p>
              <p className="text-lg font-bold" style={{ color: '#181c1e' }}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <span className="text-xs" style={{ color: '#434748' }}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
          </div>
          <Link to="/checkout/address">
            <button className="w-full h-12 rounded-xl text-sm font-bold transition-all cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #CB202D 0%, #A81D2A 100%)', color: 'white' }}>
              Initiate Settlement
            </button>
          </Link>
        </motion.div>
      )}

      <style>{`
        @keyframes revealUp {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseMint {
          0% { box-shadow: 0 0 0 0 rgba(203, 32, 45, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(203, 32, 45, 0); }
          100% { box-shadow: 0 0 0 0 rgba(203, 32, 45, 0); }
        }
      `}</style>
    </div>
  )
}

function CartItemCard({
  item, imgUrl, hasImg, totalPrice, stockInfo, atMax, noStock, idx,
  onImgError, onUpdateQty, onRemove, onViewProduct
}: {
  item: CartItem; imgUrl: string; hasImg: boolean; totalPrice: number
  stockInfo?: StockInfo; atMax: boolean; noStock: boolean; idx: number
  onImgError: () => void; onUpdateQty: (item: CartItem, delta: number) => void; onRemove: () => void
  onViewProduct: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const cx = rect.width / 2
      const cy = rect.height / 2
      const rotX = (cy - y) / 15
      const rotY = (x - cx) / 25
      el.style.transform = `perspective(1000px) translateY(-8px) rotateX(${rotX}deg) rotateY(${rotY}deg)`
    }
    const onLeave = () => {
      el.style.transform = 'perspective(1000px) translateY(0px) rotateX(0deg) rotateY(0deg)'
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  const formatUnitId = (name: string, productId: number) => {
    const parts = name.split(' ')
    const prefix = parts.length > 1 ? parts.map(p => p[0]).join('').toUpperCase().slice(0, 4) : 'UNIT'
    return `${prefix}-${String(productId).padStart(4, '0')}-${String(idx).padStart(2, '0')}`
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      ref={cardRef}
      onClick={onViewProduct}
      className="rounded-2xl flex flex-col md:flex-row gap-5 transition-all duration-500 cursor-pointer"
      style={{
        padding: '1.25rem',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {/* Image */}
      <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
        style={{ background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(217,222,229,0.5)', padding: '0.75rem' }}>
        {hasImg ? (
          <img src={imgUrl} alt={item.name} className="w-full h-full object-contain"
            onError={onImgError} />
        ) : (
          <span className="material-symbols-outlined text-[48px]" style={{ color: 'rgba(69,71,71,0.3)' }}>devices</span>
        )}
      </div>

      {/* Details */}
      <div className="flex-grow flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate" style={{ color: '#454747' }}>{item.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono" style={{ color: '#747878' }}>
                  ID: {formatUnitId(item.name, item.productId)}
                </span>
                {item.brand && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(203,32,45,0.1)', color: '#A81D2A' }}>
                    {item.brand}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-bold" style={{ color: '#454747' }}>₹{totalPrice.toLocaleString('en-IN')}</div>
              <div className="text-[10px]" style={{ color: '#747878' }}>₹{item.price.toLocaleString('en-IN')}/unit</div>
            </div>
          </div>

          {/* Tech specs badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.storage && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: 'rgba(69,71,71,0.06)', color: '#434748', border: '1px solid rgba(196,199,199,0.5)' }}>
                <span className="material-symbols-outlined text-[12px]">storage</span>
                {item.storage}
              </span>
            )}
            {item.ram && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: 'rgba(168,29,42,0.08)', color: '#A81D2A', border: '1px solid rgba(168,29,42,0.2)' }}>
                <span className="material-symbols-outlined text-[12px]">memory</span>
                {item.ram} RAM
              </span>
            )}
            {item.color && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: 'rgba(69,71,71,0.06)', color: '#434748', border: '1px solid rgba(196,199,199,0.5)' }}>
                <span className="material-symbols-outlined text-[12px]">palette</span>
                {item.color}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ background: 'rgba(69,71,71,0.06)', color: '#434748', border: '1px solid rgba(196,199,199,0.5)' }}>
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              Lab Certified
            </span>
          </div>

          {/* Stock + Status Row */}
          <div className="flex items-center gap-3 mt-2">
            {stockInfo?.loading ? (
              <span className="text-[10px] flex items-center gap-1" style={{ color: '#747878' }}>
                <span className="material-symbols-outlined text-[12px]">sync</span>
                Verifying stock...
              </span>
            ) : noStock ? (
              <span className="text-[10px] flex items-center gap-1 font-medium" style={{ color: '#ba1a1a' }}>
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                Out of Stock
              </span>
            ) : stockInfo && stockInfo.stock <= 5 ? (
              <span className="text-[10px] flex items-center gap-1 font-medium" style={{ color: '#FF8A00' }}>
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                Only {stockInfo.stock} left
              </span>
            ) : (
              <span className="text-[10px] flex items-center gap-1" style={{ color: '#A81D2A' }}>
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                In Stock {stockInfo && `(${stockInfo.stock})`}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div onClick={e => e.stopPropagation()} className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(196,199,199,0.4)' }}>
          <div className="flex items-center gap-0.5 rounded-lg px-2 py-1"
            style={{ background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(217,222,229,0.5)' }}>
            <button onClick={() => onUpdateQty(item, -1)}
              className="w-7 h-7 rounded-md flex items-center justify-center material-symbols-outlined text-[16px] cursor-pointer hover:bg-white/40 transition-colors"
              style={{ color: '#434748' }}>
              remove
            </button>
            <span className="font-bold w-7 text-center text-sm" style={{ color: '#454747' }}>{item.quantity}</span>
            <button onClick={() => onUpdateQty(item, 1)}
              className="w-7 h-7 rounded-md flex items-center justify-center material-symbols-outlined text-[16px] cursor-pointer hover:bg-white/40 transition-colors"
              style={{ color: atMax || noStock ? '#c4c7c7' : '#434748' }}>
              add
            </button>
          </div>
          <button onClick={onRemove}
            className="text-xs font-medium transition-all cursor-pointer hover:underline"
            style={{ color: '#ba1a1a' }}>
            Remove
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function EmptyCart() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center"
      style={{ opacity: 0, transform: 'translateY(30px)', animation: 'revealUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
      <div className="relative w-32 h-32 rounded-3xl mb-8 flex items-center justify-center"
        style={{ background: 'rgba(203,32,45,0.1)' }}>
        <span className="material-symbols-outlined text-[48px]" style={{ color: '#CB202D', fontVariationSettings: "'FILL' 1" }}>science</span>
      </div>
      <h2 className="text-2xl font-bold mb-3" style={{ color: '#454747' }}>
        Laboratory Is Empty
      </h2>
      <p className="text-sm mb-8 max-w-xs" style={{ color: '#434748' }}>
        No hardware modules detected in your cart. Browse our precision collection to begin your restoration setup.
      </p>
      <button onClick={() => navigate('/collection/all')}
        className="inline-flex items-center gap-2 px-8 h-12 rounded-xl text-sm font-bold text-white transition-all cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #CB202D 0%, #A81D2A 100%)' }}>
        <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
        Browse Collection
      </button>
      <div className="flex items-center gap-4 mt-8">
        {[
          { label: 'Best Sellers', to: '/collection/all' },
          { label: 'New Arrivals', to: '/collection/all' },
          { label: 'Precision Deals', to: '/collection/all' },
        ].map((link) => (
          <Link key={link.label} to={link.to}
            className="text-xs font-medium px-4 py-2 rounded-full transition-all"
            style={{ border: '1px solid #c4c7c7', color: '#434748' }}>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

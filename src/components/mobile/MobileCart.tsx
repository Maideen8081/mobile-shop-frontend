import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, Tag, ShieldCheck, ArrowLeft, ShoppingBag, Heart, Star, Check, Bike } from 'lucide-react'
import { useMobileToast } from './useMobileToast'
import MobileTopSection from './MobileTopSection'
import {
  useStockInfo,
  resolveImage,
  VALID_COUPONS,
  FREE_SHIPPING_THRESHOLD,
  TAX_RATE,
  DELIVERY_CHARGE,
} from './cartLogic'
import { productService } from '../../services/productService'
import { getImageUrl } from './helpers'
import { cartService, type CartItem } from '../../services/cartService'
import { addToCartWithAuth } from '../../utils/cartAuth'
import DoubleRingLoader from '../ui/DoubleRingLoader'

const PURPLE = '#CB202D'
const PURPLE2 = '#FF5A65'
const SUCCESS = '#22C55E'
const card = 'bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.08)]'
const PLATFORM_FEE = 9

async function addProductToCart(p: any) {
  const id = p.id || p.product_id
  const name = p.product_name || p.name || ''
  const rawPrice = p.variants?.[0]?.discount_price || p.variants?.[0]?.price || p.min_price || p.price || 0
  const price = isNaN(Number(rawPrice)) ? 0 : Number(rawPrice)
  const img = getImageUrl(p.common_image || p.image || p.images?.[0] || p.thumbnail || '')
  await addToCartWithAuth({
    productId: id,
    variationId: 0,
    quantity: 1,
    name,
    brand: p.brand || '',
    price,
    image: img,
  })
  window.dispatchEvent(new Event('cart-updated'))
}

export default function MobileCart() {
  const navigate = useNavigate()
  const { show: showToast, Toast } = useMobileToast()
  const [items, setItems] = useState<CartItem[]>([])
  const [cartLoading, setCartLoading] = useState(true)
  const stockMap = useStockInfo(items)

  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [activeCoupon, setActiveCoupon] = useState<string | null>(null)

  const [recommended, setRecommended] = useState<any[]>([])
  const [recLoading, setRecLoading] = useState(true)
  const [wishlisted, setWishlisted] = useState<Set<number>>(new Set())

  const [tip, setTip] = useState<number | null>(null)
  const [customTip, setCustomTip] = useState('')
  const [instructions, setInstructions] = useState('')

  useEffect(() => {
    setCartLoading(true)
    cartService.getItems().then(setItems).catch(() => setItems([])).finally(() => setCartLoading(false))
    const handler = () => {
      cartService.getItems().then(setItems).catch(() => setItems([]))
    }
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_CHARGE
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)
  const tax = Math.round(subtotal * TAX_RATE)
  const discount = couponApplied && activeCoupon
    ? (VALID_COUPONS[activeCoupon]?.fixed
      ? VALID_COUPONS[activeCoupon].discount
      : Math.round(subtotal * (VALID_COUPONS[activeCoupon]?.discount || 0)))
    : 0
  const deliveryTip = tip != null ? tip : (Number(customTip) || 0)
  const platformFee = subtotal > 0 ? PLATFORM_FEE : 0
  const grandTotal = subtotal + shipping + tax + platformFee + deliveryTip - discount

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

  const handleUpdateQty = async (item: CartItem, delta: number) => {
    const key = `${item.productId}-${item.variantId || 'default'}`
    const stockInfo = stockMap[key]
    const newQty = item.quantity + delta
    if (delta > 0 && stockInfo && !stockInfo.loading && newQty > stockInfo.stock) {
      showToast(stockInfo.stock === 0 ? `${item.name} is out of stock` : `Only ${stockInfo.stock} available`, 'error')
      return
    }
    await cartService.updateQuantity(item.productId, item.variantId ?? 0, delta)
    window.dispatchEvent(new Event('cart-updated'))
  }

  const handleRemoveItem = async (item: CartItem) => {
    await cartService.removeItem(item.productId, item.variantId ?? 0)
    window.dispatchEvent(new Event('cart-updated'))
  }

  // Smart recommendations
  useEffect(() => {
    let mounted = true
    const controller = new AbortController()
    const brands = items.map((i) => i.brand).filter(Boolean)
    const cats = items.map((i) => (i as any).category).filter(Boolean)

    productService.list({ page_size: 40 } as any)
      .then((all: any[]) => {
        if (!mounted) return
        const inCart = new Set(items.map((i) => i.productId))
        const scored = all
          .filter((p) => p && (p.id || p.product_id) && !inCart.has(p.id || p.product_id))
          .map((p) => {
            let score = 0
            const b = p.brand || ''
            const c = p.category || ''
            const price = Number(p.variants?.[0]?.discount_price || p.variants?.[0]?.price || p.min_price || p.price || 0)
            const cartAvg = items.reduce((s, i) => s + i.price, 0) / Math.max(items.length, 1)
            if (brands.includes(b)) score += 5
            if (cats.includes(c)) score += 4
            if (b && c) score += 2
            if (Math.abs(price - cartAvg) < cartAvg * 0.6) score += 1
            if ((p.trending || p.is_trending)) score += 1
            return { p, score }
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 12)
          .map((s) => s.p)
        setRecommended(scored)
      })
      .catch(() => {})
      .finally(() => { if (mounted) setRecLoading(false) })
    return () => { mounted = false; controller.abort() }
  }, [items.length])

  // wishlist init
  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem('wishlist') || '[]').map((i: any) => typeof i === 'number' ? i : i.id)
      setWishlisted(new Set(ids))
    } catch {}
  }, [])

  // Lock page-level scroll (only the inner list scrolls)
  useEffect(() => {
    const prevBody = document.body.style.overflow
    const prevHtml = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevBody
      document.documentElement.style.overflow = prevHtml
    }
  }, [])

  const toggleWish = (p: any) => {
    const id = p.id || p.product_id
    setWishlisted((prev) => {
      const next = new Set(prev)
      const stored: number[] = JSON.parse(localStorage.getItem('wishlist') || '[]')
      if (next.has(id)) { next.delete(id); localStorage.setItem('wishlist', JSON.stringify(stored.filter((x) => x !== id))) }
      else { next.add(id); stored.push(id); localStorage.setItem('wishlist', JSON.stringify(stored)) }
      window.dispatchEvent(new Event('wishlist-updated'))
      return next
    })
  }

  if (cartLoading) {
    return (
      <div className="h-[100dvh] bg-[#FFFBFB] max-w-[480px] mx-auto flex flex-col font-sans" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
        <MobileTopSection title="My Cart" subtitle="Loading…" icon="cart" />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <DoubleRingLoader size={48} />
          <p className="text-[13px] text-[#6B7280] mt-4">Loading your cart…</p>
        </div>
        {Toast}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="h-[100dvh] bg-[#FFFBFB] max-w-[480px] mx-auto flex flex-col font-sans" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
        <MobileTopSection title="My Cart" subtitle="Review your items" icon="cart" />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
          <div className="w-28 h-28 rounded-3xl flex items-center justify-center mb-6" style={{ background: 'rgba(203,32,45,0.1)' }}>
            <ShoppingBag size={44} style={{ color: PURPLE }} />
          </div>
          <h2 className="text-xl font-bold text-[#1F2937]">Your cart is empty</h2>
          <p className="text-[13px] text-[#6B7280] mt-2 max-w-[260px]">Add items from the store to see them here.</p>
          <button onClick={() => navigate('/collection/all')} className="mt-6 h-12 px-8 rounded-full text-white text-[14px] font-bold active:scale-95 transition"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, #A81D2A)` }}>
            Start Shopping
          </button>
        </div>
        {Toast}
      </div>
    )
  }

  return (
    <div className="h-[100dvh] bg-[#FFFBFB] max-w-[480px] mx-auto flex flex-col font-sans overflow-hidden" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <MobileTopSection title="My Cart" subtitle={`${totalItems} ${totalItems === 1 ? 'item' : 'items'}`} icon="cart" />

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain px-3.5 pt-3 pb-4 space-y-3">
        {/* Cart items */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[15px] font-bold text-[#1F2937]">Your Cart</h3>
          <span className="text-[11px] text-[#6B7280] font-medium">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
        </div>
        {items.map((item) => {
          const img = resolveImage(item)
          const key = `${item.productId}-${item.variantId || 'default'}`
          const stock = stockMap[key]
          const atMax = stock && !stock.loading && item.quantity >= stock.stock
          const noStock = stock && !stock.loading && stock.stock === 0
          const stockLabel = stock?.loading
            ? 'Checking stock…'
            : noStock
              ? 'Out of Stock'
              : stock && stock.stock <= 5
                ? `Only ${stock.stock} left`
                : 'In Stock'
          const stockColor = noStock ? '#EF4444' : stock && stock.stock <= 5 ? '#0EA5E9' : SUCCESS
          return (
            <div key={key} className={`${card} p-2.5 flex gap-2.5`}>
              <button onClick={() => navigate(`/product/${item.productId}`)} className="relative w-[76px] h-[76px] rounded-xl bg-[#FFFBFB] overflow-hidden flex-shrink-0 active:scale-95 transition self-center">
                {img ? <img src={img} alt={item.name} className="w-full h-full object-contain p-1.5" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-[#64748B] text-2xl">📦</div>}
                <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: PURPLE }}>×{item.quantity}</span>
              </button>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-1.5">
                  <button onClick={() => navigate(`/product/${item.productId}`)} className="text-left min-w-0">
                    <h3 className="text-[13px] font-semibold text-[#1F2937] leading-snug line-clamp-1">{item.name}</h3>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {item.brand && <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(203,32,45,0.1)', color: PURPLE }}>{item.brand}</span>}
                      {item.storage && <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">{item.storage}</span>}
                      {item.ram && <span className="text-[9.5px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(203,32,45,0.1)', color: PURPLE }}>{item.ram} RAM</span>}
                      {item.color && <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">{item.color}</span>}
                    </div>
                  </button>
                  <button onClick={() => handleRemoveItem(item)} aria-label="Remove" className="text-[#94A3B8] hover:text-[#EF4444] active:scale-90 transition flex-shrink-0 -mr-1">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="min-w-0">
                    <span className="text-[15px] font-extrabold leading-none" style={{ color: PURPLE }}>₹{item.price.toLocaleString('en-IN')}</span>
                    <p className="text-[9.5px] font-semibold mt-0.5" style={{ color: stockColor }}>{stockLabel}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-[#FFFBFB] border border-[#E2E8F0] px-1 py-0.5">
                    <button onClick={() => handleUpdateQty(item, -1)} aria-label="Decrease" className="w-7 h-7 rounded-full flex items-center justify-center text-[#0F172A] active:scale-90 transition">
                      <Minus size={14} />
                    </button>
                    <span className="font-bold w-6 text-center text-[13px]">{item.quantity}</span>
                    <button onClick={() => handleUpdateQty(item, 1)} disabled={!!atMax || !!noStock} aria-label="Increase" className="w-7 h-7 rounded-full flex items-center justify-center text-white active:scale-90 transition disabled:opacity-30" style={{ background: `linear-gradient(135deg, ${PURPLE}, #A81D2A)` }}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Recommended */}
        <div className="mt-5 pt-1">
          <div className="flex items-center gap-2 px-1 mb-3">
            <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` }} />
            <div>
              <h3 className="text-[15px] font-bold text-[#1F2937] leading-none">Recommended for You</h3>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Frequently bought together</p>
            </div>
          </div>
          {recLoading ? (
            <div className="flex gap-3 overflow-hidden px-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-[150px] h-[230px] rounded-[20px] bg-[#E9E3FA] animate-pulse flex-shrink-0" />
              ))}
            </div>
          ) : recommended.length > 0 ? (
            <RecCarousel
              products={recommended}
              wishlisted={wishlisted}
              onAdd={async (p) => { await addProductToCart(p); showToast(`${p.product_name || p.name} added to cart`, 'success') }}
              onWish={toggleWish}
              onOpen={(id) => navigate(`/product/${id}`)}
            />
          ) : null}
        </div>

        {/* Coupon */}
        <div className={`${card} p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,32,45,0.1)' }}>
              <Tag size={16} style={{ color: PURPLE }} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#1F2937] leading-none">Apply Coupon</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Save more on your order</p>
            </div>
          </div>
          {couponApplied && activeCoupon ? (
            <div className="flex items-center justify-between pl-3 pr-2 py-2.5 rounded-2xl text-[12px] font-semibold" style={{ background: 'rgba(34,197,94,0.1)', color: '#16A34A' }}>
              <span className="flex items-center gap-1.5"><Check size={14} /> {activeCoupon} applied — {VALID_COUPONS[activeCoupon]?.label}</span>
              <button onClick={() => { setCouponApplied(false); setActiveCoupon(null); setCouponCode('') }} className="text-[#64748B] hover:text-[#EF4444] px-2 py-1 rounded-lg active:scale-90 transition">Remove</button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center h-12 px-4 rounded-2xl bg-[#FFFBFB] border border-[#E5E7EB] focus-within:border-[#FDD] transition">
                <Tag size={15} className="text-[#9CA3AF] mr-2.5 flex-shrink-0" />
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 h-full bg-transparent outline-none text-[14px] font-semibold tracking-wide text-[#1F2937] placeholder:text-[#9CA3AF] placeholder:font-medium placeholder:tracking-normal"
                />
              </div>
              <button onClick={handleApplyCoupon} className="w-full h-12 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition" style={{ background: `linear-gradient(135deg, ${PURPLE}, #A81D2A)`, boxShadow: '0 8px 20px rgba(203,32,45,0.32)' }}>
                <Tag size={16} /> Apply Coupon
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {Object.entries(VALID_COUPONS).slice(0, 3).map(([code, c]) => (
              <button key={code} onClick={() => setCouponCode(code)} disabled={couponApplied} className="text-[10px] font-semibold px-2.5 py-1 rounded-full border transition disabled:opacity-40 active:scale-95" style={{ borderColor: '#E5E7EB', color: PURPLE }}>
                {code} · {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shipping progress */}
        <div className={`${card} p-3`}>
          <div className="flex items-center justify-between text-[11px] mb-2 font-semibold" style={{ color: PURPLE }}>
            <span>Free Shipping</span>
            <span>{shipping === 0 ? 'Unlocked' : `₹${(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString('en-IN')} left`}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${shippingProgress}%`, background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` }} />
          </div>
        </div>

        {/* Summary */}
        <div className={`${card} p-3.5 space-y-2`}>
          <SummaryRow label="Subtotal" value={`₹${subtotal.toLocaleString('en-IN')}`} />
          <SummaryRow label="Shipping" value={shipping === 0 ? 'FREE' : `₹${shipping}`} highlight={shipping === 0} />
          <SummaryRow label={`Tax (GST ${(TAX_RATE * 100).toFixed(0)}%)`} value={`₹${tax.toLocaleString('en-IN')}`} />
          <SummaryRow label="Platform Fee" value={`₹${platformFee}`} />
          {deliveryTip > 0 && <SummaryRow label="Delivery Partner Tip" value={`₹${deliveryTip}`} highlight />}
          {couponApplied && activeCoupon && (
            <SummaryRow label={`Coupon (${activeCoupon})`} value={`-₹${discount.toLocaleString('en-IN')}`} highlight />
          )}
          <div className="pt-2 border-t border-[#EEF1F4] flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#1F2937]">Grand Total</span>
            <span className="text-[18px] font-bold" style={{ color: PURPLE }}>₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Delivery Partner Tip (bottom of page) */}
        <DeliveryTipCard
          tip={tip}
          setTip={setTip}
          customTip={customTip}
          setCustomTip={setCustomTip}
          instructions={instructions}
          setInstructions={setInstructions}
        />
      </div>

      {/* Sticky checkout bar */}
      <div className="flex-shrink-0 z-50 w-full bg-white/95 backdrop-blur-xl border-t border-[#EEF1F4] px-3.5 py-2.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] text-[#64748B]">Total ({totalItems} {totalItems === 1 ? 'item' : 'items'})</p>
            <p className="text-[17px] font-extrabold leading-none" style={{ color: PURPLE }}>₹{grandTotal.toLocaleString('en-IN')}</p>
          </div>
          <button
            onClick={() => {
              if (couponApplied && activeCoupon) {
                localStorage.setItem('checkout_coupon', JSON.stringify({ code: activeCoupon, discount }))
              } else {
                localStorage.removeItem('checkout_coupon')
              }
              localStorage.setItem('checkout_delivery_tip', String(deliveryTip))
              navigate('/checkout/address')
            }}
            className="flex-shrink-0 h-11 px-6 rounded-xl text-white text-[14px] font-bold active:scale-95 transition flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, #A81D2A)` }}
          >
            Checkout <ArrowLeft size={16} className="rotate-180" />
          </button>
        </div>
      </div>
      {Toast}
    </div>
  )
}

/* ---------- Recommended carousel ---------- */
function RecCarousel({ products, wishlisted, onAdd, onWish, onOpen }: {
  products: any[]; wishlisted: Set<number>; onAdd: (p: any) => void; onWish: (p: any) => void; onOpen: (id: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, scroll: 0, moved: false })

  const onDown = (e: React.MouseEvent) => {
    const t = trackRef.current; if (!t) return
    drag.current = { active: true, startX: e.clientX, scroll: t.scrollLeft, moved: false }
  }
  const onMove = (e: React.MouseEvent) => {
    if (!drag.current.active || !trackRef.current) return
    const dx = e.clientX - drag.current.startX
    if (Math.abs(dx) > 4) drag.current.moved = true
    trackRef.current.scrollLeft = drag.current.scroll - dx
  }
  const onUp = () => { drag.current.active = false }

  return (
    <div
      ref={trackRef}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      className="flex gap-3 overflow-x-auto pb-1 px-1 scroll-smooth snap-x"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      {products.map((p, idx) => {
        const id = p.id || p.product_id
        const img = getImageUrl(p.common_image || p.image || p.images?.[0] || p.thumbnail || '')
        const name = p.product_name || p.name || ''
        const brand = p.brand || ''
        const cur = Number(p.variants?.[0]?.discount_price || p.variants?.[0]?.price || p.min_price || p.price || 0)
        const mrp = Number(p.variants?.[0]?.price || p.mrp || 0)
        const off = mrp > cur ? Math.round(((mrp - cur) / mrp) * 100) : 0
        const rating = Number(p.rating) || 0
        const wished = wishlisted.has(id)
        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`${card} flex-shrink-0 w-[150px] h-[230px] snap-start flex flex-col overflow-hidden relative`}
            style={{ userSelect: 'none' }}
          >
            {off > 0 && (
              <span className="absolute top-2 left-2 z-10 text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: SUCCESS }}>
                {off}% OFF
              </span>
            )}
            <button
              onClick={() => onWish(p)}
              className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow"
              style={{ color: wished ? '#EC4899' : '#9CA3AF' }}
            >
              <Heart size={14} fill={wished ? '#EC4899' : 'none'} />
            </button>
            <button
              onClick={() => { if (!drag.current.moved) onOpen(id) }}
              className="h-[120px] bg-[#FFFBFB] flex items-center justify-center overflow-hidden"
            >
              {img ? <img src={img} alt={name} className="w-full h-full object-contain p-2" loading="lazy" draggable={false} /> : <span className="text-3xl">📦</span>}
            </button>
            <div className="flex-1 px-2.5 pt-2 flex flex-col min-h-0">
              {brand && <span className="text-[9px] font-bold uppercase truncate" style={{ color: PURPLE }}>{brand}</span>}
              <p className="text-[11.5px] font-semibold text-[#1F2937] leading-tight line-clamp-2">{name}</p>
              {rating > 0 && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <Star size={10} style={{ color: '#F59E0B' }} fill="#F59E0B" />
                  <span className="text-[10px] font-semibold text-[#1F2937]">{rating.toFixed(1)}</span>
                </div>
              )}
              <div className="mt-auto flex items-center justify-between gap-1 pt-1">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#1F2937] leading-none">₹{cur.toLocaleString('en-IN')}</p>
                  {mrp > cur && <p className="text-[9px] text-[#9CA3AF] line-through leading-none">₹{mrp.toLocaleString('en-IN')}</p>}
                </div>
                <button
                  onClick={() => onAdd(p)}
                  aria-label="Add to cart"
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center flex-shrink-0 active:scale-90 transition"
                  style={{ background: `linear-gradient(135deg, ${PURPLE}, #A81D2A)` }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ---------- Delivery Partner Tip ---------- */
function DeliveryTipCard({ tip, setTip, customTip, setCustomTip, instructions, setInstructions }: {
  tip: number | null; setTip: (v: number | null) => void; customTip: string; setCustomTip: (v: string) => void
  instructions: string; setInstructions: (v: string) => void
}) {
  const tips = [10, 20, 30, 50, 100]
  const activeTip = tip != null ? tip : (Number(customTip) || 0)
  const selectTip = (v: number) => { setTip(v); setCustomTip('') }
  return (
    <div className="rounded-[20px] p-4" style={{ background: '#F5F3FF' }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-[#1F2937] flex items-center gap-1.5">
            <span>Support Your Delivery Partner</span>
            <span className="text-[#EC4899]">❤️</span>
          </h3>
          <p className="text-[11.5px] text-[#6B7280] mt-0.5">100% of your tip goes directly to the delivery partner.</p>
        </div>
        {/* Rider illustration */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(203,32,45,0.12)' }}
        >
          <Bike size={30} style={{ color: PURPLE }} />
        </motion.div>
      </div>

      {/* Tip options */}
      <div className="grid grid-cols-5 gap-2 mt-3">
        {tips.map((t) => {
          const active = activeTip === t && tip != null
          return (
            <motion.button
              key={t}
              whileTap={{ scale: 0.92 }}
              onClick={() => selectTip(t)}
              className="h-11 rounded-2xl text-[13px] font-bold border-2 transition"
              style={active
                ? { background: `linear-gradient(135deg, ${PURPLE}, #A81D2A)`, color: '#fff', borderColor: 'transparent' }
                : { background: '#fff', color: PURPLE, borderColor: '#FDD' }}
            >
              ₹{t}
            </motion.button>
          )
        })}
      </div>

      {/* Custom tip */}
      <div className="mt-2">
        <div className="flex items-center gap-1 px-3 h-11 w-full rounded-2xl bg-white border-2" style={{ borderColor: customTip || activeTip > 0 ? PURPLE : '#E5E7EB' }}>
          <span className="text-[13px] font-bold text-[#6B7280]">₹</span>
          <input
            value={customTip}
            onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setCustomTip(v); if (v) setTip(null) }}
            inputMode="numeric"
            placeholder="Enter custom tip amount"
            className="flex-1 min-w-0 h-full bg-transparent outline-none text-[13px] font-semibold text-[#1F2937] placeholder:text-[#9CA3AF]"
          />
        </div>
        {activeTip > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white" style={{ background: SUCCESS }}>
            <Check size={13} /> Thank you for supporting your delivery partner!
          </motion.div>
        )}
      </div>

      {/* Delivery instructions */}
      <input
        value={instructions}
        onChange={(e) => setInstructions(e.target.value.slice(0, 200))}
        placeholder="Add delivery instructions (e.g. Leave at the door)"
        className="w-full h-11 px-3 mt-2 rounded-2xl bg-white border border-[#E5E7EB] outline-none text-[12.5px] text-[#1F2937]"
      />
      <p className="text-[10px] text-[#9CA3AF] mt-1 text-right">{instructions.length}/200</p>

      {/* Safety message */}
      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-2xl bg-white/70">
        <ShieldCheck size={16} style={{ color: SUCCESS }} />
        <p className="text-[11px] text-[#4B5563]">Your tip is transferred entirely to the delivery partner.</p>
      </div>
    </div>
  )
}

/* ---------- Header & rows ---------- */
function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-[#64748B]">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-[#16A34A]' : 'text-[#111827]'}`}>{value}</span>
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addressService, type AddressData } from '../../services/addressService'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Heart, Share2, Plus, Minus, Star, Truck, ShieldCheck, Check, Zap, ChevronDown, BadgeCheck, MapPin, ChevronRight, Search, Award, CreditCard, Repeat, Package, Tag, Flame, Gift, ShoppingBag } from 'lucide-react'
import { productService } from '../../services/productService'
import { authService } from '../../services/authService'
import { useMobileToast } from './useMobileToast'
import { getImageUrl, getProductImage } from './helpers'
import { FALLBACK_IMG } from './fallback'
import { VALID_COUPONS } from './cartLogic'
import MobileCartBarActions from './MobileCartBarActions'

const COLOR_PALETTE: Record<string, string> = {
  black: '#1a1a1a', white: '#f0f0f0', silver: '#c0c0c0', gray: '#808080',
  'titanium gray': '#6b7280', 'titanium black': '#374151', 'natural titanium': '#d4c5a9',
  'blue titanium': '#2563eb', 'white titanium': '#e5e7eb', green: '#22c55e',
  midnight: '#1e293b', starlight: '#faf5eb', rose: '#e11d48', gold: '#f59e0b',
  graphite: '#4b5563', red: '#ef4444', blue: '#3b82f6', purple: '#7c3aed',
}

const PURPLE = '#6C3BFF'
const PURPLE_DEEP = '#4B2ECC'
const SUCCESS = '#16A34A'

const card = 'bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]'

export default function MobileProductDetail() {
  const navigate = useNavigate()
  const { productId, id } = useParams()
  const resolvedId = productId || id
  const { show: showToast, Toast } = useMobileToast()

  useEffect(() => {
    addressService.list()
      .then((data: AddressData[]) => {
        const def = data.find(a => a.isDefault) || data[0]
        if (def?.zipCode) setDeliveryPincode(def.zipCode)
      })
      .catch(() => {})
  }, [])

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [selectedColorIdx, setSelectedColorIdx] = useState(0)
  const [selectedStorageIdx, setSelectedStorageIdx] = useState(0)
  const [selectedRamIdx, setSelectedRamIdx] = useState(0)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [wished, setWished] = useState(false)
  const [, setAdded] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [cartError, setCartError] = useState('')
  const [related, setRelated] = useState<any[]>([])
  const [relatedFlash, setRelatedFlash] = useState<Record<number, boolean>>({})
  const [cartCount, setCartCount] = useState(0)
  const [deliveryPincode, setDeliveryPincode] = useState('600001')
  const [cartTick, setCartTick] = useState(0)
  const [specsOpen, setSpecsOpen] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [descOpen, setDescOpen] = useState(false)
  const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({})
  const [zoomScale, setZoomScale] = useState(1)
  const [zoomOrigin, setZoomOrigin] = useState('center center')
  const trackRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const dragX = useRef(0)

  useEffect(() => {
    if (!resolvedId) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setFetchError('')
    productService.getById(Number(resolvedId))
      .then((res) => { if (!cancelled) setProduct(res) })
      .catch((err) => { if (!cancelled) setFetchError(err?.message || 'Failed to load product') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [resolvedId])

  useEffect(() => {
    try { setWished(new Set<number>((JSON.parse(localStorage.getItem('wishlist') || '[]') as any[]).map((i: any) => typeof i === 'number' ? i : i.id)).has(Number(resolvedId))) } catch { setWished(false) }
  }, [resolvedId])

  useEffect(() => {
    const update = () => {
      try { setCartCount((JSON.parse(localStorage.getItem('cart') || '[]') as any[]).reduce((s: number, i: any) => s + (i.quantity || 1), 0)) } catch { setCartCount(0) }
      setCartTick((t) => t + 1)
    }
    update()
    window.addEventListener('cart-updated', update)
    window.addEventListener('wishlist-updated', update)
    return () => {
      window.removeEventListener('cart-updated', update)
      window.removeEventListener('wishlist-updated', update)
    }
  }, [])

  // Reset per-product UI state whenever a different product is opened (e.g. from Similar Products)
  useEffect(() => {
    setAdded(false)
    setQty(1)
    setCartError('')
    setSelectedVariantId(null)
    setSelectedColorIdx(0)
    setSelectedStorageIdx(0)
    setSelectedRamIdx(0)
    setImgLoaded({})
    setZoomScale(1)
    setZoomOrigin('center center')
    setSpecsOpen(false)
    setReviewsOpen(false)
    setDescOpen(false)
  }, [product?.id])

  const { colors, storageOptions, ramOptions, variants } = useMemo(() => {
    if (product?.variants?.length > 0) {
      const cols = [...new Set(product.variants.map((v: any) => v.color).filter(Boolean))] as string[]
      const store = [...new Set(product.variants.map((v: any) => v.storage).filter(Boolean))] as string[]
      const ram = [...new Set(product.variants.map((v: any) => v.ram).filter(Boolean))] as string[]
      return { colors: cols, storageOptions: store, ramOptions: ram, variants: product.variants }
    }
    return { colors: (product?.colors || []) as string[], storageOptions: (product?.storage || []) as string[], ramOptions: (product?.ram || []) as string[], variants: [] as any[] }
  }, [product])

  const activeVariant = useMemo(() => {
    if (variants.length > 0) {
      if (selectedVariantId) return variants.find((v: any) => String(v.id) === selectedVariantId) || variants[0]
      const match = variants.find((v: any) => {
        const cm = !colors.length || !v.color || v.color === colors[selectedColorIdx]
        const sm = !storageOptions.length || !v.storage || v.storage === storageOptions[selectedStorageIdx]
        const rm = !ramOptions.length || !v.ram || v.ram === ramOptions[selectedRamIdx]
        return cm && sm && rm
      })
      return match || variants[0]
    }
    return null
  }, [variants, selectedVariantId, selectedColorIdx, selectedStorageIdx, selectedRamIdx, colors, storageOptions, ramOptions])

  const isInCart = useMemo(() => {
    if (!product?.id) return false
    try {
      const c = JSON.parse(localStorage.getItem('cart') || '[]')
      return c.some((i: any) => i.productId === product.id && i.variantId === (activeVariant?.id || null))
    } catch { return false }
  }, [product?.id, activeVariant?.id, cartTick])

  useEffect(() => { setSelectedImage(0) }, [activeVariant?.id])

  useEffect(() => {
    if (!product?.id) return
    productService.list({ page_size: 10, ordering: '-created' } as any)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.results || []
        setRelated(list.filter((p: any) => Number(p.id) !== Number(resolvedId)).slice(0, 12))
      })
      .catch(() => {})
  }, [product?.id, resolvedId])

  const images = useMemo(() => {
    if (activeVariant?.images?.length > 0) return (activeVariant.images as any[]).map((i) => getImageUrl(typeof i === 'string' ? i : i.image || i.url || '')).filter(Boolean)
    if (product?.images?.length > 0) return (product.images as any[]).map((i) => getImageUrl(typeof i === 'string' ? i : i.image || i.url || '')).filter(Boolean)
    const fb = getProductImage(product)
    return fb ? [fb] : [FALLBACK_IMG]
  }, [activeVariant, product])

  const currentPrice = activeVariant?.discountPrice || activeVariant?.price || product?.price || 0
  const mrp = activeVariant?.price && activeVariant?.discountPrice ? activeVariant.price : (product?.oldPrice || product?.price || 0)
  const inStock = activeVariant ? activeVariant.stock > 0 : (product?.inStock ?? true)
  const stockQty = activeVariant?.stock ?? product?.stock ?? 99
  const discountPct = mrp > currentPrice && mrp > 0 ? Math.round((1 - currentPrice / mrp) * 100) : 0
  const saveAmount = mrp > currentPrice ? mrp - currentPrice : 0
  const productName = product?.name || product?.product_name || 'Product'
  const productBrand = product?.brand || ''
  const productModel = product?.model || product?.model_number || ''
  const productCategory = product?.category || product?.category_name || ''
  const productSubCategory = product?.subcategory || product?.sub_category_name || ''
  const description = product?.description || ''
  const features = product?.features || []
  const careInstructions = product?.careInstructions || []
  const rating = product?.rating || 4.0
  const ratingCount = product?.ratingCount || product?.rating_count || 128
  const sold = product?.sold || 0
  const trending = product?.trending
  const newArrival = product?.newArrival
  const bestSelling = product?.bestSelling
  const featured = product?.featured
  const videoUrl = product?.videoUrl || ''
  const lowStockAlert = activeVariant?.lowStockAlert ?? product?.lowStockAlert ?? 5

  const goTo = (i: number) => setSelectedImage((i + images.length) % images.length)
  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; dragX.current = 0 }
  const onTouchMove = (e: React.TouchEvent) => { dragX.current = e.touches[0].clientX - startX.current }
  const onTouchEnd = () => { if (Math.abs(dragX.current) > 40) goTo(selectedImage + (dragX.current < 0 ? 1 : -1)) }

  const toggleWishlist = () => {
    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', window.location.pathname)
      navigate('/login')
      return
    }
    const storedSet = new Set<number>((JSON.parse(localStorage.getItem('wishlist') || '[]') as any[]).map((i: any) => typeof i === 'number' ? i : i.id))
    if (storedSet.has(Number(resolvedId))) {
      storedSet.delete(Number(resolvedId))
      setWished(false)
      showToast('Removed from wishlist', 'success')
    } else {
      storedSet.add(Number(resolvedId))
      setWished(true)
      showToast('Added to wishlist', 'success')
    }
    localStorage.setItem('wishlist', JSON.stringify(Array.from(storedSet)))
    window.dispatchEvent(new Event('wishlist-updated'))
  }

  const validateStock = (requestedQty: number): string | null => {
    if (!inStock) return 'This product is currently out of stock'
    if (requestedQty > stockQty) return `Only ${stockQty} units available. You requested ${requestedQty}.`
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find((item: any) => item.productId === product.id && item.variantId === (activeVariant?.id || null))
    const totalInCart = existing ? existing.quantity + requestedQty : requestedQty
    if (totalInCart > stockQty) {
      const canAdd = stockQty - (existing?.quantity || 0)
      return canAdd <= 0 ? `${existing.quantity} already in cart — no more stock available.` : `Only ${canAdd} more can be added (${existing.quantity} already in cart, ${stockQty} in stock).`
    }
    return null
  }

  const addToCart = () => {
    if (isAdding) return
    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', window.location.pathname)
      navigate('/login')
      return
    }
    const error = validateStock(qty)
    if (error) { setCartError(error); showToast(error, 'error'); return }

    setIsAdding(true)
    setCartError('')
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')

    const existingIdx = cart.findIndex((item: any) =>
      item.productId === product.id && item.variantId === (activeVariant?.id || null)
    )

    if (existingIdx >= 0) {
      cart.splice(existingIdx, 1)
      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cart-updated'))
      setAdded(false)
      setIsAdding(false)
      showToast('Removed from cart!', 'success')
    } else {
      cart.push({
        productId: product.id, variantId: activeVariant?.id || null, name: productName,
        brand: productBrand, price: currentPrice, image: images[0] || '', quantity: qty,
        storage: activeVariant?.storage || '',
        ram: activeVariant?.ram || '',
        color: activeVariant?.color || '',
      })
      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cart-updated'))
      setAdded(true)
      setIsAdding(false)
      showToast(`Added ${qty} item${qty > 1 ? 's' : ''} to cart!`, 'success')
    }
  }

  const buyNow = () => {
    if (isAdding) return
    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', window.location.pathname)
      navigate('/login')
      return
    }
    const error = validateStock(qty)
    if (error) { setCartError(error); showToast(error, 'error'); return }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingIdx = cart.findIndex((item: any) =>
      item.productId === product.id && item.variantId === (activeVariant?.id || null)
    )
    if (existingIdx >= 0) { cart[existingIdx].quantity += qty }
    else {
      cart.push({
        productId: product.id, variantId: activeVariant?.id || null, name: productName,
        brand: productBrand, price: currentPrice, image: images[0] || '', quantity: qty,
        storage: activeVariant?.storage || '',
        ram: activeVariant?.ram || '',
        color: activeVariant?.color || '',
      })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
    navigate('/cart')
  }

  const addRelatedToCart = (p: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', window.location.pathname)
      navigate('/login')
      return
    }
    const v = (p.variants || [])[0]
    const price = v?.discountPrice || v?.price || p.price || 0
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const idx = cart.findIndex((i: any) => i.productId === p.id && i.variantId === (v?.id || null))
    if (idx >= 0) { cart[idx].quantity += 1 }
    else {
      cart.push({
        productId: p.id, variantId: v?.id || null, name: p.name,
        brand: p.brand || '', price, image: getImageUrl(p.image) || getProductImage(p) || '', quantity: 1,
        storage: v?.storage || '', ram: v?.ram || '', color: v?.color || '',
      })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
    showToast('Added to cart!', 'success')
    setRelatedFlash((f) => ({ ...f, [p.id]: true }))
    setTimeout(() => setRelatedFlash((f) => ({ ...f, [p.id]: false })), 1500)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: productName, text: `Check out ${productName} by ${productBrand}`, url }) } catch { return }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        showToast('Link copied to clipboard!', 'success')
      } catch {
        showToast('Failed to copy link', 'error')
      }
    }
  }

  const deliveryItems = [
    { icon: Truck, label: 'Fast Delivery' },
    { icon: ShieldCheck, label: 'Genuine Product' },
    { icon: CreditCard, label: 'Secure Payment' },
    { icon: Repeat, label: 'Easy Returns' },
    { icon: Award, label: 'Warranty' },
    { icon: Package, label: 'Cash on Delivery' },
  ]

  const offerRows = [
    { icon: '🎁', title: 'Bank Offer', sub: '10% off with select cards' },
    { icon: '💳', title: 'No Cost EMI', sub: 'From ₹3,499/month' },
    { icon: '🔥', title: 'Exchange Offer', sub: 'Up to ₹5,000 off' },
    { icon: '🎉', title: 'Cashback', sub: 'Earn ₹500 extra' },
  ]

  const specGroups = useMemo(() => {
    const specs = product?.specs || product?.specifications || product?.specification || {}
    const entries: [string, any][] = Object.entries(specs).filter(([, v]) => v !== undefined && v !== null && v !== '') as [string, any][]
    const add = (k: string, v: any) => { if (v !== undefined && v !== null && v !== '') entries.push([k, v]) }
    add('Brand', productBrand)
    add('Model', productModel)
    add('Category', productCategory)
    add('Type', productSubCategory)
    add('Processor', activeVariant?.processor || product?.processor)
    add('Display', activeVariant?.display || product?.display)
    add('RAM', ramOptions[selectedRamIdx] || product?.ram)
    add('Storage', storageOptions[selectedStorageIdx] || product?.storage)
    add('Camera', activeVariant?.camera || product?.camera)
    add('Battery', activeVariant?.battery ? `${activeVariant.battery} mAh` : product?.battery)
    add('Color', activeVariant?.color || colors[selectedColorIdx])
    add('Operating System', product?.os)
    add('Weight', product?.weight)
    add('Warranty', product?.warranty || '1 Year Manufacturer Warranty')
    return entries.length ? entries : [
      ['Processor', activeVariant?.processor || '—'],
      ['Display', activeVariant?.display || '—'],
      ['RAM', ramOptions[selectedRamIdx] || '—'],
      ['Storage', storageOptions[selectedStorageIdx] || '—'],
      ['Battery', activeVariant?.battery ? `${activeVariant.battery} mAh` : '—'],
      ['Camera', activeVariant?.camera || '—'],
      ['Warranty', '1 Year Manufacturer Warranty'],
    ]
  }, [product, ramOptions, storageOptions, selectedRamIdx, selectedStorageIdx, activeVariant, productBrand, productModel, productCategory, productSubCategory, colors, selectedColorIdx])

  const reviews = product?.reviews || [
    { name: 'Aarav S.', rating: 5, comment: 'Absolutely love it! Premium build and fast performance.', date: '2 days ago', verified: true },
    { name: 'Meera K.', rating: 4, comment: 'Great phone, battery could be better but worth it.', date: '1 week ago', verified: true },
    { name: 'Rohit P.', rating: 5, comment: 'Best in this price range. Highly recommend!', date: '2 weeks ago', verified: false },
  ]

  const coupons = Object.entries(VALID_COUPONS).map(([code, c]) => ({ code, label: c.label, discount: c.discount, fixed: !!c.fixed }))

  const [dealLeft, setDealLeft] = useState({ h: '05', m: '59', s: '59' })
  useEffect(() => {
    const id = setInterval(() => {
      let s = parseInt(dealLeft.s) - 1
      let m = parseInt(dealLeft.m)
      let h = parseInt(dealLeft.h)
      if (s < 0) { s = 59; m-- }
      if (m < 0) { m = 59; h-- }
      if (h < 0) { h = 0; m = 0; s = 0 }
      setDealLeft({ h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0'), s: String(s).padStart(2, '0') })
    }, 1000)
    return () => clearInterval(id)
  }, [dealLeft.s, dealLeft.m, dealLeft.h])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] max-w-[480px] mx-auto font-sans overflow-x-hidden">
        <div className="h-[60px] bg-[#F8F9FF] border-b border-[#EEF1F4] animate-pulse" />
        <div className="px-3 mt-3">
          <div className={`${card} p-2`}>
            <div className="h-[400px] rounded-2xl bg-[#F4F4F7] animate-pulse" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="h-5 w-1/2 bg-[#E9E3FA] rounded animate-pulse" />
          <div className="h-7 w-3/4 bg-[#E9E3FA] rounded animate-pulse" />
          <div className="h-10 w-full bg-[#E9E3FA] rounded-2xl animate-pulse" />
          <div className="h-24 w-full bg-[#E9E3FA] rounded-[20px] animate-pulse" />
        </div>
      </div>
    )
  }

  if (fetchError || !product) {
    return (
      <div className="min-h-screen bg-white max-w-[480px] mx-auto flex flex-col items-center justify-center p-8 text-center font-sans">
        <p className="text-[15px] font-bold text-[#1F2937] mb-2">Product not found</p>
        <p className="text-[13px] text-[#6B7280] mb-6">{fetchError || 'This product is unavailable.'}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-full text-white text-[13px] font-bold" style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>Go Back</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] max-w-[480px] mx-auto pb-[120px] font-sans text-[#1F2937] overflow-x-hidden" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* Sticky top bar — product page style (white/neutral, no purple gradient) */}
      <div className="sticky top-0 z-40 w-full bg-[#F8F9FF]/95 backdrop-blur-xl border-b border-[#EEF1F4]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-3 py-2.5 flex items-center gap-2.5">
          <button onClick={() => navigate(-1)} aria-label="Back" className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] shadow-[0_4px_14px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-90 transition flex-shrink-0">
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>
          <form onSubmit={(e) => { e.preventDefault(); navigate('/search') }} className="flex-1 h-11 min-w-0 rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex items-center gap-2 px-3.5 active:scale-[0.99] transition">
            <Search size={18} className="text-[#9CA3AF] flex-shrink-0" />
            <input
              placeholder="Search for products"
              aria-label="Search products"
              className="flex-1 bg-transparent text-[13px] text-[#1F2937] placeholder:text-[#9CA3AF] outline-none min-w-0"
            />
          </form>
          <button onClick={() => navigate('/wishlist')} aria-label="Wishlist" className="relative w-10 h-10 rounded-full bg-white border border-[#E5E7EB] shadow-[0_4px_14px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-90 transition flex-shrink-0">
            <Heart size={19} className={wished ? 'text-[#EC4899] fill-[#EC4899]' : 'text-[#1F2937]'} />
            {wished && <span className="absolute top-1 right-1.5 w-2 h-2 bg-[#22C55E] rounded-full ring-2 ring-white" />}
          </button>
          <button onClick={() => navigate('/cart')} aria-label="Cart" className="relative w-10 h-10 rounded-full bg-white border border-[#E5E7EB] shadow-[0_4px_14px_rgba(0,0,0,0.08)] flex items-center justify-center active:scale-90 transition flex-shrink-0">
            <ShoppingBag size={19} className="text-[#1F2937]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Deal of the day — flash sale banner with countdown */}
      <div className="px-3 mt-3">
        <div className="relative overflow-hidden rounded-[20px] p-4 text-white" style={{ background: 'linear-gradient(135deg,#6C3BFF 0%,#4B2ECC 100%)', boxShadow: '0 10px 30px rgba(108,59,255,0.30)' }}>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-[#FFD54F]" fill="#FFD54F" />
              <span className="text-[13px] font-extrabold uppercase tracking-wide">Deal of the Day</span>
            </div>
            <div className="flex items-center gap-1">
              {[dealLeft.h, dealLeft.m, dealLeft.s].map((u, i) => (
                <span key={i} className="bg-white/20 text-white text-[12px] font-bold px-1.5 py-1 rounded-md tabular-nums min-w-[26px] text-center">{u}</span>
              ))}
            </div>
          </div>
          <p className="relative text-[15px] font-black mt-1.5 leading-tight">
            {discountPct > 0 ? `Save extra ${discountPct}% today!` : 'Extra cashback on this product'}
          </p>
          <p className="relative text-[11px] text-white/80 mt-0.5">Limited time offer · Ends soon</p>
        </div>
      </div>

      {/* Coupon strip — apply to cart */}
      <div className="px-3 mt-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory">
          {coupons.map((c) => (
            <button key={c.code}
              onClick={() => { navigator.clipboard?.writeText(c.code).catch(() => {}); showToast(`Coupon ${c.code} copied!`, 'success') }}
              className="snap-start flex-shrink-0 flex items-center gap-2 h-14 pl-3 pr-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_4px_14px_rgba(108,59,255,0.08)] active:scale-[0.97] transition relative overflow-hidden">
              <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#6C3BFF,#4B2ECC)' }}><Tag size={15} className="text-white" /></span>
              <div className="text-left">
                <p className="text-[14px] font-extrabold leading-tight text-[#1F2937]">{c.label}</p>
                <p className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mt-0.5" style={{ color: PURPLE, background: '#F1ECFF' }}>{c.code}</p>
              </div>
            </button>
          ))}
          <div className={`snap-start flex-shrink-0 flex items-center gap-2 h-14 pl-3 pr-4 rounded-2xl text-white`} style={{ background: 'linear-gradient(135deg,#16A34A,#15803D)' }}>
            <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"><Gift size={15} className="text-white" /></span>
            <div className="text-left">
              <p className="text-[13px] font-extrabold leading-tight">Free Delivery</p>
              <p className="text-[10px] text-white/85">On this order</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width premium image gallery (full-bleed, Zomato-style) */}
      <div className="px-3 mt-3">
        <div className={`${card} overflow-hidden p-0`}>
          <div
            ref={trackRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="relative overflow-hidden"
            style={{
              height: 340,
              borderRadius: 24,
              background: 'linear-gradient(180deg,#ffffff 0%,#f5f6ff 100%)',
            }}
          >
            {/* subtle shine animation */}
            <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
              <div className="absolute -inset-y-10 -left-1/3 w-1/3 skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shine_3.5s_ease-in-out_infinite]" />
            </div>

            <div className="flex w-full h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${selectedImage * 100}%)` }}>
              {images.map((img, i) => (
                <div key={i} className="w-full h-full flex-shrink-0 relative overflow-hidden">
                  {!imgLoaded[i] && (
                    <div className="absolute inset-0 bg-[#F1F2F6] animate-pulse flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full border-4 border-[#E0E0EA] border-t-[#6C3BFF] animate-spin" />
                    </div>
                  )}
                  <img
                    ref={(el) => {
                      if (el && el.complete && el.naturalWidth > 0) {
                        setImgLoaded((p) => (p[i] ? p : { ...p, [i]: true }))
                      }
                    }}
                    src={img || FALLBACK_IMG}
                    alt={productName}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                    onClick={(e) => {
                      if (zoomScale > 1) { setZoomScale(1); setZoomOrigin('center center'); return }
                      const rect = (e.currentTarget as HTMLImageElement).getBoundingClientRect()
                      const x = ((e.clientX - rect.left) / rect.width) * 100
                      const y = ((e.clientY - rect.top) / rect.height) * 100
                      setZoomOrigin(`${x}% ${y}%`)
                      setZoomScale(zoomScale === 1 ? 2 : zoomScale === 2 ? 3 : 1)
                    }}
                    onLoad={() => setImgLoaded((p) => ({ ...p, [i]: true }))}
                    onError={(e) => {
                      setImgLoaded((p) => ({ ...p, [i]: true }))
                      ;(e.target as HTMLImageElement).src = FALLBACK_IMG
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      opacity: imgLoaded[i] ? 1 : 0,
                      transition: 'opacity .3s ease, transform .25s ease',
                      transform: `scale(${zoomScale > 1 && i === selectedImage ? zoomScale : 1})`,
                      transformOrigin: i === selectedImage ? zoomOrigin : 'center center',
                      touchAction: 'pinch-zoom',
                      cursor: 'zoom-in',
                    }}
                    className="select-none"
                  />
                </div>
              ))}
            </div>

          {/* Floating overlay buttons top-right */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
            <button onClick={toggleWishlist} aria-label="Wishlist" className="w-12 h-12 rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.12)] flex items-center justify-center active:scale-90 transition" style={wished ? { background: '#FEE2F2' } : undefined}>
              <motion.span animate={wished ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                <Heart size={21} className={wished ? 'text-[#EC4899] fill-[#EC4899]' : 'text-[#6C3BFF]'} />
              </motion.span>
            </button>
            <button onClick={handleShare} aria-label="Share" className="w-12 h-12 rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.12)] flex items-center justify-center active:scale-90 transition">
              <Share2 size={20} className="text-[#6C3BFF]" />
            </button>
          </div>

          {/* Discount badge */}
          {discountPct > 0 && (
            <span className="absolute top-3 left-3 z-20 text-[11px] font-extrabold text-white px-3 py-1 rounded-full bg-gradient-to-r from-[#EF4444] to-[#F97316] shadow-[0_6px_16px_rgba(239,68,68,0.4)]">
              {discountPct}% OFF
            </span>
          )}

          {/* Rating badge bottom-left */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur shadow-[0_4px_14px_rgba(0,0,0,0.12)]">
            <span className="text-[12px] font-bold text-[#1F2937]">{rating.toFixed(1)}</span>
            <Star size={12} fill="#F59E0B" className="text-[#F59E0B]" />
            <span className="text-[10px] text-[#6B7280]">({ratingCount})</span>
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 z-20 text-[11px] font-semibold text-[#1F2937] bg-white/90 backdrop-blur px-2.5 py-1 rounded-full shadow">
              {selectedImage + 1}/{images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2.5 px-2 py-2 overflow-x-auto scrollbar-hide">
            {images.map((img, i) => (
              <button key={i} onClick={() => goTo(i)} className={`w-[72px] h-[72px] rounded-2xl overflow-hidden flex-shrink-0 border-2 transition ${i === selectedImage ? 'border-[#6C3BFF] scale-105 shadow-[0_4px_12px_rgba(108,59,255,0.3)]' : 'border-transparent'}`} style={{ background: '#F1F2F6' }}>
                <img src={img || FALLBACK_IMG} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Product info */}
      <div className="px-3 mt-3">
        <div className={`${card} p-4`}>
          {/* Badges */}
          {(trending || newArrival || bestSelling || featured) && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {featured && <span className="text-[10px] font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-full" style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>Featured</span>}
              {bestSelling && <span className="text-[10px] font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-full bg-[#16A34A]">Best Seller</span>}
              {trending && <span className="text-[10px] font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-full bg-[#EA580C]">Trending</span>}
              {newArrival && <span className="text-[10px] font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-full bg-[#0EA5E9]">New Arrival</span>}
            </div>
          )}
          {productBrand && (
            <p className="text-[14px] font-medium" style={{ color: PURPLE }}>{productBrand}</p>
          )}
          <h1 className="text-[22px] font-bold leading-snug mt-1">{productName}</h1>

          {/* Meta: model / category / subcategory */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
            {productModel && <p className="text-[11px] text-[#9CA3AF]">Model: <span className="font-semibold text-[#6B7280]">{productModel}</span></p>}
            {productCategory && <p className="text-[11px] text-[#9CA3AF]">Category: <span className="font-semibold text-[#6B7280]">{productCategory}</span></p>}
            {productSubCategory && <p className="text-[11px] text-[#9CA3AF]">Type: <span className="font-semibold text-[#6B7280]">{productSubCategory}</span></p>}
          </div>

          <div className="flex items-center gap-3 mt-2.5">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#ECFDF5]">
              <span className="text-[12px] font-bold" style={{ color: SUCCESS }}>{rating.toFixed(1)}</span>
              <Star size={12} fill="#16A34A" className="text-[#16A34A]" />
            </div>
            <span className="text-[12px] text-[#6B7280]">{ratingCount} Ratings</span>
            {sold > 0 && <span className="text-[12px] text-[#6B7280]">· {sold} Sold</span>}
          </div>

          {/* Price */}
          <div className="flex items-end gap-2.5 mt-3.5 flex-wrap">
            <span className="text-[28px] font-black">₹{Number(currentPrice).toLocaleString('en-IN')}</span>
            {mrp > currentPrice && <span className="text-[15px] text-[#9CA3AF] line-through mb-1.5">₹{Number(mrp).toLocaleString('en-IN')}</span>}
            {discountPct > 0 && (
              <span className="text-[12px] font-extrabold px-2.5 py-1 rounded-full mb-1.5" style={{ color: SUCCESS, background: '#ECFDF5' }}>{discountPct}% off</span>
            )}
          </div>

          {saveAmount > 0 && (
            <p className="text-[13px] font-semibold mt-1.5" style={{ color: SUCCESS }}>You Save ₹{saveAmount.toLocaleString('en-IN')} ({discountPct}%)</p>
          )}
          <p className="text-[12px] text-[#6B7280] mt-1">EMI starting from ₹{Math.ceil(Number(currentPrice) / 24).toLocaleString('en-IN')}/month</p>

          {/* Variant quick specs */}
          {(activeVariant?.processor || activeVariant?.display || activeVariant?.camera || activeVariant?.battery) && (
            <div className="grid grid-cols-2 gap-2 mt-3.5">
              {activeVariant?.processor && (
                <div className="bg-[#F8F9FF] rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <Zap size={15} className="text-[#6C3BFF] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0"><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Processor</p><p className="text-[12px] font-semibold leading-tight truncate">{activeVariant.processor}</p></div>
                </div>
              )}
              {activeVariant?.display && (
                <div className="bg-[#F8F9FF] rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <span className="text-[15px] mt-0.5 flex-shrink-0">📱</span>
                  <div className="min-w-0"><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Display</p><p className="text-[12px] font-semibold leading-tight truncate">{activeVariant.display}</p></div>
                </div>
              )}
              {activeVariant?.camera && (
                <div className="bg-[#F8F9FF] rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <span className="text-[15px] mt-0.5 flex-shrink-0">📷</span>
                  <div className="min-w-0"><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Camera</p><p className="text-[12px] font-semibold leading-tight truncate">{activeVariant.camera}</p></div>
                </div>
              )}
              {activeVariant?.battery > 0 && (
                <div className="bg-[#F8F9FF] rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <span className="text-[15px] mt-0.5 flex-shrink-0">🔋</span>
                  <div className="min-w-0"><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Battery</p><p className="text-[12px] font-semibold leading-tight truncate">{activeVariant.battery} mAh</p></div>
                </div>
              )}
            </div>
          )}

          {/* Variation list (functional) */}
          {variants.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">Select Variant</p>
              <div className="flex flex-col gap-2">
                {variants.map((v: any) => {
                  const selected = (selectedVariantId ? String(v.id) === selectedVariantId : activeVariant?.id === v.id)
                  const vPrice = v.discountPrice || v.price || 0
                  const vMrp = v.discountPrice ? v.price : 0
                  const vOff = vMrp > vPrice ? Math.round((1 - vPrice / vMrp) * 100) : 0
                  return (
                    <button key={v.id} onClick={() => setSelectedVariantId(String(v.id))}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl border-2 text-left transition active:scale-[0.99] ${selected ? 'border-transparent' : 'bg-white border-[#E5E7EB]'}`}
                      style={selected ? { background: '#F1ECFF', borderColor: PURPLE } : undefined}>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold truncate">{v.name || `${v.color || ''} ${v.storage || ''} ${v.ram || ''}`.trim()}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {v.color && <span className="text-[11px] text-[#6B7280]">{v.color}</span>}
                          {v.storage && <span className="text-[11px] text-[#6B7280]">· {v.storage}</span>}
                          {v.ram && <span className="text-[11px] text-[#6B7280]">· {v.ram}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-[14px] font-black">₹{Number(vPrice).toLocaleString('en-IN')}</p>
                          {vMrp > vPrice && <p className="text-[10px] text-[#9CA3AF] line-through">₹{Number(vMrp).toLocaleString('en-IN')}</p>}
                        </div>
                        {vOff > 0 && <span className="text-[10px] font-extrabold rounded-full px-1.5 py-0.5" style={{ color: SUCCESS, background: '#ECFDF5' }}>{vOff}%</span>}
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-[#6C3BFF] bg-[#6C3BFF]' : 'border-[#D1D5DB]'}`}>
                          {selected && <Check size={12} className="text-white" />}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Color selection */}
          {colors.length > 0 && (
            <div className="mt-4">
              <p className="text-[13px] font-bold mb-2">Color: <span className="font-medium text-[#6B7280] capitalize">{colors[selectedColorIdx]}</span></p>
              <div className="flex gap-3">
                {colors.map((c: string, i: number) => (
                  <button key={c} onClick={() => { setSelectedColorIdx(i); setSelectedVariantId(null) }}
                    className={`w-11 h-11 rounded-full border-2 transition active:scale-90 ${i === selectedColorIdx ? 'border-[#6C3BFF] scale-110 shadow-[0_4px_12px_rgba(108,59,255,0.35)]' : 'border-[#E5E7EB]'}`}
                    style={{ backgroundColor: COLOR_PALETTE[c.toLowerCase().trim()] || '#ccc' }} title={c} />
                ))}
              </div>
            </div>
          )}

          {/* Storage / Size selection */}
          {storageOptions.length > 0 && (
            <div className="mt-4">
              <p className="text-[13px] font-bold mb-2">Storage</p>
              <div className="flex gap-2 flex-wrap">
                {storageOptions.map((s: string, i: number) => (
                  <button key={s} onClick={() => { setSelectedStorageIdx(i); setSelectedVariantId(null) }}
                    className={`min-w-[48px] h-11 px-3 rounded-2xl text-[13px] font-bold border transition active:scale-95 ${i === selectedStorageIdx ? 'border-transparent text-white' : 'bg-white text-[#1F2937] border-[#E5E7EB]'}`}
                    style={i === selectedStorageIdx ? { background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` } : undefined}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* RAM selection */}
          {ramOptions.length > 0 && (
            <div className="mt-4">
              <p className="text-[13px] font-bold mb-2">RAM</p>
              <div className="flex gap-2 flex-wrap">
                {ramOptions.map((r: string, i: number) => (
                  <button key={r} onClick={() => { setSelectedRamIdx(i); setSelectedVariantId(null) }}
                    className={`min-w-[48px] h-11 px-3 rounded-2xl text-[13px] font-bold border transition active:scale-95 ${i === selectedRamIdx ? 'border-transparent text-white' : 'bg-white text-[#1F2937] border-[#E5E7EB]'}`}
                    style={i === selectedRamIdx ? { background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` } : undefined}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock status */}
          <div className="mt-4 flex items-center gap-2">
            {!inStock ? (
              <span className="text-[12px] font-bold text-white px-3 py-1 rounded-full bg-[#EF4444]">Out of Stock</span>
            ) : stockQty <= lowStockAlert ? (
              <span className="text-[12px] font-bold text-white px-3 py-1 rounded-full bg-[#EA580C]">Only {stockQty} left — Hurry!</span>
            ) : (
              <span className="text-[12px] font-bold text-white px-3 py-1 rounded-full flex items-center gap-1" style={{ background: SUCCESS }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> In Stock ({stockQty} available)
              </span>
            )}
          </div>

          {/* Quantity */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[13px] font-bold">Quantity</p>
            <div className="flex items-center rounded-full p-1" style={{ background: '#F1ECFF' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition" aria-label="Decrease" style={{ color: PURPLE }}>
                <Minus size={16} />
              </button>
              <span className="w-10 text-center font-bold text-[14px]">{qty}</span>
              <button onClick={() => setQty(Math.min(stockQty, qty + 1))} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition text-white" style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }} aria-label="Increase">
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Offers */}
        <div className={`${card} mt-3 p-4`}>
          <h2 className="text-[15px] font-extrabold mb-1">Available offers</h2>
          <div className="divide-y divide-[#F1F2F6]">
            {offerRows.map((o, i) => (
              <button key={i} className="w-full flex items-center gap-3 py-3 text-left active:opacity-70">
                <span className="text-[20px] flex-shrink-0">{o.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold leading-tight">{o.title}</p>
                  <p className="text-[11.5px] text-[#6B7280] leading-tight truncate">{o.sub}</p>
                </div>
                <ChevronRight size={18} className="text-[#9CA3AF] flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Delivery */}
        <div className={`${card} mt-3 p-4`}>
          <div className="flex items-center gap-2">
            <MapPin size={18} style={{ color: PURPLE }} />
            <span className="text-[13px] font-bold">Delivery</span>
            <span className="text-[13px] text-[#6B7280]">to {deliveryPincode}</span>
            <button
              className="ml-auto text-[12px] font-bold"
              style={{ color: PURPLE }}
              onClick={() => navigate('/profile/addresses')}
            >Change</button>
          </div>
          <p className="text-[13px] text-[#16A34A] font-semibold mt-2">Free delivery by tomorrow</p>
          <p className="text-[12px] text-[#6B7280] mt-0.5">Order within 4 hrs 20 mins</p>
        </div>

        {/* Highlights grid */}
        {features.length > 0 && (
          <div className={`${card} mt-3 p-4`}>
            <h2 className="text-[15px] font-extrabold mb-3">Highlights</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {features.slice(0, 6).map((f: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-[12.5px] bg-[#F8F9FF] rounded-xl px-3 py-2.5">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#ECFDF5' }}><Check size={13} className="text-[#16A34A]" /></span>
                  <span className="leading-tight">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* More services grid */}
        <div className={`${card} mt-3 p-4`}>
          <h2 className="text-[15px] font-extrabold mb-3">Services</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {deliveryItems.map((d, i) => {
              const Icon = d.icon
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 text-center bg-[#F8F9FF] rounded-xl px-2 py-3">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F1ECFF', color: PURPLE }}><Icon size={16} /></span>
                  <span className="text-[11px] font-medium leading-tight text-[#4B5563]">{d.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className={`${card} mt-3 p-4`}>
            <h2 className="text-[15px] font-extrabold mb-2">Description</h2>
            <motion.div initial={false} animate={{ height: descOpen ? 'auto' : 60 }} className="overflow-hidden relative">
              <p className="text-[13px] text-[#4B5563] leading-relaxed">{description}</p>
            </motion.div>
            <button onClick={() => setDescOpen((v) => !v)} className="mt-1 text-[13px] font-bold" style={{ color: PURPLE }}>
              {descOpen ? 'Read Less' : 'Read More'}
            </button>
          </div>
        )}

        {/* Care instructions */}
        {careInstructions.length > 0 && (
          <div className={`${card} mt-3 p-4`}>
            <h2 className="text-[15px] font-extrabold mb-3">Care Instructions</h2>
            <div className="space-y-2">
              {careInstructions.map((c: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 bg-[#F8F9FF] rounded-xl px-3 py-2.5">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#F1ECFF', color: PURPLE }}>
                    <span className="text-[11px] font-bold">{i + 1}</span>
                  </span>
                  <span className="text-[12.5px] text-[#4B5563] leading-tight">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product video */}
        {videoUrl && (
          <div className={`${card} mt-3 p-4`}>
            <h2 className="text-[15px] font-extrabold mb-3">Watch &amp; Learn</h2>
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
              <video src={videoUrl} controls playsInline className="w-full h-full object-cover" preload="none" />
            </div>
          </div>
        )}

        {/* Specifications accordion */}
        <div className={`${card} mt-3 p-4`}>
          <button onClick={() => setSpecsOpen((v) => !v)} className="w-full flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold">Specifications</h2>
            <ChevronDown size={18} className={`transition-transform ${specsOpen ? 'rotate-180' : ''}`} style={{ color: PURPLE }} />
          </button>
          <AnimatePresence initial={false}>
            {specsOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="mt-3 divide-y divide-[#F1ECFF]">
                  {specGroups.map(([k, v], i) => (
                    <div key={i} className="flex items-center justify-between py-2.5">
                      <span className="text-[12px] text-[#6B7280]">{k}</span>
                      <span className="text-[12px] font-semibold text-right max-w-[60%]">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ratings & Reviews */}
        <div className={`${card} mt-3 p-4`}>
          <button onClick={() => setReviewsOpen((v) => !v)} className="w-full flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold">Ratings & Reviews</h2>
            <ChevronDown size={18} className={`transition-transform ${reviewsOpen ? 'rotate-180' : ''}`} style={{ color: PURPLE }} />
          </button>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-[34px] font-black leading-none">{rating.toFixed(1)}</span>
            <div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} fill={s <= Math.round(rating) ? '#F59E0B' : 'none'} className={s <= Math.round(rating) ? 'text-[#F59E0B]' : 'text-[#E5E7EB]'} />)}
              </div>
              <p className="text-[11px] text-[#6B7280] mt-0.5">{ratingCount} ratings</p>
            </div>
          </div>
          {[5, 4, 3, 2, 1].map((star) => {
            const pct = star === Math.round(rating) ? 70 : star === Math.round(rating) - 1 ? 20 : 5
            return (
              <div key={star} className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] text-[#6B7280] w-3">{star}</span>
                <Star size={11} fill="#F59E0B" className="text-[#F59E0B]" />
                <div className="flex-1 h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }} />
                </div>
              </div>
            )
          })}
          <AnimatePresence initial={false}>
            {reviewsOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="mt-3 space-y-2.5">
                  {reviews.map((r: any, i: number) => (
                    <div key={i} className="bg-[#F8F9FF] rounded-2xl p-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[13px]" style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>{r.name.charAt(0)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold leading-tight flex items-center gap-1">{r.name} {r.verified && <BadgeCheck size={13} className="text-[#6C3BFF]" />}</p>
                          <p className="text-[10.5px] text-[#9CA3AF]">{r.date}</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={11} fill={s <= r.rating ? '#F59E0B' : 'none'} className={s <= r.rating ? 'text-[#F59E0B]' : 'text-[#E5E7EB]'} />)}
                        </div>
                      </div>
                      <p className="text-[12.5px] text-[#4B5563] mt-2 leading-snug">{r.comment}</p>
                      {r.verified && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6C3BFF] mt-1.5">Verified Purchase</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Similar products */}
        {related.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between px-3.5 mb-2.5">
              <h2 className="text-[15px] font-extrabold">Similar Products</h2>
              <button onClick={() => navigate('/collection/all')} className="text-[12px] font-bold" style={{ color: PURPLE }}>See all</button>
            </div>
            <div className="flex gap-3 overflow-x-auto px-3.5 pb-2 snap-x snap-mandatory scrollbar-hide">
              {related.map((p: any) => {
                const pPrice = p.variants?.[0]?.discountPrice || p.variants?.[0]?.price || p.price || 0
                const pMrp = p.variants?.[0]?.price && p.variants?.[0]?.discountPrice ? p.variants?.[0].price : (p.oldPrice || 0)
                const pOff = pMrp > pPrice ? Math.round((1 - pPrice / pMrp) * 100) : 0
                return (
                  <div key={p.id} className="snap-start flex-shrink-0 w-[140px] bg-white rounded-2xl shadow-[0_4px_14px_rgba(108,59,255,0.08)] overflow-hidden">
                    <div className="relative">
                      <button onClick={() => navigate(`/product/${p.id}`)} className="block w-full h-[130px] bg-[#F8F9FF] flex items-center justify-center">
                        <img src={getImageUrl(p.image) || getProductImage(p) || FALLBACK_IMG} alt={p.name} className="w-full h-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }} />
                      </button>
                      {pOff > 0 && (
                        <span className="absolute top-2 left-2 text-[9px] font-extrabold text-white px-2 py-0.5 rounded-full bg-gradient-to-r from-[#EF4444] to-[#F97316]">{pOff}% off</span>
                      )}
                      <button onClick={() => { if (!authService.isAuthenticated()) { sessionStorage.setItem('redirect_after_login', window.location.pathname); navigate('/login'); return } const wl = new Set<number>((JSON.parse(localStorage.getItem('wishlist') || '[]') as any[]).map((x: any) => typeof x === 'number' ? x : x.id)); if (wl.has(Number(p.id))) wl.delete(Number(p.id)); else wl.add(Number(p.id)); localStorage.setItem('wishlist', JSON.stringify(Array.from(wl))); window.dispatchEvent(new Event('wishlist-updated')); showToast('Wishlist updated', 'success') }} aria-label="Wishlist" className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center">
                        <Heart size={13} className="text-[#6C3BFF]" />
                      </button>
                    </div>
                    <div className="p-2.5">
                      <p className="text-[11.5px] font-semibold line-clamp-2 leading-tight h-8 overflow-hidden">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[13px] font-black">₹{Number(pPrice).toLocaleString('en-IN')}</span>
                        {pOff > 0 && <span className="text-[10px] text-[#9CA3AF] line-through">₹{Number(pMrp).toLocaleString('en-IN')}</span>}
                      </div>
                      <button onClick={(e) => addRelatedToCart(p, e)} className={`mt-2 w-full h-9 rounded-xl text-[12px] font-bold active:scale-95 transition flex items-center justify-center gap-1 ${relatedFlash[p.id] ? 'bg-[#ECFDF5] text-[#16A34A]' : 'text-white'}`} style={relatedFlash[p.id] ? { border: '1.5px solid #16A34A' } : { background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>
                        {relatedFlash[p.id] ? <><Check size={13} /> Added</> : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom action bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[480px] px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 bg-white/95 backdrop-blur-xl flex items-center gap-2.5 border-t border-[#EEF1F4]" style={{ boxShadow: '0 -5px 25px rgba(0,0,0,0.10)' }}>
        {/* Wishlist icon button */}
        <button
          onClick={toggleWishlist}
          aria-label="Wishlist"
          className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 active:scale-95 transition flex-shrink-0 border"
          style={wished ? { background: '#FEE2F2', borderColor: '#FBCFE8' } : { background: '#F8F9FF', borderColor: '#E5E7EB' }}
        >
          <Heart size={20} className={wished ? 'text-[#EC4899] fill-[#EC4899]' : 'text-[#6C3BFF]'} />
          <span className="text-[9px] font-bold" style={{ color: wished ? '#EC4899' : '#6C3BFF' }}>Save</span>
        </button>

        <div className="flex-1 flex items-center gap-2.5">
          <button
            onClick={addToCart}
            disabled={!inStock}
            className={`flex-1 h-14 rounded-2xl font-bold text-[14px] active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-1.5 border-2 ${isInCart ? 'bg-[#ECFDF5]' : 'bg-white'}`}
            style={isInCart ? { color: SUCCESS, borderColor: SUCCESS } : { color: PURPLE, borderColor: PURPLE }}
          >
            {isInCart ? <Check size={17} /> : <ShoppingBag size={17} />}
            {!inStock ? 'Out of Stock' : isInCart ? 'Added ✓' : 'Add to Cart'}
          </button>
          <button
            onClick={buyNow}
            disabled={!inStock}
            className="flex-1 h-14 rounded-2xl font-bold text-[14px] text-white shadow-[0_8px_20px_rgba(108,59,255,0.35)] active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}
          >
            <Zap size={17} fill="white" />
            Buy Now
          </button>
        </div>
      </div>

      {/* Cart summary bar (appears above the action bar once items are added) */}
      <MobileCartBarActions />

      {cartError && (
        <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-[55] w-[92%] max-w-[440px] bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[12px] font-medium rounded-2xl px-4 py-2.5 shadow-lg">
          {cartError}
        </div>
      )}

      {/* Zoom helper hint */}
      {zoomScale > 1 && (
        <button onClick={() => { setZoomScale(1); setZoomOrigin('center center') }}
          className="fixed bottom-28 right-4 z-[60] px-3.5 py-2 rounded-full bg-black/75 text-white text-[12px] font-semibold shadow-lg active:scale-90 transition">
          Reset Zoom
        </button>
      )}
      {Toast}
    </div>
  )
}

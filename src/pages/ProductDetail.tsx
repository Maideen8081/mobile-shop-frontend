import { Component, useState, useMemo, useEffect, useRef } from 'react'
import { sendGuestToLogin } from '../utils/cartAuth'
import { usePageMeta } from '../hooks/usePageMeta'
import ProductSuggestions, { productErrorMessage } from '../components/ecommerce/ProductSuggestions'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { productService } from '../services/productService'
import { authService } from '../services/authService'
import { addressService, type AddressData } from '../services/addressService'
import { reviewService, type Review, type ProductRating } from '../services/reviewService'
import { cartService } from '../services/cartService'
import ReviewForm from '../components/ReviewForm'
import { useStoreCoupons } from '../hooks/useStoreCoupons'
import { couponLabel } from '../services/offerService'
import { collectProductImages, getImageUrl, getProductImage } from '../components/mobile/helpers'
import { FALLBACK_IMG } from '../components/mobile/fallback'
import DesktopPageLoader from '../components/ui/DesktopPageLoader'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import '../pages/CollectionPage.css'
import { useProductImage } from '../utils/productImage'
import './ProductDetailPage.css'
import {
  ArrowLeftRight, Award, BadgeCheck, BatteryCharging, Bell, Cable, Camera, Check, ChevronDown, ChevronLeft,
  ChevronRight, Cpu, CreditCard, HardDrive, Heart, Layers, MapPin, MemoryStick,
  MessageCircleQuestion, Minus, Monitor, Percent, Plus, RotateCcw, Share2, ShieldCheck, ShoppingCart, Star,
  Tag, Truck, Zap,
} from 'lucide-react'
import { useBootHold } from '../components/LoadingScreen/bootLoader'

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="axpd min-h-screen flex items-center justify-center p-6">
          <div className="bg-white rounded-[14px] p-10 border border-[#ececea] max-w-md mx-auto text-center shadow-[0_20px_50px_rgba(28,28,30,.14)]">
            <p className="text-4xl mb-4 block">⚠️</p>
            <h2 className="text-xl font-bold text-[#0f3b2c] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#6b6b70] mb-6">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-[#0f3b2c] text-white rounded-[8px] text-sm font-semibold transition-all hover:opacity-80 cursor-pointer">
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const fmt = (n: number) => '₹' + Math.round(n || 0).toLocaleString('en-IN')



const relatedPrice = (product: any): { current: number; old: number | null } => {
  if (!product) return { current: 0, old: null }
  const vars = Array.isArray(product.variants) ? product.variants : []
  let price = 0
  let old: number | null = null

  if (vars.length > 0) {
    for (const v of vars) {
      const dp = parseFloat(v.discountPrice ?? v.discount_price ?? v.sale_price) || 0
      const p = parseFloat(v.price ?? v.selling_price ?? v.unit_price) || 0
      if (dp > 0 && p > dp) {
        price = dp
        old = p
        break
      } else if (dp > 0) {
        price = dp
        break
      } else if (p > 0) {
        price = p
        break
      }
    }
  }

  if (price === 0) {
    const dp = parseFloat(product.minPrice ?? product.rawMinPrice ?? product.discountPrice ?? product.discount_price ?? product.min_price ?? product.starting_price) || 0
    const p = parseFloat(product.price ?? product.rawPrice ?? product.mrp ?? product.old_price) || 0
    if (dp > 0 && p > dp) {
      price = dp
      old = p
    } else if (dp > 0) {
      price = dp
    } else if (p > 0) {
      price = p
    }
  }

  return { current: price, old }
}

const relatedName = (product: any): string => product.product_name ?? product.name ?? ''

const COLOR_PALETTE: Record<string, string> = {
  black: '#1a1a1a', white: '#f0f0f0', silver: '#c0c0c0',
  gray: '#808080', 'titanium gray': '#5d6762', 'titanium black': '#3d4641',
  'titanium violet': '#18503c', 'natural titanium': '#d4c5a9',
  'blue titanium': '#2563eb', 'white titanium': '#ece9e2',
  'flowy emerald': '#10b981', 'silky black': '#1d2522',
  green: '#22c55e', midnight: '#1e293b', starlight: '#faf5eb',
  rose: '#0f3b2c', gold: '#f59e0b', graphite: '#5d6762',
  sierra: '#9aa29e', 'deep purple': '#18503c', red: '#ef4444',
  blue: '#3b82f6', purple: '#18503c',
}

function getColorSwatch(c: string): string {
  return COLOR_PALETTE[c.toLowerCase().trim()] || '#ccc'
}

type BankOffer = { bank: string; type: string; offer: string; min: string; code: string; desc: string; maxAmount: number }
const BANK_OFFERS: BankOffer[] = [
  { bank: 'HDFC Bank', type: 'Credit Card', offer: 'Flat ₹3,000 off', min: '₹50,000', code: 'HDFC3000', desc: 'Instant discount on minimum order of ₹50,000', maxAmount: 3000 },
  { bank: 'SBI Bank', type: 'Credit Card', offer: '10% off', min: '₹10,000', code: 'SBI10', desc: 'Maximum discount of ₹1,500 on SBI cards', maxAmount: 1500 },
  { bank: 'ICICI Bank', type: 'Debit Card', offer: 'Flat ₹1,000 off', min: 'No minimum', code: 'ICICI1000', desc: 'Flat discount on all ICICI debit cards', maxAmount: 1000 },
  { bank: 'PhoneFix Card', type: 'Cashback', offer: '5% cashback', min: '₹1,000', code: 'PF5X', desc: 'Up to ₹2,000 cashback on first 3 orders', maxAmount: 2000 },
  { bank: 'Axis Bank', type: 'EMI', offer: 'No-cost EMI', min: '₹10,000', code: 'AXISEMI', desc: '3 to 12 month plans at zero interest', maxAmount: 0 },
]
const FREE_DELIVERY_THRESHOLD = 500

const QA = [
  { q: 'Is this an original product?', a: 'Yes. Every product we sell is 100% genuine and sourced from the brand or its authorised distributors, with a GST invoice.' },
  { q: 'Does it come with a warranty?', a: 'Yes — it carries the manufacturer warranty (1 year unless stated otherwise in Specifications). Our store also helps you with service claims.' },
  { q: 'Can I return it if I don’t like it?', a: 'Unused products in original packaging can be returned within 7 days of delivery. Refunds reach your original payment method in 5–7 business days.' },
  { q: 'How long does delivery take?', a: 'Most orders are delivered in 3–5 days. Delivery is free on orders over ₹500.' },
  { q: 'Is Cash on Delivery available?', a: 'Yes, you can pay in cash or by UPI when the order arrives.' },
]

type ProductOffer = { title: string; code: string; desc: string; max: number; rate: number }
const PRODUCT_OFFERS: ProductOffer[] = [
  { title: 'Up to ₹8,000 exchange bonus', code: 'EXCHANGE', desc: 'Trade in any old phone — instant value on purchase', max: 0, rate: 0 },
  { title: 'No-cost EMI available', code: 'PFEMI', desc: '3 to 12 month plans at zero interest', max: 0, rate: 0 },
]

function getBankSaving(offer: BankOffer, subtotal: number): number {
  if (offer.maxAmount <= 0) return 0
  const flat = /flat\s*₹([\d,]+)/i.exec(offer.offer)
  if (flat) return Math.min(parseInt(flat[1].replace(/,/g, ''), 10), subtotal)
  const pct = /(\d+)%\s*(?:off|cashback|discount)/i.exec(offer.offer)
  if (pct) return Math.min(offer.maxAmount, Math.floor((subtotal * parseInt(pct[1], 10)) / 100))
  return 0
}

/** Product photo with its background removed and margins trimmed, so it fills the frame. */
function ProductPhoto({ src, alt }: { src: string; alt: string }) {
  const photo = useProductImage(src)
  return (
    <img
      src={photo.src}
      alt={alt}
      data-cut={photo.cut ? 'true' : undefined}
      className={photo.ready ? 'is-ready' : ''}
      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
    />
  )
}

function Stars({ score, small }: { score: number; small?: boolean }) {
  return (
    <div className={`ax-stars ${small ? 'ax-sm' : ''}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" fill={i <= Math.round(score) ? '#f2b01e' : 'none'} stroke="#f2b01e" strokeWidth="1.5">
          <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
        </svg>
      ))}
    </div>
  )
}

function RatingBars({ distribution, count }: { distribution: Record<number, number>; count: number }) {
  return (
    <div className="ax-review-bars">
      {[5, 4, 3, 2, 1].map((star) => {
        const c = distribution[star] || 0
        const pct = count > 0 ? Math.round((c / count) * 100) : 0
        return (
          <div key={star} className="ax-review-bar-row">
            <span>{star}★</span>
            <div className="ax-bar-track">
              <motion.div
                className="ax-bar-fill"
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <span>{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

function ProductDetailContent() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { productId, variationId, variantId, id } = useParams()
  const resolvedId = productId || id
  const resolvedVariantId = variationId || variantId

  const rateParam = searchParams.get('rate') === 'true'
  const orderIdParam = searchParams.get('order_id') || ''
  const variantIdParam = searchParams.get('variant_id') || ''

  const rootRef = useRef<HTMLDivElement>(null)
  const priceBlockRef = useRef<HTMLDivElement>(null)

  const [apiProduct, setApiProduct] = useState<any>(() => (resolvedId ? productService.peekById(Number(resolvedId)) : null) ?? null)
  const [loading, setLoading] = useState(() => !(resolvedId && productService.peekById(Number(resolvedId))))
  useBootHold(loading)
  const [fetchError, setFetchError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [cartTick, setCartTick] = useState(0)

  const [toastMsg, setToastMsg] = useState('')
  const [toastShow, setToastShow] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [wishlist, setWishlist] = useState<Set<number>>(() => {
    try { const stored = JSON.parse(localStorage.getItem('wishlist') || '[]'); return new Set<number>(stored.map((item: any) => typeof item === 'number' ? item : item.id)) }
    catch { return new Set<number>() }
  })

  const [selectedColorIdx, setSelectedColorIdx] = useState(0)
  const [selectedStorageIdx, setSelectedStorageIdx] = useState(0)
  const [selectedRamIdx, setSelectedRamIdx] = useState(0)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)

  const [productReviews, setProductReviews] = useState<Review[]>([])
  const [productRating, setProductRating] = useState<ProductRating>({ average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
  const [canReview, setCanReview] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])

  const [displayPrice, setDisplayPrice] = useState(0)
  const [stickyVisible, setStickyVisible] = useState(false)

  const [appliedOffer, setAppliedOffer] = useState<string | null>(null)
  // Live coupons, the same list the mobile page shows and checkout accepts.
  const storeCoupons = useStoreCoupons()
  const [copiedCode, setCopiedCode] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [tab, setTab] = useState<'desc' | 'specs' | 'reviews' | 'qa'>(() => (rateParam ? 'reviews' : 'desc'))
  const [emiOpen, setEmiOpen] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [fbtChecked, setFbtChecked] = useState<Set<number>>(() => new Set([-1]))
  const [comboAdding, setComboAdding] = useState(false)
  const [deliveryBy] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 4)
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  })

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastShow(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastShow(false), 2200)
  }

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleNotifySubmit = async () => {
    if (!notifyEmail || !validateEmail(notifyEmail)) return
    try {
      const res = await productService.notifyWhenAvailable(
        apiProduct?.id,
        activeVariant?.id ?? null,
        notifyEmail
      )
      setNotifyOpen(false)
      setNotifyEmail('')
      showToast(res?.message || 'You\'ll be notified when this product is back in stock!')
    } catch (err: any) {
      const data = err?.response?.data
      const fieldError = data?.email?.[0] || data?.variant_id?.[0]
      showToast(data?.message || fieldError || data?.detail || 'Failed to save notification. Please try again.')
    }
  }

  useEffect(() => {
    const bump = () => setCartTick((t) => t + 1)
    window.addEventListener('cart-updated', bump)
    return () => window.removeEventListener('cart-updated', bump)
  }, [])

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      showToast(`Coupon ${code} copied!`)
    } catch {
      showToast('Failed to copy code')
    }
  }

  const applyBankOffer = (code: string) => {
    setAppliedOffer(code)
    showToast(`Bank offer applied — ${code}`)
  }

  useEffect(() => {
    if (!resolvedId) { setLoading(false); return }
    let cancelled = false
    // Show an already-viewed product instantly; refresh it quietly behind.
    const cached = productService.peekById(Number(resolvedId))
    if (cached) setApiProduct(cached)
    setLoading(!cached)
    setFetchError('')
    productService.getById(Number(resolvedId))
      .then((res) => { if (!cancelled) setApiProduct(res) })
      .catch((err) => { if (!cancelled && !cached) setFetchError(productErrorMessage(err)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [resolvedId])

  useEffect(() => {
    if (!resolvedId) return
    const pid = Number(resolvedId)
    ;(async () => {
      const [reviews, rating, reviewed] = await Promise.all([
        reviewService.getByProduct(pid),
        reviewService.getProductRating(pid),
        reviewService.hasUserReviewed(pid),
      ])
      setProductReviews(reviews)
      setProductRating(rating)
      setHasReviewed(reviewed)
    })()
  }, [resolvedId])

  useEffect(() => {
    // Guests have no saved addresses; skip a request that can only fail.
    if (!authService.isAuthenticated()) return
    addressService.list()
      .then((data: AddressData[]) => {
        setAddresses(data)
        const def = data.find((a) => a.isDefault) || data[0]
        if (def?.id != null) setSelectedAddressId(Number(def.id))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!resolvedId) { setCanReview(false); return }
    if (!authService.isAuthenticated()) { setCanReview(false); return }
    const { eligible } = reviewService.hasDeliveredOrder(Number(resolvedId))
    setCanReview(eligible)
    if (rateParam && eligible) {
      setShowReviewForm(true)
      setTimeout(() => {
        document.getElementById('ax-reviews-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 600)
    } else {
      setShowReviewForm(false)
    }
  }, [resolvedId, rateParam, apiProduct])

  const refreshReviews = async () => {
    if (!resolvedId) return
    const pid = Number(resolvedId)
    const [reviews, rating, reviewed] = await Promise.all([
      reviewService.getByProduct(pid),
      reviewService.getProductRating(pid),
      reviewService.hasUserReviewed(pid),
    ])
    setProductReviews(reviews)
    setProductRating(rating)
    setHasReviewed(reviewed)
  }

  useEffect(() => {
    if (!apiProduct?.id) return
    let cancelled = false
    const cat = apiProduct.category
    const catName = typeof cat === 'object' && cat !== null ? (cat as any).name : String(cat || '')
    const load = (params: any) =>
      productService.list(params)
        .then((res: any[]) => res.filter((p: any) => Number(p.id) !== Number(apiProduct.id)))
        .catch(() => [] as any[])
    ;(async () => {
      let list = catName ? await load({ category: catName, page_size: 8 }) : []
      if (!list.length || list.length < 4) {
        const extra = await load({ page_size: 12, ordering: '-created' } as any)
        const existingIds = new Set(list.map((p: any) => Number(p.id)))
        for (const item of extra) {
          if (!existingIds.has(Number(item.id))) {
            list.push(item)
            existingIds.add(Number(item.id))
          }
        }
      }
      if (!cancelled) {
        setRelatedProducts(list.slice(0, 4))
        setFbtChecked(new Set([-1, ...list.slice(0, 2).map((p: any) => Number(p.id))]))
      }
    })()
    return () => { cancelled = true }
  }, [apiProduct])

  const { colors, storageOptions, ramOptions, variants } = useMemo(() => {
    if (apiProduct?.variants?.length > 0) {
      const cols = [...new Set(apiProduct.variants.map((v: any) => v.color).filter(Boolean))] as string[]
      const store = [...new Set(apiProduct.variants.map((v: any) => v.storage).filter(Boolean))] as string[]
      const ram = [...new Set(apiProduct.variants.map((v: any) => v.ram).filter(Boolean))] as string[]
      return { colors: cols, storageOptions: store, ramOptions: ram, variants: apiProduct.variants }
    }
    return { colors: (apiProduct?.colors || []) as string[], storageOptions: (apiProduct?.storage || []) as string[], ramOptions: (apiProduct?.ram || []) as string[], variants: [] as any[] }
  }, [apiProduct])

  useEffect(() => { if (resolvedVariantId) setSelectedVariantId(resolvedVariantId) }, [resolvedVariantId])

  useEffect(() => {
    if (!apiProduct?.variants?.length || !variantIdParam) return
    const match = apiProduct.variants.find((v: any) => String(v.id) === variantIdParam)
    if (match) setSelectedVariantId(String(match.id))
  }, [apiProduct, variantIdParam])

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

  useEffect(() => { setSelectedImage(0) }, [activeVariant?.id])
  useEffect(() => { setQty(1); setAdded(false) }, [activeVariant?.id])

  const images = useMemo(() => collectProductImages(apiProduct, activeVariant), [activeVariant, apiProduct])
  usePageMeta({
    title: apiProduct?.name ? `${apiProduct.name}${apiProduct.brand ? ` by ${apiProduct.brand}` : ''}` : 'Product',
    description: apiProduct?.description || (apiProduct?.name ? `Buy ${apiProduct.name} at PhoneFix with fast delivery and warranty.` : undefined),
    image: images[0]?.startsWith('http') ? images[0] : undefined,
  })

  const openLightbox = (idx: number) => { setLightboxIdx(idx); setLightboxOpen(true) }
  const closeLightbox = () => setLightboxOpen(false)
  const stepLightbox = (dir: number) => setLightboxIdx((p) => (p + dir + Math.max(images.length, 1)) % Math.max(images.length, 1))
  const stepImage = (dir: number) => { if (images.length) setSelectedImage((p) => (p + dir + images.length) % images.length) }

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowRight') setLightboxIdx((p) => (p + 1) % Math.max(images.length, 1))
      if (e.key === 'ArrowLeft') setLightboxIdx((p) => (p - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, images.length])

  const currentPrice = activeVariant?.discountPrice || activeVariant?.price || apiProduct?.price || 0
  const oldPriceVal = activeVariant?.price && activeVariant?.discountPrice ? activeVariant.price : (apiProduct?.oldPrice || 0)
  const inStock = activeVariant ? activeVariant.stock > 0 : (apiProduct?.inStock ?? true)
  const stockQty = activeVariant?.stock ?? apiProduct?.stock ?? 99
  const discountPct = oldPriceVal > currentPrice && oldPriceVal > 0 ? Math.round((1 - currentPrice / oldPriceVal) * 100) : 0

  const productName = apiProduct?.name || apiProduct?.product_name || 'Product'
  const productBrand = apiProduct?.brand || ''
  const productModel = apiProduct?.model || apiProduct?.model_number || ''
  const categoryName = typeof apiProduct?.category === 'object' ? apiProduct?.category?.name : apiProduct?.category || ''
  const subCategoryName = typeof apiProduct?.subcategory === 'object' ? apiProduct?.subcategory?.name : apiProduct?.subcategory || ''
  const description = apiProduct?.description || ''
  const features = apiProduct?.features || []
  const careInstructions = apiProduct?.careInstructions || []
  const variantName = activeVariant?.name || ''
  const sold = apiProduct?.sold || 0
  const newArrival = apiProduct?.newArrival

  const rating = productRating.count > 0 ? productRating.average : (Number(apiProduct?.rating) || 0)
  const ratingCount = productRating.count || apiProduct?.ratingCount || apiProduct?.rating_count || 0

  const isInCart = useMemo(() => {
    if (!apiProduct?.id) return false
    return cartService.isInCart(apiProduct.id, activeVariant?.id ?? null)
  }, [apiProduct?.id, activeVariant?.id, added, cartTick])

  useEffect(() => {
    if (!currentPrice) { setDisplayPrice(currentPrice); return }
    const dur = 900
    const start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplayPrice(Math.floor(eased * currentPrice))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [currentPrice])

  useEffect(() => {
    if (loading || !apiProduct) return
    const els = rootRef.current?.querySelectorAll('.ax-reveal')
    if (!els?.length) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
    }, { threshold: 0.12 })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [loading, apiProduct, relatedProducts])

  useEffect(() => {
    const el = priceBlockRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        setStickyVisible(!e.isIntersecting && e.boundingClientRect.top < 0)
      })
    }, { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [loading, apiProduct])

  const validateStock = (requestedQty: number): string | null => {
    if (!inStock) return 'This product is currently out of stock'
    if (requestedQty > stockQty) return `Only ${stockQty} units available. You requested ${requestedQty}.`
    const existing = cartService.getItemCountInCart(apiProduct.id, activeVariant?.id ?? null)
    const totalInCart = existing + requestedQty
    if (totalInCart > stockQty) {
      const canAdd = stockQty - existing
      return canAdd <= 0 ? `${existing} already in cart — no more stock available.` : `Only ${canAdd} more can be added (${existing} already in cart, ${stockQty} in stock).`
    }
    return null
  }

  const changeQty = (delta: number) => {
    if (!apiProduct?.id) return
    if (isInCart) {
      const current = cartService.getItemCountInCart(apiProduct.id, activeVariant?.id ?? null)
      const next = current + delta
      if (next <= 0) {
        cartService.removeItem(apiProduct.id, activeVariant?.id ?? null)
        setQty(1)
      } else if (next <= Math.max(stockQty, 1)) {
        cartService.updateQuantity(apiProduct.id, activeVariant?.id ?? null, delta)
      }
    } else {
      setQty((q) => Math.min(Math.max(stockQty, 1), Math.max(1, q + delta)))
    }
  }

  const displayQty = isInCart && apiProduct?.id
    ? cartService.getItemCountInCart(apiProduct.id, activeVariant?.id ?? null)
    : qty

  const selectedAddress = addresses.find((a) => a.id != null && Number(a.id) === selectedAddressId) || null

  const handleAddToCart = async () => {
    if (isAdding) return
    if (!authService.isAuthenticated()) {
      showToast('Sign in to add items to your cart')
      sendGuestToLogin([{
        productId: apiProduct.id, variationId: activeVariant?.id || 0, quantity: qty, name: productName,
        brand: productBrand, price: currentPrice, image: images[0] || '', storage: activeVariant?.storage || '',
        ram: activeVariant?.ram || '', color: activeVariant?.color || '',
      }], navigate)
      return
    }

    if (isInCart) {
      await cartService.removeItem(apiProduct.id, activeVariant?.id ?? null)
      setAdded(false)
      showToast('Removed from cart!')
      return
    }

    const error = validateStock(qty)
    if (error) { showToast(error); return }

    setIsAdding(true)
    try {
      await cartService.addItem({
        productId: apiProduct.id,
        variationId: activeVariant?.id || 0,
        quantity: qty,
        name: productName,
        brand: productBrand,
        price: currentPrice,
        image: images[0] || '',
        storage: activeVariant?.storage || '',
        ram: activeVariant?.ram || '',
        color: activeVariant?.color || '',
      })
      setAdded(true)
      showToast(`Added ${qty} item${qty > 1 ? 's' : ''} to cart!`)
    } catch (err: any) {
      showToast(err?.message || 'Failed to add to cart')
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (isAdding) return
    if (!authService.isAuthenticated()) { sessionStorage.setItem('redirect_after_login', window.location.pathname + window.location.search); navigate('/login'); return }
    const error = validateStock(qty)
    if (error) { showToast(error); return }

    setIsAdding(true)
    try {
      await cartService.addItem({
        productId: apiProduct.id,
        variationId: activeVariant?.id || 0,
        quantity: qty,
        name: productName,
        brand: productBrand,
        price: currentPrice,
        image: images[0] || '',
        storage: activeVariant?.storage || '',
        ram: activeVariant?.ram || '',
        color: activeVariant?.color || '',
      })
      setAdded(true)
      navigate('/cart')
    } catch (err: any) {
      showToast(err?.message || 'Failed to add to cart')
    } finally {
      setIsAdding(false)
    }
  }

  const toggleWishlist = (id: number) => {
    if (!id) return
    if (!authService.isAuthenticated()) { sessionStorage.setItem('redirect_after_login', window.location.pathname + window.location.search); navigate('/login'); return }
    setWishlist((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem('wishlist', JSON.stringify(Array.from(next)))
      window.dispatchEvent(new Event('wishlist-updated'))
      return next
    })
  }

  const handleRelatedAddToCart = async (e: React.MouseEvent, product: any) => {
    e.stopPropagation()
    if (!authService.isAuthenticated()) { sessionStorage.setItem('redirect_after_login', window.location.pathname + window.location.search); navigate('/login'); return }
    const price = relatedPrice(product).current
    const image = getProductImage(product)
    const name = relatedName(product)
    try {
      await cartService.addItem({
        productId: product.id,
        variationId: 0,
        quantity: 1,
        name,
        brand: product.brand || '',
        price,
        image,
        storage: '',
        ram: '',
        color: '',
      })
      showToast(`${name} added to cart`)
    } catch (err: any) {
      showToast(err?.message || 'Failed to add to cart')
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: productName, text: `Check out ${productName} by ${productBrand}`, url }) } catch { return }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        showToast('Link copied to clipboard!')
      } catch {
        showToast('Failed to copy link')
      }
    }
  }

  const goToAddresses = () => {
    navigate('/profile/addresses')
  }

  const specRows = useMemo(() => {
    const rows: [string, string][] = []
    const add = (k: string, v: any) => {
      if (v !== undefined && v !== null && v !== '' && String(v) !== 'undefined') rows.push([k, String(v)])
    }
    add('Brand', productBrand)
    add('Model', productModel)
    add('Category', categoryName)
    add('Type', subCategoryName)
    add('Processor', activeVariant?.processor || apiProduct?.processor)
    add('Display', activeVariant?.display || apiProduct?.display)
    add('RAM', activeVariant?.ram || apiProduct?.ram)
    add('Storage', activeVariant?.storage || apiProduct?.storage)
    add('Camera', activeVariant?.camera || apiProduct?.camera)
    add('Battery', activeVariant?.battery ? `${activeVariant.battery} mAh` : apiProduct?.battery)
    add('Colour', activeVariant?.color || colors[selectedColorIdx])
    add('Operating System', apiProduct?.os)
    add('Weight', apiProduct?.weight)
    add('Warranty', apiProduct?.warranty || '1 Year Manufacturer Warranty')
    return rows
  }, [productBrand, productModel, categoryName, subCategoryName, activeVariant, apiProduct, colors, selectedColorIdx])

  const descParagraphs = useMemo(() => description.split(/\n+/).filter(Boolean), [description])

  const subtotal = qty * (Number(currentPrice) || 0)
  const activeBankOffer = appliedOffer ? BANK_OFFERS.find((o) => o.code === appliedOffer) : null
  const bankSavings = activeBankOffer ? getBankSaving(activeBankOffer, subtotal) : 0
  const dealSavings = Math.max(0, oldPriceVal - currentPrice) * qty
  // "You save" = MRP − price, plus only the offers the shopper has applied.
  // Cart offers are applied at checkout, so they are not counted here.
  const totalSavings = Math.round(dealSavings + bankSavings)
  const freeDeliveryUnlocked = subtotal >= FREE_DELIVERY_THRESHOLD

  if (loading) {
    return (
      <div className="axpd min-h-screen bg-[#f7f6f2]">
        <style>{AXPD_CSS}</style>
        <SiteTopNav />
        <DesktopPageLoader text="Loading product details..." />
      </div>
    )
  }

  if (fetchError || !apiProduct) {
    return (
      <div className="axpd min-h-screen bg-[#f7f6f2]">
        <style>{AXPD_CSS}</style>
        <SiteTopNav />
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="bg-white rounded-[14px] p-10 border border-[#ececea] max-w-md mx-auto text-center shadow-[0_20px_50px_rgba(28,28,30,.14)]">
            <p className="text-4xl mb-4 block">🔍</p>
            <h1 className="text-xl font-bold text-[#0f3b2c] mb-2">Product unavailable</h1>
            <p className="text-sm text-[#6b6b70] mb-6">{fetchError || 'This product is no longer available.'}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-[8px] text-white text-sm font-bold cursor-pointer" style={{ background: 'linear-gradient(100deg,#0f3b2c,#18503c)' }}>
                Go Back
              </button>
              <Link to="/collection/all" className="px-6 py-3 rounded-[8px] text-sm font-bold cursor-pointer" style={{ background: 'rgba(15,59,44,0.08)', color: '#18503c', border: '1.5px solid rgba(15,59,44,0.2)' }}>
                Browse Products
              </Link>
            </div>
          </div>
        </div>
        <div className="px-6 pb-16">
          <ProductSuggestions title="Similar products you might like" excludeId={Number(resolvedId)} />
        </div>
      </div>
    )
  }

  // Short pitch under the title: first sentence(s) of the description.
  const tagline = (descParagraphs[0] || '').split(/(?<=[.!?])\s/).slice(0, 2).join(' ')

  // Four highlight tiles: product features when present, else key specs.
  const highlights: { icon: typeof Zap; title: string; sub: string }[] = (() => {
    const icons = [Zap, Cable, ShieldCheck, Award]
    const fromFeatures = (features as any[]).map((f) => String(f)).filter(Boolean).slice(0, 4)
    if (fromFeatures.length >= 2) {
      return fromFeatures.map((f, i) => {
        const [first, ...rest] = f.split(' ')
        return { icon: icons[i % icons.length], title: first, sub: rest.join(' ') || 'Feature' }
      })
    }
    const specIcon: Record<string, typeof Zap> = { RAM: MemoryStick, Storage: HardDrive, Battery: BatteryCharging, Display: Monitor, Camera: Camera, Processor: Cpu }
    const picked = specRows.filter(([k]) => specIcon[k]).slice(0, 3).map(([k, v]) => ({ icon: specIcon[k], title: v.length > 14 ? `${v.slice(0, 13)}…` : v, sub: k }))
    return [...picked, { icon: Award, title: '1 Year', sub: 'Warranty' }].slice(0, 4)
  })()

  const fbtItems = relatedProducts.slice(0, 2)
  const fbtSelf = { price: Number(currentPrice) || 0, old: oldPriceVal > currentPrice ? Number(oldPriceVal) : Number(currentPrice) || 0 }
  const fbtTotal = (fbtChecked.has(-1) ? fbtSelf.price : 0) + fbtItems.reduce((s: number, rp: any) => s + (fbtChecked.has(Number(rp.id)) ? relatedPrice(rp).current : 0), 0)
  const fbtMrp = (fbtChecked.has(-1) ? fbtSelf.old : 0) + fbtItems.reduce((s: number, rp: any) => {
    if (!fbtChecked.has(Number(rp.id))) return s
    const p = relatedPrice(rp)
    return s + (p.old && p.old > p.current ? p.old : p.current)
  }, 0)
  const fbtCount = (fbtChecked.has(-1) ? 1 : 0) + fbtItems.filter((rp: any) => fbtChecked.has(Number(rp.id))).length

  const toggleFbt = (key: number) => setFbtChecked((prev) => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })

  const addCombo = async () => {
    if (comboAdding || fbtCount === 0) return
    if (!authService.isAuthenticated()) { sessionStorage.setItem('redirect_after_login', window.location.pathname + window.location.search); navigate('/login'); return }
    setComboAdding(true)
    let addedCount = 0
    try {
      if (fbtChecked.has(-1) && inStock && !isInCart) {
        const error = validateStock(1)
        if (!error) {
          await cartService.addItem({
            productId: apiProduct.id, variationId: activeVariant?.id || 0, quantity: 1, name: productName, brand: productBrand,
            price: currentPrice, image: images[0] || '', storage: activeVariant?.storage || '', ram: activeVariant?.ram || '', color: activeVariant?.color || '',
          })
          setAdded(true)
          addedCount++
        }
      }
      for (const rp of fbtItems) {
        if (!fbtChecked.has(Number(rp.id))) continue
        await cartService.addItem({
          productId: rp.id, variationId: 0, quantity: 1, name: relatedName(rp), brand: rp.brand || '',
          price: relatedPrice(rp).current, image: getProductImage(rp), storage: '', ram: '', color: '',
        })
        addedCount++
      }
      showToast(addedCount ? `${addedCount} item${addedCount > 1 ? 's' : ''} added to cart` : 'Already in your cart')
    } catch (err: any) {
      showToast(err?.message || 'Failed to add to cart')
    } finally {
      setComboAdding(false)
    }
  }

  const openTab = (t: typeof tab) => {
    setTab(t)
    setTimeout(() => document.getElementById('ax-reviews-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const showVariantChips = variants.length > 1 && !colors.length && !storageOptions.length && !ramOptions.length

  return (
    <div className="axpd pdx min-h-screen" ref={rootRef}>
      <style>{AXPD_CSS}</style>
      <SiteTopNav />

      <main className="pdx-wrap">
        <div className="pdx-grid">
          {/* ════════ LEFT: gallery + info + tabs ════════ */}
          <div className="pdx-main">
            <div className="pdx-top">
              {/* Gallery */}
              <div className="pdx-gallery">
                <div className="pdx-thumbs">
                  {images.map((img, i) => (
                    <button key={img} className={`pdx-thumb ${i === selectedImage ? 'is-active' : ''}`} onClick={() => setSelectedImage(i)} aria-label={`Image ${i + 1}`}>
                      <ProductPhoto src={img} alt="" />
                    </button>
                  ))}
                </div>
                <div className="pdx-stage-col">
                  <div className="pdx-stage" onClick={() => openLightbox(selectedImage)}>
                    {productBrand && <span className="pdx-brand-chip">{productBrand}</span>}
                    {discountPct > 0 && <span className="pdx-off-chip">{discountPct}% OFF</span>}
                    <div className="pdx-stage-actions">
                      <button
                        className={`pdx-round ${apiProduct?.id && wishlist.has(apiProduct.id) ? 'is-liked' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(apiProduct?.id as number) }}
                        aria-label="Add to wishlist"
                      >
                        <Heart aria-hidden="true" />
                      </button>
                      <button className="pdx-round" onClick={(e) => { e.stopPropagation(); handleShare() }} aria-label="Share product">
                        <Share2 aria-hidden="true" />
                      </button>
                    </div>
                    {images.length > 1 && (
                      <>
                        <button className="pdx-arrow pdx-arrow--prev" onClick={(e) => { e.stopPropagation(); stepImage(-1) }} aria-label="Previous image"><ChevronLeft /></button>
                        <button className="pdx-arrow pdx-arrow--next" onClick={(e) => { e.stopPropagation(); stepImage(1) }} aria-label="Next image"><ChevronRight /></button>
                      </>
                    )}
                    {images.map((img, i) => (
                      <div key={img} className={`pdx-stage-img ${i === selectedImage ? 'is-active' : ''}`}>
                        <ProductPhoto src={img} alt={productName} />
                      </div>
                    ))}
                  </div>
                  {images.length > 1 && (
                    <div className="pdx-dots">
                      {images.map((img, i) => (
                        <button key={img} className={i === selectedImage ? 'is-active' : ''} onClick={() => setSelectedImage(i)} aria-label={`Show image ${i + 1}`} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="pdx-info">
                <div className="pdx-tags">
                  {productBrand && <span className="pdx-tag">{productBrand}</span>}
                  <span className="pdx-tag pdx-tag--official"><ShieldCheck aria-hidden="true" /> Official Product</span>
                  {newArrival && <span className="pdx-tag pdx-tag--new">New Launch</span>}
                </div>
                <h1 className="pdx-title">{variantName || productName}</h1>
                {tagline && <p className="pdx-tagline">{tagline}</p>}

                <div className="pdx-rating">
                  <button type="button" onClick={() => openTab('reviews')}>
                    <Star aria-hidden="true" className="pdx-star" />
                    <b>{rating > 0 ? rating.toFixed(1) : 'New'}</b>
                    <span>({ratingCount ? `${Number(ratingCount).toLocaleString('en-IN')} reviews` : 'No reviews yet'})</span>
                  </button>
                  {sold > 0 && <><i aria-hidden="true" /><span className="pdx-sold">{Number(sold).toLocaleString('en-IN')} sold</span></>}
                  <i aria-hidden="true" />
                  <span className={`pdx-stock ${inStock ? '' : 'is-out'}`}>{inStock ? (stockQty > 0 && stockQty <= 5 ? `Only ${stockQty} left` : 'In stock') : 'Out of stock'}</span>
                </div>

                <div className="pdx-price" ref={priceBlockRef}>
                  <div className="pdx-price-row">
                    <span className="pdx-price-now">{fmt(displayPrice)}</span>
                    {oldPriceVal > currentPrice && <s className="pdx-price-mrp">{fmt(oldPriceVal)}</s>}
                    {discountPct > 0 && <span className="pdx-price-off">{discountPct}% OFF</span>}
                  </div>
                  <p className="pdx-price-tax">Inclusive of all taxes</p>
                  {totalSavings > 0 && (
                    <p className="pdx-saving"><Check aria-hidden="true" /> You save <b>{fmt(totalSavings)}</b>{appliedOffer ? ' with bank offer' : ''}</p>
                  )}
                </div>

                {currentPrice > 0 && (
                  <div className={`pdx-emi ${emiOpen ? 'is-open' : ''}`} id="pdx-emi">
                    <div className="pdx-emi-row">
                      <CreditCard aria-hidden="true" />
                      <span>From <b>{fmt(Math.ceil(currentPrice / 12))}/month</b> with no-cost EMI — 12 month plan</span>
                    </div>
                    <button type="button" className="pdx-emi-toggle" onClick={() => setEmiOpen((o) => !o)} aria-expanded={emiOpen}>
                      {emiOpen ? 'Hide EMI options' : 'View EMI options'} <ChevronRight aria-hidden="true" />
                    </button>
                    {emiOpen && (
                      <div className="pdx-emi-plans">
                        {[3, 6, 9, 12].map((m) => (
                          <div key={m}><b>{fmt(Math.ceil((currentPrice * displayQty) / m))}</b><span>× {m} months</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Variant pickers (side by side) */}
                <div className="pdx-picks">
                {colors.length > 0 && (
                  <div className="pdx-pick">
                    <div className="pdx-pick-label">Colour: <b>{colors[selectedColorIdx] || 'Select'}</b></div>
                    <div className="pdx-swatches">
                      {colors.map((c, i) => {
                        const v = variants.find((x: any) => x.color === c)
                        const vImg = v?.images?.length ? getImageUrl(typeof v.images[0] === 'string' ? v.images[0] : (v.images[0].image || v.images[0].url || '')) : ''
                        return (
                          <button key={c} className={`pdx-swatch ${i === selectedColorIdx ? 'is-active' : ''}`} onClick={() => { setSelectedColorIdx(i); setSelectedVariantId(null) }} aria-label={c} title={c}>
                            {vImg ? <img src={vImg} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <span style={{ background: getColorSwatch(c) }} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {storageOptions.length > 0 && (
                  <div className="pdx-pick">
                    <div className="pdx-pick-label">Storage: <b>{storageOptions[selectedStorageIdx]}</b></div>
                    <div className="pdx-pills">
                      {storageOptions.map((s, i) => (
                        <button key={s} className={i === selectedStorageIdx ? 'is-active' : ''} onClick={() => { setSelectedStorageIdx(i); setSelectedVariantId(null) }}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                {ramOptions.length > 0 && (
                  <div className="pdx-pick">
                    <div className="pdx-pick-label">RAM: <b>{ramOptions[selectedRamIdx]}</b></div>
                    <div className="pdx-pills">
                      {ramOptions.map((r, i) => (
                        <button key={r} className={i === selectedRamIdx ? 'is-active' : ''} onClick={() => { setSelectedRamIdx(i); setSelectedVariantId(null) }}>{r}</button>
                      ))}
                    </div>
                  </div>
                )}
                {showVariantChips && (
                  <div className="pdx-pick">
                    <div className="pdx-pick-label">Variant</div>
                    <div className="pdx-pills">
                      {variants.map((v: any) => (
                        <button key={v.id} className={String(activeVariant?.id) === String(v.id) ? 'is-active' : ''} onClick={() => setSelectedVariantId(String(v.id))}>
                          {v.name || `Option ${v.id}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                </div>

                <ul className="pdx-highlights">
                  {highlights.map(({ icon: Icon, title, sub }) => (
                    <li key={`${title}-${sub}`}>
                      <span><Icon aria-hidden="true" /></span>
                      <b>{title}</b>
                      <small>{sub}</small>
                    </li>
                  ))}
                </ul>

                <div className="pdx-buy">
                  <div className="pdx-qty">
                    <button onClick={() => changeQty(-1)} aria-label="Decrease quantity"><Minus /></button>
                    <span aria-live="polite">{displayQty}</span>
                    <button onClick={() => changeQty(1)} aria-label="Increase quantity"><Plus /></button>
                  </div>
                  {inStock ? (
                    <>
                      <button className="pdx-btn pdx-btn--cart" disabled={isAdding} onClick={handleAddToCart}>
                        <ShoppingCart aria-hidden="true" /> {isAdding ? 'Adding…' : isInCart ? 'Remove from Cart' : 'Add to Cart'}
                      </button>
                      <button className="pdx-btn pdx-btn--buy" disabled={isAdding} onClick={handleBuyNow}>
                        <Zap aria-hidden="true" /> Buy Now
                      </button>
                    </>
                  ) : (
                    <button className="pdx-btn pdx-btn--buy pdx-btn--wide" onClick={() => setNotifyOpen(true)}>
                      <Bell aria-hidden="true" /> Notify Me
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery bar */}
            <div className="pdx-deliver">
              <MapPin aria-hidden="true" className="pdx-deliver-pin" />
              <div className="pdx-deliver-text">
                {selectedAddress ? (
                  <>
                    <b>Deliver to {selectedAddress.fullName}</b>
                    <span>{selectedAddress.addressLine1}, {selectedAddress.city} – {selectedAddress.zipCode}</span>
                  </>
                ) : (
                  <>
                    <b>Add a delivery address</b>
                    <span>See delivery dates for your location</span>
                  </>
                )}
              </div>
              <button type="button" className="pdx-deliver-chip" onClick={goToAddresses}>
                <span>Delivery by {deliveryBy}</span>
                <i aria-hidden="true" />
                <span>{freeDeliveryUnlocked ? 'Free Delivery' : `Free above ${fmt(FREE_DELIVERY_THRESHOLD)}`}</span>
                <ChevronDown aria-hidden="true" />
              </button>
            </div>

            <ul className="pdx-trust">
              <li><Truck aria-hidden="true" /><div><b>Free Delivery</b><span>on orders over {fmt(FREE_DELIVERY_THRESHOLD)}</span></div></li>
              <li><RotateCcw aria-hidden="true" /><div><b>7-Day Returns</b><span>No questions asked</span></div></li>
              <li><BadgeCheck aria-hidden="true" /><div><b>Authentic Product</b><span>100% genuine</span></div></li>
              <li><ShieldCheck aria-hidden="true" /><div><b>1 Year Warranty</b><span>Manufacturer backed</span></div></li>
            </ul>

            {/* Tabs */}
            <section className="pdx-tabs-wrap" id="ax-reviews-anchor">
              <div className="pdx-tabs" role="tablist">
                {([
                  ['desc', 'Description'],
                  ['specs', 'Specifications'],
                  ['reviews', `Reviews (${Number(ratingCount || productReviews.length).toLocaleString('en-IN')})`],
                  ['qa', `Q&A (${QA.length})`],
                ] as const).map(([key, label]) => (
                  <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>{label}</button>
                ))}
              </div>

              <div className="pdx-tab-body">
                {tab === 'desc' && (
                  <>
                    <h2>Product Description</h2>
                    {descParagraphs.length > 0
                      ? descParagraphs.map((p: string, i: number) => <p key={i}>{p}</p>)
                      : <p>This premium device is engineered for everyday performance — built to last, designed to impress.</p>}
                    {features.length > 0 && (
                      <ul className="pdx-feature-list">
                        {features.map((f: any, i: number) => <li key={i}><Check aria-hidden="true" /> {String(f)}</li>)}
                      </ul>
                    )}
                    {careInstructions.length > 0 && <p><b>Care instructions: </b>{careInstructions.join(', ')}</p>}
                  </>
                )}

                {tab === 'specs' && (
                  <>
                    <h2>Specifications</h2>
                    <table className="pdx-spec">
                      <tbody>
                        {specRows.map(([label, value]) => (
                          <tr key={label}><th>{label}</th><td>{value}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {tab === 'reviews' && (
                  <>
                    <h2>Ratings &amp; Reviews</h2>
                    {rating > 0 || ratingCount > 0 ? (
                      <div className="ax-review-summary">
                        <div className="ax-review-score">
                          <div className="ax-big">{rating.toFixed(1)}</div>
                          <Stars score={rating} />
                          <div className="pdx-muted">{ratingCount || 0} ratings</div>
                        </div>
                        <RatingBars distribution={productRating.distribution} count={productRating.count} />
                      </div>
                    ) : (
                      <p>No ratings yet — be the first to review this product!</p>
                    )}
                    {canReview && !hasReviewed && showReviewForm && (
                      <div className="ax-review-form-wrap">
                        <ReviewForm
                          productId={Number(resolvedId)}
                          orderId={orderIdParam}
                          onSubmitted={async () => { setShowReviewForm(false); await refreshReviews() }}
                        />
                      </div>
                    )}
                    {canReview && !hasReviewed && !showReviewForm && (
                      <button className="pdx-outline-btn" onClick={() => setShowReviewForm(true)}>Write a Review</button>
                    )}
                    {productReviews.map((review) => (
                      <div key={review.id} className="ax-review-card">
                        <div className="ax-review-head">
                          <div className="ax-avatar">{(review.userName || 'U').charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="ax-rev-name">{review.userName}</div>
                            <div className="ax-rev-date">
                              Verified purchase{review.createdAt ? ` · ${new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                            </div>
                          </div>
                        </div>
                        <Stars score={review.rating} small />
                        <p className="ax-review-text">&ldquo;{review.comment}&rdquo;</p>
                        {review.images.length > 0 && (
                          <div className="ax-review-imgs">
                            {review.images.map((url, j) => (
                              <a key={j} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="" loading="lazy" /></a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {tab === 'qa' && (
                  <>
                    <h2>Questions &amp; Answers</h2>
                    <div className="pdx-qa">
                      {QA.map(({ q, a }) => (
                        <details key={q}>
                          <summary><MessageCircleQuestion aria-hidden="true" /> {q}</summary>
                          <p>{a}</p>
                        </details>
                      ))}
                    </div>
                    <Link to="/support" className="pdx-outline-btn">Ask a question</Link>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* ════════ RIGHT: offers + bought together ════════ */}
          <aside className="pdx-side">
            <section className="pdx-card">
              <h2 className="pdx-card-title"><span><Percent aria-hidden="true" /></span> Offers &amp; Deals</h2>
              <ul className="pdx-offers">
                {storeCoupons.map((c) => (
                  <li key={c.code}>
                    <Tag aria-hidden="true" />
                    <div>
                      <b>{couponLabel(c)}</b>
                      <span>Use code at checkout: <button type="button" className="pdx-code" onClick={() => copyCode(c.code)}>{copiedCode === c.code ? 'Copied ✓' : c.code}</button></span>
                    </div>
                  </li>
                ))}
                <li>
                  <ArrowLeftRight aria-hidden="true" />
                  <div>
                    <b>{PRODUCT_OFFERS[0].title}</b>
                    <span>Trade in any old phone</span>
                  </div>
                  <button type="button" className="pdx-offer-btn" onClick={() => navigate('/trade-in')}>Check Value</button>
                </li>
                <li>
                  <CreditCard aria-hidden="true" />
                  <div>
                    <b>{PRODUCT_OFFERS[1].title}</b>
                    <span>{PRODUCT_OFFERS[1].desc}</span>
                  </div>
                  <button
                    type="button"
                    className="pdx-offer-btn"
                    onClick={() => { setEmiOpen(true); document.getElementById('pdx-emi')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}
                  >
                    View Plans
                  </button>
                </li>
              </ul>
              <button type="button" className="pdx-bank-toggle" onClick={() => setBankOpen((o) => !o)} aria-expanded={bankOpen}>
                {bankOpen ? 'Hide bank offers' : `+${BANK_OFFERS.length} bank offers`} <ChevronDown aria-hidden="true" className={bankOpen ? 'is-open' : ''} />
              </button>
              {bankOpen && (
                <ul className="pdx-banks">
                  {BANK_OFFERS.map((o) => {
                    const applied = appliedOffer === o.code
                    const saving = getBankSaving(o, subtotal)
                    return (
                      <li key={o.code}>
                        <div>
                          <b>{o.bank} · {o.offer}</b>
                          <span>{o.desc}{saving > 0 ? ` · save ${fmt(saving)}` : ''}</span>
                        </div>
                        <button type="button" className={`pdx-offer-btn ${applied ? 'is-applied' : ''}`} onClick={() => applyBankOffer(o.code)}>
                          {applied ? 'Applied ✓' : 'Apply'}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {fbtItems.length > 0 && (
              <section className="pdx-card">
                <h2 className="pdx-card-title"><span><Layers aria-hidden="true" /></span> Frequently Bought Together</h2>
                <div className="pdx-fbt">
                  {[{ key: -1, img: images[0], name: productName }, ...fbtItems.map((rp: any) => ({ key: Number(rp.id), img: getProductImage(rp) || FALLBACK_IMG, name: relatedName(rp) }))].map((it, i) => (
                    <div key={it.key} className="pdx-fbt-cell">
                      {i > 0 && <Plus aria-hidden="true" className="pdx-fbt-plus" />}
                      <label className={`pdx-fbt-item ${fbtChecked.has(it.key) ? 'is-on' : ''}`} title={it.name}>
                        <input type="checkbox" checked={fbtChecked.has(it.key)} onChange={() => toggleFbt(it.key)} aria-label={`Include ${it.name}`} />
                        <span className="pdx-fbt-check"><Check aria-hidden="true" /></span>
                        <img src={it.img} alt="" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }} />
                      </label>
                    </div>
                  ))}
                </div>
                <ul className="pdx-fbt-names">
                  {[{ key: -1, name: productName, price: fbtSelf.price }, ...fbtItems.map((rp: any) => ({ key: Number(rp.id), name: relatedName(rp), price: relatedPrice(rp).current }))].map((it) => (
                    <li key={it.key} className={fbtChecked.has(it.key) ? '' : 'is-off'}>
                      <span>{it.key === -1 ? 'This item: ' : ''}{it.name}</span><b>{fmt(it.price)}</b>
                    </li>
                  ))}
                </ul>
                {fbtMrp > fbtTotal && <p className="pdx-fbt-save">Buy together &amp; save {fmt(fbtMrp - fbtTotal)}</p>}
                <p className="pdx-fbt-total">
                  Total: <b>{fmt(fbtTotal)}</b>
                  {fbtMrp > fbtTotal && <s>{fmt(fbtMrp)}</s>}
                </p>
                <button type="button" className="pdx-combo-btn" onClick={addCombo} disabled={comboAdding || fbtCount === 0}>
                  <ShoppingCart aria-hidden="true" /> {comboAdding ? 'Adding…' : fbtCount > 1 ? `Add ${fbtCount} Items to Cart` : 'Add Combo to Cart'}
                </button>
              </section>
            )}
          </aside>
        </div>

        {/* ===== RELATED PRODUCTS ===== */}
        {relatedProducts.length > 0 && (
          <div className="ax-reveal ax-related-section">
            <div className="ax-related-head">
              <div>
                <div className="ax-related-subtitle">HANDPICKED RECOMMENDATIONS</div>
                <h3 className="ax-display ax-related-title">You may also like</h3>
              </div>
              <Link to="/collection/all" className="ax-related-view-all">
                View Collection
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
            <div className="ax-related-grid">
              {relatedProducts.map((rp: any) => {
                const { current: rpPrice, old: rpOld } = relatedPrice(rp)
                const rpImg = getProductImage(rp) || FALLBACK_IMG
                const rpDisc = rpPrice > 0 && rpOld && rpOld > rpPrice ? Math.round(((rpOld - rpPrice) / rpOld) * 100) : 0
                const rpName = relatedName(rp) || 'Product'
                return (
                  <div key={rp.id} className="ax-related-card">
                    <div className="ax-related-media" onClick={() => navigate(`/product/${rp.id}`)} style={{ cursor: 'pointer' }}>
                      <img src={rpImg} alt={rpName} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }} />
                      {rpDisc > 0 && <span className="ax-related-disc-chip">{rpDisc}% OFF</span>}
                      <div className="ax-related-hover-actions">
                        <button className="ax-related-act-btn" aria-label="Add to wishlist" title="Add to wishlist" onClick={(e) => { e.stopPropagation(); toggleWishlist(rp.id) }}>
                          <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="ax-related-info">
                      <div className="ax-related-meta">
                        <span className="ax-related-brand">{rp.brand || 'PhoneFix'}</span>
                        <span className="ax-related-price-inline">{fmt(rpPrice)}</span>
                      </div>
                      <h4 className="ax-related-name" onClick={() => navigate(`/product/${rp.id}`)} style={{ cursor: 'pointer' }}>{rpName}</h4>
                      <div className="ax-related-bottom">
                        <button className="ax-related-add-btn" onClick={(e) => { e.stopPropagation(); handleRelatedAddToCart(e, rp) }} title="Add to Cart">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* ===== STICKY BUY BAR ===== */}
      <div className={`ax-sticky-bar ${stickyVisible ? 'show' : ''}`}>
        <div>
          {oldPriceVal > currentPrice && <span className="ax-sb-old ax-mono">{fmt(oldPriceVal)}</span>}
          <span className="ax-sb-price">{fmt(currentPrice)}</span>
        </div>
        <button className="ax-btn-primary" onClick={inStock ? handleAddToCart : () => setNotifyOpen(true)}>
          {!inStock ? 'Notify Me' : isAdding ? 'Adding…' : isInCart ? 'Remove from Cart' : 'Add to Cart'}
        </button>
      </div>

      {/* ===== TOAST ===== */}
      <div className={`ax-toast ${toastShow ? 'show' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
        <span>{toastMsg}</span>
      </div>

      {/* ===== FULL-VIEW LIGHTBOX ===== */}
      {lightboxOpen && (
        <div className="ax-lightbox" onClick={closeLightbox}>
          <button className="ax-lb-close" onClick={closeLightbox} aria-label="Close">✕</button>
          {images.length > 1 && (
            <button className="ax-lb-prev" onClick={(e) => { e.stopPropagation(); stepLightbox(-1) }} aria-label="Previous">‹</button>
          )}
          <img src={images[lightboxIdx] || images[0]} alt={productName} onClick={(e) => e.stopPropagation()} />
          {images.length > 1 && (
            <button className="ax-lb-next" onClick={(e) => { e.stopPropagation(); stepLightbox(1) }} aria-label="Next">›</button>
          )}
          {images.length > 1 && <div className="ax-lb-counter">{lightboxIdx + 1} / {images.length}</div>}
        </div>
      )}

      {/* ===== NOTIFY ME MODAL ===== */}
      {notifyOpen && (
        <div className="ax-notify-modal" onClick={() => setNotifyOpen(false)} role="dialog" aria-modal="true" aria-labelledby="notify-title">
          <div className="ax-notify-content" onClick={(e) => e.stopPropagation()}>
            <button className="ax-notify-close" onClick={() => setNotifyOpen(false)} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <div className="ax-notify-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h2 id="notify-title">Notify Me When Available</h2>
            <p>We'll email you as soon as <strong>{variantName || productName}</strong> is back in stock.</p>
            <form onSubmit={(e) => { e.preventDefault(); handleNotifySubmit(); }}>
              <div className="ax-notify-input">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                />
              </div>
              <button type="submit" className="ax-notify-submit" disabled={!notifyEmail || !validateEmail(notifyEmail)}>
                Notify Me
              </button>
            </form>
            <p className="ax-notify-note">We'll only notify you about this product. No spam, ever.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProductDetail() {
  return (
    <ErrorBoundary>
      <ProductDetailContent />
    </ErrorBoundary>
  )
}

const AXPD_CSS = `
.axpd{
  --white:#ffffff;
  --off-white:#f7f6f2;
  /* PhoneFix palette: Deep green · Warm Cream · Soft sage · Sunshine/Turbo Yellow.
     (--red* names are kept so existing rules pick up the brand green.) */
  --green:#0f3b2c;
  --green-mid:#18503c;
  --sage:#dfe8b4;
  --sunshine:#dfe8b4;
  --turbo:#dfe8b4;
  --ink:#0f3b2c;
  --slate:#5d6762;
  --border:#ece4ef;
  --red:#0f3b2c;
  --red-deep:#18503c;
  --red-tint:rgba(223,232,180,.22);
  --green:#1e8a5f;
  --green-tint:#eaf7f1;
  --gold:#dfe8b4;
  --accent:var(--red);
  --black:#151515;
  --gray-900:#1C1C1E;
  --gray-600:#6B6B70;
  --gray-400:#9A9AA0;
  --gray-200:#E7E7EA;
  --radius:14px;
  --shadow-sm:0 1px 3px rgba(15,59,44,.06);
  --shadow-md:0 10px 30px rgba(15,59,44,.08);
  --shadow-lg:0 20px 50px rgba(15,59,44,.14);
  font-family:var(--font-ui);
  color:var(--ink);
  background:var(--off-white);
  -webkit-font-smoothing:antialiased;
  overflow-x:clip;
}
.axpd .ax-mono{font-family:var(--font-display);}
.axpd .ax-display{font-family:var(--font-display);}
.axpd ::selection{background:var(--sage); color:var(--green);}
.axpd a{color:inherit; text-decoration:none;}
.axpd img,.axpd svg{display:block; max-width:100%;}


/* ===== premium top nav color overrides ===== */
.axpd .pfn-nav-link{color:rgba(255,255,255,.82);}
.axpd .pfn-nav-link:hover,.axpd .pfn-nav-link.pfn-active{color:#fff;}
/* keep old wx-cat-links working if still referenced anywhere */
.axpd .wx-cat-links a{color:#fff;}
.axpd .wx-cat-links a:hover{color:#fff;}
.axpd .wx-cat-links a.wx-active{color:var(--red);}

/* Ensure dropdown menu items have white text (override .axpd a{color:inherit}) */
.axpd .pfn-acc-drop a.pfn-menu-row,
.axpd .pfn-acc-drop .pfn-menu-row,
.axpd .pfn-mega-drop a.pfn-mega-link,
.axpd .pfn-acc-drop .pfn-drop-logout {
  color: #fff !important;
}
.axpd .pfn-acc-drop a.pfn-menu-row:hover,
.axpd .pfn-acc-drop .pfn-menu-row:hover,
.axpd .pfn-mega-drop a.pfn-mega-link:hover,
.axpd .pfn-acc-drop .pfn-drop-logout:hover {
  color: #fff !important;
}
.axpd .pfn-acc-drop .pfn-menu-row svg,
.axpd .pfn-mega-drop .pfn-mega-link svg,
.axpd .pfn-acc-drop .pfn-drop-logout svg {
  stroke: #fff !important;
}
.axpd .pfn-acc-drop .pfn-drop-id span {
  color: rgba(255,255,255,0.7) !important;
}

/* reveal */

/* reveal */
.axpd .ax-reveal{opacity:0; transform:translateY(18px); transition:opacity .6s ease, transform .6s ease;}
.axpd .ax-reveal.in{opacity:1; transform:translateY(0);}
@media (prefers-reduced-motion: reduce){
  .axpd .ax-reveal{opacity:1; transform:none; transition:none;}
}

/* breadcrumb */
.axpd .ax-breadcrumb{max-width:1280px; margin:0 auto; padding:14px 32px 0; font-size:12.5px; color:var(--slate); display:flex; gap:6px; flex-wrap:wrap;}
.axpd .ax-breadcrumb a{color:var(--slate); font-weight:600; transition:color .2s;}
.axpd .ax-breadcrumb a:hover{color:var(--red);}
.axpd .ax-breadcrumb .sep{color:#c9c9cc;}
.axpd .ax-breadcrumb .current{color:var(--ink); font-weight:700;}

/* category chips */
.axpd .ax-cat-chips{display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;}
.axpd .ax-cat-chip{
  display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:700;
  color:var(--red-deep); background:var(--red-tint); border:1px solid rgba(15,59,44,.18);
  padding:6px 12px; border-radius: 8px; text-transform:capitalize; transition:all .2s;
}
.axpd .ax-cat-chip svg{width:13px; height:13px;}
.axpd .ax-cat-chip:hover{background:var(--red); color:#fff; border-color:var(--red);}

/* deal strip */
.axpd .ax-deal-strip{max-width:1280px; margin:16px auto 0; padding:0 32px; border-radius:var(--radius); overflow:hidden; box-shadow:var(--shadow-md);}
.axpd .ax-deal-inner{
  background:linear-gradient(115deg, #0b2e22, var(--green) 55%, var(--green-mid));
  padding:16px 22px 14px;
  display:flex; align-items:center; justify-content:space-between;
  flex-wrap:wrap; gap:14px; color:#fff; position:relative; overflow:hidden;
}
.axpd .ax-deal-inner::before{
  content:''; position:absolute; top:-60px; right:-40px; width:240px; height:240px; border-radius: 8px;
  background:radial-gradient(circle, rgba(223,232,180,.28), transparent 70%); pointer-events:none;
}
.axpd .ax-deal-left{display:flex; align-items:center; gap:14px; position:relative;}
.axpd .ax-deal-bolt{
  width:46px; height:46px; border-radius:12px; flex-shrink:0;
  background:linear-gradient(135deg, var(--turbo), var(--sunshine));
  display:flex; align-items:center; justify-content:center; box-shadow:0 6px 18px rgba(223,232,180,.4);
}
.axpd .ax-deal-bolt svg{width:24px; height:24px; color:var(--green);}
.axpd .ax-deal-copy{display:flex; flex-direction:column; gap:5px;}
.axpd .ax-deal-badge{
  display:inline-flex; align-items:center; gap:8px; align-self:flex-start;
  font-size:10px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; 
  background-color: var(--sunshine); color: var(--green); padding: 4px 10px; border-radius: 8px;
}
.axpd .ax-pulse{width:8px; height:8px; border-radius: 8px; background:var(--green); box-shadow:0 0 0 rgba(223,232,180,.6); animation:ax-pulse 1.8s infinite;}
@keyframes ax-pulse{
  0%{box-shadow:0 0 0 0 rgba(223,232,180,.55);}
  70%{box-shadow:0 0 0 9px rgba(223,232,180,0);}
  100%{box-shadow:0 0 0 0 rgba(223,232,180,0);}
}
.axpd .ax-deal-msg{font-size:15px; font-weight:600; letter-spacing:.01em; background-color: transparent;}
.axpd .ax-deal-msg b{color:var(--sunshine); font-weight:800;}
.axpd .ax-deal-right{display:flex; align-items:center; gap:14px; position:relative;}
.axpd .ax-deal-count-label{font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--sage); background-color: transparent;}
.axpd .ax-countdown{display:flex; align-items:center; gap:6px;}
.axpd .ax-cd-unit{
  background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:10px; padding:6px 9px;
  text-align:center; min-width:50px; backdrop-filter:blur(4px);
  background-color: rgba(255,255,255,.06);
}
.axpd .ax-cd-num{font-family:var(--font-display); font-weight:700; font-size:20px; display:block; color:#fff; line-height:1;}
.axpd .ax-cd-num.ax-flip{animation:ax-flip .4s ease;}
@keyframes ax-flip{
  0%{transform:rotateX(90deg); opacity:.3;}
  100%{transform:rotateX(0deg); opacity:1;}
}
.axpd .ax-cd-lbl{font-size:8.5px; letter-spacing:.1em; opacity:.7; text-transform:uppercase; margin-top:3px; display:block; background-color: transparent;}
.axpd .ax-cd-colon{font-family:var(--font-display); font-size:18px; font-weight:700; color:var(--sunshine);}
.axpd .ax-deal-progress{height:4px; background:rgba(255,255,255,.08);}
.axpd .ax-deal-progress span{
  display:block; height:100%; background:linear-gradient(90deg, var(--sunshine), var(--turbo));
  transition:width .8s cubic-bezier(.4,0,.2,1); position:relative;
}
.axpd .ax-deal-progress span::after{
  content:''; position:absolute; right:0; top:0; bottom:0; width:8px;
  background:rgba(255,255,255,.5); border-radius: 8px; animation:ax-glide 1.6s ease-in-out infinite;
}
@keyframes ax-glide{
  0%,100%{transform:translateX(0); opacity:.9;}
  50%{transform:translateX(-14px); opacity:.3;}
}

/* main layout */
.axpd .ax-page-wrap{max-width:1280px; margin:0 auto; padding:20px 32px;}
.axpd .ax-product-grid{display:grid; grid-template-columns:minmax(420px, 640px) minmax(0, 1fr); gap:40px; align-items:start;}

/* sticky gallery column (image + offers don't scroll) */
.axpd .ax-gallery-col{position:sticky; top:84px; display:flex; flex-direction:column; gap:16px;}

/* gallery */
.axpd .ax-gallery{display:grid; grid-template-columns:92px 1fr; gap:16px;}
.axpd .ax-thumb-rail{display:flex; flex-direction:column; gap:10px; position:relative;}
.axpd .ax-thumb{
  width:92px; height:92px; border-radius:14px; border:1.5px solid var(--border);
  background:var(--white); padding:8px; cursor:pointer; position:relative;
  transition:border-color .2s, transform .2s, box-shadow .2s;
}
.axpd .ax-thumb:hover{transform:translateY(-2px); border-color:var(--red);}
.axpd .ax-thumb.active{border-color:var(--red); box-shadow:0 4px 14px rgba(15,59,44,.12);}
.axpd .ax-thumb.active::before{
  content:''; position:absolute; left:-14px; top:8px; bottom:8px; width:3px;
  background:var(--red); border-radius:3px; animation:ax-rail-in .25s ease;
}
@keyframes ax-rail-in{from{transform:scaleY(0);} to{transform:scaleY(1);}}
.axpd .ax-thumb img{width:100%; height:100%; object-fit:contain;}

.axpd .ax-stage{
  background:linear-gradient(180deg,#fbf7ff,#fff 45%); border:1px solid var(--border); border-radius:var(--radius);
  height:clamp(480px, 64vh, 680px); position:relative; overflow:hidden; box-shadow:var(--shadow-sm);
  cursor:zoom-in;
}
.axpd .ax-stage-img{
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  padding:5%; opacity:0; transform:scale(1.04); transition:opacity .45s ease, transform .5s ease;
}
.axpd .ax-stage-img img{width:100%; height:100%; object-fit:contain;}
.axpd .ax-stage-img.active{opacity:1; transform:scale(1);}
.axpd .ax-stage:hover .ax-stage-img.active{transform:scale(1.03);}
.axpd .ax-arrow{
  position:absolute; top:50%; transform:translateY(-50%);
  width:40px; height:40px; border-radius: 8px; border:1px solid var(--border);
  background:#fff; color:var(--ink); display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 14px rgba(15,59,44,.12); cursor:pointer; z-index:3;
  transition:background .2s, color .2s, transform .2s;
}
.axpd .ax-arrow:hover{background:var(--red); border-color:var(--red); color:#fff; transform:translateY(-50%) scale(1.06);}
.axpd .ax-arrow svg{width:18px; height:18px;}
.axpd .ax-arrow-prev{left:12px;}
.axpd .ax-arrow-next{right:12px;}
.axpd .ax-counter{
  position:absolute; bottom:12px; left:14px; font-size:11px; font-weight:700;
  font-family:var(--font-display); color:var(--ink); background:rgba(255,255,255,.9);
  background-color: rgba(255,255,255,.9);
  border:1px solid var(--border); padding:4px 10px; border-radius: 8px; z-index:2;
}
.axpd .ax-stage-badges{position:absolute; top:14px; left:14px; display:flex; flex-direction:column; gap:6px; z-index:2;}
.axpd .ax-pill{font-size:10.5px; font-weight:700; padding:4px 10px; border-radius: 8px; text-transform:uppercase; letter-spacing:.04em;}
.axpd .ax-pill.ax-new{background:var(--ink); color:#fff;}
.axpd .ax-pill.ax-off{background:var(--sunshine); color:var(--green);}
.axpd .ax-stage-actions{position:absolute; top:14px; right:14px; display:flex; flex-direction:column; gap:8px; z-index:2;}
.axpd .ax-icon-btn{
  width:36px; height:36px; border-radius: 8px; background:#fff; border:1px solid var(--border);
  display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-sm);
  transition:transform .2s, border-color .2s, color .2s; color:var(--slate); cursor:pointer;
}
.axpd .ax-icon-btn:hover{transform:scale(1.08); border-color:var(--red); color:var(--red);}
.axpd .ax-icon-btn.liked{color:var(--red);}
.axpd .ax-icon-btn.liked svg{fill:var(--red);}
.axpd .ax-zoom-hint{
  position:absolute; bottom:12px; right:14px; font-size:11px; color:var(--slate);
  background:#fff; padding:4px 10px; border-radius: 8px; border:1px solid var(--border);
  opacity:0; transition:opacity .2s; z-index:2;
}
.axpd .ax-stage:hover .ax-zoom-hint{opacity:1;}
.axpd .ax-dots{display:flex; justify-content:center; gap:6px; margin-top:14px; cursor:pointer;}
.axpd .ax-dot{width:6px; height:6px; border-radius: 8px; background:var(--border); transition:.2s;}
.axpd .ax-dot.active{background:var(--red); width:18px; border-radius:4px;}

/* right content */
.axpd .ax-content-right{display:flex; flex-direction:column; gap:26px;}
.axpd .ax-brand-row{display:flex; align-items:center; justify-content:space-between; gap:12px;}
.axpd .ax-brand-tag{color:var(--green-mid); font-weight:700; font-size:12.5px; letter-spacing:.06em; text-transform:uppercase;}
.axpd .ax-title{font-family:var(--font-display); font-weight:700; font-size:27px; line-height:1.3; margin-top:4px; letter-spacing:-.01em;}
.axpd .ax-rating-row{display:flex; align-items:center; gap:12px; margin-top:10px; flex-wrap:wrap;}
.axpd .ax-stars{display:flex; gap:2px;}
.axpd .ax-stars svg{width:16px; height:16px;}
.axpd .ax-stars.ax-sm svg{width:14px; height:14px;}
.axpd .ax-rating-badge{background:var(--green); color:#fff; font-size:12.5px; font-weight:700; padding:3px 8px; border-radius:6px; display:flex; align-items:center; gap:4px;}
.axpd .ax-rating-count{font-size:13px; color:var(--slate);}
.axpd .ax-rating-count a{color:var(--red); font-weight:600; cursor:pointer;}

/* price block */
.axpd .ax-price-block{border:1px solid var(--border); border-radius:var(--radius); padding:22px; background:var(--white); box-shadow:var(--shadow-sm);}
.axpd .ax-price-top{display:flex; align-items:baseline; gap:12px; flex-wrap:wrap;}
.axpd .ax-deal-price{font-family:var(--font-display); font-weight:700; font-size:34px; color:var(--ink);}
.axpd .ax-mrp{font-family:var(--font-display); font-size:16px; color:var(--slate); text-decoration:line-through;}
.axpd .ax-discount{background:var(--sunshine); color:var(--green); font-weight:800; font-size:13.5px; padding:3px 10px; border-radius:6px;}
.axpd .ax-tax-note{font-size:12px; color:var(--slate); margin-top:6px;}
.axpd .ax-emi-note{
  margin-top:14px; font-size:13px; display:inline-flex; align-items:center; gap:8px;
  background:var(--red-tint); color:var(--red-deep); padding:9px 12px; border-radius:8px; font-weight:600;
}

/* variants */
.axpd .ax-variant-block{display:flex; flex-direction:column; gap:10px;}
.axpd .ax-variant-label{font-size:13px; font-weight:700;}
.axpd .ax-variant-label span{color:var(--slate); font-weight:500; text-transform:capitalize;}
.axpd .ax-swatches{display:flex; gap:10px; flex-wrap:wrap;}
.axpd .ax-swatch{
  width:38px; height:38px; border-radius: 8px; border:2px solid transparent; padding:2px;
  cursor:pointer; position:relative; transition:transform .2s; background:var(--white);
}
.axpd .ax-swatch:hover{transform:translateY(-2px);}
.axpd .ax-swatch .ax-swatch-fill{width:100%; height:100%; border-radius: 8px; border:1px solid rgba(0,0,0,.08); display:block;}
.axpd .ax-swatch.active{border-color:var(--red);}
.axpd .ax-swatch.active::after{
  content:'✓'; position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  color:#fff; font-size:13px; font-weight:700; text-shadow:0 0 3px rgba(0,0,0,.4);
}
.axpd .ax-pills{display:flex; gap:10px; flex-wrap:wrap;}
.axpd .ax-pill-opt{
  border:1.5px solid var(--border); background:var(--white); color:var(--ink);
  border-radius:8px; padding:8px 16px; font-weight:600; font-size:13px; cursor:pointer; transition:all .2s;
}
.axpd .ax-pill-opt:hover{border-color:var(--red); color:var(--red);}
.axpd .ax-pill-opt.active{border-color:var(--red); background:var(--red-tint); color:var(--red-deep);}

/* variant cards (mobile-style list) */
.axpd .ax-variant-list{display:flex; flex-direction:column; gap:10px;}
.axpd .ax-variant-card{
  width:100%; display:flex; align-items:center; gap:14px; text-align:left;
  border:1.5px solid var(--border); border-radius:12px; background:var(--white);
  padding:12px 14px; cursor:pointer; transition:border-color .2s, box-shadow .2s, transform .2s;
}
.axpd .ax-variant-card:hover{border-color:var(--red); transform:translateY(-1px); box-shadow:var(--shadow-sm);}
.axpd .ax-variant-card.selected{border-color:var(--red); background:var(--red-tint); box-shadow:0 0 0 3px rgba(15,59,44,.08);}
.axpd .ax-vc-img{
  width:52px; height:52px; border-radius:10px; background:var(--white);
  border:1px solid var(--border); flex-shrink:0; display:flex; align-items:center; justify-content:center; overflow:hidden;
}
.axpd .ax-vc-img img{width:100%; height:100%; object-fit:cover;}
.axpd .ax-vc-dot{width:26px; height:26px; border-radius: 8px; border:1px solid rgba(0,0,0,.08);}
.axpd .ax-vc-mid{min-width:0; flex:1; display:flex; flex-direction:column; gap:2px;}
.axpd .ax-vc-name{font-size:13.5px; font-weight:700; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.axpd .ax-vc-specs{font-size:12px; color:var(--slate); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.axpd .ax-vc-right{display:flex; align-items:center; gap:10px; flex-shrink:0;}
.axpd .ax-vc-price{display:flex; flex-direction:column; align-items:flex-end; gap:1px;}
.axpd .ax-vc-price b{font-family:var(--font-display); font-size:14.5px; color:var(--ink);}
.axpd .ax-vc-price s{font-size:11px; color:var(--slate);}
.axpd .ax-vc-off{
  font-size:10px; font-weight:800; color:#166534; background:#e8f7ee;
  border-radius: 8px; padding:3px 8px; white-space:nowrap;
}
.axpd .ax-vc-radio{
  width:20px; height:20px; border-radius: 8px; border:2px solid #d1d5db; background:#fff;
  display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .2s; color:#fff;
}
.axpd .ax-vc-radio.on{border-color:var(--red); background:var(--red);}

/* delivery address */
.axpd .ax-delivery-block{display:flex; flex-direction:column; gap:10px;}
.axpd .ax-field-label{font-size:13px; font-weight:700;}
.axpd .ax-address-btn{
  position:relative; display:flex; align-items:center; gap:12px; width:100%; max-width:460px; text-align:left;
  border:1px solid var(--border); border-radius:12px; background:var(--white); padding:12px 40px 12px 12px;
  cursor:pointer; transition:border-color .2s, box-shadow .2s, transform .2s;
}
.axpd .ax-address-btn:hover{border-color:var(--red); box-shadow:0 6px 20px rgba(24,80,60,.08); transform:translateY(-1px);}
.axpd .ax-address-ic{
  width:40px; height:40px; border-radius:10px; background:var(--red-tint); color:var(--red);
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.axpd .ax-address-ic svg{width:19px; height:19px;}
.axpd .ax-address-info{display:flex; flex-direction:column; gap:2px; min-width:0;}
.axpd .ax-address-info b{font-size:14px; color:var(--ink);}
.axpd .ax-address-info span{font-size:12.5px; color:var(--slate); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
.axpd .ax-address-caret{position:absolute; right:14px; width:14px; height:14px; color:var(--slate); flex-shrink:0;}
.axpd .ax-btn-check{
  border:1.5px solid var(--red); color:var(--red); border-radius:8px; padding:10px 18px;
  font-weight:700; font-size:13px; white-space:nowrap; transition:background .2s, color .2s; cursor:pointer;
}
.axpd .ax-btn-check:hover{background:var(--red); color:#fff;}
.axpd .ax-delivery-result{
  font-size:13px; color:#166534; display:none; align-items:center; gap:8px; font-weight:600;
}
.axpd .ax-delivery-result.show{display:flex; animation:ax-fade-in .3s ease;}
@keyframes ax-fade-in{from{opacity:0; transform:translateY(-4px);} to{opacity:1; transform:translateY(0);}}

/* offers accordion */
.axpd .ax-offers-block{border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; background:var(--white);}
.axpd .ax-offers-head{
  display:flex; align-items:center; justify-content:space-between; padding:16px 18px;
  cursor:pointer; background:var(--white); font-weight:700; font-size:14.5px; user-select:none;
}
.axpd .ax-chev{transition:transform .25s; flex-shrink:0;}
.axpd .ax-offers-head.open .ax-chev{transform:rotate(180deg);}
.axpd .ax-offers-body{max-height:0; overflow:hidden; transition:max-height .35s ease;}
.axpd .ax-offers-body.open{max-height:560px;}
.axpd .ax-offer-item{display:flex; gap:12px; padding:13px 18px; border-top:1px solid var(--border); font-size:13px;}
.axpd .ax-offer-icon{
  width:30px; height:30px; border-radius:8px; background:var(--red-tint); color:var(--red-deep);
  display:flex; align-items:center; justify-content:center; flex-shrink:0; font-weight:700; font-size:13px;
}
.axpd .ax-offer-item b{display:block; font-size:13.5px; margin-bottom:2px;}
.axpd .ax-offer-item span{color:var(--slate);}

/* buy row */
.axpd .ax-buy-row{display:flex; align-items:center; gap:16px; flex-wrap:wrap;}
.axpd .ax-qty-selector{display:flex; align-items:center; border:1px solid var(--border); border-radius:10px; overflow:hidden; background:var(--white);}
.axpd .ax-qty-selector button{width:38px; height:44px; font-size:17px; color:var(--ink); transition:background .2s; cursor:pointer;}
.axpd .ax-qty-selector button:hover{background:var(--off-white);}
.axpd .ax-qty-val{width:40px; text-align:center; font-weight:700; font-family:var(--font-display);}
.axpd .ax-btn-primary{
  flex:1; min-width:180px; background:var(--green); color:#f7f6f2; font-weight:700; font-size:14.5px;
  padding:14px 22px; border-radius:10px; display:flex; align-items:center; justify-content:center; gap:8px;
  transition:background .2s, transform .1s; position:relative; overflow:hidden; cursor:pointer;
}
.axpd .ax-btn-primary:hover:not(:disabled){background:var(--red-deep);}
.axpd .ax-btn-primary:active:not(:disabled){transform:scale(.98);}
.axpd .ax-btn-primary:disabled{opacity:.5; cursor:not-allowed;}
.axpd .ax-btn-secondary{
  flex:1; min-width:180px; background:var(--sunshine); color:var(--green); font-weight:800; font-size:14.5px;
  box-shadow:0 10px 22px -8px rgba(223,232,180,.7);
  padding:14px 22px; border-radius:10px; text-align:center; transition:background .2s, transform .1s; cursor:pointer;
}
.axpd .ax-btn-secondary:hover:not(:disabled){background:var(--turbo);}
.axpd .ax-btn-secondary:active:not(:disabled){transform:scale(.98);}
.axpd .ax-btn-secondary:disabled{opacity:.5; cursor:not-allowed;}

/* highlights */
.axpd .ax-highlights{display:grid; grid-template-columns:repeat(3,1fr); gap:12px; border-top:1px solid var(--border); border-bottom:1px solid var(--border); padding:18px 0;}
.axpd .ax-highlight{display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px; font-size:12px; color:var(--slate);}
.axpd .ax-highlight svg{width:24px; height:24px; color:var(--red);}
.axpd .ax-highlight b{color:var(--ink); font-size:12.5px;}

/* sections */
.axpd .ax-sec-title{
  font-family:var(--font-display); font-size:19px; margin:36px 0 16px; padding:12px 18px;
  background:linear-gradient(120deg, var(--red-tint), #fff 70%); border-left:4px solid var(--sunshine);
  border-radius:10px; color:var(--ink); display:flex; align-items:center; gap:10px;
  background-color: #fff; /* Explicit for contrast detection */
}
.axpd .ax-sec-title:first-child{margin-top:0;}
.axpd .ax-sec-block{animation:ax-fade-in .35s ease;}
.axpd .ax-desc-text{font-size:14px; line-height:1.8; color:#0f3b2c;}
.axpd .ax-desc-text + .ax-desc-text{margin-top:10px;}

/* spec table */
.axpd .ax-spec-table{width:100%; border-collapse:collapse; font-size:13.5px;}
.axpd .ax-spec-table tr{border-bottom:1px solid var(--border);}
.axpd .ax-spec-table tr:last-child{border-bottom:none;}
.axpd .ax-spec-table td{padding:11px 6px;}
.axpd .ax-spec-table td:first-child{color:var(--slate); width:38%; font-weight:600;}
.axpd .ax-spec-table td:last-child{font-weight:600;}

/* reviews */
.axpd .ax-review-summary{display:flex; gap:36px; flex-wrap:wrap; padding:20px 0;}
.axpd .ax-review-score{text-align:center; min-width:120px;}
.axpd .ax-review-score .ax-big{font-family:var(--font-display); font-weight:800; font-size:40px;}
.axpd .ax-review-score .ax-stars{justify-content:center; margin:6px 0;}
.axpd .ax-review-bars{flex:1; min-width:220px; display:flex; flex-direction:column; gap:7px;}
.axpd .ax-review-bar-row{display:flex; align-items:center; gap:10px; font-size:12px; color:var(--slate);}
.axpd .ax-bar-track{flex:1; height:7px; background:var(--border); border-radius: 8px; overflow:hidden;}
.axpd .ax-bar-fill{height:100%; width:0%; background:#f2b01e; border-radius: 8px;}
.axpd .ax-review-card{border-top:1px solid var(--border); padding:18px 0; display:flex; flex-direction:column; gap:6px;}
.axpd .ax-review-head{display:flex; align-items:center; gap:10px;}
.axpd .ax-avatar{
  width:34px; height:34px; border-radius: 8px; background:var(--red-tint); color:var(--red-deep);
  display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px;
}
.axpd .ax-rev-name{font-weight:700; font-size:13.5px;}
.axpd .ax-rev-date{font-size:11.5px; color:var(--slate);}
.axpd .ax-review-text{font-size:13.5px; color:#0f3b2c; line-height:1.65;}
.axpd .ax-review-imgs{display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;}
.axpd .ax-review-imgs img{width:64px; height:64px; border-radius:8px; object-fit:cover; border:1px solid var(--border);}
.axpd .ax-review-form-wrap{border:1px solid var(--border); border-radius:var(--radius); padding:18px; margin:14px 0; background:var(--white);}

/* related */
.axpd .ax-related-section{margin-top:44px; padding-top:8px;}
.axpd .ax-related-grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(210px, 1fr)); gap:20px;}
.axpd .ax-rp-card{display:flex; flex-direction:column;}
.axpd .ax-rp-media{
  position:relative; border-radius:16px; overflow:hidden;
  background:linear-gradient(180deg, #f6f6f7, #fff); margin-bottom:12px; cursor:pointer; display:block;
  aspect-ratio:1/1; border:1px solid var(--border);
}
.axpd .ax-rp-media img{
  width:100%; height:100%; display:block; object-fit:contain; padding:6px;
  transition:transform .5s ease;
}
.axpd .ax-rp-card:hover .ax-rp-media img{transform:scale(1.06);}
.axpd .ax-rp-tag{
  position:absolute; top:12px; left:12px; z-index:2;
  background:var(--sunshine); color:var(--green);
  font-size:10px; font-weight:800; letter-spacing:.03em;
  padding:5px 10px; border-radius: 8px; text-transform:uppercase;
}
.axpd .ax-rp-actions{
  position:absolute; right:12px; top:12px; z-index:2;
  display:flex; flex-direction:column; gap:8px;
  opacity:0; transform:translateX(6px); transition:all .25s ease;
}
.axpd .ax-rp-card:hover .ax-rp-actions{opacity:1; transform:translateX(0);}
.axpd .ax-rp-btn{
  width:34px; height:34px; border-radius: 8px; border:none;
  background:#fff; color:var(--ink);
  display:flex; align-items:center; justify-content:center; cursor:pointer;
  box-shadow:0 4px 10px rgba(0,0,0,0.12); transition:all .2s;
}
.axpd .ax-rp-btn:hover{background:var(--red); color:#fff;}
.axpd .ax-rp-btn.liked{background:var(--red); color:#fff;}
.axpd .ax-rp-btn svg{width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:2;}
.axpd .ax-rp-btn.liked svg{fill:currentColor;}
.axpd .ax-rp-chip{
  position:absolute; left:12px; bottom:12px; z-index:2;
  background:var(--green); color:#f7f6f2;
  font-size:12px; font-weight:700; padding:7px 14px; border-radius: 8px;
}
.axpd .ax-rp-info h4{
  font-size:15px; font-weight:600; margin-bottom:10px; line-height:1.4;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:2.6em;
}
.axpd .ax-rp-bottom{display:flex; align-items:center; justify-content:space-between; gap:8px;}
.axpd .ax-rp-price{font-weight:700; font-size:14px; color:var(--red); white-space:nowrap;}
.axpd .ax-rp-na{font-size:11.5px; font-weight:600; color:var(--slate);}
.axpd .ax-rp-old{font-size:11.5px; color:var(--slate); text-decoration:line-through; margin-left:6px; font-weight:600;}
.axpd .ax-rp-mini-actions{display:flex; gap:8px; flex-shrink:0;}
.axpd .ax-rp-mini-actions .ax-rp-btn{
  width:30px; height:30px; box-shadow:none; border:1px solid var(--border);
}

/* ===== premium offers card (under image) ===== */
.axpd .ax-offers-card{border:1px solid var(--border); border-radius:var(--radius); background:var(--white); box-shadow:var(--shadow-sm); overflow:hidden;}
.axpd .ax-oc-head{display:flex; align-items:center; justify-content:space-between; gap:10px; padding:13px 16px; border-bottom:1px solid var(--border); background:linear-gradient(120deg, #fff 20%, var(--red-tint) 130%);}
.axpd .ax-oc-title{font-weight:800; font-size:13.5px; display:flex; align-items:center; gap:8px; background-color: transparent;}
.axpd .ax-oc-title svg{width:16px; height:16px; color:var(--red);}
.axpd .ax-oc-tabs{display:flex; background:var(--off-white); border:1px solid var(--border); border-radius: 8px; padding:3px; flex-shrink:0;}
.axpd .ax-oc-tab{border:none; background:transparent; font-size:11px; font-weight:700; color:var(--slate); padding:5px 12px; border-radius: 8px; cursor:pointer; transition:all .2s; font-family:inherit;}
.axpd .ax-oc-tab.active{background:var(--ink); color:#fff;}
.axpd .ax-offers-list{padding:12px 14px; display:flex; flex-direction:column; gap:9px;}
.axpd .ax-offers-foot{padding:9px 14px; border-top:1px solid var(--border); font-size:10.5px; color:var(--slate); background:var(--off-white); text-align:center;}
.axpd .ax-bank-offer{border:1px solid var(--border); border-radius:10px; padding:11px 12px; position:relative; transition:all .2s;}
.axpd .ax-bank-offer:hover{box-shadow:var(--shadow-sm);}
.axpd .ax-bank-offer.applied{border-color:var(--green); background:var(--green-tint); box-shadow:0 0 0 1px var(--green) inset;}
.axpd .ax-bo-head{display:flex; justify-content:space-between; align-items:center; gap:8px;}
.axpd .ax-bo-bank{font-weight:800; font-size:12.5px; display:flex; align-items:center; gap:6px;}
.axpd .ax-bo-bank::before{content:''; width:8px; height:8px; border-radius:2px; background:linear-gradient(135deg, var(--green), var(--sage)); flex-shrink:0;}
.axpd .ax-bo-code{font-family:var(--font-display); font-size:10.5px; font-weight:700; color:var(--red); border:1px dashed var(--red); border-radius:6px; padding:2px 8px; cursor:pointer; letter-spacing:.04em; transition:all .2s; background:var(--white);}
.axpd .ax-bo-code:hover{background:var(--red); color:#fff;}
.axpd .ax-bo-offer{font-size:13px; font-weight:700; margin-top:7px;}
.axpd .ax-bo-offer span{color:var(--slate); font-weight:600; font-size:11.5px;}
.axpd .ax-bo-desc{font-size:11.5px; color:var(--slate); margin-top:2px; line-height:1.45;}
.axpd .ax-bo-actions{display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:9px;}
.axpd .ax-bo-save{font-size:11px; font-weight:700; color:#166534; background:#e8f7ee; border-radius:6px; padding:3px 8px; white-space:nowrap;}
.axpd .ax-bo-apply{border:none; background:var(--ink); color:#fff; font-size:11.5px; font-weight:700; border-radius:6px; padding:5px 14px; cursor:pointer; transition:all .2s; font-family:inherit;}
.axpd .ax-bo-apply:hover{background:var(--green-mid);}
.axpd .ax-bo-apply.applied{background:var(--green);}
.axpd .ax-cart-offer{padding:9px 12px; border:1px solid var(--border); border-radius:10px;}
.axpd .ax-co-row{display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:12px; font-weight:700; margin-bottom:8px;}
.axpd .ax-co-row b{font-family:var(--font-display); font-size:11px; color:var(--slate);}
.axpd .ax-co-row b.ok{color:var(--green);}
.axpd .ax-progress{height:6px; background:var(--border); border-radius: 8px; overflow:hidden;}
.axpd .ax-progress span{display:block; height:100%; background:linear-gradient(90deg, var(--green), var(--sage)); border-radius: 8px; transition:width .5s ease;}
.axpd .ax-co-note{font-size:11px; color:var(--slate); background:var(--off-white); border-radius:8px; padding:8px 10px; display:flex; gap:6px; align-items:flex-start; line-height:1.5;}
.axpd .ax-co-note svg{width:13px; height:13px; color:var(--red); flex-shrink:0; margin-top:1px;}

/* ===== trust & benefits ===== */
.axpd .ax-trust-card{border:1px solid var(--border); border-radius:var(--radius); background:var(--white); box-shadow:var(--shadow-sm); padding:14px 16px;}
.axpd .ax-trust-title{font-weight:800; font-size:13px; color:var(--ink); margin-bottom:12px;}
.axpd .ax-trust-grid{display:grid; grid-template-columns:1fr 1fr; gap:10px;}
.axpd .ax-trust-item{display:flex; align-items:center; gap:10px; min-width:0;}
.axpd .ax-trust-ic{
  width:34px; height:34px; border-radius:9px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
}
.axpd .ax-trust-ic svg{width:17px; height:17px;}
.axpd .ax-ti-green{background:#e8f7ee; color:#16a34a;}
.axpd .ax-ti-blue{background:var(--red-tint); color:var(--green);}
.axpd .ax-ti-purple{background:var(--green); color:var(--sunshine);}
.axpd .ax-ti-orange{background:rgba(223,232,180,.22); color:var(--green);}
.axpd .ax-trust-txt{min-width:0;}
.axpd .ax-trust-txt b{display:block; font-size:12px; font-weight:700; color:var(--ink); line-height:1.3;}
.axpd .ax-trust-txt span{display:block; font-size:10.5px; color:var(--slate); line-height:1.35; margin-top:1px;}

/* ===== need help ===== */
.axpd .ax-help-card{border:1px solid var(--border); border-radius:var(--radius); background:linear-gradient(120deg, #fff, var(--off-white)); box-shadow:var(--shadow-sm); padding:14px 16px; display:flex; flex-direction:column; gap:12px;}
.axpd .ax-help-head{display:flex; align-items:center; gap:10px;}
.axpd .ax-help-ic{
  width:38px; height:38px; border-radius: 8px; flex-shrink:0;
  background:var(--red-tint); color:var(--red); display:flex; align-items:center; justify-content:center;
}
.axpd .ax-help-ic svg{width:19px; height:19px;}
.axpd .ax-help-txt{min-width:0; background-color: transparent;}
.axpd .ax-help-txt b{display:block; font-size:12.5px; font-weight:700; color:var(--ink); line-height:1.3; background-color: transparent;}
.axpd .ax-help-txt span{display:block; font-size:11px; color:var(--slate); margin-top:1px; background-color: transparent;}
.axpd .ax-help-actions{display:flex; gap:10px;}
.axpd .ax-help-btn{
  flex:1; display:inline-flex; align-items:center; justify-content:center; gap:7px;
  font-size:12.5px; font-weight:700; padding:9px 12px; border-radius: 8px; cursor:pointer;
  transition:all .2s; text-decoration:none; white-space:nowrap;
}
.axpd .ax-help-btn svg{width:15px; height:15px; flex-shrink:0;}
.axpd .ax-help-call{background:var(--ink); color:#fff; border:1px solid var(--ink);}
.axpd .ax-help-call:hover{background:var(--green-mid);}
.axpd .ax-help-wa{background:#fff; color:#166534; border:1px solid #b9e6c8;}
.axpd .ax-help-wa:hover{background:#e8f7ee;}

/* ===== selected variation summary ===== */
.axpd .ax-variant-summary{display:flex; align-items:center; gap:14px; border:1px solid var(--border); border-radius:12px; padding:12px 14px; background:linear-gradient(120deg, #fff, var(--off-white));}
.axpd .ax-vs-img{width:58px; height:58px; border-radius:10px; border:1px solid var(--border); background:var(--white); display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;}
.axpd .ax-vs-img img{width:100%; height:100%; object-fit:cover;}
.axpd .ax-vs-title{font-weight:700; font-size:13px; line-height:1.35; background-color: transparent;}
.axpd .ax-vs-specs{font-size:12px; color:var(--slate); margin-top:2px; background-color: transparent;}
.axpd .ax-vs-price{display:flex; align-items:center; gap:8px; margin-top:5px; font-family:var(--font-display); font-weight:700; font-size:14px; background-color: transparent;}
.axpd .ax-vs-price .stock{font-size:10.5px; color:#166534; font-family:var(--font-ui); font-weight:700; text-transform:uppercase; letter-spacing:.05em; background:#e8f7ee; padding:2px 8px; border-radius: 8px;}
.axpd .ax-swatch-img{width:100%; height:100%; border-radius: 8px; object-fit:cover; border:1px solid rgba(0,0,0,.08); display:block;}

/* ===== total savings note ===== */
.axpd .ax-savings-note{margin-top:12px; font-size:12.5px; display:inline-flex; align-items:center; gap:7px; color:#166534; background:#e8f7ee; border:1px dashed rgba(22,101,52,.5); padding:9px 12px; border-radius:8px; font-weight:600;}
.axpd .ax-savings-note svg{width:14px; height:14px; flex-shrink:0;}
.axpd .ax-savings-note b{font-family:var(--font-display);}

/* ===== full-view lightbox ===== */
.axpd .ax-lightbox{position:fixed; inset:0; background:rgba(12,12,14,.93); z-index:400; display:flex; align-items:center; justify-content:center; animation:ax-fade-in .2s ease;}
.axpd .ax-lightbox img{max-width:86vw; max-height:82vh; object-fit:contain; border-radius:8px; box-shadow:0 30px 80px rgba(0,0,0,.5);}
.axpd .ax-lb-close,.axpd .ax-lb-prev,.axpd .ax-lb-next{position:absolute; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.22); color:#fff; width:44px; height:44px; border-radius: 8px; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; line-height:1;}
.axpd .ax-lb-close{top:22px; right:22px;}
.axpd .ax-lb-prev{left:22px; top:50%; transform:translateY(-50%);}
.axpd .ax-lb-next{right:22px; top:50%; transform:translateY(-50%);}
.axpd .ax-lb-close:hover,.axpd .ax-lb-prev:hover,.axpd .ax-lb-next:hover{background:var(--red); border-color:var(--red);}
.axpd .ax-lb-counter{position:absolute; bottom:24px; left:50%; transform:translateX(-50%); color:#fff; font-family:var(--font-display); font-size:13px; background:rgba(255,255,255,.12); padding:6px 16px; border-radius: 8px;}

/* sticky buy bar */
.axpd .ax-sticky-bar{
  position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--border);
  padding:12px 20px; display:flex; align-items:center; gap:14px; box-shadow:0 -8px 24px rgba(0,0,0,.08);
  transform:translateY(120%); transition:transform .35s ease; z-index:200;
}
.axpd .ax-sticky-bar.show{transform:translateY(0);}
.axpd .ax-sticky-bar .ax-sb-price{font-family:var(--font-display); font-weight:700; font-size:16px; flex-shrink:0;}
.axpd .ax-sticky-bar .ax-sb-old{font-size:11px; color:var(--slate); text-decoration:line-through; display:block;}
.axpd .ax-sticky-bar .ax-btn-primary{padding:12px 18px; font-size:13.5px;}

/* toast */
.axpd .ax-toast{
  position:fixed; top:24px; right:24px; background:var(--ink); color:#fff; padding:13px 20px;
  border-radius:10px; font-size:13.5px; font-weight:600; display:flex; align-items:center; gap:10px;
  transform:translateX(140%); transition:transform .4s cubic-bezier(.34,1.56,.64,1); z-index:300;
  box-shadow:var(--shadow-lg); max-width:360px;
}
.axpd .ax-toast.show{transform:translateX(0);}
.axpd .ax-toast svg{color:#5ee6a0; width:18px; height:18px; flex-shrink:0.}

/* notify modal */
.axpd .ax-notify-modal{
  position:fixed; inset:0; background:rgba(12,12,14,.7); z-index:350;
  display:flex; align-items:center; justify-content:center; padding:24px;
  animation:ax-fade-in .2s ease;
}
.axpd .ax-notify-content{
  background:var(--white); border-radius:var(--radius); padding:28px 24px; max-width:400px; width:100%;
  box-shadow:var(--shadow-lg); position:relative; animation:ax-scale-in .25s cubic-bezier(.34,1.56,.64,1);
}
@keyframes ax-scale-in{from{opacity:0; transform:scale(.95);} to{opacity:1; transform:scale(1);}}
.axpd .ax-notify-close{
  position:absolute; top:12px; right:12px; width:32px; height:32px; border-radius: 8px;
  background:var(--off-white); color:var(--slate); display:flex; align-items:center; justify-content:center;
  border:1px solid var(--border); cursor:pointer; transition:all .2s;
}
.axpd .ax-notify-close:hover{background:var(--red); border-color:var(--red); color:#fff;}
.axpd .ax-notify-icon{
  width:56px; height:56px; border-radius: 50%; background:var(--red-tint); color:var(--red);
  display:flex; align-items:center; justify-content:center; margin:0 auto 16px;
}
.axpd .ax-notify-content h2{
  font-family:var(--font-display); font-size:20px; font-weight:700; text-align:center; margin:0 0 8px;
}
.axpd .ax-notify-content > p{
  font-size:13.5px; color:var(--slate); text-align:center; margin:0 0 20px; line-height:1.5;
}
.axpd .ax-notify-content > p strong{color:var(--ink);}
.axpd .ax-notify-input{
  position:relative; margin-bottom:16px;
}
.axpd .ax-notify-input svg{
  position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--slate); width:18px; height:18px;
}
.axpd .ax-notify-input input{
  width:100%; padding:12px 14px 12px 44px; border:1px solid var(--border); border-radius: 10px;
  font-size:14px; font-family:var(--font-ui); color:var(--ink); background:var(--white);
  transition:border-color .2s, box-shadow .2s;
}
.axpd .ax-notify-input input:focus{outline:none; border-color:var(--red); box-shadow:0 0 0 3px var(--red-tint);}
.axpd .ax-notify-input input::placeholder{color:var(--gray-400);}
.axpd .ax-notify-submit{
  width:100%; padding:13px 16px; background:var(--red); color:#fff; font-weight:700; font-size:14px;
  border:none; border-radius: 10px; cursor:pointer; transition:background .2s, transform .1s;
}
.axpd .ax-notify-submit:hover:not(:disabled){background:var(--red-deep);}
.axpd .ax-notify-submit:active:not(:disabled){transform:scale(.98);}
.axpd .ax-notify-submit:disabled{opacity:.5; cursor:not-allowed;}
.axpd .ax-notify-note{
  font-size:11.5px; color:var(--gray-400); text-align:center; margin:16px 0 0; line-height:1.4;
}

@media (max-width: 900px){
  .axpd .ax-nav-inner{gap:10px; padding:0 14px;}
  .axpd .ax-nav-search{display:none;}
  .axpd .ax-nav-links{display:none;}
  .axpd .ax-nav-user .ax-nav-uname{display:none;}
  .axpd .ax-nav-auth{display:none;}
  .axpd .ax-nav-user{padding:4px 6px 4px 5px;}
  .axpd .ax-product-grid{grid-template-columns:1fr; gap:26px;}
  .axpd .ax-gallery-col{position:static; max-height:none; overflow:visible; gap:14px;}
  .axpd .ax-gallery{position:static; grid-template-columns:1fr;}
  .axpd .ax-thumb-rail{flex-direction:row; overflow-x:auto; order:2;}
  .axpd .ax-thumb{flex-shrink:0;}
  .axpd .ax-thumb.active::before{left:8px; top:-16px; bottom:auto; right:8px; width:auto; height:3px;}
  .axpd .ax-stage{order:1; height:clamp(300px, 45vh, 420px);}
  .axpd .ax-arrow{width:34px; height:34px;}
  .axpd .ax-arrow-prev{left:8px;}
  .axpd .ax-arrow-next{right:8px;}
  .axpd .ax-title{font-size:22px;}
  .axpd .ax-deal-price{font-size:28px;}
  .axpd .ax-review-summary{gap:20px;}
}
/* ===== You May Also Like - 4 Per Row Premium Grid ===== */
.axpd .ax-related-section {
  margin-top: 60px;
  padding-top: 40px;
  border-top: 1px solid var(--border);
}
.axpd .ax-related-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 28px; gap: 16px;
}
.axpd .ax-related-subtitle {
  font-size: 11px; font-weight: 800; letter-spacing: 0.14em;
  color: var(--green-mid); text-transform: uppercase; margin-bottom: 4px;
}
.axpd .ax-related-title {
  font-family:var(--font-display); font-size: 26px; font-weight: 700; color: var(--ink);
}
.axpd .ax-related-view-all {
  display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700;
  color: var(--red-deep); transition: gap 0.2s ease; text-decoration: none;
}
.axpd .ax-related-view-all:hover { gap: 10px; }
.axpd .ax-related-view-all svg { width: 15px; height: 15px; }

.axpd .ax-related-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
.axpd .ax-related-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 14px;
  transition: transform 0.3s cubic-bezier(0.2,0.7,0.3,1), box-shadow 0.3s ease, border-color 0.3s ease;
  display: flex; flex-direction: column; justify-content: space-between;
}
.axpd .ax-related-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 36px rgba(0,0,0,0.08);
  border-color: rgba(24,80,60,0.3);
}

/* Framed media with full auto-fit image without crop */
.axpd .ax-related-media {
  aspect-ratio: 1 / 1;
  width: 100%;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid var(--border);
  overflow: hidden;
  position: relative;
  display: grid; place-items: center;
  padding: 6%;
}
.axpd .ax-related-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  mix-blend-mode: multiply;
  border-radius: 8px;
  transition: transform 0.5s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.axpd .ax-related-card:hover .ax-related-media img {
  transform: scale(1.04);
}

.axpd .ax-related-disc-chip {
  position: absolute; top: 10px; left: 10px;
  background: var(--sunshine); color: var(--green);
  font-size: 10px; font-weight: 800; padding: 4px 8px;
  border-radius: 6px; letter-spacing: 0.04em; z-index: 2;
}

.axpd .ax-related-hover-actions {
  position: absolute; top: 10px; right: 10px;
  display: flex; flex-direction: column; gap: 6px;
  opacity: 0; transform: translateX(8px);
  transition: all 0.25s ease; z-index: 2;
}
.axpd .ax-related-card:hover .ax-related-hover-actions {
  opacity: 1; transform: translateX(0);
}
.axpd .ax-related-act-btn {
  width: 32px; height: 32px; border-radius: 8px;
  background: #ffffff; border: 1px solid var(--border);
  color: var(--ink); display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1); cursor: pointer;
  transition: background 0.2s, color 0.2s, transform 0.2s;
}
.axpd .ax-related-act-btn svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 1.8; }
.axpd .ax-related-act-btn:hover { background: var(--red); color: #fff; border-color: var(--red); transform: scale(1.08); }

.axpd .ax-related-info { margin-top: 14px; display: flex; flex-direction: column; gap: 6px; flex: 1; justify-content: space-between; }
.axpd .ax-related-meta { display: flex; align-items: center; justify-content: space-between; font-size: 11px; }
.axpd .ax-related-brand { font-weight: 700; color: var(--slate); text-transform: uppercase; letter-spacing: 0.04em; }
.axpd .ax-related-rating { display: flex; align-items: center; gap: 3px; font-weight: 700; color: #b08d57; }
.axpd .ax-related-rating svg { width: 12px; height: 12px; }

.axpd .ax-related-name {
  font-family:var(--font-ui); font-size: 14.5px; font-weight: 600; color: var(--ink);
  line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  transition: color 0.2s ease; margin: 2px 0;
}
.axpd .ax-related-card:hover .ax-related-name { color: var(--red); }

.axpd .ax-related-bottom { display: flex; align-items: center; justify-content: flex-end; margin-top: 8px; }
.axpd .ax-related-price-box { display: flex; align-items: baseline; gap: 6px; }
.axpd .ax-related-price { font-family:var(--font-display); font-size: 15px; font-weight: 700; color: var(--ink); }
.axpd .ax-related-old-price { font-family:var(--font-display); font-size: 12px; color: var(--slate); text-decoration: line-through; }

.axpd .ax-related-add-btn {
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--red-tint); color: var(--red-deep); border: 1px solid rgba(24,80,60,0.2);
  padding: 6px 14px; border-radius: 8px; font-size: 11.5px; font-weight: 700;
  cursor: pointer; transition: all 0.2s ease;
}
.axpd .ax-related-add-btn svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; }
.axpd .ax-related-add-btn:hover { background: var(--sunshine); color: var(--green); border-color: var(--sunshine); }

@media (max-width: 1024px) {
  .axpd .ax-related-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
}
@media (max-width: 640px) {
  .axpd .ax-related-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .axpd .ax-related-title { font-size: 20px; }
}
@media (min-width: 901px){
  .axpd .ax-sticky-bar{display:none;}
}
`

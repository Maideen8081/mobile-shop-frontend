import { Component, useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiShoppingCart, FiHeart, FiCheck, FiChevronRight,
  FiStar, FiRefreshCw, FiMinus, FiPlus,
  FiCpu, FiMonitor, FiBattery,
  FiHardDrive, FiAlertTriangle, FiCheckCircle,
  FiShare2, FiArrowLeft,
  FiClock, FiTruck, FiShield, FiGrid, FiZap,
  FiWifi, FiBluetooth, FiSmartphone, FiEye,
  FiSliders, FiAward,
  FiExternalLink, FiInfo, FiTrash2
} from 'react-icons/fi'
import { FaWhatsapp, FaTelegram, FaFacebook, FaEnvelope } from 'react-icons/fa'
import { productService } from '../services/productService'
import { authService } from '../services/authService'
import StorefrontNavbar from '../components/ecommerce/StorefrontNavbar'
import EcommerceFooter from '../components/ecommerce/Footer'

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="product-light min-h-screen bg-surface flex items-center justify-center p-6">
          <div className="bg-white backdrop-blur-[30px] rounded-[24px] p-10 border border-gray-200/60 max-w-md mx-auto text-center shadow-sm">
            <span className="text-5xl mb-4 block">⚠️</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-6">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-gray-100 text-gray-900 rounded-full text-sm font-semibold transition-all hover:bg-gray-200 border border-gray-200/60">
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 480%22 fill=%22%23111827%22%3E%3Crect width=%22400%22 height=%22480%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2218%22 fill=%22%2300FF88%22%3EProduct%3C/text%3E%3C/svg%3E'

function resolveImage(raw: string): string {
  if (!raw) return ''
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  return `${API_BASE_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`
}

function formatPrice(n: number): string {
  return '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function extractImages(raw: any): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.map((i: any) => {
      if (typeof i === 'string') return resolveImage(i)
      if (typeof i === 'object') return resolveImage(i.image || i.url || i.src || '')
      return ''
    }).filter(Boolean)
  }
  return []
}

function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; id: number } | null>(null)
  const idRef = useRef(0)
  const show = (message: string, type: 'success' | 'error') => {
    const id = ++idRef.current
    setToast({ message, type, id })
    setTimeout(() => setToast(prev => prev?.id === id ? null : prev), 2500)
  }
  return { toast, show }
}

function Toast({ toast }: { toast: { message: string; type: 'success' | 'error'; id: number } | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 40, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="fixed bottom-32 left-1/2 z-[200] flex items-center gap-2.5 px-5 py-3 rounded-full shadow-2xl"
          style={{
            background: toast.type === 'success' ? 'linear-gradient(135deg, #4FE3C1, #00FF88)' : 'linear-gradient(135deg, #EF4444, #DC2626)',
            color: toast.type === 'success' ? '#111c2d' : 'white',
          }}
        >
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ProductSkeleton() {
  return (
    <div className="product-light min-h-screen bg-surface">
      <div className="h-24" />
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="h-4 w-24 rounded-full bg-gray-200/70 animate-pulse" />
            <div className="h-12 w-2/3 rounded-lg bg-white/50 animate-pulse" />
            <div className="h-8 w-1/2 rounded-lg bg-white/50 animate-pulse" />
            <div className="h-4 w-full rounded bg-white/50 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-white/50 animate-pulse" />
            <div className="flex gap-3 mt-8">
              <div className="h-14 w-40 rounded-full bg-white/50 animate-pulse" />
              <div className="h-14 w-40 rounded-full bg-white/50 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-[400px] h-[500px] rounded-[32px] bg-white/50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

const COLOR_PALETTE: Record<string, string> = {
  black: '#1a1a1a', white: '#f0f0f0', silver: '#c0c0c0',
  gray: '#808080', 'titanium gray': '#6b7280', 'titanium black': '#374151',
  'titanium violet': '#8b5cf6', 'natural titanium': '#d4c5a9',
  'blue titanium': '#2563eb', 'white titanium': '#e5e7eb',
  'flowy emerald': '#10b981', 'silky black': '#111827',
  green: '#22c55e', midnight: '#1e293b', starlight: '#faf5eb',
  rose: '#e11d48', gold: '#f59e0b', graphite: '#4b5563',
  sierra: '#9ca3af', 'deep purple': '#7c3aed', red: '#ef4444',
}

function ProductDetailContent() {
  const navigate = useNavigate()
  const { productId, variationId, variantId, id } = useParams()
  const resolvedId = productId || id
  const resolvedVariantId = variationId || variantId

  const [apiProduct, setApiProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [, setCartError] = useState('')
  const { toast, show: showToast } = useToast()
  const [wishlist, setWishlist] = useState<Set<number>>(() => {
    try { const stored = JSON.parse(localStorage.getItem('wishlist') || '[]'); return new Set<number>(stored.map((item: any) => typeof item === 'number' ? item : item.id)) }
    catch { return new Set<number>() }
  })
  const [selectedColorIdx, setSelectedColorIdx] = useState(0)
  const [selectedStorageIdx, setSelectedStorageIdx] = useState(0)
  const [selectedRamIdx, setSelectedRamIdx] = useState(0)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [activeSpecTab, setActiveSpecTab] = useState('performance')
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [imageZoomed, setImageZoomed] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [, setCopied] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const imageRef = useRef<HTMLDivElement>(null)
  const shareRef = useRef<HTMLDivElement>(null)

  const product = useMemo(() => apiProduct || {}, [apiProduct])

  useEffect(() => {
    if (!resolvedId) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setFetchError('')
    productService.getById(Number(resolvedId))
      .then((res) => { if (!cancelled) setApiProduct(res) })
      .catch((err) => { if (!cancelled) setFetchError(err?.message || 'Failed to load product') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [resolvedId])

  useEffect(() => {
    if (!apiProduct?.id) return
    const cat = apiProduct.category
    const catName = typeof cat === 'object' && cat !== null ? (cat as any).name : String(cat || '')
    if (!catName) return
    productService.list({ category: catName, page_size: 5 })
      .then((res) => {
        const filtered = (res || []).filter((p: any) => p.id !== apiProduct.id)
        setRelatedProducts(filtered.slice(0, 4))
      })
      .catch(() => {})
  }, [apiProduct])

  const { colors, storageOptions, ramOptions, variants } = useMemo(() => {
    if (apiProduct?.variants?.length > 0) {
      const cols = [...new Set(apiProduct.variants.map((v: any) => v.color).filter(Boolean))] as string[]
      const store = [...new Set(apiProduct.variants.map((v: any) => v.storage).filter(Boolean))] as string[]
      const ram = [...new Set(apiProduct.variants.map((v: any) => v.ram).filter(Boolean))] as string[]
      return { colors: cols, storageOptions: store, ramOptions: ram, variants: apiProduct.variants }
    }
    return { colors: (product?.colors || []) as string[], storageOptions: (product?.storage || []) as string[], ramOptions: (product?.ram || []) as string[], variants: [] as any[] }
  }, [apiProduct, product])

  useEffect(() => { if (resolvedVariantId) setSelectedVariantId(resolvedVariantId) }, [resolvedVariantId])

  const activeVariant = useMemo(() => {
    if (variants.length > 0) {
      if (selectedVariantId) return variants.find((v: any) => String(v.id) === selectedVariantId) || variants[0]
      const match = variants.find((v: any) => {
        const colorMatch = !colors.length || !v.color || v.color === colors[selectedColorIdx]
        const storageMatch = !storageOptions.length || !v.storage || v.storage === storageOptions[selectedStorageIdx]
        const ramMatch = !ramOptions.length || !v.ram || v.ram === ramOptions[selectedRamIdx]
        return colorMatch && storageMatch && ramMatch
      })
      return match || variants[0]
    }
    return null
  }, [variants, selectedVariantId, selectedColorIdx, selectedStorageIdx, selectedRamIdx, colors, storageOptions, ramOptions])

  const isVariantView = variants.length === 0 || selectedVariantId !== null || !!resolvedVariantId

  useEffect(() => { setSelectedImage(0) }, [activeVariant?.id])
  useEffect(() => { if (qty < 1) setQty(1); setCartError('') }, [activeVariant?.id])

  const images = useMemo(() => {
    if (activeVariant?.images?.length > 0) return extractImages(activeVariant.images)
    if (apiProduct?.images?.length > 0) return extractImages(apiProduct.images)
    return []
  }, [activeVariant, apiProduct])

  const currentPrice = activeVariant?.discountPrice || activeVariant?.price || product?.price || 0
  const oldPriceVal = activeVariant?.price && activeVariant.discountPrice ? activeVariant.price : (product?.oldPrice || 0)
  const inStock = activeVariant ? activeVariant.stock > 0 : (product?.inStock ?? true)
  const stockQty = activeVariant?.stock ?? product?.stock ?? 99
  const discount = oldPriceVal > currentPrice ? Math.round((1 - currentPrice / oldPriceVal) * 100) : 0
  const description = apiProduct?.description || product?.description || ''
  const productName = product?.name || product?.product_name || 'Product'
  const productBrand = product?.brand || ''
  const categoryName = product?.category || ''
  const variantName = activeVariant?.name || ''
  const youSave = oldPriceVal > currentPrice ? oldPriceVal - currentPrice : 0

  const isInCart = useMemo(() => {
    if (!product?.id) return false
    try {
      const c = JSON.parse(localStorage.getItem('cart') || '[]')
      return c.some((i: any) => i.productId === product.id && i.variantId === (activeVariant?.id || null))
    } catch { return false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, activeVariant?.id, added])
  const features = product?.features || []

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

  const handleAddToCart = () => {
    if (isAdding) return
    if (!authService.isAuthenticated()) { sessionStorage.setItem('redirect_after_login', window.location.pathname + window.location.search); navigate('/login'); return }
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
      showToast('Removed from cart!', 'error')
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

  const handleBuyNow = () => {
    if (isAdding) return
    if (!authService.isAuthenticated()) { sessionStorage.setItem('redirect_after_login', window.location.pathname + window.location.search); navigate('/login'); return }
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
    navigate('/checkout/address')
  }

  const toggleWishlist = (id: number) => {
    if (!authService.isAuthenticated()) { sessionStorage.setItem('redirect_after_login', window.location.pathname + window.location.search); navigate('/login'); return }
    setWishlist((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); localStorage.setItem('wishlist', JSON.stringify(Array.from(next))); window.dispatchEvent(new Event('wishlist-updated')); return next })
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: productName, text: `Check out ${productName} by ${productBrand}`, url })
      } catch { return }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        showToast('Link copied to clipboard!', 'success')
        setTimeout(() => setCopied(false), 2000)
      } catch {
        showToast('Failed to copy link', 'error')
      }
    }
    setShareOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePos({ x: x - 0.5, y: y - 0.5 })
  }, [])

  const getColorSwatch = (c: string) => COLOR_PALETTE[c.toLowerCase().trim()] || '#ccc'

  const SPEC_TABS = [
    { id: 'performance', label: 'Performance', icon: 'Zap' },
    { id: 'display', label: 'Display', icon: 'Monitor' },
    { id: 'battery', label: 'Battery', icon: 'Battery' },
    { id: 'connectivity', label: 'Connectivity', icon: 'Wifi' },
  ]

  const getSpecData = (tabId: string) => {
    const src = activeVariant || product || {}
    switch (tabId) {
      case 'performance': return [
        { label: 'Processor', value: src.processor || 'Exynos W1000', key: 'processor' },
        { label: 'RAM', value: src.ram || '4GB LPDDR5', key: 'ram' },
        { label: 'GPU', value: src.gpu || 'Adreno 730', key: 'gpu' },
        { label: 'OS', value: src.os || 'WatchOS 14', key: 'os' },
      ]
      case 'display': return [
        { label: 'Size', value: src.screenSize || '1.5 inches', key: 'size' },
        { label: 'Resolution', value: src.resolution || '480 x 480', key: 'resolution' },
        { label: 'Refresh Rate', value: src.refreshRate || '60 Hz', key: 'refresh rate' },
        { label: 'Brightness', value: src.brightness || '2000 nits', key: 'brightness' },
      ]
      case 'battery': return [
        { label: 'Capacity', value: src.battery ? `${src.battery} mAh` : '500 mAh', key: 'capacity' },
        { label: 'Charging', value: src.charging || '15W Fast', key: 'charging' },
        { label: 'Wireless', value: src.wireless || '10W', key: 'wireless' },
        { label: 'Standby', value: src.standby || '72 hours', key: 'standby' },
      ]
      case 'connectivity': return [
        { label: 'Network', value: src.network || '4G LTE', key: 'network' },
        { label: 'Bluetooth', value: src.bluetooth || '5.3', key: 'bluetooth' },
        { label: 'WiFi', value: src.wifi || 'WiFi 6', key: 'wifi' },
        { label: 'NFC', value: src.nfc || 'Yes', key: 'nfc' },
      ]
      default: return []
    }
  }

  if (loading) return <ProductSkeleton />

  if (fetchError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="bg-white/50 backdrop-blur-[30px] rounded-[24px] p-10 border border-gray-200/60 flex flex-col items-center max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-xl bg-red-500/10 flex items-center justify-center mb-6">
            <FiAlertTriangle size={28} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to load product</h2>
          <p className="text-sm text-gray-500 mb-6">{fetchError}</p>
          <div className="flex gap-3">
            <button onClick={() => window.location.reload()} className="px-8 py-3 rounded-full bg-gray-100 text-gray-900 text-sm font-semibold transition-all hover:bg-gray-200 border border-gray-200/60 flex items-center gap-2">
              <FiRefreshCw size={14} /> Try Again
            </button>
            <Link to="/collection/all" className="px-8 py-3 rounded-full bg-gray-100 border border-gray-200/60 text-gray-900 text-sm font-semibold transition-all hover:bg-gray-200 flex items-center gap-2">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!apiProduct) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="bg-white/50 backdrop-blur-[30px] rounded-[24px] p-10 border border-gray-200/60 flex flex-col items-center max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6">
            <FiInfo size={28} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">This product does not exist or has been removed.</p>
          <Link to="/collection/all" className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gray-100 text-gray-900 text-sm font-semibold transition-all hover:bg-gray-200 border border-gray-200/60">
            <FiChevronRight size={14} /> Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
     <div className="product-light min-h-screen bg-surface text-on-surface font-sans selection:bg-[#4FE3C1]/30 overflow-x-hidden">
      <style>{`
        @keyframes floatAnim { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes floatSlow { 0%, 100% { transform: translateY(0px) translateX(0px); } 50% { transform: translateY(-6px) translateX(3px); } }
        @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 20px rgba(79,227,193,0.3); } 50% { box-shadow: 0 0 40px rgba(79,227,193,0.6); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes borderGlow { 0%, 100% { border-color: rgba(79,227,193,0.2); } 50% { border-color: rgba(79,227,193,0.6); } }
        .animate-float { animation: floatAnim 6s ease-in-out infinite; }
        .animate-float-slow { animation: floatSlow 8s ease-in-out infinite; }
        .animate-glow { animation: glowPulse 3s ease-in-out infinite; }
        .animate-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
        .animate-scale-in { animation: scaleIn 0.4s ease-out; }
        .animate-border-glow { animation: borderGlow 2s ease-in-out infinite; }
        .glass-premium { background: rgba(255,255,255,0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 8px 32px rgba(31,38,135,0.08); }
        .glass-premium-dark { background: rgba(255,255,255,0.4); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.2); }
        .text-gradient { background: linear-gradient(135deg, #4FE3C1, #00FF88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .text-gradient-cyan { background: linear-gradient(135deg, #4FE3C1, #60f0ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .spec-card-glow:hover { box-shadow: 0 0 30px rgba(79,227,193,0.15), 0 0 60px rgba(79,227,193,0.05); }
        .spec-card { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .spec-card:hover { transform: translateY(-4px) scale(1.02); }
      `}</style>

      <StorefrontNavbar activeLabel="Products" brand="PhoneFix" />

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="fixed top-24 left-4 md:left-8 z-50 w-10 h-10 rounded-full bg-white/70 backdrop-blur-[10px] border border-gray-200/60 flex items-center justify-center text-gray-700 hover:bg-white/90 hover:text-gray-900 transition-all shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FiArrowLeft size={18} />
      </motion.button>

      {/* === HERO SECTION - Premium Luxury Gallery Layout === */}
      <section className="relative pt-28 md:pt-32 pb-12 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#4FE3C1]/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#00FF88]/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full">
          {/* Breadcrumb - Top Left */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 text-xs text-outline/60 font-medium flex-wrap mb-4"
          >
            <Link to="/" className="hover:text-[#4FE3C1] transition-colors">Home</Link>
            <span>/</span>
            {categoryName && (
              <>
                <Link to={`/collection/${categoryName.toLowerCase()}`} className="hover:text-[#4FE3C1] transition-colors">{categoryName}</Link>
                <span>/</span>
              </>
            )}
            <span className="text-on-surface/50 truncate">{variantName || productName}</span>
          </motion.div>

          <div className="grid lg:grid-cols-[55%_45%] gap-6 lg:gap-12 items-start">
            
            {/* ===== LEFT: Image Gallery (55%) ===== */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex gap-3 lg:gap-4">
                {/* Vertical Thumbnails (Desktop) */}
                {images.length > 1 && (
                  <div className="hidden lg:flex flex-col gap-2 overflow-y-auto max-h-[600px] scrollbar-hide pr-1">
                    {images.map((img, idx) => (
                      <motion.button
                        key={idx}
                        onMouseEnter={() => setSelectedImage(idx)}
                        onClick={() => setSelectedImage(idx)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-200 ${
                          idx === selectedImage
                            ? 'border-[#4FE3C1] ring-2 ring-[#4FE3C1]/30 shadow-md'
                            : 'border-gray-200/60 hover:border-[#4FE3C1]/40 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Main Image Container */}
                <div className="flex-1 relative">
                  {/* Main Image with Zoom */}
                  <div
                    ref={imageRef}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setImageZoomed(true)}
                    onMouseLeave={() => { setImageZoomed(false); setMousePos({ x: 0, y: 0 }) }}
                    className="relative group cursor-crosshair"
                  >
                    <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden bg-white/5 border border-gray-100/50">
                      <div className="aspect-square lg:aspect-[4/5] flex items-center justify-center p-6 md:p-10">
                        <AnimatePresence mode="wait">
                          <motion.img
                            key={selectedImage}
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.08 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            src={images[selectedImage] || FALLBACK_IMG}
                            alt={productName}
                            className="w-full h-full object-contain drop-shadow-xl"
                            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
                          />
                        </AnimatePresence>
                      </div>

                      {/* Amazon-style Zoom Preview (Desktop) */}
                      {imageZoomed && images[selectedImage] && (
                        <div
                          className="absolute top-0 left-full ml-4 w-[140%] h-full rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-white z-50 hidden lg:block"
                          style={{ aspectRatio: '1/1' }}
                        >
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundImage: `url(${images[selectedImage]})`,
                              backgroundSize: '250%',
                              backgroundPosition: `${50 + mousePos.x * 100}% ${50 + mousePos.y * 100}%`,
                              backgroundRepeat: 'no-repeat',
                            }}
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-[4px] rounded text-[9px] font-bold text-white uppercase tracking-wider">
                            Zoom
                          </div>
                        </div>
                      )}

                      {/* Gradient overlay edges */}
                      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-surface/20 to-transparent pointer-events-none" />
                      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface/20 to-transparent pointer-events-none" />

                      {/* Product Badges - Top Left */}
                      <div className="absolute top-3 left-3 lg:top-4 lg:left-4 flex flex-col gap-1.5 z-10">
                        {discount > 0 && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase shadow-lg"
                            style={{
                              background: 'linear-gradient(135deg, #FF6B6B, #EE5A24)',
                              color: 'white',
                              boxShadow: '0 4px 15px rgba(255,107,107,0.4)',
                            }}
                          >
                            {discount}% OFF
                          </span>
                        )}
                        {features.includes('New') || !!(product as any).is_new_arrival ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase shadow-lg"
                            style={{
                              background: 'linear-gradient(135deg, #4FE3C1, #00FF88)',
                              color: '#00391c',
                              boxShadow: '0 4px 15px rgba(79,227,193,0.3)',
                            }}
                          >
                            New Arrival
                          </span>
                        ) : null}
                        {(product as any).is_best_selling && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase shadow-lg"
                            style={{
                              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                              color: 'white',
                              boxShadow: '0 4px 15px rgba(124,58,237,0.3)',
                            }}
                          >
                            Bestseller
                          </span>
                        )}
                      </div>

                      {/* Wishlist Icon - Top Right */}
                      <button
                        onClick={(e) => { e.stopPropagation(); if (product?.id) toggleWishlist(product.id) }}
                        className="absolute top-3 right-3 lg:top-4 lg:right-4 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-[4px] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      >
                        <FiHeart
                          size={18}
                          className={product?.id && wishlist.has(product.id) ? 'text-red-500' : 'text-gray-600'}
                          fill={product?.id && wishlist.has(product.id) ? 'currentColor' : 'none'}
                        />
                      </button>

                      {/* Image Counter - Bottom Right */}
                      {images.length > 1 && (
                        <div className="absolute bottom-3 right-3 lg:bottom-4 lg:right-4 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-[4px] text-white text-[11px] font-bold z-10">
                          {selectedImage + 1} / {images.length}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Horizontal Thumbnails */}
                  {images.length > 1 && (
                    <div className="flex lg:hidden gap-2 mt-4 justify-center overflow-x-auto scrollbar-hide px-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-200 ${
                            idx === selectedImage
                              ? 'border-[#4FE3C1] ring-2 ring-[#4FE3C1]/30 shadow-md'
                              : 'border-gray-200/60 opacity-60'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Mobile Pagination Dots */}
                  {images.length > 1 && (
                    <div className="flex lg:hidden justify-center gap-1.5 mt-3">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === selectedImage ? 'w-6 bg-[#4FE3C1]' : 'w-1.5 bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Color swatches below gallery */}
                  {colors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="flex items-center justify-center gap-3 mt-5"
                    >
                      <span className="text-xs font-medium text-outline/60">Available in</span>
                      <div className="flex gap-2">
                        {colors.map((c, i) => (
                          <button key={c}
                            onClick={() => { setSelectedColorIdx(i); setSelectedVariantId(null) }}
                            className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                              i === selectedColorIdx ? 'border-[#4FE3C1] scale-110 shadow-md shadow-[#4FE3C1]/30' : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: getColorSwatch(c) }}
                            title={c}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ===== RIGHT: Product Information (45%) ===== */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-5 lg:gap-6"
            >
              {/* Product Hierarchy */}
              {variantName && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#4FE3C1]">{productName}</span>
                  <span className="mx-2 text-[10px] text-outline/40">|</span>
                  <span className="text-[11px] text-outline/60 font-medium">Parent Product</span>
                </motion.div>
              )}

              {/* Variant Name (Primary) */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight"
              >
                {variantName || productName}
              </motion.h1>

              {/* Brand + SKU + Availability Row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
              >
                {productBrand && (
                  <span className="text-sm font-bold uppercase tracking-[0.15em] text-outline">{productBrand}</span>
                )}
                {(product as any).sku && (
                  <span className="text-[11px] text-outline/50 font-mono">SKU: {(product as any).sku}</span>
                )}
                <span className={`flex items-center gap-1.5 text-xs font-bold ${
                  inStock ? 'text-green-600' : 'text-red-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                  {inStock ? (stockQty > 5 ? 'In Stock' : `Only ${stockQty} left`) : 'Out of Stock'}
                </span>
              </motion.div>

              {/* Rating */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar key={star} size={15} fill={star <= 4 ? 'currentColor' : 'none'} className={star <= 4 ? '' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="text-xs font-bold text-outline">4.0</span>
                <span className="text-xs text-outline/50">(128 Reviews)</span>
              </motion.div>

              {/* Divider */}
              <div className="w-full h-px bg-gray-200/70" />

              {/* Pricing Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-baseline gap-3"
              >
                <span className="text-3xl lg:text-4xl font-black tracking-tight">{formatPrice(currentPrice)}</span>
                {oldPriceVal > currentPrice && (
                  <>
                    <span className="text-lg text-outline line-through">{formatPrice(oldPriceVal)}</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#00FF88]/15 text-[#00FF88] text-xs font-extrabold tracking-wide">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </motion.div>

              {/* You Save */}
              {youSave > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="text-xs font-medium text-green-600"
                >
                  You save <span className="font-bold">{formatPrice(youSave)}</span>
                </motion.p>
              )}

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="text-sm md:text-base text-outline leading-relaxed"
              >
                {description || `Experience the pinnacle of wearable technology. Precision engineering meets intelligence in a design built for the future.`}
              </motion.p>

              {/* Variant Selector - Storage */}
              {storageOptions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-outline/70 mb-2">Storage</p>
                  <div className="flex gap-2 flex-wrap">
                    {storageOptions.map((s, i) => (
                      <button
                        key={s}
                        onClick={() => { setSelectedStorageIdx(i); setSelectedVariantId(null) }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                          i === selectedStorageIdx
                            ? 'border-[#4FE3C1] bg-[#4FE3C1]/10 text-[#4FE3C1] shadow-sm'
                            : 'border-gray-200 text-outline hover:border-gray-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Variant Selector - Color */}
              {colors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-outline/70 mb-2">Color — <span className="text-on-surface capitalize">{colors[selectedColorIdx]}</span></p>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((c, i) => (
                      <button
                        key={c}
                        onClick={() => { setSelectedColorIdx(i); setSelectedVariantId(null) }}
                        className={`w-9 h-9 rounded-full border-2 transition-all duration-200 ${
                          i === selectedColorIdx
                            ? 'border-[#4FE3C1] ring-2 ring-[#4FE3C1]/30 scale-110 shadow-md'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: getColorSwatch(c) }}
                        title={c}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quantity + CTA Buttons Row */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-gray-100 rounded-xl px-1 py-1">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                    >
                      <FiMinus size={15} />
                    </button>
                    <motion.span
                      key={qty}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-10 text-center font-bold text-sm"
                    >
                      {qty}
                    </motion.span>
                    <button
                      onClick={() => { if (qty < stockQty) setQty(qty + 1) }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                    >
                      <FiPlus size={15} />
                    </button>
                  </div>

                  {/* CTA Buttons */}
                  {isVariantView ? (
                    <div className="flex gap-2 flex-1 min-w-[200px]">
                      <motion.button
                        onClick={handleAddToCart}
                        disabled={!inStock || isAdding}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex-1 relative overflow-hidden px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${
                          !inStock || isAdding ? 'opacity-50 cursor-not-allowed bg-gray-300' : isInCart ? 'bg-red-50 text-red-600 border-2 border-red-200' : 'text-white shadow-[#4FE3C1]/25'
                        }`}
                        style={inStock && !isAdding && !isInCart ? { background: 'linear-gradient(135deg, #4FE3C1, #454747)' } : undefined}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isAdding ? <><FiRefreshCw size={16} className="animate-spin" /> Adding...</> : isInCart ? <><FiTrash2 size={16} /> Remove from Cart</> : <><FiShoppingCart size={16} /> Add to Cart</>}
                        </span>
                        {inStock && !isAdding && !isInCart && <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />}
                      </motion.button>
                      <motion.button
                        onClick={handleBuyNow}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-6 py-3 rounded-xl font-bold text-sm shadow-lg text-white"
                        style={{ background: 'linear-gradient(135deg, #4FE3C1, #454747)' }}
                      >
                        <span className="flex items-center justify-center gap-2"><FiZap size={16} /> Buy Now</span>
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      onClick={() => document.getElementById('variants')?.scrollIntoView({ behavior: 'smooth' })}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-8 py-3 rounded-xl font-bold text-sm shadow-lg text-white flex items-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #4FE3C1, #454747)' }}
                    >
                      <FiGrid size={16} /> Compare Variants
                    </motion.button>
                  )}
                </div>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap items-center gap-5 pt-2 text-xs text-outline/60 border-t border-gray-100"
              >
                <span className="flex items-center gap-1.5"><FiTruck size={14} /> Free Delivery</span>
                <span className="flex items-center gap-1.5"><FiShield size={14} /> 1 Year Warranty</span>
                <span className="flex items-center gap-1.5"><FiRefreshCw size={14} /> 7 Day Return</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === COMPARE VARIANTS SECTION === */}
      {variants.length > 0 && (
        <section id="variants" className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              className="mb-10"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#4FE3C1] mb-2 block">Variants</span>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Compare Configurations</h2>
                  <p className="text-outline mt-2">Choose the perfect configuration for your lifestyle.</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {storageOptions.length > 0 && (
                    <div className="glass-premium px-3 py-1.5 rounded-full flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Storage</span>
                      <div className="flex gap-1">
                        {storageOptions.map((s, i) => (
                          <button key={s} onClick={() => { setSelectedStorageIdx(i); setSelectedVariantId(null) }}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                              i === selectedStorageIdx ? 'bg-[#4FE3C1] text-white' : 'bg-gray-100 text-outline hover:bg-gray-200'
                            }`}
                          >{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {colors.length > 0 && (
                    <div className="glass-premium px-3 py-1.5 rounded-full flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Color</span>
                      <div className="flex gap-1.5">
                        {colors.map((c, i) => (
                          <button key={c} onClick={() => { setSelectedColorIdx(i); setSelectedVariantId(null) }}
                            className={`w-5 h-5 rounded-full border-2 transition-all ${
                              i === selectedColorIdx ? 'border-[#4FE3C1] scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: getColorSwatch(c) }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {ramOptions.length > 0 && (
                    <div className="glass-premium px-3 py-1.5 rounded-full flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline">RAM</span>
                      <div className="flex gap-1">
                        {ramOptions.map((r, i) => (
                          <button key={r} onClick={() => { setSelectedRamIdx(i); setSelectedVariantId(null) }}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                              i === selectedRamIdx ? 'bg-[#4FE3C1] text-white' : 'bg-gray-100 text-outline hover:bg-gray-200'
                            }`}
                          >{r}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {variants.map((v: any, idx: number) => {
                const vImages = extractImages(v.images || [])
                const vPrice = v.discountPrice || v.price || 0
                const vOldPrice = v.price && v.discountPrice ? v.price : 0
                const vInStock = v.stock > 0
                const isActive = String(v.id) === String(selectedVariantId)
                const vDiscount = vOldPrice > vPrice ? Math.round((1 - vPrice / vOldPrice) * 100) : 0
                return (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    whileHover={{ y: -6 }}
                    className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 ${
                      isActive
                        ? 'ring-2 ring-[#4FE3C1] shadow-xl shadow-[#4FE3C1]/10 animate-border-glow'
                        : 'glass-premium hover:shadow-lg hover:border-[#4FE3C1]/30'
                    }`}
                    style={{
                      background: isActive ? 'linear-gradient(135deg, rgba(79,227,193,0.05), rgba(0,255,136,0.05))' : '',
                      border: isActive ? '2px solid rgba(79,227,193,0.4)' : '1px solid rgba(255,255,255,0.3)',
                    }}
                    onClick={() => {
                      setSelectedVariantId(String(v.id))
                      setSelectedColorIdx(colors.indexOf(v.color) > -1 ? colors.indexOf(v.color) : 0)
                      setSelectedStorageIdx(storageOptions.indexOf(v.storage) > -1 ? storageOptions.indexOf(v.storage) : 0)
                      setSelectedRamIdx(ramOptions.indexOf(v.ram) > -1 ? ramOptions.indexOf(v.ram) : 0)
                    }}
                  >
                    {isActive && (
                      <div className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #4FE3C1, #454747)' }}>
                        <FiCheck size={14} className="text-white" />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="h-44 mb-5 rounded-2xl bg-white/30 flex items-center justify-center overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.img
                            key={v.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            src={vImages[0] || FALLBACK_IMG}
                            alt=""
                            className="w-full h-full object-contain p-4 hover:scale-110 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
                          />
                        </AnimatePresence>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-bold">{v.name || `${v.storage || ''} ${v.color || ''}`}</h3>
                        <div className="flex flex-wrap gap-2">
                          {v.storage && (
                            <span className="px-2.5 py-1 rounded-lg bg-[#4FE3C1]/10 text-[#4FE3C1] text-[10px] font-bold flex items-center gap-1">
                              <FiHardDrive size={10} /> {v.storage}
                            </span>
                          )}
                          {v.ram && (
                            <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-600 text-[10px] font-bold flex items-center gap-1">
                              <FiCpu size={10} /> {v.ram}
                            </span>
                          )}
                          {v.color && (
                            <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColorSwatch(v.color) }} />
                              {v.color}
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2 flex-wrap pt-1">
                          <span className="text-xl font-black">{formatPrice(vPrice)}</span>
                          {vOldPrice > vPrice && (
                            <span className="text-sm text-outline line-through">{formatPrice(vOldPrice)}</span>
                          )}
                          {vDiscount > 0 && (
                            <span className="text-[#00FF88] text-[10px] font-extrabold bg-[#00FF88]/10 px-2 py-0.5 rounded-full">{vDiscount}% OFF</span>
                          )}
                        </div>
                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold flex items-center gap-1 ${vInStock ? 'text-green-600' : 'text-red-400'}`}>
                              <span className={`w-2 h-2 rounded-full ${vInStock ? 'bg-green-500' : 'bg-red-400'}`} />
                              {vInStock ? `${v.stock > 10 ? 'In Stock' : `Only ${v.stock} left`}` : 'Out of Stock'}
                            </span>
                            {vInStock && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedVariantId(String(v.id))
                                  setTimeout(() => handleAddToCart(), 100)
                                }}
                                className="text-xs font-bold text-[#4FE3C1] hover:text-[#00FF88] transition-colors flex items-center gap-1"
                              >
                                <FiShoppingCart size={12} /> Quick Add
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* === TECHNICAL SPECIFICATIONS === */}
      <section className="py-16 md:py-24" id="specs">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-12"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#4FE3C1] mb-2 block">Specifications</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Technical Specifications</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-[#4FE3C1] to-[#00FF88] rounded-full mx-auto" />
            <p className="text-outline mt-4">Deep dive into the engineering that powers your device.</p>
          </motion.div>

          {/* Animated Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center mb-10"
          >
            <div className="glass-premium inline-flex p-1.5 rounded-2xl gap-1">
              {SPEC_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSpecTab(tab.id)}
                  className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeSpecTab === tab.id ? 'text-white' : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {activeSpecTab === tab.id && (
                    <motion.div
                      layoutId="specTab"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, #4FE3C1, #454747)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Spec Cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSpecTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {getSpecData(activeSpecTab).map((spec, i) => (
                <motion.div
                  key={spec.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="spec-card glass-premium p-6 md:p-8 rounded-2xl relative overflow-hidden group spec-card-glow"
                  style={{ border: '1px solid rgba(255,255,255,0.3)' }}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4FE3C1] to-[#00FF88] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4FE3C1]/10 to-[#00FF88]/10 flex items-center justify-center mb-4 text-[#4FE3C1] group-hover:scale-110 transition-transform">
                    {spec.label === 'Processor' || spec.key === 'processor' ? <FiCpu size={22} /> :
                     spec.key === 'ram' ? <FiHardDrive size={22} /> :
                     spec.key === 'gpu' ? <FiZap size={22} /> :
                     spec.key === 'os' ? <FiMonitor size={22} /> :
                     spec.key === 'size' ? <FiMonitor size={22} /> :
                     spec.key === 'resolution' ? <FiEye size={22} /> :
                     spec.key === 'refresh rate' ? <FiSliders size={22} /> :
                     spec.key === 'brightness' ? <FiSun size={22} /> :
                     spec.key === 'capacity' ? <FiBattery size={22} /> :
                     spec.key === 'charging' ? <FiZap size={22} /> :
                     spec.key === 'wireless' || spec.key === 'wifi' ? <FiWifi size={22} /> :
                     spec.key === 'standby' ? <FiClock size={22} /> :
                     spec.key === 'network' ? <FiSmartphone size={22} /> :
                     spec.key === 'bluetooth' ? <FiBluetooth size={22} /> :
                     spec.key === 'nfc' ? <FiShare2 size={22} /> :
                     <FiInfo size={22} />}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-outline/70 mb-1.5">{spec.label}</p>
                  <h4 className="text-base md:text-lg font-extrabold tracking-tight">{spec.value}</h4>
                  <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-[#4FE3C1]/5 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500" />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Pricing Panel */}
          {currentPrice > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              className="mt-12 glass-premium rounded-[2rem] p-8 md:p-12 max-w-4xl mx-auto relative overflow-hidden"
              style={{
                border: '1px solid rgba(79,227,193,0.15)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.3))',
              }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#4FE3C1]/5 to-[#00FF88]/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#4FE3C1]/5 to-[#00FF88]/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              <div className="relative z-10">
                <div className="text-center mb-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-outline/60 mb-3">Pricing</p>
                  <div className="flex items-baseline justify-center gap-4">
                    <span className="text-5xl md:text-6xl font-black tracking-tighter text-gradient">{formatPrice(currentPrice)}</span>
                    {oldPriceVal > currentPrice && (
                      <span className="text-xl md:text-2xl text-outline line-through">{formatPrice(oldPriceVal)}</span>
                    )}
                  </div>
                </div>

                {discount > 0 && (
                  <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#00FF88]/15 to-[#4FE3C1]/15 border border-[#00FF88]/20">
                      <span className="text-sm font-extrabold text-gradient">{discount}% OFF</span>
                      <span className="w-px h-4 bg-outline/20" />
                      <span className="text-xs font-bold text-outline">You Save {formatPrice(youSave)}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { icon: <FiTruck size={20} />, label: 'Free Delivery' },
                    { icon: <FiShield size={20} />, label: '1 Year Warranty' },
                    { icon: <FiRefreshCw size={20} />, label: '7 Day Return' },
                    { icon: <FiAward size={20} />, label: 'Reward Points' },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/30 hover:bg-white/50 transition-colors">
                      <span className="text-[#4FE3C1]">{item.icon}</span>
                      <span className="text-[10px] font-bold text-outline uppercase tracking-wider">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* === RELATED PRODUCTS === */}
      {relatedProducts.length > 0 && (
        <section className="py-16 md:py-24" id="related-products">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              className="mb-10"
            >
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#4FE3C1] mb-2 block">Related</span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">More from {categoryName || 'this category'}</h2>
              <div className="w-16 h-1 bg-gradient-to-r from-[#4FE3C1] to-[#00FF88] rounded-full mt-3" />
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rp: any, idx: number) => {
                const rpImg = rp.images?.[0] || rp.image || rp.common_image || ''
                const rpName = rp.product_name || rp.name || ''
                const v = rp.variants?.[0]
                const rpPrice = v
                  ? Number(v.discount_price || v.discountPrice || v.price || rp.min_price || 0)
                  : Number(rp.discountPrice || rp.price || rp.min_price || 0)
                const rpOldRaw = v ? Number(v.price || 0) : Number(rp.price || 0)
                const rpOld = rpOldRaw > rpPrice ? rpOldRaw : null
                const rpDisc = rpOld ? Math.round(((rpOld - rpPrice) / rpOld) * 100) : 0
                const rpRating = Number(rp.rating) || 0
                let badge = ''
                if (rp.tags && Array.isArray(rp.tags) && rp.tags.length) badge = String(rp.tags[0])
                else if (rp.is_trending || rp.trending) badge = 'Trending'
                else if (rp.is_new_arrival || rp.new_arrival) badge = 'New'
                else if (rp.is_featured || rp.featured) badge = 'Featured'
                else if (rp.is_best_selling || rp.best_selling) badge = 'Best Seller'
                return (
                  <motion.div
                    key={rp.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div
                      onClick={() => navigate(`/product/${rp.id}`)}
                      className="rounded-[2.5rem] p-[2.5rem] flex flex-col gap-6 backdrop-blur-md cursor-pointer"
                      style={{
                        background: 'rgba(255,255,255,0.4)',
                        backdropFilter: 'blur(25px)',
                        WebkitBackdropFilter: 'blur(25px)',
                        border: '1px solid rgba(217,222,229,0.5)',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)',
                        transition: 'all 0.5s cubic-bezier(0.23,1,0.32,1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)'
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(79,227,193,0.3)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.8)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.4)'
                      }}
                    >
                      {/* Image section */}
                      <div className="relative h-64 w-full flex items-center justify-center bg-surface-container-low rounded-3xl overflow-hidden">
                        <img
                          className="w-full h-full object-contain p-4"
                          src={rpImg ? resolveImage(rpImg) : FALLBACK_IMG}
                          alt={rpName}
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          {badge && (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm" style={{
                              fontFamily: "'Inter', sans-serif",
                              background: badge === 'Trending'
                                ? 'linear-gradient(135deg, #FF6B6B, #EE5A24)'
                                : badge === 'New'
                                  ? 'linear-gradient(135deg, #00FF88, #00D4FF)'
                                  : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                              color: '#ffffff',
                              boxShadow: badge === 'Trending'
                                ? '0 4px 15px rgba(255,107,107,0.4)'
                                : badge === 'New'
                                  ? '0 4px 15px rgba(0,255,136,0.3)'
                                  : '0 4px 15px rgba(124,58,237,0.3)',
                            }}>
                              <span className="material-symbols-outlined !text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {badge === 'Trending' ? 'local_fire_department' : badge === 'New' ? 'bolt' : 'verified'}
                              </span>
                              {badge}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(rp.id) }}
                          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm hover:bg-white transition-all"
                        >
                          <span className={`material-symbols-outlined text-lg ${wishlist.has(rp.id) ? 'text-[#FF3B30]' : 'text-on-surface-variant'}`}
                            style={{ fontVariationSettings: wishlist.has(rp.id) ? "'FILL' 1" : "'FILL' 0" }}>
                            favorite
                          </span>
                        </button>
                      </div>

                      {/* Product info */}
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold tracking-tight line-clamp-2" style={{ fontFamily: "'Inter', sans-serif", color: '#1a1c1c' }}>
                            {rpName}
                          </h3>
                          <span className="text-lg font-bold shrink-0 ml-2" style={{ fontFamily: "'Inter', sans-serif", color: '#4FE3C1' }}>
                            ₹{rpPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex text-[#FF8A00]">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`material-symbols-outlined !text-[16px] ${i < Math.floor(rpRating) ? '' : 'opacity-30'}`}
                                style={{ fontVariationSettings: i < Math.floor(rpRating) ? "'FILL' 1" : "'FILL' 0" }}>
                                star
                              </span>
                            ))}
                          </div>
                          <span className="text-xs" style={{ fontFamily: "'Inter', sans-serif", color: '#47464c' }}>({rpRating.toFixed(1)})</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {rpOld && (
                            <div className="px-3 py-1 rounded-full text-xs border" style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#eeeeee', color: '#47464c', borderColor: 'rgba(217,222,229,0.5)' }}>
                              <span className="line-through">₹{rpOld.toLocaleString('en-IN')}</span>
                              <span className="font-semibold ml-1" style={{ color: '#00FF88' }}>{rpDisc}% OFF</span>
                            </div>
                          )}
                          {rp.brand && (
                            <div className="px-3 py-1 rounded-full text-xs border" style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#eeeeee', color: '#47464c', borderColor: 'rgba(217,222,229,0.5)' }}>
                              {rp.brand}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Link
                        to={`/product/${rp.id}`}
                        className="w-full py-3.5 rounded-full font-bold shadow-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2 text-white"
                        style={{ background: 'linear-gradient(135deg, #4FE3C1, #454747)', fontFamily: "'Inter', sans-serif" }}
                      >
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_shopping_cart</span>
                        View Product
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* === COMMUNITY REVIEWS === */}
      <section className="py-16 md:py-24 bg-white/40">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-12"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#4FE3C1] mb-2 block">Reviews</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Community Reviews</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-[#4FE3C1] to-[#00FF88] rounded-full mx-auto" />
            <p className="text-outline mt-4">Trusted by thousands of customers worldwide.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12"
          >
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-on-surface mb-1">4.6</div>
              <div className="flex justify-center text-amber-400 mb-1 gap-0.5">
                {[...Array(4)].map((_, i) => <FiStar key={i} size={18} fill="currentColor" />)}
                <FiStar size={18} className="text-amber-400" fill="currentColor" />
              </div>
              <p className="text-[11px] font-bold text-outline uppercase tracking-wider mt-1">128 Reviews</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {[5, 4, 3].map((star) => {
                const pct = star === 5 ? 45 : star === 4 ? 30 : 15
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold w-4 text-outline">{star}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        className="h-full bg-gradient-to-r from-[#4FE3C1] to-[#00FF88] rounded-full"
                      />
                    </div>
                    <span className="text-[10px] font-bold w-6 text-outline">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Rahul S.', rating: 5, text: 'The build quality is insane. It feels like a piece of jewelry but performs like a supercomputer. Battery life exceeds my expectations.', avatar: 'https://i.pravatar.cc/80?u=rahul', time: '2 weeks ago', badge: 'Verified Purchase' },
              { name: 'Priya M.', rating: 5, text: 'Amazing quality! No scratches, perfect screen! Truly lives up to the Pro name.', avatar: 'https://i.pravatar.cc/80?u=priya', time: '1 month ago', badge: 'Verified Purchase' },
              { name: 'Arun K.', rating: 4, text: 'Great watch, great price. The 1-year warranty gives peace of mind. Highly recommend for fitness enthusiasts.', avatar: 'https://i.pravatar.cc/80?u=arun', time: '3 weeks ago', badge: 'Verified Purchase' },
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className={`glass-premium p-6 md:p-8 rounded-2xl ${i === 1 ? 'ring-2 ring-[#4FE3C1]/20' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <img src={review.avatar} alt="" className="w-10 h-10 rounded-full bg-gray-200 object-cover" />
                    <div>
                      <h5 className="font-bold text-sm">{review.name}</h5>
                      <p className="text-[10px] text-outline/60">{review.time}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#00FF88]/10 text-[#00FF88] text-[10px] font-bold">{review.badge}</span>
                </div>
                <div className="flex text-amber-400 mb-3 gap-0.5">
                  {[...Array(5)].map((_, s) => (
                    <FiStar key={s} size={14} fill={s < review.rating ? 'currentColor' : 'none'} className={s < review.rating ? '' : 'text-gray-300'} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-outline">&ldquo;{review.text}&rdquo;</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === SHARE BUTTON (fixed) === */}
      <div ref={shareRef} className="fixed bottom-28 right-6 z-50">
        <motion.button
          onClick={() => setShareOpen(!shareOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-full text-white shadow-xl shadow-[#4FE3C1]/30 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #4FE3C1, #454747)' }}
        >
          <FiShare2 size={20} />
        </motion.button>
        <AnimatePresence>
          {shareOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bottom-16 right-0 glass-premium rounded-2xl p-3 shadow-2xl min-w-[200px]"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-outline/60 mb-2 px-2">Share</p>
              <div className="space-y-1">
                <button onClick={handleShare} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#4FE3C1]/5 transition-colors text-sm font-medium">
                  <FiExternalLink size={16} className="text-outline" /> Copy Link
                </button>
                <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank'); setShareOpen(false) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#4FE3C1]/5 transition-colors text-sm font-medium">
                  <FaWhatsapp size={16} className="text-green-500" /> WhatsApp
                </button>
                <button onClick={() => { window.open(`https://telegram.me/share/url?url=${encodeURIComponent(window.location.href)}`, '_blank'); setShareOpen(false) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#4FE3C1]/5 transition-colors text-sm font-medium">
                  <FaTelegram size={16} className="text-blue-400" /> Telegram
                </button>
                <button onClick={() => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank'); setShareOpen(false) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#4FE3C1]/5 transition-colors text-sm font-medium">
                  <FaFacebook size={16} className="text-blue-600" /> Facebook
                </button>
                <button onClick={() => { window.open(`mailto:?subject=${encodeURIComponent(productName)}&body=${encodeURIComponent(window.location.href)}`, '_blank'); setShareOpen(false) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#4FE3C1]/5 transition-colors text-sm font-medium">
                  <FaEnvelope size={16} className="text-gray-500" /> Email
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* === FOOTER === */}
      <EcommerceFooter />

      {/* === STICKY ACTION BAR === */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-[20px] border-t border-gray-200/60 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="hidden sm:flex items-center gap-4 min-w-0">
              {images[selectedImage] && (
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  <img src={images[selectedImage]} alt="" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-outline truncate">{variantName || productName}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-black">{formatPrice(currentPrice)}</span>
                  {oldPriceVal > currentPrice && (
                    <span className="text-xs text-outline line-through">{formatPrice(oldPriceVal)}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 flex-1 md:flex-none justify-end">
              <div className="flex items-center bg-gray-100 rounded-full px-2 py-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-colors cursor-pointer">
                  <FiMinus size={14} />
                </button>
                <span className="w-10 text-center font-bold text-sm">{qty}</span>
                <button onClick={() => { if (qty < stockQty) setQty(qty + 1) }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-colors cursor-pointer">
                  <FiPlus size={14} />
                </button>
              </div>

              <motion.button
                onClick={handleAddToCart}
                disabled={!inStock || isAdding}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-6 md:px-8 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg flex items-center gap-2 ${
                  !inStock || isAdding
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isInCart
                      ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
                      : 'text-white shadow-[#4FE3C1]/20 hover:shadow-xl hover:shadow-[#4FE3C1]/30'
                }`}
                style={inStock && !isAdding && !isInCart ? { background: 'linear-gradient(135deg, #4FE3C1, #454747)' } : undefined}
              >
                {!inStock ? 'Out of Stock' : isAdding ? <><FiRefreshCw size={16} className="animate-spin" /> Adding...</> : isInCart ? <><FiTrash2 size={16} /> Remove from Cart</> : <><FiShoppingCart size={16} /> Add to Cart</>}
              </motion.button>

              <button
                onClick={() => { if (product?.id) toggleWishlist(product.id) }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  product?.id && wishlist.has(product.id) ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-outline hover:bg-gray-200'
                }`}
              >
                <FiHeart size={16} fill={product?.id && wishlist.has(product.id) ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-outline hover:bg-gray-200 transition-all"
              >
                <FiShare2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <Toast toast={toast} />
    </div>
  )
}

// FiSun icon used only in specs
function FiSun(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

export default function ProductDetail() {
  return (
    <ErrorBoundary>
      <ProductDetailContent />
    </ErrorBoundary>
  )
}

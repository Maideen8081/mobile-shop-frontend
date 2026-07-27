import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { categoryService } from '../services/categoryService'
import { productService } from '../services/productService'
import StorefrontNavbar from '../components/ecommerce/StorefrontNavbar'
import EcommerceFooter from '../components/ecommerce/Footer'
import { useToast } from '../context/ToastContext'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 480%22 fill=%22%23f1eeeb%22%3E%3Crect width=%22400%22 height=%22480%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2218%22 fill=%22%2322C55E%22%3EProduct%3C/text%3E%3C/svg%3E'

function getProductPrice(product: any): { current: number; old: number | null } {
  const v = product.variants?.[0]
  if (!v) return { current: product.min_price || 0, old: null }
  const rawPrice = v.discount_price || v.discountPrice || v.price || product.min_price || 0
  const price = isNaN(Number(rawPrice)) ? 0 : Number(rawPrice)
  const rawOld = v.price || 0
  const old = rawOld > price ? Number(rawOld) : null
  return { current: price, old }
}

function getProductImage(product: any): string {
  const raw = product.common_image || product.image || product.images?.[0] || product.thumbnail || ''
  if (!raw) return FALLBACK_IMG
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  return `${API_BASE_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`
}

function getProductName(product: any): string {
  return product.product_name ?? product.name ?? ''
}

function getProductCreated(product: any): string {
  return product.created_at ?? product.created ?? ''
}

function getProductRating(product: any): number {
  return Number(product.rating) || 0
}

function getProductFeatures(product: any): string[] {
  if (product.features && Array.isArray(product.features)) {
    return product.features.map((f: any) => typeof f === 'string' ? f : f.feature_text || f.text || '').filter(Boolean)
  }
  if (product.product_features && Array.isArray(product.product_features)) return product.product_features.filter(Boolean)
  if (typeof product.product_features === 'string') return product.product_features.split('\n').map((t: string) => t.trim()).filter(Boolean)
  return []
}

function getProductTags(product: any): string[] {
  if (product.tags && Array.isArray(product.tags)) return product.tags.filter(Boolean)
  if (typeof product.tags === 'string') return product.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
  if (product.tag_names && Array.isArray(product.tag_names)) return product.tag_names.filter(Boolean)
  const tags: string[] = []
  if (product.is_trending || product.trending) tags.push('Trending')
  if (product.is_new_arrival || product.new_arrival) tags.push('New')
  if (product.is_best_selling || product.best_selling) tags.push('Best Seller')
  if (product.is_featured || product.featured) tags.push('Featured')
  return tags
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Popular' },
  { value: 'featured', label: 'Featured' },
]

const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹1k', min: 500, max: 1000 },
  { label: '₹1k - ₹5k', min: 1000, max: 5000 },
  { label: '₹5k - ₹10k', min: 5000, max: 10000 },
  { label: 'Over ₹10k', min: 10000, max: Infinity },
]


export default function CollectionPage() {
  const navigate = useNavigate()
  const { show: showToast } = useToast()
  const rawCategory = useParams<{ category: string }>().category || ''
  const categoryName = decodeURIComponent(rawCategory)

  const [allProducts, setAllProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const [brandFilter, setBrandFilter] = useState<string[]>([])
  const [priceMin, setPriceMin] = useState<number>(0)
  const [priceMax, setPriceMax] = useState<number>(Infinity)
  const [ratingFilter, setRatingFilter] = useState(0)
  const [activePriceRange, setActivePriceRange] = useState<number | null>(null)
  const [wishlist, setWishlist] = useState<Set<number>>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('wishlist') || '[]')
      return new Set<number>(stored)
    } catch { return new Set<number>() }
  })
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'all'
  const searchQuery = searchParams.get('search') || ''
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [heroSlide, setHeroSlide] = useState(0)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [fullProduct, setFullProduct] = useState<any>(null)
  const [, setMobileDetailOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useLockBodyScroll(mobileFilterOpen)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const filtersApplied = useRef(false)

  const PAGE_SIZE = 100

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % 5)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setAllProducts([])
    setPage(1)
    setHasMore(false)
    setBrandFilter([])
    setPriceMin(0)
    setPriceMax(Infinity)
    setRatingFilter(0)
    setActivePriceRange(null)
    setSortBy('newest')
    if (categoryName) {
      setLoading(true)
      loadProducts(1, true)
    }
    }, [categoryName, activeTab, searchQuery])

  useEffect(() => {
    if (!filtersApplied.current) {
      filtersApplied.current = true
      return
    }
    if (categoryName) {
      setAllProducts([])
      setPage(1)
      setHasMore(false)
      setLoading(true)
      loadProducts(1, true)
    }
  }, [brandFilter, priceMin, priceMax, ratingFilter, sortBy])

  useEffect(() => {
    categoryService.list().then((cats) => {
      const mapped = cats
        .filter((c: any) => c.status === 'active')
        .map((c: any) => ({ id: c.id, name: c.name, count: typeof c.products === 'number' ? c.products : 0 }))
      setCategories(mapped)
    }).catch(() => {})
  }, [])

  function getTabParams(): Record<string, any> {
    switch (activeTab) {
      case 'new': return { is_new_arrival: true }
      case 'trending': return { is_trending: true }
      case 'popular': return { is_featured: true }
      default: return {}
    }
  }

  function filterByTab(items: any[]): any[] {
    switch (activeTab) {
      case 'new': return items.filter((p: any) => p.is_new_arrival || p.new_arrival || p.newArrival)
      case 'trending': return items.filter((p: any) => p.is_trending || p.trending)
      case 'popular': return items.filter((p: any) => p.is_featured || p.featured)
      default: return items
    }
  }

  const sortOrderMap: Record<string, string> = {
    'newest': '-created',
    'price-asc': 'price',
    'price-desc': '-price',
    'popular': '-rating',
    'featured': '-featured,-rating',
  }

  async function fetchPage(pageNum: number): Promise<{ items: any[]; next: string | null; count: number }> {
    const params: Record<string, any> = {
      ...getTabParams(),
      page: pageNum,
      page_size: PAGE_SIZE,
    }
    if (categoryName && categoryName !== 'all') {
      params.category = categoryName
    }
    if (brandFilter.length > 0) {
      params.brand = brandFilter.join(',')
    }
    if (priceMin > 0) params.price_min = priceMin
    if (priceMax < Infinity) params.price_max = priceMax
    if (ratingFilter > 0) params.rating_min = ratingFilter
    if (searchQuery) params.search = searchQuery
    params.ordering = sortOrderMap[sortBy] || '-created'
    const result = await productService.listPaginated(params)
    const rawList = result.results || []
    const filtered = filterByTab(rawList)
    return {
      items: filtered,
      next: result.next,
      count: result.count || rawList.length,
    }
  }

  const loadProducts = async (pageNum: number, reset = false) => {
    if (reset) {
      if (allProducts.length === 0) setLoading(true)
      else setRefreshing(true)
    } else {
      setLoadingMore(true)
    }
    try {
      const result = await fetchPage(pageNum)
      const rawList = result.items
      if (reset) {
        setAllProducts(rawList)
      } else {
        setAllProducts((prev) => [...prev, ...rawList])
      }
      setHasMore(result.next !== null)
      setPage(pageNum)
    } catch (err: any) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadProducts(page + 1)
    }
  }

  const availableBrands = useMemo(() => {
    const brands = new Set<string>()
    allProducts.forEach((p: any) => {
      if (p.brand) brands.add(p.brand)
    })
    return Array.from(brands).sort()
  }, [allProducts])

  const filteredProducts = useMemo(() => {
    let result = [...allProducts]
    if (brandFilter.length > 0) {
      result = result.filter((p: any) => brandFilter.includes(p.brand))
    }
    if (priceMin > 0 || priceMax < Infinity) {
      result = result.filter((p: any) => {
        const { current } = getProductPrice(p)
        return current >= priceMin && current <= priceMax
      })
    }
    if (ratingFilter > 0) {
      result = result.filter((p: any) => getProductRating(p) >= ratingFilter)
    }
    const sortFn = (a: any, b: any) => {
      switch (sortBy) {
        case 'price-asc': {
          const pa = getProductPrice(a).current
          const pb = getProductPrice(b).current
          return pa - pb
        }
        case 'price-desc': {
          const pa = getProductPrice(a).current
          const pb = getProductPrice(b).current
          return pb - pa
        }
        case 'popular': return getProductRating(b) - getProductRating(a)
        case 'featured': {
          if (b.featured && !a.featured) return 1
          if (a.featured && !b.featured) return -1
          return getProductRating(b) - getProductRating(a)
        }
        default: return new Date(getProductCreated(b)).getTime() - new Date(getProductCreated(a)).getTime()
      }
    }
    result.sort(sortFn)
    return result
  }, [allProducts, brandFilter, priceMin, priceMax, ratingFilter, sortBy])

  const toggleBrand = (brand: string) => {
    setBrandFilter((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    )
  }

  const handlePriceRange = (idx: number | null) => {
    if (idx === null) {
      setActivePriceRange(null)
      setPriceMin(0)
      setPriceMax(Infinity)
      return
    }
    const range = PRICE_RANGES[idx]
    setActivePriceRange(idx)
    setPriceMin(range.min)
    setPriceMax(range.max)
  }

  const toggleWishlist = (id: number) => {
    setWishlist((prev) => {
      const next = new Set(prev)
      let added = false
      if (next.has(id)) { next.delete(id); added = false }
      else { next.add(id); added = true }
      localStorage.setItem('wishlist', JSON.stringify(Array.from(next)))
      window.dispatchEvent(new Event('wishlist-updated'))
      showToast(added ? 'Added to wishlist' : 'Removed from wishlist', 'success')
      return next
    })
  }

  const handleAddToCart = (product: any) => {
    const price = getProductPrice(product).current
    const image = getProductImage(product)
    const name = getProductName(product)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingIdx = cart.findIndex((item: any) => item.productId === product.id)
    if (existingIdx >= 0) {
      cart[existingIdx].quantity += 1
    } else {
      cart.push({
        productId: product.id,
        variantId: null,
        name,
        brand: product.brand || '',
        price,
        image,
        quantity: 1,
      })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
    showToast(`${name} added to cart`, 'success')
  }

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
    const handleMouse = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width
        const ny = 1.0 - (event.clientY - rect.top) / rect.height
        mouse.x = nx * canvas.width
        mouse.y = ny * canvas.height
      }
    }
    window.addEventListener('mousemove', handleMouse)

    function render(t: number) {
      if (typeof ResizeObserver === 'undefined') syncSize()
      gl.viewport(0, 0, canvas!.width, canvas!.height)
      if (uTime) gl.uniform1f(uTime, t * 0.001)
      if (uRes) gl.uniform2f(uRes, canvas!.width, canvas!.height)
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animId = requestAnimationFrame(render)
    }
    let animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', handleMouse)
      const loseContext = gl.getExtension('WEBGL_lose_context')
      if (loseContext) loseContext.loseContext()
    }
  }, [])

  useEffect(() => {
    if (!selectedProduct?.id) return
    productService.getById(selectedProduct.id)
      .then((res: any) => {
        const data = res.data || res
        setFullProduct(data)
      })
      .catch(() => setFullProduct(null))
  }, [selectedProduct?.id])

  const hasActiveFilters = brandFilter.length > 0 || activePriceRange !== null || ratingFilter > 0

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md selection:bg-[#FF5A65]/30 selection:text-[#A81D2A] overflow-x-hidden">
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10" />

      {/* Collection Hero Carousel */}
      <section className="hero-section relative w-full overflow-hidden" style={{ height: '70vh', minHeight: '650px' }}>
        <StorefrontNavbar activeLabel={categoryName === 'all' ? 'Products' : undefined} absolute />

        {/* Hero Carousel Images */}
        {([
          { src: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80', alt: 'Premium Smartphones' },
          { src: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=1200&q=80', alt: 'TWS Earbuds' },
          { src: 'https://images.unsplash.com/photo-1610296669228-602fa827fc1f?w=1200&q=80', alt: 'Repair Spares' },
          { src: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1200&q=80', alt: 'Chargers' },
          { src: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1200&q=80', alt: 'Power Banks' },
        ] as const).map((img, idx) => (
          <div
            key={idx}
            className="absolute inset-0 transition-opacity duration-[1.5s] ease-in-out"
            style={{
              opacity: heroSlide === idx ? 1 : 0,
            }}
          >
            <img
              className="w-full h-full object-cover"
              src={img.src}
              alt={img.alt}
              style={{ transform: heroSlide === idx ? 'scale(1.05)' : 'scale(1)', transition: 'transform 8s ease-out' }}
            />
          </div>
        ))}

        {/* Overlay gradients */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.15) 100%)',
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 50%)',
        }} />

        {/* Carousel indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {[0, 1, 2, 3, 4].map((idx) => (
            <button
              key={idx}
              onClick={() => setHeroSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === heroSlide ? 'w-8 bg-[#FF5A65]' : 'w-1.5 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
        <div className="absolute" style={{ left: '10%', top: '55%', transform: 'translateY(-50%)', maxWidth: '700px', zIndex: 5 }}>
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.1em] uppercase mb-6`}
            style={{
              background: 'rgba(255,90,101,0.15)',
              border: '1px solid rgba(255,90,101,0.3)',
              color: '#FF5A65',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FF5A65' }} />
            {categoryName || 'Collection'}
          </div>
          <p className="text-white/85 text-lg md:text-2xl max-w-[650px] mb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
            Browse our complete collection of smartphones, accessories, audio, and more.
          </p>
          <div className="flex gap-4">
            <button
              className="px-8 py-3.5 rounded-full text-sm font-semibold text-black transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #FF5A65, #00D4FF)',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
              }}
            >
              Explore Collection
            </button>
            <button
              className="px-8 py-3.5 rounded-full text-sm font-medium text-white transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              View Products
            </button>
          </div>
        </div>
      </section>

      {/* Sort Control Row - below hero, above grid */}
      <div className="w-full px-6 lg:px-[60px] pt-10 lg:pt-14 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <p className="text-sm text-on-surface-variant order-2 sm:order-1" style={{ fontFamily: "'Inter', sans-serif" }}>
            <span className="text-on-surface font-semibold">{filteredProducts.length}</span> products found
          </p>
          <div className="flex items-center gap-3 order-1 sm:order-2">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 text-xs tracking-[0.08em] text-on-surface-variant hover:text-mint transition-colors uppercase"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <span className="material-symbols-outlined text-lg">filter_list</span> Filters
            </button>

            {/* Custom Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setSortOpen((prev) => !prev)}
                className="flex items-center justify-between gap-3 min-w-[200px] px-5 py-3 rounded-2xl text-sm font-medium text-on-surface transition-all hover:border-mint"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  background: 'rgba(255,255,255,0.4)',
                  backdropFilter: 'blur(25px)',
                  WebkitBackdropFilter: 'blur(25px)',
                  border: '1px solid rgba(217,222,229,0.5)',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)',
                }}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-on-surface-variant">sort</span>
                  {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                </span>
                <span className={`material-symbols-outlined text-base text-on-surface-variant transition-transform duration-300 ${sortOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              {sortOpen && (
                <ul
                  className="absolute right-0 z-30 mt-2 w-full min-w-[220px] rounded-2xl overflow-hidden py-2"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    border: '1px solid rgba(217,222,229,0.6)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <li key={opt.value}>
                      <button
                        type="button"
                        onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                        className={`w-full flex items-center justify-between gap-2 px-5 py-3 text-left text-sm transition-colors ${
                          sortBy === opt.value ? 'text-secondary font-semibold' : 'text-on-surface-variant hover:bg-mint/10 hover:text-on-surface'
                        }`}
                      >
                        {opt.label}
                        {sortBy === opt.value && (
                          <span className="material-symbols-outlined text-base text-secondary">check</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="pb-20 w-full px-6 lg:px-[60px]">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_340px] gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:flex flex-col gap-6 sticky top-24 h-[calc(100vh-120px)] overflow-y-auto pr-2 entrance scrollbar-hide" style={{ animationDelay: '100ms' }}>
            <div className="glass-card rounded-3xl p-6 flex flex-col gap-6 backdrop-blur-md hover:border-mint/50" style={{
              background: 'rgba(255,255,255,0.4)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              border: '1px solid rgba(217,222,229,0.5)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)',
              transition: 'all 0.5s cubic-bezier(0.23,1,0.32,1)',
            }}>
              <div>
                <h2 className="text-2xl font-bold text-primary mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Filters</h2>
                <p className="text-sm text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>Refine Collection</p>
              </div>
              <div className="space-y-3">
                <p className="text-xs tracking-[0.1em] font-bold text-on-surface-variant uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>CATEGORIES</p>
                <nav className="flex flex-col gap-2">
                  <button onClick={() => navigate('/collection/all')} className={`flex items-center gap-3 rounded-xl p-3 transition-transform hover:translate-x-1 text-sm ${categoryName === 'all' || !categoryName ? 'bg-mint/20 text-secondary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                     <span className="material-symbols-outlined text-xl">grid_view</span>
                    Products
                  </button>
                  {categories.map((cat) => {
                    const isActive = categoryName.toLowerCase() === cat.name.toLowerCase()
                    return (
                      <button key={cat.id} onClick={() => navigate(`/collection/${encodeURIComponent(cat.name)}`)} className={`flex items-center gap-3 rounded-xl p-3 transition-transform hover:translate-x-1 text-sm ${isActive ? 'bg-mint/20 text-secondary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                        <span className="material-symbols-outlined text-xl">{isActive ? 'folder' : 'folder_open'}</span>
                        <span className="flex-1">{cat.name}</span>
                        <span className="text-[10px] text-on-surface-variant/60">({cat.count})</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
              <div className="space-y-3">
                <p className="text-xs tracking-[0.1em] font-bold text-on-surface-variant uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>PRICE RANGE</p>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map((range, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePriceRange(activePriceRange === idx ? null : idx)}
                      className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                        activePriceRange === idx
                          ? 'border-mint text-secondary'
                          : 'border-glass-border text-on-surface-variant hover:border-mint'
                      }`}
                      style={{
                        background: activePriceRange === idx ? 'rgba(203,32,45,0.2)' : 'rgba(255,255,255,0.4)',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs tracking-[0.1em] font-bold text-on-surface-variant uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>TOP BRANDS</p>
                <div className="flex flex-wrap gap-2">
                  {availableBrands.map((brand) => (
                    <span
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      className={`px-3 py-1 rounded-full border cursor-pointer text-sm transition-colors ${
                        brandFilter.includes(brand)
                          ? 'border-mint bg-mint/20 text-secondary'
                          : 'border-glass-border glass-bg text-on-surface-variant hover:border-mint'
                      }`}
                      style={{
                        background: brandFilter.includes(brand) ? 'rgba(203,32,45,0.2)' : 'rgba(255,255,255,0.4)',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
              {hasActiveFilters ? (
                <button
                  onClick={() => { setBrandFilter([]); setPriceMin(0); setPriceMax(Infinity); setRatingFilter(0); setActivePriceRange(null) }}
                  className="mt-4 w-full py-4 rounded-xl bg-surface-container-highest text-on-surface font-bold hover:bg-surface-container-highest/80 transition-all active:scale-95 shadow-lg text-sm"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Clear all filters
                </button>
              ) : (
                <button className="mt-4 w-full py-4 rounded-xl bg-surface-container-highest/50 text-on-surface-variant font-medium cursor-default text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  No filters applied
                </button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex flex-col gap-12 min-w-0">

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-[#CB202D] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[#6B7280] font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Loading collection...</p>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <section className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 ${refreshing ? 'opacity-60 pointer-events-none transition-opacity duration-200' : 'transition-opacity duration-200'}`}>
            {filteredProducts.length === 0 && !loading ? (
              <div className="col-span-full text-center py-20">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">inventory_2</span>
                <p className="text-on-surface text-lg font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>No products found</p>
                <p className="text-on-surface-variant text-sm mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {hasActiveFilters ? 'Try adjusting your filters' : 'No products in this category yet'}
                </p>
              </div>
            ) : (
              filteredProducts.map((product: any, idx: number) => {
                const tags = getProductTags(product)
                const badge = tags[0] || ''
                const { current: price, old: oldPrice } = getProductPrice(product)
                const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0
                const rating = getProductRating(product)
                const delay = 200 + (idx % 6) * 100

                return (
                  <div
                    key={product.id}
                    className="entrance glass-card rounded-[2.5rem] p-[2.5rem] flex flex-col gap-6 backdrop-blur-md hover:border-mint/50 cursor-pointer"
                    data-delay={delay}
                    onClick={() => {
                      setSelectedProduct(product)
                      if (window.innerWidth < 1024) setMobileDetailOpen(true)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.4)',
                      backdropFilter: 'blur(25px)',
                      WebkitBackdropFilter: 'blur(25px)',
                      border: '1px solid rgba(217,222,229,0.5)',
                      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)',
                      transition: 'all 0.5s cubic-bezier(0.23,1,0.32,1)',
                      animationDelay: `${delay}ms`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)'
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(203,32,45,0.3)'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.8)'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.4)'
                    }}
                  >
                    <div className="relative h-64 w-full flex items-center justify-center bg-surface-container-low rounded-3xl overflow-hidden">
                      <img
                        className="w-full h-full floating transition-transform object-contain p-4"
                        src={getProductImage(product)}
                        alt={getProductName(product)}
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        {badge && (
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm" style={{
                            fontFamily: "'Inter', sans-serif",
                            background: badge === 'Trending'
                              ? 'linear-gradient(135deg, #FF6B6B, #EE5A24)'
                              : badge === 'New'
                                ? 'linear-gradient(135deg, #FF5A65, #00D4FF)'
                                : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                            color: '#ffffff',
                            boxShadow: badge === 'Trending'
                              ? '0 4px 15px rgba(255,107,107,0.4)'
                              : badge === 'New'
                                ? '0 4px 15px rgba(255,90,101,0.3)'
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
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id) }}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm hover:bg-white transition-all"
                      >
                        <span className={`material-symbols-outlined text-lg ${wishlist.has(product.id) ? 'text-[#FF3B30]' : 'text-on-surface-variant'}`}
                          style={{ fontVariationSettings: wishlist.has(product.id) ? "'FILL' 1" : "'FILL' 0" }}>
                          favorite
                        </span>
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-on-surface tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {getProductName(product)}
                        </h3>
                        <span className="text-xl font-bold text-primary" style={{ fontFamily: "'Inter', sans-serif" }}>
                          ₹{price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex text-[#FF8A00]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`material-symbols-outlined !text-[18px] ${i < Math.floor(rating) ? '' : 'opacity-30'}`}
                              style={{ fontVariationSettings: i < Math.floor(rating) ? "'FILL' 1" : "'FILL' 0" }}>
                              star
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>({rating.toFixed(1)})</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {oldPrice && (
                          <div className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-sm border border-glass-border" style={{ fontFamily: "'Inter', sans-serif" }}>
                            <span className="line-through">₹{oldPrice.toLocaleString('en-IN')}</span>
                            <span className="text-secondary font-semibold ml-1">{discount}% OFF</span>
                          </div>
                        )}
                        <div className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-sm border border-glass-border" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {product.brand || 'Certified'}
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/product/${product.id}`}
                      className="w-full py-4 rounded-full bg-mint text-primary font-bold shadow-lg shadow-mint/10 transition-all hover:bg-secondary hover:text-white active:scale-95 magnetic-btn text-sm flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#CB202D', fontFamily: "'Inter', sans-serif" }}
                    >
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_shopping_cart</span>
                      View Product
                    </Link>
                  </div>
                )
              })
            )}
          </section>

          {/* Bento Style Card */}
          {filteredProducts.length > 0 && (
            <div className="entrance md:col-span-2 glass-card rounded-[2.5rem] p-[2.5rem] flex flex-col md:flex-row gap-8 items-center border-l-4 border-l-mint backdrop-blur-md hover:border-mint/50 shadow-[0_0_40px_rgba(203,32,45,0.1)]" style={{ animationDelay: '500ms',
              background: 'rgba(255,255,255,0.4)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              border: '1px solid rgba(217,222,229,0.5)',
              borderLeft: '4px solid #CB202D',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 0 40px rgba(203,32,45,0.1)',
              transition: 'all 0.5s cubic-bezier(0.23,1,0.32,1)',
            }}>
              <div className="flex-1 space-y-4">
                <div className="w-12 h-12 bg-mint/20 rounded-xl flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>Nova Standard Verification</h2>
                <p className="text-base text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Every device in our collection undergoes a 50-point clinical diagnostic check. We guarantee genuine parts, laboratory-grade cleaning, and peak performance optimization.
                </p>
                <div className="flex gap-6 pt-2">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-mint" style={{ fontFamily: "'Inter', sans-serif", color: '#CB202D' }}>95%+</span>
                    <span className="text-xs tracking-[0.1em] font-bold text-on-surface-variant uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>Battery health</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-primary" style={{ fontFamily: "'Inter', sans-serif" }}>12-Mo</span>
                    <span className="text-xs tracking-[0.1em] font-bold text-on-surface-variant uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>Full Warranty</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-secondary" style={{ fontFamily: "'Inter', sans-serif" }}>24h</span>
                    <span className="text-xs tracking-[0.1em] font-bold text-on-surface-variant uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>Burn-in Test</span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-64 h-48 bg-surface-container-low rounded-3xl overflow-hidden relative">
                <img
                  className="w-full h-full object-cover opacity-60"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9-4mNxT0hlQw9R1r39Cux9rbw-iCJnxplyQv2wvODq4nUI7YVO2nOCghVz9aCvLG7MiocMhBfy2KWX7-N3ox98MkDwmApEgvAQ-6ierSuhFJtZmykJ_Cab2-rOUC-D3Y6P82XnjcOO8AN0DQ6IeTqZcY-WJgO1HfprxUl6eR2COFGwNM58PCnpymWbDd3iC6mxux6ThLMHSECPj1hdKrTypeHA_CUFMiOzf2cnybanT5DdZz7uFaEdF69wFteHbJf0L_kWuPypg"
                  alt=""
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-mint text-4xl animate-pulse" style={{ color: '#CB202D' }}>verified_user</span>
                </div>
              </div>
            </div>
          )}

          {/* Load More */}
          {hasMore && filteredProducts.length > 0 && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-10 py-4 rounded-full bg-mint text-primary font-bold shadow-lg shadow-mint/10 transition-all hover:bg-secondary hover:text-white active:scale-95 disabled:opacity-50 text-sm"
                style={{ backgroundColor: '#CB202D', fontFamily: "'Inter', sans-serif" }}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>

        {/* Product Detail Panel - Right Side */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            {selectedProduct ? (
              <div className="glass-card rounded-3xl p-6 backdrop-blur-md" style={{
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                border: '1px solid rgba(217,222,229,0.5)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)',
              }}>
                {(() => {
                  const p = fullProduct || selectedProduct
                  const commonImage = getProductImage(p)
                  const tags = getProductTags(p)
                  const features = getProductFeatures(p)
                  const brand = p.brand || ''
                  const model = p.model_number || p.model || ''
                  const { current: price, old: oldPrice } = getProductPrice(p)
                  const rating = getProductRating(p)
                  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0
                  return (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold tracking-[0.1em] uppercase text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>Product Details</span>
                        <button onClick={() => { setSelectedProduct(null); setFullProduct(null) }} className="text-on-surface-variant hover:text-mint transition-colors">
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                      <div className="aspect-square bg-surface-container-low rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
                        <img src={commonImage} alt={getProductName(p)} className="w-full h-full object-contain p-4" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }} />
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {tags.map((tag, i) => (
                            <span key={i} className="text-[9px] tracking-[0.1em] uppercase px-2.5 py-1 text-white bg-mint rounded-full" style={{ backgroundColor: '#CB202D', fontFamily: "'Inter', sans-serif" }}>{tag}</span>
                          ))}
                        </div>
                      )}
                      {brand && <p className="text-[11px] tracking-[0.15em] uppercase text-mint font-medium" style={{ color: '#CB202D', fontFamily: "'Inter', sans-serif" }}>{brand}{model && ` | ${model}`}</p>}
                      <h3 className="text-base text-on-surface font-semibold mt-1 leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>{getProductName(p)}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xl font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>₹{price.toLocaleString('en-IN')}</span>
                        {oldPrice && (
                          <><span className="text-xs text-on-surface-variant line-through" style={{ fontFamily: "'Inter', sans-serif" }}>₹{oldPrice.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] font-medium text-white bg-mint px-1.5 py-0.5 rounded" style={{ backgroundColor: '#CB202D', fontFamily: "'Inter', sans-serif" }}>{discount}% OFF</span></>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex text-[#FF8A00]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`material-symbols-outlined !text-[16px] ${i < Math.floor(rating) ? '' : 'opacity-30'}`}
                              style={{ fontVariationSettings: i < Math.floor(rating) ? "'FILL' 1" : "'FILL' 0" }}>
                              star
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>({p.sold || 0} sold)</span>
                      </div>
                      {(() => {
                        const desc = p.description
                        const text = typeof desc === 'string' ? desc : Array.isArray(desc) ? desc.join(', ') : null
                        if (!text) return null
                        return <p className="text-xs leading-relaxed text-on-surface-variant mt-3 line-clamp-2" style={{ fontFamily: "'Inter', sans-serif" }}>{text}</p>
                      })()}
                      {features.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {features.map((f, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 text-on-surface bg-surface-container-low rounded-full" style={{ fontFamily: "'Inter', sans-serif" }}>{f}</span>
                          ))}
                        </div>
                      )}
                      <div className="mt-5 space-y-2">
                        <Link to={`/product/${p.id}`} className="w-full h-11 text-sm font-medium text-primary font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                          style={{ backgroundColor: '#CB202D', fontFamily: "'Inter', sans-serif" }}>
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_shopping_cart</span>
                          View Product
                        </Link>
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id) }}
                            className={`flex-1 h-10 text-xs font-medium transition-colors rounded-xl border ${wishlist.has(p.id) ? 'text-[#FF3B30] border-[#FF3B30] bg-[#FFEBEE]' : 'text-on-surface-variant border-glass-border hover:border-mint'}`}
                            style={{ fontFamily: "'Inter', sans-serif" }}>
                            <span className={`material-symbols-outlined !text-[16px] align-middle ${wishlist.has(p.id) ? 'text-[#FF3B30]' : ''}`}
                              style={{ fontVariationSettings: wishlist.has(p.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span> Wishlist
                          </button>
                          <button onClick={() => { handleAddToCart(p); navigate('/checkout/address') }} className="flex-1 h-10 text-xs font-medium flex items-center justify-center gap-1.5 text-white bg-primary hover:bg-primary-container transition-colors rounded-xl" style={{ fontFamily: "'Inter', sans-serif" }}>
                            <span className="material-symbols-outlined !text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="glass-card rounded-3xl p-6 text-center backdrop-blur-md" style={{
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                border: '1px solid rgba(217,222,229,0.5)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)',
              }}>
                <div className="text-on-surface-variant text-xs py-8" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span className="material-symbols-outlined text-3xl mb-3 block text-on-surface-variant">shopping_cart</span>
                  <p className="font-medium">Select a product</p>
                  <p className="mt-1 text-[10px]">to view details</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
      </main>

      <EcommerceFooter />

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileFilterOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-[380px] z-50 lg:hidden overflow-y-auto bg-white">
            <div className="flex items-center justify-between px-6 h-16 border-b border-glass-border">
              <span className="text-sm font-medium text-on-surface tracking-[0.1em] uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>Filters</span>
              <button onClick={() => setMobileFilterOpen(false)} className="text-on-surface-variant hover:text-mint transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div>
                <h4 className="text-xs tracking-[0.1em] uppercase text-on-surface font-medium mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Category</h4>
                <ul className="space-y-1.5">
                  {categories.map((cat: any) => (
                    <li key={cat.id}>
                      <Link
                        to={`/collection/${encodeURIComponent(cat.name)}`}
                        onClick={() => setMobileFilterOpen(false)}
                        className={`flex items-center justify-between text-sm py-2 transition-colors ${
                          cat.name === categoryName ? 'text-mint font-medium' : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs text-on-surface-variant">{cat.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-5 border-t border-glass-border">
                <h4 className="text-xs tracking-[0.1em] uppercase text-on-surface font-medium mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Price Range</h4>
                <div className="space-y-2">
                  {PRICE_RANGES.map((range, idx) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => handlePriceRange(activePriceRange === idx ? null : idx)}
                        className={`w-[18px] h-[18px] flex items-center justify-center transition-all rounded ${
                          activePriceRange === idx ? 'bg-mint' : 'border border-outline-variant'
                        }`}
                      >
                        {activePriceRange === idx && (
                          <span className="material-symbols-outlined !text-[14px] text-white">check</span>
                        )}
                      </div>
                      <span className={`text-sm ${activePriceRange === idx ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                        {range.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {availableBrands.length > 0 && (
                <div className="pt-5 border-t border-glass-border">
                  <h4 className="text-xs tracking-[0.1em] uppercase text-on-surface font-medium mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Brand</h4>
                  <div className="space-y-2">
                    {availableBrands.map((brand) => (
                      <label key={brand} className="flex items-center gap-3 cursor-pointer">
                        <div
                          onClick={() => toggleBrand(brand)}
                          className={`w-[18px] h-[18px] flex items-center justify-center transition-all rounded ${
                            brandFilter.includes(brand) ? 'bg-mint' : 'border border-outline-variant'
                          }`}
                        >
                          {brandFilter.includes(brand) && (
                            <span className="material-symbols-outlined !text-[14px] text-white">check</span>
                          )}
                        </div>
                        <span className={`text-sm ${brandFilter.includes(brand) ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                          {brand}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setMobileFilterOpen(false)} className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold transition-all active:scale-95 shadow-lg text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                Show Results
              </button>
              {hasActiveFilters && (
                <button
                  onClick={() => { setBrandFilter([]); setPriceMin(0); setPriceMax(Infinity); setRatingFilter(0); setActivePriceRange(null) }}
                  className="w-full text-xs tracking-[0.1em] uppercase text-on-surface-variant hover:text-mint transition-colors text-center"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .glass-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(203,32,45,0.3) !important;
          background: rgba(255,255,255,0.6) !important;
        }
        .floating { animation: float 6s ease-in-out infinite; }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes entrance {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .entrance {
          animation: entrance 0.8s cubic-bezier(0.23, 1, 0.32, 1) both;
        }
        .magnetic-btn { transition: transform 0.2s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

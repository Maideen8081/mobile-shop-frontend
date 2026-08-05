import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { categoryService } from '../services/categoryService'
import { productService } from '../services/productService'
import EcommerceFooter from '../components/ecommerce/Footer'
import { useToast } from '../context/ToastContext'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { addToCartWithAuth } from '../utils/cartAuth'
import DesktopPageLoader from '../components/ui/DesktopPageLoader'
import './CollectionPage.css'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 480%22 fill=%22%23f1eeeb%22%3E%3Crect width=%22400%22 height=%22480%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2218%22 fill=%22%2322C55E%22%3EProduct%3C/text%3E%3C/svg%3E'

const HERO_SLIDES = [
  { img: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=1920&q=80', eyebrow: 'Collections', title: 'Explore The Various Collection of PhoneFix', desc: "Don't miss out on shopping the collection from us — you'll not be let down." },
  { img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1920&q=80', eyebrow: 'Audio', title: 'Premium Headphones & TWS Earbuds', desc: 'Immersive sound with noise cancellation for all-day comfort.' },
  { img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1920&q=80', eyebrow: 'Smartphones', title: 'Latest Smartphones at Best Prices', desc: 'Refurbished & new phones with warranty you can trust.' },
  { img: 'https://images.unsplash.com/photo-1592890288564-76628a30a657?w=1920&q=80', eyebrow: 'Accessories', title: 'Accessories & Enhancements', desc: 'Fast chargers, cases, power banks and more for every device.' },
]

let cachedCategories: { id: any; name: string; count: number }[] | null = null
let cachedProducts: Record<string, { items: any[]; hasMore: boolean; total: number }> = {}

const SORT_OPTIONS = [
  { value: 'popular', label: 'Sort by: Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
]

const PRICE_RANGES = [
  { label: 'Under ₹10,000', min: 0, max: 10000 },
  { label: '₹10,000 – ₹30,000', min: 10000, max: 30000 },
  { label: '₹30,000 – ₹60,000', min: 30000, max: 60000 },
  { label: 'Over ₹60,000', min: 60000, max: Infinity },
]

const PAGE_SIZE = 20


function getProductPrice(product: any): { current: number; old: number | null } {
  const v = product.variants?.[0]
  if (!v) return { current: product.min_price || 0, old: null }
  let rawPrice = v.discount_price || v.discountPrice || v.price || product.min_price || 0
  if (!rawPrice || rawPrice === 0) {
    rawPrice = v.mrp || v.original_price || v.originalPrice || product.min_price || 0
  }
  const price = isNaN(Number(rawPrice)) ? 0 : Number(rawPrice)
  const rawOld = v.price || v.mrp || v.original_price || v.originalPrice || 0
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

function getProductTags(product: any): string[] {
  const tags: string[] = []
  if (product.is_trending || product.trending) tags.push('Trending')
  if (product.is_new_arrival || product.new_arrival) tags.push('New')
  if (product.is_best_selling || product.best_selling) tags.push('Best Seller')
  if (product.is_featured || product.featured) tags.push('Featured')
  return tags
}

function getProductDesc(product: any): string {
  const desc = product.description
  const text = typeof desc === 'string' ? desc : Array.isArray(desc) ? desc.join(' ') : ''
  if (!text) return product.model_number || product.model || ''
  return text.length > 72 ? text.slice(0, 72) + '…' : text
}

function getTabParams(activeTab: string): Record<string, any> {
  switch (activeTab) {
    case 'new': return { is_new_arrival: true }
    case 'trending': return { is_trending: true }
    case 'popular': return { is_featured: true }
    default: return {}
  }
}

const SORT_MAP: Record<string, string> = {
  'newest': '-created',
  'price-asc': 'price',
  'price-desc': '-price',
  'popular': '-rating',
}

function ProductCard(props: {
  product: any
  liked: boolean
  onWishlist: (e: React.MouseEvent) => void
  onAddToCart: (e: React.MouseEvent) => void
  badge?: string
}) {
  const navigate = useNavigate()
  const { product, liked, onWishlist, onAddToCart, badge } = props
  const tag = badge || getProductTags(product)[0] || ''

  return (
    <div className="wx-product-card">
      <Link to={`/product/${product.id}`} className="wx-product-media">
        <img src={getProductImage(product)} alt={getProductName(product)} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }} />
        {tag && <span className="wx-product-tag">{tag}</span>}
        <div className="wx-product-actions">
          <button
            className={`wx-act-btn ${liked ? 'wx-liked' : ''}`}
            aria-label="Add to wishlist"
            onClick={(e) => { e.preventDefault(); onWishlist(e) }}
          >
            <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
          </button>
          <button className="wx-act-btn" aria-label="Quick view" onClick={(e) => { e.preventDefault(); navigate(`/product/${product.id}`) }}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /></svg>
          </button>
        </div>
      </Link>
      <div className="wx-product-info">
        <h4>{getProductName(product)}</h4>
        <p>{getProductDesc(product)}</p>
        <div className="wx-product-bottom">
          <div className="wx-mini-actions">
            <button
              className={`wx-act-btn ${liked ? 'wx-liked' : ''}`}
              aria-label="Add to wishlist"
              onClick={(e) => { e.stopPropagation(); onWishlist(e) }}
            >
              <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
            </button>
            <button className="wx-act-btn" aria-label="Add to cart" onClick={(e) => { e.stopPropagation(); onAddToCart(e) }}>
              <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CollectionPage() {
  const navigate = useNavigate()
  const { show: showToast } = useToast()
  const rawCategory = useParams<{ category: string }>().category || ''
  const categoryName = decodeURIComponent(rawCategory)
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'all'
  const searchQuery = searchParams.get('search') || ''

  const defaultCacheKey = `${categoryName}|${activeTab}|${searchQuery}|popular||any`

  const [allProducts, setAllProducts] = useState<any[]>(() => cachedProducts[defaultCacheKey]?.items || [])
  const [loading, setLoading] = useState(() => !cachedProducts[defaultCacheKey])
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(() => cachedProducts[defaultCacheKey]?.hasMore || false)
  const [totalCount, setTotalCount] = useState(() => cachedProducts[defaultCacheKey]?.total || 0)
  const [sortBy, setSortBy] = useState('popular')
  const [brandFilter, setBrandFilter] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [wishlist, setWishlist] = useState<Set<number>>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('wishlist') || '[]')
      return new Set<number>(stored)
    } catch { return new Set<number>() }
  })
   const [categories, setCategories] = useState<any[]>(() => cachedCategories || [])
   const [filterOpen, setFilterOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const [sortOpen, setSortOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)
  const filtersApplied = useRef(false)

  useLockBodyScroll(filterOpen)

  useEffect(() => {
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % HERO_SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

   useEffect(() => {
     const onClick = (e: MouseEvent) => {
       if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
     }
     document.addEventListener('mousedown', onClick)
     return () => document.removeEventListener('mousedown', onClick)
   }, [])

  useEffect(() => {
    if (cachedCategories) { setCategories(cachedCategories); return }
    categoryService.list().then((cats) => {
      const mapped = cats
        .filter((c: any) => c.status === 'active')
        .map((c: any) => ({ id: c.id, name: c.name, count: typeof c.products === 'number' ? c.products : 0 }))
      cachedCategories = mapped
      setCategories(mapped)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setBrandFilter([])
    setPriceRange(null)
    setSortBy('popular')
  }, [categoryName, activeTab, searchQuery])

  useEffect(() => {
    setAllProducts([])
    setPage(1)
    setHasMore(false)
    if (categoryName) {
      setLoading(true)
      loadProducts(1, true)
    }
  }, [categoryName, activeTab, searchQuery])

  useEffect(() => {
    if (!filtersApplied.current) { filtersApplied.current = true; return }
    setAllProducts([])
    setPage(1)
    setHasMore(false)
    if (categoryName) {
      setLoading(true)
      loadProducts(1, true)
    }
  }, [brandFilter, priceRange, sortBy])

  async function fetchPage(pageNum: number): Promise<{ items: any[]; next: string | null; count: number }> {
    const params: Record<string, any> = {
      ...getTabParams(activeTab),
      page: pageNum,
      page_size: PAGE_SIZE,
    }
    if (categoryName && categoryName !== 'all') {
      params.category = categoryName
    }
    if (brandFilter.length > 0) {
      params.brand = brandFilter.join(',')
    }
    if (priceRange) {
      if (priceRange.min > 0) params.price_min = priceRange.min
      if (priceRange.max < Infinity) params.price_max = priceRange.max
    }
    if (searchQuery) params.search = searchQuery
    params.ordering = SORT_MAP[sortBy] || '-created'
    const result = await productService.listPaginated(params)
    return {
      items: result.results || [],
      next: result.next,
      count: result.count || result.results?.length || 0,
    }
  }

  async function loadProducts(pageNum: number, reset = false) {
    const cacheKey = `${categoryName}|${activeTab}|${searchQuery}|${sortBy}|${brandFilter.join(',')}|${priceRange ? `${priceRange.min}-${priceRange.max}` : 'any'}`
    if (reset) {
      const cached = cachedProducts[cacheKey]
      if (cached) {
        setAllProducts(cached.items)
        setHasMore(cached.hasMore)
        setTotalCount(cached.total)
        setPage(1)
        setLoading(false)
        return
      }
      if (allProducts.length === 0) setLoading(true)
    } else {
      setLoadingMore(true)
    }
    try {
      const result = await fetchPage(pageNum)
      const items = result.items
      if (reset) {
        setAllProducts(items)
        cachedProducts[cacheKey] = { items, hasMore: result.next !== null, total: result.count }
      } else {
        setAllProducts((prev) => [...prev, ...items])
      }
      setHasMore(result.next !== null)
      setTotalCount(result.count)
      setPage(pageNum)
    } catch (err: any) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const availableBrands = Array.from(new Set<string>(allProducts.map((p: any) => p.brand).filter(Boolean))).sort()

  const toggleBrand = (brand: string) => {
    setBrandFilter((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    )
  }

  const clearBrands = () => setBrandFilter([])
  const clearPrice = () => setPriceRange(null)

  const toggleWishlist = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
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

  const handleAddToCart = async (e: React.MouseEvent, product: any) => {
    e.stopPropagation()
    const price = getProductPrice(product).current
    const image = getProductImage(product)
    const name = getProductName(product)
    const added = await addToCartWithAuth({
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
    if (added) showToast(`${name} added to cart`, 'success')
  }

   const scrollToGrid = () => {
     const el = gridRef.current
     if (!el) return
    const nav = document.querySelector('.wx-header') as HTMLElement | null
    const navH = nav?.offsetHeight || 0
     const y = el.getBoundingClientRect().top + window.scrollY - navH - 16
     window.scrollTo({ top: y, behavior: 'smooth' })
   }

   const title = categoryName === 'all' || !categoryName ? 'All Products' : categoryName
   const shownCount = allProducts.length

   if (loading) {
     return (
       <>
         <SiteTopNav />
         <DesktopPageLoader text="Loading products..." />
       </>
     )
   }

   return (
       <>
       <SiteTopNav />
       <div className="wx-page">

      <div className="wx-page-head">
        <div className="wx-breadcrumb">
          <Link to="/">Home</Link>
          <span className="wx-sep">/</span>
          <Link to="/collection/all">Products</Link>
          <span className="wx-sep">/</span>
          <span className="wx-current">{title}</span>
        </div>
        <h2>{title}</h2>
      </div>

      <section className="wx-hero">
        <div className="wx-hero-inner">
          {HERO_SLIDES.map((s, i) => (
            <div key={i} className={`wx-hero-slide ${i === currentSlide ? 'active' : ''}`}>
              <img src={s.img} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          ))}
          <div className="wx-hero-shade" />
          <div className="wx-hero-text">
            <div className="wx-hero-eyebrow">{HERO_SLIDES[currentSlide].eyebrow}</div>
            <h1>{HERO_SLIDES[currentSlide].title}</h1>
            <p>{HERO_SLIDES[currentSlide].desc}</p>
            <button className="wx-hero-cta" onClick={scrollToGrid}>
              Shop the collection
              <svg viewBox="0 0 24 24"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
            </button>
          </div>
          <div className="wx-hero-dots">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                className={`wx-hero-dot ${i === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <div className={`wx-filters-backdrop ${filterOpen ? 'wx-open' : ''}`} onClick={() => setFilterOpen(false)} />

      <div className="wx-layout">
        <aside className={`wx-filters ${filterOpen ? 'wx-open' : ''}`}>
          <div className="wx-filter-block">
            <div className="wx-filter-head">
              <h3>Brand</h3>
              <button className="wx-filter-reset" onClick={clearBrands}>Reset</button>
            </div>
            {availableBrands.slice(0, 6).map((brand) => (
              <div key={brand} className={`wx-filter-item ${brandFilter.includes(brand) ? 'wx-checked' : ''}`}>
                <label>
                  <input type="checkbox" checked={brandFilter.includes(brand)} onChange={() => toggleBrand(brand)} />
                  {brand}
                </label>
              </div>
            ))}
            {availableBrands.length > 6 && (
              <button className="wx-show-more-btn" onClick={() => availableBrands.slice(6).forEach((b) => setBrandFilter((prev) => prev.includes(b) ? prev : [...prev, b]))}>
                Show more
              </button>
            )}
          </div>

          <div className="wx-filter-block">
            <div className="wx-filter-head">
              <h3>Category</h3>
              <button className="wx-filter-reset" onClick={() => navigate('/collection/all')}>Reset</button>
            </div>
            <div className={`wx-filter-item ${categoryName === 'all' || !categoryName ? 'wx-checked' : ''}`}>
              <label>
                <input type="checkbox" checked={categoryName === 'all' || !categoryName} onChange={() => navigate('/collection/all')} />
                All Products
              </label>
            </div>
            {categories.map((c) => {
              const isActive = categoryName.toLowerCase() === c.name.toLowerCase()
              return (
                <div key={c.id} className={`wx-filter-item ${isActive ? 'wx-checked' : ''}`}>
                  <label>
                    <input type="checkbox" checked={isActive} onChange={() => navigate(`/collection/${encodeURIComponent(c.name)}`)} />
                    {c.name}
                  </label>
                  <span className="wx-count">({c.count})</span>
                </div>
              )
            })}
          </div>

          <div className="wx-filter-block">
            <div className="wx-filter-head">
              <h3>Price</h3>
              <button className="wx-filter-reset" onClick={clearPrice}>Reset</button>
            </div>
            {PRICE_RANGES.map((range) => {
              const active = priceRange !== null && priceRange.min === range.min && priceRange.max === range.max
              return (
                <div key={range.label} className={`wx-filter-item ${active ? 'wx-checked' : ''}`}>
                  <label>
                    <input type="radio" name="wx-price" checked={active} onChange={() => setPriceRange(active ? null : range)} />
                    {range.label}
                  </label>
                </div>
              )
            })}
          </div>
        </aside>

        <main>
          <button className="wx-filter-toggle-mobile" onClick={() => setFilterOpen(true)}>
            <svg viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
            Filters
          </button>

          <div className="wx-grid-toolbar">
            <div className="wx-result-count">
              {totalCount > 0 ? `Showing ${shownCount} of ${totalCount} products` : `${shownCount} products found`}
            </div>
            <div className="wx-sort" ref={sortRef}>
              <button
                className={`wx-sort-btn ${sortOpen ? 'open' : ''}`}
                onClick={() => setSortOpen((v) => !v)}
                aria-label="Sort products"
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
              >
                <svg className="wx-sort-icon" viewBox="0 0 24 24"><path d="M3 6h18M6 12h12M10 18h4" /></svg>
                <span className="wx-sort-label">{SORT_OPTIONS.find((o) => o.value === sortBy)?.label}</span>
                <svg className="wx-sort-caret" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {sortOpen && (
                <div className="wx-sort-menu" role="listbox">
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      className={`wx-sort-option ${sortBy === o.value ? 'active' : ''}`}
                      role="option"
                      aria-selected={sortBy === o.value}
                      onClick={() => { setSortBy(o.value); setSortOpen(false) }}
                    >
                      <span>{o.label}</span>
                      {sortBy === o.value && (
                        <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div ref={gridRef}>
            {allProducts.length === 0 ? (
              <div className="wx-empty">
                <h3>No products found</h3>
                <p>Try adjusting your filters or search</p>
              </div>
            ) : (
              <div className="wx-product-grid">
                {allProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    liked={wishlist.has(product.id)}
                    onWishlist={(e) => toggleWishlist(e, product.id)}
                    onAddToCart={(e) => handleAddToCart(e, product)}
                    badge={activeTab === 'new' ? 'New' : activeTab === 'trending' ? 'Trending' : activeTab === 'popular' ? 'Popular' : ''}
                  />
                ))}
              </div>
            )}
          </div>

          {hasMore && !loading && (
            <button className="wx-load-more" onClick={() => loadProducts(page + 1, false)} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          )}
        </main>
      </div>
      </div>

      <EcommerceFooter compact />
    </>
  )
}

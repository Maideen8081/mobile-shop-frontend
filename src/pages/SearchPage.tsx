import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, X, Clock, ArrowRight, TrendingUp, Sparkles, ShoppingCart, Heart, Eye } from 'lucide-react'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import { addToCartWithAuth } from '../utils/cartAuth'
import { useToast } from '../context/ToastContext'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import './SearchPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 480%22 fill=%22%23f1eeeb%22%3E%3Crect width=%22400%22 height=%22480%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2218%22 fill=%22%2322C55E%22%3EProduct%3C/text%3E%3C/svg%3E'

const HISTORY_KEY = 'search_history_v1'
const MAX_HISTORY = 5

const POPULAR_TERMS = [
  { term: 'iPhone', icon: '📱' },
  { term: 'Samsung', icon: '📱' },
  { term: 'Earbuds', icon: '🎧' },
  { term: 'Charger', icon: '⚡' },
  { term: 'Case', icon: '🛡️' },
  { term: 'Headphones', icon: '🎧' },
  { term: 'Screen Protector', icon: '🔲' },
  { term: 'Power Bank', icon: '🔋' },
]

const CATEGORY_ICONS: Record<string, string> = {
  Smartphones: '📱',
  Tablets: '📟',
  'Smart Watches': '⌚',
  'Earbuds (TWS)': '🎧',
  Headphones: '🎧',
  'Power Banks': '🔋',
  Chargers: '⚡',
  'Charging Cables': '🔌',
  'Mobile Cases & Covers': '🛡️',
  'Screen Protectors': '🔲',
}

function getImageUrl(path: string | null | undefined): string {
  if (!path) return FALLBACK_IMG
  if (path.startsWith('http') || path.startsWith('data:')) return path
  return `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function getProductImage(product: any): string {
  const raw = product.common_image || product.image || product.images?.[0] || product.thumbnail || ''
  return getImageUrl(raw)
}

function getProductPrice(product: any): { current: number; old: number | null; pct: number } {
  const v = product.variants?.[0]
  if (!v) return { current: product.min_price || 0, old: null, pct: 0 }
  let rawPrice = v.discount_price || v.discountPrice || v.price || product.min_price || 0
  if (!rawPrice || rawPrice === 0) rawPrice = v.mrp || v.original_price || v.originalPrice || product.min_price || 0
  const price = isNaN(Number(rawPrice)) ? 0 : Number(rawPrice)
  const rawOld = v.price || v.mrp || v.original_price || v.originalPrice || 0
  const old = rawOld > price ? Number(rawOld) : null
  const pct = old && old > price ? Math.round(((old - price) / old) * 100) : 0
  return { current: price, old, pct }
}

function getHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(terms: string[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(terms.slice(0, MAX_HISTORY)))
}

function addToHistory(term: string, current: string[]): string[] {
  const trimmed = term.trim()
  if (!trimmed) return current
  const next = [trimmed, ...current.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())]
  return next.slice(0, MAX_HISTORY)
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { show: showToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<number | undefined>(undefined)

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [history, setHistory] = useState<string[]>(() => getHistory())
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [recommended, setRecommended] = useState<any[]>([])
  const [wishlist, setWishlist] = useState<Set<number>>(new Set())
  const [hasSearched, setHasSearched] = useState(!!searchParams.get('q'))

  // Load categories & recommended on mount
  useEffect(() => {
    categoryService.list().then((cats) => {
      setCategories(cats.filter((c: any) => c.status === 'active'))
    }).catch(() => {})

    productService.list({ is_featured: true, page_size: 12 } as any).then((items) => {
      setRecommended(items || [])
    }).catch(() => {})

    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  // Load wishlist
  useEffect(() => {
    const load = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('wishlist') || '[]')
        setWishlist(new Set(Array.isArray(stored) ? stored.map((p: any) => p.id || p) : []))
      } catch { setWishlist(new Set()) }
    }
    load()
    window.addEventListener('wishlist-updated', load)
    return () => window.removeEventListener('wishlist-updated', load)
  }, [])

  // Debounced search
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setHasSearched(false)
      setLoading(false)
      return
    }
    setLoading(true)
    setHasSearched(true)
    window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      productService.search(q).then((r) => {
        setResults((r || []).slice(0, 40))
      }).catch(() => setResults([])).finally(() => setLoading(false))
    }, 300)
    return () => window.clearTimeout(debounceRef.current)
  }, [query])

  const runSearch = useCallback((term: string) => {
    setQuery(term)
    const next = addToHistory(term, history)
    setHistory(next)
    saveHistory(next)
    setSearchParams({ q: term }, { replace: true })
    inputRef.current?.focus()
  }, [history, setSearchParams])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) runSearch(query.trim())
  }

  const clearHistory = () => {
    setHistory([])
    saveHistory([])
  }

  const removeHistoryItem = (term: string) => {
    const next = history.filter((t) => t !== term)
    setHistory(next)
    saveHistory(next)
  }

  const toggleWishlist = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const stored: any[] = JSON.parse(localStorage.getItem('wishlist') || '[]')
    const exists = stored.findIndex((p: any) => (p.id || p) === id)
    if (exists >= 0) {
      stored.splice(exists, 1)
      showToast('Removed from wishlist', 'success')
    } else {
      stored.push({ id })
      showToast('Added to wishlist', 'success')
    }
    localStorage.setItem('wishlist', JSON.stringify(stored))
    setWishlist(new Set(stored.map((p: any) => p.id || p)))
    window.dispatchEvent(new Event('wishlist-updated'))
  }

  const addToCart = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const variant = product.variants?.[0]
    if (!variant) { showToast('No variant available', 'error'); return }
    const price = variant.discount_price || variant.discountPrice || variant.price || product.min_price || 0
    const image = getProductImage(product)
    const added = await addToCartWithAuth({
      productId: product.id,
      variationId: variant.id,
      quantity: 1,
      name: product.name,
      brand: product.brand || '',
      price,
      image,
      storage: variant.storage || '',
      ram: variant.ram || '',
      color: variant.color || '',
    })
    if (added) showToast('Added to cart', 'success')
  }

  return (
    <div className="sp-root">
      <SiteTopNav />

      {/* Hero search area */}
      <div className="sp-hero">
        <div className="sp-hero-bg" />
        <div className="sp-hero-content">
          <div className="sp-hero-eyebrow">
            <Sparkles size={14} />
            <span>Search & Discover</span>
          </div>
          <h1 className="sp-hero-title">
            FIND YOUR <span className="sp-hero-accent">PERFECT</span> GEAR
          </h1>
          <p className="sp-hero-sub">
            Search across smartphones, accessories, audio, and more
          </p>

          {/* Search bar */}
          <form onSubmit={handleSubmit} className="sp-search-wrap">
            <div className="sp-search-bar">
              <Search size={22} className="sp-search-icon" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, brands, categories..."
                className="sp-search-input"
                autoComplete="off"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(''); setSearchParams({}, { replace: true }) }} className="sp-clear-btn" aria-label="Clear">
                  <X size={18} />
                </button>
              )}
              <button type="submit" className="sp-search-btn">
                <span>Search</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="sp-body">
        {!hasSearched ? (
          /* ── Default view: history + categories + recommended ── */
          <>
            {/* Search history */}
            {history.length > 0 && (
              <section className="sp-section">
                <div className="sp-section-header">
                  <h2 className="sp-section-title">
                    <Clock size={18} />
                    Recent Searches
                  </h2>
                  <button onClick={clearHistory} className="sp-clear-all">Clear All</button>
                </div>
                <div className="sp-history-list">
                  {history.map((term) => (
                    <button key={term} onClick={() => runSearch(term)} className="sp-history-chip">
                      <Clock size={14} />
                      <span>{term}</span>
                      <span className="sp-history-remove" onClick={(e) => { e.stopPropagation(); removeHistoryItem(term) }}>
                        <X size={12} />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Popular searches */}
            <section className="sp-section">
              <div className="sp-section-header">
                <h2 className="sp-section-title">
                  <TrendingUp size={18} />
                  Popular Searches
                </h2>
              </div>
              <div className="sp-history-list">
                {POPULAR_TERMS.map((item) => (
                  <button key={item.term} onClick={() => runSearch(item.term)} className="sp-history-chip sp-popular">
                    <span>{item.icon}</span>
                    <span>{item.term}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Category grid */}
            {categories.length > 0 && (
              <section className="sp-section">
                <div className="sp-section-header">
                  <h2 className="sp-section-title">
                    <Sparkles size={18} />
                    Browse Categories
                  </h2>
                </div>
                <div className="sp-category-grid">
                  {categories.map((cat) => (
                    <Link key={cat.id} to={`/collection/${encodeURIComponent(cat.name.toLowerCase())}`} className="sp-category-card">
                      <div className="sp-category-icon">
                        {CATEGORY_ICONS[cat.name] || '📦'}
                      </div>
                      <span className="sp-category-name">{cat.name}</span>
                      <span className="sp-category-count">{cat.products || 0} items</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Recommended products */}
            {recommended.length > 0 && (
              <section className="sp-section">
                <div className="sp-section-header">
                  <h2 className="sp-section-title">
                    <Sparkles size={18} />
                    Recommended For You
                  </h2>
                  <Link to="/collection/all" className="sp-view-all">
                    View All <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="sp-product-grid">
                  {recommended.slice(0, 8).map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={i}
                      liked={wishlist.has(product.id)}
                      onWishlist={(e) => toggleWishlist(product.id, e)}
                      onAddToCart={(e) => addToCart(product, e)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          /* ── Search results view ── */
          <>
            <section className="sp-section">
              <div className="sp-section-header">
                <h2 className="sp-section-title">
                  <Search size={18} />
                  {loading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
                </h2>
              </div>

              {loading && (
                <div className="sp-loading">
                  <div className="sp-loading-spinner" />
                  <span>Searching products...</span>
                </div>
              )}

              {!loading && results.length === 0 && (
                <div className="sp-empty">
                  <div className="sp-empty-icon">🔍</div>
                  <h3>No results found</h3>
                  <p>Try different keywords or browse our categories below</p>
                  <button onClick={() => { setQuery(''); setHasSearched(false); setSearchParams({}, { replace: true }) }} className="sp-search-again">
                    Clear Search
                  </button>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="sp-product-grid">
                  {results.map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={i}
                      liked={wishlist.has(product.id)}
                      onWishlist={(e) => toggleWishlist(product.id, e)}
                      onAddToCart={(e) => addToCart(product, e)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Show categories when no results */}
            {!loading && results.length === 0 && categories.length > 0 && (
              <section className="sp-section">
                <div className="sp-section-header">
                  <h2 className="sp-section-title">
                    <Sparkles size={18} />
                    Browse Categories
                  </h2>
                </div>
                <div className="sp-category-grid">
                  {categories.map((cat) => (
                    <Link key={cat.id} to={`/collection/${encodeURIComponent(cat.name.toLowerCase())}`} className="sp-category-card">
                      <div className="sp-category-icon">
                        {CATEGORY_ICONS[cat.name] || '📦'}
                      </div>
                      <span className="sp-category-name">{cat.name}</span>
                      <span className="sp-category-count">{cat.products || 0} items</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>


    </div>
  )
}

/* ── Product Card ── */
function ProductCard(props: {
  product: any
  index: number
  liked: boolean
  onWishlist: (e: React.MouseEvent) => void
  onAddToCart: (e: React.MouseEvent) => void
}) {
  const { product, index, liked, onWishlist, onAddToCart } = props
  const { current: price, old, pct } = getProductPrice(product)
  const [imgErr, setImageErr] = useState(false)
  const [hovered, setHovered] = useState(false)

  const tags: string[] = []
  if (product.is_new_arrival || product.newArrival) tags.push('New')
  if (product.is_best_selling || product.bestSelling) tags.push('Bestseller')
  if (product.is_featured || product.featured) tags.push('Featured')
  if (product.is_trending || product.trending) tags.push('Trending')
  if (pct > 0) tags.push(`${pct}% OFF`)

  return (
    <Link
      to={`/product/${product.id}`}
      className="sp-card"
      style={{ animationDelay: `${index * 60}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="sp-card-media">
        <img
          src={imgErr ? FALLBACK_IMG : getProductImage(product)}
          alt={product.name}
          loading="lazy"
          onError={() => setImageErr(true)}
          className={hovered ? 'sp-card-img-hover' : ''}
        />
        {tags.length > 0 && (
          <div className="sp-card-tags">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className={`sp-card-tag ${tag.includes('OFF') ? 'sp-tag-discount' : tag === 'New' ? 'sp-tag-new' : tag === 'Bestseller' ? 'sp-tag-best' : 'sp-tag-default'}`}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className={`sp-card-actions ${hovered ? 'sp-card-actions-visible' : ''}`}>
          <button onClick={onWishlist} className={`sp-card-action ${liked ? 'sp-card-action-active' : ''}`} aria-label="Wishlist">
            <Heart size={16} fill={liked ? '#e11d48' : 'none'} />
          </button>
          <button onClick={onAddToCart} className="sp-card-action" aria-label="Add to cart">
            <ShoppingCart size={16} />
          </button>
          <Link to={`/product/${product.id}`} className="sp-card-action" aria-label="Quick view" onClick={(e) => e.stopPropagation()}>
            <Eye size={16} />
          </Link>
        </div>
      </div>
      <div className="sp-card-info">
        <h4 className="sp-card-name">{product.name}</h4>
        {product.brand && <p className="sp-card-brand">{product.brand}</p>}
        <div className="sp-card-price-row">
          <span className="sp-card-price">{formatPrice(price)}</span>
          {old && <span className="sp-card-old-price">{formatPrice(old)}</span>}
          {pct > 0 && <span className="sp-card-discount">-{pct}%</span>}
        </div>
      </div>
    </Link>
  )
}

function formatPrice(n: number) {
  return n ? `₹${n.toLocaleString('en-IN')}` : '₹0'
}

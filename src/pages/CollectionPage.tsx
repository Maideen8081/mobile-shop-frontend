import { useEffect, useMemo, useRef, useState } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Filter,
  Heart,
  LayoutGrid,
  List,
  Smartphone,
  Sparkles,
  ShoppingCart,
  Tag,
} from 'lucide-react'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import { categoryService } from '../services/categoryService'
import { productService } from '../services/productService'
import { useToast } from '../context/ToastContext'
import { addToCartWithAuth } from '../utils/cartAuth'
import { isOutOfStock, requireSignInForWishlist } from '../utils/wishlist'
import '../components/ecommerce/WishCard.css'
import './CollectionView.css'
import { useBootHold } from '../components/LoadingScreen/bootLoader'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const FALLBACK_IMG = '/phones/ios-a.png'
const PAGE_SIZE = 12
const BRANDS_SHOWN = 5

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular', ordering: '-review_count' },
  { value: 'newest', label: 'Newest', ordering: '-created_at' },
  { value: 'price-asc', label: 'Price: Low to High', ordering: 'min_price' },
  { value: 'price-desc', label: 'Price: High to Low', ordering: '-min_price' },
]

const COLLECTION_TABS = [
  { value: 'all', label: 'All Products' },
  { value: 'new', label: 'New Arrivals' },
  { value: 'trending', label: 'Trending' },
  { value: 'popular', label: 'Featured' },
  { value: 'refurbished', label: 'Refurbished' },
]

const HERO_FEATURES = [
  { icon: Smartphone, label: 'Latest Models' },
  { icon: Tag, label: 'Best Prices' },
  { icon: CreditCard, label: 'No Cost EMI' },
  { icon: ArrowLeftRight, label: 'Exchange Offer', to: '/trade-in' },
]

/** Transparent product shots in /public used as hero art for each category. */
const HERO_ART: { keys: string[]; images: string[] }[] = [
  { keys: ['earbud', 'tws'], images: ['/products/earbuds-pro.png', '/products/earbuds-chrome.png'] },
  { keys: ['headphone', 'audio'], images: ['/products/headphones-anc.png', '/products/headphones-red.png'] },
  { keys: ['power bank', 'powerbank'], images: ['/products/powerbank.png'] },
  { keys: ['charger', 'cable', 'accessor'], images: ['/products/charger-20w.png', '/products/cable-c-lightning.png'] },
]
const DEFAULT_HERO_ART = ['/phones/ios-b.png', '/phones/ios-a.png']

function getTabParams(tab: string): Record<string, boolean> {
  if (tab === 'new') return { is_new_arrival: true }
  if (tab === 'trending') return { is_trending: true }
  if (tab === 'popular') return { is_featured: true }
  if (tab === 'refurbished') return { is_refurbished: true }
  return {}
}

function imageUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
  return `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function productImage(p: any): string {
  return imageUrl(p.coverImage || p.common_image || p.image || p.images?.[0] || p.thumbnail || p.variants?.[0]?.images?.[0]) || FALLBACK_IMG
}

/** Selling price + MRP; list responses often omit variants, so fall back to product prices. */
function priceOf(p: any): { price: number; mrp: number } {
  const v = p?.variants?.[0]
  const price =
    Number(v?.discountPrice) || Number(v?.price) || Number(p?.minPrice) || Number(p?.rawDiscountPrice) || Number(p?.price) || 0
  const mrp = Number(v?.price) || Number(p?.price) || price
  return { price, mrp: Math.max(mrp, price) }
}

function badgeOf(p: any, off: number): { label: string; kind: string } | null {
  if (p.bestSelling || p.is_best_selling) return { label: 'Bestseller', kind: 'best' }
  if (p.trending || p.is_trending) return { label: 'Trending', kind: 'trend' }
  if (p.newArrival || p.is_new_arrival) return { label: 'New', kind: 'new' }
  if (off >= 10) return { label: 'Deal', kind: 'deal' }
  return null
}

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

let cachedCategories: { id: number; name: string; count: number }[] | null = null
const pageCache: Record<string, { items: any[]; total: number }> = {}

/* ─────────────────────────── Product card ─────────────────────────── */

/** Wishlist-style card (styles in components/ecommerce/WishCard.css) with an icon cart button. */
function CollectionCard({
  product,
  liked,
  onToggleLike,
  onAdd,
}: {
  product: any
  liked: boolean
  onToggleLike: () => void
  onAdd: () => void
}) {
  const { price, mrp } = priceOf(product)
  const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0
  const badge = badgeOf(product, off)
  const name = String(product.name ?? product.product_name ?? '')
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0
  const stockKnown = hasVariants || typeof product.totalStock === 'number'
  const outOfStock = hasVariants ? isOutOfStock(product) : product.totalStock === 0
  const label = product.brand || badge?.label || ''
  const to = `/product/${product.id}`

  return (
    <article className="wish-card">
      <div className="wish-card-media">
        {badge && <span className="wish-card-tag">{badge.label}</span>}
        <Link to={to} className="wish-card-art-link" aria-label={`View ${name}`}>
          <div className="wish-card-art" aria-hidden="true">
            <img
              src={productImage(product)}
              alt=""
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG }}
            />
          </div>
        </Link>
        <button
          type="button"
          className={`wish-card-heart${liked ? '' : ' is-off'}`}
          onClick={onToggleLike}
          aria-pressed={liked}
          aria-label={liked ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
        >
          <Heart size={19} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          className="wish-card-quickcart"
          onClick={onAdd}
          disabled={outOfStock}
          aria-label={outOfStock ? `${name} is unavailable` : `Add ${name} to cart`}
          title={outOfStock ? 'Unavailable' : 'Add to cart'}
        >
          <ShoppingCart size={20} />
        </button>
      </div>
      <div className="wish-card-info">
        {label && <div className="wish-card-cat">{label}</div>}
        <h3 className="wish-card-name"><Link to={to}>{name}</Link></h3>
        <div className="wish-card-row">
          <span className="wish-card-price">{price > 0 ? inr(price) : 'View price'}</span>
          {off > 0 && (
            <span className="wish-card-was">
              <s>{inr(mrp)}</s>
              <span className="wish-card-off">{off}% off</span>
            </span>
          )}
          {stockKnown && (outOfStock ? (
            <span className="wish-card-stock is-out">Out of stock</span>
          ) : (
            <span className="wish-card-stock"><Check size={14} strokeWidth={2.6} /> In stock</span>
          ))}
        </div>
      </div>
    </article>
  )
}

function FilterGroup({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`cv-fgroup${open ? ' is-open' : ''}`}>
      <button type="button" className="cv-fgroup-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {title}
        <ChevronDown size={18} />
      </button>
      {open && <div className="cv-fgroup-body">{children}</div>}
    </div>
  )
}

function pageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('…')
  pages.push(total)
  return pages
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function CollectionPage() {
  const navigate = useNavigate()
  const { show: showToast } = useToast()
  const categoryName = decodeURIComponent(useParams<{ category: string }>().category || 'all')
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'all'
  const searchQuery = searchParams.get('search') || ''
  const scope = `${categoryName}|${activeTab}|${searchQuery}`

  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  useBootHold(loading)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('popular')
  const [brandFilter, setBrandFilter] = useState<string[]>([])
  const [price, setPrice] = useState<{ min: number; max: number } | null>(null)
  const [draft, setDraft] = useState<{ min: number; max: number } | null>(null)
  const [brandStats, setBrandStats] = useState<{ name: string; count: number }[]>([])
  const [priceCeil, setPriceCeil] = useState(150000)
  const [showAllBrands, setShowAllBrands] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sortOpen, setSortOpen] = useState(false)
  const [categories, setCategories] = useState(cachedCategories ?? [])
  const [wishlist, setWishlist] = useState<Set<number>>(() => {
    try { return new Set<number>(JSON.parse(localStorage.getItem('wishlist') || '[]')) } catch { return new Set() }
  })

  const sortRef = useRef<HTMLDivElement>(null)
  const brandRailRef = useRef<HTMLDivElement>(null)
  const gridTopRef = useRef<HTMLDivElement>(null)

  const isAll = categoryName === 'all' || !categoryName
  const title = isAll ? 'All Products' : categoryName
  usePageMeta({ title, description: `Shop ${isAll ? 'phones and accessories' : categoryName} at PhoneFix — genuine products, fast delivery and easy returns.` })

  /* Reset filters when the category / collection / search changes */
  useEffect(() => {
    setBrandFilter([])
    setPrice(null)
    setDraft(null)
    setSortBy('popular')
    setPage(1)
    setShowAllBrands(false)
  }, [scope])

  /* Categories for the sidebar */
  useEffect(() => {
    if (cachedCategories) return
    categoryService.list().then((cats) => {
      const mapped = cats
        .filter((c: any) => c.status === 'active')
        .map((c: any) => ({ id: c.id, name: c.name, count: typeof c.products === 'number' ? c.products : 0 }))
      cachedCategories = mapped
      setCategories(mapped)
    }).catch(() => {})
  }, [])

  /* Brand counts and price ceiling for this category (one wider request) */
  useEffect(() => {
    let cancelled = false
    const params: Record<string, any> = { ...getTabParams(activeTab), page: 1, page_size: 100 }
    if (!isAll) params.category = categoryName
    if (searchQuery) params.search = searchQuery
    productService.listPaginated(params).then(({ results }) => {
      if (cancelled) return
      const counts = new Map<string, number>()
      let max = 0
      for (const p of results) {
        if (p.brand) counts.set(p.brand, (counts.get(p.brand) || 0) + 1)
        max = Math.max(max, priceOf(p).mrp)
      }
      setBrandStats(Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count))
      setPriceCeil(max > 0 ? Math.ceil(max / 10000) * 10000 : 150000)
    }).catch(() => { if (!cancelled) setBrandStats([]) })
    return () => { cancelled = true }
  }, [scope]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Products for the current page */
  useEffect(() => {
    let cancelled = false
    const ordering = SORT_OPTIONS.find((o) => o.value === sortBy)?.ordering || '-created_at'
    const key = `${scope}|${sortBy}|${brandFilter.join(',')}|${price ? `${price.min}-${price.max}` : 'any'}|${page}`
    const cached = pageCache[key]
    if (cached) {
      setItems(cached.items)
      setTotal(cached.total)
      setLoading(false)
      return
    }
    setLoading(true)
    const params: Record<string, any> = { ...getTabParams(activeTab), page, page_size: PAGE_SIZE, ordering }
    if (!isAll) params.category = categoryName
    if (brandFilter.length) params.brand = brandFilter.join(',')
    if (price) {
      if (price.min > 0) params.price_min = price.min
      if (price.max < priceCeil) params.price_max = price.max
    }
    if (searchQuery) params.search = searchQuery
    productService.listPaginated(params)
      .then(({ results, count }) => {
        if (cancelled) return
        const t = count || results.length
        pageCache[key] = { items: results, total: t }
        setItems(results)
        setTotal(t)
      })
      .catch(() => { if (!cancelled) { setItems([]); setTotal(0) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [scope, sortBy, brandFilter, price, page]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Apply the price slider shortly after the shopper stops dragging */
  useEffect(() => {
    if (!draft) return
    const t = window.setTimeout(() => {
      const full = draft.min <= 0 && draft.max >= priceCeil
      setPrice(full ? null : draft)
      setPage(1)
    }, 450)
    return () => window.clearTimeout(t)
  }, [draft, priceCeil])

  useEffect(() => {
    if (!sortOpen) return
    const onDown = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [sortOpen])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const range = draft ?? price ?? { min: 0, max: priceCeil }
  const heroArt = useMemo(() => {
    const n = categoryName.toLowerCase()
    return HERO_ART.find((a) => a.keys.some((k) => n.includes(k)))?.images ?? DEFAULT_HERO_ART
  }, [categoryName])

  const toggleBrand = (brand: string) => {
    setBrandFilter((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]))
    setPage(1)
  }

  const clearAll = () => {
    setBrandFilter([])
    setPrice(null)
    setDraft(null)
    setPage(1)
    if (activeTab !== 'all') setSearchParams({})
  }

  const scrollToGrid = () => {
    const el = gridTopRef.current
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 200, behavior: 'smooth' })
  }

  const goToPage = (n: number) => {
    if (n < 1 || n > totalPages || n === page) return
    setPage(n)
    scrollToGrid()
  }

  const toggleWishlist = (id: number) => {
    if (!requireSignInForWishlist(navigate)) return
    setWishlist((prev) => {
      const next = new Set(prev)
      const added = !next.has(id)
      if (added) next.add(id)
      else next.delete(id)
      try { localStorage.setItem('wishlist', JSON.stringify(Array.from(next))) } catch { /* storage blocked */ }
      window.dispatchEvent(new Event('wishlist-updated'))
      showToast(added ? 'Added to wishlist' : 'Removed from wishlist', 'success')
      return next
    })
  }

  const addToCart = async (product: any) => {
    const v = product?.variants?.[0]
    const name = String(product.name ?? '')
    try {
      const ok = await addToCartWithAuth({
        productId: Number(product.id),
        variationId: Number(v?.dbId ?? v?.id) || 0,
        quantity: 1,
        name,
        brand: product.brand || '',
        price: priceOf(product).price,
        image: productImage(product),
        storage: v?.storage || '',
        ram: v?.ram || '',
        color: v?.color || '',
      })
      if (ok) showToast(`${name} added to cart`, 'success')
    } catch (err: any) {
      showToast(err?.message || 'Failed to add to cart', 'error')
    }
  }

  const railScroll = (dir: 1 | -1) => brandRailRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  const shownBrands = showAllBrands ? brandStats : brandStats.slice(0, BRANDS_SHOWN)
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label

  return (
    <div className="cv">
      <SiteTopNav />

      <main className="cv-wrap">
        {/* ── Hero ── */}
        <section className="cv-hero">
          <div className="cv-hero-copy">
            <span className="cv-pill">{title} Collection</span>
            {isAll ? (
              <h1>
                Every Phone &amp; Accessory
                <br />
                <span>in One Place</span>
              </h1>
            ) : (
              <h1>
                Latest {title}
                <br />
                <span>for Every Need</span>
              </h1>
            )}
            <p>Top brands, new launches and the best deals — only at PhoneFix.</p>
            <div className="cv-hero-actions">
              <button type="button" className="cv-btn cv-btn-dark" onClick={scrollToGrid}>
                Shop Now <ArrowRight size={18} />
              </button>
              <Link to="/trade-in" className="cv-btn cv-btn-ghost">
                <ArrowLeftRight size={18} /> Exchange Offer
              </Link>
            </div>
          </div>
          <div className="cv-hero-art" aria-hidden="true">
            <span className="cv-hero-orb" />
            {heroArt.map((src, i) => (
              <img key={src} src={src} alt="" className={`cv-hero-img cv-hero-img-${i}`} />
            ))}
          </div>
          <ul className="cv-hero-features">
            {HERO_FEATURES.map(({ icon: Icon, label, to }) => (
              <li key={label}>
                {to ? (
                  <Link to={to}><Icon size={20} /> {label}</Link>
                ) : (
                  <span><Icon size={20} /> {label}</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Shop by Brand ── */}
        {brandStats.length > 0 && (
          <section className="cv-brands">
            <h2>Shop by Brand</h2>
            <button type="button" className="cv-rail-btn" onClick={() => railScroll(-1)} aria-label="Scroll brands left">
              <ChevronLeft size={20} />
            </button>
            <div className="cv-brand-rail" ref={brandRailRef}>
              {brandStats.map(({ name }) => {
                const on = brandFilter.includes(name)
                return (
                  <button
                    key={name}
                    type="button"
                    className={`cv-brand${on ? ' is-on' : ''}`}
                    onClick={() => toggleBrand(name)}
                    aria-pressed={on}
                  >
                    <span className="cv-brand-mark">{name.charAt(0)}</span>
                    {name}
                  </button>
                )
              })}
            </div>
            <button type="button" className="cv-rail-btn" onClick={() => railScroll(1)} aria-label="Scroll brands right">
              <ChevronRight size={20} />
            </button>
          </section>
        )}

        {/* ── Title + toolbar ── */}
        <div className="cv-titlebar" ref={gridTopRef}>
          <h2>
            {title}
            {!loading && <span className="cv-count">{total} Product{total === 1 ? '' : 's'}</span>}
          </h2>
          <div className="cv-tools">
            <div className="cv-sort" ref={sortRef}>
              <button
                type="button"
                className="cv-sort-btn"
                onClick={() => setSortOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
              >
                <span>Sort by: <b>{sortLabel}</b></span>
                <ChevronDown size={18} />
              </button>
              {sortOpen && (
                <ul className="cv-sort-menu" role="listbox">
                  {SORT_OPTIONS.map((o) => (
                    <li key={o.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={sortBy === o.value}
                        onClick={() => { setSortBy(o.value); setPage(1); setSortOpen(false) }}
                      >
                        {o.label}
                        {sortBy === o.value && <Check size={16} />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="cv-view" role="group" aria-label="Layout">
              <button type="button" className={view === 'grid' ? 'is-on' : ''} onClick={() => setView('grid')} aria-label="Grid view" aria-pressed={view === 'grid'}>
                <LayoutGrid size={20} />
              </button>
              <button type="button" className={view === 'list' ? 'is-on' : ''} onClick={() => setView('list')} aria-label="List view" aria-pressed={view === 'list'}>
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="cv-layout">
          {/* ── Filters ── */}
          <aside className="cv-filters" aria-label="Filters">
            <div className="cv-filters-head">
              <h3><Filter size={20} /> Filters</h3>
              <button type="button" onClick={clearAll}>Clear All</button>
            </div>

            {brandStats.length > 0 && (
              <FilterGroup title="Brand">
                {shownBrands.map(({ name, count }) => (
                  <label key={name} className="cv-check">
                    <input type="checkbox" checked={brandFilter.includes(name)} onChange={() => toggleBrand(name)} />
                    <span className="cv-box"><Check size={13} strokeWidth={3} /></span>
                    <span className="cv-check-label">{name}</span>
                    <span className="cv-check-count">({count})</span>
                  </label>
                ))}
                {brandStats.length > BRANDS_SHOWN && (
                  <button type="button" className="cv-more" onClick={() => setShowAllBrands((s) => !s)}>
                    {showAllBrands ? '− Show Less' : '+ Show More'}
                  </button>
                )}
              </FilterGroup>
            )}

            <FilterGroup title="Price Range">
              <div className="cv-range">
                <div
                  className="cv-range-fill"
                  style={{
                    left: `${(range.min / priceCeil) * 100}%`,
                    right: `${100 - (range.max / priceCeil) * 100}%`,
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={priceCeil}
                  step={1000}
                  value={range.min}
                  onChange={(e) => setDraft({ min: Math.min(Number(e.target.value), range.max - 1000), max: range.max })}
                  aria-label="Minimum price"
                />
                <input
                  type="range"
                  min={0}
                  max={priceCeil}
                  step={1000}
                  value={range.max}
                  onChange={(e) => setDraft({ min: range.min, max: Math.max(Number(e.target.value), range.min + 1000) })}
                  aria-label="Maximum price"
                />
              </div>
              <div className="cv-range-inputs">
                <label>
                  <span>₹</span>
                  <input
                    type="number"
                    min={0}
                    max={range.max}
                    value={range.min}
                    onChange={(e) => setDraft({ min: Math.max(0, Number(e.target.value) || 0), max: range.max })}
                    aria-label="Minimum price in rupees"
                  />
                </label>
                <i>–</i>
                <label>
                  <span>₹</span>
                  <input
                    type="number"
                    min={range.min}
                    max={priceCeil}
                    value={range.max}
                    onChange={(e) => setDraft({ min: range.min, max: Math.min(priceCeil, Number(e.target.value) || priceCeil) })}
                    aria-label="Maximum price in rupees"
                  />
                </label>
              </div>
            </FilterGroup>

            <FilterGroup title="Collection">
              {COLLECTION_TABS.map((t) => (
                <label key={t.value} className="cv-check is-radio">
                  <input
                    type="radio"
                    name="cv-collection"
                    checked={activeTab === t.value}
                    onChange={() => setSearchParams(t.value === 'all' ? {} : { tab: t.value })}
                  />
                  <span className="cv-box" />
                  <span className="cv-check-label">{t.label}</span>
                </label>
              ))}
            </FilterGroup>

            <FilterGroup title="Category" defaultOpen={false}>
              <label className="cv-check is-radio">
                <input type="radio" name="cv-cat" checked={isAll} onChange={() => navigate('/collection/all')} />
                <span className="cv-box" />
                <span className="cv-check-label">All Products</span>
              </label>
              {categories.map((c) => (
                <label key={c.id} className="cv-check is-radio">
                  <input
                    type="radio"
                    name="cv-cat"
                    checked={categoryName.toLowerCase() === c.name.toLowerCase()}
                    onChange={() => navigate(`/collection/${encodeURIComponent(c.name)}`)}
                  />
                  <span className="cv-box" />
                  <span className="cv-check-label">{c.name}</span>
                  <span className="cv-check-count">({c.count})</span>
                </label>
              ))}
            </FilterGroup>
          </aside>

          {/* ── Products ── */}
          <section aria-busy={loading} aria-label={`${title} products`}>
            {loading ? (
              <div className={`cv-grid is-${view}`}>
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="cv-skel" aria-hidden="true">
                    <div className="cv-sk cv-sk-img" />
                    <div className="cv-sk cv-sk-line" />
                    <div className="cv-sk cv-sk-line short" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="cv-empty">
                <Sparkles size={32} />
                <h3>No products found</h3>
                <p>Try removing a filter or choosing another category.</p>
                <button type="button" className="cv-btn cv-btn-dark" onClick={clearAll}>Clear filters</button>
              </div>
            ) : (
              <div className={`cv-grid is-${view}`}>
                {items.map((p) => (
                  <CollectionCard
                    key={p.id}
                    product={p}
                    liked={wishlist.has(Number(p.id))}
                    onToggleLike={() => toggleWishlist(Number(p.id))}
                    onAdd={() => addToCart(p)}
                  />
                ))}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <nav className="cv-pages" aria-label="Pagination">
                <button type="button" onClick={() => goToPage(page - 1)} disabled={page === 1} aria-label="Previous page">
                  <ChevronLeft size={20} />
                </button>
                {pageList(page, totalPages).map((n, i) =>
                  n === '…' ? (
                    <span key={`gap-${i}`} className="cv-gap">…</span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      className={n === page ? 'is-on' : ''}
                      onClick={() => goToPage(n)}
                      aria-current={n === page ? 'page' : undefined}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button type="button" onClick={() => goToPage(page + 1)} disabled={page === totalPages} aria-label="Next page">
                  <ChevronRight size={20} />
                </button>
              </nav>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

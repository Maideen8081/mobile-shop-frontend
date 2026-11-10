import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  BadgeCheck, ChevronDown, ChevronLeft, ChevronRight, Filter, Heart, Home, LayoutGrid, List,
  Search, SearchX, ShieldCheck, ShoppingCart, SlidersHorizontal, Star, X, Zap,
} from 'lucide-react'
import { productService } from '../services/productService'
import { addToCartWithAuth } from '../utils/cartAuth'
import {
  cartParams, getProductImage, pickVariant, readWishlistIds, requireSignInForWishlist, writeWishlistIds,
} from '../utils/wishlist'
import { useToast } from '../context/ToastContext'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import './SearchPage.css'

const PAGE_SIZE = 12
const POPULAR = ['iPhone', 'Samsung', 'Earbuds', 'Charger', 'Smart Watch', 'Power Bank', 'Headphones', 'Case']

type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'discount' | 'newest'
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'discount', label: 'Biggest Discount' },
  { key: 'newest', label: 'Newest First' },
]

type HighlightKey = 'offer' | 'bestseller' | 'new' | 'trending' | 'inStock'
const HIGHLIGHTS: { key: HighlightKey; label: string }[] = [
  { key: 'offer', label: 'On Offer' },
  { key: 'bestseller', label: 'Bestsellers' },
  { key: 'new', label: 'New Arrivals' },
  { key: 'trending', label: 'Trending' },
  { key: 'inStock', label: 'In Stock' },
]

/* ---------- Product helpers ---------- */

interface Variant {
  id: string | number
  isActive?: boolean
  price?: number
  discountPrice?: number
  stock?: number
}

/** Product as returned by productService (normalized). */
interface SearchProduct {
  id: number
  name?: string
  brand?: string
  category?: string
  coverImage?: string | null
  images?: string[]
  variants?: Variant[]
  minPrice?: number
  rating?: number
  created?: string
  bestSelling?: boolean
  newArrival?: boolean
  trending?: boolean
}

interface Item {
  raw: SearchProduct
  id: number
  name: string
  brand: string
  category: string
  image: string
  price: number
  mrp: number | null
  off: number
  rating: number
  inStock: boolean
  created: number
  flags: Record<HighlightKey, boolean>
}

function toItem(p: SearchProduct): Item {
  const active = (p.variants || []).filter((v) => v.isActive !== false)
  const v: Variant | undefined = pickVariant(p) || active[0]
  let price = Number(p.minPrice) || 0
  let mrp: number | null = null
  if (v) {
    const sale = Number(v.discountPrice) > 0 ? Number(v.discountPrice) : Number(v.price) || 0
    if (sale > 0) price = sale
    if (Number(v.price) > price) mrp = Number(v.price)
  }
  const off = mrp ? Math.round(((mrp - price) / mrp) * 100) : 0
  const inStock = active.some((x) => Number(x.stock) > 0)
  return {
    raw: p,
    id: Number(p.id),
    name: p.name || '',
    brand: (p.brand || '').trim(),
    category: (p.category || '').trim(),
    image: getProductImage({ ...p, image: p.coverImage || undefined }),
    price,
    mrp,
    off,
    rating: Number(p.rating) || 0,
    inStock,
    created: Date.parse(p.created || '') || 0,
    flags: { offer: off > 0, bestseller: !!p.bestSelling, new: !!p.newArrival, trending: !!p.trending, inStock },
  }
}

function relevance(item: Item, q: string): number {
  const name = item.name.toLowerCase()
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  let score = 0
  if (name.includes(q.toLowerCase())) score += 50
  if (name.startsWith(words[0] || '')) score += 10
  for (const w of words) {
    if (name.includes(w)) score += 8
    if (item.brand.toLowerCase().includes(w)) score += 5
    if (item.category.toLowerCase().includes(w)) score += 4
  }
  if (item.inStock) score += 6
  if (item.flags.bestseller) score += 3
  return score
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const titleCase = (s: string) => s.replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1))
const countBy = (items: Item[], key: (i: Item) => string) => {
  const m = new Map<string, number>()
  for (const i of items) {
    const k = key(i)
    if (k) m.set(k, (m.get(k) || 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}
const toggleIn = <T,>(set: Set<T>, v: T) => {
  const next = new Set(set)
  if (next.has(v)) next.delete(v)
  else next.add(v)
  return next
}

/* ---------- Page ---------- */

export default function SearchPage() {
  const [params] = useSearchParams()
  const query = (params.get('q') || '').trim()
  const navigate = useNavigate()

  return (
    <div className="srp-root">
      <SiteTopNav />

      <div className="srp-container">
        <nav className="srp-crumbs" aria-label="Breadcrumb">
          <Link to="/home" aria-label="Home"><Home size={17} /></Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span>Search</span>
          {query && (
            <>
              <ChevronRight size={14} aria-hidden="true" />
              <strong>“{query}”</strong>
            </>
          )}
        </nav>

        {query
          ? <SearchResults key={query} query={query} />
          : <EmptySearch onPick={(t) => navigate(`/search?q=${encodeURIComponent(t)}`)} />}
      </div>
    </div>
  )
}

/** Results for one search. Keyed by the search text, so filters reset for each new search. */
function SearchResults({ query }: { query: string }) {
  const navigate = useNavigate()
  const toast = useToast()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const [cats, setCats] = useState<Set<string>>(new Set())
  const [brands, setBrands] = useState<Set<string>>(new Set())
  const [highlights, setHighlights] = useState<Set<HighlightKey>>(new Set())
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null)
  const [sort, setSort] = useState<SortKey>('relevance')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [wishlist, setWishlist] = useState<Set<number>>(() => new Set(readWishlistIds()))
  const [adding, setAdding] = useState<number | null>(null)
  const resultsTop = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    productService
      .searchAll(query)
      .then((res: SearchProduct[]) => { if (!cancelled) setItems(res.map(toItem)) })
      .catch(() => { if (!cancelled) setFailed(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [query])

  useEffect(() => {
    const sync = () => setWishlist(new Set(readWishlistIds()))
    window.addEventListener('wishlist-updated', sync)
    return () => window.removeEventListener('wishlist-updated', sync)
  }, [])

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [filtersOpen])

  const bounds = useMemo<[number, number]>(() => {
    const prices = items.map((i) => i.price).filter((p) => p > 0)
    if (!prices.length) return [0, 0]
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]
  }, [items])
  const [minP, maxP] = priceRange ?? bounds

  const filtered = useMemo(() => {
    const list = items.filter((i) =>
      (!cats.size || cats.has(i.category)) &&
      (!brands.size || brands.has(i.brand)) &&
      [...highlights].every((h) => i.flags[h]) &&
      (!priceRange || (i.price >= priceRange[0] && i.price <= priceRange[1])),
    )
    const sorters: Record<SortKey, (a: Item, b: Item) => number> = {
      relevance: (a, b) => relevance(b, query) - relevance(a, query),
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      discount: (a, b) => b.off - a.off,
      newest: (a, b) => b.created - a.created,
    }
    return list.sort(sorters[sort])
  }, [items, cats, brands, highlights, priceRange, sort, query])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const activeCount = cats.size + brands.size + highlights.size + (priceRange ? 1 : 0)

  // Any filter change goes back to page 1.
  const withReset = <A extends unknown[]>(fn: (...a: A) => void) => (...a: A) => { fn(...a); setPage(1) }
  const clearAll = () => {
    setCats(new Set()); setBrands(new Set()); setHighlights(new Set()); setPriceRange(null); setPage(1)
  }

  const goToPage = (n: number) => {
    setPage(n)
    resultsTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toggleWishlist = (item: Item) => {
    if (!requireSignInForWishlist(navigate)) return
    const ids = readWishlistIds()
    const has = ids.includes(item.id)
    writeWishlistIds(has ? ids.filter((x) => x !== item.id) : [...ids, item.id])
    toast.show(has ? 'Removed from wishlist' : 'Added to wishlist', 'success')
  }

  const addToCart = async (item: Item) => {
    const params = cartParams(item.raw)
    if (!params.variationId) {
      toast.show('This product is out of stock right now.', 'error')
      return
    }
    setAdding(item.id)
    try {
      const ok = await addToCartWithAuth({ ...params, image: item.image })
      if (ok) toast.show(`${item.name} added to cart`, 'success')
    } catch (err) {
      toast.show(err instanceof Error && err.message ? err.message : 'Could not add to cart. Please try again.', 'error')
    } finally {
      setAdding(null)
    }
  }

  const heroItem = items.find((i) => i.inStock && !i.image.includes('unsplash')) || items[0]

  return (
          <div className="srp-layout">
            {/* ---------- Filters ---------- */}
            <div className={`srp-filters-backdrop ${filtersOpen ? 'is-open' : ''}`} onClick={() => setFiltersOpen(false)} />
            <aside className={`srp-filters ${filtersOpen ? 'is-open' : ''}`} aria-label="Filters">
              <div className="srp-filters__head">
                <h2><Filter size={19} /> Filters</h2>
                <div className="srp-filters__head-actions">
                  {activeCount > 0 && <button type="button" className="srp-link" onClick={clearAll}>Clear All</button>}
                  <button type="button" className="srp-filters__close" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={20} /></button>
                </div>
              </div>

              {loading ? (
                <div className="srp-filters__loading">{[0, 1, 2, 3].map((i) => <span key={i} className="srp-skel-line" />)}</div>
              ) : (
                <>
                  <FilterGroup title="Category">
                    <CheckList
                      options={countBy(items, (i) => i.category)}
                      selected={cats}
                      onToggle={withReset((v: string) => setCats((s) => toggleIn(s, v)))}
                      empty="No categories"
                    />
                  </FilterGroup>

                  <FilterGroup title="Brand">
                    <BrandFilter
                      options={countBy(items, (i) => i.brand)}
                      selected={brands}
                      onToggle={withReset((v: string) => setBrands((s) => toggleIn(s, v)))}
                    />
                  </FilterGroup>

                  {bounds[1] > bounds[0] && (
                    <FilterGroup title="Price Range">
                      <PriceFilter
                        key={`${minP}-${maxP}`}
                        bounds={bounds}
                        value={[minP, maxP]}
                        onChange={withReset((r: [number, number]) =>
                          setPriceRange(r[0] <= bounds[0] && r[1] >= bounds[1] ? null : r))}
                      />
                    </FilterGroup>
                  )}

                  <FilterGroup title="Highlights">
                    <CheckList
                      options={HIGHLIGHTS.map((h) => [h.label, items.filter((i) => i.flags[h.key]).length] as [string, number]).filter(([, n]) => n > 0)}
                      selected={new Set(HIGHLIGHTS.filter((h) => highlights.has(h.key)).map((h) => h.label))}
                      onToggle={withReset((label: string) => {
                        const key = HIGHLIGHTS.find((h) => h.label === label)!.key
                        setHighlights((s) => toggleIn(s, key))
                      })}
                      empty="Nothing to filter"
                    />
                  </FilterGroup>
                </>
              )}

              <button type="button" className="srp-filters__apply" onClick={() => setFiltersOpen(false)}>
                Show {filtered.length} product{filtered.length === 1 ? '' : 's'}
              </button>
            </aside>

            {/* ---------- Results ---------- */}
            <main className="srp-main">
              <section className="srp-hero">
                <div className="srp-hero__copy">
                  <h1 className="srp-hero__title">{titleCase(query)}</h1>
                  <p className="srp-hero__sub">Original, fast &amp; reliable picks<br />matched to your search</p>
                  <ul className="srp-hero__perks">
                    <li><Zap size={18} /> Fast Delivery</li>
                    <li><ShieldCheck size={18} /> Safe &amp; Secure</li>
                    <li><BadgeCheck size={18} /> Original Product</li>
                  </ul>
                </div>
                {heroItem && !loading && (
                  <div className="srp-hero__art" aria-hidden="true">
                    <img src={heroItem.image} alt="" />
                  </div>
                )}
              </section>

              <div className="srp-toolbar" ref={resultsTop}>
                <div>
                  <h2 className="srp-toolbar__title">Search Results for “{query}”</h2>
                  <p className="srp-toolbar__count">
                    {loading ? 'Searching…' : `${filtered.length} product${filtered.length === 1 ? '' : 's'} found`}
                  </p>
                </div>
                <div className="srp-toolbar__controls">
                  <button type="button" className="srp-filter-toggle" onClick={() => setFiltersOpen(true)}>
                    <SlidersHorizontal size={17} /> Filters{activeCount > 0 && <span>{activeCount}</span>}
                  </button>
                  <label className="srp-sort">
                    <span>Sort by:</span>
                    <span className="srp-sort__select">
                      <select value={sort} onChange={(e) => { setSort(e.target.value as SortKey); setPage(1) }}>
                        {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                      <ChevronDown size={17} aria-hidden="true" />
                    </span>
                  </label>
                  <div className="srp-view" role="group" aria-label="Layout">
                    <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Grid view" aria-pressed={view === 'grid'}><LayoutGrid size={18} /></button>
                    <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view" aria-pressed={view === 'list'}><List size={18} /></button>
                  </div>
                </div>
              </div>

              {activeCount > 0 && !loading && (
                <div className="srp-chips">
                  {[...cats].map((c) => <Chip key={`c-${c}`} label={c} onRemove={withReset(() => setCats((s) => toggleIn(s, c)))} />)}
                  {[...brands].map((b) => <Chip key={`b-${b}`} label={b} onRemove={withReset(() => setBrands((s) => toggleIn(s, b)))} />)}
                  {priceRange && <Chip label={`${inr(priceRange[0])} – ${inr(priceRange[1])}`} onRemove={withReset(() => setPriceRange(null))} />}
                  {HIGHLIGHTS.filter((h) => highlights.has(h.key)).map((h) => (
                    <Chip key={h.key} label={h.label} onRemove={withReset(() => setHighlights((s) => toggleIn(s, h.key)))} />
                  ))}
                  <button type="button" className="srp-link" onClick={clearAll}>Clear all</button>
                </div>
              )}

              {loading ? (
                <div className={`srp-grid srp-grid--${view}`}>
                  {Array.from({ length: 8 }, (_, i) => <div key={i} className="srp-card srp-card--skeleton" />)}
                </div>
              ) : failed ? (
                <Notice title="Couldn't load results" text="Please check your connection and try again.">
                  <button type="button" className="srp-btn" onClick={() => navigate(0)}>Try again</button>
                </Notice>
              ) : items.length === 0 ? (
                <Notice title={`No results for “${query}”`} text="Check the spelling or try a more general word.">
                  <div className="srp-popular">
                    {POPULAR.map((t) => <Link key={t} to={`/search?q=${encodeURIComponent(t)}`}>{t}</Link>)}
                  </div>
                </Notice>
              ) : filtered.length === 0 ? (
                <Notice title="No products match these filters" text="Try removing a filter or widening the price range.">
                  <button type="button" className="srp-btn" onClick={clearAll}>Clear all filters</button>
                </Notice>
              ) : (
                <>
                  <div className={`srp-grid srp-grid--${view}`}>
                    {pageItems.map((item) => (
                      <ResultCard
                        key={item.id}
                        item={item}
                        liked={wishlist.has(item.id)}
                        busy={adding === item.id}
                        onWishlist={() => toggleWishlist(item)}
                        onAdd={() => addToCart(item)}
                      />
                    ))}
                  </div>

                  <div className="srp-pager">
                    <p>
                      Showing {(current - 1) * PAGE_SIZE + 1} – {Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length} products
                    </p>
                    {pages > 1 && <Pagination page={current} pages={pages} onPage={goToPage} />}
                  </div>
                </>
              )}
            </main>
          </div>
  )
}

/* ---------- Pieces ---------- */

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <section className="srp-fgroup">
      <button type="button" className="srp-fgroup__head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {title}
        <ChevronDown size={18} className={open ? 'is-open' : ''} aria-hidden="true" />
      </button>
      {open && <div className="srp-fgroup__body">{children}</div>}
    </section>
  )
}

function CheckList({ options, selected, onToggle, empty, limit = 6 }: {
  options: [string, number][]
  selected: Set<string>
  onToggle: (v: string) => void
  empty: string
  limit?: number
}) {
  const [all, setAll] = useState(false)
  if (!options.length) return <p className="srp-muted">{empty}</p>
  const shown = all ? options : options.slice(0, limit)
  return (
    <>
      <ul className="srp-checks">
        {shown.map(([label, n]) => (
          <li key={label}>
            <label>
              <input type="checkbox" checked={selected.has(label)} onChange={() => onToggle(label)} />
              <span className="srp-checks__label">{label}</span>
              <span className="srp-checks__count">({n})</span>
            </label>
          </li>
        ))}
      </ul>
      {options.length > limit && (
        <button type="button" className="srp-link srp-more" onClick={() => setAll((a) => !a)}>
          {all ? 'Show less' : `Show ${options.length - limit} more`}
        </button>
      )}
    </>
  )
}

function BrandFilter({ options, selected, onToggle }: { options: [string, number][]; selected: Set<string>; onToggle: (v: string) => void }) {
  const [term, setTerm] = useState('')
  const t = term.trim().toLowerCase()
  const list = t ? options.filter(([b]) => b.toLowerCase().includes(t)) : options
  return (
    <>
      {options.length > 4 && (
        <div className="srp-brand-search">
          <Search size={16} aria-hidden="true" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search brand..." aria-label="Search brand" />
        </div>
      )}
      <CheckList options={list} selected={selected} onToggle={onToggle} empty={t ? 'No matching brands' : 'No brands'} />
    </>
  )
}

function PriceFilter({ bounds, value, onChange }: { bounds: [number, number]; value: [number, number]; onChange: (r: [number, number]) => void }) {
  const [lo, hi] = bounds
  const [draft, setDraft] = useState<[string, string]>([String(value[0]), String(value[1])])

  const step = Math.max(1, Math.round((hi - lo) / 100))
  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100

  // Typed values are clamped to the range and kept in order.
  const commit = () => {
    let a = Number(draft[0].replace(/[^\d]/g, ''))
    let b = Number(draft[1].replace(/[^\d]/g, ''))
    if (!draft[0].trim() || Number.isNaN(a)) a = lo
    if (!draft[1].trim() || Number.isNaN(b)) b = hi
    a = Math.min(Math.max(a, lo), hi)
    b = Math.min(Math.max(b, lo), hi)
    if (a > b) [a, b] = [b, a]
    onChange([a, b])
    setDraft([String(a), String(b)])
  }

  return (
    <div className="srp-price">
      <div className="srp-price__slider" style={{ ['--a' as string]: `${pct(value[0])}%`, ['--b' as string]: `${pct(value[1])}%` }}>
        <input type="range" min={lo} max={hi} step={step} value={value[0]} aria-label="Minimum price"
          onChange={(e) => onChange([Math.min(Number(e.target.value), value[1]), value[1]])} />
        <input type="range" min={lo} max={hi} step={step} value={value[1]} aria-label="Maximum price"
          onChange={(e) => onChange([value[0], Math.max(Number(e.target.value), value[0])])} />
      </div>
      <div className="srp-price__inputs">
        <label>
          <span>₹</span>
          <input inputMode="numeric" value={draft[0]} aria-label="Minimum price"
            onChange={(e) => setDraft([e.target.value.replace(/[^\d]/g, ''), draft[1]])}
            onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} />
        </label>
        <span className="srp-price__dash">–</span>
        <label>
          <span>₹</span>
          <input inputMode="numeric" value={draft[1]} aria-label="Maximum price"
            onChange={(e) => setDraft([draft[0], e.target.value.replace(/[^\d]/g, '')])}
            onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} />
        </label>
      </div>
    </div>
  )
}

function ResultCard({ item, liked, busy, onWishlist, onAdd }: {
  item: Item; liked: boolean; busy: boolean; onWishlist: () => void; onAdd: () => void
}) {
  const [imgOk, setImgOk] = useState(true)
  const badge = item.flags.bestseller ? ['Bestseller', 'best'] : item.flags.new ? ['New', 'new']
    : item.flags.trending ? ['Trending', 'trend'] : item.off >= 15 ? ['Deal', 'deal'] : null

  return (
    <article className="srp-card">
      <Link to={`/product/${item.id}`} className="srp-card__media" aria-label={item.name}>
        {imgOk ? <img src={item.image} alt="" loading="lazy" onError={() => setImgOk(false)} /> : <ShoppingCart size={40} className="srp-card__ph" />}
        {!item.inStock && <span className="srp-card__oos">Out of stock</span>}
      </Link>
      {badge && <span className={`srp-badge srp-badge--${badge[1]}`}>{badge[0]}</span>}
      <button type="button" className={`srp-card__wish ${liked ? 'is-on' : ''}`} onClick={onWishlist}
        aria-label={liked ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`} aria-pressed={liked}>
        <Heart size={19} fill={liked ? 'currentColor' : 'none'} />
      </button>

      <div className="srp-card__body">
        <Link to={`/product/${item.id}`} className="srp-card__name">{item.name}</Link>
        {item.rating > 0 ? (
          <p className="srp-card__rating"><Star size={16} fill="currentColor" /> <b>{item.rating.toFixed(1)}</b></p>
        ) : (
          <p className="srp-card__meta">{[item.brand, item.category].filter(Boolean).join(' · ')}</p>
        )}
        <div className="srp-card__price">
          <strong>{inr(item.price)}</strong>
          {item.mrp && <s>{inr(item.mrp)}</s>}
          {item.off > 0 && <span>{item.off}% OFF</span>}
        </div>
        <button type="button" className="srp-card__cart" onClick={onAdd} disabled={busy || !item.inStock}>
          <ShoppingCart size={18} /> {!item.inStock ? 'Out of Stock' : busy ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </article>
  )
}

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (n: number) => void }) {
  // First, last, and two either side of the current page.
  const nums: (number | '…')[] = []
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) nums.push(n)
    else if (nums[nums.length - 1] !== '…') nums.push('…')
  }
  return (
    <nav className="srp-pages" aria-label="Pagination">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous page"><ChevronLeft size={18} /></button>
      {nums.map((n, i) => n === '…'
        ? <span key={`e${i}`} className="srp-pages__gap">…</span>
        : <button key={n} type="button" className={n === page ? 'is-active' : ''} onClick={() => onPage(n)} aria-current={n === page ? 'page' : undefined}>{n}</button>)}
      <button type="button" onClick={() => onPage(page + 1)} disabled={page === pages} aria-label="Next page"><ChevronRight size={18} /></button>
    </nav>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="srp-chip">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label} filter`}><X size={14} /></button>
    </span>
  )
}

function Notice({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="srp-notice">
      <span className="srp-notice__icon"><SearchX size={30} /></span>
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  )
}

function EmptySearch({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="srp-notice srp-notice--start">
      <span className="srp-notice__icon"><Search size={30} /></span>
      <h3>What are you looking for?</h3>
      <p>Type in the search box above, or try one of these popular searches.</p>
      <div className="srp-popular">
        {POPULAR.map((t) => <button key={t} type="button" onClick={() => onPick(t)}>{t}</button>)}
      </div>
    </div>
  )
}

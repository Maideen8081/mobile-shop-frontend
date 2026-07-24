import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Search, SlidersHorizontal, Check, Sparkles, Flame, TrendingUp, Star, Trophy, Mic, QrCode, Heart, ShoppingBag } from 'lucide-react'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { getImageUrl } from './helpers'
import { FALLBACK_IMG } from './fallback'
import { BRAND } from './theme'
import ProductCard from './ProductCard'
import MobileBottomNav from './MobileBottomNav'
import MobileCartBarActions from './MobileCartBarActions'
import MobileCollectionLoader from './MobileCollectionLoader'
import HeroCarousel from './HeroCarousel'

type TabKey = 'all' | 'new' | 'trending' | 'best' | 'featured'

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'all', label: 'All', icon: Sparkles },
  { key: 'new', label: 'New', icon: Flame },
  { key: 'trending', label: 'Trending', icon: TrendingUp },
  { key: 'best', label: 'Best Sellers', icon: Trophy },
  { key: 'featured', label: 'Featured', icon: Star },
]

const SORTS: { key: string; label: string }[] = [
  { key: 'newest', label: 'Newest First' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'popular', label: 'Popular' },
]

const HERO_COPY: Record<string, { title: string; subtitle: string; bg: string }> = {
  '': { title: 'Shop Everything', subtitle: 'Phones, audio, accessories & more — delivered fast', bg: 'linear-gradient(120deg,#4F46E5 0%,#7C3AED 100%)' },
  'all': { title: 'Shop Everything', subtitle: 'Phones, audio, accessories & more — delivered fast', bg: 'linear-gradient(120deg,#4F46E5 0%,#7C3AED 100%)' },
}

// Module-level cache — persists data across remounts (back-navigation)
let cachedCategories: { name: string; count: number; image?: string }[] | null = null
let cachedProducts: Record<string, any[]> = {} // key = `${categoryName}|${tab}|${sortBy}`

// First home-page style swipeable hero banners
export default function MobileCollection() {
  const navigate = useNavigate()
  const { category } = useParams<{ category: string }>()
  const categoryName = category ? decodeURIComponent(category) : ''
  const activeTab: TabKey = 'all'

  const cacheKey = `${categoryName}|${activeTab}|newest`

  const [products, setProducts] = useState<any[]>(() => cachedProducts[cacheKey] || [])
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const [sortOpen, setSortOpen] = useState(false)
  const [tab, setTab] = useState<TabKey>(activeTab)
  const [categories, setCategories] = useState<{ name: string; count: number; image?: string }[]>(() => cachedCategories || [])
  const [categoriesLoaded, setCategoriesLoaded] = useState(() => cachedCategories !== null)
  const [productsLoading, setProductsLoading] = useState(() => !cachedProducts[cacheKey])
  const [activeCategory, setActiveCategory] = useState(categoryName || 'all')

  // Combined loading: show loader until BOTH categories AND products are loaded
  const loading = !categoriesLoaded || productsLoading
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const tabTrackRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setTab(activeTab) }, [activeTab])
  useEffect(() => { setActiveCategory(categoryName || 'all') }, [categoryName])

  // keep cart + wishlist badges live
  useEffect(() => {
    const update = () => {
      try { setCartCount((JSON.parse(localStorage.getItem('cart') || '[]') as any[]).length) } catch { setCartCount(0) }
      try { setWishlistCount((JSON.parse(localStorage.getItem('wishlist') || '[]') as any[]).length) } catch { setWishlistCount(0) }
    }
    update()
    window.addEventListener('cart-updated', update)
    window.addEventListener('wishlist-updated', update)
    return () => {
      window.removeEventListener('cart-updated', update)
      window.removeEventListener('wishlist-updated', update)
    }
  }, [])

  // keep the active filter tab centered in the carousel
  useEffect(() => {
    const track = tabTrackRef.current
    if (!track) return
    const activeEl = track.querySelector('[data-active="true"]') as HTMLElement | null
    if (activeEl) {
      const left = activeEl.offsetLeft - track.clientWidth / 2 + activeEl.clientWidth / 2
      track.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
    }
  }, [tab])

  useEffect(() => {
    if (cachedCategories) { setCategoriesLoaded(true); return }
    categoryService.list().then((cats) => {
      const mapped = (cats || []).filter((c: any) => c.status === 'active').map((c: any) => ({ name: c.name, count: typeof c.products === 'number' ? c.products : 0, image: c.image }))
      cachedCategories = mapped
      setCategories(mapped)
    }).catch(() => {}).finally(() => setCategoriesLoaded(true))
  }, [])

  const load = (pageNum: number, replace: boolean) => {
    // If we have cached data and this is the first page, skip fetch
    if (replace && cachedProducts[cacheKey]) {
      setProductsLoading(false)
      return
    }

    const params: any = {
      page: pageNum,
      page_size: 12,
      ordering: sortBy === 'price-asc' ? 'price' : sortBy === 'price-desc' ? '-price' : sortBy === 'popular' ? '-rating' : '-created',
    }
    // Do NOT pass "all" as a category — it's a pseudo value for "every category"
    if (categoryName && categoryName.toLowerCase() !== 'all') params.category = categoryName
    if (tab === 'new') params.is_new_arrival = true
    if (tab === 'trending') params.is_trending = true
    if (tab === 'best') params.is_best_selling = true
    if (tab === 'featured') params.is_featured = true

    setProductsLoading(true)
    setLoadingMore(pageNum > 1)
    productService.list(params).then((res: any) => {
      const items = Array.isArray(res) ? res : (res?.results || res?.data || [])
      cachedProducts[cacheKey] = items
      setProducts(replace ? items : [...products, ...items])
      setHasMore(items.length >= 12)
      setPage(pageNum)
    }).catch(() => {
      if (replace) setProducts([])
    }).finally(() => { setProductsLoading(false); setLoadingMore(false) })
  }

  useEffect(() => { load(1, true) }, [categoryName, tab, sortBy])
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const hero = HERO_COPY[categoryName.toLowerCase()] || { title: categoryName, subtitle: 'Explore the latest products in this category', bg: 'linear-gradient(120deg,#0EA5E9 0%,#4F46E5 100%)' }

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-[#0F172A] max-w-[480px] mx-auto pb-24">
      {/* ── TOP SECTION — always visible ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#EEF1F4] shadow-[0_4px_16px_rgba(15,23,42,0.05)]">
        {/* Row 1: back · centered title · search */}
        <div className="flex items-center gap-2 px-3.5 h-[54px]">
          <button onClick={() => navigate(-1)} aria-label="Back" className="w-9 h-9 rounded-full bg-[#F1ECFF] flex items-center justify-center active:scale-90 transition flex-shrink-0">
            <ChevronLeft size={20} className="text-[#6C3BFF]" />
          </button>
          <div className="flex-1 flex justify-center min-w-0">
            <h1 className="text-[18px] font-extrabold text-[#1F2937] truncate">{categoryName || 'All Products'}</h1>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => navigate('/wishlist')} aria-label="Wishlist" className="relative w-9 h-9 rounded-full bg-[#F1ECFF] flex items-center justify-center active:scale-90 transition">
              <Heart size={18} className="text-[#6C3BFF]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center">{wishlistCount > 99 ? '99+' : wishlistCount}</span>
              )}
            </button>
            <button onClick={() => navigate('/cart')} aria-label="Cart" className="relative w-9 h-9 rounded-full bg-[#F1ECFF] flex items-center justify-center active:scale-90 transition">
              <ShoppingBag size={18} className="text-[#6C3BFF]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: full-width search bar */}
        <div className="px-3.5 pb-3">
          <button
            onClick={() => navigate('/search')}
            className="w-full flex items-center gap-2 px-3.5 h-11 rounded-2xl bg-[#F8F9FF] border border-[#E0E0F5] shadow-[0_4px_14px_rgba(108,59,255,0.08)] active:scale-[0.99] transition"
          >
            <Search size={18} className="text-[#6C3BFF] shrink-0" />
            <span className="flex-1 text-left text-[13px] text-[#9CA3AF]">Search mobiles, accessories…</span>
            <span className="flex items-center gap-1 text-[#6C3BFF]">
              <Mic size={16} />
              <QrCode size={16} />
            </span>
          </button>
        </div>

        {/* Row 3: filter chips + sort */}
        <div className="px-3.5 pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-5 z-10 bg-gradient-to-r from-white to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-5 z-10 bg-gradient-to-l from-white to-transparent" />
              <div
                ref={tabTrackRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth py-0.5"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {TABS.map((t) => {
                  const Icon = t.icon
                  const active = tab === t.key
                  return (
                    <button key={t.key} onClick={() => setTab(t.key)} data-active={active}
                      className={`snap-start flex-shrink-0 flex items-center gap-1.5 px-3.5 h-9 rounded-full text-[12px] font-bold transition-all duration-200 ${
                        active
                          ? 'bg-gradient-to-r from-[#6C3BFF] to-[#4B2ECC] text-white shadow-[0_4px_14px_rgba(108,59,255,0.45)]'
                          : 'bg-white text-[#6C3BFF] border border-[#E0E0F5] active:scale-95'
                      }`}>
                      <Icon size={13} /> {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <button onClick={() => setSortOpen((v) => !v)}
              className="relative flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-r from-[#6C3BFF] to-[#4B2ECC] text-white shadow-[0_4px_14px_rgba(108,59,255,0.40)] active:scale-95 transition">
              <SlidersHorizontal size={16} />
            </button>
          </div>

          {sortOpen && (
            <div className="absolute right-0 top-[44px] z-50 w-48 bg-white rounded-2xl shadow-[0_12px_30px_rgba(108,59,255,0.18)] border border-[#EEF1F4] p-1.5">
              <p className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Sort by</p>
              {SORTS.map((s) => (
                <button key={s.key} onClick={() => { setSortBy(s.key); setSortOpen(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition active:bg-[#F1ECFF] ${
                    sortBy === s.key ? 'text-[#6C3BFF] font-bold bg-[#F1ECFF]' : 'text-[#1F2937]'
                  }`}>
                  {s.label} {sortBy === s.key && <Check size={15} className="text-[#6C3BFF]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Row 4: category tiles — visible once categories load */}
        {categoriesLoaded && (
          <div className="flex gap-3.5 overflow-x-auto px-3.5 pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            <button
              onClick={() => { setActiveCategory('all'); navigate('/collection/all') }}
              className="snap-start flex-shrink-0 w-[68px] flex flex-col items-center gap-1.5 active:scale-95 transition"
            >
              <div className={`w-[64px] h-[64px] rounded-full overflow-hidden flex items-center justify-center transition-all ${
                (!categoryName || categoryName.toLowerCase() === 'all' || activeCategory === 'all')
                  ? 'bg-gradient-to-br from-[#6C3BFF] to-[#4B2ECC] ring-4 ring-[#6C3BFF]/20 scale-105'
                  : 'bg-[#F1ECFF]'
              }`}>
                <span className={`text-[12px] font-bold text-center px-1 leading-tight ${activeCategory === 'all' ? 'text-white' : 'text-[#6C3BFF]'}`}>All</span>
              </div>
              <span className="text-[11px] text-center leading-tight max-w-[68px] truncate font-semibold text-[#1F2937]">All</span>
            </button>

            {categories.map((c, i) => {
              const img = getImageUrl(c.image)
              const tile = BRAND.colorful
              const palette = [
                { bg: 'linear-gradient(135deg,#6C3BFF,#4B2ECC)', fg: tile.indigo },
                { bg: 'linear-gradient(135deg,#0EA5E9,#4F46E5)', fg: tile.sky },
                { bg: 'linear-gradient(135deg,#10B981,#059669)', fg: tile.emerald },
                { bg: 'linear-gradient(135deg,#F59E0B,#F97316)', fg: tile.amber },
                { bg: 'linear-gradient(135deg,#F43F5E,#E11D48)', fg: tile.rose },
                { bg: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', fg: tile.violet },
              ][i % 6]
              const active = activeCategory.toLowerCase() === c.name.toLowerCase()
              return (
                <button
                  key={c.name}
                  onClick={() => { setActiveCategory(c.name); navigate(`/collection/${encodeURIComponent(c.name)}`) }}
                  className="snap-start flex-shrink-0 w-[68px] flex flex-col items-center gap-1.5 active:scale-95 transition"
                >
                  <div className={`w-[64px] h-[64px] rounded-full overflow-hidden flex items-center justify-center transition-all ${
                    active ? 'ring-4 ring-[#6C3BFF]/20 scale-105 shadow-[0_6px_18px_rgba(108,59,255,0.30)]' : 'ring-1 ring-[#E5E7EB]'
                  }`} style={active ? undefined : { background: palette.bg }}>
                    {img ? (
                      <img src={img} alt={c.name} loading="lazy" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }} />
                    ) : (
                      <span className="text-[13px] font-bold text-center px-1 leading-tight text-white drop-shadow">{c.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <span className={`text-[11px] text-center leading-tight max-w-[68px] truncate font-semibold ${active ? 'text-[#6C3BFF]' : 'text-[#1F2937]'}`}>{c.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </header>

      {/* ── MIDDLE SECTION — loader OR content ── */}
      {loading ? (
        <MobileCollectionLoader />
      ) : (
        <>
          {/* Premium hero banner */}
          <div className="px-3.5 pt-3.5">
            <div className="relative overflow-hidden rounded-3xl p-4 h-[124px] shadow-[0_12px_30px_rgba(79,70,229,0.22)]" style={{ background: hero.bg }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute right-3 bottom-3 w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Sparkles size={26} className="text-white" />
              </div>
              <div className="relative z-10 flex flex-col justify-center h-full max-w-[78%]">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">
                  {tab === 'all' ? 'Collection' : TABS.find((t) => t.key === tab)?.label}
                </span>
                <h2 className="text-[21px] font-extrabold text-white leading-tight mt-1 drop-shadow-sm">{hero.title}</h2>
                <p className="text-[11.5px] text-white/90 mt-0.5 leading-snug">{hero.subtitle}</p>
              </div>
            </div>
          </div>

          <HeroCarousel />

          <div className="flex items-center justify-between px-3.5 mt-3.5 mb-1">
            <p className="text-[12px] font-semibold text-[#64748B]">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
          </div>

          <div className="px-3.5">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-[15px] font-bold text-[#0F172A]">No products found</p>
                <p className="text-[13px] text-[#64748B] mt-1">Try a different filter or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {hasMore && !productsLoading && (
              <button onClick={() => load(page + 1, false)} disabled={loadingMore}
                className="w-full mt-4 h-11 rounded-full bg-white border border-[#EEF1F4] text-[13px] font-bold text-[#4F46E5] shadow-[0_2px_8px_rgba(15,23,42,0.04)] active:scale-95 transition disabled:opacity-60">
                {loadingMore ? 'Loading…' : 'Load More'}
              </button>
            )}
          </div>
        </>
      )}

      {/* ── BOTTOM SECTION — always visible ── */}
      <MobileBottomNav />
      <MobileCartBarActions />
    </div>
  )
}

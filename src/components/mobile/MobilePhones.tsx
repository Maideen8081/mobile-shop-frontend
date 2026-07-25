import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Search, SlidersHorizontal, Check, Sparkles, Flame, TrendingUp, Star, Heart, ShoppingBag } from 'lucide-react'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { getImageUrl } from './helpers'
import { FALLBACK_IMG } from './fallback'
import ProductCard from './ProductCard'
import MobileBottomNav from './MobileBottomNav'
import MobileCartBarActions from './MobileCartBarActions'
import MobilePhonesLoader from './MobilePhonesLoader'

type TabKey = 'all' | 'new' | 'trending' | 'popular'

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'all', label: 'All', icon: Sparkles },
  { key: 'new', label: 'New', icon: Flame },
  { key: 'trending', label: 'Trending', icon: TrendingUp },
  { key: 'popular', label: 'Popular', icon: Star },
]

const SORTS: { key: string; label: string }[] = [
  { key: 'newest', label: 'Newest First' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'popular', label: 'Popular' },
]

const HERO_COPY: { title: string; subtitle: string; bg: string } = {
  title: 'Premium Smartphones',
  subtitle: 'iPhone, Galaxy, Pixel & more — best prices, full warranty',
  bg: 'linear-gradient(135deg,#6C3BFF 0%,#4B2ECC 100%)',
}

// Module-level cache — persists data across remounts
let cachedCategories: { name: string; count: number; image?: string }[] | null = null
let cachedProducts: Record<string, any[]> = {}

export default function MobilePhones() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<any[]>(() => cachedProducts['all|newest'] || [])
  const [categoriesLoaded, setCategoriesLoaded] = useState(() => cachedCategories !== null)
  const [productsLoading, setProductsLoading] = useState(() => !cachedProducts['all|newest'])
  const loading = !categoriesLoaded || productsLoading
  const [sortBy, setSortBy] = useState('newest')
  const [sortOpen, setSortOpen] = useState(false)
  const [tab, setTab] = useState<TabKey>('all')
  const [categories, setCategories] = useState<{ name: string; count: number; image?: string }[]>(() => cachedCategories || [])
  const [activeCategory, setActiveCategory] = useState('all')
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const tabTrackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => {
      try { setCartCount((JSON.parse(localStorage.getItem('cart') || '[]') as any[]).reduce((s, i) => s + (i.quantity || 1), 0)) } catch { setCartCount(0) }
      try { setWishlistCount((JSON.parse(localStorage.getItem('wishlist') || '[]') as number[]).length) } catch { setWishlistCount(0) }
    }
    update()
    window.addEventListener('cart-updated', update)
    window.addEventListener('wishlist-updated', update)
    return () => {
      window.removeEventListener('cart-updated', update)
      window.removeEventListener('wishlist-updated', update)
    }
  }, [])

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

  useEffect(() => {
    const cacheKey = `${activeCategory}|${sortBy}`
    if (cachedProducts[cacheKey]) {
      setProducts(cachedProducts[cacheKey])
      setProductsLoading(false)
      return
    }
    setProductsLoading(true)
    const params: any = {
      page_size: 50,
      ordering: sortBy === 'price-asc' ? 'price' : sortBy === 'price-desc' ? '-price' : sortBy === 'popular' ? '-rating' : '-created',
    }
    if (activeCategory && activeCategory.toLowerCase() !== 'all') params.category = activeCategory
    if (tab === 'new') params.is_new_arrival = true
    else if (tab === 'trending') params.is_trending = true
    else if (tab === 'popular') params.is_featured = true
    productService.list(params).then((data: any[]) => {
      const phoneNames = categories.filter((c) => /phone|smartphone|mobile/i.test(c.name)).map((c) => c.name)
      const filtered = phoneNames.length > 0 && activeCategory.toLowerCase() === 'all'
        ? data.filter((p: any) => phoneNames.includes(p.category))
        : data
      cachedProducts[cacheKey] = filtered
      setProducts(filtered)
    }).catch(() => {}).finally(() => setProductsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, tab, sortBy, categories])

  const hero = HERO_COPY

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-[#0F172A] max-w-[480px] mx-auto pb-24">
      {/* Sticky header — always visible */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#EEF1F4] shadow-[0_4px_16px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-2 px-3.5 h-[54px]">
          <button onClick={() => navigate(-1)} aria-label="Back" className="w-9 h-9 rounded-full bg-[#F1ECFF] flex items-center justify-center active:scale-90 transition flex-shrink-0">
            <ChevronLeft size={20} className="text-[#6C3BFF]" />
          </button>
          <div className="flex-1 flex justify-center min-w-0">
            <h1 className="text-[18px] font-extrabold text-[#1F2937] truncate">Phones</h1>
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

        <div className="px-3.5 pb-3">
          <button
            onClick={() => navigate('/search')}
            className="w-full flex items-center gap-2 px-3.5 h-11 rounded-2xl bg-[#F8F9FF] border border-[#E0E0F5] shadow-[0_4px_14px_rgba(108,59,255,0.08)] active:scale-[0.99] transition"
          >
            <Search size={18} className="text-[#6C3BFF] shrink-0" />
            <span className="flex-1 text-left text-[13px] text-[#9CA3AF]">Search mobiles, accessories…</span>
          </button>
        </div>

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

        {/* Category tiles — visible once categories load */}
        {categoriesLoaded && (
          <div className="flex gap-3.5 overflow-x-auto px-3.5 pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            <button
              onClick={() => setActiveCategory('all')}
              className="snap-start flex-shrink-0 w-[68px] flex flex-col items-center gap-1.5 active:scale-95 transition"
            >
              <div className={`w-[64px] h-[64px] rounded-full flex items-center justify-center transition-all ${activeCategory === 'all' ? 'bg-gradient-to-br from-[#6C3BFF] to-[#4B2ECC] ring-4 ring-[#6C3BFF]/20 scale-105' : 'bg-[#F1ECFF]'}`}>
                <span className={`text-[12px] font-bold text-center px-1 leading-tight ${activeCategory === 'all' ? 'text-white' : 'text-[#6C3BFF]'}`}>All</span>
              </div>
              <span className={`text-[11px] text-center leading-tight max-w-[68px] truncate font-semibold ${activeCategory === 'all' ? 'text-[#6C3BFF]' : 'text-[#1F2937]'}`}>All</span>
            </button>

            {categories.filter((c) => /phone|smartphone|mobile/i.test(c.name)).map((c) => {
              const img = getImageUrl(c.image)
              const active = activeCategory.toLowerCase() === c.name.toLowerCase()
              return (
                <button
                  key={c.name}
                  onClick={() => setActiveCategory(c.name)}
                  className="snap-start flex-shrink-0 w-[68px] flex flex-col items-center gap-1.5 active:scale-95 transition"
                >
                  <div className={`w-[64px] h-[64px] rounded-full overflow-hidden flex items-center justify-center transition-all ${active ? 'ring-4 ring-[#6C3BFF]/20 scale-105 shadow-[0_6px_18px_rgba(108,59,255,0.30)]' : 'ring-1 ring-[#E5E7EB]'}`} style={{ background: 'linear-gradient(135deg,#6C3BFF,#4B2ECC)' }}>
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

      {/* ── CONTENT — loader or products ── */}
      {loading ? (
        <MobilePhonesLoader />
      ) : (
        <>
          {/* Hero banner */}
          <div className="px-3.5 pt-3.5">
            <div className="relative overflow-hidden rounded-3xl p-4 h-[124px] shadow-[0_12px_30px_rgba(108,59,255,0.22)]" style={{ background: hero.bg }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute right-3 bottom-3 w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Sparkles size={26} className="text-white" />
              </div>
              <div className="relative z-10 flex flex-col justify-center h-full max-w-[78%]">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">Collection</span>
                <h2 className="text-[21px] font-extrabold text-white leading-tight mt-1 drop-shadow-sm">{hero.title}</h2>
                <p className="text-[11.5px] text-white/90 mt-0.5 leading-snug">{hero.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Product count */}
          <div className="flex items-center justify-between px-3.5 mt-3.5 mb-1">
            <p className="text-[12px] font-semibold text-[#64748B]">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
          </div>

          {/* Product grid */}
          <div className="px-3.5">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-[15px] font-bold text-[#0F172A]">No phones found</p>
                <p className="text-[13px] text-[#64748B] mt-1">Try a different filter or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>

          {/* Trade-in CTA */}
          <div className="px-3.5 mt-5">
            <button onClick={() => navigate('/trade-in')} className="w-full flex items-center justify-between gap-3 rounded-3xl p-4 text-left shadow-[0_12px_30px_rgba(108,59,255,0.18)] active:scale-[0.99] transition" style={{ background: 'linear-gradient(135deg,#4B2ECC,#6C3BFF)' }}>
              <div className="min-w-0">
                <p className="text-[13px] font-extrabold text-white leading-tight">Upgrade & Save Up To ₹30,000</p>
                <p className="text-[11px] text-white/80 mt-0.5">Trade in your old device for instant credit.</p>
              </div>
              <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white">
                <Sparkles size={18} />
              </span>
            </button>
          </div>
        </>
      )}

      <MobileBottomNav />
      <MobileCartBarActions />
    </div>
  )
}

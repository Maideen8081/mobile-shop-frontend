import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Search, Heart, ShoppingBag, SlidersHorizontal, Check, Sparkles, Flame, TrendingUp, Star, Filter, X, ChevronRight } from 'lucide-react'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { BRAND } from './theme'
import PremiumProductCard from './PremiumProductCard'
import MobileBottomNav from './MobileBottomNav'
import MobileCartBarActions from './MobileCartBarActions'
import MobilePhonesLoader from './MobilePhonesLoader'
import PremiumMobileHeader from './PremiumMobileHeader'
import PremiumFilterPanel from './PremiumFilterPanel'

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
  bg: 'linear-gradient(135deg,#4F46E5 0%,#4B2ECC 100%)',
}

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
  const [wishlist, setWishlist] = useState<Set<number>>(new Set())
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<{
    categories: string[]
    brands: string[]
    priceRange: { min: number; max: number } | null
    sortBy: string
    tags: string[]
  }>({
    categories: [],
    brands: [],
    priceRange: null,
    sortBy: 'newest',
    tags: [],
  })
  const tabTrackRef = useRef<HTMLDivElement>(null)

  const phoneCategories = useMemo(() =>
    categories.filter((c) => /phone|smartphone|mobile/i.test(c.name)),
    [categories]
  )

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
    const updateWishlist = () => {
      try { setWishlist(new Set(JSON.parse(localStorage.getItem('wishlist') || '[]'))) } catch { setWishlist(new Set()) }
    }
    updateWishlist()
    window.addEventListener('wishlist-updated', updateWishlist)
    return () => window.removeEventListener('wishlist-updated', updateWishlist)
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
    const cacheKey = `${activeCategory}|${tab}|${sortBy}`
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
  }, [activeCategory, tab, sortBy, categories])

  const hero = HERO_COPY

  const handleFilterApply = (filters: any) => {
    setActiveFilters(filters)
    setActiveCategory(filters.categories[0] || 'all')
    setTab(filters.tags.includes('new') ? 'new' : filters.tags.includes('trending') ? 'trending' : filters.tags.includes('popular') ? 'popular' : 'all')
    setSortBy(filters.sortBy)
    setFilterOpen(false)
  }

  const filterCount = useMemo(() => {
    let count = 0
    if (activeCategory !== 'all') count++
    if (tab !== 'all') count++
    if (activeFilters.brands.length > 0) count += activeFilters.brands.length
    if (activeFilters.priceRange) count++
    if (activeFilters.tags.length > 0) count += activeFilters.tags.length
    return count
  }, [activeCategory, tab, activeFilters])

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-[#0F172A] max-w-[480px] mx-auto pb-24 overflow-x-hidden">
      <PremiumMobileHeader
        title="Phones"
        showBack
        showFilter
        filterCount={filterCount}
        onFilterClick={() => setFilterOpen(true)}
        showSearch
        onSearchClick={() => navigate('/search')}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        categories={phoneCategories}
        activeCategory={activeCategory}
        onCategoryClick={(name) => setActiveCategory(name)}
      />

      {loading ? (
        <MobilePhonesLoader />
      ) : (
        <>
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

          <div className="flex items-center justify-between px-3.5 mt-3 mb-1">
            <p className="text-[12px] font-semibold text-[#64748B]">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
          </div>

          <div className="px-3.5">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-[15px] font-bold text-[#0F172A]">No phones found</p>
                <p className="text-[13px] text-[#64748B] mt-1">Try a different filter or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {products.map((p) => (
                  <PremiumProductCard
                    key={p.id}
                    product={p}
                    variant="grid"
                    wishlist={wishlist}
                    onWishlistToggle={(id, e) => {
                      e.stopPropagation()
                      setWishlist((prev) => {
                        const next = new Set(prev)
                        let added = false
                        if (next.has(id)) { next.delete(id); added = false }
                        else { next.add(id); added = true }
                        localStorage.setItem('wishlist', JSON.stringify(Array.from(next)))
                        window.dispatchEvent(new Event('wishlist-updated'))
                        return next
                      })
                    }}
                    onAddToCart={(product, e) => {
                      e.stopPropagation()
                      const price = product.variants?.[0]?.discountPrice || product.variants?.[0]?.price || 0
                      const image = product.common_image || product.image || product.images?.[0] || product.thumbnail || product.variants?.[0]?.images?.[0] || ''
                      const name = product.product_name ?? product.name ?? ''
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
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="px-3.5 mt-5">
            <button onClick={() => navigate('/trade-in')} className="w-full flex items-center justify-between gap-3 rounded-3xl p-4 text-left shadow-[0_12px_30px_rgba(79,70,229,0.18)] active:scale-[0.99] transition" style={{ background: 'linear-gradient(135deg,#4B2ECC,#6C3BFF)' }}>
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

      <PremiumFilterPanel
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={handleFilterApply}
        initialFilters={{
          categories: activeCategory !== 'all' ? [activeCategory] : [],
          brands: activeFilters.brands,
          priceRange: activeFilters.priceRange,
          rating: 0,
          sortBy,
          tags: tab !== 'all' ? [tab] : [],
        }}
        availableFilters={{
          categories: phoneCategories.map((c) => ({ label: c.name, value: c.name, count: c.count })),
          brands: [],
          priceRanges: [],
          tags: TABS.map((t) => ({ label: t.label, value: t.key })),
        }}
      />

      <MobileBottomNav />
      <MobileCartBarActions />
    </div>
  )
}
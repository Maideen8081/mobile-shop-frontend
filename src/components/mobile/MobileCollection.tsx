import StorefrontIllustration from '../ecommerce/StorefrontIllustration'
import { useEffect, useRef, useState, useMemo } from 'react'
import { getWishlistCount, requireSignInForWishlist } from '../../utils/wishlist'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Sparkles, Flame, TrendingUp, Star, Trophy, Tag, Recycle } from 'lucide-react'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { cartService } from '../../services/cartService'
import PremiumProductCard from './PremiumProductCard'
import MobileBottomNav from './MobileBottomNav'
import MobileCartBarActions from './MobileCartBarActions'
import PageLoading from '../ui/PageLoading'
import PremiumMobileHeader from './PremiumMobileHeader'
import PremiumFilterPanel from './PremiumFilterPanel'

type TabKey = 'all' | 'new' | 'trending' | 'best' | 'featured' | 'deals' | 'refurbished'

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'all', label: 'All', icon: Sparkles },
  { key: 'new', label: 'New', icon: Flame },
  { key: 'trending', label: 'Trending', icon: TrendingUp },
  { key: 'best', label: 'Best Sellers', icon: Trophy },
  { key: 'featured', label: 'Featured', icon: Star },
  { key: 'deals', label: 'Deals', icon: Tag },
  { key: 'refurbished', label: 'Refurbished', icon: Recycle },
]

const HERO_COPY: Record<string, { title: string; subtitle: string; bg: string }> = {
  '': { title: 'Shop Everything', subtitle: 'Phones, audio, accessories & more — delivered fast', bg: 'linear-gradient(120deg,#0f3b2c 0%,#0f3b2c 100%)' },
  'all': { title: 'Shop Everything', subtitle: 'Phones, audio, accessories & more — delivered fast', bg: 'linear-gradient(120deg,#0f3b2c 0%,#0f3b2c 100%)' },
}

let cachedCategories: { name: string; count: number; image?: string }[] | null = null
type CachedPage = { items: any[]; page: number; hasMore: boolean }
let cachedProducts: Record<string, CachedPage> = {}

const cacheKeyFor = (category: string, tab: string, sort: string) => `${category}|${tab}|${sort}`

export default function MobileCollection() {
  const navigate = useNavigate()
  const { category } = useParams<{ category: string }>()
  const categoryName = category || ''
  const [searchParams] = useSearchParams()
  const urlTab = searchParams.get('tab')
  const tab: TabKey = TABS.find((entry) => entry.key === (urlTab === 'popular' ? 'featured' : urlTab))?.key ?? 'all'
  const searchTerm = searchParams.get('search') || ''

  const cacheKey = `${cacheKeyFor(categoryName, tab, 'newest')}|${searchTerm}||`
  const latestRequest = useRef(0)

  const [products, setProducts] = useState<any[]>(() => cachedProducts[cacheKey]?.items || [])
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [page, setPage] = useState(() => cachedProducts[cacheKey]?.page ?? 1)
  const [hasMore, setHasMore] = useState(() => cachedProducts[cacheKey]?.hasMore ?? false)
  const [sortBy, setSortBy] = useState('newest')
  const [categories, setCategories] = useState<{ name: string; count: number; image?: string }[]>(() => cachedCategories || [])
  const [categoriesLoaded, setCategoriesLoaded] = useState(() => cachedCategories !== null)
  const [productsLoading, setProductsLoading] = useState(() => !cachedProducts[cacheKey])
  const [activeCategory, setActiveCategory] = useState(categoryName || 'all')
  const [wishlist, setWishlist] = useState<Set<number>>(new Set())
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

  const loading = !categoriesLoaded || productsLoading
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => { setActiveCategory(categoryName || 'all') }, [categoryName])

  useEffect(() => {
    const updateCart = () => setCartCount(cartService.getCachedCartCount())
    const updateWishlist = () => {
      setWishlistCount(getWishlistCount())
    }
    updateCart()
    updateWishlist()
    window.addEventListener('cart-updated', updateCart)
    window.addEventListener('wishlist-updated', updateWishlist)
    return () => {
      window.removeEventListener('cart-updated', updateCart)
      window.removeEventListener('wishlist-updated', updateWishlist)
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
    if (cachedCategories) { setCategoriesLoaded(true); return }
    categoryService.list().then((cats) => {
      const mapped = (cats || []).filter((c: any) => c.status === 'active').map((c: any) => ({ name: c.name, count: typeof c.products === 'number' ? c.products : 0, image: c.image }))
      cachedCategories = mapped
      setCategories(mapped)
    }).catch(() => {}).finally(() => setCategoriesLoaded(true))
  }, [])

  const load = (pageNum: number, replace: boolean) => {
    const brandKey = activeFilters.brands.join(',')
    const priceKey = activeFilters.priceRange ? `${activeFilters.priceRange.min}-${activeFilters.priceRange.max}` : ''
    const key = `${cacheKeyFor(categoryName, tab, sortBy)}|${searchTerm}|${brandKey}|${priceKey}`
    const requestId = ++latestRequest.current
    setLoadFailed(false)
    const cached = cachedProducts[key]
    if (replace && cached) {
      setProducts(cached.items)
      setPage(cached.page)
      setHasMore(cached.hasMore)
      setProductsLoading(false)
      setLoadingMore(false)
      return
    }

    const params: any = {
      page: pageNum,
      page_size: 12,
      ordering: sortBy === 'price-asc' ? 'min_price' : sortBy === 'price-desc' ? '-min_price' : sortBy === 'popular' ? '-review_count' : '-created_at',
    }
    if (categoryName && categoryName.toLowerCase() !== 'all') params.category = categoryName
    if (tab === 'new') params.is_new_arrival = true
    if (tab === 'trending') params.is_trending = true
    if (tab === 'best') params.is_best_selling = true
    if (tab === 'featured') params.is_featured = true
    if (tab === 'deals') params.has_discount = true
    if (tab === 'refurbished') params.is_refurbished = true
    if (searchTerm) params.search = searchTerm
    if (brandKey) params.brand = brandKey
    if (activeFilters.priceRange) {
      if (activeFilters.priceRange.min > 0) params.price_min = activeFilters.priceRange.min
      if (activeFilters.priceRange.max > 0) params.price_max = activeFilters.priceRange.max
    }

    setProductsLoading(replace)
    setLoadingMore(!replace)
    productService.listPaginated(params).then(({ results: items, next }) => {
      const merged = replace ? items : [...products, ...items]
      const more = Boolean(next)
      cachedProducts[key] = { items: merged, page: pageNum, hasMore: more }
      if (requestId !== latestRequest.current) return
      setProducts(merged)
      setHasMore(more)
      setPage(pageNum)
    }).catch(() => {
      if (requestId !== latestRequest.current) return
      if (replace) { setProducts([]); setHasMore(false) }
      setLoadFailed(true)
    }).finally(() => {
      if (requestId !== latestRequest.current) return
      setProductsLoading(false)
      setLoadingMore(false)
    })
  }

  useEffect(() => {
    load(1, true)
    return () => { latestRequest.current += 1 }
  }, [categoryName, tab, sortBy, searchTerm, activeFilters.brands, activeFilters.priceRange]) // eslint-disable-line react-hooks/exhaustive-deps

  const hero = HERO_COPY[categoryName.toLowerCase()] || { title: categoryName, subtitle: 'Explore the latest products in this category', bg: 'linear-gradient(120deg,#0EA5E9 0%,#0f3b2c 100%)' }

  const handleFilterApply = (filters: any) => {
    setActiveFilters(filters)
    const params = new URLSearchParams(searchParams)
    const nextTab = TABS.find((entry) => filters.tags.includes(entry.key))?.key
    if (nextTab && nextTab !== 'all') params.set('tab', nextTab)
    else params.delete('tab')
    navigate({ pathname: `/collection/${encodeURIComponent(filters.categories[0] || 'all')}`, search: params.toString() })
    setSortBy(filters.sortBy)
    setFilterOpen(false)
  }

  const filterCount = useMemo(() => {
    let count = 0
    if (activeCategory !== 'all' && categoryName !== activeCategory) count++
    if (tab !== 'all') count++
    if (activeFilters.brands.length > 0) count += activeFilters.brands.length
    if (activeFilters.priceRange) count++
    if (activeFilters.tags.length > 0) count += activeFilters.tags.length
    return count
  }, [activeCategory, categoryName, tab, activeFilters])

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-[#1d2522] max-w-[480px] mx-auto pb-24 overflow-x-hidden">
      <PremiumMobileHeader
        title={categoryName || 'All Products'}
        showBack
        showFilter
        filterCount={filterCount}
        onFilterClick={() => setFilterOpen(true)}
        showSearch
        onSearchClick={() => navigate('/search')}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={(name) => { setActiveCategory(name); navigate(`/collection/${encodeURIComponent(name)}`) }}
      />

      {loading ? (
        <PageLoading label="Loading products…" className="min-h-[40vh]" />
      ) : (
        <>
          <div className="px-3.5 pt-3.5">
            <div className="relative overflow-hidden rounded-3xl p-4 h-[124px] shadow-[0_12px_30px_rgba(15,59,44,0.22)]" style={{ background: hero.bg }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-[8px] bg-white/20 blur-2xl" />
              <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-[8px] bg-white/15 blur-2xl" />
              <div className="absolute right-3 bottom-3 w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Sparkles size={26} className="text-white" />
              </div>
              <div className="relative z-10 flex flex-col justify-center h-full max-w-[78%]">
                <span className="flex items-center gap-1 text-micro font-bold uppercase tracking-[0.18em] text-white/90">
                  {tab === 'all' ? 'Collection' : TABS.find((t) => t.key === tab)?.label}
                </span>
                <h2 className="text-title font-extrabold text-white leading-tight mt-1 drop-shadow-sm">{hero.title}</h2>
                <p className="text-caption text-white/90 mt-0.5 leading-snug">{hero.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 mb-1">
              <p className="text-caption font-semibold text-[#5d6762]">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>

          <div className="px-3.5">
            {products.length === 0 && loadFailed ? (
              <div className="py-12 text-center" role="alert">
                <p className="font-semibold">Couldn’t load products.</p>
                <button type="button" className="mt-3 text-[#0f3b2c] underline" onClick={() => load(1, true)}>Try again</button>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <StorefrontIllustration kind="search" />
                <p className="text-body font-bold text-[#1d2522]">No products found</p>
                <p className="text-label text-[#5d6762] mt-1">Try a different filter or category.</p>
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
                      if (!requireSignInForWishlist(navigate)) return
                      setWishlist((prev) => {
                        const next = new Set(prev)
                        if (next.has(id)) next.delete(id)
                        else next.add(id)
                        localStorage.setItem('wishlist', JSON.stringify(Array.from(next)))
                        window.dispatchEvent(new Event('wishlist-updated'))
                        return next
                      })
                    }}
                  />
                ))}
              </div>
            )}

            {hasMore && !productsLoading && (
              <button onClick={() => load(page + 1, false)} disabled={loadingMore}
                className="w-full mt-4 h-11 rounded-[8px] bg-white border border-[#ece9e2] text-label font-bold text-[#0f3b2c] shadow-[0_2px_8px_rgba(29,37,34,0.04)] active:scale-95 transition disabled:opacity-60">
                {loadingMore ? 'Loading…' : loadFailed ? 'Retry loading more products' : 'Load More'}
              </button>
            )}
          </div>
        </>
      )}
      <PremiumFilterPanel
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={handleFilterApply}
        initialFilters={{
          categories: categoryName && categoryName !== 'all' ? [categoryName] : [],
          brands: activeFilters.brands,
          priceRange: activeFilters.priceRange,
          rating: 0,
          sortBy,
          tags: tab !== 'all' ? [tab] : [],
        }}
        availableFilters={{
          categories: categories.map((c) => ({ label: c.name, value: c.name, count: c.count })),
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

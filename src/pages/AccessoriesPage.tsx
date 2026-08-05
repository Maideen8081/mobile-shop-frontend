import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import DesktopPageLoader from '../components/ui/DesktopPageLoader'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import EcommerceFooter from '../components/ecommerce/Footer'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 480%22 fill=%22%23f1eeeb%22%3E%3Crect width=%22400%22 height=%22480%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2218%22 fill=%22%2322C55E%22%3EProduct%3C/text%3E%3C/svg%3E'

const tabs = [
  { key: 'all', label: 'All Accessories' },
  { key: 'new', label: 'New Arrivals' },
  { key: 'trending', label: 'Trending' },
  { key: 'popular', label: 'Popular' },
]

const heroSlides = [
  {
    tag: 'Headphones',
    title: ['Premium', 'Headphones', '& Audio Gear'],
    desc: 'Noise-cancelling headphones, wireless earbuds, and high-fidelity audio from top brands like Sony, Bose & more.',
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1920&q=80',
  },
  {
    tag: 'Phone Cases',
    title: ['Stylish', 'Cases', '& Protection'],
    desc: 'Premium phone cases, screen protectors, and skins — keep your device safe in style.',
    img: 'https://images.unsplash.com/photo-1592890288564-76628a30a657?w=1920&q=80',
  },
  {
    tag: 'Chargers',
    title: ['Fast', 'Chargers', '& Cables'],
    desc: 'GaN fast chargers, USB-C cables, wireless charging pads, and power banks for every device.',
    img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1920&q=80',
  },
  {
    tag: 'Wearables',
    title: ['Smart', 'Watches', '& Fitness Bands'],
    desc: 'Apple Watch, Galaxy Watch, Fitbit — stay connected and track your fitness in style.',
    img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&q=80',
  },
  {
    tag: 'All Accessories',
    title: ['Everything', 'Accessories', '— One Stop Shop'],
    desc: 'From earbuds to power banks, cases to chargers — find every accessory you need right here.',
    img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&q=80',
  },
]

function getProductImage(product: any): string {
  const raw = product.common_image || product.image || product.images?.[0] || product.thumbnail || ''
  if (!raw) return FALLBACK_IMG
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  return `${API_BASE_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`
}

function getProductPrice(product: any): { current: number; old: number | null } {
  const v = product.variants?.[0]
  if (!v) return { current: 0, old: null }
  const rawPrice = v.discount_price || v.discountPrice || v.price || 0
  const price = isNaN(Number(rawPrice)) ? 0 : Number(rawPrice)
  const rawOld = v.price || 0
  const old = rawOld > price ? Number(rawOld) : null
  return { current: price, old }
}

function getProductTags(product: any): string[] {
  const tags: string[] = []
  if (product.trending) tags.push('Trending')
  if (product.newArrival) tags.push('New')
  if (product.bestSelling) tags.push('Best Seller')
  if (product.featured) tags.push('Popular')
  return tags
}

let cachedAccessoryCategoryNames: string[] | null = null
let cachedAccessories: Record<string, any[]> = {}

export default function AccessoriesPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [products, setProducts] = useState<any[]>(() => cachedAccessories['all'] || [])
  const [loading, setLoading] = useState(() => !cachedAccessories['all'])
  const [accessoryCategoryNames, setAccessoryCategoryNames] = useState<string[]>(() => cachedAccessoryCategoryNames || [])
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (cachedAccessoryCategoryNames) return
    categoryService.list().then((cats) => {
      const accessoryCats = cats
        .filter((c) => c.status === 'active')
        .filter((c) => /accessor|case|cable|charger|audio|headphone|earphone|wearable|watch|band|screen.protec|power.bank|holder|mount|adapter/i.test(c.name))
        .map((c) => c.name)
      cachedAccessoryCategoryNames = accessoryCats.length > 0 ? accessoryCats : []
      setAccessoryCategoryNames(cachedAccessoryCategoryNames)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const cached = cachedAccessories[activeTab]
    if (cached) {
      setProducts(cached)
      setLoading(false)
      return
    }
    setLoading(true)
    const params: Record<string, any> = { page_size: 50 }
    if (activeTab === 'new') params.is_new_arrival = true
    else if (activeTab === 'trending') params.is_trending = true
    else if (activeTab === 'popular') params.is_featured = true
    productService.list(params).then((data) => {
      const cats = cachedAccessoryCategoryNames || []
      const filtered = cats.length > 0
        ? data.filter((p: any) => cats.includes(p.category))
        : data
      cachedAccessories[activeTab] = filtered
      setProducts(filtered)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [activeTab, accessoryCategoryNames])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            const staggers = entry.target.querySelectorAll('.stagger-item')
            staggers.forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 120)
            })
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08 }
    )
    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [products])

  if (loading) {
    return (
      <>
        <SiteTopNav />
        <DesktopPageLoader text="Loading accessories..." />
        <EcommerceFooter compact />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md selection:bg-[#CB202D]/30 selection:text-[#A81D2A]">
      <SiteTopNav />

      {/* ─── HERO CAROUSEL ─── */}
      <section className="hero-section relative h-screen overflow-hidden bg-black">
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              i === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img src={slide.img} alt="" className="absolute inset-0 w-full h-full object-cover scale-110" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(203,32,45,0.06)_0%,transparent_60%)]" />
            <div className="relative h-full max-w-[1440px] mx-auto px-6 md:px-16 flex items-center">
              <div className="max-w-3xl">
                <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#CB202D]/10 border border-[#CB202D]/25 text-[#CB202D] text-sm font-bold tracking-[0.15em] uppercase mb-8 backdrop-blur-md transition-all duration-700 delay-200 ${
                  i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}>
                  <span className="relative w-2 h-2">
                    <span className="absolute inset-0 rounded-full bg-[#CB202D] animate-ping" />
                    <span className="absolute inset-0 rounded-full bg-[#CB202D]" />
                  </span>
                  {slide.tag}
                </div>
                <h1 className={`text-[clamp(42px,6vw,80px)] font-extrabold leading-[1.05] text-white mb-6 transition-all duration-700 delay-300 ${
                  i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}>
                  {slide.title[0]}<br />
                  <span className="relative inline-block bg-gradient-to-r from-[#CB202D] via-[#E53E4E] to-[#CB202D] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient italic drop-shadow-[0_0_40px_rgba(203,32,45,0.4)]">
                    {slide.title[1]}
                    <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CB202D] to-transparent rounded-full opacity-60 animate-pulse" />
                  </span>{' '}
                  <span className="text-white/90">{slide.title[2]}</span>
                </h1>
                <p className={`text-lg md:text-2xl text-white/70 leading-relaxed max-w-2xl mb-10 transition-all duration-700 delay-400 ${
                  i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}>
                  {slide.desc}
                </p>
                <div className={`flex flex-wrap gap-4 transition-all duration-700 delay-500 ${
                  i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}>
                  <Link
                    to="/accessories"
                    className="group inline-flex items-center gap-2 bg-[#CB202D] text-[#A81D2A] font-bold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-full shadow-[0_0_30px_rgba(203,32,45,0.3)] hover:shadow-[0_0_60px_rgba(203,32,45,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 animate-float"
                  >
                    <span>Shop Accessories</span>
                    <span className="material-symbols-outlined text-lg md:text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </Link>
                  <Link
                    to="/repairs"
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/20 font-semibold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-full hover:bg-white/20 hover:border-white/40 transition-all duration-300"
                  >
                    <span className="material-symbols-outlined text-lg md:text-xl">build</span>
                    Book Repair
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`relative h-1.5 rounded-full transition-all duration-500 overflow-hidden ${
                i === currentSlide ? 'w-16 bg-[#CB202D]' : 'w-6 bg-white/30 hover:bg-white/50'
              }`}
            >
              {i === currentSlide && (
                <span className="absolute inset-0 bg-white/40 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
        <div className="absolute bottom-10 right-6 md:right-12 z-20 text-white/40 text-sm font-mono tracking-wider">
          {String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
        </div>
      </section>

      {/* ─── PRODUCTS ─── */}
      <section className="py-16 px-6 md:px-12 bg-surface scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-[#A81D2A] text-white shadow-lg shadow-black/10'
                    : 'bg-white border border-[#CB202D]/20 text-on-surface-variant hover:border-[#CB202D]/40 hover:text-[#A81D2A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">device_hub</span>
              <p className="text-on-surface-variant">No accessories found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-item">
              {products.map((product) => {
                const price = getProductPrice(product)
                const tags = getProductTags(product)
                const img = getProductImage(product)
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="glass-card p-4 rounded-[1.75rem] group cursor-pointer transition-all duration-500 hover:shadow-[0_20px_60px_rgba(203,32,45,0.10)] hover:border-[#CB202D]/25 hover:-translate-y-1"
                  >
                    <div className="relative rounded-2xl overflow-hidden bg-white h-[240px] mb-4 flex items-center justify-center p-5">
                      {img && img !== FALLBACK_IMG ? (
                        <img
                          src={img}
                          alt={product.name}
                          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
                        />
                      ) : (
                        <div className="flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-5xl">inventory_2</span>
                        </div>
                      )}
                      {tags.length > 0 && (
                        <span className="absolute top-3 left-3 bg-[#CB202D] text-[#A81D2A] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                          {tags[0]}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`) }}
                        className="absolute bottom-3 right-3 bg-[#CB202D] text-[#A81D2A] w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:shadow-[0_0_30px_rgba(203,32,45,0.4)] hover:scale-110 active:scale-95 transition-all duration-300"
                      >
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                      </button>
                    </div>
                    <div className="px-1 pb-1">
                      {product.brand && <p className="text-on-surface-variant text-[11px] uppercase tracking-widest mb-1 font-bold">{product.brand}</p>}
                      <h3 className="font-bold text-base md:text-lg text-on-surface mb-1.5 leading-snug">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[#A81D2A] font-extrabold text-lg">₹{price.current.toLocaleString('en-IN')}</span>
                          {price.old && <span className="text-on-surface-variant text-xs line-through">₹{price.old.toLocaleString('en-IN')}</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span key={s} className={`material-symbols-outlined text-[14px] ${s <= 4 ? 'text-[#e5c364]' : 'text-[#e5c364]/40'}`}>star</span>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-on-surface-variant">{product.rating || '4.9'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <EcommerceFooter compact />
    </div>
  )
}

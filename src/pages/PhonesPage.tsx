import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import StorefrontNavbar from '../components/ecommerce/StorefrontNavbar'
import EcommerceFooter from '../components/ecommerce/Footer'
import MobilePhones from '../components/mobile/MobilePhones'
import { useIsMobile } from '../components/mobile/helpers'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 480%22 fill=%22%23f1eeeb%22%3E%3Crect width=%22400%22 height=%22480%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2218%22 fill=%22%2322C55E%22%3EProduct%3C/text%3E%3C/svg%3E'

const tabs = [
  { key: 'all', label: 'All Phones' },
  { key: 'new', label: 'New Arrivals' },
  { key: 'trending', label: 'Trending' },
  { key: 'popular', label: 'Popular' },
]

const heroSlides = [
  {
    tag: 'Latest Flagships',
    title: ['Premium', 'Smartphones', 'at Best Prices'],
    desc: 'iPhone 16 Pro, Galaxy S24 Ultra, Pixel 9 Pro — top-tier devices with full warranty and exclusive deals.',
    img: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=1920&q=80',
  },
  {
    tag: 'iPhone Collection',
    title: ['Discover the', 'iPhone', 'Experience'],
    desc: 'From the latest iPhone 16 Pro to budget-friendly SE models — find your perfect Apple device.',
    img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1920&q=80',
  },
  {
    tag: 'Android Power',
    title: ['Samsung &', 'Android', 'Flagships'],
    desc: 'Galaxy S24 Ultra, Z Fold 6, Pixel 9 Pro — the best of Android with cutting-edge innovation.',
    img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=1920&q=80',
  },
  {
    tag: 'Budget Phones',
    title: ['Great', 'Phones', 'for Every Budget'],
    desc: 'Mid-range and budget-friendly smartphones that deliver exceptional value without compromise.',
    img: 'https://images.unsplash.com/photo-1592890288564-76628a30a657?w=1920&q=80',
  },
  {
    tag: 'All Brands',
    title: ['One Stop', 'Phone', 'Store — All Brands'],
    desc: 'Apple, Samsung, Google, OnePlus, Xiaomi — every major brand under one roof. Shop now!',
    img: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1920&q=80',
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

export default function PhonesPage() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobilePhones />
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [phoneCategoryNames, setPhoneCategoryNames] = useState<string[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    categoryService.list().then((cats) => {
      const phoneCats = cats
        .filter((c) => c.status === 'active')
        .filter((c) => /phone|smartphone|mobile/i.test(c.name))
        .map((c) => c.name)
      setPhoneCategoryNames(phoneCats.length > 0 ? phoneCats : [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, any> = { page_size: 50 }
    if (activeTab === 'new') params.is_new_arrival = true
    else if (activeTab === 'trending') params.is_trending = true
    else if (activeTab === 'popular') params.is_featured = true
    productService.list(params).then((data) => {
      const filtered = phoneCategoryNames.length > 0
        ? data.filter((p: any) => phoneCategoryNames.includes(p.category))
        : data
      setProducts(filtered)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [activeTab, phoneCategoryNames])

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

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md selection:bg-[#00ff88]/30 selection:text-[#00391c]">
      <StorefrontNavbar activeLabel="Phones" absolute />

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
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(0,255,136,0.06)_0%,transparent_60%)]" />
            <div className="relative h-full max-w-[1440px] mx-auto px-6 md:px-16 flex items-center">
              <div className="max-w-3xl">
                <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/25 text-[#00ff88] text-sm font-bold tracking-[0.15em] uppercase mb-8 backdrop-blur-md transition-all duration-700 delay-200 ${
                  i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}>
                  <span className="relative w-2 h-2">
                    <span className="absolute inset-0 rounded-full bg-[#00ff88] animate-ping" />
                    <span className="absolute inset-0 rounded-full bg-[#00ff88]" />
                  </span>
                  {slide.tag}
                </div>
                <h1 className={`text-[clamp(42px,6vw,80px)] font-extrabold leading-[1.05] text-white mb-6 transition-all duration-700 delay-300 ${
                  i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}>
                  {slide.title[0]}<br />
                  <span className="relative inline-block bg-gradient-to-r from-[#00ff88] via-[#80ffbb] to-[#00ff88] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient italic drop-shadow-[0_0_40px_rgba(0,255,136,0.4)]">
                    {slide.title[1]}
                    <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88] to-transparent rounded-full opacity-60 animate-pulse" />
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
                    to="/phones"
                    className="group inline-flex items-center gap-2 bg-[#00ff88] text-[#00391c] font-bold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-full shadow-[0_0_30px_rgba(0,255,136,0.3)] hover:shadow-[0_0_60px_rgba(0,255,136,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 animate-float"
                  >
                    <span>Shop Phones</span>
                    <span className="material-symbols-outlined text-lg md:text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </Link>
                  <Link
                    to="/trade-in"
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/20 font-semibold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-full hover:bg-white/20 hover:border-white/40 transition-all duration-300"
                  >
                    <span className="material-symbols-outlined text-lg md:text-xl">sync_alt</span>
                    Trade In
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
                i === currentSlide ? 'w-16 bg-[#00ff88]' : 'w-6 bg-white/30 hover:bg-white/50'
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
                    ? 'bg-[#00391c] text-white shadow-lg shadow-black/10'
                    : 'bg-white border border-[#00ff88]/20 text-on-surface-variant hover:border-[#00ff88]/40 hover:text-[#00391c]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">smartphone</span>
              <p className="text-on-surface-variant">No phones found in this category.</p>
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
                    className="glass-card p-4 rounded-[1.75rem] group cursor-pointer transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,255,136,0.10)] hover:border-[#00ff88]/25 hover:-translate-y-1"
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
                        <span className="absolute top-3 left-3 bg-[#00ff88] text-[#00391c] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                          {tags[0]}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`) }}
                        className="absolute bottom-3 right-3 bg-[#00ff88] text-[#00391c] w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] hover:scale-110 active:scale-95 transition-all duration-300"
                      >
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                      </button>
                    </div>
                    <div className="px-1 pb-1">
                      {product.brand && <p className="text-on-surface-variant text-[11px] uppercase tracking-widest mb-1 font-bold">{product.brand}</p>}
                      <h3 className="font-bold text-base md:text-lg text-on-surface mb-1.5 leading-snug">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[#00391c] font-extrabold text-lg">₹{price.current.toLocaleString('en-IN')}</span>
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

      {/* ─── TRADE-IN CTA ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low/20 scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <div className="glass-card rounded-[2.5rem] overflow-hidden border border-[#00ff88]/15 relative shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00391c] via-[#00391c]/80 to-transparent z-10" />
            <div className="relative z-20 flex flex-col md:flex-row items-center justify-between p-10 md:p-16">
              <div className="max-w-xl text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 text-[#00ff88] text-xs font-bold uppercase tracking-[0.15em] mb-4">
                  <span className="material-symbols-outlined text-sm">sync_alt</span>
                  Trade-In Offer
                </span>
                <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-white mb-4">Upgrade & Save Up To <span className="text-[#00ff88]">₹30,000</span></h2>
                <p className="text-white/70 text-lg mb-8 max-w-lg">Trade in your old device and get instant credit toward any new phone in our collection.</p>
                <Link to="/trade-in" className="inline-flex items-center gap-2 bg-[#00ff88] text-[#00391c] font-bold text-base px-8 py-3.5 rounded-full shadow-[0_0_30px_rgba(0,255,136,0.3)] hover:shadow-[0_0_50px_rgba(0,255,136,0.5)] hover:scale-105 active:scale-95 transition-all duration-300">
                  Check Trade-In Value
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
              </div>
              <div className="relative hidden md:block">
                <span className="material-symbols-outlined text-[160px] text-white/10">sync_alt</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <EcommerceFooter />
    </div>
  )
}

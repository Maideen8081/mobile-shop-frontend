import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { categoryService } from '../services/categoryService'
import { productService } from '../services/productService'
import type { Category } from '../services/categoryService'
import { productsData } from '../data/productData'
import StorefrontNavbar from '../components/ecommerce/StorefrontNavbar'
import EcommerceFooter from '../components/ecommerce/Footer'
import { useToast } from '../context/ToastContext'
import SectionLoader from '../components/ecommerce/SectionLoader'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 480%22 fill=%22%23f1eeeb%22%3E%3Crect width=%22400%22 height=%22480%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2218%22 fill=%22%2322C55E%22%3EProduct%3C/text%3E%3C/svg%3E'

let cachedHomeData: { categories?: Category[]; trending?: any[]; newArrivals?: any[]; refurbished?: any[] } | null = null

const fallbackCategories: Category[] = [
  { id: 1, name: 'Smartphones', image: null, status: 'active', products: 20, sub_category_count: 0, created: '', subcategories: [] },
  { id: 2, name: 'Accessories', image: null, status: 'active', products: 15, sub_category_count: 0, created: '', subcategories: [] },
  { id: 3, name: 'Tablets', image: null, status: 'active', products: 8, sub_category_count: 0, created: '', subcategories: [] },
  { id: 4, name: 'Audio', image: null, status: 'active', products: 12, sub_category_count: 0, created: '', subcategories: [] },
  { id: 5, name: 'Wearables', image: null, status: 'active', products: 10, sub_category_count: 0, created: '', subcategories: [] },
  { id: 6, name: 'Chargers', image: null, status: 'active', products: 7, sub_category_count: 0, created: '', subcategories: [] },
]

const SLIDE_IMAGES = [
  'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=1920&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1920&q=80',
  'https://images.unsplash.com/photo-1592890288564-76628a30a657?w=1920&q=80',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1920&q=80',
  'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1920&q=80',
  'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1920&q=80',
]

const heroSlides = [
  {
    tag: 'True Wireless Earbuds',
    title: ['Premium TWS', 'Earbuds', '— Crystal Clarity'],
    desc: 'Noise-cancelling wireless earbuds with immersive sound, long battery life, and ergonomic design for all-day comfort.',
    img: SLIDE_IMAGES[0],
    video: 'https://cdn.coverr.co/videos/coverr-close-up-of-a-smartphone-display-5682/1080p.mp4',
  },
  {
    tag: 'Headphones & Audio',
    title: ['Premium', 'Headphones', '& Audio Gear'],
    desc: 'Noise-cancelling headphones, wireless earbuds, and high-fidelity audio for every budget.',
    img: SLIDE_IMAGES[1],
    video: 'https://cdn.coverr.co/videos/coverr-phone-in-hands-5600/1080p.mp4',
  },
  {
    tag: 'Accessories',
    title: ['Phone', 'Accessories', '& Enhancements'],
    desc: 'Fast chargers, premium cases, screen protectors, power banks — everything to elevate your device.',
    img: SLIDE_IMAGES[2],
    video: 'https://cdn.coverr.co/videos/coverr-close-up-of-a-smartphone-display-5682/1080p.mp4',
  },
  {
    tag: 'Spare Parts',
    title: ['Quality', 'Spare Parts', '& Repairs'],
    desc: 'Genuine screens, batteries, charging ports, and micro-soldering repairs — certified service you can trust.',
    img: SLIDE_IMAGES[3],
    video: 'https://cdn.coverr.co/videos/coverr-phone-in-hands-5600/1080p.mp4',
  },
  {
    tag: 'Tech Hub',
    title: ['One Stop', 'Tech', 'Store — All You Need'],
    desc: 'From phones to accessories to repairs — everything mobile under one roof. Shop the best tech deals today!',
    img: SLIDE_IMAGES[4],
    video: 'https://cdn.coverr.co/videos/coverr-close-up-of-a-smartphone-display-5682/1080p.mp4',
  },
  {
    tag: 'Deals & Offers',
    title: ['Best', 'Deals', '— Unbeatable Prices'],
    desc: 'Grab the latest smartphones, tablets, and accessories at prices you won\'t find anywhere else. Limited time offers!',
    img: SLIDE_IMAGES[5],
    video: 'https://cdn.coverr.co/videos/coverr-phone-in-hands-5600/1080p.mp4',
  },
]

const testimonials = [
  {
    name: 'Arjun Sharma',
    quote: '"Fixed my iPhone screen in under 45 minutes at my office. The precision is unmatched."',
    badge: 'Verified Repair',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpD0gDp2KPBgbOB-g8gRUfCCJzJx0vgpeIdM30Fq3N7ryEonoqHasCj_qJnJNJB-evwweGxXoCIEOZ1GaqlMhErqg6yrJ4m_QyV_Jy4EEePsDpnoxURmjJItCQgJNrfY_3ihxXHZnHPHkp4lqUlLAK-igjIZwezecenuHRlQZEtABxGcNKR6JFAYGEbSlrg0_0qfuZ0prJGJR2ZeBU9gZOPb-mZLsWA5xoY32M8nXtcHSzgEDK2t0Etfck765JZWEFNKutd-9OUA',
  },
  {
    name: 'Priya Kapur',
    quote: '"Bought a refurbished Pixel and it looks brand new. The warranty gives me total peace of mind."',
    badge: 'Verified Purchase',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEGD_xap-ygQ-fNS6sODxUxwv1e1_dABvkJltx4B7-_MVtN3QJcAL9Xl486D7zo3p2cqQ48WYOhk-alO1y55o2t6UjzF45Fx4jfycfzH6qbK8BhYKiXlna3RdRn8yO1Nl1wcTER0XaQpSMqHYKyDawFHEkvGYi31HP5tb21TDgvNv89Ty82r7XjWCYpDzykWnnngwHUDpGQiq1JRoM43zZjHj4WTsVy8-ASs8UsmR2wrl2df6ZwlnQnpnkuPSlFkR05JMH6L2o9Q',
  },
  {
    name: 'Rahul Mehta',
    quote: '"Excellent diagnostics. Honest people are hard to find. They saved me from an unnecessary repair."',
    badge: 'Verified Repair',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvTcGQl6D6p1vLwiAd3uLi43IC34SUX1FqCx-Tf28eHkQihCdEN650pCDiUBL7Ik6i979XXg640FdDbCp3WwIiHrxn-FJ0zg-lGhWU3eXl80fv_uR3heNazeisZ2Mf3HtrxnvkTkL_BZMumGI7NCqbOEoBoBCF-fEzLlOCz7plezWn0wcDM13OLDeT85tCA9ZLvnLrPwRU52ZgtuLjip1qyJ_tNtCab7-Y9gAn28uNAvEigAL4y6QB70Sq_7olGesO8G62XZxulA',
  },
  {
    name: 'Ananya Reddy',
    quote: '"Got my Galaxy S24 Ultra at an amazing price. Their refurbished quality is top-notch with original accessories."',
    badge: 'Verified Purchase',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNjhLhh7xHg7-2FT8j-4Ss91-U4uAENmL521w8epzBjdRPSLvoCS7DhCR8LkTf6cv19u4UlBAhuaeQmq9f4oWqAszcFGkbTSvHprHjer9ih87UOTcxxNxONs0aB3HDmKQNMeCYj5hMlL3aG07bXtweLbjvv27eMeKr8jumXfq_sB4ONBaZb2o_6q3xJ59p3tfO4Q73m4lioD5pnZBcf_heMsYq5z6zOc9JdjV9eIGZW9pCTcuUm-mdcDYekjh-xa0ZdM13AJ1GYA',
  },
]

const partners = ['Apple Authorized', 'Samsung Certified', 'Google Pixel Partner', 'OnePlus Verified']

const categoryIconMap: Record<string, string> = {
  Smartphones: 'smartphone', Phone: 'smartphone', Phones: 'smartphone',
  Laptops: 'laptop_mac', Laptop: 'laptop_mac', Computer: 'laptop_mac',
  Audio: 'headphones', Headphones: 'headphones', Earphone: 'headphones',
  Wearables: 'watch', Watch: 'watch', Watches: 'watch',
  Accessories: 'device_hub', Accessory: 'device_hub',
  Components: 'memory', Component: 'memory',
  Tablets: 'tablet', Tablet: 'tablet',
  Gaming: 'sports_esports',
  Camera: 'camera_alt', Cameras: 'camera_alt',
}

export default function LandingPage() {
   const navigate = useNavigate()
   const { show: showToast } = useToast()
  const [wishlist, setWishlist] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('wishlist') || '[]')) } catch { return new Set() }
  })
  const [currentSlide, setCurrentSlide] = useState(0)
const [countdown, setCountdown] = useState({ hours: '02', mins: '40', secs: '28' })
   const [categories, setCategories] = useState<Category[]>(cachedHomeData?.categories ?? [])
   const [categoriesLoading, setCategoriesLoading] = useState(() => !cachedHomeData)
   const categoryScrollRef = useRef<HTMLDivElement>(null)
   const [canScrollLeft, setCanScrollLeft] = useState(false)
   const [canScrollRight, setCanScrollRight] = useState(false)

   const updateCategoryArrows = () => {
     const el = categoryScrollRef.current
     if (!el) return
     setCanScrollLeft(el.scrollLeft > 4)
     setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
   }

   const scrollCategories = (dir: 'left' | 'right') => {
     const el = categoryScrollRef.current
     if (!el) return
     const amount = el.clientWidth * 0.8
     el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
   }
   const [trendingProducts, setTrendingProducts] = useState<any[]>(cachedHomeData?.trending ?? [])
   const [trendingLoading, setTrendingLoading] = useState(() => !cachedHomeData)
   const [newArrivals, setNewArrivals] = useState<any[]>(cachedHomeData?.newArrivals ?? [])
   const [newArrivalsLoading, setNewArrivalsLoading] = useState(() => !cachedHomeData)
   const [refurbishedPhones, setRefurbishedPhones] = useState<any[]>(cachedHomeData?.refurbished ?? [])
   const [refurbishedLoading, setRefurbishedLoading] = useState(() => !cachedHomeData)

  const toggleWishlist = (id: number, e: React.MouseEvent) => {
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        let s = parseInt(prev.secs) - 1
        let m = parseInt(prev.mins)
        let h = parseInt(prev.hours)
        if (s < 0) { s = 59; m-- }
        if (m < 0) { m = 59; h-- }
        if (h < 0) { h = 23 }
        return { hours: h.toString().padStart(2, '0'), mins: m.toString().padStart(2, '0'), secs: s.toString().padStart(2, '0') }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      const catFallback = () => {
        setCategories(fallbackCategories)
        setTrendingProducts(productsData.filter((p) => p.trending))
        setNewArrivals(productsData.filter((p) => p.newArrival).slice(0, 4))
      }
      try {
        const [cats, trending, arrivals] = await Promise.all([
          categoryService.list(),
          productService.list({ is_trending: true, page_size: 8 }),
          productService.list({ is_new_arrival: true, page_size: 4 }),
        ])
        if (cancelled) return
        const activeCats = cats.filter((c) => c.status === 'active')
        const cat = activeCats.length > 0 ? activeCats : fallbackCategories
        const tr = trending.length > 0 ? trending : productsData.filter((p) => p.trending)
        const na = arrivals.length > 0 ? arrivals : productsData.filter((p) => p.newArrival).slice(0, 4)
        setCategories(cat)
        setTrendingProducts(tr)
        setNewArrivals(na)
        if (cachedHomeData) cachedHomeData.categories = cat
        if (cachedHomeData) cachedHomeData.trending = tr
        if (cachedHomeData) cachedHomeData.newArrivals = na
      } catch {
        if (!cancelled) catFallback()
      }
      try {
        const refurbished = await productService.list({ is_refurbished: true, page_size: 8 })
        if (!cancelled) {
          setRefurbishedPhones(refurbished)
          if (cachedHomeData) cachedHomeData.refurbished = refurbished
        }
      } catch {
        if (!cancelled) {
          const fb = productsData.filter((p) => p.refurbished).slice(0, 8)
          setRefurbishedPhones(fb)
          if (cachedHomeData) cachedHomeData.refurbished = fb
        }
      }
      if (!cancelled) {
        setCategoriesLoading(false)
        setTrendingLoading(false)
        setNewArrivalsLoading(false)
        setRefurbishedLoading(false)
      }
    }
    if (cachedHomeData) {
      setCategories(cachedHomeData.categories ?? [])
      setTrendingProducts(cachedHomeData.trending ?? [])
      setNewArrivals(cachedHomeData.newArrivals ?? [])
      setRefurbishedPhones(cachedHomeData.refurbished ?? [])
      fetchData()
      return () => { cancelled = true }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            const staggers = entry.target.querySelectorAll('.stagger-item')
            staggers.forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 80)
            })
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [categories, trendingProducts, newArrivals, refurbishedPhones, categoriesLoading, trendingLoading, newArrivalsLoading, refurbishedLoading])

  useEffect(() => {
    updateCategoryArrows()
    window.addEventListener('resize', updateCategoryArrows)
    return () => window.removeEventListener('resize', updateCategoryArrows)
  }, [categories])

  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    if (path.startsWith('/')) return `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
    if (/^[\w\-./]+$/.test(path)) return `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
    return ''
  }

  const getProductImage = (product: any): string => {
    const raw = product.common_image || product.image || product.images?.[0] || product.thumbnail || product.variants?.[0]?.images?.[0] || ''
    return getImageUrl(raw)
  }

  const getProductPrice = (product: any): string => {
    const variant = product.variants?.[0]
    if (!variant) return ''
    const price = variant.discountPrice || variant.price
    return `₹${Number(price).toLocaleString('en-IN')}`
  }

  const getCategoryImage = (cat: Category): string => getImageUrl(cat.image)
  const getCategoryIcon = (name: string): string => categoryIconMap[name] || 'category'

  const trending = trendingProducts.length > 0 ? trendingProducts : productsData.filter((p) => p.trending)
  const arrivals = newArrivals.length > 0 ? newArrivals : productsData.filter((p) => p.newArrival).slice(0, 4)
  const refurbished = refurbishedPhones.length > 0 ? refurbishedPhones : productsData.filter((p) => p.refurbished).slice(0, 8)

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md selection:bg-[#CB202D]/30 selection:text-[#A81D2A]">
      {/* ─── HERO CAROUSEL (Video Background) ─── */}
      <section className="hero-section relative h-screen min-h-[800px] overflow-hidden bg-black" style={{ marginTop: 0, paddingTop: 0 }}>
        <StorefrontNavbar activeLabel="Home" absolute />
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-[1.2s] ease-in-out ${
              i === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <div className="absolute inset-0">
              <video
                className="absolute inset-0 w-full h-full object-cover scale-110"
                autoPlay
                muted
                loop
                playsInline
                poster={slide.img}
              >
                <source src={slide.video} type="video/mp4" />
              </video>
              <img
                src={slide.img}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#CB202D]/5 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(203,32,45,0.06)_0%,transparent_60%)]" />
            <div className="relative h-full max-w-[1440px] mx-auto px-6 md:px-16 flex flex-col justify-center pt-[140px]">
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
                    to="/phones"
                    className="group inline-flex items-center gap-2 bg-[#CB202D] text-white font-bold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-full shadow-[0_0_30px_rgba(203,32,45,0.3)] hover:shadow-[0_0_60px_rgba(203,32,45,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 animate-float"
                  >
                    <span>Shop Now</span>
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
        {/* Slide indicators */}
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
        {/* Slide counter */}
        <div className="absolute bottom-10 right-6 md:right-12 z-20 text-white/40 text-sm font-mono tracking-wider">
          {String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface">
        <div className="max-w-[1440px] mx-auto scroll-reveal">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-[#CB202D] tracking-[0.2em] uppercase mb-3">Categories</span>
            <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface">Browse by Category</h2>
          </div>

          {categoriesLoading ? (
            <SectionLoader type="categories" count={6} />
          ) : (
            <>
          <div className="relative">
            {/* Left arrow */}
            <button
              type="button"
              onClick={() => scrollCategories('left')}
              aria-label="Previous categories"
              className={`hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full bg-white border border-[#CB202D]/20 text-[#A81D2A] shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:bg-[#CB202D] hover:text-white hover:scale-105 transition-all duration-300 ${canScrollLeft ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'}`}
            >
              <span className="material-symbols-outlined text-2xl">chevron_left</span>
            </button>

            {/* Right arrow */}
            <button
              type="button"
              onClick={() => scrollCategories('right')}
              aria-label="Next categories"
              className={`hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full bg-white border border-[#CB202D]/20 text-[#A81D2A] shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:bg-[#CB202D] hover:text-white hover:scale-105 transition-all duration-300 ${canScrollRight ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'}`}
            >
              <span className="material-symbols-outlined text-2xl">chevron_right</span>
            </button>

            <div
              ref={categoryScrollRef}
              onScroll={updateCategoryArrows}
              className="flex gap-5 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/collection/${encodeURIComponent(cat.name)}`}
                  className="relative flex-shrink-0 w-[200px] h-[230px] p-7 rounded-2xl flex flex-col items-center justify-center gap-4 group transition-all duration-400 hover:-translate-y-1.5 stagger-item overflow-hidden snap-start hover:shadow-[0_20px_50px_rgba(203,32,45,0.18)] hover:border-[#CB202D]/40 border border-transparent"
                  style={{
                    background: `linear-gradient(145deg, #ffffff, #f5f5f5)`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
                  }}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#CB202D]/5 rounded-bl-[100%] transition-all duration-500 group-hover:bg-[#CB202D]/15 group-hover:w-28 group-hover:h-28" />
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#CB202D]/20 to-[#CB202D]/5 flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(203,32,45,0.15)] transition-all duration-300 overflow-hidden relative z-10">
                    {getCategoryImage(cat) ? (
                      <img src={getCategoryImage(cat)} alt={cat.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-[#A81D2A]">{getCategoryIcon(cat.name)}</span>
                    )}
                  </div>
                  <div className="relative z-10 text-center">
                    <h3 className="font-bold text-base text-on-surface group-hover:text-[#A81D2A] transition-colors">{cat.name}</h3>
                    <p className="text-xs text-on-surface-variant/70 font-medium mt-1">{cat.products} items</p>
                  </div>
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#CB202D]/0 rounded-full transition-all duration-400 group-hover:bg-[#CB202D]/30" />
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile arrows */}
          <div className="flex md:hidden items-center justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={() => scrollCategories('left')}
              aria-label="Previous categories"
              disabled={!canScrollLeft}
              className={`w-11 h-11 flex items-center justify-center rounded-full bg-white border border-[#CB202D]/20 text-[#A81D2A] shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-40'}`}
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => scrollCategories('right')}
              aria-label="Next categories"
              disabled={!canScrollRight}
              className={`w-11 h-11 flex items-center justify-center rounded-full bg-white border border-[#CB202D]/20 text-[#A81D2A] shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-40'}`}
            >
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </button>
          </div>
            </>
          )}
        </div>
      </section>

      {/* ─── HOT DEAL ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low/20">
        <div className="max-w-[1440px] mx-auto scroll-reveal">
          <div className="glass-card overflow-hidden rounded-[2.5rem] border border-[#CB202D]/15 flex flex-col lg:flex-row items-stretch relative shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
            <div className="absolute top-6 right-6 z-10">
              <span className="inline-flex items-center gap-1.5 bg-[#ba1a1a] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Limited Offer
              </span>
            </div>
            <div className="flex-1 p-8 md:p-14 flex flex-col gap-6 justify-center">
              <div className="flex items-center gap-2 text-xs font-bold text-[#CB202D] tracking-[0.15em] uppercase">
                <span className="material-symbols-outlined text-base">local_fire_department</span>
                Flash Sale
              </div>
              <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface leading-tight">Tech Essentials<br /><span className="text-[#CB202D]">Up to 25% Off</span></h2>
              <div className="flex gap-4">
                {[
                  { label: 'Hours', val: countdown.hours },
                  { label: 'Minutes', val: countdown.mins },
                  { label: 'Seconds', val: countdown.secs },
                ].map((unit) => (
                  <div key={unit.label} className="flex flex-col items-center bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl min-w-[90px] border border-[#CB202D]/10 shadow-sm">
                    <span className="text-[clamp(28px,3vw,40px)] font-extrabold text-[#A81D2A] tabular-nums">{unit.val}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant tracking-widest mt-1">{unit.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-base md:text-lg text-on-surface-variant leading-relaxed">Grab the latest flagships and premium accessories at unbeatable prices. Certified performance, uncompromised quality.</p>
              <Link
                to="/collection/all"
                className="inline-flex items-center gap-2 w-fit bg-on-surface text-surface font-bold text-base px-8 py-3.5 rounded-full shadow-[0_0_25px_rgba(203,32,45,0.2)] hover:bg-[#CB202D] hover:text-[#A81D2A] hover:shadow-[0_0_40px_rgba(203,32,45,0.4)] transition-all duration-300"
              >
                Claim Offer Now
                <span className="material-symbols-outlined text-lg">bolt</span>
              </Link>
            </div>
            <div className="flex-1 min-h-[320px] lg:min-h-full relative overflow-hidden bg-gradient-to-br from-[#A81D2A]/5 to-[#CB202D]/5">
              <img alt="Flash Sale" className="absolute inset-0 w-full h-full object-contain p-8 md:p-12 hover:scale-105 transition-transform duration-700" src={heroSlides[4].img} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRENDING DEVICES ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface">
        <div className="max-w-[1440px] mx-auto scroll-reveal">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="inline-block text-xs font-bold text-[#CB202D] tracking-[0.2em] uppercase mb-3">Trending</span>
              <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface">Trending Devices</h2>
              <p className="text-base md:text-lg text-on-surface-variant mt-1">The most sought-after tech in our collection.</p>
            </div>
            <Link to="/collection/all?tab=trending" className="inline-flex items-center gap-1.5 text-[#A81D2A] font-bold text-sm px-5 py-2.5 rounded-full border border-[#CB202D]/20 hover:bg-[#CB202D]/10 hover:border-[#CB202D]/40 transition-all shrink-0">
              Explore All <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>
          {trendingLoading ? (
            <SectionLoader type="products" count={8} />
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trending.slice(0, 8).map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="glass-card p-4 rounded-[1.75rem] group cursor-pointer transition-all duration-500 hover:shadow-[0_20px_60px_rgba(203,32,45,0.10)] hover:border-[#CB202D]/25 hover:-translate-y-1 stagger-item"
              >
                <div className="relative rounded-2xl overflow-hidden bg-white h-[270px] mb-4 flex items-center justify-center p-5">
                  {getProductImage(product) ? (
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
                    />
                  ) : (
                    <div className="flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-5xl">inventory_2</span>
                    </div>
                  )}
                  <Link
                    to={`/product/${product.id}`}
                    className="absolute bottom-4 right-4 bg-[#CB202D] text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:shadow-[0_0_30px_rgba(203,32,45,0.4)] hover:scale-110 active:scale-95 transition-all duration-300"
                  >
                    <span className="material-symbols-outlined text-xl">visibility</span>
                  </Link>
                </div>
                <div className="px-1 pb-1">
                  <h3 className="font-bold text-base md:text-lg text-on-surface mb-1.5 leading-snug">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[#A81D2A] font-extrabold text-lg">{getProductPrice(product)}</span>
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
            ))}
          </div>
          )}
        </div>
      </section>

      {/* ─── REPAIR SERVICES ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low/20 scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-[#CB202D] tracking-[0.2em] uppercase mb-3">Services</span>
            <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface mb-4">Precision Repair Services</h2>
            <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">From micro-soldering to full device restoration — we handle it all with clinical precision.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: 'bolt', title: 'Express Repair', desc: 'Wait in our comfortable lounge while we fix your screen or battery in under 60 minutes.', gradient: 'from-[#CB202D]/10 to-transparent' },
              { icon: 'local_shipping', title: 'Mail-In Service', desc: 'Send your device from anywhere with our secure, prepaid shipping kits and track online.', gradient: 'from-[#e5c364]/10 to-transparent' },
              { icon: 'home_repair_service', title: 'On-Site Tech', desc: "We'll come to your home or office for specific repairs, ensuring zero downtime for you.", gradient: 'from-[#CB202D]/10 to-transparent' },
            ].map((service) => (
              <div key={service.title} className={`glass-card p-8 md:p-10 rounded-[2rem] flex flex-col gap-5 group transition-all duration-500 hover:shadow-[0_20px_60px_rgba(203,32,45,0.10)] hover:-translate-y-1 stagger-item bg-gradient-to-b ${service.gradient}`}>
                <div className="w-16 h-16 rounded-2xl bg-[#CB202D]/20 text-[#A81D2A] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#CB202D]/30 transition-all duration-300">
                  <span className="material-symbols-outlined text-3xl">{service.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface">{service.title}</h3>
                <p className="text-base text-on-surface-variant leading-relaxed">{service.desc}</p>
                <Link to="/repairs" className="inline-flex items-center gap-1.5 text-[#A81D2A] font-bold text-sm group-hover:gap-3 transition-all duration-300 mt-auto pt-2">
                  Learn More <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEW ARRIVALS ─── */}
      {newArrivalsLoading ? (
        <section className="py-20 px-6 md:px-12 bg-surface scroll-reveal">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <span className="inline-block text-xs font-bold text-[#CB202D] tracking-[0.2em] uppercase mb-3">New</span>
                <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface">New Arrivals</h2>
                <p className="text-base md:text-lg text-on-surface-variant mt-1">Discover the latest cutting-edge technology.</p>
              </div>
            </div>
            <SectionLoader type="products" count={4} />
          </div>
        </section>
      ) : (
        arrivals.length > 0 && (
        <section className="py-20 px-6 md:px-12 bg-surface scroll-reveal">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <span className="inline-block text-xs font-bold text-[#CB202D] tracking-[0.2em] uppercase mb-3">New</span>
                <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface">New Arrivals</h2>
                <p className="text-base md:text-lg text-on-surface-variant mt-1">Discover the latest cutting-edge technology.</p>
              </div>
              <Link to="/collection/all?tab=new" className="inline-flex items-center gap-1.5 text-[#A81D2A] font-bold text-sm px-5 py-2.5 rounded-full border border-[#CB202D]/20 hover:bg-[#CB202D]/10 hover:border-[#CB202D]/40 transition-all shrink-0">
                View All <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {arrivals.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="glass-card p-4 rounded-2xl group relative cursor-pointer hover:border-[#CB202D]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 stagger-item"
                >
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-[#CB202D] text-white text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-widest shadow-lg">New</span>
                  </div>
                  <div className="bg-white rounded-xl overflow-hidden h-[210px] mb-4 flex items-center justify-center p-5">
                    {getProductImage(product) ? (
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-all duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
                      />
                    ) : (
                      <div className="flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-5xl">inventory_2</span>
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-base text-on-surface mb-1">{product.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[#A81D2A] font-extrabold text-lg">{getProductPrice(product)}</p>
                    <div className="flex gap-1">
                      <Link to={`/product/${product.id}`} className="p-2.5 rounded-xl bg-[#CB202D]/10 text-[#A81D2A] hover:bg-[#CB202D] hover:text-[#A81D2A] transition-all duration-300">
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </Link>
                      <button onClick={(e) => toggleWishlist(product.id, e)}
                        className={`p-2.5 rounded-xl transition-all duration-300 ${
                          wishlist.has(product.id) ? 'bg-[#CB202D]/10 text-[#CB202D]' : 'text-on-surface-variant hover:text-[#A81D2A] hover:bg-[#CB202D]/10'
                        }`}>
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: wishlist.has(product.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )
      )}

      {/* ─── CERTIFIED REFURBISHED ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low/20 scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="inline-block text-xs font-bold text-[#CB202D] tracking-[0.2em] uppercase mb-3">Refurbished</span>
              <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface">Certified Refurbished</h2>
              <p className="text-base md:text-lg text-on-surface-variant mt-1">Pristine devices, verified for excellence.</p>
            </div>
            <Link to="/phones" className="inline-flex bg-on-surface text-surface font-bold text-sm px-6 py-2.5 rounded-full hover:bg-[#CB202D] hover:text-[#A81D2A] transition-all duration-300 shrink-0">View Collection</Link>
          </div>
          {refurbishedLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card p-4 rounded-2xl">
                  <div className="bg-gray-200 rounded-xl h-[210px] mb-4 animate-pulse" />
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {refurbished.slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="glass-card p-4 rounded-2xl group relative cursor-pointer hover:border-[#CB202D]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 stagger-item"
                >
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-[#A81D2A] text-white text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-widest shadow-lg">Certified Refurbished</span>
                  </div>
                  <div className="bg-white rounded-xl overflow-hidden h-[210px] mb-4 flex items-center justify-center p-5">
                    {getProductImage(product) ? (
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-all duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
                      />
                    ) : (
                      <div className="flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-5xl">inventory_2</span>
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-base text-on-surface">{product.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[#A81D2A] font-extrabold text-lg">{getProductPrice(product)}</p>
                    <Link to={`/product/${product.id}`} className="p-2.5 rounded-xl bg-[#CB202D]/10 text-[#A81D2A] hover:bg-[#CB202D] hover:text-[#A81D2A] transition-all duration-300">
                      <span className="material-symbols-outlined text-xl">visibility</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── VIDEO SHOWCASE ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-[#CB202D] tracking-[0.2em] uppercase mb-3">In Action</span>
            <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface mb-4">See the Precision in Action</h2>
            <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">Watch how we bring your devices back to life with clinical-grade repair techniques.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative group rounded-[2rem] overflow-hidden shadow-xl aspect-video bg-black">
              <video className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700" autoPlay muted loop playsInline poster={heroSlides[0].img}>
                <source src="https://cdn.coverr.co/videos/coverr-close-up-of-a-smartphone-display-5682/1080p.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <span className="text-white text-lg md:text-xl font-bold">Precision Micro-Soldering</span>
                <p className="text-white/60 text-sm mt-1">Board-level repair with microscopic accuracy</p>
              </div>
              <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-[#CB202D]/20 backdrop-blur-sm border border-[#CB202D]/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="material-symbols-outlined text-[#CB202D]">play_arrow</span>
              </div>
            </div>
            <div className="relative group rounded-[2rem] overflow-hidden shadow-xl aspect-video bg-black">
              <video className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700" autoPlay muted loop playsInline poster={heroSlides[1].img}>
                <source src="https://cdn.coverr.co/videos/coverr-phone-in-hands-5600/1080p.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <span className="text-white text-lg md:text-xl font-bold">Diagnostic Calibration</span>
                <p className="text-white/60 text-sm mt-1">Advanced testing for peak performance</p>
              </div>
              <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-[#CB202D]/20 backdrop-blur-sm border border-[#CB202D]/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="material-symbols-outlined text-[#CB202D]">play_arrow</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PARTNERS MARQUEE ─── */}
      <section className="py-16 overflow-hidden bg-surface-container-highest">
        <div className="flex animate-marquee whitespace-nowrap items-center">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-20 mx-12">
              {partners.map((p) => (
                <span key={p + dup} className="text-5xl md:text-7xl font-extrabold text-on-surface/10 uppercase tracking-tighter select-none">{p}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 px-6 md:px-12 overflow-hidden bg-surface">
        <div className="max-w-[1440px] mx-auto scroll-reveal">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-[#CB202D] tracking-[0.2em] uppercase mb-3">Testimonials</span>
            <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface mb-4">Trusted by Thousands</h2>
            <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">Real experiences from our community of tech enthusiasts.</p>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="min-w-[320px] md:min-w-[400px] snap-center glass-card p-8 md:p-10 rounded-[2rem] flex flex-col gap-5 shrink-0 hover:shadow-[0_20px_60px_rgba(203,32,45,0.08)] transition-shadow duration-500"
                style={{ animation: `float-slow 8s ease-in-out infinite`, animationDelay: `${i * 1.2}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#CB202D]/10 shrink-0 ring-2 ring-[#CB202D]/20">
                    <img alt={t.name} className="w-full h-full object-cover" src={t.img} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-on-surface">{t.name}</h4>
                    <div className="flex text-[#e5c364] mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="material-symbols-outlined text-sm">star</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-base text-on-surface-variant italic leading-relaxed">{t.quote}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#A81D2A] uppercase tracking-widest mt-auto pt-2 border-t border-[#CB202D]/10">
                  <span className="material-symbols-outlined text-sm text-[#CB202D]">verified</span>
                  {t.badge}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <EcommerceFooter />
    </div>
  )
}

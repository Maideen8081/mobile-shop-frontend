import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { requireSignInForWishlist } from '../utils/wishlist'
import { categoryService } from '../services/categoryService'
import { productService } from '../services/productService'
import type { Category } from '../services/categoryService'
import { productsData } from '../data/productData'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import EcommerceFooter from '../components/ecommerce/Footer'
import StoreLocation from '../components/ecommerce/StoreLocation'
import { useToast } from '../context/ToastContext'
import SectionLoader from '../components/ecommerce/SectionLoader'
import FlashSaleStage, { type FlashSaleCard } from '../components/ecommerce/FlashSaleStage'
import RefurbishedShowcase, { type RefurbishedDevice } from '../components/ecommerce/RefurbishedShowcase'
import ProductCard, { type ProductCardData } from '../components/ecommerce/ProductCard'
import YouTubeLite from '../components/ui/YouTubeLite'
import SectionHeading, { Accent } from '../components/ui/SectionHeading'
import explodingViewVideo from '../assets/Orange_smartphone_exploding_view_1080p_20261002155324.mp4'
import internalComponentsVideo from '../assets/Smartphone_internal_components_1080p_20261002155902.mp4'
import explodingViewPoster from '../assets/hero-exploding-view-poster.jpg'
import internalComponentsPoster from '../assets/hero-internal-components-poster.jpg'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const FALLBACK_IMG =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 480%22 fill=%22%23f1eeeb%22%3E%3Crect width=%22400%22 height=%22480%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2218%22 fill=%22%2322C55E%22%3EProduct%3C/text%3E%3C/svg%3E'

let cachedHomeData: {
  categories?: Category[]
  trending?: any[]
  newArrivals?: any[]
  refurbished?: any[]
} | null = null

const fallbackCategories: Category[] = [
  {
    id: 1,
    name: 'Smartphones',
    image: null,
    status: 'active',
    products: 20,
    sub_category_count: 0,
    created: '',
    subcategories: [],
  },
  {
    id: 2,
    name: 'Accessories',
    image: null,
    status: 'active',
    products: 15,
    sub_category_count: 0,
    created: '',
    subcategories: [],
  },
  {
    id: 3,
    name: 'Tablets',
    image: null,
    status: 'active',
    products: 8,
    sub_category_count: 0,
    created: '',
    subcategories: [],
  },
  {
    id: 4,
    name: 'Audio',
    image: null,
    status: 'active',
    products: 12,
    sub_category_count: 0,
    created: '',
    subcategories: [],
  },
  {
    id: 5,
    name: 'Wearables',
    image: null,
    status: 'active',
    products: 10,
    sub_category_count: 0,
    created: '',
    subcategories: [],
  },
  {
    id: 6,
    name: 'Chargers',
    image: null,
    status: 'active',
    products: 7,
    sub_category_count: 0,
    created: '',
    subcategories: [],
  },
]

/* YouTube "In Action" features — first id plays in the left tile, second in
   the right tile. Both are loaded lazily on hover/click. */
const VIDEO_FEATURES = [
  { videoId: 'GVpAOzDBxkk', title: 'Precision Micro-Soldering', subtitle: 'Board-level repair with microscopic accuracy' },
  { videoId: '65UD9JreEzM', title: 'Diagnostic Calibration', subtitle: 'Advanced testing for peak performance' },
]

/**
 * Hero carousel content. Two local clips, played back-to-back end-to-end —
 * the next slide only starts once the current video reports `ended`.
 *
 * Each clip carries several copy variants that rotate independently of the
 * video, so the messaging changes while a clip is still playing. All copy is
 * written around what this app actually sells: repairs, genuine spares and
 * device servicing.
 */
type HeroCopy = { tag: string; title: [string, string, string]; desc: string }

const heroSlides: { video: string; poster: string; copies: HeroCopy[] }[] = [
  {
    video: explodingViewVideo,
    poster: explodingViewPoster,
    copies: [
      {
        tag: 'Inside The Repair',
        title: ['Exploded', 'View', '\u2014 Every Part Accounted For'],
        desc: 'See exactly what a genuine screen, battery or charging port replacement involves \u2014 component by component, with parts you can actually verify.',
      },
      {
        tag: 'Genuine Spare Parts',
        title: ['Original', 'Components', '\u2014 Never Before Fitted'],
        desc: 'Grade-A displays, OEM batteries and tested charging ports. Every part is inspected on the bench before it ever goes into your phone.',
      },
      {
        tag: 'Repair With Proof',
        title: ['Every', 'Component', '\u2014 Verified Before We Close'],
        desc: 'Twenty-one point diagnostics before and after every job, so you know exactly what failed and precisely what we replaced.',
      },
    ],
  },
  {
    video: internalComponentsVideo,
    poster: internalComponentsPoster,
    copies: [
      {
        tag: 'Board-Level Repair',
        title: ['Micro-Soldering', 'On The', 'Board Itself'],
        desc: 'Charging ports, speakers and power ICs are rebuilt at component level \u2014 the kind of work that needs a microscope, not a screwdriver.',
      },
      {
        tag: 'Data Stays Put',
        title: ['Your Data', 'Survives', 'The Whole Repair'],
        desc: 'We back up and restore your photos, messages and apps, so a full screen replacement genuinely feels like nothing happened.',
      },
      {
        tag: 'Express Service',
        title: ['Most Repairs', 'Done While', 'You Wait'],
        desc: 'Drop it off before lunch and collect it before we close. Express repairs on most flagship screens and batteries, same day.',
      },
    ],
  },
]

/* ── Desktop scroll-driven 3D ───────────────────────────────────────────
   One rAF loop drives every opted-in panel: it writes rotateX / translateY
   / translateZ straight onto the element as custom properties, which the
   `.tilt3d` rules in index.css turn into a transform. No React state is
   involved, so scrolling never triggers a re-render. The loop only runs
   while something is registered, and registration requires a desktop
   viewport without a reduced-motion preference. */
const tiltTargets = new Set<HTMLElement>()
let tiltFrame = 0

const tiltLoop = () => {
  const viewportHeight = window.innerHeight
  for (const el of tiltTargets) {
    const rect = el.getBoundingClientRect()
    /* Cheap cull: skip panels that are nowhere near the viewport. */
    if (rect.bottom < -240 || rect.top > viewportHeight + 240) continue
    /* 0 as the panel enters from below, 1 once it has scrolled past. */
    const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height)
    const centred = 0.5 - progress
    el.style.setProperty('--tilt-x', `${(centred * 15).toFixed(2)}deg`)
    el.style.setProperty('--tilt-y', `${(centred * 34).toFixed(1)}px`)
    el.style.setProperty('--tilt-z', `${(-Math.abs(centred) * 110).toFixed(1)}px`)
  }
  tiltFrame = requestAnimationFrame(tiltLoop)
}

const tiltStart = () => {
  if (!tiltFrame) tiltFrame = requestAnimationFrame(tiltLoop)
}

const tiltStop = () => {
  if (tiltFrame) cancelAnimationFrame(tiltFrame)
  tiltFrame = 0
}

const TILT_QUERY = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'

/** Advertised product tabs inside the "Tech Essentials" offer panel. */
const DEAL_TABS = [
  { key: 'popular', label: 'Popular', icon: 'local_fire_department' },
  { key: 'new', label: 'New', icon: 'fiber_new' },
  { key: 'trending', label: 'Trending', icon: 'trending_up' },
] as const

type DealTabKey = (typeof DEAL_TABS)[number]['key']

/**
 * The hero renders one slide per clip, so a plain <h1> inside the map produced
 * two of them. Only the slide on screen keeps the H1; parked slides fall back
 * to H2 and are aria-hidden, leaving the outline with a single entry point.
 */
function SlideHeading({
  isActive,
  className,
  children,
}: {
  isActive: boolean
  className?: string
  children: ReactNode
}) {
  const Tag = isActive ? 'h1' : 'h2'
  return <Tag className={className}>{children}</Tag>
}

/** Wraps a panel so it tilts in 3D as it crosses the viewport on desktop. */
function Tilt3D({
  children,
  amount = 1,
  className = '',
}: {
  children: ReactNode
  amount?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const query = window.matchMedia(TILT_QUERY)
    const sync = () => {
      if (query.matches) {
        el.style.setProperty('--tilt-amount', String(amount))
        tiltTargets.add(el)
        tiltStart()
      } else {
        tiltTargets.delete(el)
        el.style.removeProperty('--tilt-x')
        el.style.removeProperty('--tilt-y')
        el.style.removeProperty('--tilt-z')
        if (tiltTargets.size === 0) tiltStop()
      }
    }

    sync()
    query.addEventListener('change', sync)
    return () => {
      query.removeEventListener('change', sync)
      tiltTargets.delete(el)
      if (tiltTargets.size === 0) tiltStop()
    }
  }, [amount])

  return (
    <div ref={ref} className={`tilt3d ${className}`.trim()}>
      {children}
    </div>
  )
}

const testimonials = [
  {
    name: 'Arjun Sharma',
    quote: '"Fixed my iPhone screen in under 45 minutes at my office. The precision is unmatched."',
    badge: 'Verified Repair',
  },
  {
    name: 'Priya Kapur',
    quote:
      '"Bought a refurbished Pixel and it looks brand new. The warranty gives me total peace of mind."',
    badge: 'Verified Purchase',
  },
  {
    name: 'Rahul Mehta',
    quote:
      '"Excellent diagnostics. Honest people are hard to find. They saved me from an unnecessary repair."',
    badge: 'Verified Repair',
  },
  {
    name: 'Ananya Reddy',
    quote:
      '"Got my Galaxy S24 Ultra at an amazing price. Their refurbished quality is top-notch with original accessories."',
    badge: 'Verified Purchase',
  },
]

const partners = [
  'Apple Authorized',
  'Samsung Certified',
  'Google Pixel Partner',
  'OnePlus Verified',
]

const categoryIconMap: Record<string, string> = {
  Smartphones: 'smartphone',
  Phone: 'smartphone',
  Phones: 'smartphone',
  Laptops: 'laptop_mac',
  Laptop: 'laptop_mac',
  Computer: 'laptop_mac',
  Audio: 'headphones',
  Headphones: 'headphones',
  Earphone: 'headphones',
  Wearables: 'watch',
  Watch: 'watch',
  Watches: 'watch',
  Accessories: 'device_hub',
  Accessory: 'device_hub',
  Components: 'memory',
  Component: 'memory',
  Tablets: 'tablet',
  Tablet: 'tablet',
  Gaming: 'sports_esports',
  Camera: 'camera_alt',
  Cameras: 'camera_alt',
}

export default function LandingPage() {
  const { show: showToast } = useToast()
  const navigate = useNavigate()
  const [wishlist, setWishlist] = useState<Set<number>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('wishlist') || '[]'))
    } catch {
      return new Set()
    }
  })
  const [currentSlide, setCurrentSlide] = useState(0)
  const [heroCopyIndex, setHeroCopyIndex] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const [slideProgress, setSlideProgress] = useState(0)
  const [categories, setCategories] = useState<Category[]>(cachedHomeData?.categories ?? [])
  const [categoriesLoading, setCategoriesLoading] = useState(() => !cachedHomeData)
  const categoryTrackRef = useRef<HTMLDivElement>(null)
  const categorySetRef = useRef<HTMLDivElement>(null)
  const categoryOffset = useRef(0)
  const [categoryPaused, setCategoryPaused] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  /* Refs mirror the arrow booleans so the rAF loop can compare without
     calling setState 60x/second (which would re-render on every frame). */
  const categoryArrows = useRef({ left: false, right: false })
  const categoryNudge = (dir: 'left' | 'right') => {
    const track = categoryTrackRef.current
    const set = categorySetRef.current
    if (!track || !set) return
    const card = set.querySelector<HTMLElement>('[data-cat-card]')
    const step = card ? card.offsetWidth + 20 : 320
    const half = set.offsetWidth
    if (half <= 0) return
    let next = categoryOffset.current + (dir === 'right' ? step : -step)
    if (next < 0) next += half
    if (next >= half) next -= half
    categoryOffset.current = next
    track.style.transform = `translate3d(${-next}px,0,0)`
  }
  const [trendingProducts, setTrendingProducts] = useState<any[]>(cachedHomeData?.trending ?? [])
  const [trendingLoading, setTrendingLoading] = useState(() => !cachedHomeData)
  const [newArrivals, setNewArrivals] = useState<any[]>(cachedHomeData?.newArrivals ?? [])
  const [newArrivalsLoading, setNewArrivalsLoading] = useState(() => !cachedHomeData)
  const [refurbishedPhones, setRefurbishedPhones] = useState<any[]>(
    cachedHomeData?.refurbished ?? [],
  )
  const [refurbishedLoading, setRefurbishedLoading] = useState(() => !cachedHomeData)
  const [dealTab, setDealTab] = useState<DealTabKey>('popular')

  const toggleWishlist = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!requireSignInForWishlist(navigate)) return
    setWishlist((prev) => {
      const next = new Set(prev)
      let added = false
      if (next.has(id)) {
        next.delete(id)
        added = false
      } else {
        next.add(id)
        added = true
      }
      localStorage.setItem('wishlist', JSON.stringify(Array.from(next)))
      window.dispatchEvent(new Event('wishlist-updated'))
      showToast(added ? 'Added to wishlist' : 'Removed from wishlist', 'success')
      return next
    })
  }

  useEffect(() => {
    /* ── Hero video sequencing ──────────────────────────────────────────
       Each clip plays start-to-finish; the next slide is only entered from
       the active video's `ended` event (watchdog below is a safety net for
       the rare case a browser never fires it). */
    const active = videoRefs.current[currentSlide]
    if (!active) return

    let watchdog = 0
    const advance = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)

    const armWatchdog = () => {
      const seconds = Number.isFinite(active.duration) && active.duration > 0 ? active.duration : 15
      watchdog = window.setTimeout(advance, seconds * 1000 + 2000)
    }

    active.addEventListener('ended', advance)
    if (active.paused) {
      active.currentTime = 0
      void active.play().catch(() => {})
    }
    void active.play().catch(() => {})
    armWatchdog()

    return () => {
      active.removeEventListener('ended', advance)
      window.clearTimeout(watchdog)
    }
  }, [currentSlide])

  /* Rotate the hero copy independently of the clip. Each slide carries several
     app-focused variants; this swaps between them while the video keeps
     playing, and restarts whenever the slide itself changes. */
  useEffect(() => {
    setHeroCopyIndex(0)
    const copies = heroSlides[currentSlide]?.copies ?? []
    if (copies.length < 2) return
    const interval = setInterval(() => {
      setHeroCopyIndex((prev) => (prev + 1) % copies.length)
    }, 5200)
    return () => clearInterval(interval)
  }, [currentSlide])

  /* Pause the carousel while the tab is hidden — these are 5-8 MB clips. */
  useEffect(() => {
    const onVisibility = () => {
      const active = videoRefs.current[currentSlide]
      if (!active) return
      if (document.hidden) active.pause()
      else void active.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [currentSlide])

  /* Jump to a slide from the indicator dots, rewinding if it is already active. */
  const goToSlide = (index: number) => {
    const target = ((index % heroSlides.length) + heroSlides.length) % heroSlides.length
    if (target === currentSlide) {
      const active = videoRefs.current[target]
      if (active) {
        active.currentTime = 0
        void active.play().catch(() => {})
      }
      return
    }
    setCurrentSlide(target)
  }

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      // Filled as sections load, then stored module-wide so returning to this
      // page renders instantly instead of showing the loaders again.
      const next: NonNullable<typeof cachedHomeData> = { ...cachedHomeData }
      const catFallback = () => {
        next.categories = fallbackCategories
        next.trending = productsData.filter((p) => p.trending)
        next.newArrivals = productsData.filter((p) => p.newArrival).slice(0, 4)
        setCategories(next.categories)
        setTrendingProducts(next.trending)
        setNewArrivals(next.newArrivals)
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
        const na =
          arrivals.length > 0 ? arrivals : productsData.filter((p) => p.newArrival).slice(0, 4)
        setCategories(cat)
        setTrendingProducts(tr)
        setNewArrivals(na)
        next.categories = cat
        next.trending = tr
        next.newArrivals = na
      } catch {
        if (!cancelled) catFallback()
      }
      try {
        const refurbished = await productService.list({ is_refurbished: true, page_size: 8 })
        if (!cancelled) {
          setRefurbishedPhones(refurbished)
          next.refurbished = refurbished
        }
      } catch {
        if (!cancelled) {
          const fb = productsData.filter((p) => p.refurbished).slice(0, 8)
          setRefurbishedPhones(fb)
          next.refurbished = fb
        }
      }
      if (!cancelled) {
        cachedHomeData = next
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
      return () => {
        cancelled = true
      }
    }
    fetchData()
    return () => {
      cancelled = true
    }
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
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' },
    )
    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [
    categories,
    trendingProducts,
    newArrivals,
    refurbishedPhones,
    categoriesLoading,
    trendingLoading,
    newArrivalsLoading,
    refurbishedLoading,
  ])

  /* ── Category rail: slow automatic drift ─────────────────────────────
     The category list is rendered twice and the track is translated by a
     rAF-driven offset. Once the offset passes one set's width it wraps back
     by exactly that width, which is invisible because the two sets match.
     Pauses on hover, off-screen, when the tab is hidden, and when the user
     prefers reduced motion. */
  useEffect(() => {
    const track = categoryTrackRef.current
    const set = categorySetRef.current
    if (!track || !set || categories.length === 0) return

    const SPEED = 34 // px per second — deliberately slow
    let half = set.offsetWidth

    const measure = () => {
      half = set.offsetWidth
    }
    measure()

    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(set)

    let inView = true
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
      },
      { threshold: 0.01 },
    )
    intersectionObserver.observe(track)

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const reduceMotion = () => motionQuery.matches
    let reduced = reduceMotion()
    const onMotionChange = () => {
      reduced = reduceMotion()
    }
    motionQuery.addEventListener('change', onMotionChange)

    let frame = 0
    let last = performance.now()

    const paint = () => {
      track.style.transform = `translate3d(${-categoryOffset.current}px,0,0)`
      const next = { left: categoryOffset.current > 4, right: categoryOffset.current < half - 4 }
      if (
        next.left !== categoryArrows.current.left ||
        next.right !== categoryArrows.current.right
      ) {
        categoryArrows.current = next
        setCanScrollLeft(next.left)
        setCanScrollRight(next.right)
      }
    }

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const delta = Math.min((now - last) / 1000, 0.05) // clamp after a tab switch
      last = now
      if (half <= 0) return
      if (!categoryPaused && inView && !document.hidden && !reduced) {
        categoryOffset.current += SPEED * delta
        if (categoryOffset.current >= half) categoryOffset.current -= half
      }
      paint()
    }

    frame = requestAnimationFrame(tick)
    paint()

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      motionQuery.removeEventListener('change', onMotionChange)
    }
  }, [categories.length, categoryPaused])

  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    if (path.startsWith('/'))
      return `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
    if (/^[\w\-./]+$/.test(path))
      return `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
    return ''
  }

  const getProductImage = (product: any): string => {
    const raw =
      product.common_image ||
      product.image ||
      product.images?.[0] ||
      product.thumbnail ||
      product.variants?.[0]?.images?.[0] ||
      ''
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

  const trending =
    trendingProducts.length > 0 ? trendingProducts : productsData.filter((p) => p.trending)
  const arrivals =
    newArrivals.length > 0 ? newArrivals : productsData.filter((p) => p.newArrival).slice(0, 4)
  const refurbished =
    refurbishedPhones.length > 0
      ? refurbishedPhones
      : productsData.filter((p) => p.refurbished).slice(0, 8)

  /* Products advertised inside the "Tech Essentials" panel. The three tabs map
     onto the lists already fetched for the rest of the page, so this adds no
     extra network calls. "Popular" is the highest-rated unique device across
     all three pools. */
  const dealProducts = useMemo(() => {
    if (dealTab === 'new') return arrivals.slice(0, 6)
    if (dealTab === 'trending') return trending.slice(0, 6)

    const seen = new Set<number>()
    const pool = [...trending, ...arrivals, ...refurbished].filter((product) => {
      const id = product?.id
      if (typeof id !== 'number' || seen.has(id)) return false
      seen.add(id)
      return true
    })
    const byRating = (a: any, b: any) => Number(b?.rating ?? 0) - Number(a?.rating ?? 0)
    return pool.sort(byRating).slice(0, 6)
  }, [dealTab, arrivals, trending, refurbished])

  /* Card data for the desktop-only flash sale stage. Pulled from the same
     `dealProducts` pool so real images, names and prices are shown. */
  const dealCards: FlashSaleCard[] = dealProducts.map((product: any): FlashSaleCard => {
    const variant = product?.variants?.[0] ?? product
    const price = Number(variant?.discountPrice || variant?.price || 0)
    const mrp = Number(variant?.price || price)
    return {
      id: Number(product.id),
      name: String(product.name ?? ''),
      image: getProductImage(product),
      price,
      mrp,
      off: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
    }
  })

  /* Device data for the certified-refurbished showcase. Mirrors `dealCards`:
     real images, names, prices and derived grade/rating. */
  const refurbishedDevices: RefurbishedDevice[] = refurbished.slice(0, 8).map((product): RefurbishedDevice => {
    const variant = product?.variants?.[0] ?? product
    const mrp = Number(variant?.price || 0)
    const price = Number(variant?.discountPrice || variant?.price || 0)
    const rating = Number(product?.rating || 0)
    return {
      id: Number(product.id),
      name: String(product.name ?? ''),
      image: getProductImage(product),
      price,
      mrp,
      save: Math.max(0, mrp - price),
      meta: [variant?.storage, variant?.color].filter(Boolean).join(' · '),
      rating,
      grade: rating >= 4.7 ? 'Like new' : rating >= 4.4 ? 'Excellent' : 'Good',
    }
  })

  /* Card data for the Trending / New Arrivals grids, reusing the shared
     ProductCard design (same shell as the refurbished rail, adapted to
     brand-new stock: no condition grade, generic highlights). */
  const toCardData = (product: any, kind: 'trending' | 'new'): ProductCardData => {
    const variant = product?.variants?.[0] ?? product
    const mrp = Number(variant?.price || 0)
    const price = Number(variant?.discountPrice || variant?.price || 0)
    const rating = Number(product?.rating || 0)
    const features: string[] = Array.isArray(product?.features) ? product.features.filter(Boolean) : []
    const checks =
      features.length >= 4
        ? features.slice(0, 5)
        : ['Genuine sealed unit', 'Official warranty', 'Free express delivery', 'Free 7-day returns']
    return {
      id: Number(product.id),
      name: String(product.name ?? ''),
      image: getProductImage(product),
      price,
      mrp,
      save: Math.max(0, mrp - price),
      rating,
      meta: [variant?.storage, variant?.color].filter(Boolean).join(' · '),
      badge: kind === 'trending' ? 'Trending' : 'New',
      badgeIcon: 'spark',
      overlayTitle: kind === 'trending' ? "Why it's trending" : "What's inside",
      checks,
      certTitle: 'Customer rating',
      certText: kind === 'trending' ? 'Free express delivery' : '1-year warranty',
      warranty: '1 yr',
      returns: '7 days',
    }
  }

  const trendingCards: ProductCardData[] = trending.slice(0, 8).map((p) => toCardData(p, 'trending'))
  const arrivalCards: ProductCardData[] = arrivals.slice(0, 4).map((p) => toCardData(p, 'new'))

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md selection:bg-pf-red/30 selection:text-pf-red-dark">
      <SiteTopNav transparent />
      {/* ─── HERO CAROUSEL (Video Background) ─── */}
      <section
        className="hero-section hero-section--full relative overflow-hidden bg-black"
      >
        {heroSlides.map((slide, i) => {
          const copy = slide.copies[heroCopyIndex] ?? slide.copies[0]
          const isActive = i === currentSlide
          return (
            <div
              key={i}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-all duration-[1.2s] ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <div className="absolute -inset-y-16 inset-x-0">
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el
                  }}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  autoPlay
                  muted
                  playsInline
                  poster={slide.poster}
                  preload={i === 0 ? 'auto' : 'metadata'}
                  aria-hidden="true"
                  tabIndex={-1}
                  onTimeUpdate={(e) => {
                    const v = e.currentTarget
                    if (i !== currentSlide) return
                    setSlideProgress(v.duration ? v.currentTime / v.duration : 0)
                  }}
                >
                  <source src={slide.video} type="video/mp4" />
                </video>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-pf-red/5 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(217,30,54,0.06)_0%,transparent_60%)]" />
              {/* Top scrim — a light wash so the transparent navigation layers
                  stay legible on bright slides, while the hero footage still
                  shows clearly through the glass. Kept gentle on purpose. */}
              <div className="absolute inset-x-0 top-0 h-[220px] bg-gradient-to-b from-black/55 via-black/18 to-transparent" />
              <div className="relative h-full max-w-[1440px] mx-auto px-6 md:px-16 flex flex-col justify-center items-start pt-[116px]">
                {/* Keyed on slide + variant so the CSS animation replays each swap. */}
                <div
                  key={`${currentSlide}-${heroCopyIndex}`}
                  className="w-full max-w-[620px] hero-copy-swap"
                >
                  <div
                    className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-[8px] bg-pf-red/20 border border-pf-red/30 text-pf-red text-sm font-bold tracking-[0.15em] uppercase mb-8 backdrop-blur-md transition-all duration-700 delay-200 ${
                      i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                  >
                    <span className="relative w-2 h-2">
                      <span className="absolute inset-0 rounded-[8px] bg-pf-red animate-ping" />
                      <span className="absolute inset-0 rounded-[8px] bg-pf-red" />
                    </span>
                    {copy.tag}
                  </div>
                  <SlideHeading
                    isActive={i === currentSlide}
                    className={`text-[clamp(34px,5vw,60px)] font-extrabold leading-[1.06] text-white mb-5 transition-all duration-700 delay-300 ${
                      i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                  >
                    {copy.title[0]}
                    <br />
                    <span className="relative inline-block bg-gradient-to-r from-pf-red via-pf-red to-pf-red bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient italic drop-shadow-[0_0_40px_rgba(217,30,54,0.4)]">
                      {copy.title[1]}
                      <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pf-red to-transparent rounded-[8px] opacity-60 animate-pulse" />
                    </span>{' '}
                    <span className="text-white/80">{copy.title[2]}</span>
                  </SlideHeading>
                  <p
                    className={`text-lg md:text-2xl text-white/80 leading-relaxed max-w-2xl mb-10 transition-all duration-700 delay-400 ${
                      i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                  >
                    {copy.desc}
                  </p>
                  <div
                    className={`flex flex-wrap gap-4 transition-all duration-700 delay-500 ${
                      i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                  >
                    <Link
                      to="/phones"
                      className="btn btn-primary btn-md group animate-float hover:scale-105 active:scale-95"
                    >
                      <span>Shop Now</span>
                      <span className="material-symbols-outlined text-lg md:text-xl group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </Link>
                    <Link to="/repairs" className="btn btn-outline btn-md">
                      <span className="material-symbols-outlined text-lg md:text-xl">build</span>
                      Book Repair
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {/* Slide indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {heroSlides.map((slide, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToSlide(i)}
              aria-label={`Play slide ${i + 1}: ${slide.copies[0].tag}`}
              className={`relative h-1.5 rounded-[8px] transition-all duration-500 overflow-hidden ${
                i === currentSlide ? 'w-16 bg-white/25' : 'w-6 bg-white/30 hover:bg-white/50'
              }`}
            >
              {i === currentSlide && (
                /* Real playback progress, so the dash fills as the clip plays out. */
                <span
                  className="absolute inset-y-0 left-0 rounded-[8px] bg-pf-red"
                  style={{ width: `${Math.min(100, Math.max(0, slideProgress * 100))}%` }}
                />
              )}
            </button>
          ))}
        </div>
        {/* Slide counter */}
        <div className="absolute bottom-10 right-6 md:right-12 z-20 text-white/90 text-sm font-mono tracking-wider bg-black/70 px-3 py-1.5 rounded-[8px]">
          {String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface">
        <div className="max-w-[1440px] mx-auto scroll-reveal">
          <SectionHeading
            className="mb-14"
            align="center"
            eyebrow="Categories"
            icon="category"
            title={<>Browse by <Accent>Category</Accent></>}
          />

          {categoriesLoading ? (
            <SectionLoader type="categories" count={6} />
          ) : (
            <>
              <div className="relative">
                {/* Left arrow */}
                <button
                  type="button"
                  onClick={() => categoryNudge('left')}
                  aria-label="Previous categories"
                  className={`btn btn-icon absolute -left-5 top-1/2 -translate-y-1/2 z-20 hidden md:flex hover:scale-105 ${canScrollLeft ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'}`}
                >
                  <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>

                {/* Right arrow */}
                <button
                  type="button"
                  onClick={() => categoryNudge('right')}
                  aria-label="Next categories"
                  className={`btn btn-icon absolute -right-5 top-1/2 -translate-y-1/2 z-20 hidden md:flex hover:scale-105 ${canScrollRight ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'}`}
                >
                  <span className="material-symbols-outlined text-2xl">chevron_right</span>
                </button>

                <div
                  className="relative overflow-hidden"
                  /* Fade the rail into the page edges instead of hard-cutting it. */
                  style={{
                    maskImage:
                      'linear-gradient(to right, transparent, #000 56px, #000 calc(100% - 56px), transparent)',
                    WebkitMaskImage:
                      'linear-gradient(to right, transparent, #000 56px, #000 calc(100% - 56px), transparent)',
                  }}
                  onMouseEnter={() => setCategoryPaused(true)}
                  onMouseLeave={() => setCategoryPaused(false)}
                  onFocusCapture={() => setCategoryPaused(true)}
                  onBlurCapture={() => setCategoryPaused(false)}
                >
                  <div
                    ref={categoryTrackRef}
                    className="flex gap-5 w-max"
                    style={{ willChange: 'transform' }}
                  >
                    {/* The list is rendered twice; the track wraps by one set's width,
                  so the seam between the copies is never visible. */}
                    {[0, 1].map((copy) => (
                      <div
                        ref={copy === 0 ? categorySetRef : undefined}
                        key={copy}
                        className="flex gap-5"
                      >
                        {categories.map((cat) => (
                          <Link
                            data-cat-card
                            key={`${copy}-${cat.id}`}
                            to={`/collection/${encodeURIComponent(cat.name)}`}
                            className="relative flex-shrink-0 w-[200px] h-[230px] p-7 rounded-2xl flex flex-col items-center justify-center gap-4 group transition-all duration-400 hover:-translate-y-1.5 stagger-item overflow-hidden snap-start hover:shadow-[0_20px_50px_rgba(217,30,54,0.18)] hover:border-pf-red/40 border border-transparent"
                            style={{
                              background: `linear-gradient(145deg, #ffffff, #FBF8F6)`,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
                            }}
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-pf-red/5 rounded-bl-[100%] transition-all duration-500 group-hover:bg-pf-red/15 group-hover:w-28 group-hover:h-28" />
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pf-red/20 to-pf-red/5 flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(217,30,54,0.15)] transition-all duration-300 overflow-hidden relative z-10">
                              {getCategoryImage(cat) ? (
                                <img
                                  src={getCategoryImage(cat)}
                                  alt={cat.name}
                                  className="w-full h-full object-cover rounded-2xl"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-3xl text-pf-red-dark">
                                  {getCategoryIcon(cat.name)}
                                </span>
                              )}
                            </div>
                            <div className="relative z-10 text-center bg-white/90 rounded-xl p-2">
                              <h3 className="font-bold text-base text-on-surface group-hover:text-pf-red-dark transition-colors">
                                {cat.name}
                              </h3>
                              <p className="text-xs text-on-surface-variant font-medium mt-1">
                                {cat.products} items
                              </p>
                            </div>
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-pf-red/0 rounded-[8px] transition-all duration-400 group-hover:bg-pf-red/30" />
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile arrows */}
              <div className="flex md:hidden items-center justify-center gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => categoryNudge('left')}
                  aria-label="Previous categories"
                  disabled={!canScrollLeft}
                  className={`btn btn-icon !w-11 !h-11 ${canScrollLeft ? 'opacity-100' : 'opacity-40'}`}
                >
                  <span className="material-symbols-outlined text-xl">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => categoryNudge('right')}
                  aria-label="Next categories"
                  disabled={!canScrollRight}
                  className={`btn btn-icon !w-11 !h-11 ${canScrollRight ? 'opacity-100' : 'opacity-40'}`}
                >
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── HOT DEAL (mobile / tablet) ─── */}
      <section className="lg:hidden py-20 px-6 md:px-12 bg-surface-container-low/20">
        <Tilt3D amount={0.85}>
          <div className="max-w-[1440px] mx-auto scroll-reveal">
            <div className="glass-card overflow-hidden rounded-4xl border border-pf-red/15 flex flex-col lg:flex-row items-stretch relative shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
              <div className="absolute top-6 right-6 z-10">
                <span className="inline-flex items-center gap-1.5 bg-pf-red-dark text-white px-4 py-1.5 rounded-[8px] text-xs font-bold uppercase tracking-wider animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-[8px] bg-white" />
                  Limited Offer
                </span>
              </div>
              <div className="flex-1 p-8 md:p-14 flex flex-col gap-6 justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-pf-red tracking-[0.15em] uppercase">
                  <span className="material-symbols-outlined text-base">local_fire_department</span>
                  Flash Sale
                </div>
                <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface leading-tight">
                  Tech Essentials
                  <br />
                  <span className="text-pf-red">Up to 25% Off</span>
                </h2>
                <p className="text-base md:text-lg text-on-surface-variant leading-relaxed">
                  Grab the latest flagships and premium accessories at unbeatable prices. Certified
                  performance, uncompromised quality.
                </p>
                <Link to="/collection/all" className="btn btn-primary btn-md w-fit">
                  Claim Offer Now
                  <span className="material-symbols-outlined text-lg">bolt</span>
                </Link>
              </div>
              {/* Advertised products — the static Flash Sale image is gone.
                  Two columns on every breakpoint so this stays usable on
                  mobile, where the panel sits below the offer copy. */}
              <div className="flex-1 min-w-0 p-5 md:p-8 lg:py-10 bg-gradient-to-br from-pf-red-dark/5 to-pf-red/5 flex flex-col">
                <div
                  role="tablist"
                  aria-label="Advertised products"
                  className="flex gap-1.5 p-1.5 rounded-[8px] bg-white/70 border border-pf-red/10 mb-4"
                >
                  {DEAL_TABS.map((tab) => {
                    const selected = tab.key === dealTab
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => setDealTab(tab.key)}
                        className={`btn btn-quiet btn-sm flex-1 !px-2 !py-2 text-on-surface-variant hover:text-pf-red-dark ${
                          selected ? 'is-active' : ''
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">{tab.icon}</span>
                        {tab.label}
                      </button>
                    )
                  })}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {dealProducts.map((product: any) => (
                    <Link
                      key={`${dealTab}-${product.id}`}
                      to={`/product/${product.id}`}
                      className="group bg-white/90 rounded-2xl border border-pf-red/10 p-2.5 hover:border-pf-red/40 hover:shadow-[0_14px_34px_rgba(217,30,54,0.14)] transition-all duration-300"
                    >
                      <div className="h-20 md:h-24 rounded-lg bg-white flex items-center justify-center overflow-hidden mb-2">
                        {getProductImage(product) ? (
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = FALLBACK_IMG
                            }}
                          />
                        ) : (
                          <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                            inventory_2
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-on-surface leading-tight line-clamp-2 mb-1 group-hover:text-pf-red-dark transition-colors">
                        {product.name}
                      </p>
                      <p className="text-xs font-extrabold text-pf-red">
                        {getProductPrice(product)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Tilt3D>
      </section>

      {/* ─── HOT DEAL (desktop stage) ─── */}
      <FlashSaleStage
        cards={dealCards}
        tabs={DEAL_TABS}
        activeTab={dealTab}
        onTabChange={(key) => setDealTab(key as DealTabKey)}
      />

      {/* ─── TRENDING DEVICES ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface">
        <Tilt3D amount={0.6}>
          <div className="max-w-[1440px] mx-auto scroll-reveal">
            <SectionHeading
              className="mb-12"
              eyebrow="Trending"
              icon="trending_up"
              title={<>Trending <Accent>Devices</Accent></>}
              subtitle="The most sought-after tech in our collection."
            >
              <Link to="/collection/all?tab=trending" className="btn btn-quiet btn-sm shrink-0">
                Explore All <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </SectionHeading>
            {trendingLoading ? (
              <SectionLoader type="products" count={8} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {trendingCards.map((card, i) => (
                  <ProductCard key={card.id} {...card} order={i} />
                ))}
              </div>
            )}
          </div>
        </Tilt3D>
      </section>

      {/* ─── REPAIR SERVICES ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low/20 scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <SectionHeading
            className="mb-14"
            align="center"
            eyebrow="Services"
            icon="handyman"
            title={<>Precision <Accent>Repair</Accent> Services</>}
            subtitle="From micro-soldering to full device restoration — we handle it all with clinical precision."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: 'bolt',
                title: 'Express Repair',
                desc: 'Wait in our comfortable lounge while we fix your screen or battery in under 60 minutes.',
                gradient: 'from-pf-red/10 to-transparent',
              },
              {
                icon: 'local_shipping',
                title: 'Mail-In Service',
                desc: 'Send your device from anywhere with our secure, prepaid shipping kits and track online.',
                gradient: 'from-gold/10 to-transparent',
              },
              {
                icon: 'home_repair_service',
                title: 'On-Site Tech',
                desc: "We'll come to your home or office for specific repairs, ensuring zero downtime for you.",
                gradient: 'from-pf-red/10 to-transparent',
              },
            ].map((service) => (
              <div
                key={service.title}
                className={`glass-card p-8 md:p-10 rounded-4xl flex flex-col gap-5 group transition-all duration-500 hover:shadow-[0_20px_60px_rgba(217,30,54,0.10)] hover:-translate-y-1 stagger-item bg-gradient-to-b ${service.gradient}`}
              >
                <div className="w-16 h-16 rounded-2xl bg-pf-red/20 text-pf-red-dark flex items-center justify-center group-hover:scale-110 group-hover:bg-pf-red/30 transition-all duration-300">
                  <span className="material-symbols-outlined text-3xl">{service.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface">{service.title}</h3>
                <p className="text-base text-on-surface-variant leading-relaxed">{service.desc}</p>
                <Link to="/repairs" className="btn btn-quiet btn-sm group-hover:gap-3 mt-auto">
                  Learn More{' '}
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
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
            <SectionHeading
              className="mb-12"
              eyebrow="New"
              icon="new_releases"
              title={<>New <Accent>Arrivals</Accent></>}
              subtitle="Discover the latest cutting-edge technology."
            />
            <SectionLoader type="products" count={4} />
          </div>
        </section>
      ) : (
        arrivals.length > 0 && (
          <section className="py-20 px-6 md:px-12 bg-surface scroll-reveal">
            <div className="max-w-[1440px] mx-auto">
              <SectionHeading
                className="mb-12"
                eyebrow="New"
                icon="new_releases"
                title={<>New <Accent>Arrivals</Accent></>}
                subtitle="Discover the latest cutting-edge technology."
              >
                <Link to="/collection/all?tab=new" className="btn btn-quiet btn-sm shrink-0">
                  View All <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
              </SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {arrivalCards.map((card, i) => (
                  <ProductCard
                    key={card.id}
                    {...card}
                    order={i}
                    wishlisted={wishlist.has(card.id)}
                    onToggleWishlist={toggleWishlist}
                  />
                ))}
              </div>
            </div>
          </section>
        )
      )}

      {/* ─── CERTIFIED REFURBISHED ─── */}
      <RefurbishedShowcase devices={refurbishedDevices} loading={refurbishedLoading} />

      {/* ─── VIDEO SHOWCASE ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <SectionHeading
            className="mb-14"
            align="center"
            eyebrow="In Action"
            icon="play_circle"
            title={<>See the <Accent>Precision</Accent> in Action</>}
            subtitle="Watch how we bring your devices back to life with clinical-grade repair techniques."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VIDEO_FEATURES.map((feature) => (
              <YouTubeLite
                key={feature.videoId}
                videoId={feature.videoId}
                title={feature.title}
                subtitle={feature.subtitle}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── PARTNERS MARQUEE ─── */}
      <section className="py-16 overflow-hidden bg-surface-container-highest">
        <div className="flex animate-marquee whitespace-nowrap items-center">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-20 mx-12">
              {partners.map((p) => (
                <span
                  key={p + dup}
                  className="text-5xl md:text-6xl font-extrabold text-on-surface/60 tracking-tighter select-none"
                >
                  {p}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 px-6 md:px-12 overflow-hidden bg-surface">
        <Tilt3D amount={0.75}>
          <div className="max-w-[1440px] mx-auto scroll-reveal">
            <SectionHeading
              className="mb-14"
              align="center"
              eyebrow="Testimonials"
              icon="format_quote"
              title={<>Trusted by <Accent>Thousands</Accent></>}
              subtitle="Real experiences from our community of tech enthusiasts."
            />
            <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x" tabIndex={0} role="region" aria-label="Testimonials">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="min-w-[320px] md:min-w-[400px] snap-center glass-card p-8 md:p-10 rounded-4xl flex flex-col gap-5 shrink-0 hover:shadow-[0_20px_60px_rgba(217,30,54,0.08)] transition-shadow duration-500"
                  style={{
                    animation: `float-slow 8s ease-in-out infinite`,
                    animationDelay: `${i * 1.2}s`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[8px] bg-pf-red/10 shrink-0 ring-2 ring-pf-red/20 flex items-center justify-center">
                      <span className="text-pf-red-dark font-bold text-lg">
                        {t.name
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-on-surface">{t.name}</h3>
                      <div className="flex text-gold mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className="material-symbols-outlined text-sm">
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-base text-on-surface-variant italic leading-relaxed">
                    {t.quote}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-pf-red-dark uppercase tracking-wide mt-auto pt-2 border-t border-pf-red/10">
                    <span className="material-symbols-outlined text-sm text-pf-red">verified</span>
                    {t.badge}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Tilt3D>
      </section>

      <StoreLocation />

      <EcommerceFooter />
    </div>
  )
}

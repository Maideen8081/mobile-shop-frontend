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
import ProductCard, {
  cardSpan,
  swatchesFor,
  type ProductCardData,
  type ProductSpec,
} from '../components/ecommerce/ProductCard'
import YouTubeLite from '../components/ui/YouTubeLite'
import SectionHeading, { Accent } from '../components/ui/SectionHeading'
import internalComponentsVideo from '../assets/Smartphone_internal_components_1080p_20261002155902.mp4'
import internalComponentsPoster from '../assets/hero-internal-components-poster.jpg'
import repairStoryImage from '../assets/hero-exploding-view-poster.jpg'
import './HomeTheme.css'
import './HomeEditorial.css'

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
    video: internalComponentsVideo,
    poster: internalComponentsPoster,
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

/* Repair "story" steps (reference: numbered orchard story). */
const REPAIR_STEPS = [
  {
    title: 'Express Repair',
    desc: 'Wait in our comfortable lounge while we fix your screen or battery in under 60 minutes.',
  },
  {
    title: 'Mail-In Service',
    desc: 'Send your device from anywhere with our secure, prepaid shipping kits and track online.',
  },
  {
    title: 'On-Site Tech',
    desc: "We'll come to your home or office for specific repairs, ensuring zero downtime for you.",
  },
]

/* Store promises shown under the trending grid. */
const STORE_PROMISES = [
  {
    icon: 'verified',
    title: '100% Genuine Products',
    desc: 'Sealed flagships and certified parts — every device is checked before it ships.',
  },
  {
    icon: 'local_shipping',
    title: 'Free Delivery Over ₹500',
    desc: 'Insured, tracked delivery to your door, with easy 7-day returns.',
  },
  {
    icon: 'shield',
    title: '1-Year Service Support',
    desc: 'Warranty on every repair and purchase, backed by our in-house technicians.',
  },
]

/* Highlights grid (reference: nutrient density figures). */
const HIGHLIGHTS = [
  { label: 'Diagnostics', value: '21', unit: 'point check', note: 'Before and after every repair job' },
  { label: 'Express Repair', value: '60', unit: 'minutes', note: 'Most screens & batteries, while you wait' },
  { label: 'Warranty', value: '12', unit: 'months', note: 'On every repair and certified device' },
  { label: 'Easy Returns', value: '7', unit: 'days', note: 'No-questions-asked return window' },
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

  /* Selling price + MRP. List endpoints often omit variants, so fall back to
     the product-level min/max prices the API sends. */
  const priceOf = (product: any): { price: number; mrp: number } => {
    const variant = product?.variants?.[0]
    const price =
      Number(variant?.discountPrice) ||
      Number(variant?.price) ||
      Number(product?.minPrice) ||
      Number(product?.rawDiscountPrice) ||
      Number(product?.discountPrice) ||
      Number(product?.price) ||
      0
    const mrp = Number(variant?.price) || Number(product?.price) || price
    return { price, mrp: Math.max(mrp, price) }
  }

  const getProductPrice = (product: any): string => {
    const { price } = priceOf(product)
    return price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'View price'
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
    const { price, mrp } = priceOf(product)
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
    const { price, mrp } = priceOf(product)
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

  /* Card data for the Trending / New Arrivals grids. Everything shown on a
     card comes from the product itself: brand, colour swatches from the
     variants, highlights from the variant specs (falling back to features). */
  const toCardData = (product: any, kind: 'trending' | 'new'): ProductCardData => {
    const variants: any[] = Array.isArray(product?.variants) ? product.variants : []
    const variant = variants[0] ?? product
    const { price, mrp } = priceOf(product)
    const rating = Number(product?.rating || 0)
    const features: string[] = Array.isArray(product?.features)
      ? product.features.map((f: any) => (typeof f === 'string' ? f : f?.feature ?? f?.name ?? '')).filter(Boolean)
      : []

    const specs: ProductSpec[] = []
    if (variant?.processor) specs.push({ icon: 'cpu', label: String(variant.processor) })
    if (Number(variant?.battery) > 0) specs.push({ icon: 'battery', label: `${variant.battery} mAh` })
    if (variant?.camera) specs.push({ icon: 'camera', label: String(variant.camera) })
    if (variant?.display) specs.push({ icon: 'display', label: String(variant.display) })
    if (variant?.storage)
      specs.push({ icon: 'storage', label: [variant.ram, variant.storage].filter(Boolean).join(' / ') })
    for (const f of features) {
      if (specs.length >= 3) break
      specs.push({ icon: 'spark', label: f.length > 28 ? `${f.slice(0, 26)}…` : f })
    }

    return {
      id: Number(product.id),
      name: String(product.name ?? ''),
      brand: String(product.brand ?? ''),
      image: getProductImage(product),
      price,
      mrp,
      rating,
      sold: Number(product?.sold || 0) || undefined,
      tag: variant?.storage ? String(variant.storage) : undefined,
      swatches: swatchesFor(variants.map((v) => String(v?.color ?? '')).filter(Boolean)),
      specs: specs.slice(0, 3),
      badge: product?.bestSelling ? 'bestseller' : kind === 'trending' ? 'trending' : 'new',
      cart: {
        variationId: Number(variant?.dbId ?? variant?.id) || 0,
        storage: variant?.storage ?? '',
        ram: variant?.ram ?? '',
        color: variant?.color ?? '',
      },
    }
  }

  const trendingCards: ProductCardData[] = trending.slice(0, 8).map((p) => toCardData(p, 'trending'))
  const arrivalCards: ProductCardData[] = arrivals.slice(0, 4).map((p) => toCardData(p, 'new'))

  return (
    <div className="home-theme min-h-screen bg-surface text-on-surface font-body-md">
      <SiteTopNav transparent />
      {/* ─── HERO CAROUSEL (Video Background) ─── */}
      <section
        className="hero-section hero-section--full home-hero relative overflow-hidden bg-black"
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
                  loop={heroSlides.length === 1}
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
              {/* Neutral (not green) shade on the left only, so the copy stays readable. */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
              {/* Top scrim so the see-through nav stays readable over the video. */}
              <div className="home-hero__scrim absolute inset-x-0 top-0" aria-hidden="true" />
              <div className="home-hero__content relative h-full max-w-[1440px] mx-auto px-6 md:px-16 flex flex-col justify-center items-start pb-20">
                {/* Keyed on slide + variant so the CSS animation replays each swap. */}
                <div
                  key={`${currentSlide}-${heroCopyIndex}`}
                  className="w-full max-w-[540px] hero-copy-swap"
                >
                  <div
                    className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-[8px] bg-[#dfe8b4]/15 border border-[#dfe8b4]/40 text-[#dfe8b4] text-xs font-bold tracking-[0.15em] uppercase mb-5 backdrop-blur-md transition-all duration-700 delay-200 ${
                      i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                  >
                    <span className="relative w-2 h-2">
                      <span className="absolute inset-0 rounded-[8px] bg-[#dfe8b4] animate-ping" />
                      <span className="absolute inset-0 rounded-[8px] bg-[#dfe8b4]" />
                    </span>
                    {copy.tag}
                  </div>
                  <SlideHeading
                    isActive={i === currentSlide}
                    className={`text-[clamp(28px,3.3vw,48px)] font-extrabold leading-[1.08] tracking-[-0.02em] text-white mb-4 transition-all duration-700 delay-300 ${
                      i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                  >
                    {copy.title[0]}
                    <br />
                    <span className="relative inline-block bg-gradient-to-r from-[#dfe8b4] via-[#dfe8b4] to-[#dfe8b4] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient italic drop-shadow-[0_0_40px_rgba(223,232,180,0.35)]">
                      {copy.title[1]}
                      <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#dfe8b4] to-transparent rounded-[8px] opacity-80 animate-pulse" />
                    </span>{' '}
                    <span className="text-[#f7f6f2]/85">{copy.title[2]}</span>
                  </SlideHeading>
                  <p
                    className={`text-[15px] md:text-lg text-[#f7f6f2]/80 leading-relaxed max-w-[500px] mb-7 transition-all duration-700 delay-400 ${
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
                      className="btn btn-primary btn-md home-hero__cta group animate-float hover:scale-105 active:scale-95"
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
        {heroSlides.length > 1 && (
        <>
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
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
                  className="absolute inset-y-0 left-0 rounded-[8px] bg-[#dfe8b4]"
                  style={{ width: `${Math.min(100, Math.max(0, slideProgress * 100))}%` }}
                />
              )}
            </button>
          ))}
        </div>
        {/* Slide counter */}
        <div className="absolute bottom-6 right-6 md:right-12 z-20 text-[#f7f6f2]/90 text-sm font-mono tracking-wider bg-[#0f3b2c]/80 border border-[#dfe8b4]/30 px-3 py-1.5 rounded-[8px]">
          {String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
        </div>
        </>
        )}
      </section>

      {/* ═══ Editorial sections (reference-site structure, PhoneFix palette) ═══ */}
      <div className="home-ed">
      {/* ─── CATEGORIES ─── */}
      <section className="ed-section ed-cats py-20 px-6 md:px-12">
        <div className="relative max-w-[1440px] mx-auto scroll-reveal">
          <SectionHeading
            className="sec-head--classic mb-14"
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
                            className="cat-card group"
                          >
                            <span className="cat-card__blob" aria-hidden="true" />
                            <div className="cat-card__media">
                              {getCategoryImage(cat) ? (
                                <img src={getCategoryImage(cat)} alt={cat.name} />
                              ) : (
                                <span className="material-symbols-outlined">{getCategoryIcon(cat.name)}</span>
                              )}
                            </div>
                            <div className="cat-card__label">
                              <h3>{cat.name}</h3>
                              <p>{cat.products} items</p>
                            </div>
                            <span className="cat-card__line" aria-hidden="true" />
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
                <h2 className="ed-serif text-[clamp(30px,4vw,48px)] text-on-surface leading-[1.1]">
                  Tech Essentials
                  <br />
                  <em className="ed-italic">Up to 25% Off</em>
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
                      className="group bg-white/90 rounded-2xl border border-pf-red/10 p-2.5 hover:border-pf-red/40 hover:shadow-[0_14px_34px_rgba(15,59,44,0.14)] transition-all duration-300"
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
      <section className="ed-section ed-section--deep py-20 md:py-28 px-6 md:px-12">
        <span className="ed-glow ed-glow--b" aria-hidden="true" />
        <Tilt3D amount={0.6}>
          <div className="max-w-[1440px] mx-auto scroll-reveal">
            <SectionHeading
              className="mb-12 md:mb-16"
              eyebrow="Trending Now"
              title={<>The most wanted <Accent>devices</Accent></>}
              subtitle="Flagships and accessories our customers are buying this week — genuine, sealed and ready to ship."
            >
              <div className="flex flex-col items-start sm:items-end gap-4">
                <div className="ed-meta">
                  <b>{String(trendingCards.length).padStart(2, '0')}</b>
                  <span>/</span>
                  <em>Free express delivery</em>
                </div>
                <Link to="/collection/all?tab=trending" className="ed-link">
                  Explore all <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>
            </SectionHeading>
            {trendingLoading ? (
              <SectionLoader type="products" count={8} />
            ) : (
              <div className="pc-bento">
                {trendingCards.map((card, i) => (
                  <ProductCard
                    key={card.id}
                    {...card}
                    variant="standard"
                    span={cardSpan(trendingCards.length)}
                    order={i}
                    wishlisted={wishlist.has(card.id)}
                    onToggleWishlist={toggleWishlist}
                  />
                ))}
              </div>
            )}
            <div className="ed-promises">
              {STORE_PROMISES.map((p) => (
                <div key={p.title}>
                  <span className="material-symbols-outlined" aria-hidden="true">{p.icon}</span>
                  <div>
                    <h3>{p.title}</h3>
                    <p>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Tilt3D>
      </section>

      {/* ─── REPAIR SERVICES (story layout) ─── */}
      <section className="ed-section py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto scroll-reveal">
          <SectionHeading
            className="mb-12 md:mb-20 max-w-3xl"
            eyebrow="The PhoneFix Repair Story"
            title={<>Precision repairs, <Accent>done right.</Accent></>}
            subtitle="From micro-soldering to full device restoration, every job runs through the same bench process: diagnose, repair with genuine parts, verify, and hand it back with a warranty."
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <figure className="lg:col-span-7 group m-0">
              <div className="ed-frame aspect-[4/3] md:aspect-[16/11]">
                <img src={repairStoryImage} alt="Exploded view of a smartphone and its internal parts" loading="lazy" />
              </div>
              <figcaption className="ed-caption">
                <span>Board-level repair</span>
                <span>21-point diagnostics</span>
              </figcaption>
            </figure>
            <div className="lg:col-span-5 flex flex-col gap-10">
              <ol className="ed-steps">
                {REPAIR_STEPS.map((step, i) => (
                  <li key={step.title}>
                    <div>
                      <span className="ed-num">{String(i + 1).padStart(2, '0')}</span>
                      <h3>{step.title}</h3>
                    </div>
                    <p>{step.desc}</p>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-3">
                <Link to="/book-repair" className="ed-btn">
                  Book a Repair
                  <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                </Link>
                <Link to="/repairs" className="ed-btn ed-btn--ghost">
                  All Services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NEW ARRIVALS ─── */}
      {newArrivalsLoading ? (
        <section className="ed-section ed-section--deep py-20 md:py-28 px-6 md:px-12 scroll-reveal">
          <div className="max-w-[1440px] mx-auto">
            <SectionHeading
              className="mb-12 md:mb-16"
              eyebrow="Just Landed"
              title={<>New <Accent>arrivals</Accent></>}
              subtitle="The latest launches, in stock now with official warranty."
            />
            <SectionLoader type="products" count={4} />
          </div>
        </section>
      ) : (
        arrivals.length > 0 && (
          <section className="ed-section ed-section--deep py-20 md:py-28 px-6 md:px-12 scroll-reveal">
            <div className="max-w-[1440px] mx-auto">
              <SectionHeading
                className="mb-12 md:mb-16"
                eyebrow="Just Landed"
                title={<>New <Accent>arrivals</Accent></>}
                subtitle="The latest launches, in stock now with official warranty."
              >
                <Link to="/collection/all?tab=new" className="ed-link">
                  View all <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </SectionHeading>
              <div className="pc-bento">
                {arrivalCards.map((card, i) => (
                  <ProductCard
                    key={card.id}
                    {...card}
                    variant="standard"
                    span={cardSpan(arrivalCards.length)}
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

      {/* ─── VIDEO SHOWCASE + HIGHLIGHTS (reference: guide section) ─── */}
      <section className="ed-section ed-section--deep py-20 md:py-28 px-6 md:px-12 scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <SectionHeading
            className="mb-12 md:mb-16"
            eyebrow="Inside the Workshop"
            title={<>See the precision <Accent>in action</Accent></>}
            subtitle="Watch how we bring devices back to life with clinical-grade repair techniques."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {VIDEO_FEATURES.map((feature, i) => (
              <div key={feature.videoId} className="ed-video">
                <span className="ed-mono ed-video__label">
                  {String(i + 1).padStart(2, '0')} / {feature.title}
                </span>
                <YouTubeLite videoId={feature.videoId} title={feature.title} subtitle={feature.subtitle} />
              </div>
            ))}
          </div>
          <div className="ed-stats">
            {HIGHLIGHTS.map((h) => (
              <div key={h.label}>
                <span className="ed-mono">{h.label}</span>
                <p>
                  <b>{h.value}</b> <small>{h.unit}</small>
                </p>
                <em>{h.note}</em>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PARTNERS MARQUEE ─── */}
      <section className="ed-section ed-marquee py-12 md:py-14 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap items-center">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-20 mx-12">
              {partners.map((p) => (
                <span
                  key={p + dup}
                  className="ed-serif italic text-4xl md:text-5xl select-none"
                >
                  {p}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS (reference: flavour-note cards) ─── */}
      <section className="ed-section py-20 md:py-28 px-6 md:px-12">
        <span className="ed-glow ed-glow--a" aria-hidden="true" />
        <div className="relative max-w-[1440px] mx-auto scroll-reveal">
          <SectionHeading
            className="mb-12 md:mb-16"
            eyebrow="Customer Stories"
            title={<>Trusted by <Accent>thousands</Accent></>}
            subtitle="Real experiences from our community of phone owners and tech enthusiasts."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
            {testimonials.map((t, i) => (
              <article key={t.name} className="ed-quote">
                <span className="ed-mono ed-quote__label">
                  {String(i + 1).padStart(2, '0')} / {t.badge}
                </span>
                <div className="ed-quote__stars" aria-label="5 out of 5 stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className="material-symbols-outlined" aria-hidden="true">
                      star
                    </span>
                  ))}
                </div>
                <p>{t.quote}</p>
                <footer>
                  <span className="ed-quote__avatar">
                    {t.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  {t.name}
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      <StoreLocation />

      <EcommerceFooter />
      </div>
    </div>
  )
}

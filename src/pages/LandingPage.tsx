import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { categoryService } from '../services/categoryService'
import { productService } from '../services/productService'
import type { Category } from '../services/categoryService'
import { productsData } from '../data/productData'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import EcommerceFooter from '../components/ecommerce/Footer'
import { useToast } from '../context/ToastContext'
import SectionLoader from '../components/ecommerce/SectionLoader'
import explodingViewVideo from '../assets/Orange_smartphone_exploding_view_1080p_20261002155324.mp4'
import internalComponentsVideo from '../assets/Smartphone_internal_components_1080p_20261002155902.mp4'

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

const SLIDE_IMAGES = [
  'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=1920&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1920&q=80',
  'https://images.unsplash.com/photo-1592890288564-76628a30a657?w=1920&q=80',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1920&q=80',
  'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1920&q=80',
  'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1920&q=80',
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

const heroSlides: { video: string; copies: HeroCopy[] }[] = [
  {
    video: explodingViewVideo,
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
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpD0gDp2KPBgbOB-g8gRUfCCJzJx0vgpeIdM30Fq3N7ryEonoqHasCj_qJnJNJB-evwweGxXoCIEOZ1GaqlMhErqg6yrJ4m_QyV_Jy4EEePsDpnoxURmjJItCQgJNrfY_3ihxXHZnHPHkp4lqUlLAK-igjIZwezecenuHRlQZEtABxGcNKR6JFAYGEbSlrg0_0qfuZ0prJGJR2ZeBU9gZOPb-mZLsWA5xoY32M8nXtcHSzgEDK2t0Etfck765JZWEFNKutd-9OUA',
  },
  {
    name: 'Priya Kapur',
    quote:
      '"Bought a refurbished Pixel and it looks brand new. The warranty gives me total peace of mind."',
    badge: 'Verified Purchase',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEGD_xap-ygQ-fNS6sODxUxwv1e1_dABvkJltx4B7-_MVtN3QJcAL9Xl486D7zo3p2cqQ48WYOhk-alO1y55o2t6UjzF45Fx4jfycfzH6qbK8BhYKiXlna3RdRn8yO1Nl1wcTER0XaQpSMqHYKyDawFHEkvGYi31HP5tb21TDgvNv89Ty82r7XjWCYpDzykWnnngwHUDpGQiq1JRoM43zZjHj4WTsVy8-ASs8UsmR2wrl2df6ZwlnQnpnkuPSlFkR05JMH6L2o9Q',
  },
  {
    name: 'Rahul Mehta',
    quote:
      '"Excellent diagnostics. Honest people are hard to find. They saved me from an unnecessary repair."',
    badge: 'Verified Repair',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvTcGQl6D6p1vLwiAd3uLi43IC34SUX1FqCx-Tf28eHkQihCdEN650pCDiUBL7Ik6i979XXg640FdDbCp3WwIiHrxn-FJ0zg-lGhWU3eXl80fv_uR3heNazeisZ2Mf3HtrxnvkTkL_BZMumGI7NCqbOEoBoBCF-fEzLlOCz7plezWn0wcDM13OLDeT85tCA9ZLvnLrPwRU52ZgtuLjip1qyJ_tNtCab7-Y9gAn28uNAvEigAL4y6QB70Sq_7olGesO8G62XZxulA',
  },
  {
    name: 'Ananya Reddy',
    quote:
      '"Got my Galaxy S24 Ultra at an amazing price. Their refurbished quality is top-notch with original accessories."',
    badge: 'Verified Purchase',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNjhLhh7xHg7-2FT8j-4Ss91-U4uAENmL521w8epzBjdRPSLvoCS7DhCR8LkTf6cv19u4UlBAhuaeQmq9f4oWqAszcFGkbTSvHprHjer9ih87UOTcxxNxONs0aB3HDmKQNMeCYj5hMlL3aG07bXtweLbjvv27eMeKr8jumXfq_sB4ONBaZb2o_6q3xJ59p3tfO4Q73m4lioD5pnZBcf_heMsYq5z6zOc9JdjV9eIGZW9pCTcuUm-mdcDYekjh-xa0ZdM13AJ1GYA',
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
  const navigate = useNavigate()
  const { show: showToast } = useToast()
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
  const heroRef = useRef<HTMLElement>(null)
  const heroMediaRef = useRef<HTMLDivElement>(null)
  const heroCopyRef = useRef<HTMLDivElement>(null)

  /* Hero depth push.
     Three layers move at different rates so the section reads as real depth
     rather than one flat tilted rectangle:
       • the section hinges away on X from its top edge (small angle, no fade)
       • the video layer lags behind and drifts down  → separates in Z
       • the copy travels up and further back         → strongest parallax
     Desktop-only, rAF-driven, so scrolling never triggers a render. */
  useEffect(() => {
    const hero = heroRef.current
    const media = heroMediaRef.current
    const copy = heroCopyRef.current
    if (!hero) return
    const query = window.matchMedia(TILT_QUERY)
    if (!query.matches) return

    let frame = 0
    const apply = () => {
      frame = 0
      const span = Math.max(hero.offsetHeight, 1)
      const distance = Math.min(Math.max(window.scrollY / span, 0), 1)
      if (distance === 0) return

      hero.style.transformOrigin = '50% 0%'
      hero.style.transform =
        `perspective(1600px) rotateX(${(distance * 6).toFixed(2)}deg) ` +
        `translate3d(0, ${(distance * 22).toFixed(1)}px, 0) ` +
        `scale(${(1 - distance * 0.05).toFixed(4)})`

      if (media) {
        media.style.transform =
          `translate3d(0, ${(distance * 38).toFixed(1)}px, 0) ` +
          `scale(${(1 + distance * 0.05).toFixed(4)})`
      }
      if (copy) {
        copy.style.transform = `translate3d(0, ${(-distance * 26).toFixed(1)}px, ${(-distance * 70).toFixed(1)}px)`
      }
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    apply()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  const [countdown, setCountdown] = useState({ hours: '02', mins: '40', secs: '28' })
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

  const toggleWishlist = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
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
    const interval = setInterval(() => {
      setCountdown((prev) => {
        let s = parseInt(prev.secs) - 1
        let m = parseInt(prev.mins)
        let h = parseInt(prev.hours)
        if (s < 0) {
          s = 59
          m--
        }
        if (m < 0) {
          m = 59
          h--
        }
        if (h < 0) {
          h = 23
        }
        return {
          hours: h.toString().padStart(2, '0'),
          mins: m.toString().padStart(2, '0'),
          secs: s.toString().padStart(2, '0'),
        }
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
        const na =
          arrivals.length > 0 ? arrivals : productsData.filter((p) => p.newArrival).slice(0, 4)
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

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md selection:bg-pf-red/30 selection:text-pf-red-dark">
      <SiteTopNav />
      {/* ─── HERO CAROUSEL (Video Background) ─── */}
      <section
        ref={heroRef}
        className="hero-section relative h-[84vh] min-h-[680px] max-h-[860px] overflow-hidden bg-black"
      >
        {heroSlides.map((slide, i) => {
          const copy = slide.copies[heroCopyIndex] ?? slide.copies[0]
          return (
            <div
              key={i}
              aria-hidden={i !== currentSlide}
              className={`absolute inset-0 transition-all duration-[1.2s] ease-in-out ${
                i === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <div className="absolute -inset-y-16 inset-x-0" ref={heroMediaRef}>
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el
                  }}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  autoPlay
                  muted
                  playsInline
                  preload={i === 0 ? 'auto' : 'metadata'}
                  aria-hidden={i !== currentSlide}
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
              <div
                ref={heroCopyRef}
                className="relative h-full max-w-[1440px] mx-auto px-6 md:px-16 flex flex-col justify-center items-start pt-[116px]"
              >
                {/* Keyed on slide + variant so the CSS animation replays each swap. */}
                <div
                  key={`${currentSlide}-${heroCopyIndex}`}
                  className="w-full max-w-[620px] hero-copy-swap"
                >
                  <div
                    className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-pf-red/10 border border-pf-red/25 text-pf-red text-sm font-bold tracking-[0.15em] uppercase mb-8 backdrop-blur-md transition-all duration-700 delay-200 ${
                      i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                  >
                    <span className="relative w-2 h-2">
                      <span className="absolute inset-0 rounded-full bg-pf-red animate-ping" />
                      <span className="absolute inset-0 rounded-full bg-pf-red" />
                    </span>
                    {copy.tag}
                  </div>
                  <SlideHeading
                    isActive={i === currentSlide}
                    className={`text-[clamp(34px,5vw,66px)] font-extrabold leading-[1.06] text-white mb-5 transition-all duration-700 delay-300 ${
                      i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                  >
                    {copy.title[0]}
                    <br />
                    <span className="relative inline-block bg-gradient-to-r from-pf-red via-pf-red to-pf-red bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient italic drop-shadow-[0_0_40px_rgba(217,30,54,0.4)]">
                      {copy.title[1]}
                      <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pf-red to-transparent rounded-full opacity-60 animate-pulse" />
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
              className={`relative h-1.5 rounded-full transition-all duration-500 overflow-hidden ${
                i === currentSlide ? 'w-16 bg-white/25' : 'w-6 bg-white/30 hover:bg-white/50'
              }`}
            >
              {i === currentSlide && (
                /* Real playback progress, so the dash fills as the clip plays out. */
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-pf-red"
                  style={{ width: `${Math.min(100, Math.max(0, slideProgress * 100))}%` }}
                />
              )}
            </button>
          ))}
        </div>
        {/* Slide counter */}
        <div className="absolute bottom-10 right-6 md:right-12 z-20 text-white/60 text-sm font-mono tracking-wider">
          {String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface">
        <div className="max-w-[1440px] mx-auto scroll-reveal">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-pf-red tracking-[0.2em] uppercase mb-3">
              Categories
            </span>
            <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface">
              Browse by Category
            </h2>
          </div>

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
                            <div className="relative z-10 text-center">
                              <h3 className="font-bold text-base text-on-surface group-hover:text-pf-red-dark transition-colors">
                                {cat.name}
                              </h3>
                              <p className="text-xs text-on-surface-variant font-medium mt-1">
                                {cat.products} items
                              </p>
                            </div>
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-pf-red/0 rounded-full transition-all duration-400 group-hover:bg-pf-red/30" />
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

      {/* ─── HOT DEAL ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low/20">
        <Tilt3D amount={0.85}>
          <div className="max-w-[1440px] mx-auto scroll-reveal">
            <div className="glass-card overflow-hidden rounded-4xl border border-pf-red/15 flex flex-col lg:flex-row items-stretch relative shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
              <div className="absolute top-6 right-6 z-10">
                <span className="inline-flex items-center gap-1.5 bg-pf-red-dark text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
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
                <div className="flex gap-4">
                  {[
                    { label: 'Hours', val: countdown.hours },
                    { label: 'Minutes', val: countdown.mins },
                    { label: 'Seconds', val: countdown.secs },
                  ].map((unit) => (
                    <div
                      key={unit.label}
                      className="flex flex-col items-center bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl min-w-[90px] border border-pf-red/10 shadow-sm"
                    >
                      <span className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-pf-red-dark tabular-nums">
                        {unit.val}
                      </span>
                      <span className="text-xs font-bold text-on-surface-variant tracking-widest mt-1">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
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
                  className="flex gap-1.5 p-1.5 rounded-full bg-white/70 border border-pf-red/10 mb-4"
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

      {/* ─── TRENDING DEVICES ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface">
        <Tilt3D amount={0.6}>
          <div className="max-w-[1440px] mx-auto scroll-reveal">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <span className="inline-block text-xs font-bold text-pf-red tracking-[0.2em] uppercase mb-3">
                  Trending
                </span>
                <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface">
                  Trending Devices
                </h2>
                <p className="text-base md:text-lg text-on-surface-variant mt-1">
                  The most sought-after tech in our collection.
                </p>
              </div>
              <Link to="/collection/all?tab=trending" className="btn btn-quiet btn-sm shrink-0">
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
                    className="glass-card p-4 rounded-4xl group cursor-pointer transition-all duration-500 hover:shadow-[0_20px_60px_rgba(217,30,54,0.10)] hover:border-pf-red/25 hover:-translate-y-1 stagger-item"
                  >
                    <div className="relative rounded-2xl overflow-hidden bg-white h-[270px] mb-4 flex items-center justify-center p-5">
                      {getProductImage(product) ? (
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = FALLBACK_IMG
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-5xl">inventory_2</span>
                        </div>
                      )}
                      <Link
                        to={`/product/${product.id}`}
                        className="absolute bottom-4 right-4 bg-pf-red text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:shadow-[0_0_30px_rgba(217,30,54,0.4)] hover:scale-110 active:scale-95 transition-all duration-300"
                      >
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </Link>
                    </div>
                    <div className="px-1 pb-1">
                      <h3 className="font-bold text-base md:text-lg text-on-surface mb-1.5 leading-snug">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-pf-red-dark font-extrabold text-lg">
                          {getProductPrice(product)}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span
                                key={s}
                                className={`material-symbols-outlined text-sm ${s <= 4 ? 'text-gold' : 'text-gold/40'}`}
                              >
                                star
                              </span>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-on-surface-variant">
                            {product.rating || '4.9'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tilt3D>
      </section>

      {/* ─── REPAIR SERVICES ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low/20 scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-pf-red tracking-[0.2em] uppercase mb-3">
              Services
            </span>
            <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface mb-4">
              Precision Repair Services
            </h2>
            <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">
              From micro-soldering to full device restoration — we handle it all with clinical
              precision.
            </p>
          </div>
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
                gradient: 'fromgold/10 to-transparent',
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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <span className="inline-block text-xs font-bold text-pf-red tracking-[0.2em] uppercase mb-3">
                  New
                </span>
                <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface">
                  New Arrivals
                </h2>
              </div>
              <p className="text-base md:text-lg text-on-surface-variant mt-1">
                Discover the latest cutting-edge technology.
              </p>
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
                  <span className="inline-block text-xs font-bold text-pf-red tracking-[0.2em] uppercase mb-3">
                    New
                  </span>
                  <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface">
                    New Arrivals
                  </h2>
                  <p className="text-base md:text-lg text-on-surface-variant mt-1">
                    Discover the latest cutting-edge technology.
                  </p>
                </div>
                <Link to="/collection/all?tab=new" className="btn btn-quiet btn-sm shrink-0">
                  View All <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {arrivals.slice(0, 4).map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="glass-card p-4 rounded-2xl group relative cursor-pointer hover:border-pf-red/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 stagger-item"
                  >
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-pf-red text-white text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-widest shadow-lg">
                        New
                      </span>
                    </div>
                    <div className="bg-white rounded-lg overflow-hidden h-[210px] mb-4 flex items-center justify-center p-5">
                      {getProductImage(product) ? (
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-all duration-500"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = FALLBACK_IMG
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-5xl">inventory_2</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-on-surface mb-1">{product.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-pf-red-dark font-extrabold text-lg">
                        {getProductPrice(product)}
                      </p>
                      <div className="flex gap-1">
                        <Link
                          to={`/product/${product.id}`}
                          className="p-2.5 rounded-lg bg-pf-red/10 text-pf-red-dark hover:bg-pf-red hover:text-pf-red-dark transition-all duration-300"
                        >
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </Link>
                        <button
                          onClick={(e) => toggleWishlist(product.id, e)}
                          className={`p-2.5 rounded-lg transition-all duration-300 ${
                            wishlist.has(product.id)
                              ? 'bg-pf-red/10 text-pf-red'
                              : 'text-on-surface-variant hover:text-pf-red-dark hover:bg-pf-red/10'
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-xl"
                            style={{
                              fontVariationSettings: wishlist.has(product.id)
                                ? "'FILL' 1"
                                : "'FILL' 0",
                            }}
                          >
                            favorite
                          </span>
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
              <span className="inline-block text-xs font-bold text-pf-red tracking-[0.2em] uppercase mb-3">
                Refurbished
              </span>
              <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface">
                Certified Refurbished
              </h2>
              <p className="text-base md:text-lg text-on-surface-variant mt-1">
                Pristine devices, verified for excellence.
              </p>
            </div>
            <Link to="/phones" className="btn btn-secondary btn-sm shrink-0">
              View Collection
            </Link>
          </div>
          {refurbishedLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card p-4 rounded-2xl">
                  <div className="bg-gray-200 rounded-lg h-[210px] mb-4 animate-pulse" />
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
                  className="glass-card p-4 rounded-2xl group relative cursor-pointer hover:border-pf-red/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 stagger-item"
                >
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-pf-red-dark text-white text-xs px-3 py-1.5 rounded-full font-bold tracking-wide shadow-lg">
                      Refurbished
                    </span>
                  </div>
                  <div className="bg-white rounded-lg overflow-hidden h-[210px] mb-4 flex items-center justify-center p-5">
                    {getProductImage(product) ? (
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-all duration-500"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = FALLBACK_IMG
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-5xl">inventory_2</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-on-surface">{product.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-pf-red-dark font-extrabold text-lg">
                      {getProductPrice(product)}
                    </p>
                    <Link
                      to={`/product/${product.id}`}
                      className="p-2.5 rounded-lg bg-pf-red/10 text-pf-red-dark hover:bg-pf-red hover:text-pf-red-dark transition-all duration-300"
                    >
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
            <span className="inline-block text-xs font-bold text-pf-red tracking-[0.2em] uppercase mb-3">
              In Action
            </span>
            <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface mb-4">
              See the Precision in Action
            </h2>
            <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">
              Watch how we bring your devices back to life with clinical-grade repair techniques.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative group rounded-4xl overflow-hidden shadow-xl aspect-video bg-black">
              <video
                className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700"
                autoPlay
                muted
                loop
                playsInline
                poster={SLIDE_IMAGES[0]}
              >
                <source
                  src="https://cdn.coverr.co/videos/coverr-close-up-of-a-smartphone-display-5682/1080p.mp4"
                  type="video/mp4"
                />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <span className="text-white text-lg md:text-xl font-bold">
                  Precision Micro-Soldering
                </span>
                <p className="text-white/60 text-sm mt-1">
                  Board-level repair with microscopic accuracy
                </p>
              </div>
              <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-pf-red/20 backdrop-blur-sm border border-pf-red/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="material-symbols-outlined text-pf-red">play_arrow</span>
              </div>
            </div>
            <div className="relative group rounded-4xl overflow-hidden shadow-xl aspect-video bg-black">
              <video
                className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700"
                autoPlay
                muted
                loop
                playsInline
                poster={SLIDE_IMAGES[1]}
              >
                <source
                  src="https://cdn.coverr.co/videos/coverr-phone-in-hands-5600/1080p.mp4"
                  type="video/mp4"
                />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <span className="text-white text-lg md:text-xl font-bold">
                  Diagnostic Calibration
                </span>
                <p className="text-white/60 text-sm mt-1">Advanced testing for peak performance</p>
              </div>
              <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-pf-red/20 backdrop-blur-sm border border-pf-red/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="material-symbols-outlined text-pf-red">play_arrow</span>
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
                <span
                  key={p + dup}
                  className="text-5xl md:text-7xl font-extrabold text-on-surface/10 uppercase tracking-tighter select-none"
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
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold text-pf-red tracking-[0.2em] uppercase mb-3">
                Testimonials
              </span>
              <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface mb-4">
                Trusted by Thousands
              </h2>
              <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">
                Real experiences from our community of tech enthusiasts.
              </p>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
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
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-pf-red/10 shrink-0 ring-2 ring-pf-red/20">
                      <img alt={t.name} className="w-full h-full object-cover" src={t.img} />
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

      <EcommerceFooter />
    </div>
  )
}

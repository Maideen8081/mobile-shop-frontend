import PageLoading from '../components/ui/PageLoading'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Headset,
  Heart,
  LayoutGrid,
  Lock,
  Mail,
  MapPin,
  Navigation,
  Pause,
  Phone,
  Play,
  Recycle,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  Zap,
} from 'lucide-react'
import { categoryHref, iconForCategory, resolveCategoryName, type HeaderCategory } from '../components/ecommerce/navConfig'
import { categoryService, type Category } from '../services/categoryService'
import { productService } from '../services/productService'
import { addToCartWithAuth } from '../utils/cartAuth'
import { readWishlistIds, requireSignInForWishlist, writeWishlistIds } from '../utils/wishlist'
import { useToast } from '../context/ToastContext'
import { BUSINESS } from '../config/business'
import { useBootHold } from '../components/LoadingScreen/bootLoader'
import repairVideo from '../assets/Repairing_smartphone_internal_ci…_1080p_20261012230812.mp4'
import internalsVideo from '../assets/Smartphone_internal_components_1080p_20261002155902.mp4'
import HomeTopNav, { Logo } from '../components/ecommerce/HomeTopNav'
import FeaturedCollectionsAds from '../components/ecommerce/FeaturedCollectionsAds'
import CategoryRail from '../components/ecommerce/CategoryRail'
import './HomeStorefront.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const FALLBACK_IMG = '/phones/ios-a.png'

/* ─────────────────────────── Static content ─────────────────────────── */

const HERO_SLIDES = [
  {
    pill: 'Expert Repairs',
    title: ['Your Phone,', 'Fixed by Experts'],
    text: 'Screen, battery and charging repairs with genuine parts and a warranty on every job.',
    perks: [
      { icon: BadgeCheck, label: ['Genuine', 'Parts'] },
      { icon: Zap, label: ['Express', 'Repair'] },
      { icon: ShieldCheck, label: ['Repair', 'Warranty'] },
    ],
    cta: { label: 'Book Repair', to: '/book-repair' },
    badge: 'Trusted Service',
    offer: { kicker: 'Every repair', big: String(BUSINESS.repairWarrantyMonths), unit: 'MONTH', note: 'Warranty on parts & labour' },
    video: repairVideo,
    poster: '/products/repair-internals.jpg',
  },
  {
    pill: 'Accessories',
    title: ['Power Up Your', 'Everyday Tech'],
    text: 'Earbuds, headphones, chargers and power banks from brands you trust.',
    perks: [
      { icon: Truck, label: ['Free Delivery', `Over ₹${BUSINESS.freeDeliveryOver}`] },
      { icon: BadgeCheck, label: ['100%', 'Genuine'] },
      { icon: RefreshCw, label: [`Easy ${BUSINESS.returnDays}-Day`, 'Returns'] },
    ],
    cta: { label: 'Shop Accessories', to: '/accessories' },
    badge: 'Top Picks',
    offer: { kicker: 'Delivery at', big: '₹0', unit: 'FREE', note: `On orders over ₹${BUSINESS.freeDeliveryOver}` },
    video: internalsVideo,
    poster: '/promos/smart-home.jpg',
  },
]

// Map search text. Swap in the full street address once the shop has one.
const MAP_QUERY = 'Chennai, Tamil Nadu'
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`
// Keyless embed URL: no Maps API key or billing account needed.
const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&z=12&output=embed`

const PROMOS = [
  { kicker: 'New Arrivals', title: ['Fresh Phones', 'Just In'], to: '/collection/all?tab=new', img: '/products/phone-10t.png', tone: 'sage' },
  { kicker: 'Expert Repairs', title: ['Make Your Phone', 'Like New'], to: '/book-repair', img: '/products/repair-internals.png', tone: 'sand' },
  { kicker: 'Tech Essentials', title: ['Upgrade Your', 'Lifestyle'], to: '/accessories', img: '/products/headphones-anc.png', tone: 'sky' },
]

const TESTIMONIALS = [
  { name: 'Arjun S.', quote: 'Amazing quality and fast delivery! PhoneFix has become my go-to store for everything mobile.' },
  { name: 'Priya K.', quote: 'Great prices, excellent customer service, and super easy returns. Highly recommend!' },
  { name: 'Rahul M.', quote: 'I love the variety they offer. I can find every accessory I need in one place. So convenient!' },
  { name: 'Ananya R.', quote: 'Got my screen fixed in under an hour with genuine parts. Honest people and fair pricing.' },
]

const BENEFITS = [
  { icon: Truck, title: 'Free Shipping', text: `On orders over ₹${BUSINESS.freeDeliveryOver}` },
  { icon: RefreshCw, title: 'Easy Returns', text: `${BUSINESS.returnDays} days return policy` },
  { icon: Lock, title: 'Secure Payments', text: '100% secure checkout' },
  { icon: Headset, title: 'Dedicated Support', text: "We're here to help" },
]

const FOOTER_COLS = [
  { title: 'Shop', links: [['All Categories', '/collection/all'], ['New Arrivals', '/collection/all?tab=new'], ['Best Sellers', '/collection/all?tab=best'], ['Deals', '/collection/all?tab=deals'], ['Accessories', '/accessories']] },
  { title: 'Customer Service', links: [['Track Order', '/orders'], ['Returns & Refunds', '/refund-policy'], ['Shipping Info', '/shipping-policy'], ['Book a Repair', '/book-repair']] },
  { title: 'Company', links: [['About Us', '/about'], ['Repair Services', '/repairs'], ['Trade In', '/trade-in'], ['My Account', '/profile'], ['Wishlist', '/wishlist']] },
] as const

/* ─────────────────────────── Data helpers ─────────────────────────── */

function imageUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
  return `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function productImage(product: any): string {
  return (
    imageUrl(
      product.coverImage ||
        product.common_image ||
        product.image ||
        product.images?.[0] ||
        product.thumbnail ||
        product.variants?.[0]?.images?.[0],
    ) || FALLBACK_IMG
  )
}

/** Selling price + MRP. List endpoints often omit variants, so fall back to product prices. */
function priceOf(product: any): { price: number; mrp: number } {
  const v = product?.variants?.[0]
  const price =
    Number(v?.discountPrice) ||
    Number(v?.price) ||
    Number(product?.minPrice) ||
    Number(product?.rawDiscountPrice) ||
    Number(product?.price) ||
    0
  const mrp = Number(v?.price) || Number(product?.price) || price
  return { price, mrp: Math.max(mrp, price) }
}

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

let cache: { categories: Category[]; picks: any[]; refurbished: any[] } | null = null

/* ─────────────────────────── Small pieces ─────────────────────────── */

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="vv-stars" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={i <= Math.round(value) ? 'currentColor' : 'none'} aria-hidden="true" />
      ))}
    </span>
  )
}

function PickCard({
  product,
  liked,
  onToggleLike,
  onAdd,
}: {
  product: any
  liked: boolean
  onToggleLike: () => void
  onAdd: () => void
}) {
  const { price, mrp } = priceOf(product)
  const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0
  const rating = Number(product?.rating) || 0
  const count = Number(product?.reviewCount ?? product?.reviews_count) || 0
  const name = String(product?.name ?? product?.product_name ?? '')
  const to = `/product/${product.id}`
  const outOfStock = product?.inStock === false || product?.totalStock === 0

  return (
    <article className="vv-card">
      <div className="vv-card-media">
        {outOfStock ? <span className="vv-chip is-out">Sold out</span> : off > 0 && <span className="vv-chip">-{off}%</span>}
        <button
          type="button"
          className={`vv-card-heart${liked ? ' is-on' : ''}`}
          onClick={onToggleLike}
          aria-pressed={liked}
          aria-label={liked ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
        >
          <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <Link to={to} aria-label={`View ${name}`}>
          <img
            src={productImage(product)}
            alt=""
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG }}
          />
        </Link>
      </div>
      <div className="vv-card-body">
        <Link to={to} className="vv-card-name">{name}</Link>
        {rating > 0 && (
          <div className="vv-card-rating">
            <Stars value={rating} size={12} />
            {count > 0 && <span>({count.toLocaleString('en-IN')})</span>}
          </div>
        )}
        <div className="vv-card-foot">
          <div className="vv-card-price">
            <strong>{price > 0 ? inr(price) : 'View price'}</strong>
            {off > 0 && <s>{inr(mrp)}</s>}
          </div>
          {!outOfStock && (
            <button type="button" className="vv-card-cart" onClick={onAdd} aria-label={`Add ${name} to cart`}>
              <ShoppingCart size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function HomeStorefront() {
  const navigate = useNavigate()
  const { show: showToast } = useToast()

  const [categories, setCategories] = useState<Category[]>(cache?.categories ?? [])
  const [picks, setPicks] = useState<any[]>(cache?.picks ?? [])
  const [refurbished, setRefurbished] = useState<any[]>(cache?.refurbished ?? [])
  const heroSection = useRef<HTMLElement>(null)
  const [heroPaused, setHeroPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const heroVideos = useRef<(HTMLVideoElement | null)[]>([])
  const refurbRail = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(() => !cache)
  useBootHold(loading)
  const [slide, setSlide] = useState(0)
  const [reviewStart, setReviewStart] = useState(0)
  const rail = useRef<HTMLDivElement>(null)
  const [wishlist, setWishlist] = useState(() => new Set(readWishlistIds()))

  useEffect(() => {
    const syncWishlist = () => setWishlist(new Set(readWishlistIds()))
    window.addEventListener('wishlist-updated', syncWishlist)
    window.addEventListener('storage', syncWishlist)
    return () => {
      window.removeEventListener('wishlist-updated', syncWishlist)
      window.removeEventListener('storage', syncWishlist)
    }
  }, [])

  /* Load the live categories and featured products. */
  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      categoryService.list(),
      productService.list({ is_trending: true, page_size: 10 }),
      productService.list({ is_new_arrival: true, page_size: 10 }),
      productService.list({ is_refurbished: true, page_size: 10 }),
    ]).then(([c, t, a, r]) => {
      if (cancelled) return
      const cats = c.status === 'fulfilled' ? c.value.filter((x) => x.status === 'active') : []
      const merged = [
        ...(t.status === 'fulfilled' ? t.value : []),
        ...(a.status === 'fulfilled' ? a.value : []),
      ]
      const seen = new Set<string>()
      const list = merged.filter((p: any) => {
        const k = String(p.id)
        if (seen.has(k)) return false
        seen.add(k)
        return true
      }).slice(0, 10)
      const rf = r.status === 'fulfilled' ? r.value.slice(0, 10) : []
      if ([c, t, a, r].every((result) => result.status === 'fulfilled')) {
        cache = { categories: cats, picks: list, refurbished: rf }
      }
      setCategories(cats)
      setPicks(list)
      setRefurbished(rf)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  /* Hero auto-advance */
  useEffect(() => {
    if (heroPaused) return
    const t = window.setInterval(() => {
      if (!document.hidden && !heroSection.current?.matches(':hover, :focus-within')) {
        setSlide((s) => (s + 1) % HERO_SLIDES.length)
      }
    }, 6000)
    return () => window.clearInterval(t)
  }, [heroPaused])

  /* Play only the active slide's video; pause everything while the tab is hidden. */
  useEffect(() => {
    let visible = false
    const videos = heroVideos.current
    const sync = () => {
      videos.forEach((v, i) => {
        if (!v) return
        if (i === slide && visible && !document.hidden && !heroPaused) {
          if (v.readyState === 0) v.load()
          void v.play().catch(() => {})
        } else {
          v.pause()
        }
      })
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    })
    if (heroSection.current) observer.observe(heroSection.current)
    document.addEventListener('visibilitychange', sync)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
      videos.forEach((video) => video?.pause())
    }
  }, [slide, heroPaused])

  const headerCats: HeaderCategory[] = categories.map((c) => ({ id: c.id, name: c.name }))

  const toggleWishlist = (id: number) => {
    if (!requireSignInForWishlist(navigate)) return
    const ids = readWishlistIds()
    const added = !ids.includes(id)
    try {
      writeWishlistIds(added ? [...ids, id] : ids.filter((item) => item !== id))
      showToast(added ? 'Added to wishlist' : 'Removed from wishlist', 'success')
    } catch {
      showToast('Could not update your wishlist', 'error')
    }
  }

  const addToCart = async (product: any) => {
    const v = product?.variants?.[0]
    const { price } = priceOf(product)
    try {
      const ok = await addToCartWithAuth({
        productId: Number(product.id),
        variationId: Number(v?.dbId ?? v?.id) || 0,
        quantity: 1,
        name: String(product.name ?? ''),
        brand: product.brand || '',
        price,
        image: productImage(product),
        storage: v?.storage || '',
        ram: v?.ram || '',
        color: v?.color || '',
      })
      if (ok) showToast(`${product.name} added to cart`, 'success')
    } catch (err: any) {
      showToast(err?.message || 'Could not add to cart', 'error')
    }
  }

  const scrollRail = (dir: 1 | -1, ref = rail) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  const hero = HERO_SLIDES[slide]
  const refurbHref = categoryHref(resolveCategoryName('Refurbished Devices', headerCats))

  const renderRail = (list: any[], ref: React.RefObject<HTMLDivElement | null>) => (
    loading ? <PageLoading label="Loading products…" className="py-12" /> : (
      <div className="vv-rail-wrap">
        <div className="vv-rail" ref={ref}>
          {list.map((p) => (
            <PickCard
              key={p.id}
              product={p}
              liked={wishlist.has(Number(p.id))}
              onToggleLike={() => toggleWishlist(Number(p.id))}
              onAdd={() => addToCart(p)}
            />
          ))}
        </div>
        {list.length > 5 && (
          <>
            <button type="button" className="vv-round vv-rail-prev" onClick={() => scrollRail(-1, ref)} aria-label="Previous products">
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="vv-round vv-rail-next" onClick={() => scrollRail(1, ref)} aria-label="More products">
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    )
  )

  const reviews = [0, 1, 2].map((i) => TESTIMONIALS[(reviewStart + i) % TESTIMONIALS.length])
  const moveReviews = (dir: 1 | -1) =>
    setReviewStart((s) => (s + dir + TESTIMONIALS.length) % TESTIMONIALS.length)

  return (
    <div className="vv vv-home">
      <HomeTopNav />

      <main className="vv-container">
        {/* ── Hero (video carousel) ── */}
        <section ref={heroSection} className="vv-hero" aria-roledescription="carousel" aria-label="Featured offers">
          <div className="vv-hero-media" aria-hidden="true" style={{ backgroundImage: `url(${hero.poster})` }}>
            {HERO_SLIDES.map((sl, i) => (
              <video
                key={sl.pill}
                ref={(el) => { heroVideos.current[i] = el }}
                className={`vv-hero-video${i === slide ? ' is-on' : ''}`}
                muted
                loop
                playsInline
                preload="none"
                tabIndex={-1}
              >
                <source src={sl.video} type="video/mp4" />
              </video>
            ))}
          </div>

          <div className="vv-hero-copy" key={`copy-${slide}`}>
            <span className="vv-pill"><Sparkles size={13} fill="currentColor" /> {hero.pill}</span>
            <h1>
              {hero.title[0]}
              <br />
              <em>{hero.title[1]}</em>
            </h1>
            <p>{hero.text}</p>
            <ul className="vv-perks">
              {hero.perks.map(({ icon: Icon, label }) => (
                <li key={label.join(' ')}>
                  <span><Icon size={16} /></span>
                  <b>{label[0]}<br />{label[1]}</b>
                </li>
              ))}
            </ul>
            <Link to={hero.cta.to} className="vv-btn vv-btn-light">
              {hero.cta.label} <ArrowRight size={16} />
            </Link>
          </div>

          <div className="vv-hero-offer" key={`offer-${slide}`}>
            <div className="vv-ticket">
              <span className="vv-ticket-badge"><Zap size={13} fill="currentColor" /> {hero.badge}</span>
              <span className="vv-ticket-kicker">{hero.offer.kicker}</span>
              <span className="vv-ticket-value">
                <strong>{hero.offer.big}</strong>
                <em>{hero.offer.unit}</em>
              </span>
              <span className="vv-ticket-cut" aria-hidden="true" />
              <span className="vv-ticket-note">{hero.offer.note}</span>
            </div>
          </div>

          <button
            type="button"
            className="vv-hero-playback"
            aria-label={heroPaused ? 'Play featured offers' : 'Pause featured offers'}
            onClick={() => setHeroPaused((paused) => !paused)}
          >
            {heroPaused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
          </button>
          <div className="vv-dots" role="group" aria-label="Choose slide">
            {HERO_SLIDES.map((sl, i) => (
              <button
                key={sl.pill}
                type="button"
                aria-current={i === slide ? 'true' : undefined}
                aria-label={`Slide ${i + 1}: ${sl.pill}`}
                className={i === slide ? 'is-on' : ''}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        </section>

        {/* ── Shop by Category ── */}
        <CategoryRail className="vv-categories" headingClassName="vv-head" trackClassName="vv-catrow">
          {categories.map((category) => {
            const Icon = iconForCategory(category.name)
            const categoryImage = imageUrl(category.image)
            return (
              <Link key={category.id} to={categoryHref(category.name)} className="vv-catitem">
                <span className="vv-catmedia">
                  <Icon className="vv-caticon" size={44} strokeWidth={1.5} />
                  {categoryImage && (
                    <img
                      key={categoryImage}
                      className="vv-catimg"
                      src={categoryImage}
                      alt=""
                      loading="lazy"
                      onError={(e) => { e.currentTarget.hidden = true }}
                    />
                  )}
                </span>
                <span>{category.name}</span>
              </Link>
            )
          })}
          <Link to="/collection/all" className="vv-catitem">
            <span className="vv-catmedia">
              <LayoutGrid size={44} strokeWidth={1.5} />
            </span>
            <span>View All</span>
          </Link>
        </CategoryRail>

        {/* ── Featured collections (ad banners) ── */}
        <FeaturedCollectionsAds categories={headerCats} />

        {/* ── Top picks ── */}
        {(loading || picks.length > 0) && (
          <section className="vv-product-section">
            <div className="vv-head">
              <h2>Top Picks For You <Sparkles size={18} className="vv-spark" fill="currentColor" /></h2>
              <Link to="/collection/all?tab=deals" className="vv-head-link">See All Deals <ArrowRight size={15} /></Link>
            </div>
            {renderRail(picks, rail)}
          </section>
        )}

        {/* ── Promo tiles ── */}
        <section className="vv-promos">
          {PROMOS.map((p) => (
            <Link key={p.kicker} to={p.to} className={`vv-promo tone-${p.tone}`}>
              <div>
                <span className="vv-promo-kicker">{p.kicker}</span>
                <h3>{p.title.join(' ')}</h3>
                <span className="vv-promo-cta">Shop Now <ArrowRight size={14} /></span>
              </div>
              <img src={p.img} alt="" loading="lazy" />
            </Link>
          ))}
        </section>

        {/* ── Refurbished banner ── */}
        <section className="vv-refurb">
          <div className="vv-refurb-copy">
            <span className="vv-refurb-icon"><Recycle size={30} strokeWidth={1.6} /></span>
            <div>
              <span className="vv-promo-kicker">Certified Refurbished</span>
              <h2>Refurbished<br />Mobile Phones</h2>
              <p>Certified, tested and reliable phones at a lower price.</p>
              <ul className="vv-chips">
                <li><ShieldCheck size={14} /> 12-Month Warranty</li>
                <li><BadgeCheck size={14} /> Quality Tested</li>
                <li><Sparkles size={14} /> Like-New Condition</li>
              </ul>
            </div>
          </div>
          <div className="vv-refurb-art" aria-hidden="true">
            <img src="/phones/ios-b.png" alt="" />
            <img src="/phones/ios-a.png" alt="" />
            <img src="/phones/gold.png" alt="" />
            <img src="/products/phone-10t.png" alt="" />
          </div>
          <div className="vv-refurb-offer">
            <h3>Save More with<br />Refurbished Phones</h3>
            <div className="vv-refurb-bubble">
              <span>Up to</span>
              <strong>40% OFF</strong>
            </div>
            <Link to={refurbHref} className="vv-btn">
              Shop Refurbished <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {(loading || refurbished.length > 0) && (
          <section className="vv-product-section">
            <div className="vv-head">
              <h2>Certified Refurbished <Recycle size={18} className="vv-recycle" /></h2>
              <Link to={refurbHref} className="vv-head-link">View All <ArrowRight size={15} /></Link>
            </div>
            {renderRail(refurbished, refurbRail)}
          </section>
        )}

        {/* ── Testimonials ── */}
        <section className="vv-reviews-section">
          <div className="vv-head">
            <h2>Loved By Thousands <Heart size={18} className="vv-heart" fill="currentColor" /></h2>
            <div className="vv-avg">
              <span>4.8/5 Average Rating</span>
              <Stars value={5} size={16} />
            </div>
          </div>
          <div className="vv-reviews">
            <button type="button" className="vv-review-nav" onClick={() => moveReviews(-1)} aria-label="Previous reviews">
              <ChevronLeft size={18} />
            </button>
            <div className="vv-review-track">
              {reviews.map((r) => (
                <figure key={r.name} className="vv-review">
                  <span className="vv-avatar" aria-hidden="true">{r.name[0]}</span>
                  <div>
                    <figcaption>
                      {r.name} <BadgeCheck size={15} className="vv-verified" fill="currentColor" stroke="#fff" />
                    </figcaption>
                    <Stars value={5} size={12} />
                    <blockquote>“{r.quote}”</blockquote>
                  </div>
                </figure>
              ))}
            </div>
            <button type="button" className="vv-review-nav" onClick={() => moveReviews(1)} aria-label="Next reviews">
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        {/* ── Benefits ── */}
        <ul className="vv-benefits">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
              <span><b>{title}</b>{text}</span>
            </li>
          ))}
        </ul>

        {/* ── Store location ── */}
        <section className="vv-store" aria-labelledby="vv-store-title">
          <div className="vv-store-info">
            <span className="vv-promo-kicker">Our Location</span>
            <h2 id="vv-store-title">Visit Our Store</h2>
            <p>Walk in for new phones, accessories and same-day repairs.</p>
            <dl>
              <div>
                <dt><MapPin size={18} /></dt>
                <dd><small>Address</small>{BUSINESS.name}, {BUSINESS.city}</dd>
              </div>
              <div>
                <dt><Clock size={18} /></dt>
                <dd><small>Opening Hours</small>{BUSINESS.hours}</dd>
              </div>
              {BUSINESS.phoneTel && (
                <div>
                  <dt><Phone size={18} /></dt>
                  <dd><small>Phone</small><a href={`tel:${BUSINESS.phoneTel}`}>{BUSINESS.phoneDisplay}</a></dd>
                </div>
              )}
              <div>
                <dt><Mail size={18} /></dt>
                <dd><small>Email</small><a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></dd>
              </div>
            </dl>
            <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="vv-btn">
              <Navigation size={16} /> Open in Google Maps
            </a>
          </div>
          <div className="vv-store-map">
            <iframe
              title={`Map showing ${BUSINESS.name}, ${BUSINESS.city}`}
              src={MAP_EMBED}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="vv-footer">
        <div className="vv-container vv-footer-intro">
          <div className="vv-footer-brand">
            <Logo light />
            <p>Phones, accessories and expert repairs in Chennai.</p>
            <div className="vv-social">
              {[
                ['Facebook', BUSINESS.facebookUrl, 'M14 8h3V4h-3c-2.8 0-4 1.7-4 4.2V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6Z'],
                ['Instagram', BUSINESS.instagramUrl, 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z'],
                ['YouTube', BUSINESS.youtubeUrl, 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z'],
              ]
                .filter(([, href]) => href)
                .map(([label, href, d]) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d={d} fill="currentColor" fillRule="evenodd" /></svg>
                  </a>
                ))}
            </div>
          </div>
          <Link className="vv-footer-support" to="/support">
            <Headset size={19} aria-hidden="true" />
            Get support
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="vv-container vv-footer-grid">
          {FOOTER_COLS.map((col) => (
            <div key={col.title} className="vv-footer-col">
              <h4>{col.title}</h4>
              <ul>
                {col.links.map(([label, to]) => (
                  <li key={label}><Link to={to}>{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
          <div className="vv-footer-col vv-footer-contact">
            <h4>Visit &amp; Contact</h4>
            <ul className="vv-contact">
              <li><MapPin size={16} aria-hidden="true" /><a href={MAPS_LINK} target="_blank" rel="noopener noreferrer">{BUSINESS.city}</a></li>
              <li><Clock size={16} aria-hidden="true" /><span>{BUSINESS.hours}</span></li>
              {BUSINESS.phoneTel && <li><Phone size={16} aria-hidden="true" /><a href={`tel:${BUSINESS.phoneTel}`}>{BUSINESS.phoneDisplay}</a></li>}
              <li><Mail size={16} aria-hidden="true" /><a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></li>
            </ul>
          </div>
        </div>
        <div className="vv-container vv-footer-bottom">
          <span>© {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.</span>
          <nav aria-label="Legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/refund-policy">Refund Policy</Link>
          </nav>
          <span className="vv-locale">🇮🇳 India · INR</span>
        </div>
      </footer>
    </div>
  )
}

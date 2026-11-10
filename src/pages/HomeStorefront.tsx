import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BatteryCharging,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Flame,
  Headphones,
  Heart,
  Percent,
  Quote,
  Recycle,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Truck,
  Watch,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import StoreFooter from '../components/ecommerce/StoreFooter'
import { categoryHref, resolveCategoryName, type HeaderCategory } from '../components/ecommerce/navConfig'
import { categoryService, type Category } from '../services/categoryService'
import { productService } from '../services/productService'
import { productsData } from '../data/productData'
import { addToCartWithAuth } from '../utils/cartAuth'
import { requireSignInForWishlist } from '../utils/wishlist'
import { useToast } from '../context/ToastContext'
import phonesVideo from '../assets/Orange_smartphone_exploding_view_1080p_20261002155324.mp4'
import repairVideo from '../assets/Repairing_smartphone_internal_ci…_1080p_20261012230812.mp4'
import internalsVideo from '../assets/Smartphone_internal_components_1080p_20261002155902.mp4'
import './HomeStorefront.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const FALLBACK_IMG = '/phones/ios-a.png'

/* ─────────────────────────── Static content ─────────────────────────── */

const HERO_SLIDES = [
  {
    pill: 'New Launch',
    title: ['Latest Smartphones', 'Now at PhoneFix'],
    text: 'Discover cutting-edge smartphones from top brands with great offers and assured warranty.',
    perks: [
      { icon: Percent, label: ['Up to', '25% Off'] },
      { icon: CreditCard, label: ['No Cost', 'EMI'] },
      { icon: ShieldCheck, label: ['Brand', 'Warranty'] },
    ],
    cta: { label: 'Shop Now', to: '/phones' },
    badge: 'Limited Time Offer',
    offer: { kicker: 'Up to', big: '25%', unit: 'OFF', note: 'On top smartphone brands' },
    video: phonesVideo,
  },
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
    offer: { kicker: 'Every repair', big: '12', unit: 'MONTH', note: 'Warranty on parts & labour' },
    // Same clip as the Repairs page hero.
    video: repairVideo,
  },
  {
    pill: 'Accessories',
    title: ['Power Up Your', 'Everyday Tech'],
    text: 'Earbuds, headphones, chargers and power banks from brands you trust.',
    perks: [
      { icon: Truck, label: ['Free Delivery', 'Over ₹500'] },
      { icon: BadgeCheck, label: ['100%', 'Genuine'] },
      { icon: RefreshCw, label: ['Easy 7-Day', 'Returns'] },
    ],
    cta: { label: 'Shop Accessories', to: '/accessories' },
    badge: 'Top Picks',
    offer: { kicker: 'Delivery at', big: '₹0', unit: 'FREE', note: 'On orders over ₹500' },
    video: internalsVideo,
  },
]

interface CategoryTile {
  label: string
  /** Name used to find the matching backend category. */
  match?: string
  to?: string
  img?: string
  icon: LucideIcon
}

const CATEGORY_TILES: CategoryTile[] = [
  { label: 'Smartphones', img: '/phones/ios-a.png', icon: Smartphone },
  { label: 'Tablets', icon: Tablet },
  { label: 'Smart Watches', icon: Watch },
  { label: 'Earbuds', img: '/products/earbuds-pro.png', icon: Headphones },
  { label: 'Headphones', img: '/products/headphones-anc.png', icon: Headphones },
  { label: 'Power Banks', img: '/products/powerbank.png', icon: BatteryCharging },
  { label: 'Chargers & Cables', match: 'Chargers', img: '/products/charger-20w.png', icon: Zap },
  { label: 'Mobile Accessories', to: '/accessories', img: '/products/cable-c-lightning.png', icon: Smartphone },
  { label: 'Phone Repair', to: '/book-repair', icon: Wrench },
]

const REPAIR_SERVICES = [
  { icon: Smartphone, label: ['Screen', 'Replacement'] },
  { icon: BatteryCharging, label: ['Battery', 'Replacement'] },
  { icon: Zap, label: ['Charging', 'Issue Fix'] },
  { icon: Settings, label: ['Other', 'Repairs'] },
]

const TESTIMONIALS = [
  { name: 'Arjun Sharma', quote: 'Fixed my iPhone screen in under 45 minutes at my office. The precision is unmatched.' },
  { name: 'Priya Kapur', quote: 'Bought a refurbished Pixel and it looks brand new. The warranty gives me total peace of mind.' },
  { name: 'Rahul Mehta', quote: 'Excellent diagnostics. Honest people are hard to find. They saved me from an unnecessary repair.' },
  { name: 'Ananya Reddy', quote: 'Got my Galaxy S24 Ultra at an amazing price. Their refurbished quality is top-notch with original accessories.' },
]

const BENEFITS = [
  { icon: Truck, title: 'Free Delivery', text: 'on Orders Over ₹500' },
  { icon: ShieldCheck, title: '100% Genuine', text: 'Branded Products' },
  { icon: RefreshCw, title: 'Easy 7-Day', text: 'Returns' },
  { icon: Headphones, title: '1-Year', text: 'Service Support' },
]

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

let cache: { categories: Category[]; arrivals: any[]; trending: any[]; refurbished: any[] } | null = null

/* ─────────────────────────── Product card ─────────────────────────── */

function MiniProductCard({
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
  const name = String(product?.name ?? product?.product_name ?? '')
  const to = `/product/${product.id}`

  return (
    <article className="hs-card">
      <Link to={to} className="hs-card-img" aria-label={`View ${name}`}>
        <img
          src={productImage(product)}
          alt=""
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG }}
        />
      </Link>
      <div className="hs-card-body">
        <Link to={to} className="hs-card-name">{name}</Link>
        {rating > 0 && (
          <div className="hs-card-rating">
            <Star size={14} fill="currentColor" aria-hidden="true" />
            <b>{rating.toFixed(1)}</b>
          </div>
        )}
        <div className="hs-card-price">
          <strong>{price > 0 ? inr(price) : 'View price'}</strong>
          {off > 0 && <s>{inr(mrp)}</s>}
        </div>
        {off > 0 && <span className="hs-off">{off}% OFF</span>}
      </div>
      <button
        type="button"
        className={`hs-card-heart${liked ? ' is-on' : ''}`}
        onClick={onToggleLike}
        aria-pressed={liked}
        aria-label={liked ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
      >
        <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
      </button>
      <button type="button" className="hs-card-cart" onClick={onAdd} aria-label={`Add ${name} to cart`}>
        <ShoppingCart size={18} />
      </button>
    </article>
  )
}

function SectionHead({
  icon,
  title,
  pill,
  sub,
  to,
  linkLabel = 'View All',
}: {
  icon?: React.ReactNode
  title: string
  pill?: string
  sub: string
  to: string
  linkLabel?: string
}) {
  return (
    <div className="hs-head">
      <div>
        <h2>
          {icon}
          {title}
          {pill && <span className="hs-head-pill">{pill}</span>}
        </h2>
        <p>{sub}</p>
      </div>
      <Link to={to} className="hs-head-link">
        {linkLabel} <ArrowRight size={16} />
      </Link>
    </div>
  )
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function HomeStorefront() {
  const navigate = useNavigate()
  const { show: showToast } = useToast()

  const [slide, setSlide] = useState(0)
  const heroVideos = useRef<(HTMLVideoElement | null)[]>([])
  const [categories, setCategories] = useState<Category[]>(cache?.categories ?? [])
  const [arrivals, setArrivals] = useState<any[]>(cache?.arrivals ?? [])
  const [trending, setTrending] = useState<any[]>(cache?.trending ?? [])
  const [refurbished, setRefurbished] = useState<any[]>(cache?.refurbished ?? [])
  const [reviewStart, setReviewStart] = useState(0)
  const [loading, setLoading] = useState(() => !cache)
  const [wishlist, setWishlist] = useState<Set<number>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('wishlist') || '[]'))
    } catch {
      return new Set()
    }
  })

  /* Hero auto-advance */
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 6000)
    return () => window.clearInterval(t)
  }, [])

  /* Play only the active slide's video; pause everything while the tab is hidden. */
  useEffect(() => {
    const sync = () => {
      heroVideos.current.forEach((v, i) => {
        if (!v) return
        if (i === slide && !document.hidden) {
          if (v.readyState === 0) v.load()
          void v.play().catch(() => {})
        } else {
          v.pause()
        }
      })
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [slide])

  /* Data: categories, new arrivals, trending (falls back to the bundled catalogue) */
  useEffect(() => {
    let cancelled = false
    const pick = (list: any[], key: 'newArrival' | 'trending' | 'refurbished') =>
      list.length > 0 ? list.slice(0, 4) : productsData.filter((p: any) => p[key]).slice(0, 4)

    Promise.allSettled([
      categoryService.list(),
      productService.list({ is_new_arrival: true, page_size: 4 }),
      productService.list({ is_trending: true, page_size: 4 }),
      productService.list({ is_refurbished: true, page_size: 4 }),
    ]).then(([c, a, t, r]) => {
      if (cancelled) return
      const cats = c.status === 'fulfilled' ? c.value.filter((x) => x.status === 'active') : []
      const na = pick(a.status === 'fulfilled' ? a.value : [], 'newArrival')
      const tr = pick(t.status === 'fulfilled' ? t.value : [], 'trending')
      const rf = pick(r.status === 'fulfilled' ? r.value : [], 'refurbished')
      cache = { categories: cats, arrivals: na, trending: tr, refurbished: rf }
      setCategories(cats)
      setArrivals(na)
      setTrending(tr)
      setRefurbished(rf)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const headerCats: HeaderCategory[] = categories.map((c) => ({ id: c.id, name: c.name }))

  const tileHref = (tile: CategoryTile) =>
    tile.to ?? categoryHref(resolveCategoryName(tile.match ?? tile.label, headerCats))

  const tileImage = (tile: CategoryTile): string => {
    const wanted = resolveCategoryName(tile.match ?? tile.label, headerCats).toLowerCase()
    const cat = categories.find((c) => c.name.toLowerCase() === wanted)
    return imageUrl(cat?.image) || tile.img || ''
  }

  const toggleWishlist = (id: number) => {
    if (!requireSignInForWishlist(navigate)) return
    setWishlist((prev) => {
      const next = new Set(prev)
      const added = !next.has(id)
      if (added) next.add(id)
      else next.delete(id)
      try {
        localStorage.setItem('wishlist', JSON.stringify(Array.from(next)))
      } catch { /* storage unavailable */ }
      window.dispatchEvent(new Event('wishlist-updated'))
      showToast(added ? 'Added to wishlist' : 'Removed from wishlist', 'success')
      return next
    })
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

  const hero = HERO_SLIDES[slide]
  const reviews = [0, 1, 2].map((i) => TESTIMONIALS[(reviewStart + i) % TESTIMONIALS.length])
  const moveReviews = (dir: 1 | -1) =>
    setReviewStart((s) => (s + dir + TESTIMONIALS.length) % TESTIMONIALS.length)

  const renderCards = (list: any[]) => loading ? (
    <div className="hs-cards" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="hs-card is-skeleton" aria-hidden="true">
          <div className="hs-sk hs-sk-img" />
          <div className="hs-card-body">
            <div className="hs-sk hs-sk-line" />
            <div className="hs-sk hs-sk-line short" />
            <div className="hs-sk hs-sk-line short" />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="hs-cards">
      {list.map((p) => (
        <MiniProductCard
          key={p.id}
          product={p}
          liked={wishlist.has(Number(p.id))}
          onToggleLike={() => toggleWishlist(Number(p.id))}
          onAdd={() => addToCart(p)}
        />
      ))}
    </div>
  )

  return (
    <div className="hs">
      <SiteTopNav />

      <main className="hs-wrap">
        {/* ── Hero ── */}
        <section className="hs-hero" aria-roledescription="carousel" aria-label="Featured offers">
          <div className="hs-hero-media" aria-hidden="true">
            {HERO_SLIDES.map((s, i) => (
              <video
                key={s.pill}
                ref={(el) => { heroVideos.current[i] = el }}
                className={`hs-hero-video${i === slide ? ' is-on' : ''}`}
                muted
                loop
                playsInline
                preload={i === 0 ? 'auto' : 'none'}
                tabIndex={-1}
              >
                <source src={s.video} type="video/mp4" />
              </video>
            ))}
            <span className="hs-hero-shade" />
          </div>

          <div className="hs-hero-copy" key={`copy-${slide}`}>
            <span className="hs-pill"><Sparkles size={14} fill="currentColor" /> {hero.pill}</span>
            <h1>
              {hero.title[0]}
              <br />
              <span className="hs-h1-accent">{hero.title[1]}</span>
            </h1>
            <p>{hero.text}</p>
            <ul className="hs-perks">
              {hero.perks.map(({ icon: Icon, label }) => (
                <li key={label.join(' ')}>
                  <span><Icon size={18} /></span>
                  <b>{label[0]}<br />{label[1]}</b>
                </li>
              ))}
            </ul>
            <Link to={hero.cta.to} className="hs-btn hs-btn-yellow">
              {hero.cta.label} <ArrowRight size={18} />
            </Link>
          </div>

          <div className="hs-hero-offer" key={`offer-${slide}`}>
            <div className="hs-ticket">
              <span className="hs-ticket-badge"><Zap size={15} fill="currentColor" /> {hero.badge}</span>
              <span className="hs-ticket-kicker">{hero.offer.kicker}</span>
              <span className="hs-ticket-value">
                <strong>{hero.offer.big}</strong>
                <em>{hero.offer.unit}</em>
              </span>
              <span className="hs-ticket-cut" aria-hidden="true" />
              <span className="hs-ticket-note">{hero.offer.note}</span>
              <Sparkles className="hs-ticket-spark" size={22} aria-hidden="true" />
            </div>
          </div>

          <div className="hs-dots" role="tablist" aria-label="Choose slide">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.pill}
                type="button"
                role="tab"
                aria-selected={i === slide}
                aria-label={`Slide ${i + 1}: ${s.pill}`}
                className={i === slide ? 'is-on' : ''}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        </section>

        {/* ── Shop by Category ── */}
        <section className="hs-section">
          <SectionHead
            title="Shop by Category"
            sub="Explore our wide range of mobile products and services."
            to="/collection/all"
            linkLabel="View All Categories"
          />
          <div className="hs-cats">
            {CATEGORY_TILES.map((tile) => {
              const img = tileImage(tile)
              const Icon = tile.icon
              return (
                <Link key={tile.label} to={tileHref(tile)} className="hs-cat">
                  <span className="hs-cat-art">
                    {img ? (
                      <img src={img} alt="" loading="lazy" />
                    ) : (
                      <Icon size={40} strokeWidth={1.6} aria-hidden="true" />
                    )}
                  </span>
                  <span className="hs-cat-name">{tile.label}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── New Arrivals ── */}
        <section className="hs-section">
          <SectionHead
            title="New Arrivals"
            pill="Just Launched"
            sub="The latest products, now at PhoneFix."
            to="/collection/all?tab=new"
          />
          {renderCards(arrivals)}
        </section>

        {/* ── Repair banner ── */}
        <section className="hs-repair">
          <div className="hs-repair-photo" aria-hidden="true">
            <img src="/products/repair-internals.jpg" alt="" loading="lazy" />
          </div>
          <div className="hs-repair-copy">
            <span className="hs-eyebrow">Phone Repair Services</span>
            <h2>Your Phone, Fixed by Experts</h2>
            <p>Quick, reliable and affordable repair services for all major mobile brands.</p>
            <ul className="hs-repair-list">
              {REPAIR_SERVICES.map(({ icon: Icon, label }) => (
                <li key={label.join(' ')}>
                  <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                  <span>{label[0]}<br />{label[1]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="hs-repair-card">
            <h3>Book a Repair Today</h3>
            <ul>
              <li><Check size={15} /> Genuine Spare Parts</li>
              <li><Check size={15} /> Trained Technicians</li>
              <li><Check size={15} /> Same-Day Service*</li>
            </ul>
            <Wrench className="hs-repair-tools" size={64} strokeWidth={1.5} aria-hidden="true" />
            <Link to="/book-repair" className="hs-btn hs-btn-yellow">
              Book Repair <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* ── Trending ── */}
        <section className="hs-section">
          <SectionHead
            icon={<Flame size={24} className="hs-flame" aria-hidden="true" />}
            title="Trending Products"
            sub="Most loved products by our customers."
            to="/collection/all?tab=trending"
          />
          {renderCards(trending)}
        </section>

        {/* ── Refurbished banner ── */}
        <section className="hs-refurb">
          <div className="hs-refurb-copy">
            <div className="hs-refurb-title">
              <span className="hs-refurb-icon"><Recycle size={34} /></span>
              <div>
                <h2>Refurbished<br />Mobile Phones</h2>
                <p>Certified, tested and reliable phones at a lower price.</p>
              </div>
            </div>
            <ul className="hs-chips">
              <li><ShieldCheck size={15} /> 12-Month Warranty</li>
              <li><BadgeCheck size={15} /> Quality Tested</li>
              <li><Sparkles size={15} /> Like-New Condition</li>
            </ul>
          </div>
          <div className="hs-refurb-art" aria-hidden="true">
            <img src="/phones/ios-b.png" alt="" />
            <img src="/phones/ios-a.png" alt="" />
            <img src="/phones/gold.png" alt="" />
            <img src="/products/phone-10t.png" alt="" />
          </div>
          <div className="hs-refurb-offer">
            <h3>Save More with<br />Refurbished Phones</h3>
            <div className="hs-offer-bubble hs-offer-bubble-sm">
              <span>Up to</span>
              <strong>40% OFF</strong>
            </div>
            <Link
              to={categoryHref(resolveCategoryName('Refurbished Devices', headerCats))}
              className="hs-btn hs-btn-dark"
            >
              Shop Refurbished <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* ── Refurbished products ── */}
        {(loading || refurbished.length > 0) && (
          <section className="hs-section">
            <SectionHead
              icon={<Recycle size={24} className="hs-flame" aria-hidden="true" />}
              title="Certified Refurbished"
              pill="Like New"
              sub="Quality-tested phones with a 12-month warranty."
              to={categoryHref(resolveCategoryName('Refurbished Devices', headerCats))}
            />
            {renderCards(refurbished)}
          </section>
        )}

        {/* ── Testimonials ── */}
        <section className="hs-section">
          <div className="hs-head">
            <div>
              <h2><Quote size={26} className="hs-quote" fill="currentColor" aria-hidden="true" />What Our Customers Say</h2>
              <p>Real feedback from our happy customers.</p>
            </div>
          </div>
          <div className="hs-reviews">
            <button type="button" className="hs-review-nav" onClick={() => moveReviews(-1)} aria-label="Previous reviews">
              <ChevronLeft size={20} />
            </button>
            <div className="hs-review-track">
              {reviews.map((r) => (
                <figure key={r.name} className="hs-review">
                  <span className="hs-avatar" aria-hidden="true">
                    {r.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </span>
                  <div>
                    <figcaption>{r.name}</figcaption>
                    <div className="hs-stars" aria-label="5 out of 5 stars">
                      {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={15} fill="currentColor" />)}
                    </div>
                    <blockquote>“{r.quote}”</blockquote>
                  </div>
                </figure>
              ))}
            </div>
            <button type="button" className="hs-review-nav" onClick={() => moveReviews(1)} aria-label="Next reviews">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="hs-dots hs-dots-center">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.name}
                type="button"
                aria-label={`Show review ${i + 1}`}
                className={i === reviewStart ? 'is-on' : ''}
                onClick={() => setReviewStart(i)}
              />
            ))}
          </div>
        </section>

        {/* ── Benefits ── */}
        <ul className="hs-benefits">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Icon size={34} strokeWidth={1.6} aria-hidden="true" />
              <span><b>{title}</b>{text}</span>
            </li>
          ))}
        </ul>
      </main>

      <StoreFooter />
    </div>
  )
}

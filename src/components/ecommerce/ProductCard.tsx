import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  BatteryFull,
  Camera,
  Check,
  Cpu,
  Crown,
  Flame,
  HardDrive,
  Heart,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { addToCartWithAuth } from '../../utils/cartAuth'
import { useCutout } from '../../utils/removeBackground'
import './ProductCard.css'

/* ── Data ───────────────────────────────────────────────────────────── */

export type SpecIcon = 'cpu' | 'battery' | 'camera' | 'display' | 'storage' | 'spark'

export interface ProductSpec {
  icon: SpecIcon
  label: string
}

export interface ProductCardData {
  id: number
  name: string
  brand?: string
  image: string
  price: number
  mrp?: number
  rating?: number
  /** Units sold — shown next to the rating when there is no review count. */
  sold?: number
  /** Short tag after the rating, e.g. "256 GB" or "5G". */
  tag?: string
  /** CSS colours for the swatch dots. */
  swatches?: string[]
  /** Up to three highlights for the feature / spotlight layouts. */
  specs?: ProductSpec[]
  badge?: 'trending' | 'new' | 'bestseller'
  cart?: { variationId: number; storage?: string; ram?: string; color?: string }
}

/** Visual layouts from the Home design:
 *  standard  — light card, image on a lavender swoosh
 *  feature   — dark purple card with spec list and round cart button
 *  wide      — horizontal card, image left and details right
 *  spotlight — bestseller card with the product on a podium */
export type ProductCardVariant = 'standard' | 'feature' | 'wide' | 'spotlight'

interface ProductCardProps extends ProductCardData {
  variant?: ProductCardVariant
  /** Columns to span in the 12-column bento grid. */
  span?: number
  /** Alternates the standard card's button between violet and deep purple. */
  tone?: 'violet' | 'deep'
  order?: number
  wishlisted?: boolean
  onToggleWishlist?: (id: number) => void
}

/* ── Helpers ────────────────────────────────────────────────────────── */

const SPEC_ICONS: Record<SpecIcon, LucideIcon> = {
  cpu: Cpu,
  battery: BatteryFull,
  camera: Camera,
  display: Smartphone,
  storage: HardDrive,
  spark: Sparkles,
}

const SWATCH_MAP: [string, string][] = [
  ['starlight', '#efe6d6'],
  ['midnight', '#1f2436'],
  ['graphite', '#4a4a4f'],
  ['titanium', '#8e8a83'],
  ['black', '#1c1c1e'],
  ['silver', '#c9c9ce'],
  ['white', '#f4f4f4'],
  ['gold', '#d9b46a'],
  ['blue', '#3b6fd6'],
  ['purple', '#9b6bdf'],
  ['violet', '#9b6bdf'],
  ['lavender', '#c9a8f5'],
  ['green', '#4f8a5b'],
  ['mint', '#9fd8c0'],
  ['red', '#c8333f'],
  ['pink', '#f2a7c3'],
  ['grey', '#9a9aa0'],
  ['gray', '#9a9aa0'],
  ['orange', '#e8762d'],
  ['yellow', '#f2cf3a'],
  ['cream', '#efe4cf'],
  ['bronze', '#a8703f'],
]

/** Turn colour names ("Titanium Blue", "Phantom Black") into swatch colours. */
export function swatchesFor(names: string[]): string[] {
  const out: string[] = []
  for (const raw of names) {
    const name = raw.toLowerCase()
    const hit = SWATCH_MAP.find(([key]) => name.includes(key))
    if (hit && !out.includes(hit[1])) out.push(hit[1])
  }
  return out.slice(0, 4)
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n)

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ── Small pieces ───────────────────────────────────────────────────── */

function BrandLabel({ brand }: { brand: string }) {
  return <span className="pc-mono">{brand.trim()}</span>
}

function Rating({ rating, sold, tag }: { rating?: number; sold?: number; tag?: string }) {
  if (!rating && !tag) return null
  return (
    <p className="pc-rating">
      {rating ? (
        <>
          <Star className="pc-star" size={16} aria-hidden="true" />
          <b>{rating.toFixed(1)}</b>
          {sold ? <span className="pc-sold">({compact(sold)} sold)</span> : null}
        </>
      ) : null}
      {rating && tag ? <i className="pc-sep" aria-hidden="true" /> : null}
      {tag ? <span className="pc-tag">{tag}</span> : null}
    </p>
  )
}

function Swatches({ colors }: { colors?: string[] }) {
  if (!colors?.length) return null
  return (
    <span className="pc-swatches" aria-label={`${colors.length} colour options`}>
      {colors.map((c) => (
        <i key={c} style={{ background: c }} />
      ))}
    </span>
  )
}

function Badge({ kind }: { kind?: ProductCardData['badge'] }) {
  if (!kind) return null
  if (kind === 'bestseller')
    return (
      <span className="pc-badge pc-badge--best">
        <Crown size={15} aria-hidden="true" />
        Bestseller
      </span>
    )
  if (kind === 'trending')
    return (
      <span className="pc-badge pc-badge--trend">
        <Flame size={15} aria-hidden="true" />
        Trending
      </span>
    )
  return (
    <span className="pc-badge pc-badge--new">
      <Sparkles size={14} aria-hidden="true" />
      New
    </span>
  )
}

/* ── Card ───────────────────────────────────────────────────────────── */

export default function ProductCard({
  id,
  name,
  brand = '',
  image,
  price,
  mrp,
  rating,
  sold,
  tag,
  swatches,
  specs,
  badge,
  cart,
  variant = 'standard',
  span,
  tone = 'violet',
  order = 0,
  wishlisted,
  onToggleWishlist,
}: ProductCardProps) {
  const { show: showToast } = useToast()
  const ref = useRef<HTMLElement>(null)
  const [imgError, setImgError] = useState(false)
  const [cartState, setCartState] = useState<'idle' | 'busy' | 'done'>('idle')
  /* Every product photo has its plain background removed automatically. */
  const cutout = useCutout(image || undefined)

  /* Fade/rise in once the card scrolls into view. */
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window) || reduceMotion()) {
      el.classList.add('pc-in')
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('pc-in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0
  const href = `/product/${id}`

  const addToCart = async () => {
    if (cartState !== 'idle') return
    setCartState('busy')
    try {
      const added = await addToCartWithAuth({
        productId: id,
        variationId: cart?.variationId ?? 0,
        quantity: 1,
        name,
        brand,
        price,
        image,
        storage: cart?.storage ?? '',
        ram: cart?.ram ?? '',
        color: cart?.color ?? '',
      })
      if (!added) {
        setCartState('idle')
        return
      }
      showToast(`${name} added to cart`, 'success')
      setCartState('done')
      window.setTimeout(() => setCartState('idle'), 1800)
    } catch (err: any) {
      showToast(err?.message || 'Could not add to cart', 'error')
      setCartState('idle')
    }
  }

  const art =
    image && !imgError ? (
      <img
        src={cutout.src}
        alt={name}
        loading={order < 4 ? 'eager' : 'lazy'}
        onError={() => setImgError(true)}
        data-cut={cutout.cut ? 'true' : undefined}
      />
    ) : (
      <span className="material-symbols-outlined pc-ph" aria-hidden="true">
        smartphone
      </span>
    )

  const wish = onToggleWishlist ? (
    <button
      type="button"
      className={`pc-wish${wishlisted ? ' is-on' : ''}`}
      aria-label={wishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
      aria-pressed={!!wishlisted}
      onClick={() => onToggleWishlist(id)}
    >
      <Heart size={22} aria-hidden="true" />
    </button>
  ) : null

  const cartLabel = cartState === 'done' ? 'Added' : cartState === 'busy' ? 'Adding…' : 'Add to Cart'
  const CartIcon = cartState === 'done' ? Check : ShoppingCart

  const addButton = (extra = '') => (
    <button
      type="button"
      className={`pc-add ${extra}`.trim()}
      onClick={addToCart}
      disabled={cartState === 'busy'}
      data-state={cartState}
    >
      <CartIcon size={20} aria-hidden="true" />
      <span>{cartLabel}</span>
    </button>
  )

  const price_ = (
    <p className="pc-price">
      {price > 0 ? <b>{inr(price)}</b> : <b className="pc-price-na">View price</b>}
      {discount > 0 && <s>{inr(mrp!)}</s>}
    </p>
  )

  const off = discount > 0 ? <span className="pc-off">{discount}% OFF</span> : null

  const style = { '--i': order, ...(span ? { '--span': span } : {}) } as CSSProperties

  /* ── feature: dark purple ── */
  if (variant === 'feature') {
    return (
      <article ref={ref} className="pc pc--feature" style={style}>
        <header className="pc-top">
          <span className="pc-brand-word">{brand || 'Featured'}</span>
          {wish}
        </header>
        <div className="pc-feature-grid">
          {specs?.length ? (
            <ul className="pc-specs">
              {specs.slice(0, 3).map(({ icon, label }) => {
                const Icon = SPEC_ICONS[icon]
                return (
                  <li key={label}>
                    <span className="pc-spec-ic">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    {label}
                  </li>
                )
              })}
            </ul>
          ) : (
            <span />
          )}
          <Link to={href} className="pc-media" aria-label={`View ${name}`}>
            {art}
          </Link>
        </div>
        <div className="pc-body">
          <h3 className="pc-name">
            <Link to={href}>{name}</Link>
          </h3>
          <Rating rating={rating} sold={sold} />
          <div className="pc-feature-foot">
            {price_}
            {off}
            <button
              type="button"
              className="pc-round-cart"
              onClick={addToCart}
              disabled={cartState === 'busy'}
              aria-label={`Add ${name} to cart`}
              data-state={cartState}
            >
              <CartIcon size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    )
  }

  /* ── wide: horizontal ── */
  if (variant === 'wide') {
    return (
      <article ref={ref} className="pc pc--wide" style={style}>
        <Link to={href} className="pc-media" aria-label={`View ${name}`}>
          {brand && (
            <span className="pc-media-brand">
              <BrandLabel brand={brand} />
            </span>
          )}
          {art}
        </Link>
        <div className="pc-body">
          <div className="pc-wide-head">
            <h3 className="pc-name">
              <Link to={href}>{name}</Link>
            </h3>
            {wish}
          </div>
          <Rating rating={rating} sold={sold} />
          {price_}
          <div className="pc-wide-tags">
            {off}
            <Badge kind={badge} />
          </div>
          <Swatches colors={swatches} />
          <div className="pc-actions">
            <Link to={href} className="pc-ghost">
              View Details
            </Link>
            {addButton()}
          </div>
        </div>
      </article>
    )
  }

  /* ── spotlight: bestseller on a podium ── */
  if (variant === 'spotlight') {
    return (
      <article ref={ref} className="pc pc--spot" style={style}>
        <div className="pc-spot-grid">
          <div className="pc-body">
            <div className="pc-spot-top">
              <Badge kind={badge ?? 'bestseller'} />
            </div>
            <h3 className="pc-name">
              <Link to={href}>{name}</Link>
            </h3>
            <Rating rating={rating} sold={sold} tag={tag} />
            {price_}
            {off}
          </div>
          <Link to={href} className="pc-media" aria-label={`View ${name}`}>
            <span className="pc-podium" aria-hidden="true" />
            {art}
          </Link>
          <div className="pc-spot-wish">{wish}</div>
        </div>
        {specs?.length ? (
          <ul className="pc-spec-row">
            {specs.slice(0, 3).map(({ icon, label }) => {
              const Icon = SPEC_ICONS[icon]
              return (
                <li key={label}>
                  <Icon size={20} aria-hidden="true" />
                  <span>{label}</span>
                </li>
              )
            })}
          </ul>
        ) : null}
        {addButton('pc-add--glow')}
      </article>
    )
  }

  /* ── standard ── */
  return (
    <article ref={ref} className={`pc pc--standard pc--${tone}`} style={style}>
      <Link to={href} className="pc-media" aria-label={`View ${name}`}>
        {off && <span className="pc-media-off">{off}</span>}
        {art}
        {badge && (
          <span className="pc-media-badge">
            <Badge kind={badge} />
          </span>
        )}
      </Link>
      <div className="pc-body">
        <div className="pc-title-row">
          <h3 className="pc-name">
            <Link to={href}>{name}</Link>
          </h3>
          <Swatches colors={swatches} />
        </div>
        <Rating rating={rating} sold={sold} tag={tag} />
        {price_}
      </div>
    </article>
  )
}

/** Column span on the 12-column grid: every home section shows four
 *  same-size cards per row, whatever the number of products. */
export function cardSpan(_n: number): number {
  return 3
}

/** Card layouts for a list of `n` products on the 12-column bento grid:
 *  a row of four (standard · feature · standard · standard) then a row of two
 *  (wide · spotlight). Leftover cards are sized so every row is filled. */
export function cardLayout(n: number): { variant: ProductCardVariant; span: number }[] {
  const out: { variant: ProductCardVariant; span: number }[] = []
  let left = n
  while (left >= 6) {
    out.push(
      { variant: 'standard', span: 3 },
      { variant: 'feature', span: 3 },
      { variant: 'standard', span: 3 },
      { variant: 'standard', span: 3 },
      { variant: 'wide', span: 6 },
      { variant: 'spotlight', span: 6 },
    )
    left -= 6
  }
  if (left === 5 || left === 4) {
    for (const v of ['standard', 'feature', 'standard', 'standard'] as const) out.push({ variant: v, span: 3 })
    left -= 4
  }
  if (left === 3) {
    out.push(
      { variant: 'standard', span: 4 },
      { variant: 'feature', span: 4 },
      { variant: 'standard', span: 4 },
    )
  } else if (left === 2) {
    out.push({ variant: 'wide', span: 6 }, { variant: 'spotlight', span: 6 })
  } else if (left === 1) {
    out.push({ variant: 'standard', span: 4 })
  }
  return out
}

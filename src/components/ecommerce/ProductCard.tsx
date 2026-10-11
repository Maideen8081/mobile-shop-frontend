import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import './ProductCard.css'

export interface ProductCardData {
  id: number
  name: string
  image: string
  meta?: string
  price: number
  mrp?: number
  save?: number
  rating?: number
  /** chip label — omit to hide the chip (e.g. "Refurbished", "Trending", "New") */
  badge?: string
  badgeIcon?: 'check' | 'spark'
  /** condition pill — omit for brand-new items */
  grade?: string
  overlayTitle?: string
  checks?: string[]
  certTitle?: string
  certText?: string
  warranty?: string
  returns?: string
}

interface ProductCardProps extends ProductCardData {
  order?: number
  wishlisted?: boolean
  onToggleWishlist?: (id: number) => void
  /** image fit — `contain` (default) for product cut-outs, `cover` for lifestyle shots */
  fit?: 'contain' | 'cover'
}

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Ic({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg className={`pc-ic ${className ?? ''}`.trim()} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  )
}

const Tick = () => (
  <svg className="pc-tick" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
)

const CheckIcon = () => (
  <Ic>
    <path d="m5 12 5 5 9-10" />
  </Ic>
)

const SparkIcon = () => (
  <Ic>
    <path d="M12 3l1.9 4.9L18.8 9.8l-4.9 1.9L12 16.6l-1.9-4.9L5.2 9.8l4.9-1.9L12 3Z" />
  </Ic>
)

/** Self-contained product card shared by the Trending, New Arrivals and
 *  Refurbished sections. Handles its own scroll reveal, quick-view dialog and
 *  add-to-cart feedback; section visuals are opt-in via props. */
export default function ProductCard({
  id,
  name,
  image,
  meta,
  rating,
  badge,
  badgeIcon = 'check',
  grade,
  overlayTitle,
  checks,
  certTitle = 'Customer rating',
  certText = '12-month warranty',
  warranty = '12 mo',
  returns = '7 days',
  order = 0,
  wishlisted,
  onToggleWishlist,
  fit = 'contain',
}: ProductCardProps) {
  const { show: showToast } = useToast()
  const ref = useRef<HTMLElement>(null)
  const dlgRef = useRef<HTMLDialogElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)

  const [open, setOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const [imgError, setImgError] = useState(false)

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
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const openQV = () => {
    lastFocus.current = document.activeElement as HTMLElement
    setOpen(true)
  }
  const closeQV = () => {
    const dlg = dlgRef.current
    if (!dlg) return
    dlg.classList.remove('pc-show')
    const settle = () => {
      if (dlg.open) dlg.close()
      lastFocus.current?.focus?.()
    }
    if (reduceMotion()) settle()
    else setTimeout(settle, 260)
    setTimeout(() => setOpen(false), 320)
  }
  useEffect(() => {
    const dlg = dlgRef.current
    if (!open || !dlg || dlg.open) return
    dlg.showModal()
    requestAnimationFrame(() => dlg.classList.add('pc-show'))
    dlg.querySelector<HTMLElement>('.pc-qvx')?.focus()
  }, [open])

  const addToCart = () => {
    if (added) return
    setAdded(true)
    showToast(`${name} added to cart`, 'success')
    window.setTimeout(() => setAdded(false), 1700)
  }

  const ringPct = rating != null ? (rating / 5) * 100 : 0
  const showOverlay = Boolean(overlayTitle && checks?.length)
  const cardStyle = {
    '--i': order,
    '--fd': `${(-order * 1.3).toFixed(1)}s`,
    '--p': ringPct,
  } as CSSProperties

  const artwork = (
    <>
      {image && !imgError ? (
        <img
          src={image}
          alt={name}
          width={480}
          height={480}
          loading={order < 4 ? 'eager' : 'lazy'}
          fetchPriority={order < 4 ? 'high' : 'auto'}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="material-symbols-outlined pc-ph">inventory_2</span>
      )}
    </>
  )

  const viewProduct = (
    <Link className="btn pc-add" to={`/product/${id}`}>
      <Ic>
        <path d="M4 12h15" />
        <path d="M13 6l6 6-6 6" />
      </Ic>
      <span>View product</span>
    </Link>
  )

  return (
    <article className="pc" ref={ref} style={cardStyle}>
      <div className="pc-plate">
        {badge && (
          <span className="pc-chip">
            {badgeIcon === 'spark' ? <SparkIcon /> : <CheckIcon />}
            {badge}
          </span>
        )}
        <div className="pc-actions">
          <button className="pc-eye" type="button" aria-label={`Quick view ${name}`} onClick={openQV}>
            <Ic>
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </Ic>
          </button>
          {onToggleWishlist && (
            <button
              className={`pc-wish${wishlisted ? ' is-active' : ''}`}
              type="button"
              aria-label={wishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
              aria-pressed={wishlisted}
              onClick={() => onToggleWishlist(id)}
            >
              <Ic className={wishlisted ? 'pc-ic-fill' : undefined}>
                <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
              </Ic>
            </button>
          )}
        </div>
        <div className="pc-art" data-fit={fit}>
          <Link className="pc-art-link" to={`/product/${id}`} aria-label={`View ${name}`}>
            {artwork}
          </Link>
        </div>
        {grade && (
          <span className="pc-grade">
            <i aria-hidden="true" />
            {grade}
          </span>
        )}
        {showOverlay && (
          <div className="pc-ov">
            <h3>{overlayTitle}</h3>
            <ul>
              {checks!.slice(0, 5).map((t, k) => (
                <li key={t} style={{ '--k': k } as CSSProperties}>
                  <Tick />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="pc-body">
        <h3 className="pc-name">
          <Link to={`/product/${id}`}>{name}</Link>
        </h3>
        {meta && <p className="pc-meta">{meta}</p>}
        <div className="pc-tear" aria-hidden="true" />
        {rating != null && rating > 0 && (
          <div className="pc-cert">
            <div className="pc-ring">
              <svg viewBox="0 0 44 44" aria-hidden="true">
                <circle className="pc-tr" cx="22" cy="22" r="18" />
                <circle className="pc-fg" cx="22" cy="22" r="18" />
              </svg>
              <span>{rating.toFixed(1)}</span>
            </div>
            <p>
              <b>{certTitle}</b>
              {certText}
            </p>
          </div>
        )}
        {viewProduct}
      </div>

      <dialog ref={dlgRef} aria-label={`${name} details`} onCancel={(e) => { e.preventDefault(); closeQV() }}>
        {open && (
          <div className="pc-qv">
            <button className="pc-qvx" type="button" aria-label="Close" onClick={closeQV}>
              <Ic>
                <path d="M6 6l12 12M18 6 6 18" />
              </Ic>
            </button>
            <div className="pc-qvplate">{artwork}</div>
            <div className="pc-qvinfo">
              <div className="pc-qvtags">
                {badge && (
                  <span className="pc-chip">
                    {badgeIcon === 'spark' ? <SparkIcon /> : <CheckIcon />}
                    {badge}
                  </span>
                )}
                {grade && (
                  <span className="pc-grade">
                    <i aria-hidden="true" />
                    {grade}
                  </span>
                )}
              </div>
              <h3>{name}</h3>
              {meta && <p className="pc-meta">{meta}</p>}
              {rating != null && rating > 0 && (
                <div className="pc-specs">
                  <div>
                    <b>{rating.toFixed(1)}</b>
                    <span>Customer rating</span>
                  </div>
                  <div>
                    <b>{warranty}</b>
                    <span>Warranty</span>
                  </div>
                  <div>
                    <b>{returns}</b>
                    <span>Returns</span>
                  </div>
                </div>
              )}
              {overlayTitle && checks?.length ? (
                <>
                  <h4>{overlayTitle}</h4>
                  <ul className="pc-checks">
                    {checks.map((t, k) => (
                      <li key={t} style={{ '--k': k } as CSSProperties}>
                        <Tick />
                        {t}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              <div className="pc-qvactions">
                <button
                  className={`btn btn-secondary btn-md pc-add${added ? ' is-added' : ''}`}
                  type="button"
                  onClick={addToCart}
                >
                  {added ? (
                    <>
                      <CheckIcon />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Ic>
                        <path d="M6 7h12l1 13H5L6 7Z" />
                        <path d="M9 7a3 3 0 0 1 6 0" />
                      </Ic>
                      <span>Add to cart</span>
                    </>
                  )}
                </button>
                <Link className="pc-ghost" to={`/product/${id}`}>
                  View details
                </Link>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </article>
  )
}

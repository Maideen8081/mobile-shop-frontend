import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, Clock, Gift, Loader2, RotateCcw, ShieldCheck, Sparkles, Tag, Truck, Wallet, X } from 'lucide-react'
import { offerService, type ExitOffer } from '../../services/offerService'
import { formatINR, validateCoupon, type CheckoutCoupon } from '../../utils/checkout'
import './ExitIntentOffer.css'

// Shown when the shopper does anything on the payment page other than placing
// the order: ad 1 on the first such click, ad 2 on the next one after closing it.
// Never more than this per visit.
const MAX_SHOWS = 2
const ARM_DELAY_MS = 3000

// Clicks on these are part of the popup or finish the order, so they never open it.
const IGNORE_SELECTOR = '[data-exit-offer], [data-place-order]'
// Clicks on these do something, so we hold the action back while the ad is up.
const ACTION_SELECTOR = 'a[href], button, input, select, textarea, label, summary, [role="button"], [role="radio"], [role="checkbox"], [role="tab"], [role="link"], [role="menuitem"]'

export interface ExitOfferCartItem {
  productId: number
  name: string
  price: number
  mrp?: number
  image?: string
  quantity: number
}

const EMPTY_OFFER: ExitOffer = { coupon: null, unlock_coupon: null, cart_savings: [], deals: [] }

interface Props {
  productIds: number[]
  subtotal: number
  /** The shopper's cart; shown as a reminder even when the server has no offer. */
  cartItems: ExitOfferCartItem[]
  /** False while the cart is loading or an order is being placed. */
  enabled: boolean
  appliedCoupon: CheckoutCoupon | null
  onApplyCoupon: (coupon: CheckoutCoupon) => void
}

function usableCoupon(offer: ExitOffer | null, applied: CheckoutCoupon | null) {
  const c = offer?.coupon
  if (!c) return null
  if (applied && (applied.code.toLowerCase() === c.code.toLowerCase() || applied.discount >= Number(c.discount_amount))) return null
  return c
}

function hasContent(offer: ExitOffer | null, applied: CheckoutCoupon | null, cartCount: number) {
  if (!offer) return false
  return Boolean(usableCoupon(offer, applied) || offer.unlock_coupon || offer.cart_savings.length || offer.deals.length || cartCount > 0)
}

const PERKS = [
  { icon: Truck, title: 'Free delivery', text: 'Arrives in 3–5 days' },
  { icon: Wallet, title: 'Cash on Delivery', text: 'Pay when it arrives' },
  { icon: RotateCcw, title: '7-day returns', text: 'No questions asked' },
  { icon: ShieldCheck, title: 'Secure checkout', text: 'Details encrypted' },
]

export default function ExitIntentOffer({ productIds, subtotal, cartItems, enabled, appliedCoupon, onApplyCoupon }: Props) {
  const navigate = useNavigate()
  const [offer, setOffer] = useState<ExitOffer | null>(null)
  const [open, setOpen] = useState(false)
  // Which ad is showing: 1 = first offer, 2 = "last chance" follow-up.
  const [variant, setVariant] = useState<1 | 2>(1)
  const shownCount = useRef(0)
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState('')
  const pendingLeave = useRef<(() => void) | null>(null)
  const [canLeave, setCanLeave] = useState(false)
  const guardActive = useRef(false)
  const armed = useRef(false)

  const cartCount = cartItems.length
  const latest = useRef({ enabled, offer, appliedCoupon, cartCount, open })
  useLayoutEffect(() => { latest.current = { enabled, offer, appliedCoupon, cartCount, open } })

  const idsKey = productIds.join(',')
  useEffect(() => {
    if (!enabled || !idsKey) return
    let cancelled = false
    offerService
      .getCheckoutExitOffer(idsKey.split(',').map(Number), subtotal)
      .then((o) => { if (!cancelled) setOffer(o) })
      // No server offer (or an older backend): still remind them of their cart.
      .catch(() => { if (!cancelled) setOffer(EMPTY_OFFER) })
    return () => { cancelled = true }
  }, [enabled, idsKey, subtotal])

  const ready = enabled && hasContent(offer, appliedCoupon, cartCount)
  // Once the back-button guard entry exists it must stay handled until we leave the page.
  const [guardOn, setGuardOn] = useState(false)
  if (ready && !guardOn) setGuardOn(true)

  useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(() => { armed.current = true }, ARM_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [ready])

  /** Opens the offer if it's still unseen; returns false when the caller should just carry on leaving. */
  const trigger = useCallback((leave: (() => void) | null) => {
    const { enabled, offer, appliedCoupon, cartCount, open } = latest.current
    if (!enabled || open || shownCount.current >= MAX_SHOWS || !hasContent(offer, appliedCoupon, cartCount)) return false
    shownCount.current += 1
    setVariant(shownCount.current === 1 ? 1 : 2)
    pendingLeave.current = leave
    setCanLeave(Boolean(leave))
    setApplyError('')
    setOpen(true)
    return true
  }, [])

  // Any click on the page except "Place order": links, buttons, payment options, empty space.
  // Runs in the capture phase so it sees the click before the page's own handlers.
  useEffect(() => {
    if (!ready) return
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const el = e.target as Element | null
      if (!el?.closest || el.closest(IGNORE_SELECTOR)) return

      let leave: (() => void) | null = null
      const a = el.closest('a[href]') as HTMLAnchorElement | null
      if (a) {
        if (a.target === '_blank' || a.hasAttribute('download')) return
        const url = new URL(a.href, window.location.href)
        if (url.origin !== window.location.origin) return
        const to = url.pathname + url.search + url.hash
        if (url.pathname !== window.location.pathname) {
          leave = () => {
            const replace = guardActive.current
            guardActive.current = false
            navigate(to, { replace })
          }
        }
      }

      if (!trigger(leave)) return
      // Hold back whatever the click would have done; the shopper can click again after closing.
      if (el.closest(ACTION_SELECTOR)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [ready, navigate, trigger])

  // Desktop: pointer heads for the tab bar / close button.
  useEffect(() => {
    if (!ready || !window.matchMedia('(pointer: fine)').matches) return
    const onOut = (e: MouseEvent) => {
      if (!armed.current || e.relatedTarget || e.clientY > 0) return
      trigger(null)
    }
    document.addEventListener('mouseout', onOut)
    return () => document.removeEventListener('mouseout', onOut)
  }, [ready, trigger])

  // Browser / phone back button: an extra history entry lets us catch the first "back".
  useEffect(() => {
    if (!guardOn) return
    if (!window.history.state?.exitOfferGuard) {
      window.history.pushState({ ...window.history.state, exitOfferGuard: true }, '')
    }
    guardActive.current = true
    const onPop = () => {
      if (!guardActive.current) return
      guardActive.current = false
      if (!trigger(() => window.history.back())) window.history.back()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [guardOn, trigger])

  const stay = useCallback(() => {
    pendingLeave.current = null
    setOpen(false)
    // The back-button guard is used up once it fires; set it again while an ad is still left.
    if (guardOn && !guardActive.current && shownCount.current < MAX_SHOWS) {
      window.history.pushState({ ...window.history.state, exitOfferGuard: true }, '')
      guardActive.current = true
    }
  }, [guardOn])

  const leave = () => {
    const go = pendingLeave.current
    pendingLeave.current = null
    setOpen(false)
    go?.()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') stay() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, stay])

  const coupon = usableCoupon(offer, appliedCoupon)

  const applyCoupon = async () => {
    if (!coupon) return
    setApplying(true)
    setApplyError('')
    try {
      const validated = await validateCoupon(coupon.code, subtotal)
      onApplyCoupon(validated)
      stay()
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Couldn’t apply that code')
    } finally {
      setApplying(false)
    }
  }

  const openDeal = (productId: number, variantId: number) => {
    pendingLeave.current = null
    setOpen(false)
    const replace = guardActive.current
    guardActive.current = false
    navigate(`/product/${productId}/${variantId}`, { replace })
  }

  if (!open || !offer) return null

  const localSaving = cartItems
    .filter((i) => i.mrp && i.mrp > i.price)
    .map((i) => ({ name: i.name, percent_off: Math.round(((i.mrp! - i.price) / i.mrp!) * 100) }))
    .sort((a, b) => b.percent_off - a.percent_off)[0]
  const saving = offer.cart_savings[0] ?? localSaving
  const hasOffers = Boolean(coupon || offer.unlock_coupon || offer.deals.length)
  const unlock = offer.unlock_coupon
  const second = variant === 2
  // The follow-up ad leads with the biggest discounts so it doesn't repeat the first one.
  const deals = second
    ? [...offer.deals].sort((a, b) => b.percent_off - a.percent_off).slice(0, 4)
    : offer.deals
  const HeroIcon = second ? Clock : Gift

  return (
    <div className="eo-overlay" data-exit-offer onClick={stay}>
      <div className={`eo-card${second ? ' eo-card--second' : ''}`} role="dialog" aria-modal="true" aria-labelledby="eo-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="eo-close" onClick={stay} aria-label="Close offer"><X size={18} /></button>

        <div className="eo-hero">
          <span className="eo-hero-icon"><HeroIcon size={26} /></span>
          {second ? (
            <>
              <h2 id="eo-title">Still thinking it over?</h2>
              <p>Your cart is saved and ready — here’s why shoppers order today.</p>
            </>
          ) : (
            <>
              <h2 id="eo-title">Wait — your order is almost done!</h2>
              <p>{coupon ? 'Here’s an extra discount to finish checking out.' : hasOffers ? 'Before you go, have a look at these offers.' : 'Your cart is saved — finish your order in one tap.'}</p>
            </>
          )}
        </div>

        <div className="eo-body">
          {coupon && (
            <div className="eo-coupon">
              <div className="eo-coupon-amount">
                <span>Extra</span>
                <strong>{formatINR(Number(coupon.discount_amount))} OFF</strong>
                <small>
                  {coupon.discount_type === 'percentage' ? `${Number(coupon.discount_value)}% off your order` : 'Flat discount'}
                </small>
              </div>
              <div className="eo-coupon-code">
                <span>Use code</span>
                <code>{coupon.code}</code>
              </div>
            </div>
          )}

          {!coupon && unlock && (
            <div className="eo-unlock">
              <Tag size={18} />
              <p>
                Add <strong>{formatINR(Number(unlock.amount_needed))}</strong> more to unlock{' '}
                <strong>
                  {unlock.discount_type === 'percentage' ? `${Number(unlock.discount_value)}% off` : `${formatINR(Number(unlock.discount_value))} off`}
                </strong>{' '}
                with code <code>{unlock.code}</code>
              </p>
            </div>
          )}

          {cartItems.length > 0 && (
            <div className="eo-cart">
              <div className="eo-cart-thumbs">
                {cartItems.slice(0, 3).map((it) => (
                  <span key={it.productId} className="eo-cart-thumb">
                    {it.image ? <img src={it.image} alt="" loading="lazy" /> : <span aria-hidden="true">📦</span>}
                  </span>
                ))}
              </div>
              <div className="eo-cart-text">
                <strong>
                  {cartItems.length === 1 ? cartItems[0].name : `${cartItems.length} items are waiting in your cart`}
                </strong>
                <span>
                  {formatINR(subtotal)} · free delivery and 7-day returns
                </span>
              </div>
            </div>
          )}

          {saving && !second && (
            <p className="eo-saving">
              <Sparkles size={15} />
              <span>You’re already saving <strong>{saving.percent_off}%</strong> on {saving.name} — prices like this don’t last.</span>
            </p>
          )}

          {second && (
            <ul className="eo-perks">
              {PERKS.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <Icon size={18} />
                  <span><strong>{title}</strong>{text}</span>
                </li>
              ))}
            </ul>
          )}

          {deals.length > 0 && (
            <div className="eo-deals">
              <h3>{second ? 'Biggest discounts right now' : 'Deals you might like'}</h3>
              <div className="eo-deal-row">
                {deals.map((d) => (
                  <button key={d.variant_id} type="button" className="eo-deal" onClick={() => openDeal(d.product_id, d.variant_id)}>
                    <span className="eo-deal-badge">-{d.percent_off}%</span>
                    <span className="eo-deal-img">
                      {d.image ? <img src={d.image} alt="" loading="lazy" /> : <span aria-hidden="true">📦</span>}
                    </span>
                    <span className="eo-deal-name">{d.name}</span>
                    <span className="eo-deal-price">
                      <strong>{formatINR(Number(d.discount_price))}</strong>
                      <s>{formatINR(Number(d.price))}</s>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {applyError && <p className="eo-error" role="alert">{applyError}</p>}
        </div>

        <div className="eo-actions">
          {coupon ? (
            <button type="button" className="eo-primary" onClick={applyCoupon} disabled={applying} autoFocus>
              {applying ? <><Loader2 size={16} className="eo-spin" /> Applying…</> : `Apply ${coupon.code} & complete order`}
            </button>
          ) : (
            <button type="button" className="eo-primary" onClick={stay} autoFocus>
              {second ? <><BadgeCheck size={16} /> Yes, place my order</> : 'Complete my order'}
            </button>
          )}
          {canLeave ? (
            <button type="button" className="eo-secondary" onClick={leave}>No thanks, leave checkout</button>
          ) : (
            <button type="button" className="eo-secondary" onClick={stay}>Maybe later</button>
          )}
        </div>
      </div>
    </div>
  )
}

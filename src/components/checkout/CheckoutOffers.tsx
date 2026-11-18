import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Check, ChevronDown, Tag } from 'lucide-react'
import { offerService, type ExitOfferCoupon } from '../../services/offerService'
import { formatINR, validateCoupon, type CheckoutCoupon } from '../../utils/checkout'
import './CheckoutOffers.css'

interface Props {
  productIds: number[]
  subtotal: number
  disabled: boolean
  appliedCoupon: CheckoutCoupon | null
  onChange: (coupon: CheckoutCoupon | null) => void
}

export default function CheckoutOffers({ productIds, subtotal, disabled, appliedCoupon, onChange }: Props) {
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const [lookup, setLookup] = useState<{ key: string; coupon: ExitOfferCoupon | null; failed?: boolean } | null>(null)
  const attempt = useRef(0)
  const ids = productIds.join(',')
  const key = `${ids}:${subtotal}`

  useEffect(() => {
    if (!open || !ids || lookup?.key === key) return
    let active = true
    offerService.getCheckoutExitOffer(ids.split(',').map(Number), subtotal)
      .then((offer) => { if (active) setLookup({ key, coupon: offer?.coupon ?? null }) })
      .catch(() => { if (active) setLookup({ key, coupon: null, failed: true }) })
    return () => { active = false }
  }, [open, ids, subtotal, key, lookup?.key])

  useEffect(() => {
    return () => { attempt.current += 1 }
  }, [key, disabled])

  const current = lookup?.key === key ? lookup : null
  const offer = current?.coupon
  const suggested = offer && Number(offer.discount_amount) > (appliedCoupon?.discount ?? 0)
    && offer.code.toLowerCase() !== appliedCoupon?.code.toLowerCase() ? offer : null

  async function apply(rawCode: string) {
    const value = rawCode.trim()
    if (!value || applying || disabled) return
    const request = ++attempt.current
    setApplying(true)
    setError('')
    try {
      const result = await validateCoupon(value, subtotal)
      if (attempt.current !== request) return
      onChange(result)
      setCode('')
    } catch (err) {
      if (attempt.current === request) {
        setError(err instanceof Error ? err.message : 'Couldn’t apply that code. Try again.')
      }
    } finally {
      setApplying(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void apply(code)
  }

  return (
    <section className="checkout-offers" aria-label="Checkout offers">
      <button type="button" className="checkout-offers-toggle" aria-expanded={open} aria-controls={panelId} disabled={disabled} onClick={() => setOpen((value) => !value)}>
        <span className="checkout-offers-icon"><Tag size={18} aria-hidden="true" /></span>
        <span className="checkout-offers-heading">
          <strong>Offers &amp; promo codes</strong>
          <span>{appliedCoupon ? `${formatINR(appliedCoupon.discount)} saved with ${appliedCoupon.code}` : 'Check for a coupon or enter your code'}</span>
        </span>
        <ChevronDown className="checkout-offers-chevron" size={18} aria-hidden="true" />
      </button>

      <div id={panelId} className="checkout-offers-content" hidden={!open}>
        {appliedCoupon && (
          <div className="checkout-offers-applied">
            <span role="status"><Check size={16} aria-hidden="true" /> {appliedCoupon.code} applied</span>
            <button type="button" disabled={disabled || applying} onClick={() => { onChange(null); setError('') }}>Remove</button>
          </div>
        )}
        {!current && ids && <p className="checkout-offers-note" role="status">Checking for available offers…</p>}
        {suggested && (
          <div className="checkout-offers-suggestion">
            <div><strong>Save {formatINR(Number(suggested.discount_amount))}</strong><span>{suggested.code}</span></div>
            <button type="button" disabled={disabled || applying} aria-label={`Apply ${suggested.code}`} onClick={() => void apply(suggested.code)}>Apply offer</button>
          </div>
        )}
        {current?.failed && <p className="checkout-offers-note">Offers are unavailable right now. You can still enter a code.</p>}
        {current && !current.failed && !suggested && !appliedCoupon && <p className="checkout-offers-note">No automatic offer is available for this cart.</p>}

        <form className="checkout-offers-form" onSubmit={submit}>
          <label htmlFor={`${panelId}-code`}>Promo code</label>
          <div>
            <input id={`${panelId}-code`} autoComplete="off" spellCheck={false} autoCapitalize="characters" placeholder="Enter code" value={code} disabled={disabled || applying} onChange={(event) => { setCode(event.target.value); setError('') }} />
            <button type="submit" disabled={disabled || applying || !code.trim()}>Apply code</button>
          </div>
        </form>
        {applying && <p className="checkout-offers-note" role="status">Checking your code…</p>}
        {error && <p className="checkout-offers-error" role="alert">{error}</p>}
      </div>
    </section>
  )
}

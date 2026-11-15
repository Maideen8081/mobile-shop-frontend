import { useState, useRef, useEffect, useCallback } from 'react'
import { tradeInUpTo } from '../config/business'
import { CONDITIONS, OTHER_MODEL, STORAGE_OPTIONS, TRADE_IN_BRANDS, TRADE_IN_MODELS, modelsFor, quoteTradeIn, valueRange } from '../data/tradeInPrices'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Calculator, Check, CheckCircle2, ChevronLeft, ChevronRight, Info, Leaf,
  Loader2, PlayCircle, ReceiptIndianRupee, RefreshCw, Smartphone, Sparkles, Truck, Wallet, Zap,
} from 'lucide-react'
import { useIsMobile } from '../components/mobile/helpers'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import MobileTradeIn from '../components/mobile/MobileTradeIn'
import { tradeInService, type TradeInSubmission } from '../services/tradeInService'
import { apiErrorMessage } from '../utils/checkout'
import './TradeInPage.css'

const brands = [...TRADE_IN_BRANDS]

const features = [
  { icon: Zap, title: 'Instant Quote', desc: 'Get a fair value in seconds' },
  { icon: Truck, title: 'Free Pickup', desc: 'From your doorstep' },
  { icon: ReceiptIndianRupee, title: 'Quick Payment', desc: 'After device inspection' },
  { icon: Leaf, title: 'Eco-Friendly', desc: 'Responsible device recycling' },
]

const steps = [
  { icon: Smartphone, title: 'Select Device', desc: 'Choose your device brand and model', tone: 'lav' },
  { icon: Calculator, title: 'Get a Quote', desc: 'See the best exchange value instantly', tone: 'lav' },
  { icon: Truck, title: 'Free Pickup', desc: 'We collect your device from your location', tone: 'peach' },
  { icon: Wallet, title: 'Get Paid', desc: 'Receive payment or store credit quickly', tone: 'lav' },
]

const deviceConditions = CONDITIONS
const storageOptions = STORAGE_OPTIONS

type PhoneLook = { body: string; screen: string; cams: 'tri' | 'column' | 'bar' | 'round' }

const POPULAR: { device: string; brand: string; look: PhoneLook }[] = [
  { device: 'iPhone 16 Pro Max', brand: 'Apple', look: { body: '#3b3b40', screen: 'linear-gradient(160deg,#1c1c22,#c2642f 55%,#2a1a14)', cams: 'tri' } },
  { device: 'iPhone 15 Pro Max', brand: 'Apple', look: { body: '#d9cdb8', screen: 'linear-gradient(160deg,#20201f,#5b4a36 60%,#141414)', cams: 'tri' } },
  { device: 'iPhone 14 Pro Max', brand: 'Apple', look: { body: '#4a4553', screen: 'linear-gradient(160deg,#160c2c,#a32bd6 50%,#ff3c8a 70%,#120a20)', cams: 'tri' } },
  { device: 'Galaxy S25 Ultra', brand: 'Samsung', look: { body: '#7c8088', screen: 'linear-gradient(160deg,#9fb4d8,#5d79b8 55%,#e7ecf5)', cams: 'column' } },
  { device: 'Galaxy S24 Ultra', brand: 'Samsung', look: { body: '#5b5e66', screen: 'linear-gradient(160deg,#2b2140,#7e5bd1 55%,#c9b3ff)', cams: 'column' } },
  { device: 'Pixel 10 Pro', brand: 'Google', look: { body: '#e7e2d8', screen: 'linear-gradient(160deg,#21362f,#5fae8c 55%,#e9f3ec)', cams: 'bar' } },
  { device: 'OnePlus 13', brand: 'OnePlus', look: { body: '#1f2a3a', screen: 'linear-gradient(160deg,#0f1b2b,#e2463b 55%,#2a0d0d)', cams: 'round' } },
  { device: 'Xiaomi 15 Ultra', brand: 'Xiaomi', look: { body: '#2b2b2b', screen: 'linear-gradient(160deg,#ff7a1a,#ffb347 50%,#3a1a05)', cams: 'round' } },
  { device: 'Find X8 Pro', brand: 'Oppo', look: { body: '#d8d4e6', screen: 'linear-gradient(160deg,#4b2c86,#c08cff 55%,#f2e9ff)', cams: 'round' } },
]

// Ranges come from the same price table the quote uses, so they always agree.
const popularValues = POPULAR.map((p) => {
  const model = TRADE_IN_MODELS.find((x) => x.brand === p.brand && x.model === p.device)
  return { ...p, value: model ? valueRange(model) : '' }
})

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

/** Drawn product shot: phone back with cameras, front screen peeking beside it. */
function PhoneThumb({ look }: { look: PhoneLook }) {
  return (
    <span className="ti-thumb" aria-hidden="true">
      <span className="ti-thumb-back" style={{ background: look.body }}>
        <span className={`ti-cams ti-cams--${look.cams}`}><i /><i /><i /></span>
      </span>
      <span className="ti-thumb-front" style={{ background: look.screen }} />
    </span>
  )
}

export default function TradeInPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileTradeIn /> : <DesktopTradeIn />
}

function DesktopTradeIn() {
  const navigate = useNavigate()
  const [filterBrand, setFilterBrand] = useState('')
  const [formBrand, setFormBrand] = useState('')
  const [formModel, setFormModel] = useState('')
  const [formCondition, setFormCondition] = useState('')
  const [formStorage, setFormStorage] = useState('')
  const [formName, setFormName] = useState('')
  const [formMobile, setFormMobile] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedTrade, setSubmittedTrade] = useState<TradeInSubmission | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const formRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const [page, setPage] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  const analysis = quoteTradeIn(formBrand, formModel, formCondition, formStorage)
  const shownValues = popularValues.filter((v) => !filterBrand || v.brand === filterBrand)

  const clearError = (key: string) => setFormErrors((p) => (p[key] ? { ...p, [key]: '' } : p))
  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Carousel paging follows the track's scroll position.
  const syncPages = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const pages = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth - 0.05))
    setPageCount(pages)
    setPage(Math.min(pages - 1, Math.round(el.scrollLeft / el.clientWidth)))
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    el.scrollLeft = 0
    syncPages()
    const ro = new ResizeObserver(syncPages)
    ro.observe(el)
    return () => ro.disconnect()
  }, [filterBrand, syncPages])

  const scrollPage = (dir: number) => {
    const el = trackRef.current
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  }
  const goToPage = (i: number) => {
    const el = trackRef.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  const validateForm = () => {
    const e: Record<string, string> = {}
    if (!formBrand) e.formBrand = 'Select your device brand'
    if (!formModel.trim()) e.formModel = 'Model is required'
    if (!formCondition) e.formCondition = 'Select device condition'
    if (!formName.trim()) e.formName = 'Name is required'
    else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(formName.trim().replace(/\s+/g, ' '))) e.formName = 'Use letters only (spaces, dots, apostrophes and hyphens are fine)'
    if (!/^\d{10}$/.test(formMobile.replace(/\D/g, ''))) e.formMobile = 'Enter a valid 10-digit number'
    if (formEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) e.formEmail = 'Invalid email'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleFormSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      const trade = await tradeInService.create({
        customer_name: formName.trim(),
        customer_mobile: formMobile.trim(),
        customer_email: formEmail.trim() || undefined,
        device_brand: formBrand,
        device_model: formModel.trim(),
        device_storage: formStorage || undefined,
        device_condition: formCondition,
        estimated_value: analysis?.finalValue || 0,
      })
      setSubmittedTrade(trade)
      setTimeout(scrollToForm, 50)
    } catch (err) {
      // Show the backend's reason (e.g. a field validation error) instead of a generic message.
      setFormErrors({ submit: apiErrorMessage(err, 'Failed to submit. Please try again.') })
    }
    setSubmitting(false)
  }

  const resetForm = () => {
    setSubmittedTrade(null)
    setFormBrand(''); setFormModel(''); setFormCondition(''); setFormStorage('')
    setFormErrors({})
  }

  const startFromPopular = (brand: string, device: string) => {
    setFormBrand(brand)
    setFormModel(device)
    clearError('formBrand'); clearError('formModel')
    scrollToForm()
  }

  return (
    <div className="ti-page">
      <SiteTopNav />
      <main className="ti-wrap">
        {/* Hero */}
        <section className="ti-hero">
          <div className="ti-hero-main">
            <div className="ti-hero-text">
              <span className="ti-tag"><RefreshCw aria-hidden="true" /> Trade-In Program</span>
              <h1>Upgrade Easily with <span>PhoneFix <em>Trade-In</em></span></h1>
              <p>Exchange your old device for instant value and save more on your next purchase.</p>
              <div className="ti-hero-actions">
                <button type="button" className="ti-btn ti-btn--sun" onClick={scrollToForm}>Get Instant Quote <ArrowRight aria-hidden="true" /></button>
                <a href="#ti-how" className="ti-btn ti-btn--outline"><PlayCircle aria-hidden="true" /> How It Works</a>
              </div>
            </div>

            <div className="ti-hero-art" aria-hidden="true">
              <span className="ti-art-swoosh" />
              <span className="ti-art-phone ti-art-phone--new"><i /><i /><i /></span>
              <span className="ti-art-phone ti-art-phone--old"><span className="ti-crack" /></span>
              <span className="ti-art-swap"><RefreshCw /></span>
              <span className="ti-art-card">
                <Sparkles aria-hidden="true" />Upgrade &amp; Save
                <b>Up to {tradeInUpTo()}</b>
              </span>
            </div>
          </div>

          <ul className="ti-features">
            {features.map(({ icon: Icon, title, desc }) => (
              <li key={title}>
                <span><Icon aria-hidden="true" /></span>
                <div><b>{title}</b><small>{desc}</small></div>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section className="ti-how" id="ti-how">
          <div className="ti-how-head">
            <h2>How Trade-In Works</h2>
            <p>Just 4 simple steps to exchange your old device.</p>
          </div>
          <ol className="ti-steps">
            {steps.map(({ icon: Icon, title, desc, tone }, i) => (
              <li key={title}>
                <span className={`ti-step-icon is-${tone}`}><Icon aria-hidden="true" /></span>
                <div>
                  <h3>{i + 1}. {title}</h3>
                  <p>{desc}</p>
                </div>
                {i < steps.length - 1 && <ChevronRight className="ti-step-arrow" aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </section>

        {/* Popular values + CTA */}
        <section className="ti-values">
          <div className="ti-card ti-popular">
            <h2>Popular Trade-In Values</h2>
            <div className="ti-filter" role="tablist" aria-label="Filter by brand">
              <button type="button" role="tab" aria-selected={!filterBrand} className={!filterBrand ? 'is-active' : ''} onClick={() => setFilterBrand('')}>All</button>
              {brands.map((b) => (
                <button key={b} type="button" role="tab" aria-selected={filterBrand === b} className={filterBrand === b ? 'is-active' : ''} onClick={() => setFilterBrand(b)}>{b}</button>
              ))}
            </div>

            <div className="ti-carousel">
              <button type="button" className="ti-nav" aria-label="Previous devices" onClick={() => scrollPage(-1)} disabled={page === 0}><ChevronLeft aria-hidden="true" /></button>
              <ul className="ti-track" ref={trackRef} onScroll={syncPages}>
                {shownValues.map((v) => (
                  <li key={v.device}>
                    <button type="button" className="ti-device" onClick={() => startFromPopular(v.brand, v.device)} aria-label={`Get a quote for ${v.device}, ${v.value}`}>
                      <PhoneThumb look={v.look} />
                      <b>{v.device}</b>
                      <span>{v.value}</span>
                      <small>Get quote <ArrowRight aria-hidden="true" /></small>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="ti-nav" aria-label="Next devices" onClick={() => scrollPage(1)} disabled={page >= pageCount - 1}><ChevronRight aria-hidden="true" /></button>
            </div>

            {pageCount > 1 && (
              <div className="ti-dots">
                {Array.from({ length: pageCount }, (_, i) => (
                  <button key={i} type="button" className={i === page ? 'is-active' : ''} aria-label={`Show page ${i + 1}`} aria-current={i === page} onClick={() => goToPage(i)} />
                ))}
              </div>
            )}
          </div>

          <div className="ti-cta">
            <div>
              <h2>Ready to Trade-In?</h2>
              <p>Check your device value and upgrade to a new one today.</p>
              <button type="button" className="ti-btn ti-btn--sun" onClick={scrollToForm}>Start Trade-In <ArrowRight aria-hidden="true" /></button>
            </div>
            <span className="ti-cta-art" aria-hidden="true">
              <span className="ti-cta-phone"><RefreshCw /></span>
              <span className="ti-cta-base" />
            </span>
          </div>
        </section>

        {/* Quote form + value */}
        <section className="ti-quote" ref={formRef} id="ti-quote">
          {submittedTrade ? (
            <div className="ti-card ti-success">
              <span className="ti-success-icon"><CheckCircle2 aria-hidden="true" /></span>
              <h2>Trade-In Submitted!</h2>
              <p>We’ll review your device details and call you within 24 hours with a final quote.</p>
              <dl>
                <div><dt>Trade ID</dt><dd className="is-accent">{submittedTrade.tradeId}</dd></div>
                <div><dt>Device</dt><dd>{submittedTrade.deviceBrand} {submittedTrade.deviceModel}</dd></div>
                <div><dt>Estimated Value</dt><dd className="is-accent">{inr(submittedTrade.estimatedValue)}</dd></div>
                <div><dt>Status</dt><dd><span className="ti-pending">Pending Review</span></dd></div>
              </dl>
              <div className="ti-success-actions">
                <button type="button" className="ti-btn ti-btn--primary" onClick={() => navigate('/phones')}>Shop a New Phone <ArrowRight aria-hidden="true" /></button>
                <button type="button" className="ti-btn ti-btn--ghost" onClick={resetForm}>Submit Another</button>
              </div>
            </div>
          ) : (
            <div className="ti-quote-grid">
              <div className="ti-card ti-form">
                <header className="ti-form-head">
                  <span><Calculator aria-hidden="true" /></span>
                  <div>
                    <h2>Get Your Instant Quote</h2>
                    <p>Tell us about your device — the value updates as you go.</p>
                  </div>
                </header>

                <h3 className="ti-label">1. Brand <em>*</em></h3>
                <div className={`ti-chips${formErrors.formBrand ? ' has-error' : ''}`} role="radiogroup" aria-label="Brand">
                  {brands.map((b) => (
                    <button key={b} type="button" role="radio" aria-checked={formBrand === b} className={formBrand === b ? 'is-active' : ''} onClick={() => { if (b !== formBrand) setFormModel(''); setFormBrand(b); clearError('formBrand') }}>{b}</button>
                  ))}
                </div>
                {formErrors.formBrand && <p className="ti-err">{formErrors.formBrand}</p>}

                <div className="ti-fields">
                  <div className={`ti-field${formErrors.formModel ? ' has-error' : ''}`}>
                    <label htmlFor="ti-model">2. Model <em>*</em></label>
                    <select id="ti-model" value={formModel} disabled={!formBrand} onChange={(e) => { setFormModel(e.target.value); clearError('formModel') }}>
                      <option value="">{formBrand ? 'Choose your model' : 'Pick a brand first'}</option>
                      {modelsFor(formBrand).map((x) => <option key={x.model} value={x.model}>{x.model}</option>)}
                      {formBrand && <option value={OTHER_MODEL}>{OTHER_MODEL}</option>}
                    </select>
                    {formErrors.formModel && <p className="ti-err">{formErrors.formModel}</p>}
                  </div>
                  <div className="ti-field">
                    <span className="ti-field-label">3. Storage</span>
                    <div className="ti-chips ti-chips--sm" role="radiogroup" aria-label="Storage">
                      {storageOptions.map((s) => (
                        <button key={s} type="button" role="radio" aria-checked={formStorage === s} className={formStorage === s ? 'is-active' : ''} onClick={() => setFormStorage(formStorage === s ? '' : s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <h3 className="ti-label">4. Condition <em>*</em></h3>
                <div className={`ti-conditions${formErrors.formCondition ? ' has-error' : ''}`} role="radiogroup" aria-label="Condition">
                  {deviceConditions.map((c) => (
                    <button key={c.value} type="button" role="radio" aria-label={`${c.title}: ${c.desc}`} aria-checked={formCondition === c.value} className={formCondition === c.value ? 'is-active' : ''} onClick={() => { setFormCondition(c.value); clearError('formCondition') }}>
                      <b>{c.title}</b>
                      <small>{c.desc}</small>
                      {formCondition === c.value && <span className="ti-check"><Check aria-hidden="true" /></span>}
                    </button>
                  ))}
                </div>
                {formErrors.formCondition && <p className="ti-err">{formErrors.formCondition}</p>}

                <h3 className="ti-label">5. Your Contact Info</h3>
                <div className="ti-fields ti-fields--3">
                  <div className={`ti-field${formErrors.formName ? ' has-error' : ''}`}>
                    <label htmlFor="ti-name">Full Name <em>*</em></label>
                    <input id="ti-name" value={formName} autoComplete="name" placeholder="Your name" onChange={(e) => { setFormName(e.target.value); clearError('formName') }} />
                    {formErrors.formName && <p className="ti-err">{formErrors.formName}</p>}
                  </div>
                  <div className={`ti-field${formErrors.formMobile ? ' has-error' : ''}`}>
                    <label htmlFor="ti-mobile">Mobile <em>*</em></label>
                    <input id="ti-mobile" value={formMobile} inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" onChange={(e) => { setFormMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); clearError('formMobile') }} />
                    {formErrors.formMobile && <p className="ti-err">{formErrors.formMobile}</p>}
                  </div>
                  <div className={`ti-field${formErrors.formEmail ? ' has-error' : ''}`}>
                    <label htmlFor="ti-email">Email <span>(optional)</span></label>
                    <input id="ti-email" type="email" value={formEmail} autoComplete="email" placeholder="email@example.com" onChange={(e) => { setFormEmail(e.target.value); clearError('formEmail') }} />
                    {formErrors.formEmail && <p className="ti-err">{formErrors.formEmail}</p>}
                  </div>
                </div>
                {formErrors.submit && <p className="ti-submit-err" role="alert">{formErrors.submit}</p>}
              </div>

              <aside className="ti-card ti-value">
                <h3><Sparkles aria-hidden="true" /> Value Analysis</h3>
                {analysis ? (
                  <>
                    <div className="ti-value-big">
                      <span>Estimated Trade-In Value</span>
                      <strong key={analysis.finalValue}>{inr(analysis.finalValue)}</strong>
                    </div>
                    <ul className="ti-breakdown">
                      {analysis.breakdown.map((b) => (
                        <li key={b.label}><span>{b.label}</span><b className={b.amount < 0 ? 'is-neg' : ''}>{b.amount >= 0 ? '+' : '–'}{inr(Math.abs(b.amount))}</b></li>
                      ))}
                    </ul>
                    <p className="ti-note"><Info aria-hidden="true" /> {analysis.approximate ? 'Your model isn’t in our price list yet, so this is a minimum estimate. ' : ''}This is an estimate. The final value is confirmed after a physical inspection.</p>
                  </>
                ) : (
                  <div className="ti-value-empty">
                    <Smartphone aria-hidden="true" />
                    <p>Pick a brand, model and condition to see your estimated value.</p>
                  </div>
                )}
                <button type="button" className="ti-btn ti-btn--primary ti-btn--block" onClick={handleFormSubmit} disabled={submitting || !analysis}>
                  {submitting ? <><Loader2 aria-hidden="true" className="ti-spin" /> Submitting…</> : <>Submit Trade-In <ArrowRight aria-hidden="true" /></>}
                </button>
                <ul className="ti-perks">
                  <li><Check aria-hidden="true" /> Instant payment after inspection</li>
                  <li><Check aria-hidden="true" /> Free doorstep pickup</li>
                  <li><Check aria-hidden="true" /> No hidden fees or deductions</li>
                </ul>
              </aside>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

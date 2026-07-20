import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StorefrontNavbar from '../components/ecommerce/StorefrontNavbar'
import EcommerceFooter from '../components/ecommerce/Footer'
import MobileTradeIn from '../components/mobile/MobileTradeIn'
import { useIsMobile } from '../components/mobile/helpers'

const brands = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo']

const steps = [
  { icon: 'devices', title: 'Select Your Device', desc: 'Tell us what you\'re trading in — brand, model, and condition.' },
  { icon: 'request_quote', title: 'Get Instant Quote', desc: 'Receive a fair market price for your device instantly.' },
  { icon: 'local_shipping', title: 'Ship or Drop Off', desc: 'Send your device free with our prepaid label or visit a local shop.' },
  { icon: 'payments', title: 'Get Paid', desc: 'Receive payment or store credit as soon as your device is inspected.' },
]

const deviceConditions = ['Mint - Like New', 'Good - Minor Scratches', 'Fair - Visible Wear', 'Broken - Damaged Screen/Body']
const storageOptions = ['64GB', '128GB', '256GB', '512GB', '1TB']

const heroSlides = [
  {
    tag: 'Trade-In Program',
    title: ['Turn Your Old', 'Device', 'Into Cash'],
    desc: 'Get top dollar for your used smartphone, tablet, or wearable — instant quote, zero hassle.',
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80',
  },
  {
    tag: 'Instant Cash',
    title: ['Sell Your Phone,', 'Get Paid', 'Instantly'],
    desc: 'Up to ₹45,000 for your device. Same-day payment after inspection — no waiting.',
    img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1920&q=80',
  },
  {
    tag: 'Upgrade Today',
    title: ['Trade Up to', 'Something', 'Better'],
    desc: 'Use your old device as credit toward the latest iPhone, Galaxy, or Pixel.',
    img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&q=80',
  },
  {
    tag: 'Eco-Friendly',
    title: ['Recycle,', 'Reuse,', 'Earn Rewards'],
    desc: 'Keep e-waste out of landfills while putting money back in your pocket.',
    img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1920&q=80',
  },
  {
    tag: 'Trusted by Thousands',
    title: ['Your Device,', 'Fair Price,', 'No Games'],
    desc: 'Transparent pricing, free shipping, and the best trade-in value guaranteed.',
    img: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80',
  },
]

const basePrices: Record<string, number> = {
  'Apple': 30000, 'Samsung': 25000, 'Google': 22000, 'OnePlus': 18000, 'Xiaomi': 12000, 'Oppo': 10000,
}

const conditionMultiplier: Record<string, number> = {
  'Mint - Like New': 1.0, 'Good - Minor Scratches': 0.75, 'Fair - Visible Wear': 0.50, 'Broken - Damaged Screen/Body': 0.25,
}

const storageBonus: Record<string, number> = {
  '64GB': 0, '128GB': 2000, '256GB': 4000, '512GB': 7000, '1TB': 10000,
}

type AnalysisResult = {
  baseValue: number
  conditionAdjustment: number
  storageBonusValue: number
  finalValue: number
  breakdown: { label: string; amount: number }[]
}

function calculateAnalysis(brand: string, condition: string, storage: string): AnalysisResult | null {
  if (!brand || !condition) return null
  const base = basePrices[brand] || 15000
  const condMult = conditionMultiplier[condition] || 0.5
  const condAdj = Math.round(base * condMult)
  const storBonus = storage ? (storageBonus[storage] || 0) : 0
  const finalValue = condAdj + storBonus
  return {
    baseValue: base,
    conditionAdjustment: condAdj,
    storageBonusValue: storBonus,
    finalValue,
    breakdown: [
      { label: `Base value (${brand})`, amount: base },
      { label: `Condition adjustment (${condition})`, amount: condAdj - base },
      { label: `Storage bonus${storage ? ` (${storage})` : ''}`, amount: storBonus },
    ],
  }
}

export default function TradeInPage() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileTradeIn />
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formBrand, setFormBrand] = useState('')
  const [formModel, setFormModel] = useState('')
  const [formCondition, setFormCondition] = useState('')
  const [formStorage, setFormStorage] = useState('')
  const [formName, setFormName] = useState('')
  const [formMobile, setFormMobile] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const revealRefs = useRef<Set<HTMLElement>>(new Set())
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('active') }) },
      { threshold: 0.1 }
    )
    revealRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (formBrand && formCondition)
      setAnalysis(calculateAnalysis(formBrand, formCondition, formStorage))
    else setAnalysis(null)
  }, [formBrand, formCondition, formStorage])

  const setRevealRef = (el: HTMLElement | null) => { if (el) revealRefs.current.add(el) }

  const validateForm = () => {
    const e: Record<string, string> = {}
    if (!formBrand) e.formBrand = 'Select your device brand'
    if (!formModel.trim()) e.formModel = 'Model is required'
    if (!formCondition) e.formCondition = 'Select device condition'
    if (!formName.trim()) e.formName = 'Name is required'
    if (!/^\d{10}$/.test(formMobile.replace(/\D/g, ''))) e.formMobile = 'Enter a valid 10-digit number'
    if (formEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) e.formEmail = 'Invalid email'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleStartTradeIn = () => {
    setShowForm(true)
    setSubmitted(false)
    setFormErrors({})
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const handleFormSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setSubmitting(false)
    setSubmitted(true)
    setShowForm(false)
  }

  const inputClass = (field: string) =>
    `w-full h-11 px-4 rounded-xl bg-white border text-sm text-[#181c1e] outline-none focus:border-[#00ff88]/50 transition-all ${formErrors[field] ? 'border-red-400' : 'border-glass-border'}`

  return (
    <div className="min-h-screen bg-[#f7fafd] text-[#181c1e] font-sans selection:bg-[#00ff88]/30 selection:text-[#00391c]">
      <StorefrontNavbar activeLabel="Trade-In" absolute />

      <main>
        {/* ─── HERO CAROUSEL ─── */}
        <section className="hero-section relative h-screen overflow-hidden bg-black">
          {heroSlides.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                i === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img src={slide.img} alt="" className="absolute inset-0 w-full h-full object-cover scale-110" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(0,255,136,0.06)_0%,transparent_60%)]" />
              <div className="relative h-full max-w-[1440px] mx-auto px-6 md:px-16 flex items-center">
                <div className="max-w-3xl">
                  <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/25 text-[#00ff88] text-sm font-bold tracking-[0.15em] uppercase mb-8 backdrop-blur-md transition-all duration-700 delay-200 ${
                    i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  }`}>
                    <span className="relative w-2 h-2">
                      <span className="absolute inset-0 rounded-full bg-[#00ff88] animate-ping" />
                      <span className="absolute inset-0 rounded-full bg-[#00ff88]" />
                    </span>
                    {slide.tag}
                  </div>
                  <h1 className={`text-[clamp(42px,6vw,80px)] font-extrabold leading-[1.05] text-white mb-6 transition-all duration-700 delay-300 ${
                    i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}>
                    {slide.title[0]}<br />
                    <span className="relative inline-block bg-gradient-to-r from-[#00ff88] via-[#80ffbb] to-[#00ff88] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient italic drop-shadow-[0_0_40px_rgba(0,255,136,0.4)]">
                      {slide.title[1]}
                      <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff88] to-transparent rounded-full opacity-60 animate-pulse" />
                    </span>{' '}
                    <span className="text-white/90">{slide.title[2]}</span>
                  </h1>
                  <p className={`text-lg md:text-2xl text-white/70 leading-relaxed max-w-2xl mb-10 transition-all duration-700 delay-400 ${
                    i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}>
                    {slide.desc}
                  </p>
                  <div className={`flex flex-wrap gap-4 transition-all duration-700 delay-500 ${
                    i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}>
                    <button onClick={handleStartTradeIn} className="group inline-flex items-center gap-2 bg-[#00ff88] text-[#00391c] font-bold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-full shadow-[0_0_30px_rgba(0,255,136,0.3)] hover:shadow-[0_0_60px_rgba(0,255,136,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 animate-float">
                      Get Your Quote <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                    <a href="#how-it-works" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/20 font-semibold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-full hover:bg-white/20 hover:border-white/40 transition-all duration-300">
                      How It Works
                    </a>
                  </div>
                  <div className="flex items-center gap-6 mt-8 text-white/60 text-sm">
                    <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-[#00ff88]">check_circle</span> Instant Quote</span>
                    <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-[#00ff88]">check_circle</span> Free Shipping</span>
                    <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-[#00ff88]">check_circle</span> Best Price Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`relative h-1.5 rounded-full transition-all duration-500 overflow-hidden ${
                  i === currentSlide ? 'w-16 bg-[#00ff88]' : 'w-6 bg-white/30 hover:bg-white/50'
                }`}
              >
                {i === currentSlide && (
                  <span className="absolute inset-0 bg-white/40 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>
          <div className="absolute bottom-10 right-6 md:right-12 z-20 text-white/40 text-sm font-mono tracking-wider">
            {String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 px-4 md:px-8 max-w-[1400px] mx-auto" ref={setRevealRef}>
          <div className="text-center mb-16">
            <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold text-[#181c1e] mb-4">How Trade-In Works</h2>
            <p className="text-[#434748] max-w-2xl mx-auto">Four simple steps to turn your old device into savings.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <div key={step.title} className="glass-card p-8 rounded-[1.75rem] text-center group hover:shadow-[0_20px_60px_rgba(0,255,136,0.10)] hover:border-[#00ff88]/25 hover:-translate-y-1 transition-all duration-500" style={{ transitionDelay: `${idx * 100}ms` }}>
                <div className="w-16 h-16 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#00ff88]/20 transition-colors">
                  <span className="material-symbols-outlined text-3xl text-[#00ff88]">{step.icon}</span>
                </div>
                <span className="text-[#00ff88] font-bold text-sm">Step {idx + 1}</span>
                <h3 className="text-lg font-bold text-[#181c1e] mt-2 mb-2">{step.title}</h3>
                <p className="text-[#434748] text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Estimate Section */}
        <section className="py-24 px-4 md:px-8 bg-[#f0f3f5]" ref={setRevealRef}>
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div>
                <h2 className="text-[clamp(24px,3vw,40px)] font-extrabold text-[#181c1e] mb-6">Estimate Your Trade-In Value</h2>
                <p className="text-[#434748] mb-8">Select your device brand to see estimated trade-in values for popular models.</p>
                <div className="flex flex-wrap gap-3 mb-8">
                  {brands.map((brand) => (
                    <button key={brand} onClick={() => setSelectedBrand(brand === selectedBrand ? '' : brand)}
                      className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all cursor-pointer ${selectedBrand === brand ? 'bg-[#00ff88] text-[#00391c] border-[#00ff88] shadow-lg shadow-[#00ff88]/20' : 'bg-white border-glass-border text-[#434748] hover:border-[#00ff88]/50'}`}
                    >{brand}</button>
                  ))}
                </div>
                <div className="space-y-3">
                  {[
                    { device: 'iPhone 16 Pro Max', value: '₹35,000 - ₹45,000' },
                    { device: 'iPhone 15 Pro Max', value: '₹30,000 - ₹38,000' },
                    { device: 'iPhone 14 Pro Max', value: '₹20,000 - ₹30,000' },
                    { device: 'Samsung Galaxy S25 Ultra', value: '₹30,000 - ₹42,000' },
                    { device: 'Samsung Galaxy S24 Ultra', value: '₹24,000 - ₹33,000' },
                    { device: 'Google Pixel 10 Pro', value: '₹22,000 - ₹30,000' },
                  ].filter(e => !selectedBrand || e.device.toLowerCase().includes(selectedBrand.toLowerCase())).map((item) => (
                    <div key={item.device} className="glass-card p-4 rounded-xl flex items-center justify-between hover:border-[#00ff88]/20 transition-all">
                      <span className="font-bold text-[#181c1e]">{item.device}</span>
                      <span className="font-bold text-[#00ff88]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card p-8 rounded-[1.75rem]">
                <h3 className="text-xl font-extrabold text-[#181c1e] mb-6">Why Trade With Us?</h3>
                <ul className="space-y-4">
                  {[
                    { icon: 'monetization_on', text: 'Competitive market-based pricing' },
                    { icon: 'local_shipping', text: 'Free shipping with prepaid label' },
                    { icon: 'verified', text: 'Fast inspection & same-day payment' },
                    { icon: 'recycling', text: 'Environmentally responsible recycling' },
                    { icon: 'card_giftcard', text: 'Bonus credit when used toward a new device' },
                  ].map((item) => (
                    <li key={item.text} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#00ff88]">{item.icon}</span>
                      <span className="text-[#434748]">{item.text}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={handleStartTradeIn} className="mt-8 w-full bg-[#00ff88] text-[#00391c] font-bold py-3.5 rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#00ff88]/20 cursor-pointer flex items-center justify-center gap-2">
                  Start Trade-In <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── TRADE-IN DETAILS & VALUE ANALYSIS ─── */}
        {showForm && (
          <section id="trade-in-form" ref={formRef} className="py-24 px-4 md:px-8 bg-white scroll-mt-24">
            <div className="max-w-[1200px] mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold text-[#181c1e] mb-3">Sell Your Phone</h2>
                <p className="text-[#434748] max-w-xl mx-auto">Fill in your device details and contact info. We'll analyze the value instantly.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Form */}
                <div className="lg:col-span-3 glass-card p-8 md:p-10 rounded-[2rem]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#434748] mb-1">Brand <span className="text-red-500">*</span></label>
                      <select value={formBrand} onChange={(e) => { setFormBrand(e.target.value); if (formErrors.formBrand) setFormErrors(p => ({ ...p, formBrand: '' })) }}
                        className={inputClass('formBrand')}>
                        <option value="">Select brand</option>
                        {brands.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      {formErrors.formBrand && <p className="text-xs text-red-500 mt-1">{formErrors.formBrand}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#434748] mb-1">Model <span className="text-red-500">*</span></label>
                      <input value={formModel} onChange={(e) => { setFormModel(e.target.value); if (formErrors.formModel) setFormErrors(p => ({ ...p, formModel: '' })) }}
                        className={inputClass('formModel')} placeholder="e.g. iPhone 15 Pro Max" />
                      {formErrors.formModel && <p className="text-xs text-red-500 mt-1">{formErrors.formModel}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#434748] mb-1">Storage</label>
                      <select value={formStorage} onChange={(e) => setFormStorage(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-white border border-glass-border text-sm text-[#181c1e] outline-none appearance-none cursor-pointer focus:border-[#00ff88]/50 transition-all">
                        <option value="">Select storage</option>
                        {storageOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#434748] mb-1">Condition <span className="text-red-500">*</span></label>
                      <select value={formCondition} onChange={(e) => { setFormCondition(e.target.value); if (formErrors.formCondition) setFormErrors(p => ({ ...p, formCondition: '' })) }}
                        className={inputClass('formCondition')}>
                        <option value="">Select condition</option>
                        {deviceConditions.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {formErrors.formCondition && <p className="text-xs text-red-500 mt-1">{formErrors.formCondition}</p>}
                    </div>
                  </div>
                  <div className="border-t border-glass-border pt-6 mt-6">
                    <p className="text-sm font-bold text-[#434748] mb-4">Your Contact Info</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#434748] mb-1">Full Name <span className="text-red-500">*</span></label>
                        <input value={formName} onChange={(e) => { setFormName(e.target.value); if (formErrors.formName) setFormErrors(p => ({ ...p, formName: '' })) }}
                          className={inputClass('formName')} placeholder="Your name" />
                        {formErrors.formName && <p className="text-xs text-red-500 mt-1">{formErrors.formName}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#434748] mb-1">Mobile <span className="text-red-500">*</span></label>
                        <input value={formMobile} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setFormMobile(v); if (formErrors.formMobile) setFormErrors(p => ({ ...p, formMobile: '' })) }}
                          className={inputClass('formMobile')} placeholder="98765 43210" />
                        {formErrors.formMobile && <p className="text-xs text-red-500 mt-1">{formErrors.formMobile}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#434748] mb-1">Email</label>
                        <input value={formEmail} onChange={(e) => { setFormEmail(e.target.value); if (formErrors.formEmail) setFormErrors(p => ({ ...p, formEmail: '' })) }}
                          className={inputClass('formEmail')} placeholder="email@example.com" type="email" />
                        {formErrors.formEmail && <p className="text-xs text-red-500 mt-1">{formErrors.formEmail}</p>}
                      </div>
                    </div>
                  </div>
                  <button onClick={handleFormSubmit} disabled={submitting || !analysis}
                    className="mt-8 w-full py-3.5 rounded-full text-sm font-bold shadow-lg shadow-[#00ff88]/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 text-white"
                    style={{ background: submitting ? '#9CA3AF' : 'linear-gradient(135deg, #00ff88, #006b58)' }}
                  >
                    {submitting ? <span className="material-symbols-outlined animate-spin text-lg">refresh</span> : null}
                    {submitting ? 'Submitting...' : 'Submit Trade-In'}
                  </button>
                </div>

                {/* Value Analysis Panel */}
                <div className="lg:col-span-2">
                  <div className="glass-card p-8 rounded-[2rem] sticky top-28">
                    <h3 className="text-lg font-extrabold text-[#181c1e] mb-5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00ff88]">analytics</span>
                      Value Analysis
                    </h3>
                    {analysis ? (
                      <div>
                        <div className="text-center mb-6">
                          <p className="text-sm text-[#434748] mb-1">Estimated Trade-In Value</p>
                          <p className="text-[clamp(32px,4vw,48px)] font-extrabold text-[#00ff88]">₹{analysis.finalValue.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-[#434748] mt-1">Final amount after adjustments</p>
                        </div>
                        <div className="space-y-2.5">
                          {analysis.breakdown.map((item) => (
                            <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#f0f3f5]">
                              <span className="text-xs text-[#434748]">{item.label}</span>
                              <span className={`text-sm font-bold ${item.amount >= 0 ? 'text-[#181c1e]' : 'text-red-500'}`}>
                                {item.amount >= 0 ? '+' : ''}₹{item.amount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 p-3 rounded-lg bg-[#00ff88]/5 border border-[#00ff88]/15">
                          <p className="text-xs text-[#434748] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-[#00ff88]">info</span>
                            This is an estimate. Final value determined after physical inspection.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <span className="material-symbols-outlined text-4xl text-[#434748]/40 mb-3">devices</span>
                        <p className="text-sm text-[#434748]">Select a brand and condition to see your estimated trade-in value.</p>
                      </div>
                    )}
                    <div className="border-t border-glass-border pt-4 mt-6">
                      <h4 className="text-xs font-bold text-[#434748] mb-3">Why sell to us?</h4>
                      <ul className="space-y-2">
                        {[
                          'Instant payment after inspection',
                          'Free doorstep pickup',
                          'No hidden fees or deductions',
                        ].map((tip) => (
                          <li key={tip} className="flex items-center gap-2 text-xs text-[#434748]">
                            <span className="material-symbols-outlined text-[14px] text-[#00ff88]">check</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Success Section */}
        {submitted && (
          <section className="py-24 px-4 md:px-8 bg-[#f0f3f5]">
            <div className="max-w-lg mx-auto text-center glass-card p-12 rounded-[2rem]">
              <div className="w-20 h-20 rounded-3xl bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-[#00ff88]">check_circle</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#181c1e] mb-2">Trade-In Submitted!</h2>
              <p className="text-[#434748] mb-6">We'll review your device details and get back to you within 24 hours with a final quote.</p>
              <button onClick={() => { setSubmitted(false); navigate('/') }}
                className="inline-flex items-center gap-2 bg-[#00ff88] text-[#00391c] font-bold px-8 py-3.5 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >Back to Home <span className="material-symbols-outlined text-lg">arrow_forward</span></button>
            </div>
          </section>
        )}
      </main>

      <EcommerceFooter />
    </div>
  )
}

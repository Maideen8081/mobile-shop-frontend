import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronLeft, FiCheck, FiArrowRight, FiLoader, FiSmartphone, FiTruck, FiStar, FiRefreshCw, FiShield, FiGift, FiCreditCard } from 'react-icons/fi'
import MobileBottomNav from './MobileBottomNav'
import { useMobileToast } from './useMobileToast'

const PURPLE = '#6C3BFF'
const PURPLE_DEEP = '#4B2ECC'
const GREEN = '#00C46A'
const card = 'bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]'

const brands = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo']

const steps = [
  { icon: FiSmartphone, title: 'Select Your Device', desc: 'Tell us what you\'re trading in — brand, model, and condition.' },
  { icon: FiCreditCard, title: 'Get Instant Quote', desc: 'Receive a fair market price for your device instantly.' },
  { icon: FiTruck, title: 'Ship or Drop Off', desc: 'Send your device free with our prepaid label or visit a local shop.' },
  { icon: FiCheck, title: 'Get Paid', desc: 'Receive payment or store credit after inspection.' },
]

const deviceConditions = ['Mint - Like New', 'Good - Minor Scratches', 'Fair - Visible Wear', 'Broken - Damaged Screen/Body']
const storageOptions = ['64GB', '128GB', '256GB', '512GB', '1TB']

const heroSlides = [
  { tag: 'Trade-In Program', title: ['Turn Your Old', 'Device Into Cash'], desc: 'Get top value for your used phone, tablet, or wearable — instant quote, zero hassle.' },
  { tag: 'Instant Cash', title: ['Sell Your Phone,', 'Get Paid Instantly'], desc: 'Up to ₹45,000 for your device. Same-day payment after inspection.' },
  { tag: 'Upgrade Today', title: ['Trade Up to', 'Something Better'], desc: 'Use your old device as credit toward the latest iPhone, Galaxy, or Pixel.' },
  { tag: 'Eco-Friendly', title: ['Recycle, Reuse,', 'Earn Rewards'], desc: 'Keep e-waste out of landfills while putting money back in your pocket.' },
  { tag: 'Trusted by Thousands', title: ['Your Device,', 'Fair Price, No Games'], desc: 'Transparent pricing, free shipping, and the best trade-in value guaranteed.' },
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

const estimateRows = [
  { device: 'iPhone 16 Pro Max', value: '₹35,000 - ₹45,000' },
  { device: 'iPhone 15 Pro Max', value: '₹30,000 - ₹38,000' },
  { device: 'iPhone 14 Pro Max', value: '₹20,000 - ₹30,000' },
  { device: 'Samsung Galaxy S25 Ultra', value: '₹30,000 - ₹42,000' },
  { device: 'Samsung Galaxy S24 Ultra', value: '₹24,000 - ₹33,000' },
  { device: 'Google Pixel 10 Pro', value: '₹22,000 - ₹30,000' },
]

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

export default function MobileTradeIn() {
  const navigate = useNavigate()
  const { show: showToast, Toast } = useMobileToast()
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

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide(p => (p + 1) % heroSlides.length), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (formBrand && formCondition) setAnalysis(calculateAnalysis(formBrand, formCondition, formStorage))
    else setAnalysis(null)
  }, [formBrand, formCondition, formStorage])

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

  const handleFormSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setSubmitting(false)
    setShowForm(false)
    setSubmitted(true)
    showToast('Trade-In submitted!', 'success')
  }

  const inputClass = (field: string) =>
    `w-full h-12 px-3.5 rounded-2xl text-[14px] bg-[#F2F1FB] border outline-none transition focus:bg-white ${formErrors[field] ? 'border-[#EF4444]' : 'border-[#E5E7EB]'}`

  const filteredRows = estimateRows.filter(r => !selectedBrand || r.device.toLowerCase().includes(selectedBrand.toLowerCase()))

  return (
    <div className="min-h-screen bg-[#F7F8FC] max-w-[480px] mx-auto font-sans text-[#1F2937] pb-28" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* Hero carousel */}
      <section className="relative h-[360px] overflow-hidden">
        {heroSlides.map((slide, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
            style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>
            <div className="absolute -top-10 -right-8 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-10 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
            <div className="relative h-full px-6 flex flex-col justify-center">
              <span className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-white/15 text-white text-[11px] font-bold uppercase tracking-wider mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" /> {slide.tag}
              </span>
              <h1 className="text-[28px] font-extrabold leading-[1.1] text-white">
                {slide.title[0]}<br />
                <span className="text-[#00ff88]">{slide.title[1]}</span>
              </h1>
              <p className="text-[13px] text-white/75 mt-3 leading-relaxed max-w-[300px]">{slide.desc}</p>
              <button onClick={() => { setShowForm(true); setSubmitted(false); setFormErrors({}) }}
                className="mt-5 self-start inline-flex items-center gap-2 bg-[#00ff88] text-[#00391c] font-bold text-[14px] px-6 py-3 rounded-full active:scale-95 transition">
                Get Your Quote <FiArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {heroSlides.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 bg-[#00ff88]' : 'w-4 bg-white/40'}`} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-3 mt-4">
        <div className="text-center mb-4">
          <h2 className="text-[18px] font-extrabold">How Trade-In Works</h2>
          <p className="text-[12px] text-[#6B7280] mt-1">Four simple steps to turn your old device into savings.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={step.title} className={`${card} p-4`}>
                <div className="w-11 h-11 rounded-full bg-[#F1ECFF] flex items-center justify-center mb-2.5" style={{ color: PURPLE }}>
                  <Icon size={20} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: PURPLE }}>STEP {idx + 1}</span>
                <h3 className="text-[13px] font-bold mt-1 mb-1">{step.title}</h3>
                <p className="text-[11px] text-[#6B7280] leading-snug">{step.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Estimate */}
      <section className="px-3 mt-4">
        <div className={`${card} p-4`}>
          <h2 className="text-[16px] font-extrabold mb-1">Estimate Your Trade-In Value</h2>
          <p className="text-[12px] text-[#6B7280] mb-3">Pick a brand to see estimated values.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {brands.map((brand) => (
              <button key={brand} onClick={() => setSelectedBrand(brand === selectedBrand ? '' : brand)}
                className={`px-3.5 h-9 rounded-full text-[12px] font-semibold border transition ${selectedBrand === brand ? 'text-white border-transparent' : 'bg-[#F2F1FB] border-[#E5E7EB] text-[#4B5563]'}`}
                style={selectedBrand === brand ? { background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` } : undefined}>
                {brand}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {filteredRows.map((item) => (
              <div key={item.device} className="flex items-center justify-between bg-[#F7F8FC] rounded-xl px-3 py-2.5">
                <span className="text-[12px] font-bold">{item.device}</span>
                <span className="text-[12px] font-bold" style={{ color: GREEN }}>{item.value}</span>
              </div>
            ))}
            {filteredRows.length === 0 && <p className="text-[12px] text-[#6B7280] text-center py-3">No devices found for this brand.</p>}
          </div>
        </div>

        <div className={`${card} p-4 mt-3`}>
          <h3 className="text-[14px] font-extrabold mb-3">Why Trade With Us?</h3>
          <ul className="space-y-2.5">
            {[
              { icon: FiStar, text: 'Competitive market-based pricing' },
              { icon: FiTruck, text: 'Free shipping with prepaid label' },
              { icon: FiCheck, text: 'Fast inspection & same-day payment' },
              { icon: FiRefreshCw, text: 'Environmentally responsible recycling' },
              { icon: FiGift, text: 'Bonus credit toward a new device' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#F1ECFF] flex items-center justify-center flex-shrink-0" style={{ color: PURPLE }}><Icon size={14} /></span>
                  <span className="text-[12px] text-[#4B5563]">{item.text}</span>
                </li>
              )
            })}
          </ul>
          <button onClick={() => { setShowForm(true); setSubmitted(false); setFormErrors({}) }}
            className="mt-4 w-full h-12 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition"
            style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>
            Start Trade-In <FiArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Success */}
      {submitted && (
        <section className="px-3 mt-4">
          <div className={`${card} p-6 flex flex-col items-center text-center`}>
            <div className="w-16 h-16 rounded-2xl bg-[#E7FBF0] flex items-center justify-center mb-3" style={{ color: GREEN }}><FiCheck size={30} /></div>
            <h2 className="text-[17px] font-extrabold">Trade-In Submitted!</h2>
            <p className="text-[12px] text-[#6B7280] mt-1 mb-4">We'll review your device and get back within 24 hours with a final quote.</p>
            <button onClick={() => { setSubmitted(false); navigate('/') }}
              className="inline-flex items-center gap-2 text-white font-bold text-[13px] px-6 py-3 rounded-full active:scale-95 transition"
              style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>
              Back to Home <FiArrowRight size={15} />
            </button>
          </div>
        </section>
      )}

      {/* Form sheet */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[480px] bg-[#F7F8FC] rounded-t-[28px] flex flex-col max-h-[90vh]" style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#D9D9E3] mx-auto mb-3" />
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F2F1FB] flex items-center justify-center text-[#6B7280]"><FiChevronLeft size={18} className="rotate-90" /></button>
              <p className="text-[15px] font-extrabold">Sell Your Phone</p>
              <p className="text-[12px] text-[#6B7280] mt-0.5">Fill details — we'll analyze the value instantly.</p>
            </div>
            <div className="px-4 overflow-y-auto flex-1 space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">Brand <span className="text-[#EF4444]">*</span></label>
                <select value={formBrand} onChange={(e) => { setFormBrand(e.target.value); if (formErrors.formBrand) setFormErrors(p => ({ ...p, formBrand: '' })) }} className={inputClass('formBrand')}>
                  <option value="">Select brand</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                {formErrors.formBrand && <p className="text-[11px] text-[#EF4444] mt-1">{formErrors.formBrand}</p>}
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">Model <span className="text-[#EF4444]">*</span></label>
                <input value={formModel} onChange={(e) => { setFormModel(e.target.value); if (formErrors.formModel) setFormErrors(p => ({ ...p, formModel: '' })) }} className={inputClass('formModel')} placeholder="e.g. iPhone 15 Pro Max" />
                {formErrors.formModel && <p className="text-[11px] text-[#EF4444] mt-1">{formErrors.formModel}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">Storage</label>
                  <select value={formStorage} onChange={(e) => setFormStorage(e.target.value)} className={inputClass('formStorage')}>
                    <option value="">Select</option>
                    {storageOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">Condition <span className="text-[#EF4444]">*</span></label>
                  <select value={formCondition} onChange={(e) => { setFormCondition(e.target.value); if (formErrors.formCondition) setFormErrors(p => ({ ...p, formCondition: '' })) }} className={inputClass('formCondition')}>
                    <option value="">Select</option>
                    {deviceConditions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {formErrors.formCondition && <p className="text-[11px] text-[#EF4444] mt-1">{formErrors.formCondition}</p>}
                </div>
              </div>
              <div className="border-t border-[#EEF1F4] pt-3">
                <p className="text-[12px] font-bold text-[#4B5563] mb-2">Your Contact Info</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">Full Name <span className="text-[#EF4444]">*</span></label>
                    <input value={formName} onChange={(e) => { setFormName(e.target.value); if (formErrors.formName) setFormErrors(p => ({ ...p, formName: '' })) }} className={inputClass('formName')} placeholder="Your name" />
                    {formErrors.formName && <p className="text-[11px] text-[#EF4444] mt-1">{formErrors.formName}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">Mobile <span className="text-[#EF4444]">*</span></label>
                    <input value={formMobile} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setFormMobile(v); if (formErrors.formMobile) setFormErrors(p => ({ ...p, formMobile: '' })) }} className={inputClass('formMobile')} placeholder="98765 43210" />
                    {formErrors.formMobile && <p className="text-[11px] text-[#EF4444] mt-1">{formErrors.formMobile}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">Email</label>
                    <input value={formEmail} onChange={(e) => { setFormEmail(e.target.value); if (formErrors.formEmail) setFormErrors(p => ({ ...p, formEmail: '' })) }} className={inputClass('formEmail')} placeholder="email@example.com" />
                    {formErrors.formEmail && <p className="text-[11px] text-[#EF4444] mt-1">{formErrors.formEmail}</p>}
                  </div>
                </div>
              </div>

              {/* Value analysis */}
              <div className={`${card} p-4`}>
                <h3 className="text-[14px] font-extrabold flex items-center gap-2 mb-3" style={{ color: GREEN }}>
                  <FiShield size={16} /> Value Analysis
                </h3>
                {analysis ? (
                  <div>
                    <div className="text-center mb-3">
                      <p className="text-[11px] text-[#6B7280]">Estimated Trade-In Value</p>
                      <p className="text-[30px] font-extrabold" style={{ color: GREEN }}>₹{analysis.finalValue.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="space-y-1.5">
                      {analysis.breakdown.map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#F7F8FC]">
                          <span className="text-[11px] text-[#6B7280]">{item.label}</span>
                          <span className={`text-[12px] font-bold ${item.amount >= 0 ? 'text-[#1F2937]' : 'text-[#EF4444]'}`}>
                            {item.amount >= 0 ? '+' : ''}₹{item.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-2.5 rounded-lg bg-[#E7FBF0]">
                      <p className="text-[11px] text-[#1F7A4D]">This is an estimate. Final value after physical inspection.</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-[#6B7280] text-center py-4">Select a brand and condition to see your estimated value.</p>
                )}
              </div>
            </div>
            <div className="flex gap-2.5 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] bg-[#F7F8FC] border-t border-[#EEF1F4] flex-shrink-0">
              <button onClick={() => setShowForm(false)} className="flex-1 h-12 rounded-2xl text-[14px] font-bold border border-[#E5E7EB] text-[#6B7280]">Cancel</button>
              <button onClick={handleFormSubmit} disabled={submitting || !analysis}
                className="flex-[1.4] h-12 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition"
                style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>
                {submitting ? <FiLoader size={16} className="animate-spin" /> : 'Submit Trade-In'}
              </button>
            </div>
          </div>
        </>
      )}

      <MobileBottomNav />
      {Toast}
    </div>
  )
}

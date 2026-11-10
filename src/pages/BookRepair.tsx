import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BatteryCharging, Calendar, Camera, Check, CheckCircle2, Cpu, Droplets,
  Headphones, ImagePlus, Loader2, Lock, MapPin, Mic, Pencil, Plug, ShieldCheck, Smartphone, Tablet,
  User, Watch, Wrench, X, Zap,
} from 'lucide-react'
import { deviceBrands } from '../data/repairData'
import { repairService, appendIfFilled, formatRepairError, type RepairService } from '../services/repairService'
import { authService } from '../services/authService'
import { addressService, type AddressData } from '../services/addressService'
import MobileBookRepair from '../components/mobile/MobileBookRepair'
import { useIsMobile } from '../components/mobile/helpers'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import './BookRepair.css'

const issueQuestions: Record<string, string[]> = {
  'Screen Repair': ['Is the glass only cracked or is the display also affected?', 'Is the touch functionality working?', 'Do you have a screen protector installed?', 'Any dead pixels or discoloration?'],
  'Battery Replacement': ['Does the battery drain quickly?', 'Does the phone shut down randomly?', 'Do you notice any battery swelling?', 'How old is the device?'],
  'Water Damage Repair': ['How did the device get wet?', 'When did the water damage occur?', 'Have you tried turning it on since?', 'Did you put it in rice?'],
  'Camera Repair': ['Is the camera not opening, showing blurry images, or physically broken?', 'Is it the front or back camera?', 'Does the flash work?', 'Is there any physical damage to the lens?'],
  'Charging Port Fix': ['Does the charger not fit properly?', 'Does it charge intermittently?', 'Have you tried a different cable and adapter?', 'Is there any debris visible in the port?'],
  'Speaker & Mic Repair': ['Is the speaker not working or is the sound distorted?', 'Is the microphone not working during calls?', 'Does the earpiece work?', 'Did this happen after a drop or water exposure?'],
  'Software Unlocking': ['What type of lock? (iCloud / FRP / PIN)', 'Do you have proof of purchase?', 'Is the device signed into any account?', 'Can you access the settings menu?'],
  'Motherboard Repair': ['Does the phone turn on at all?', 'Any signs of water damage?', 'Has it been repaired before?', 'Does it show any signs of life (vibration, LED)?'],
}
const defaultQuestions = ['How long has this issue been present?', 'Is the device currently usable?', 'Any previous repairs done?']

const DEVICE_TYPES = [
  { id: 'Phone', title: 'Phone Repair', desc: 'Screen, battery, charging & more', icon: Smartphone },
  { id: 'Tablet', title: 'Tablet Repair', desc: 'Display, battery, port & more', icon: Tablet },
  { id: 'Smartwatch', title: 'Smartwatch Repair', desc: 'Screen, battery & more', icon: Watch },
  { id: 'Audio Device', title: 'Audio Device Repair', desc: 'Earbuds, headphones & more', icon: Headphones },
]

const ISSUE_ICONS: [RegExp, typeof Wrench][] = [
  [/screen|display/i, Smartphone], [/battery/i, BatteryCharging], [/water/i, Droplets], [/camera/i, Camera],
  [/charg|port/i, Plug], [/speaker|mic|audio/i, Mic], [/unlock|software/i, Lock], [/board/i, Cpu],
]
const issueIcon = (name: string) => ISSUE_ICONS.find(([re]) => re.test(name))?.[1] || Wrench

const STEPS = [
  { title: 'Repair Details', desc: 'Tell us the issue' },
  { title: 'Device Information', desc: 'Add your device details' },
  { title: 'Your Details', desc: 'Contact & pickup info' },
  { title: 'Review & Confirm', desc: 'Check and book your repair' },
]

const WARRANTY_OPTIONS = [
  { value: 'in_warranty', label: 'In Warranty' },
  { value: 'out_of_warranty', label: 'Out of Warranty' },
  { value: 'expired', label: 'Expired' },
]

const MAX_ISSUE = 500

// Module-level so inputs keep focus between keystrokes.
function Field({ label, error, optional, wide, children }: { label: string; error?: string; optional?: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`br-field${wide ? ' is-wide' : ''}${error ? ' has-error' : ''}`}>
      <label>{label}{optional ? <span> (optional)</span> : <em> *</em>}</label>
      {children}
      {error && <p className="br-err">{error}</p>}
    </div>
  )
}

export default function BookRepair() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileBookRepair /> : <DesktopBookRepair />
}

function DesktopBookRepair() {
  const { issue } = useParams()
  const decodedIssue = issue ? decodeURIComponent(issue) : ''

  const [step, setStep] = useState(1)
  const [deviceType, setDeviceType] = useState('Phone')
  const [selectedIssue, setSelectedIssue] = useState(decodedIssue)
  const [routeIssue, setRouteIssue] = useState(decodedIssue)
  const [issueText, setIssueText] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [imei, setImei] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [deviceColor, setDeviceColor] = useState('')
  const [warranty, setWarranty] = useState('unknown')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState<{ repairId: string; ticketId: number } | null>(null)
  const [services, setServices] = useState<RepairService[]>([])
  const [savedAddresses, setSavedAddresses] = useState<AddressData[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const topRef = useRef<HTMLDivElement>(null)

  // Follow /book-repair/:issue when the link changes.
  if (decodedIssue !== routeIssue) {
    setRouteIssue(decodedIssue)
    setSelectedIssue(decodedIssue)
  }

  useEffect(() => {
    repairService.getServices().then(setServices).catch(() => {})
  }, [])

  // Signed-in customers shouldn't retype what we already know.
  useEffect(() => {
    if (!authService.isAuthenticated()) return
    let alive = true
    addressService.list().then((list) => { if (alive) setSavedAddresses(list) }).catch(() => {})
    authService.getProfile({ skipAuthRedirect: true }).then((p) => {
      if (!alive) return
      setName((v) => v || p.fullName || '')
      setEmail((v) => v || p.email || '')
      setMobile((v) => v || (p.mobile || '').replace(/\D/g, '').slice(-10))
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const urls = imageFiles.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [imageFiles])

  const activeServices = services.filter((s) => s.is_active)
  const issueOptions = activeServices.length ? activeServices.map((s) => s.name) : Object.keys(issueQuestions)
  const matchedService = services.find((s) =>
    s.slug.toLowerCase() === selectedIssue.toLowerCase() || s.name.toLowerCase() === selectedIssue.toLowerCase())
  const questions = issueQuestions[selectedIssue] || defaultQuestions

  const clearError = (key: string) => setErrors((p) => (p[key] ? { ...p, [key]: '' } : p))

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {}
    if (s === 1) {
      if (!selectedIssue) e.issue = 'Please choose the problem'
      if (issueText.trim().length < 10) e.issueText = 'Please describe the problem (at least 10 characters)'
    }
    if (s === 2) {
      if (!brand) e.brand = 'Please select a brand'
      if (!model.trim()) e.model = 'Model is required'
      if (imei.trim() && !/^\d{15}$/.test(imei.trim())) e.imei = 'IMEI must be exactly 15 digits'
      if (!serialNumber.trim()) e.serialNumber = 'Serial number is required'
      if (!deviceColor.trim()) e.deviceColor = 'Color is required'
      if (warranty === 'unknown') e.warranty = 'Please select warranty status'
    }
    if (s === 3) {
      if (name.trim().length < 2) e.name = 'Name must be at least 2 characters'
      if (!/^\d{10}$/.test(mobile.replace(/\D/g, ''))) e.mobile = 'Enter a valid 10-digit number'
      if (!email.trim()) e.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email'
      if (!address.trim()) e.address = 'Address is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const goTo = (s: number) => { setErrors({}); setStep(s); scrollTop() }
  const goNext = () => { if (validateStep(step)) goTo(step + 1) }
  // Steps already passed can be revisited from the sidebar.
  const jumpTo = (s: number) => { if (s < step) goTo(s) }

  const applySavedAddress = (a: AddressData) => {
    setName(a.fullName)
    setMobile(a.mobile.replace(/\D/g, '').slice(-10))
    setAddress([a.addressLine1, a.addressLine2, a.landmark && `Near ${a.landmark}`, `${a.city}, ${a.state} - ${a.zipCode}`].filter(Boolean).join(', '))
    setErrors((p) => ({ ...p, name: '', mobile: '', address: '' }))
  }

  const chooseIssue = (value: string) => {
    if (value !== selectedIssue) setAnswers({})
    setSelectedIssue(value)
    clearError('issue')
  }

  const buildDescription = () => {
    const lines = [`Device type: ${deviceType}`, issueText.trim()]
    questions.forEach((q) => { const a = answers[q]?.trim(); if (a) lines.push(`Q: ${q}\nA: ${a}`) })
    return lines.join('\n')
  }

  const handleSubmit = async () => {
    for (const s of [1, 2, 3]) {
      if (!validateStep(s)) { goTo(s); validateStep(s); return }
    }
    setSubmitting(true); setSubmitError('')
    try {
      const fd = new FormData()
      if (matchedService) fd.append('service_id', String(matchedService.id))
      fd.append('customer_name', name.trim())
      fd.append('customer_mobile', mobile.trim())
      fd.append('customer_email', email.trim())
      fd.append('customer_address', address.trim())
      fd.append('device_category', selectedIssue || 'Other')
      fd.append('device_brand', brand)
      fd.append('device_model', model.trim())
      appendIfFilled(fd, 'imei_number', imei.trim())
      fd.append('serial_number', serialNumber.trim())
      fd.append('device_color', deviceColor.trim())
      fd.append('warranty_status', warranty)
      fd.append('issue_category', selectedIssue || 'Other')
      fd.append('problem_description', buildDescription())
      fd.append('priority', 'medium')
      fd.append('source', 'online')
      imageFiles.forEach((file) => fd.append('photos', file))
      const created = await repairService.create(fd)
      setResult({ repairId: created.repairId, ticketId: created.id })
      scrollTop()
    } catch (err: any) {
      setSubmitError(formatRepairError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const header = (
    <>
      <section className="br-hero">
        <div className="br-hero-text">
          <h1>Book a Repair</h1>
          <p>Get your device fixed by certified experts. Quick, reliable and hassle-free.</p>
          <ul>
            <li><ShieldCheck aria-hidden="true" /> Certified Technicians</li>
            <li><Zap aria-hidden="true" /> Genuine Parts</li>
            <li><Calendar aria-hidden="true" /> Quick Turnaround</li>
          </ul>
        </div>
        <div className="br-hero-art" aria-hidden="true">
          <span className="br-hero-wave" />
          <span className="br-hero-phone"><span /><span /><span /></span>
          <span className="br-hero-tool"><Wrench /></span>
        </div>
      </section>
    </>
  )

  if (result) {
    return (
      <div className="br-page">
        <SiteTopNav />
        <main className="br-wrap" ref={topRef}>
          {header}
          <section className="br-card br-success">
            <span className="br-success-icon"><CheckCircle2 aria-hidden="true" /></span>
            <h2>Booking Confirmed!</h2>
            <p>Your repair request has been submitted. Our team will call you shortly to confirm the pickup.</p>
            <div className="br-success-id">
              <span>Your Tracking ID</span>
              <strong>{result.repairId}</strong>
              <small>Save this ID to track your repair status.</small>
            </div>
            <div className="br-success-actions">
              <Link to={`/my-repairs/${result.ticketId}`} className="br-btn br-btn--primary">Track My Repair <ArrowRight aria-hidden="true" /></Link>
              <Link to="/repairs" className="br-btn br-btn--ghost">Book Another</Link>
            </div>
          </section>
        </main>
      </div>
    )
  }

  const warrantyLabel = WARRANTY_OPTIONS.find((w) => w.value === warranty)?.label || '—'
  const StepIcon = [Wrench, Smartphone, User, CheckCircle2][step - 1]

  return (
    <div className="br-page">
      <SiteTopNav />
      <main className="br-wrap" ref={topRef}>
        {header}

        <div className="br-grid">
          {/* ── Sidebar ── */}
          <aside className="br-side">
            <ol className="br-steps">
              {STEPS.map((s, i) => {
                const n = i + 1
                const state = n < step ? 'done' : n === step ? 'current' : 'todo'
                return (
                  <li key={s.title} className={`is-${state}`}>
                    <button type="button" onClick={() => jumpTo(n)} disabled={n >= step} aria-current={state === 'current' ? 'step' : undefined}>
                      <span className="br-step-num">{state === 'done' ? <Check aria-hidden="true" /> : n}</span>
                      <span className="br-step-text"><b>{s.title}</b><small>{s.desc}</small></span>
                    </button>
                  </li>
                )
              })}
            </ol>

            <div className="br-why">
              <div className="br-why-head">
                <span className="br-why-art" aria-hidden="true"><Smartphone /><Wrench /></span>
                <h3>Why repair with PhoneFix?</h3>
              </div>
              <ul>
                <li><Check aria-hidden="true" /> Expert &amp; certified technicians</li>
                <li><Check aria-hidden="true" /> Original &amp; high-quality parts</li>
                <li><Check aria-hidden="true" /> Transparent pricing</li>
                <li><Check aria-hidden="true" /> Warranty on repairs</li>
              </ul>
            </div>
          </aside>

          {/* ── Form ── */}
          <section className="br-card br-form">
            <header className="br-form-head">
              <span className="br-form-icon"><StepIcon aria-hidden="true" /></span>
              <div>
                <h2>{STEPS[step - 1].title}</h2>
                <p>{['Let’s get started with your repair request.', 'Tell us about the device that needs fixing.', 'Where should we pick up and return your device?', 'Check everything before you book.'][step - 1]}</p>
              </div>
              <span className="br-form-count">Step {step} of {STEPS.length}</span>
            </header>

            <div className="br-form-body" key={step}>
              {step === 1 && (
                <>
                  <h3 className="br-label">Select a repair service</h3>
                  <div className="br-types" role="radiogroup" aria-label="Device type">
                    {DEVICE_TYPES.map(({ id, title, desc, icon: Icon }) => (
                      <button key={id} type="button" role="radio" aria-checked={deviceType === id} className={`br-type${deviceType === id ? ' is-active' : ''}`} onClick={() => setDeviceType(id)}>
                        <span className="br-type-icon"><Icon aria-hidden="true" /></span>
                        <b>{title}</b>
                        <small>{desc}</small>
                        {deviceType === id && <span className="br-type-check"><Check aria-hidden="true" /></span>}
                      </button>
                    ))}
                  </div>

                  <h3 className="br-label">What’s the problem? <em>*</em></h3>
                  <div className={`br-issues${errors.issue ? ' has-error' : ''}`} role="radiogroup" aria-label="Problem">
                    {issueOptions.map((opt) => {
                      const Icon = issueIcon(opt)
                      const svc = activeServices.find((s) => s.name === opt)
                      return (
                        <button key={opt} type="button" role="radio" aria-checked={selectedIssue === opt} className={selectedIssue === opt ? 'is-active' : ''} onClick={() => chooseIssue(opt)}>
                          <Icon aria-hidden="true" />
                          <span>{opt}</span>
                          {svc && svc.estimated_price > 0 && <small>from ₹{Number(svc.estimated_price).toLocaleString('en-IN')}</small>}
                        </button>
                      )
                    })}
                    {!issueOptions.includes('Other') && (
                      <button type="button" role="radio" aria-checked={selectedIssue === 'Other'} className={selectedIssue === 'Other' ? 'is-active' : ''} onClick={() => chooseIssue('Other')}>
                        <Wrench aria-hidden="true" /><span>Something else</span>
                      </button>
                    )}
                  </div>
                  {errors.issue && <p className="br-err">{errors.issue}</p>}

                  <h3 className="br-label">What issue are you facing? <em>*</em></h3>
                  <div className={`br-textarea${errors.issueText ? ' has-error' : ''}`}>
                    <textarea
                      value={issueText}
                      maxLength={MAX_ISSUE}
                      rows={4}
                      placeholder="Describe the problem in detail (e.g., screen cracked, battery not charging, etc.)"
                      onChange={(e) => { setIssueText(e.target.value); if (e.target.value.trim().length >= 10) clearError('issueText') }}
                    />
                    <span>{issueText.length} / {MAX_ISSUE}</span>
                  </div>
                  {errors.issueText && <p className="br-err">{errors.issueText}</p>}

                  {selectedIssue && (
                    <details className="br-questions">
                      <summary>Help our technician with a few quick answers <span>(optional)</span></summary>
                      <div>
                        {questions.map((q) => (
                          <label key={q}>
                            <span>{q}</span>
                            <input value={answers[q] || ''} onChange={(e) => setAnswers((p) => ({ ...p, [q]: e.target.value }))} placeholder="Your answer" />
                          </label>
                        ))}
                      </div>
                    </details>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <h3 className="br-label">Brand <em>*</em></h3>
                  <div className={`br-brands${errors.brand ? ' has-error' : ''}`} role="radiogroup" aria-label="Brand">
                    {[...deviceBrands, 'Other'].map((b) => (
                      <button key={b} type="button" role="radio" aria-checked={brand === b} className={brand === b ? 'is-active' : ''} onClick={() => { setBrand(b); clearError('brand') }}>{b}</button>
                    ))}
                  </div>
                  {errors.brand && <p className="br-err">{errors.brand}</p>}

                  <div className="br-fields">
                    <Field label="Model" error={errors.model}>
                      <input value={model} placeholder="e.g. iPhone 15 Pro" onChange={(e) => { setModel(e.target.value); clearError('model') }} />
                    </Field>
                    <Field label="Device Color" error={errors.deviceColor}>
                      <input value={deviceColor} placeholder="e.g. Space Black" onChange={(e) => { setDeviceColor(e.target.value); clearError('deviceColor') }} />
                    </Field>
                    <Field label="IMEI Number" optional error={errors.imei}>
                      <input value={imei} inputMode="numeric" placeholder="15-digit IMEI (dial *#06#)" onChange={(e) => { setImei(e.target.value.replace(/\D/g, '').slice(0, 15)); clearError('imei') }} />
                    </Field>
                    <Field label="Serial Number" error={errors.serialNumber}>
                      <input value={serialNumber} placeholder="Settings › About phone" onChange={(e) => { setSerialNumber(e.target.value); clearError('serialNumber') }} />
                    </Field>
                    <Field label="Warranty Status" wide error={errors.warranty}>
                      <div className="br-segment" role="radiogroup" aria-label="Warranty status">
                        {WARRANTY_OPTIONS.map((w) => (
                          <button key={w.value} type="button" role="radio" aria-checked={warranty === w.value} className={warranty === w.value ? 'is-active' : ''} onClick={() => { setWarranty(w.value); clearError('warranty') }}>{w.label}</button>
                        ))}
                      </div>
                    </Field>
                  </div>

                  <h3 className="br-label">Device Photos <span className="br-opt">(optional)</span></h3>
                  <button type="button" className="br-upload" onClick={() => fileRef.current?.click()}>
                    <ImagePlus aria-hidden="true" />
                    <b>Click to upload photos</b>
                    <small>Show the damaged area for a faster diagnosis. PNG, JPG, HEIC supported.</small>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => { if (e.target.files) setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]); e.target.value = '' }}
                  />
                  {previews.length > 0 && (
                    <div className="br-previews">
                      {previews.map((url, i) => (
                        <div key={url}>
                          <img src={url} alt={`Photo ${i + 1}`} />
                          <button type="button" onClick={() => setImageFiles((f) => f.filter((_, j) => j !== i))} aria-label={`Remove photo ${i + 1}`}><X /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  {savedAddresses.length > 0 && (
                    <div className="br-saved">
                      <span>Use a saved address:</span>
                      {savedAddresses.slice(0, 3).map((a) => (
                        <button key={a.id} type="button" onClick={() => applySavedAddress(a)}>
                          <MapPin aria-hidden="true" /> {a.addressType} · {a.city}{a.isDefault ? ' (default)' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="br-fields">
                    <Field label="Full Name" wide error={errors.name}>
                      <input value={name} autoComplete="name" placeholder="Your full name" onChange={(e) => { setName(e.target.value); clearError('name') }} />
                    </Field>
                    <Field label="Mobile Number" error={errors.mobile}>
                      <div className="br-prefix"><span>+91</span><input value={mobile} inputMode="tel" autoComplete="tel-national" placeholder="10-digit number" onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); clearError('mobile') }} /></div>
                    </Field>
                    <Field label="Email Address" error={errors.email}>
                      <input value={email} type="email" autoComplete="email" placeholder="email@example.com" onChange={(e) => { setEmail(e.target.value); clearError('email') }} />
                    </Field>
                    <Field label="Pickup / Delivery Address" wide error={errors.address}>
                      <textarea value={address} rows={3} autoComplete="street-address" placeholder="House no., street, area, city and pincode" onChange={(e) => { setAddress(e.target.value); clearError('address') }} />
                    </Field>
                  </div>
                </>
              )}

              {step === 4 && (
                <div className="br-review">
                  <div className="br-review-card">
                    <header><b>Repair Details</b><button type="button" onClick={() => goTo(1)}><Pencil aria-hidden="true" /> Edit</button></header>
                    <dl>
                      <div><dt>Device type</dt><dd>{deviceType}</dd></div>
                      <div><dt>Problem</dt><dd>{selectedIssue === 'Other' ? 'Something else' : selectedIssue}</dd></div>
                      <div className="is-wide"><dt>Description</dt><dd>{issueText}</dd></div>
                    </dl>
                  </div>
                  <div className="br-review-card">
                    <header><b>Device Information</b><button type="button" onClick={() => goTo(2)}><Pencil aria-hidden="true" /> Edit</button></header>
                    <dl>
                      <div><dt>Device</dt><dd>{brand} {model}</dd></div>
                      <div><dt>Color</dt><dd>{deviceColor}</dd></div>
                      <div><dt>IMEI</dt><dd>{imei || '—'}</dd></div>
                      <div><dt>Serial No.</dt><dd>{serialNumber}</dd></div>
                      <div><dt>Warranty</dt><dd>{warrantyLabel}</dd></div>
                      <div><dt>Photos</dt><dd>{imageFiles.length ? `${imageFiles.length} attached` : 'None'}</dd></div>
                    </dl>
                  </div>
                  <div className="br-review-card">
                    <header><b>Your Details</b><button type="button" onClick={() => goTo(3)}><Pencil aria-hidden="true" /> Edit</button></header>
                    <dl>
                      <div><dt>Name</dt><dd>{name}</dd></div>
                      <div><dt>Mobile</dt><dd>+91 {mobile}</dd></div>
                      <div><dt>Email</dt><dd>{email}</dd></div>
                      <div className="is-wide"><dt>Pickup address</dt><dd>{address}</dd></div>
                    </dl>
                  </div>
                  {matchedService && (matchedService.estimated_price > 0 || matchedService.estimated_days > 0) && (
                    <div className="br-estimate">
                      <Wrench aria-hidden="true" />
                      <div>
                        <b>{matchedService.name}</b>
                        <span>
                          {matchedService.estimated_price > 0 && <>Estimated from <strong>₹{Number(matchedService.estimated_price).toLocaleString('en-IN')}</strong></>}
                          {matchedService.estimated_price > 0 && matchedService.estimated_days > 0 && ' · '}
                          {matchedService.estimated_days > 0 && <>ready in about {matchedService.estimated_days} day{matchedService.estimated_days > 1 ? 's' : ''}</>}
                        </span>
                        <small>Final price is confirmed after the technician inspects your device.</small>
                      </div>
                    </div>
                  )}
                  {submitError && <p className="br-submit-err" role="alert">{submitError}</p>}
                </div>
              )}
            </div>

            <footer className="br-actions">
              <button type="button" className="br-btn br-btn--ghost" onClick={() => goTo(step - 1)} disabled={step === 1 || submitting}>
                <ArrowLeft aria-hidden="true" /> Back
              </button>
              {step < STEPS.length ? (
                <button type="button" className="br-btn br-btn--primary" onClick={goNext}>
                  Next: {STEPS[step].title} <ArrowRight aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className="br-btn br-btn--primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <><Loader2 aria-hidden="true" className="br-spin" /> Booking…</> : <>Confirm &amp; Book Repair <Check aria-hidden="true" /></>}
                </button>
              )}
            </footer>
          </section>
        </div>
      </main>
    </div>
  )
}

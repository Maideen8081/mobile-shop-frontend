import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUser, FiSmartphone, FiAlertCircle, FiCheckCircle, FiArrowRight, FiArrowLeft, FiSend, FiX, FiImage } from 'react-icons/fi'
import BackBar from '../components/ecommerce/BackBar'
import { deviceBrands } from '../data/repairData'
import { repairService, type RepairService } from '../services/repairService'
import { authService } from '../services/authService'
import { addressService, type AddressData } from '../services/addressService'
import MobileBookRepair from '../components/mobile/MobileBookRepair'
import { useIsMobile } from '../components/mobile/helpers'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'

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

const defaultQuestions = ['Please describe the issue you are facing', 'How long has this issue been present?', 'Is the device currently usable?', 'Any previous repairs done?']

/* Fixed step labels — questions + 3 extra steps (details, device, photos) */
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600,
  color: '#4A403D', marginBottom: 6, letterSpacing: '0.01em',
}

// Defined at module level: a component declared inside the page would be a new
// type on every render, remounting its input and dropping focus after each keystroke.
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <p style={{ fontSize: 'var(--text-caption)', color: '#ef4444', marginTop: 5 }}>{error}</p>}
    </div>
  )
}

const EXTRA_STEPS = ['Your Details', 'Device Info', 'Photos']

export default function BookRepair() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileBookRepair /> : <DesktopBookRepair />
}

function DesktopBookRepair() {
  const { issue } = useParams()
  const decodedIssue = issue ? decodeURIComponent(issue) : ''

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [imei, setImei] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState<{ repairId: string; ticketId: number } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [services, setServices] = useState<RepairService[]>([])
  const [selectedIssue, setSelectedIssue] = useState(decodedIssue)
  const [showServicePicker, setShowServicePicker] = useState(!decodedIssue)
  const [address, setAddress] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [deviceColor, setDeviceColor] = useState('')
  const [warranty, setWarranty] = useState('unknown')
  const inputRef = useRef<HTMLInputElement>(null)

  const questions = issueQuestions[selectedIssue] || defaultQuestions
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ''))

  const totalSteps = questions.length + EXTRA_STEPS.length
  const stepLabels = [
    ...questions.map((_, i) => `Q${i + 1}`),
    ...EXTRA_STEPS,
  ]

  useEffect(() => {
    repairService.getServices().then(setServices).catch(() => {})
  }, [])

  // Signed-in customers shouldn't retype what we already know.
  const [savedAddresses, setSavedAddresses] = useState<AddressData[]>([])
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

  const applySavedAddress = (a: AddressData) => {
    setName(a.fullName)
    setMobile(a.mobile.replace(/\D/g, '').slice(-10))
    setAddress([a.addressLine1, a.addressLine2, a.landmark && `Near ${a.landmark}`, `${a.city}, ${a.state} - ${a.zipCode}`]
      .filter(Boolean).join(', '))
    setErrors((p) => ({ ...p, name: '', mobile: '', address: '' }))
  }

  useEffect(() => {
    setSelectedIssue(decodedIssue)
    setShowServicePicker(!decodedIssue)
  }, [decodedIssue])

  useEffect(() => {
    setAnswers(questions.map(() => ''))
    setStep(1)
    setErrors({})
    setTouched({})
  }, [selectedIssue])

  useEffect(() => {
    const urls = imageFiles.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [imageFiles])

  const matchedService = services.find(s =>
    s.slug.toLowerCase() === selectedIssue.toLowerCase() ||
    s.name.toLowerCase() === selectedIssue.toLowerCase()
  )

  const validateName = (v: string) => v.trim().length < 2 ? 'Name must be at least 2 characters' : ''
  const validateMobile = (v: string) => !/^\d{10}$/.test(v.replace(/\D/g, '')) ? 'Enter a valid 10-digit number' : ''
  const validateEmail = (v: string) => !v.trim() ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email' : ''
  const validateBrand = (v: string) => !v ? 'Please select a brand' : ''
  const validateModel = (v: string) => !v.trim() ? 'Model is required' : ''
  const validateImei = (v: string) => v.trim() && !/^\d{15}$/.test(v.trim()) ? 'IMEI must be exactly 15 digits' : ''

  const validateDetails = () => {
    const e: Record<string, string> = {}
    const ne = validateName(name); if (ne) e.name = ne
    const me = validateMobile(mobile); if (me) e.mobile = me
    const ee = validateEmail(email); if (ee) e.email = ee
    if (!address.trim()) e.address = 'Address is required'
    setErrors(e); setTouched({ name: true, mobile: true, email: true, address: true })
    return Object.keys(e).length === 0
  }

  const validateDevice = () => {
    const e: Record<string, string> = {}
    const be = validateBrand(brand); if (be) e.brand = be
    const me = validateModel(model); if (me) e.model = me
    const ie = validateImei(imei); if (ie) e.imei = ie
    if (!serialNumber.trim()) e.serialNumber = 'Serial number is required'
    if (!deviceColor.trim()) e.deviceColor = 'Color is required'
    if (warranty === 'unknown') e.warranty = 'Please select warranty status'
    setErrors(e); setTouched({ brand: true, model: true, imei: true, serialNumber: true, deviceColor: true, warranty: true })
    return Object.keys(e).length === 0
  }

  const updateAnswer = (idx: number, val: string) => {
    const a = [...answers]; a[idx] = val; setAnswers(a)
  }

  const buildDescription = () => {
    let desc = ''
    answers.forEach((a, i) => { if (a.trim()) desc += `Q: ${questions[i]}\nA: ${a.trim()}\n` })
    return desc.trim()
  }

  const [qErrors, setQErrors] = useState<Record<number, string>>({})

  const goNext = () => {
    if (step <= questions.length) {
      if (!answers[step - 1]?.trim()) { setQErrors({ [step - 1]: 'Please answer this question to continue' }); return }
    }
    if (step === questions.length + 1) { if (!validateDetails()) return }
    if (step === questions.length + 2) { if (!validateDevice()) return }
    setQErrors({})
    setStep(s => s + 1)
  }
  const goPrev = () => { setErrors({}); setTouched({}); setStep(s => Math.max(1, s - 1)) }

  const handleSubmit = async () => {
    if (!validateDetails() || !validateDevice()) return
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
      fd.append('imei_number', imei.trim())
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
    } catch (err: any) {
      const resp = err?.response?.data
      if (resp && typeof resp === 'object' && !resp.message) {
        const msgs = Object.entries(resp).map(([, v]) => Array.isArray(v) ? v[0] : v).filter(Boolean)
        setSubmitError(msgs.join('. ') || 'Validation failed. Please check your input.')
      } else {
        setSubmitError(resp?.message || err?.message || 'Failed to submit. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 15px', borderRadius: 11,
    border: '1.5px solid #ECE4E0', fontSize: 'var(--text-body-sm)', color: '#1B1210',
    background: '#FBF8F6', outline: 'none',
    transition: 'border-color .16s ease, background .16s ease',
    fontFamily: 'var(--font-ui)',
  }

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '11px 22px', borderRadius: 12, fontSize: 'var(--text-label)', fontWeight: 700,
    color: '#fff', background: 'linear-gradient(135deg, #D91E36, #A3122A)',
    border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(217,30,54,0.28)',
    transition: 'transform .16s ease, box-shadow .16s ease',
  }

  const btnGhost: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '11px 20px', borderRadius: 12, fontSize: 'var(--text-label)', fontWeight: 600,
    color: '#4A403D', background: '#F5F0EC', border: '1.5px solid #ECE4E0',
    cursor: 'pointer', transition: 'all .16s ease',
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #ECE4E0', borderRadius: 20,
    padding: '28px 32px', boxShadow: '0 8px 32px -12px rgba(27,18,16,0.12)',
  }

  if (result) {
    return (
      <div style={{ fontFamily: 'var(--font-ui)', background: '#FBF8F6', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
        <SiteTopNav />
        <BackBar label="Back to Repair Services" to="/repairs" />
        <main className="max-w-lg mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(5,150,105,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(5,150,105,0.15)' }}>
              <FiCheckCircle size={40} style={{ color: '#059669' }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading)', fontWeight: 700, color: '#1B1210', marginBottom: 8 }}>Booking Confirmed!</h1>
            <p style={{ fontSize: 'var(--text-body-sm)', color: '#4A403D', marginBottom: 32 }}>Your repair has been submitted successfully. We'll contact you shortly.</p>
            <div style={{ background: '#fff', border: '1px solid #ECE4E0', borderRadius: 20, padding: 28, marginBottom: 28, boxShadow: '0 8px 24px -12px rgba(27,18,16,0.12)' }}>
              <p style={{ fontSize: 'var(--text-micro)', fontWeight: 700, color: '#857D79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Your Tracking ID</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading)', fontWeight: 700, color: '#D91E36', letterSpacing: '0.08em' }}>{result.repairId}</p>
              <p style={{ fontSize: 'var(--text-caption)', color: '#857D79', marginTop: 10 }}>Save this ID to track your repair status.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/my-repairs" style={{ ...btnPrimary, textDecoration: 'none', justifyContent: 'center' }}>
                Track My Repair <FiArrowRight size={15} />
              </Link>
              <Link to="/repairs" style={{ ...btnGhost, textDecoration: 'none', justifyContent: 'center' }}>
                Book Another
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'var(--font-ui)', background: '#FBF8F6', color: '#1B1210', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
      <SiteTopNav />
      <BackBar label="Back to Repair Services" to="/repairs" />

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-16">

        {/* ── Page header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(217,30,54,0.06)', border: '1px solid rgba(217,30,54,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 'var(--text-title)', color: '#D91E36' }}>build</span>
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading)', fontWeight: 700, color: '#1B1210', lineHeight: 1.1 }}>Book a Repair</h1>
              <p style={{ fontSize: 'var(--text-label)', color: '#857D79', marginTop: 2 }}>Complete the steps below to book your repair.</p>
            </div>
          </div>
        </div>

        {/* ── Service selector ── */}
        <div style={{ background: '#fff', border: showServicePicker ? '1.5px solid #D91E36' : '1px solid #ECE4E0', borderRadius: 16, padding: '14px 18px', marginBottom: 24, boxShadow: '0 4px 16px -8px rgba(27,18,16,0.08)', cursor: 'pointer' }}
          onClick={() => setShowServicePicker(v => !v)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 'var(--text-title-sm)', color: '#D91E36' }}>medical_services</span>
              <div>
                <p style={{ fontSize: 'var(--text-micro)', fontWeight: 700, color: '#857D79', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 1 }}>Service Type</p>
                <p style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: selectedIssue ? '#1B1210' : '#857D79' }}>
                  {selectedIssue || 'Select a repair service…'}
                </p>
              </div>
            </div>
            <svg className={`transition-transform duration-200 ${showServicePicker ? 'rotate-180' : ''}`} width="16" height="16" fill="none" stroke="#857D79" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>

          <AnimatePresence>
            {showServicePicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {services.filter(s => s.is_active).map(s => (
                    <button key={s.id} type="button"
                      onClick={() => { setSelectedIssue(s.name); setShowServicePicker(false) }}
                      style={{
                        textAlign: 'left', padding: '10px 14px', fontSize: 'var(--text-label)', fontWeight: 500,
                        borderRadius: 10, border: selectedIssue === s.name ? '1.5px solid #D91E36' : '1px solid #ECE4E0',
                        cursor: 'pointer', transition: 'all .15s ease',
                        background: selectedIssue === s.name ? 'rgba(217,30,54,0.06)' : '#FBF8F6',
                        color: selectedIssue === s.name ? '#D91E36' : '#1B1210',
                        fontFamily: 'var(--font-ui)',
                      }}
                      onMouseEnter={(e) => { if (selectedIssue !== s.name) { e.currentTarget.style.borderColor = 'rgba(217,30,54,0.3)'; e.currentTarget.style.background = 'rgba(217,30,54,0.03)' } }}
                      onMouseLeave={(e) => { if (selectedIssue !== s.name) { e.currentTarget.style.borderColor = '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' } }}
                    >
                      {selectedIssue === s.name && <span style={{ color: '#D91E36', marginRight: 4 }}>✓</span>}
                      {s.name}
                    </button>
                  ))}
                  {services.filter(s => s.is_active).length === 0 && (
                    <p style={{ gridColumn: '1/-1', fontSize: 'var(--text-label)', color: '#857D79', padding: '4px 0' }}>Loading services…</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Step indicator ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
            {stepLabels.map((label, i) => {
              const idx = i + 1
              const done = idx < step
              const active = idx === step
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    height: 4, width: '100%', borderRadius: 10,
                    background: done ? '#22c55e' : active ? '#D91E36' : '#ECE4E0',
                    transition: 'background .3s ease',
                  }} />
                  <span style={{
                    fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: '0.04em',
                    color: done ? '#16a34a' : active ? '#D91E36' : '#C4BBB8',
                    textTransform: 'uppercase',
                    transition: 'color .3s ease',
                  }}>{label}</span>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 'var(--text-caption)', color: '#857D79', fontWeight: 500 }}>
            Step {step} of {totalSteps} —{' '}
            <span style={{ color: '#1B1210', fontWeight: 600 }}>{stepLabels[step - 1]}</span>
          </p>
        </div>

        {/* ── Form steps ── */}
        <AnimatePresence mode="wait">
          {/* Question steps */}
          {step <= questions.length ? (
            <motion.div key={`q-${step}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(217,30,54,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 'var(--text-caption)', fontWeight: 800, color: '#D91E36' }}>{step}</span>
                </div>
                <span style={{ fontSize: 'var(--text-micro)', fontWeight: 700, color: '#D91E36', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Question {step} of {questions.length}
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: '#1B1210', margin: '14px 0 16px', lineHeight: 1.4 }}>{questions[step - 1]}</p>
              <textarea
                value={answers[step - 1]}
                onChange={(e) => { updateAnswer(step - 1, e.target.value); if (qErrors[step - 1] && e.target.value.trim()) setQErrors(p => { const n = { ...p }; delete n[step - 1]; return n }) }}
                rows={4}
                style={{ ...inputStyle, height: 'auto', padding: '13px 16px', resize: 'none', borderColor: qErrors[step - 1] ? '#ef4444' : '#ECE4E0' }}
                placeholder="Type your answer here…"
                autoFocus
                onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = qErrors[step - 1] ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
              />
              {qErrors[step - 1] && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 'var(--text-caption)', color: '#ef4444' }}>
                  <FiAlertCircle size={13} /> {qErrors[step - 1]}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
                <button onClick={goPrev} disabled={step === 1}
                  style={{ ...btnGhost, opacity: step === 1 ? 0.4 : 1, cursor: step === 1 ? 'not-allowed' : 'pointer' }}>
                  <FiArrowLeft size={14} /> Back
                </button>
                <button onClick={goNext} style={btnPrimary}>
                  {step < questions.length ? 'Next' : 'Continue'} <FiArrowRight size={14} />
                </button>
              </div>
            </motion.div>

          ) : step === questions.length + 1 ? (
            /* Your Details */
            <motion.div key="details" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(217,30,54,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiUser size={16} style={{ color: '#D91E36' }} />
                </div>
                <span style={{ fontSize: 'var(--text-body)', fontWeight: 700, color: '#1B1210' }}>Your Details</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Full Name *" error={touched.name ? errors.name : undefined}>
                  <input value={name} autoFocus autoComplete="name"
                    onChange={(e) => { setName(e.target.value); if (touched.name) setErrors(p => ({ ...p, name: validateName(e.target.value) })) }}
                    onBlur={() => { setTouched(p => ({ ...p, name: true })); setErrors(p => ({ ...p, name: validateName(name) })) }}
                    style={{ ...inputStyle, borderColor: touched.name && errors.name ? '#ef4444' : '#ECE4E0' }}
                    placeholder="Your full name"
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.name && errors.name ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                  />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Mobile Number *" error={touched.mobile ? errors.mobile : undefined}>
                    <input value={mobile} placeholder="10-digit number" inputMode="tel" autoComplete="tel-national"
                      onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setMobile(v); if (touched.mobile) setErrors(p => ({ ...p, mobile: validateMobile(v) })) }}
                      onBlur={() => { setTouched(p => ({ ...p, mobile: true })); setErrors(p => ({ ...p, mobile: validateMobile(mobile) })) }}
                      style={{ ...inputStyle, borderColor: touched.mobile && errors.mobile ? '#ef4444' : '#ECE4E0' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                      onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.mobile && errors.mobile ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                    />
                  </Field>
                  <Field label="Email Address *" error={touched.email ? errors.email : undefined}>
                    <input value={email} type="email" placeholder="email@example.com" autoComplete="email"
                      onChange={(e) => { setEmail(e.target.value); if (touched.email) setErrors(p => ({ ...p, email: validateEmail(e.target.value) })) }}
                      onBlur={() => { setTouched(p => ({ ...p, email: true })); setErrors(p => ({ ...p, email: validateEmail(email) })) }}
                      style={{ ...inputStyle, borderColor: touched.email && errors.email ? '#ef4444' : '#ECE4E0' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                      onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.email && errors.email ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                    />
                  </Field>
                </div>
                <Field label="Pickup / Delivery Address *" error={touched.address ? errors.address : undefined}>
                  {savedAddresses.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 'var(--text-caption)', color: '#857D79' }}>Use a saved address:</span>
                      {savedAddresses.slice(0, 3).map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => applySavedAddress(a)}
                          style={{ fontSize: 'var(--text-caption)', fontWeight: 600, padding: '5px 11px', borderRadius: 999, border: '1.5px solid #ECE4E0', background: '#fff', color: '#4A403D', cursor: 'pointer' }}
                        >
                          {a.addressType} · {a.city}{a.isDefault ? ' (default)' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea value={address} rows={3} autoComplete="street-address" placeholder="House no., street, area, city and pincode"
                    onChange={(e) => { setAddress(e.target.value); if (touched.address) setErrors(p => ({ ...p, address: !e.target.value.trim() ? 'Address is required' : '' })) }}
                    onBlur={() => { setTouched(p => ({ ...p, address: true })); if (!address.trim()) setErrors(p => ({ ...p, address: 'Address is required' })) }}
                    style={{ ...inputStyle, height: 'auto', padding: '11px 15px', resize: 'none', borderColor: touched.address && errors.address ? '#ef4444' : '#ECE4E0' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.address && errors.address ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                  />
                </Field>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
                <button onClick={goPrev} style={btnGhost}><FiArrowLeft size={14} /> Back</button>
                <button onClick={goNext} style={btnPrimary}>Next <FiArrowRight size={14} /></button>
              </div>
            </motion.div>

          ) : step === questions.length + 2 ? (
            /* Device Info */
            <motion.div key="device" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(217,30,54,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiSmartphone size={16} style={{ color: '#D91E36' }} />
                </div>
                <span style={{ fontSize: 'var(--text-body)', fontWeight: 700, color: '#1B1210' }}>Device Information</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Brand *" error={touched.brand ? errors.brand : undefined}>
                    <select value={brand} autoFocus
                      onChange={(e) => { setBrand(e.target.value); if (touched.brand) setErrors(p => ({ ...p, brand: validateBrand(e.target.value) })) }}
                      onBlur={() => { setTouched(p => ({ ...p, brand: true })); setErrors(p => ({ ...p, brand: validateBrand(brand) })) }}
                      style={{ ...inputStyle, appearance: 'none' as const, cursor: 'pointer', borderColor: touched.brand && errors.brand ? '#ef4444' : '#ECE4E0' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                      onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.brand && errors.brand ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                    >
                      <option value="">Select brand</option>
                      {deviceBrands.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
                  <Field label="Model *" error={touched.model ? errors.model : undefined}>
                    <input value={model} placeholder="e.g. iPhone 15 Pro"
                      onChange={(e) => { setModel(e.target.value); if (touched.model) setErrors(p => ({ ...p, model: validateModel(e.target.value) })) }}
                      onBlur={() => { setTouched(p => ({ ...p, model: true })); setErrors(p => ({ ...p, model: validateModel(model) })) }}
                      style={{ ...inputStyle, borderColor: touched.model && errors.model ? '#ef4444' : '#ECE4E0' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                      onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.model && errors.model ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                    />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="IMEI Number *" error={touched.imei ? errors.imei : undefined}>
                    <input value={imei} placeholder="15-digit IMEI"
                      onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 15); setImei(v); if (touched.imei) setErrors(p => ({ ...p, imei: validateImei(v) })) }}
                      onBlur={() => { setTouched(p => ({ ...p, imei: true })); setErrors(p => ({ ...p, imei: validateImei(imei) })) }}
                      style={{ ...inputStyle, borderColor: touched.imei && errors.imei ? '#ef4444' : '#ECE4E0' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                      onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.imei && errors.imei ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                    />
                  </Field>
                  <Field label="Serial No. *" error={touched.serialNumber ? errors.serialNumber : undefined}>
                    <input value={serialNumber} placeholder="Device serial number"
                      onChange={(e) => { setSerialNumber(e.target.value); if (touched.serialNumber) setErrors(p => ({ ...p, serialNumber: !e.target.value.trim() ? 'Serial number is required' : '' })) }}
                      onBlur={() => { setTouched(p => ({ ...p, serialNumber: true })); if (!serialNumber.trim()) setErrors(p => ({ ...p, serialNumber: 'Serial number is required' })) }}
                      style={{ ...inputStyle, borderColor: touched.serialNumber && errors.serialNumber ? '#ef4444' : '#ECE4E0' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                      onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.serialNumber && errors.serialNumber ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                    />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Device Color *" error={touched.deviceColor ? errors.deviceColor : undefined}>
                    <input value={deviceColor} placeholder="e.g. Space Black"
                      onChange={(e) => { setDeviceColor(e.target.value); if (touched.deviceColor) setErrors(p => ({ ...p, deviceColor: !e.target.value.trim() ? 'Color is required' : '' })) }}
                      onBlur={() => { setTouched(p => ({ ...p, deviceColor: true })); if (!deviceColor.trim()) setErrors(p => ({ ...p, deviceColor: 'Color is required' })) }}
                      style={{ ...inputStyle, borderColor: touched.deviceColor && errors.deviceColor ? '#ef4444' : '#ECE4E0' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                      onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.deviceColor && errors.deviceColor ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                    />
                  </Field>
                  <Field label="Warranty Status *" error={touched.warranty ? errors.warranty : undefined}>
                    <select value={warranty}
                      onChange={(e) => { setWarranty(e.target.value); if (touched.warranty) setErrors(p => ({ ...p, warranty: e.target.value === 'unknown' ? 'Please select warranty status' : '' })) }}
                      onBlur={() => { setTouched(p => ({ ...p, warranty: true })); if (warranty === 'unknown') setErrors(p => ({ ...p, warranty: 'Please select warranty status' })) }}
                      style={{ ...inputStyle, appearance: 'none' as const, cursor: 'pointer', borderColor: touched.warranty && errors.warranty ? '#ef4444' : '#ECE4E0', color: warranty === 'unknown' ? '#857D79' : '#1B1210' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                      onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.warranty && errors.warranty ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                    >
                      <option value="unknown" disabled>Select status</option>
                      <option value="in_warranty">In Warranty</option>
                      <option value="out_of_warranty">Out of Warranty</option>
                      <option value="expired">Expired</option>
                    </select>
                  </Field>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
                <button onClick={goPrev} style={btnGhost}><FiArrowLeft size={14} /> Back</button>
                <button onClick={goNext} style={btnPrimary}>Next <FiArrowRight size={14} /></button>
              </div>
            </motion.div>

          ) : (
            /* Photos */
            <motion.div key="photos" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(217,30,54,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiImage size={16} style={{ color: '#D91E36' }} />
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-body)', fontWeight: 700, color: '#1B1210' }}>Device Photos</span>
                  <span style={{ fontSize: 'var(--text-caption)', color: '#857D79', marginLeft: 8, fontWeight: 400 }}>(optional)</span>
                </div>
              </div>

              <div
                onClick={() => inputRef.current?.click()}
                style={{ borderRadius: 14, border: '1.5px dashed rgba(217,30,54,0.22)', padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: '#FBF8F6', transition: 'all .18s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(217,30,54,0.45)'; e.currentTarget.style.background = 'rgba(217,30,54,0.02)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(217,30,54,0.22)'; e.currentTarget.style.background = '#FBF8F6' }}
              >
                <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => { if (e.target.files) setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]) }} />
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(217,30,54,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <FiImage size={20} style={{ color: '#D91E36' }} />
                </div>
                <p style={{ fontSize: 'var(--text-label)', fontWeight: 600, color: '#1B1210', marginBottom: 4 }}>Click to upload photos</p>
                <p style={{ fontSize: 'var(--text-caption)', color: '#857D79' }}>Show the damage area for faster diagnosis. PNG, JPG, HEIC supported.</p>
              </div>

              {previews.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
                  {previews.map((url, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden', border: '1px solid #ECE4E0' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => { URL.revokeObjectURL(url); setImageFiles(f => f.filter((_, j) => j !== i)) }}
                        style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 6, background: 'rgba(239,68,68,0.85)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                        <FiX size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {submitError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 11, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 'var(--text-label)', color: '#ef4444', marginTop: 14 }}>
                  <FiAlertCircle size={14} /> {submitError}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
                <button onClick={goPrev} style={btnGhost}><FiArrowLeft size={14} /> Back</button>
                <button onClick={handleSubmit} disabled={submitting}
                  style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer', background: submitting ? 'linear-gradient(135deg,#9CA3AF,#6B7280)' : 'linear-gradient(135deg,#D91E36,#A3122A)' }}>
                  {submitting
                    ? <><span className="material-symbols-outlined" style={{ fontSize: 'var(--text-body)', animation: 'spin 1s linear infinite' }}>progress_activity</span> Booking…</>
                    : <><FiSend size={14} /> Book Now</>
                  }
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </main>

    </div>
  )
}

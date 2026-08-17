import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUser, FiSmartphone, FiAlertCircle, FiCheckCircle, FiArrowRight, FiArrowLeft, FiSend, FiX, FiImage, FiEdit3 } from 'react-icons/fi'
import BackBar from '../components/ecommerce/BackBar'
import EcommerceFooter from '../components/ecommerce/Footer'
import { deviceBrands } from '../data/repairData'
import { repairService, type RepairService } from '../services/repairService'
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

const stepLabels = ['Questions', 'Your Details', 'Device Info', 'Photos', 'Done']

export default function BookRepair() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileBookRepair />
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
  const [showServicePicker, setShowServicePicker] = useState(false)
  const [address, setAddress] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [deviceColor, setDeviceColor] = useState('')
  const [warranty, setWarranty] = useState('unknown')
  const inputRef = useRef<HTMLInputElement>(null)

  const questions = issueQuestions[selectedIssue] || defaultQuestions
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ''))

  const totalSteps = questions.length + 4

  useEffect(() => {
    repairService.getServices().then(setServices).catch(() => {})
  }, [])

  useEffect(() => {
    setSelectedIssue(decodedIssue)
  }, [decodedIssue])

  useEffect(() => {
    setAnswers(questions.map(() => '')); setStep(1); setErrors({}); setTouched({})
  }, [selectedIssue])

  const matchedService = services.find(s =>
    s.slug.toLowerCase() === selectedIssue.toLowerCase() ||
    s.name.toLowerCase() === selectedIssue.toLowerCase()
  )

  const validateName = (v: string) => v.trim().length < 2 ? 'Name must be at least 2 characters' : ''
  const validateMobile = (v: string) => !/^\d{10}$/.test(v.replace(/\D/g, '')) ? 'Enter a valid 10-digit mobile number' : ''
  const validateEmail = (v: string) => !v.trim() ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email address' : ''
  const validateBrand = (v: string) => !v ? 'Please select a brand' : ''
  const validateModel = (v: string) => !v.trim() ? 'Model is required' : ''
  const validateImei = (v: string) => v.trim() && !/^\d{15}$/.test(v.trim()) ? 'IMEI must be exactly 15 digits' : ''

  const validateDetails = () => {
    const e: Record<string, string> = {}
    const ne = validateName(name); if (ne) e.name = ne
    const me = validateMobile(mobile); if (me) e.mobile = me
    const ee = validateEmail(email); if (ee) e.email = ee
    if (!address.trim()) e.address = 'Address is required'
    setErrors(e)
    setTouched({ name: true, mobile: true, email: true, address: true })
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
    setErrors(e)
    setTouched({ brand: true, model: true, imei: true, serialNumber: true, deviceColor: true, warranty: true })
    return Object.keys(e).length === 0
  }

  useEffect(() => {
    const urls = imageFiles.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [imageFiles])

  const updateAnswer = (idx: number, val: string) => {
    const a = [...answers]; a[idx] = val; setAnswers(a)
  }

  const buildDescription = () => {
    let desc = ''
    answers.forEach((a, i) => {
      if (a.trim()) desc += `Q: ${questions[i]}\nA: ${a.trim()}\n`
    })
    return desc.trim()
  }

  const [qErrors, setQErrors] = useState<Record<number, string>>({})

  const goNext = () => {
    if (step <= questions.length) {
      if (!answers[step - 1]?.trim()) { setQErrors({ [step - 1]: 'Please answer this question' }); return }
    }
    if (step === questions.length + 1) { if (!validateDetails()) return }
    if (step === questions.length + 2) { if (!validateDevice()) return }
    setQErrors({})
    setStep(s => s + 1)
  }
  const goPrev = () => { setErrors({}); setTouched({}); setStep(s => Math.max(1, s - 1)) }

  const handleSubmit = async () => {
    if (!validateDetails() || !validateDevice()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const fd = new FormData()
      if (matchedService) {
        fd.append('service_id', String(matchedService.id))
      }
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
      console.log('[BookRepair] Submitting booking:', {
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        device: `${brand} ${model.trim()}`,
        issue: selectedIssue || 'Other',
        address: address.trim(),
        serialNumber: serialNumber.trim(),
        deviceColor: deviceColor.trim(),
        warranty,
        description: buildDescription(),
      })
      const created = await repairService.create(fd)
      console.log('[BookRepair] Booking created:', created.repairId)
      setResult({ repairId: created.repairId, ticketId: created.id })
    } catch (err: any) {
      console.error('[BookRepair] Booking error:', err)
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

  const progressLabel = step <= questions.length
    ? `Question ${step} of ${questions.length}`
    : stepLabels[step - questions.length]

  if (result) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: '#FBF8F6', color: '#1B1210', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
        <SiteTopNav />
        <div className="pt-24"><BackBar label="Back to Services" to="/repairs" /></div>
        <main className="max-w-lg mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(217,30,54,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <FiCheckCircle size={40} style={{ color: '#D91E36' }} />
            </div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, color: '#1B1210', marginBottom: 8 }}>Booking Confirmed!</h1>
            <p style={{ fontSize: 14, color: '#4A403D', marginBottom: 32 }}>Your repair has been submitted successfully.</p>
            <div style={{ background: '#fff', border: '1px solid #ECE4E0', borderRadius: 20, padding: 24, marginBottom: 32, boxShadow: '0 8px 24px -12px rgba(27,18,16,0.12)' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#857D79', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Your Tracking ID</p>
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, color: '#D91E36', letterSpacing: '0.08em' }}>{result.repairId}</p>
              <p style={{ fontSize: 12, color: '#857D79', marginTop: 12 }}>Save this ID to track your repair.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/my-repairs"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, #D91E36, #A3122A)', transition: 'transform .16s ease, box-shadow .16s ease' }}
              >
                Track My Repair <FiArrowRight size={16} />
              </Link>
              <Link to="/repairs"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, color: '#4A403D', background: '#F5F0EC', border: '1.5px solid #ECE4E0', transition: 'all .16s ease' }}
              >
                Back to Services
              </Link>
            </div>
          </motion.div>
        </main>
        <EcommerceFooter compact />
      </div>
    )
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #ECE4E0',
    borderRadius: 20,
    padding: '24px 28px',
    boxShadow: '0 8px 24px -12px rgba(27,18,16,0.12)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    padding: '0 15px',
    borderRadius: 11,
    border: '1.5px solid #ECE4E0',
    fontSize: 14,
    color: '#1B1210',
    background: '#FBF8F6',
    outline: 'none',
    transition: 'border-color .16s ease, background .16s ease',
    fontFamily: "'Inter', sans-serif",
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12.5,
    fontWeight: 600,
    color: '#4A403D',
    marginBottom: 6,
    letterSpacing: '0.01em',
  }

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #D91E36, #A3122A)',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform .16s ease, box-shadow .16s ease',
    boxShadow: '0 4px 12px rgba(217,30,54,0.3)',
  }

  const btnGhost: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    color: '#4A403D',
    background: '#F5F0EC',
    border: '1px solid #ECE4E0',
    cursor: 'pointer',
    transition: 'all .16s ease',
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#FBF8F6', color: '#1B1210', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
      <SiteTopNav />
      <div className="pt-24"><BackBar label="Back to Repair Services" to="/repairs" /></div>

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-12">
        <div className="flex items-center gap-3 mb-2">
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(217,30,54,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiEdit3 size={18} style={{ color: '#D91E36' }} />
          </div>
          <div className="flex-1 relative">
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: '#1B1210' }}>Book a Repair</h1>
            <div onClick={() => setShowServicePicker(!showServicePicker)} className="inline-flex items-center gap-1.5 cursor-pointer group mt-0.5">
              <p style={{ fontSize: 13.5, color: '#857D79', transition: 'color .16s' }} className="group-hover:text-[#D91E36]">{selectedIssue || 'Select a service'}</p>
              <svg className={`w-3.5 h-3.5 transition-transform ${showServicePicker ? 'rotate-180' : ''}`} style={{ color: '#857D79' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            {showServicePicker && (
              <div className="absolute top-full left-0 mt-1 z-20" style={{ background: '#fff', border: '1px solid #ECE4E0', borderRadius: 14, boxShadow: '0 20px 50px -20px rgba(92,10,28,0.18)', minWidth: 220, maxHeight: 224, overflowY: 'auto', padding: '4px' }}>
                {services.filter(s => s.is_active).map(s => (
                  <button key={s.id} type="button" onClick={() => { setSelectedIssue(s.name); setShowServicePicker(false) }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      fontSize: 13.5,
                      fontWeight: 500,
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background .16s ease',
                      background: selectedIssue === s.name ? 'linear-gradient(135deg, #D91E36, #A3122A)' : 'transparent',
                      color: selectedIssue === s.name ? '#fff' : '#1B1210',
                    }}
                    onMouseEnter={(e) => { if (selectedIssue !== s.name) e.currentTarget.style.background = 'rgba(217,30,54,0.06)' }}
                    onMouseLeave={(e) => { if (selectedIssue !== s.name) e.currentTarget.style.background = 'transparent' }}
                  >{s.name}</button>
                ))}
                {services.filter(s => s.is_active).length === 0 && <p style={{ padding: '10px 14px', fontSize: 13, color: '#857D79' }}>No services available</p>}
              </div>
            )}
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: '#857D79', marginBottom: 24 }}>Complete the steps below to book your repair.</p>

        {/* Progress Bar */}
        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ height: 4, flex: 1, borderRadius: 10, transition: 'all .3s ease', background: i + 1 <= step ? '#D91E36' : '#ECE4E0' }} />
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#857D79', fontWeight: 500, marginBottom: 24 }}>{progressLabel}</p>

        <AnimatePresence mode="wait">
          {step <= questions.length ? (
            <motion.div key={`q-${step}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} style={cardStyle}>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#D91E36' }}>help</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#D91E36', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Question {step} of {questions.length}</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1B1210', marginBottom: 16, marginTop: 8 }}>{questions[step - 1]}</p>
              <textarea value={answers[step - 1]} onChange={(e) => { const v = e.target.value; updateAnswer(step - 1, v); if (qErrors[step - 1] && v.trim()) setQErrors(p => { const n = { ...p }; delete n[step - 1]; return n }) }}
                rows={3} style={{ ...inputStyle, height: 'auto', padding: '12px 15px', resize: 'none', borderColor: qErrors[step - 1] ? '#ef4444' : '#ECE4E0' }} placeholder="Type your answer..." autoFocus
                onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = qErrors[step - 1] ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
              />
              {qErrors[step - 1] && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{qErrors[step - 1]}</p>}
              <div className="flex items-center justify-between" style={{ marginTop: 20 }}>
                <button onClick={goPrev} disabled={step === 1} style={{ ...btnGhost, opacity: step === 1 ? 0.4 : 1, cursor: step === 1 ? 'not-allowed' : 'pointer' }}>
                  <FiArrowLeft size={13} /> Back
                </button>
                <button onClick={goNext} style={btnPrimary}>
                  {step < questions.length ? 'Next' : 'Continue'} <FiArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          ) : step === questions.length + 1 ? (
            <motion.div key="details" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} style={cardStyle}>
              <div className="flex items-center gap-2 mb-4">
                <FiUser size={14} style={{ color: '#D91E36' }} />
                <span style={{ fontSize: 14.5, fontWeight: 700, color: '#1B1210' }}>Your Details</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input value={name} onBlur={() => { setTouched(p => ({ ...p, name: true })); setErrors(p => ({ ...p, name: validateName(name) })) }} onChange={(e) => { setName(e.target.value); if (touched.name) setErrors(p => ({ ...p, name: validateName(e.target.value) })) }}
                    style={{ ...inputStyle, borderColor: touched.name && errors.name ? '#ef4444' : '#ECE4E0' }} placeholder="Your name" autoFocus
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.name && errors.name ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                  />
                  {touched.name && errors.name && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.name}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
                  <input value={mobile} onBlur={() => { setTouched(p => ({ ...p, mobile: true })); setErrors(p => ({ ...p, mobile: validateMobile(mobile) })) }} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setMobile(v); if (touched.mobile) setErrors(p => ({ ...p, mobile: validateMobile(v) })) }}
                    style={{ ...inputStyle, borderColor: touched.mobile && errors.mobile ? '#ef4444' : '#ECE4E0' }} placeholder="+91 98765 43210"
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.mobile && errors.mobile ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                  />
                  {touched.mobile && errors.mobile && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.mobile}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                  <input value={email} onBlur={() => { setTouched(p => ({ ...p, email: true })); setErrors(p => ({ ...p, email: validateEmail(email) })) }} onChange={(e) => { setEmail(e.target.value); if (touched.email) setErrors(p => ({ ...p, email: validateEmail(e.target.value) })) }}
                    style={{ ...inputStyle, borderColor: touched.email && errors.email ? '#ef4444' : '#ECE4E0' }} placeholder="email@example.com" type="email"
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.email && errors.email ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                  />
                  {touched.email && errors.email && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.email}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Address <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea value={address} onBlur={() => { setTouched(p => ({ ...p, address: true })); if (!address.trim()) setErrors(prev => ({ ...prev, address: 'Address is required' })) }} onChange={(e) => { setAddress(e.target.value); if (touched.address) setErrors(prev => ({ ...prev, address: !e.target.value.trim() ? 'Address is required' : '' })) }}
                    style={{ ...inputStyle, height: 'auto', padding: '10px 15px', minHeight: 60, resize: 'none', borderColor: touched.address && errors.address ? '#ef4444' : '#ECE4E0' }} placeholder="Your address for pickup/delivery" rows={2}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.address && errors.address ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                  />
                  {touched.address && errors.address && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.address}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between" style={{ marginTop: 20 }}>
                <button onClick={goPrev} style={btnGhost}><FiArrowLeft size={13} /> Back</button>
                <button onClick={goNext} style={btnPrimary}>Next <FiArrowRight size={13} /></button>
              </div>
            </motion.div>
          ) : step === questions.length + 2 ? (
            <motion.div key="device" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} style={cardStyle}>
              <div className="flex items-center gap-2 mb-4">
                <FiSmartphone size={14} style={{ color: '#D91E36' }} />
                <span style={{ fontSize: 14.5, fontWeight: 700, color: '#1B1210' }}>Device Information</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label style={labelStyle}>Brand <span style={{ color: '#ef4444' }}>*</span></label>
                  <select value={brand} onBlur={() => { setTouched(p => ({ ...p, brand: true })); setErrors(p => ({ ...p, brand: validateBrand(brand) })) }} onChange={(e) => { setBrand(e.target.value); if (touched.brand) setErrors(p => ({ ...p, brand: validateBrand(e.target.value) })) }}
                    style={{ ...inputStyle, appearance: 'none' as const, cursor: 'pointer', borderColor: touched.brand && errors.brand ? '#ef4444' : '#ECE4E0' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.brand && errors.brand ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                  >
                    <option value="">Select brand</option>
                    {deviceBrands.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {touched.brand && errors.brand && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.brand}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Model <span style={{ color: '#ef4444' }}>*</span></label>
                  <input value={model} onBlur={() => { setTouched(p => ({ ...p, model: true })); setErrors(p => ({ ...p, model: validateModel(model) })) }} onChange={(e) => { setModel(e.target.value); if (touched.model) setErrors(p => ({ ...p, model: validateModel(e.target.value) })) }}
                    style={{ ...inputStyle, borderColor: touched.model && errors.model ? '#ef4444' : '#ECE4E0' }} placeholder="e.g. iPhone 15 Pro Max" autoFocus
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.model && errors.model ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                  />
                  {touched.model && errors.model && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.model}</p>}
                </div>
                <div>
                  <label style={labelStyle}>IMEI Number <span style={{ color: '#ef4444' }}>*</span></label>
                  <input value={imei} onBlur={() => { setTouched(p => ({ ...p, imei: true })); setErrors(p => ({ ...p, imei: validateImei(imei) })) }} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 15); setImei(v); if (touched.imei) setErrors(p => ({ ...p, imei: validateImei(v) })) }}
                    style={{ ...inputStyle, borderColor: touched.imei && errors.imei ? '#ef4444' : '#ECE4E0' }} placeholder="15 digit IMEI"
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.imei && errors.imei ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                  />
                  {touched.imei && errors.imei && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.imei}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Serial No. <span style={{ color: '#ef4444' }}>*</span></label>
                  <input value={serialNumber} onBlur={() => { setTouched(p => ({ ...p, serialNumber: true })); if (!serialNumber.trim()) setErrors(prev => ({ ...prev, serialNumber: 'Serial number is required' })) }} onChange={(e) => { setSerialNumber(e.target.value); if (touched.serialNumber) setErrors(prev => ({ ...prev, serialNumber: !e.target.value.trim() ? 'Serial number is required' : '' })) }}
                    style={{ ...inputStyle, borderColor: touched.serialNumber && errors.serialNumber ? '#ef4444' : '#ECE4E0' }} placeholder="Device serial number"
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.serialNumber && errors.serialNumber ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                  />
                  {touched.serialNumber && errors.serialNumber && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.serialNumber}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Color <span style={{ color: '#ef4444' }}>*</span></label>
                  <input value={deviceColor} onBlur={() => { setTouched(p => ({ ...p, deviceColor: true })); if (!deviceColor.trim()) setErrors(prev => ({ ...prev, deviceColor: 'Color is required' })) }} onChange={(e) => { setDeviceColor(e.target.value); if (touched.deviceColor) setErrors(prev => ({ ...prev, deviceColor: !e.target.value.trim() ? 'Color is required' : '' })) }}
                    style={{ ...inputStyle, borderColor: touched.deviceColor && errors.deviceColor ? '#ef4444' : '#ECE4E0' }} placeholder="e.g. Space Black, Silver"
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.deviceColor && errors.deviceColor ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                  />
                  {touched.deviceColor && errors.deviceColor && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.deviceColor}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Warranty Status <span style={{ color: '#ef4444' }}>*</span></label>
                  <select value={warranty} onBlur={() => { setTouched(p => ({ ...p, warranty: true })); if (warranty === 'unknown') setErrors(prev => ({ ...prev, warranty: 'Please select warranty status' })) }} onChange={(e) => { setWarranty(e.target.value); if (touched.warranty) setErrors(prev => ({ ...prev, warranty: e.target.value === 'unknown' ? 'Please select warranty status' : '' })) }}
                    style={{ ...inputStyle, appearance: 'none' as const, cursor: 'pointer', borderColor: touched.warranty && errors.warranty ? '#ef4444' : '#ECE4E0' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#D91E36'; e.currentTarget.style.background = '#fff' }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = touched.warranty && errors.warranty ? '#ef4444' : '#ECE4E0'; e.currentTarget.style.background = '#FBF8F6' }}
                  >
                    <option value="unknown">Unknown</option>
                    <option value="in_warranty">In Warranty</option>
                    <option value="out_of_warranty">Out of Warranty</option>
                    <option value="expired">Expired</option>
                  </select>
                  {touched.warranty && errors.warranty && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.warranty}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between" style={{ marginTop: 20 }}>
                <button onClick={goPrev} style={btnGhost}><FiArrowLeft size={13} /> Back</button>
                <button onClick={goNext} style={btnPrimary}>Next <FiArrowRight size={13} /></button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="photos" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} style={cardStyle}>
              <div className="flex items-center gap-2 mb-4">
                <FiImage size={14} style={{ color: '#D91E36' }} />
                <span style={{ fontSize: 14.5, fontWeight: 700, color: '#1B1210' }}>Device Photos</span>
              </div>
              <div onClick={() => inputRef.current?.click()}
                style={{ borderRadius: 11, border: '1.5px dashed rgba(217,30,54,0.2)', padding: 24, textAlign: 'center', cursor: 'pointer', background: '#FBF8F6', transition: 'border-color .16s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(217,30,54,0.4)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(217,30,54,0.2)' }}
              >
                <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]) }} />
                <p style={{ fontSize: 13.5, color: '#4A403D' }}>Tap to upload photos</p>
                <p style={{ fontSize: 12, color: '#857D79', marginTop: 4 }}>Show the damage area for faster diagnosis</p>
              </div>
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2" style={{ marginTop: 12 }}>
                  {previews.map((url, i) => (
                    <div key={i} className="relative" style={{ aspectRatio: '1/1', borderRadius: 10, background: '#fff', border: '1px solid #ECE4E0', overflow: 'hidden' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => {
                        URL.revokeObjectURL(url)
                        setImageFiles(f => f.filter((_, j) => j !== i))
                      }}
                        style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 6, background: 'rgba(239,68,68,0.8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', opacity: 0, transition: 'opacity .15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0' }}
                      ><FiX size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
              {submitError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 11, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 12, color: '#ef4444', marginTop: 12 }}>
                  <FiAlertCircle size={12} /> {submitError}
                </div>
              )}
              <div className="flex items-center justify-between" style={{ marginTop: 20 }}>
                <button onClick={goPrev} style={btnGhost}><FiArrowLeft size={13} /> Back</button>
                <button onClick={handleSubmit} disabled={submitting}
                  style={{ ...btnPrimary, padding: '10px 24px', opacity: submitting ? 0.5 : 1, cursor: submitting ? 'not-allowed' : 'pointer', background: submitting ? '#9CA3AF' : 'linear-gradient(135deg, #D91E36, #A3122A)' }}
                ><FiSend size={13} /> {submitting ? 'Booking...' : 'Book Now'}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <EcommerceFooter compact />
    </div>
  )
}

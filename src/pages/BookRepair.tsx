import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUser, FiSmartphone, FiAlertCircle, FiCheckCircle, FiArrowRight, FiArrowLeft, FiSend, FiX, FiImage, FiEdit3 } from 'react-icons/fi'
import StorefrontNavbar from '../components/ecommerce/StorefrontNavbar'
import BackBar from '../components/ecommerce/BackBar'
import EcommerceFooter from '../components/ecommerce/Footer'
import { deviceBrands } from '../data/repairData'
import { repairService, type RepairService } from '../services/repairService'
import MobileBookRepair from '../components/mobile/MobileBookRepair'
import { useIsMobile } from '../components/mobile/helpers'

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
      <div className="min-h-screen bg-[#f7fafd] text-[#181c1e] font-sans">
        <StorefrontNavbar activeLabel="Repairs" />
        <div className="pt-24"><BackBar label="Back to Services" to="/repairs" /></div>
        <main className="max-w-lg mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-mint/10 flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle size={40} className="text-mint" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#181c1e] mb-2">Booking Confirmed!</h1>
            <p className="text-[#434748] mb-8">Your repair has been submitted successfully.</p>
            <div className="rounded-2xl p-6 mb-8" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(25px)', border: '1.5px solid rgba(203,32,45,0.2)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 10px 30px rgba(0,0,0,0.05)' }}>
              <p className="text-xs text-[#434748] mb-2">Your Tracking ID</p>
              <p className="text-3xl font-mono font-bold text-mint tracking-wider">{result.repairId}</p>
              <p className="text-xs text-[#434748] mt-3">Save this ID to track your repair.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/my-repairs"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold shadow-lg shadow-mint/30 hover:shadow-xl hover:shadow-mint/40 hover:scale-105 active:scale-95 transition-all text-white"
                style={{ background: 'linear-gradient(135deg, #CB202D, #A81D2A)' }}
              >
                Track My Repair <FiArrowRight size={16} />
              </Link>
              <Link to="/repairs"
                className="inline-flex items-center justify-center gap-2 bg-white/80 border border-glass-border text-[#434748] font-semibold px-8 py-3.5 rounded-full hover:border-mint/50 transition-all"
              >
                Back to Services
              </Link>
            </div>
          </motion.div>
        </main>
        <EcommerceFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7fafd] text-[#181c1e] font-sans selection:bg-mint/30 selection:text-[#A81D2A]">
      <StorefrontNavbar activeLabel="Repairs" />
      <div className="pt-24"><BackBar label="Back to Repair Services" to="/repairs" /></div>

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-mint/10 flex items-center justify-center shrink-0">
              <FiEdit3 size={18} className="text-mint" />
            </div>
            <div className="flex-1 relative">
              <h1 className="text-xl lg:text-2xl font-extrabold text-[#181c1e]">Book a Repair</h1>
              <div onClick={() => setShowServicePicker(!showServicePicker)} className="inline-flex items-center gap-1.5 cursor-pointer group mt-0.5">
                <p className="text-[#434748] text-sm group-hover:text-mint transition-colors">{selectedIssue || 'Select a service'}</p>
                <svg className={`w-3.5 h-3.5 text-[#434748] transition-transform ${showServicePicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {showServicePicker && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl shadow-lg border border-glass-border min-w-[220px] max-h-56 overflow-y-auto py-1">
                  {services.filter(s => s.is_active).map(s => (
                    <button key={s.id} type="button" onClick={() => { setSelectedIssue(s.name); setShowServicePicker(false) }}
                      className={`w-full text-left px-4 py-2 text-sm transition ${selectedIssue === s.name ? 'text-white' : 'text-[#181c1e] hover:bg-[#f7fafd]'}`}
                      style={selectedIssue === s.name ? { background: 'linear-gradient(135deg, #CB202D, #A81D2A)' } : {}}
                    >{s.name}</button>
                  ))}
                  {services.filter(s => s.is_active).length === 0 && <p className="px-4 py-2 text-sm text-[#434748]/60">No services available</p>}
                </div>
              )}
            </div>
          </div>
        <p className="text-[#434748] text-sm mb-6">Complete the steps below to book your repair.</p>

        {/* Progress Bar */}
        <div className="flex items-center gap-1 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i + 1 <= step ? 'bg-mint' : 'bg-[#e0e3e6]'}`} />
          ))}
        </div>
        <p className="text-xs text-[#434748] font-medium mb-6">{progressLabel}</p>

        <AnimatePresence mode="wait">
          {step <= questions.length ? (
            <motion.div key={`q-${step}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="rounded-2xl p-5 lg:p-6" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(25px)', border: '1.5px solid rgba(203,32,45,0.2)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 10px 30px rgba(0,0,0,0.05)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-lg text-mint">help</span>
                <span className="text-[10px] font-bold text-mint uppercase tracking-wider">Question {step} of {questions.length}</span>
              </div>
              <p className="text-base font-semibold text-[#181c1e] mb-4 mt-2">{questions[step - 1]}</p>
              <textarea value={answers[step - 1]} onChange={(e) => { const v = e.target.value; updateAnswer(step - 1, v); if (qErrors[step - 1] && v.trim()) setQErrors(p => { const n = { ...p }; delete n[step - 1]; return n }) }}
                rows={3} className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#181c1e] outline-none focus:border-mint/50 transition-all resize-none ${qErrors[step - 1] ? 'border-red-400' : 'border-glass-border'}`} placeholder="Type your answer..." autoFocus
              />
              {qErrors[step - 1] && <p className="text-xs text-red-500 mt-1">{qErrors[step - 1]}</p>}
              <div className="flex items-center justify-between mt-5">
                <button onClick={goPrev} disabled={step === 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 border border-glass-border text-xs font-semibold text-[#434748] hover:border-mint/50 disabled:opacity-40 transition-all cursor-pointer"
                ><FiArrowLeft size={13} /> Back</button>
                <button onClick={goNext}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold shadow-lg shadow-mint/30 hover:shadow-xl hover:shadow-mint/40 hover:scale-105 active:scale-95 transition-all cursor-pointer text-white"
                  style={{ background: 'linear-gradient(135deg, #CB202D, #A81D2A)' }}
                >{step < questions.length ? 'Next' : 'Continue'} <FiArrowRight size={13} /></button>
              </div>
            </motion.div>
          ) : step === questions.length + 1 ? (
            <motion.div key="details" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="rounded-2xl p-5 lg:p-6" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(25px)', border: '1.5px solid rgba(203,32,45,0.2)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 10px 30px rgba(0,0,0,0.05)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <FiUser size={14} className="text-mint" />
                <span className="text-sm font-bold text-[#181c1e]">Your Details</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#434748] mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input value={name} onBlur={() => { setTouched(p => ({ ...p, name: true })); setErrors(p => ({ ...p, name: validateName(name) })) }} onChange={(e) => { setName(e.target.value); if (touched.name) setErrors(p => ({ ...p, name: validateName(e.target.value) })) }}
                    className={`w-full h-11 px-4 rounded-xl bg-white border text-sm text-[#181c1e] outline-none focus:border-mint/50 transition-all ${touched.name && errors.name ? 'border-red-400' : 'border-glass-border'}`} placeholder="Your name" autoFocus />
                  {touched.name && errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#434748] mb-1">Mobile Number <span className="text-red-500">*</span></label>
                  <input value={mobile} onBlur={() => { setTouched(p => ({ ...p, mobile: true })); setErrors(p => ({ ...p, mobile: validateMobile(mobile) })) }} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setMobile(v); if (touched.mobile) setErrors(p => ({ ...p, mobile: validateMobile(v) })) }}
                    className={`w-full h-11 px-4 rounded-xl bg-white border text-sm text-[#181c1e] outline-none focus:border-mint/50 transition-all ${touched.mobile && errors.mobile ? 'border-red-400' : 'border-glass-border'}`} placeholder="+91 98765 43210" />
                  {touched.mobile && errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#434748] mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input value={email} onBlur={() => { setTouched(p => ({ ...p, email: true })); setErrors(p => ({ ...p, email: validateEmail(email) })) }} onChange={(e) => { setEmail(e.target.value); if (touched.email) setErrors(p => ({ ...p, email: validateEmail(e.target.value) })) }}
                    className={`w-full h-11 px-4 rounded-xl bg-white border text-sm text-[#181c1e] outline-none focus:border-mint/50 transition-all ${touched.email && errors.email ? 'border-red-400' : 'border-glass-border'}`} placeholder="email@example.com" type="email" />
                  {touched.email && errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#434748] mb-1">Address <span className="text-red-500">*</span></label>
                  <textarea value={address} onBlur={() => { setTouched(p => ({ ...p, address: true })); if (!address.trim()) setErrors(prev => ({ ...prev, address: 'Address is required' })) }} onChange={(e) => { setAddress(e.target.value); if (touched.address) setErrors(prev => ({ ...prev, address: !e.target.value.trim() ? 'Address is required' : '' })) }} className={`w-full px-4 py-2.5 rounded-xl bg-white border text-sm text-[#181c1e] outline-none focus:border-mint/50 transition-all border-glass-border min-h-[60px] resize-none ${touched.address && errors.address ? 'border-red-400' : 'border-glass-border'}`} placeholder="Your address for pickup/delivery" rows={2} />
                  {touched.address && errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between mt-5">
                <button onClick={goPrev} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 border border-glass-border text-xs font-semibold text-[#434748] hover:border-mint/50 transition-all cursor-pointer">
                  <FiArrowLeft size={13} /> Back
                </button>
                <button onClick={goNext}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold shadow-lg shadow-mint/30 hover:shadow-xl hover:shadow-mint/40 hover:scale-105 active:scale-95 transition-all cursor-pointer text-white"
                  style={{ background: 'linear-gradient(135deg, #CB202D, #A81D2A)' }}
                >Next <FiArrowRight size={13} /></button>
              </div>
            </motion.div>
          ) : step === questions.length + 2 ? (
            <motion.div key="device" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="rounded-2xl p-5 lg:p-6" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(25px)', border: '1.5px solid rgba(203,32,45,0.2)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 10px 30px rgba(0,0,0,0.05)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <FiSmartphone size={14} className="text-mint" />
                <span className="text-sm font-bold text-[#181c1e]">Device Information</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#434748] mb-1">Brand <span className="text-red-500">*</span></label>
                  <select value={brand} onBlur={() => { setTouched(p => ({ ...p, brand: true })); setErrors(p => ({ ...p, brand: validateBrand(brand) })) }} onChange={(e) => { setBrand(e.target.value); if (touched.brand) setErrors(p => ({ ...p, brand: validateBrand(e.target.value) })) }}
                    className={`w-full h-11 px-4 rounded-xl bg-white border text-sm text-[#181c1e] outline-none appearance-none cursor-pointer focus:border-mint/50 transition-all ${touched.brand && errors.brand ? 'border-red-400' : 'border-glass-border'}`}
                  >
                    <option value="">Select brand</option>
                    {deviceBrands.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {touched.brand && errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#434748] mb-1">Model <span className="text-red-500">*</span></label>
                  <input value={model} onBlur={() => { setTouched(p => ({ ...p, model: true })); setErrors(p => ({ ...p, model: validateModel(model) })) }} onChange={(e) => { setModel(e.target.value); if (touched.model) setErrors(p => ({ ...p, model: validateModel(e.target.value) })) }}
                    className={`w-full h-11 px-4 rounded-xl bg-white border text-sm text-[#181c1e] outline-none focus:border-mint/50 transition-all ${touched.model && errors.model ? 'border-red-400' : 'border-glass-border'}`} placeholder="e.g. iPhone 15 Pro Max" autoFocus />
                  {touched.model && errors.model && <p className="text-xs text-red-500 mt-1">{errors.model}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#434748] mb-1">IMEI Number <span className="text-red-500">*</span></label>
                  <input value={imei} onBlur={() => { setTouched(p => ({ ...p, imei: true })); setErrors(p => ({ ...p, imei: validateImei(imei) })) }} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 15); setImei(v); if (touched.imei) setErrors(p => ({ ...p, imei: validateImei(v) })) }} className={`w-full h-11 px-4 rounded-xl bg-white border text-sm text-[#181c1e] outline-none focus:border-mint/50 transition-all ${touched.imei && errors.imei ? 'border-red-400' : 'border-glass-border'}`} placeholder="15 digit IMEI" />
                  {touched.imei && errors.imei && <p className="text-xs text-red-500 mt-1">{errors.imei}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#434748] mb-1">Serial No. <span className="text-red-500">*</span></label>
                  <input value={serialNumber} onBlur={() => { setTouched(p => ({ ...p, serialNumber: true })); if (!serialNumber.trim()) setErrors(prev => ({ ...prev, serialNumber: 'Serial number is required' })) }} onChange={(e) => { setSerialNumber(e.target.value); if (touched.serialNumber) setErrors(prev => ({ ...prev, serialNumber: !e.target.value.trim() ? 'Serial number is required' : '' })) }} className={`w-full h-11 px-4 rounded-xl bg-white border text-sm text-[#181c1e] outline-none focus:border-mint/50 transition-all border-glass-border ${touched.serialNumber && errors.serialNumber ? 'border-red-400' : 'border-glass-border'}`} placeholder="Device serial number" />
                  {touched.serialNumber && errors.serialNumber && <p className="text-xs text-red-500 mt-1">{errors.serialNumber}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#434748] mb-1">Color <span className="text-red-500">*</span></label>
                  <input value={deviceColor} onBlur={() => { setTouched(p => ({ ...p, deviceColor: true })); if (!deviceColor.trim()) setErrors(prev => ({ ...prev, deviceColor: 'Color is required' })) }} onChange={(e) => { setDeviceColor(e.target.value); if (touched.deviceColor) setErrors(prev => ({ ...prev, deviceColor: !e.target.value.trim() ? 'Color is required' : '' })) }} className={`w-full h-11 px-4 rounded-xl bg-white border text-sm text-[#181c1e] outline-none focus:border-mint/50 transition-all border-glass-border ${touched.deviceColor && errors.deviceColor ? 'border-red-400' : 'border-glass-border'}`} placeholder="e.g. Space Black, Silver" />
                  {touched.deviceColor && errors.deviceColor && <p className="text-xs text-red-500 mt-1">{errors.deviceColor}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#434748] mb-1">Warranty Status <span className="text-red-500">*</span></label>
                  <select value={warranty} onBlur={() => { setTouched(p => ({ ...p, warranty: true })); if (warranty === 'unknown') setErrors(prev => ({ ...prev, warranty: 'Please select warranty status' })) }} onChange={(e) => { setWarranty(e.target.value); if (touched.warranty) setErrors(prev => ({ ...prev, warranty: e.target.value === 'unknown' ? 'Please select warranty status' : '' })) }} className={`w-full h-11 px-4 rounded-xl bg-white border text-sm text-[#181c1e] outline-none appearance-none cursor-pointer focus:border-mint/50 transition-all border-glass-border ${touched.warranty && errors.warranty ? 'border-red-400' : 'border-glass-border'}`}>
                    <option value="unknown">Unknown</option>
                    <option value="in_warranty">In Warranty</option>
                    <option value="out_of_warranty">Out of Warranty</option>
                    <option value="expired">Expired</option>
                  </select>
                  {touched.warranty && errors.warranty && <p className="text-xs text-red-500 mt-1">{errors.warranty}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between mt-5">
                <button onClick={goPrev} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 border border-glass-border text-xs font-semibold text-[#434748] hover:border-mint/50 transition-all cursor-pointer">
                  <FiArrowLeft size={13} /> Back
                </button>
                <button onClick={goNext}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold shadow-lg shadow-mint/30 hover:shadow-xl hover:shadow-mint/40 hover:scale-105 active:scale-95 transition-all cursor-pointer text-white"
                  style={{ background: 'linear-gradient(135deg, #CB202D, #A81D2A)' }}
                >Next <FiArrowRight size={13} /></button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="photos" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="rounded-2xl p-5 lg:p-6" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(25px)', border: '1.5px solid rgba(203,32,45,0.2)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 10px 30px rgba(0,0,0,0.05)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <FiImage size={14} className="text-mint" />
                <span className="text-sm font-bold text-[#181c1e]">Device Photos</span>
              </div>
              <div onClick={() => inputRef.current?.click()}
                className="rounded-xl border-2 border-dashed border-mint/20 p-6 text-center cursor-pointer hover:border-mint/40 transition-all bg-white/80"
              >
                <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]) }} />
                <p className="text-sm text-[#434748]">Tap to upload photos</p>
                <p className="text-xs text-[#434748]/60 mt-1">Show the damage area for faster diagnosis</p>
              </div>
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {previews.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg bg-white border border-glass-border overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => {
                        URL.revokeObjectURL(url)
                        setImageFiles(f => f.filter((_, j) => j !== i))
                      }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-md bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      ><FiX size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
              {submitError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 mt-3">
                  <FiAlertCircle size={12} /> {submitError}
                </div>
              )}
              <div className="flex items-center justify-between mt-5">
                <button onClick={goPrev} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 border border-glass-border text-xs font-semibold text-[#434748] hover:border-mint/50 transition-all cursor-pointer">
                  <FiArrowLeft size={13} /> Back
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-bold shadow-lg shadow-mint/30 hover:shadow-xl hover:shadow-mint/40 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer text-white"
                  style={{ background: submitting ? '#9CA3AF' : 'linear-gradient(135deg, #CB202D, #A81D2A)' }}
                ><FiSend size={13} /> {submitting ? 'Booking...' : 'Book Now'}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <EcommerceFooter />
    </div>
  )
}

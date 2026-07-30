import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiChevronLeft, FiUser, FiSmartphone, FiImage, FiX, FiAlertCircle, FiCheckCircle, FiSend, FiArrowRight } from 'react-icons/fi'
import { repairService, type RepairService } from '../../services/repairService'
import { deviceBrands } from '../../data/repairData'
import MobileTopSection from './MobileTopSection'

const PURPLE = '#CB202D'
const grad = 'linear-gradient(135deg,#CB202D 0%,#FF5A65 100%)'

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

export default function MobileBookRepair() {
  const navigate = useNavigate()
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
  const progressLabel = step <= questions.length
    ? `Question ${step} of ${questions.length}`
    : ['', '', 'Your Details', 'Device Info', 'Photos'][step - questions.length]

  useEffect(() => {
    repairService.getServices().then(setServices).catch(() => {})
  }, [])

  const matchedService = services.find(s =>
    s.slug.toLowerCase() === selectedIssue.toLowerCase() ||
    s.name.toLowerCase() === selectedIssue.toLowerCase()
  )

  useEffect(() => {
    setSelectedIssue(decodedIssue)
  }, [decodedIssue])

  useEffect(() => {
    setAnswers(questions.map(() => '')); setStep(1); setErrors({}); setResult(null)
  }, [selectedIssue])

  useEffect(() => {
    const urls = imageFiles.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [imageFiles])

  const updateAnswer = (idx: number, val: string) => {
    const a = [...answers]; a[idx] = val; setAnswers(a)
  }

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
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const validateDevice = () => {
    const e: Record<string, string> = {}
    const be = validateBrand(brand); if (be) e.brand = be
    const me = validateModel(model); if (me) e.model = me
    const ie = validateImei(imei); if (ie) e.imei = ie
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const goNext = () => {
    if (step <= questions.length && !answers[step - 1]?.trim()) {
      setErrors({ q: 'Please answer this question' }); return
    }
    if (step === questions.length + 1 && !validateDetails()) return
    if (step === questions.length + 2 && !validateDevice()) return
    setErrors({}); setStep((s) => s + 1)
  }
  const goPrev = () => { setErrors({}); setStep((s) => Math.max(1, s - 1)) }

  const buildDescription = () => {
    let desc = ''
    answers.forEach((a, i) => { if (a.trim()) desc += `Q: ${questions[i]}\nA: ${a.trim()}\n` })
    return desc.trim()
  }

  const handleSubmit = async () => {
    if (!validateDetails() || !validateDevice()) return
    setSubmitting(true); setSubmitError('')
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
      console.log('[MobileBookRepair] Submitting booking:', {
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        device: `${brand} ${model.trim()}`,
        issue: selectedIssue || 'Other',
        address: address.trim(),
        serialNumber: serialNumber.trim(),
        deviceColor: deviceColor.trim(),
        warranty,
      })
      const created = await repairService.create(fd)
      console.log('[MobileBookRepair] Booking created:', created.repairId)
      setResult({ repairId: created.repairId, ticketId: created.id })
    } catch (err: any) {
      console.error('[MobileBookRepair] Booking error:', err)
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

  const field = (label: string, required: boolean, error?: string) => (
    <div>
      <label className="block text-[12px] font-semibold text-[#6B7280] mb-1">{label} {required && <span className="text-[#EF4444]">*</span>}</label>
      {error && <p className="text-[11px] text-[#EF4444] mb-1">{error}</p>}
    </div>
  )

  if (result) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] max-w-[480px] mx-auto flex flex-col items-center justify-center px-6 text-center font-sans" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: 'rgba(203,32,45,0.1)' }}>
          <FiCheckCircle size={40} style={{ color: PURPLE }} />
        </div>
        <h1 className="text-[22px] font-extrabold text-[#1F2937] mb-1">Booking Confirmed!</h1>
        <p className="text-[13px] text-[#6B7280] mb-6">Your repair has been submitted successfully.</p>
        <div className="w-full rounded-[20px] p-5 mb-6" style={{ background: 'rgba(203,32,45,0.06)', border: '1.5px solid rgba(203,32,45,0.18)' }}>
          <p className="text-[11px] text-[#6B7280] mb-1">Your Tracking ID</p>
          <p className="text-[24px] font-bold font-mono" style={{ color: PURPLE }}>{result.repairId}</p>
          <p className="text-[11px] text-[#6B7280] mt-2">Save this ID to track your repair.</p>
        </div>
        <button onClick={() => navigate('/my-repairs')} className="w-full h-12 rounded-full text-[14px] font-bold text-white mb-3" style={{ background: grad }}>
          Track My Repair
        </button>
        <button onClick={() => navigate('/repairs')} className="w-full h-12 rounded-full text-[14px] font-semibold" style={{ background: '#fff', border: '1.5px solid #E5E7EB', color: '#374151' }}>
          Back to Services
        </button>
      </div>
    )
  }

  const cardCls = 'bg-white rounded-[22px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-4'
  const inputCls = 'w-full h-11 px-4 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB] outline-none text-[14px] text-[#1F2937] focus:border-[#FF5A65] transition-all'
  const nextBtn = 'flex items-center justify-center gap-1.5 h-11 rounded-full text-[13px] font-bold text-white active:scale-95 transition'
  const backBtn = 'flex items-center gap-1.5 h-11 px-4 rounded-full bg-white border border-[#E5E7EB] text-[13px] font-semibold text-[#374151] active:scale-95 transition'

  return (
    <div className="min-h-screen bg-[#F7F8FC] max-w-[480px] mx-auto pb-8 font-sans" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <MobileTopSection title="Book a Repair" subtitle={selectedIssue || 'Step by step'} icon="wishlist" />

      <div className="px-4 pt-4">
        <div className="relative mb-3">
          <div onClick={() => setShowServicePicker(!showServicePicker)} className="flex items-center gap-2 cursor-pointer active:scale-[0.98] transition">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(203,32,45,0.1)', color: PURPLE }}>
              <FiSmartphone size={16} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-[#6B7280]">Service</p>
              <p className="text-[14px] font-bold text-[#1F2937]">{selectedIssue || 'Select a service'}</p>
            </div>
            <svg className={`w-4 h-4 text-[#6B7280] transition-transform ${showServicePicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          {showServicePicker && (
            <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-[#E5E7EB] max-h-56 overflow-y-auto py-1">
              {services.filter(s => s.is_active).map(s => (
                <button key={s.id} type="button" onClick={() => { setSelectedIssue(s.name); setShowServicePicker(false) }}
                  className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition ${selectedIssue === s.name ? 'text-white' : 'text-[#1F2937] hover:bg-[#F7F8FC]'}`}
                  style={selectedIssue === s.name ? { background: PURPLE } : {}}
                >{s.name}</button>
              ))}
              {services.filter(s => s.is_active).length === 0 && <p className="px-4 py-2.5 text-[13px] text-[#9CA3AF]">No services available</p>}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i + 1 <= step ? 'bg-[#FF5A65]' : 'bg-[#E5E7EB]'}`} />
          ))}
        </div>
        <p className="text-[11px] font-semibold text-[#6B7280] mb-4">{progressLabel}</p>

        {/* Step content */}
        <div className={cardCls}>
          {step <= questions.length ? (
            <>
              <p className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: PURPLE }}>Question {step} of {questions.length}</p>
              <p className="text-[15px] font-semibold text-[#1F2937] mb-3">{questions[step - 1]}</p>
              <textarea
                value={answers[step - 1]}
                onChange={(e) => { updateAnswer(step - 1, e.target.value); if (errors.q) setErrors({}) }}
                rows={4}
                className="w-full px-4 py-3 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB] text-[14px] text-[#1F2937] outline-none focus:border-[#FF5A65] transition-all resize-none"
                placeholder="Type your answer..."
              />
              {errors.q && <p className="text-[11px] text-[#EF4444] mt-1">{errors.q}</p>}
            </>
          ) : step === questions.length + 1 ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <FiUser size={16} style={{ color: PURPLE }} />
                <span className="text-[14px] font-bold text-[#1F2937]">Your Details</span>
              </div>
              <div className="space-y-3">
                <div>
                  {field('Full Name', true, errors.name)}
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Your name" />
                </div>
                <div>
                  {field('Mobile Number', true, errors.mobile)}
                  <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} className={inputCls} placeholder="98765 43210" inputMode="numeric" />
                </div>
                <div>
                  {field('Email Address', true, errors.email)}
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="email@example.com" type="email" />
                </div>
                <div>
                  {field('Address (Optional)', false, errors.address)}
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} className={`${inputCls} min-h-[60px] resize-none py-2`} placeholder="Your address for pickup/delivery" rows={2} />
                </div>
              </div>
            </>
          ) : step === questions.length + 2 ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <FiSmartphone size={16} style={{ color: PURPLE }} />
                <span className="text-[14px] font-bold text-[#1F2937]">Device Information</span>
              </div>
              <div className="space-y-3">
                <div>
                  {field('Brand', true, errors.brand)}
                  <select value={brand} onChange={(e) => setBrand(e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                    <option value="">Select brand</option>
                    {deviceBrands.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  {field('Model', true, errors.model)}
                  <input value={model} onChange={(e) => setModel(e.target.value)} className={inputCls} placeholder="e.g. iPhone 15 Pro Max" />
                </div>
                <div>
                  {field('IMEI Number (Optional)', false, errors.imei)}
                  <input value={imei} onChange={(e) => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))} className={inputCls} placeholder="15 digit IMEI" inputMode="numeric" />
                </div>
                <div>
                  {field('Serial No. (Optional)', false, errors.serialNumber)}
                  <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className={inputCls} placeholder="Device serial number" />
                </div>
                <div>
                  {field('Color (Optional)', false, errors.deviceColor)}
                  <input value={deviceColor} onChange={(e) => setDeviceColor(e.target.value)} className={inputCls} placeholder="e.g. Space Black, Silver" />
                </div>
                <div>
                  {field('Warranty Status', false, errors.warranty)}
                  <select value={warranty} onChange={(e) => setWarranty(e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                    <option value="unknown">Unknown</option>
                    <option value="in_warranty">In Warranty</option>
                    <option value="out_of_warranty">Out of Warranty</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <FiImage size={16} style={{ color: PURPLE }} />
                <span className="text-[14px] font-bold text-[#1F2937]">Device Photos (Optional)</span>
              </div>
              <div onClick={() => inputRef.current?.click()} className="rounded-2xl border-2 border-dashed border-[#C4B5FD] p-6 text-center cursor-pointer active:scale-[0.99] transition bg-[#F7F8FC]">
                <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]) }} />
                <p className="text-[13px] font-semibold text-[#374151]">Tap to upload photos</p>
                <p className="text-[11px] text-[#9CA3AF] mt-1">Show the damage area for faster diagnosis</p>
              </div>
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {previews.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => { URL.revokeObjectURL(url); setImageFiles((f) => f.filter((_, j) => j !== i)) }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-md bg-[#EF4444] text-white flex items-center justify-center">
                        <FiX size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {submitError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[11px] text-[#B91C1C] mt-3">
                  <FiAlertCircle size={12} /> {submitError}
                </div>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-4">
          {step > 1 && (
            <button onClick={goPrev} className={backBtn}>
              <FiChevronLeft size={16} /> Back
            </button>
          )}
          {step <= questions.length + 3 ? (
            <button onClick={goNext} className={`${nextBtn} flex-1`} style={{ background: grad }}>
              {step < questions.length + 3 ? 'Next' : 'Continue'} <FiArrowRight size={14} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className={`${nextBtn} flex-1`} style={{ background: submitting ? '#9CA3AF' : grad }}>
              <FiSend size={14} /> {submitting ? 'Booking...' : 'Book Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

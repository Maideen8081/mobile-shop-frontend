import { useState, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiCheck, FiPlus, FiEdit2, FiLoader, FiMapPin, FiPhone, FiAlertCircle, FiTrash2 } from 'react-icons/fi'
import { Home, Briefcase } from 'lucide-react'
import { addressService, type AddressData } from '../services/addressService'
import { useToast } from '../context/ToastContext'
import { authService } from '../services/authService'
import StorefrontNavbar from '../components/ecommerce/StorefrontNavbar'
import BackBar from '../components/ecommerce/BackBar'
import EcommerceFooter from '../components/ecommerce/Footer'
import MobileCheckoutAddress from '../components/mobile/MobileCheckoutAddress'
import { useIsMobile } from '../components/mobile/helpers'

type AddressType = AddressData['addressType']

const steps = [
  { id: 1, label: 'AUTHENTICATION', icon: 'verified_user' },
  { id: 2, label: 'COORDINATE ENTRY', icon: 'location_on' },
  { id: 3, label: 'SECURE SETTLEMENT', icon: 'payments' },
]

const typeIcons: Record<string, ReactNode> = {
  Home: <Home size={14} />,
  Office: <Briefcase size={14} />,
  Other: <FiMapPin size={14} />,
}

function FloatingInput({ label, value, onChange, error, type = 'text', maxLength }: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  type?: string
  maxLength?: number
}) {
  const hasError = !!error
  return (
    <div className="relative">
      <div className={`relative rounded-lg border transition-all duration-200 ${
        hasError ? 'border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' : 'border-glass-border focus-within:ring-2 focus-within:ring-mint'
      }`}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder=" "
          maxLength={maxLength}
          className="w-full h-14 px-4 pt-5 pb-2 rounded-lg text-sm outline-none transition-all duration-200 bg-surface-container-low border-none peer"
          style={{ boxShadow: 'none' }}
        />
        <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          value ? 'top-1.5 text-[10px] font-semibold' : 'top-4 text-sm'
        } ${hasError ? 'text-red-400' : value ? 'text-mint' : 'text-on-surface-variant'}`}>
          {label}
        </label>
      </div>
      <AnimatePresence>
        {hasError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1 text-[10px] mt-1 ml-1 text-red-400"
          >
            <FiAlertCircle size={9} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function CheckoutStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-6 md:gap-12 mb-12">
      {steps.map((step, i) => {
        const isActive = step.id === currentStep
        const isCompleted = step.id < currentStep
        return (
          <div key={step.id} className="flex items-center gap-6 md:gap-12">
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-mint text-white shadow-lg shadow-mint/30'
                    : isActive
                      ? 'bg-mint text-white shadow-lg shadow-mint/30 ring-2 ring-mint/50'
                      : 'border-2 border-outline-variant text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {step.icon}
                </span>
              </motion.div>
              <span className={`text-[10px] font-bold tracking-wider ${
                isActive ? 'text-mint' : isCompleted ? 'text-mint' : 'text-on-surface-variant opacity-50'
              }`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-12 md:w-24 h-[2px] rounded-full overflow-hidden bg-surface-container-highest">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  className="h-full bg-mint"
                  style={{ boxShadow: isCompleted ? '0 0 10px #4FE3C1' : 'none' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ShakeInput({ children, hasError }: { children: React.ReactNode; hasError: boolean }) {
  return (
    <motion.div animate={hasError ? { x: [0, -4, 4, -4, 4, 0] } : {}} transition={{ duration: 0.3 }}>
      {children}
    </motion.div>
  )
}

function QuickAddressForm({ onSaved, onCancel, initialAddress }: {
  onSaved: (addr: AddressData) => void
  onCancel: () => void
  initialAddress?: AddressData
}) {
  const showToast = useToast().show
  const [form, setForm] = useState({
    fullName: initialAddress?.fullName || '', mobile: initialAddress?.mobile || '', alternateMobile: initialAddress?.alternateMobile || '',
    addressLine1: initialAddress?.addressLine1 || '', addressLine2: initialAddress?.addressLine2 || '',
    landmark: initialAddress?.landmark || '', city: initialAddress?.city || '', state: initialAddress?.state || '',
    zipCode: initialAddress?.zipCode || '', country: initialAddress?.country || 'India', addressType: (initialAddress?.addressType || 'Home') as AddressType,
    isDefault: initialAddress?.isDefault || false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [showAnim, setShowAnim] = useState(false)

  const set = (k: keyof typeof form, v: string | boolean) => {
    if (k === 'mobile' || k === 'alternateMobile') v = (v as string).replace(/\D/g, '').slice(0, 10)
    if (k === 'zipCode') v = (v as string).replace(/\D/g, '').slice(0, 6)
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k as string]) setErrors(p => { const n = { ...p }; delete n[k as string]; return n })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Please enter a valid name'
    else if (form.fullName.trim().length < 3) e.fullName = 'Minimum 3 characters required'
    if (!form.mobile) e.mobile = 'Please enter a valid phone number'
    else if (!/^\d{10}$/.test(form.mobile)) e.mobile = 'Phone number must be exactly 10 digits'
    if (!form.addressLine1.trim()) e.addressLine1 = 'Please enter complete address'
    else if (form.addressLine1.trim().length < 10) e.addressLine1 = 'Address must be at least 10 characters'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.state.trim()) e.state = 'State is required'
    if (!form.zipCode.trim()) e.zipCode = 'Please enter a valid pincode'
    else if (!/^\d{5,6}$/.test(form.zipCode)) e.zipCode = 'Pincode must be 5-6 digits'
    return e
  }

  const handleSave = async () => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) { setShowAnim(true); setTimeout(() => setShowAnim(false), 400); return }
    setSaving(true)
    try {
      if (initialAddress?.id) {
        const updated = await addressService.update(initialAddress.id, { ...form })
        onSaved(updated)
      } else {
        const created = await addressService.create({ ...form, country: form.country, isDefault: form.isDefault })
        onSaved(created)
      }
    } catch {
      showToast('Failed to save address', 'error')
    }
    setSaving(false)
  }

  const isValid = Object.keys(errors).length === 0
    && form.fullName.trim().length >= 3 && /^\d{10}$/.test(form.mobile)
    && form.addressLine1.trim().length >= 10 && form.city.trim() && form.state.trim()
    && /^\d{5,6}$/.test(form.zipCode)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, height: 'auto', scale: 1 }}
      exit={{ opacity: 0, y: -20, height: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 180, damping: 24 }}
      className="rounded-2xl p-[2.5rem] mb-6 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)',
        border: '1px solid rgba(217,222,229,0.5)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)',
      }}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="flex items-center justify-between mb-6"
      >
        <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container-highest">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
          </div>
          <h3 className="text-sm font-bold">Add New Address</h3>
        </motion.div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onCancel}
          className="text-xs font-medium text-on-surface-variant hover:text-red-400 transition-colors cursor-pointer"
        >
          Cancel
        </motion.button>
      </motion.div>

      <ShakeInput hasError={showAnim && Object.keys(errors).length > 0}>
        <motion.div className="space-y-4" initial="hidden" animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            className="grid sm:grid-cols-2 gap-4"
          >
            <FloatingInput label="Full Name" value={form.fullName} onChange={v => set('fullName', v)} error={errors.fullName} />
            <FloatingInput label="Phone Number" value={form.mobile} onChange={v => set('mobile', v)} error={errors.mobile} type="tel" maxLength={10} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
            <FloatingInput label="Address Line 1" value={form.addressLine1} onChange={v => set('addressLine1', v)} error={errors.addressLine1} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            className="grid sm:grid-cols-2 gap-4"
          >
            <FloatingInput label="Address Line 2 (optional)" value={form.addressLine2} onChange={v => set('addressLine2', v)} />
            <FloatingInput label="Landmark (optional)" value={form.landmark} onChange={v => set('landmark', v)} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            className="grid sm:grid-cols-3 gap-4"
          >
            <FloatingInput label="City" value={form.city} onChange={v => set('city', v)} error={errors.city} />
            <FloatingInput label="State" value={form.state} onChange={v => set('state', v)} error={errors.state} />
            <FloatingInput label="Pincode" value={form.zipCode} onChange={v => set('zipCode', v)} error={errors.zipCode} type="tel" maxLength={6} />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
            <p className="text-xs font-bold text-on-surface-variant mb-3">ADDRESS TYPE</p>
            <div className="flex gap-3">
              {(['Home', 'Office', 'Other'] as const).map(type => (
                <motion.button key={type} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => set('addressType', type)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    form.addressType === type
                      ? 'bg-mint text-white shadow-md shadow-mint/30'
                      : 'bg-surface-container-low border border-glass-border text-on-surface-variant hover:border-mint/50'
                  }`}
                >
                  {typeIcons[type]} {type}
                  {form.addressType === type && <FiCheck size={11} />}
                </motion.button>
              ))}
            </div>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
            <label className="flex items-center gap-3 cursor-pointer group">
              <motion.div whileTap={{ scale: 0.9 }}
                onClick={() => set('isDefault', !form.isDefault)}
                className={`w-5 h-5 rounded flex items-center justify-center transition-all border ${
                  form.isDefault ? 'bg-mint border-mint shadow-sm shadow-mint/30' : 'bg-surface-container-lowest border-glass-border group-hover:border-mint/50'
                }`}
              >
                {form.isDefault && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                    <FiCheck size={11} className="text-white" />
                  </motion.div>
                )}
              </motion.div>
              <span className="text-sm text-on-surface-variant group-hover:text-primary transition-colors">Set as default address</span>
            </label>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            className="flex gap-3 pt-2"
          >
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onCancel}
              className="flex-1 h-12 rounded-full text-sm font-semibold border border-glass-border text-on-surface-variant hover:text-primary transition-all cursor-pointer"
            >
              Cancel
            </motion.button>
            <motion.button whileHover={isValid ? { scale: 1.02 } : {}} whileTap={isValid ? { scale: 0.98 } : {}}
              onClick={handleSave} disabled={saving}
              className="flex-1 h-12 rounded-full text-sm font-bold flex items-center justify-center gap-2 text-white transition-all cursor-pointer"
              style={{ background: saving ? '#4FE3C1/50' : 'linear-gradient(135deg, #4FE3C1, #454747)' }}
            >
              {saving ? <FiLoader size={16} className="animate-spin" /> : <FiCheck size={16} />}
              {saving ? 'Saving...' : (initialAddress?.id ? 'Update & Continue' : 'Save & Continue')}
            </motion.button>
          </motion.div>
        </motion.div>
      </ShakeInput>
    </motion.div>
  )
}

export default function CheckoutAddress() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileCheckoutAddress />
  const navigate = useNavigate()
  const showToast = useToast().show
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null)
  const [step] = useState(2)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', '/checkout/address')
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const selectedAddress = addresses.find(a => a.id === selectedId)

  const [terminalForm, setTerminalForm] = useState({
    fullName: '', mobile: '', addressLine1: '', addressLine2: '',
    city: '', state: '', zipCode: '', landmark: '',
    addressType: 'Home' as AddressType,
    isDefault: false,
  })

  useEffect(() => {
    if (selectedAddress) {
      setTerminalForm({
        fullName: selectedAddress.fullName || '',
        mobile: selectedAddress.mobile || '',
        addressLine1: selectedAddress.addressLine1 || '',
        addressLine2: selectedAddress.addressLine2 || '',
        city: selectedAddress.city || '',
        state: selectedAddress.state || '',
        zipCode: selectedAddress.zipCode || '',
        landmark: selectedAddress.landmark || '',
        addressType: (selectedAddress.addressType as AddressType) || 'Home',
        isDefault: selectedAddress.isDefault || false,
      })
    }
  }, [selectedId, addresses])

  useEffect(() => {
    let mounted = true
    addressService.list()
      .then(data => {
        if (!mounted) return
        const withIds = data.map((a, i) => ({
          ...a,
          id: a.id ?? -(i + 1),
        }))
        setAddresses(withIds)
        const def = withIds.find(a => a.isDefault && a.id && a.id > 0)
        if (def && def.id) setSelectedId(def.id)
        else {
          const first = withIds.find(a => a.id && a.id > 0)
          if (first && first.id) setSelectedId(first.id)
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const handleContinue = async () => {
    const m = terminalForm.fullName.trim()
    const phone = terminalForm.mobile.trim()
    const addr1 = terminalForm.addressLine1.trim()
    const c = terminalForm.city.trim()
    const s = terminalForm.state.trim()
    const z = terminalForm.zipCode.trim()
    if (!m || !phone || !addr1 || !c || !s || !z) {
      showToast('Please fill in all required fields', 'error')
      return
    }
    if (!/^\d{10}$/.test(phone)) {
      showToast('Phone number must be exactly 10 digits', 'error')
      return
    }
    if (!/^\d{5,6}$/.test(z)) {
      showToast('Pincode must be 5-6 digits', 'error')
      return
    }
    setSubmitting(true)
    try {
      if (selectedId && selectedAddress && selectedId > 0) {
        const changed =
          terminalForm.fullName !== (selectedAddress.fullName || '') ||
          terminalForm.mobile !== (selectedAddress.mobile || '') ||
          terminalForm.addressLine1 !== (selectedAddress.addressLine1 || '') ||
          terminalForm.addressLine2 !== (selectedAddress.addressLine2 || '') ||
          terminalForm.city !== (selectedAddress.city || '') ||
          terminalForm.state !== (selectedAddress.state || '') ||
          terminalForm.zipCode !== (selectedAddress.zipCode || '') ||
          terminalForm.landmark !== (selectedAddress.landmark || '') ||
          terminalForm.addressType !== (selectedAddress.addressType || 'Home') ||
          terminalForm.isDefault !== (selectedAddress.isDefault || false)
        if (changed) {
          const updated = await addressService.update(selectedId, {
            ...selectedAddress, ...terminalForm,
          })
          setAddresses(prev => prev.map(a => a.id === selectedId ? updated : a))
        }
        localStorage.setItem('checkout_address_id', String(selectedId))
      } else {
        const created = await addressService.create({
          ...terminalForm, country: 'India',
        })
        setAddresses(prev => {
          const next = prev.filter(a => a.id !== created.id)
          return [...next, created]
        })
        if (created.id) {
          setSelectedId(created.id)
          localStorage.setItem('checkout_address_id', String(created.id))
        }
      }
      setTimeout(() => navigate('/checkout/payment'), 300)
    } catch {
      showToast('Failed to save address. Please try again.', 'error')
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeleting(id)
    try {
      if (id > 0) {
        await addressService.delete(id)
      } else {
        const local = JSON.parse(localStorage.getItem('phonehub_addresses') || '[]')
        localStorage.setItem('phonehub_addresses', JSON.stringify(local.filter((a: any) => Number(a.id) !== id)))
      }
      setAddresses(prev => prev.filter(a => a.id !== id))
      if (selectedId === id) setSelectedId(null)
      showToast('Address deleted successfully', 'success')
    } catch { showToast('Failed to delete address', 'error') }
    setDeleting(null)
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      <style>{`
        .mint-glow { box-shadow: 0 0 20px rgba(79,227,193,0.4); }
        .neon-line { height: 2px; background: linear-gradient(90deg, #4FE3C1 0%, transparent 100%); box-shadow: 0 0 10px #4FE3C1; }
        @keyframes pulseMint { 0%, 100% { box-shadow: 0 0 0 0 rgba(79, 227, 193, 0.4); } 50% { box-shadow: 0 0 0 12px rgba(79, 227, 193, 0); } }
      `}</style>

      <StorefrontNavbar activeLabel="Home" />
      <div className="pt-24"><BackBar label="Back to Cart" to="/cart" /></div>

      <main className="pt-8 pb-24 px-4 md:px-8 max-w-[1200px] mx-auto">
        {/* Progress Stepper */}
        <CheckoutStepper currentStep={step} />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h1 className="font-bold tracking-tight mb-1" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: '#454747' }}>Delivery Address</h1>
          <p className="text-sm" style={{ color: '#434748' }}>Configure the delivery destination for your premium restoration hardware.</p>
        </motion.div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Saved Addresses */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-xs font-bold tracking-widest mb-4 flex items-center gap-2" style={{ color: '#434748' }}>
              <span className="material-symbols-outlined text-sm">database</span>
              SAVED NODES
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                  <FiLoader size={28} className="text-mint" />
                </motion.div>
              </div>
            ) : addresses.length === 0 && !showForm ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center py-16 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant">inventory_2</span>
                </div>
                <h3 className="text-lg font-bold mb-1">No Address Found</h3>
                <p className="text-sm text-on-surface-variant mb-6">Add your first delivery address to continue checkout.</p>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setEditingAddress(null); setShowForm(true) }}
                  className="flex items-center gap-2 px-8 h-12 rounded-full text-sm font-bold text-white shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #4FE3C1, #454747)' }}
                >
                  <FiPlus size={16} /> Add Address
                </motion.button>
              </motion.div>
            ) : (
              <>
                {/* Address Cards */}
                <AnimatePresence mode="popLayout">
                  {addresses.map((addr, i) => {
                    const isSelected = selectedId === addr.id
                    const isDeleting = deleting === addr.id
                    return (
                      <motion.div
                        key={addr.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => !isDeleting && setSelectedId(addr.id!)}
                        className={`relative rounded-xl p-[2.5rem] cursor-pointer transition-all duration-300 ${
                          isDeleting ? 'opacity-50 pointer-events-none' : ''
                        }`}
                        style={{
                          background: isSelected
                            ? 'rgba(79,227,193,0.08)'
                            : 'rgba(255,255,255,0.4)',
                          backdropFilter: 'blur(25px)',
                          WebkitBackdropFilter: 'blur(25px)',
                          border: isSelected
                            ? '1px solid rgba(79,227,193,0.5)'
                            : '1px solid rgba(217,222,229,0.5)',
                          boxShadow: isSelected
                            ? '0 0 0 1px rgba(79,227,193,0.2), 0 10px 30px rgba(0,0,0,0.05)'
                            : 'inset 0 1px 1px rgba(255,255,255,0.8)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) {
                            e.currentTarget.style.transform = 'translateY(-4px)'
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(79,227,193,0.2)'
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.8)'
                          }
                        }}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 p-4">
                            <span className="bg-mint/20 text-secondary text-[10px] font-bold px-3 py-1 rounded-full border border-mint/30 uppercase tracking-widest">
                              VERIFIED NODE
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {addr.addressType === 'Home' ? 'home' : addr.addressType === 'Office' ? 'work' : 'location_on'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              <h3 className="text-sm font-bold">{addr.fullName}</h3>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                addr.addressType === 'Home' ? 'bg-mint/10 text-mint' : addr.addressType === 'Office' ? 'bg-cyan-500/10 text-cyan-600' : 'bg-mint/10 text-mint'
                              }`}>
                                {typeIcons[addr.addressType]} {addr.addressType}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-mint/15 text-mint border border-mint/30">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mb-2">
                              <FiPhone size={10} /> {addr.mobile}
                            </p>
                            <div className="text-sm leading-relaxed text-on-surface-variant space-y-0.5">
                              <p>ID: NODE-{String(addr.id || i).padStart(4, '0')}-{(addr.city || 'XX').slice(0, 2).toUpperCase()}</p>
                              <p>{addr.addressLine1}</p>
                              {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                              {addr.landmark && <p className="text-xs">Landmark: {addr.landmark}</p>}
                              <p className="font-medium text-primary">{addr.city}, {addr.state} - {addr.zipCode}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              onClick={e => { e.stopPropagation(); setEditingAddress(addr); setShowForm(true) }}
                              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/80 border border-glass-border text-on-surface-variant hover:text-mint transition-all cursor-pointer"
                            >
                              <FiEdit2 size={12} />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(addr.id!) }}
                              disabled={isDeleting}
                              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/80 border border-glass-border text-on-surface-variant hover:text-red-500 transition-all cursor-pointer"
                            >
                              {isDeleting ? <FiLoader size={12} className="animate-spin" /> : <FiTrash2 size={12} />}
                            </button>
                          </div>
                        </div>
                        {isSelected && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="absolute -inset-px rounded-xl pointer-events-none"
                            style={{ background: 'linear-gradient(135deg, rgba(79,227,193,0.06), transparent, rgba(79,227,193,0.06))', zIndex: -1 }}
                          />
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {/* Add New Address */}
                {!showForm && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setEditingAddress(null); setShowForm(true) }}
                    className="w-full py-6 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant font-bold text-xs tracking-widest hover:border-mint hover:text-mint transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                    PROVISION NEW NODE
                  </motion.button>
                )}

                {/* Quick Add / Edit Form */}
                <AnimatePresence>
                  {showForm && (
                    <QuickAddressForm
                      key={editingAddress?.id || 'new'}
                      initialAddress={editingAddress || undefined}
                      onSaved={(addr) => {
                        if (editingAddress) {
                          setAddresses(prev => prev.map(a => a.id === addr.id ? addr : a))
                          showToast('Address updated successfully', 'success')
                        } else {
                          setAddresses(prev => [...prev, addr])
                          showToast('Address created successfully', 'success')
                        }
                        if (addr.id) setSelectedId(addr.id)
                        setEditingAddress(null)
                        setShowForm(false)
                      }}
                      onCancel={() => { setEditingAddress(null); setShowForm(false) }}
                    />
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Right: Address Details Form */}
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border-2" style={{ borderColor: 'rgba(79, 227, 193, 0.2)', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(25px)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 10px 30px rgba(0,0,0,0.05)' }}>
              <div className="px-8 py-6 text-white flex items-center gap-3" style={{ background: '#454747' }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                <h2 className="text-lg font-bold">Address Details</h2>
              </div>
              <div className="p-8 space-y-6">
                <form onSubmit={e => { e.preventDefault(); handleContinue() }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest" style={{ color: '#434748' }}>Full Name</label>
                      <input className="w-full h-11 px-4 rounded-xl text-xs font-medium outline-none transition-all"
                        style={{ border: '1px solid #c4c7c7', background: 'rgba(255,255,255,0.8)', color: '#181c1e' }}
                        placeholder="Full Name" type="text" value={terminalForm.fullName}
                        onChange={e => setTerminalForm(p => ({ ...p, fullName: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest" style={{ color: '#434748' }}>Phone Number</label>
                      <input className="w-full h-11 px-4 rounded-xl text-xs font-medium outline-none transition-all"
                        style={{ border: '1px solid #c4c7c7', background: 'rgba(255,255,255,0.8)', color: '#181c1e' }}
                        placeholder="Phone Number" type="tel" value={terminalForm.mobile}
                        onChange={e => setTerminalForm(p => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest" style={{ color: '#434748' }}>Address Line 1</label>
                      <input className="w-full h-11 px-4 rounded-xl text-xs font-medium outline-none transition-all"
                        style={{ border: '1px solid #c4c7c7', background: 'rgba(255,255,255,0.8)', color: '#181c1e' }}
                        placeholder="e.g. 123 Tech Lane" type="text" value={terminalForm.addressLine1}
                      onChange={e => setTerminalForm(p => ({ ...p, addressLine1: e.target.value }))} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest" style={{ color: '#434748' }}>Address Line 2</label>
                      <input className="w-full h-11 px-4 rounded-xl text-xs font-medium outline-none transition-all"
                        style={{ border: '1px solid #c4c7c7', background: 'rgba(255,255,255,0.8)', color: '#181c1e' }}
                        placeholder="Suite 404" type="text" value={terminalForm.addressLine2}
                        onChange={e => setTerminalForm(p => ({ ...p, addressLine2: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest" style={{ color: '#434748' }}>LANDMARK</label>
                      <input className="w-full h-11 px-4 rounded-xl text-xs font-medium outline-none transition-all"
                        style={{ border: '1px solid #c4c7c7', background: 'rgba(255,255,255,0.8)', color: '#181c1e' }}
                        placeholder="Nearby landmark" type="text" value={terminalForm.landmark}
                        onChange={e => setTerminalForm(p => ({ ...p, landmark: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest" style={{ color: '#434748' }}>CITY</label>
                      <input className="w-full h-11 px-4 rounded-xl text-xs font-medium outline-none transition-all"
                        style={{ border: '1px solid #c4c7c7', background: 'rgba(255,255,255,0.8)', color: '#181c1e' }}
                        placeholder="City" type="text" value={terminalForm.city}
                        onChange={e => setTerminalForm(p => ({ ...p, city: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest" style={{ color: '#434748' }}>STATE</label>
                      <input className="w-full h-11 px-4 rounded-xl text-xs font-medium outline-none transition-all"
                        style={{ border: '1px solid #c4c7c7', background: 'rgba(255,255,255,0.8)', color: '#181c1e' }}
                        placeholder="State" type="text" value={terminalForm.state}
                        onChange={e => setTerminalForm(p => ({ ...p, state: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest" style={{ color: '#434748' }}>ZIP Code</label>
                      <input className="w-full h-11 px-4 rounded-xl text-xs font-medium outline-none transition-all"
                        style={{ border: '1px solid #c4c7c7', background: 'rgba(255,255,255,0.8)', color: '#181c1e' }}
                        placeholder="00000" type="text" value={terminalForm.zipCode}
                        onChange={e => setTerminalForm(p => ({ ...p, zipCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest" style={{ color: '#434748' }}>ADDRESS TYPE</label>
                    <div className="flex gap-3">
                      {(['Home', 'Office', 'Other'] as const).map(type => (
                        <motion.button key={type} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => setTerminalForm(p => ({ ...p, addressType: type }))}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            terminalForm.addressType === type
                              ? 'text-white shadow-md'
                              : 'bg-white/80 border border-glass-border text-on-surface-variant hover:border-mint/50'
                          }`}
                          style={terminalForm.addressType === type ? { background: 'linear-gradient(135deg, #4FE3C1, #454747)' } : {}}
                        >
                          {typeIcons[type]} {type}
                          {terminalForm.addressType === type && <FiCheck size={11} />}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group pt-2">
                    <motion.div whileTap={{ scale: 0.9 }}
                      onClick={() => setTerminalForm(p => ({ ...p, isDefault: !p.isDefault }))}
                      className={`w-5 h-5 rounded flex items-center justify-center transition-all border ${
                        terminalForm.isDefault ? 'bg-mint border-mint shadow-sm shadow-mint/30' : 'bg-white/80 border-glass-border group-hover:border-mint/50'
                      }`}
                    >
                      {terminalForm.isDefault && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                          <FiCheck size={11} className="text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                    <span className="text-sm text-on-surface-variant group-hover:text-primary transition-colors">Set as default address</span>
                  </label>

                  <div className="space-y-4 pt-6 border-t border-glass-border">
                    <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-glass-border">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-mint" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        <div>
                          <p className="text-sm font-semibold">ENCRYPTED STORAGE</p>
                          <p className="text-[11px] text-on-surface-variant opacity-60">Save these coordinates for future deployments</p>
                        </div>
                      </div>
                      <input defaultChecked type="checkbox" className="w-5 h-5 rounded border-glass-border text-mint focus:ring-mint" />
                    </div>

                    <div className="bg-primary/5 p-4 rounded-xl flex items-start gap-4">
                      <span className="material-symbols-outlined text-primary mt-0.5">info</span>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        Precision Logistics: All hardware is vacuum-sealed and deployed via climate-controlled courier to ensure component integrity.
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={submitting}
                      className={`w-full py-5 rounded-full text-sm font-bold tracking-tight flex items-center justify-center gap-3 transition-all active:scale-95 group ${
                        !submitting ? 'text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      style={!submitting ? { background: 'linear-gradient(135deg, #4FE3C1 0%, #454747 100%)', boxShadow: '0 0 0 0 rgba(79, 227, 193, 0.4)', animation: 'pulseMint 2s infinite' } : undefined}
                    >
                      {submitting ? (
                        <FiLoader size={18} className="animate-spin" />
                      ) : (
                        <>
                          INITIALIZE SECURE PAYMENT
                          <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform text-[18px]">arrow_forward</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>

              {/* Security Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex items-center justify-center gap-6 md:gap-12 opacity-50 hover:opacity-100 transition-all duration-700"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl">shield_lock</span>
                <span className="text-[10px] font-bold tracking-wider">LAB-GRADE AES-256</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl">biotech</span>
                <span className="text-[10px] font-bold tracking-wider">ISO 27001 VERIFIED</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl">security</span>
                <span className="text-[10px] font-bold tracking-wider">QUANTUM SECURE</span>
              </div>
            </motion.div>
            </div>
          </div>
        </div>
      </main>

      <EcommerceFooter />
    </div>
  )
}

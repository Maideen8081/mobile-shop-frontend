import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheck, FiPlus, FiEdit2, FiLoader, FiMapPin, FiPhone, FiAlertCircle, FiTrash2, FiChevronRight } from 'react-icons/fi'
import { Home, Briefcase, Shield, Lock, Truck, MapPin } from 'lucide-react'
import { addressService, type AddressData } from '../services/addressService'
import { useToast } from '../context/ToastContext'
import { authService } from '../services/authService'
import { useIsMobile } from '../components/mobile/helpers'
import DesktopPageLoader from '../components/ui/DesktopPageLoader'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import BackBar from '../components/ecommerce/BackBar'
import EcommerceFooter from '../components/ecommerce/Footer'
import MobileCheckoutAddress from '../components/mobile/MobileCheckoutAddress'

type AddressType = AddressData['addressType']

const RED = '#CB202D'
const RED_DEEP = '#A81D2A'
const RED_LIGHT = '#FFF5F5'

const steps = [
  { id: 1, label: 'Cart', icon: 'shopping_cart' },
  { id: 2, label: 'Address', icon: 'location_on' },
  { id: 3, label: 'Payment', icon: 'payments' },
]

const typeIcons: Record<string, React.ReactNode> = {
  Home: <Home size={14} />,
  Office: <Briefcase size={14} />,
  Other: <MapPin size={14} />,
}

function FloatingInput({ label, value, onChange, error, type = 'text', maxLength }: {
  label: string; value: string; onChange: (v: string) => void; error?: string; type?: string; maxLength?: number
}) {
  return (
    <div className="relative group">
      <input
        type={type} value={value} placeholder=" " maxLength={maxLength}
        onChange={e => onChange(e.target.value)}
        className="peer w-full h-[52px] px-4 pt-5 pb-2 rounded-xl text-sm outline-none transition-all duration-300 border-2"
        style={{
          background: '#FAFAFA',
          borderColor: error ? '#EF4444' : '#E5E7EB',
          color: '#111827',
        }}
        onFocus={e => { if (!error) e.currentTarget.style.borderColor = RED; e.currentTarget.style.background = '#fff' }}
        onBlur={e => { if (!error) e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#FAFAFA' }}
      />
      <label className={`absolute left-4 transition-all duration-200 pointer-events-none font-semibold
        ${value ? 'top-1.5 text-[10px]' : 'top-3.5 text-sm'}
        ${error ? 'text-red-500' : value ? 'text-red-500' : 'text-gray-400'}`}>
        {label}
      </label>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 text-[10px] mt-1.5 ml-1 text-red-500 font-medium">
          <FiAlertCircle size={10} /> {error}
        </motion.p>
      )}
    </div>
  )
}

function CheckoutStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((step, i) => {
        const isActive = step.id === currentStep
        const isCompleted = step.id < currentStep
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className={`relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isCompleted ? 'text-white' : isActive ? 'text-white' : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                }`}
                style={isCompleted || isActive ? {
                  background: `linear-gradient(135deg, ${RED}, ${RED_DEEP})`,
                  boxShadow: `0 8px 24px ${RED}40`,
                } : undefined}>
                {isCompleted ? (
                  <FiCheck size={20} />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>
                    {step.icon}
                  </span>
                )}
                {isActive && (
                  <div className="absolute -inset-1 rounded-full border-2 border-red-300/50 animate-ping" style={{ animationDuration: '2s' }} />
                )}
              </motion.div>
              <span className={`text-[10px] font-bold tracking-widest ${isActive ? 'text-red-500' : isCompleted ? 'text-red-500' : 'text-gray-400'}`}>
                {step.label.toUpperCase()}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-20 h-[3px] rounded-full bg-gray-200 overflow-hidden mx-2 mb-6">
                <motion.div initial={{ width: 0 }} animate={{ width: isCompleted ? '100%' : '0%' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${RED}, ${RED_DEEP})` }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AddressForm({ onSaved, onCancel, initialAddress }: {
  onSaved: (addr: AddressData) => void; onCancel: () => void; initialAddress?: AddressData
}) {
  const showToast = useToast().show
  const [form, setForm] = useState({
    fullName: initialAddress?.fullName || '', mobile: initialAddress?.mobile || '',
    addressLine1: initialAddress?.addressLine1 || '', addressLine2: initialAddress?.addressLine2 || '',
    landmark: initialAddress?.landmark || '', city: initialAddress?.city || '', state: initialAddress?.state || '',
    zipCode: initialAddress?.zipCode || '', country: initialAddress?.country || 'India',
    addressType: (initialAddress?.addressType || 'Home') as AddressType, isDefault: initialAddress?.isDefault || false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form, v: string | boolean) => {
    if (k === 'mobile') v = (v as string).replace(/\D/g, '').slice(0, 10)
    if (k === 'zipCode') v = (v as string).replace(/\D/g, '').slice(0, 6)
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k as string]) setErrors(p => { const n = { ...p }; delete n[k as string]; return n })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    else if (form.fullName.trim().length < 3) e.fullName = 'Minimum 3 characters'
    if (!form.mobile) e.mobile = 'Phone number is required'
    else if (!/^\d{10}$/.test(form.mobile)) e.mobile = 'Must be exactly 10 digits'
    if (!form.addressLine1.trim()) e.addressLine1 = 'Address is required'
    else if (form.addressLine1.trim().length < 10) e.addressLine1 = 'Minimum 10 characters'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.state.trim()) e.state = 'State is required'
    if (!form.zipCode.trim()) e.zipCode = 'Pincode is required'
    else if (!/^\d{5,6}$/.test(form.zipCode)) e.zipCode = 'Must be 5-6 digits'
    return e
  }

  const handleSave = async () => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      if (initialAddress?.id) {
        const updated = await addressService.update(initialAddress.id, { ...form })
        onSaved(updated)
      } else {
        const created = await addressService.create({ ...form, country: 'India', isDefault: form.isDefault })
        onSaved(created)
      }
    } catch { showToast('Failed to save address', 'error') }
    setSaving(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
      className="rounded-2xl overflow-hidden border border-gray-100/80"
      style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)', boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="px-7 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <h3 className="text-sm font-bold text-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${RED}20` }}>
            <span className="material-symbols-outlined" style={{ color: RED, fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
              {initialAddress ? 'edit_location' : 'add_location'}
            </span>
          </div>
          {initialAddress ? 'Edit Address' : 'New Address'}
        </h3>
        <button onClick={onCancel} className="text-xs font-medium text-gray-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/10">
          Cancel
        </button>
      </div>
      <div className="p-7 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <FloatingInput label="Full Name" value={form.fullName} onChange={v => set('fullName', v)} error={errors.fullName} />
          <FloatingInput label="Phone Number" value={form.mobile} onChange={v => set('mobile', v)} error={errors.mobile} type="tel" maxLength={10} />
        </div>
        <FloatingInput label="Address Line 1" value={form.addressLine1} onChange={v => set('addressLine1', v)} error={errors.addressLine1} />
        <div className="grid grid-cols-2 gap-5">
          <FloatingInput label="Address Line 2 (Optional)" value={form.addressLine2} onChange={v => set('addressLine2', v)} />
          <FloatingInput label="Landmark (Optional)" value={form.landmark} onChange={v => set('landmark', v)} />
        </div>
        <div className="grid grid-cols-3 gap-5">
          <FloatingInput label="City" value={form.city} onChange={v => set('city', v)} error={errors.city} />
          <FloatingInput label="State" value={form.state} onChange={v => set('state', v)} error={errors.state} />
          <FloatingInput label="Pincode" value={form.zipCode} onChange={v => set('zipCode', v)} error={errors.zipCode} type="tel" maxLength={6} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Address Type</p>
          <div className="flex gap-3">
            {(['Home', 'Office', 'Other'] as const).map(type => (
              <motion.button key={type} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => set('addressType', type)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                  form.addressType === type
                    ? 'text-white border-transparent shadow-lg'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-red-300'
                }`}
                style={form.addressType === type ? {
                  background: `linear-gradient(135deg, ${RED}, ${RED_DEEP})`,
                  boxShadow: `0 8px 20px ${RED}30`,
                } : undefined}>
                {typeIcons[type]} {type}
                {form.addressType === type && <FiCheck size={12} />}
              </motion.button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => set('isDefault', !form.isDefault)}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all border-2 cursor-pointer ${
              form.isDefault ? 'border-red-500' : 'border-gray-300 group-hover:border-red-300'
            }`}
            style={form.isDefault ? { background: `linear-gradient(135deg, ${RED}, ${RED_DEEP})` } : undefined}>
            {form.isDefault && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                <FiCheck size={12} className="text-white" />
              </motion.div>
            )}
          </motion.button>
          <span className="text-sm text-gray-500 group-hover:text-red-500 transition-colors font-medium">Set as default delivery address</span>
        </label>
        <div className="flex gap-3 pt-3">
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={onCancel}
            className="flex-1 h-13 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer">
            Cancel
          </motion.button>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleSave} disabled={saving}
            className="flex-1 h-13 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${RED}, ${RED_DEEP})`, boxShadow: `0 8px 24px ${RED}30` }}>
            {saving ? <FiLoader size={16} className="animate-spin" /> : <FiCheck size={16} />}
            {saving ? 'Saving...' : initialAddress?.id ? 'Update Address' : 'Save Address'}
          </motion.button>
        </div>
      </div>
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
  const [deleting, setDeleting] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', '/checkout/address')
      navigate('/login', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    let mounted = true
    addressService.list()
      .then(data => {
        if (!mounted) return
        const withIds = data.map((a, i) => ({ ...a, id: a.id ?? -(i + 1) }))
        setAddresses(withIds)
        const def = withIds.find(a => a.isDefault && a.id && a.id > 0)
        if (def && def.id) setSelectedId(def.id)
        else { const first = withIds.find(a => a.id && a.id > 0); if (first?.id) setSelectedId(first.id) }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const handleDelete = async (id: number) => {
    setDeleting(id)
    try {
      await addressService.delete(id)
      setAddresses(prev => prev.filter(a => a.id !== id))
      if (selectedId === id) setSelectedId(null)
      showToast('Address deleted successfully', 'success')
    } catch { showToast('Failed to delete address', 'error') }
    setDeleting(null)
    setConfirmDelete(null)
  }

  const handleContinue = () => {
    if (!selectedId) { showToast('Please select or add a delivery address', 'error'); return }
    localStorage.setItem('checkout_address_id', String(selectedId))
    navigate('/checkout/payment')
  }

  if (loading) {
    return (
      <>
        <SiteTopNav />
        <BackBar label="Back to Cart" to="/cart" />
        <DesktopPageLoader text="Loading your addresses..." />
      </>
    )
  }

  return (
    <div className="min-h-screen text-gray-900 font-sans" style={{ background: 'linear-gradient(180deg, #F8F9FA 0%, #FFFFFF 100%)' }}>
      <SiteTopNav />
      <BackBar label="Back to Cart" to="/cart" />

      <main className="pt-6 pb-24 px-4 md:px-8 max-w-[1140px] mx-auto">
        <CheckoutStepper currentStep={2} />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Delivery Address</h1>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">Choose where you'd like your order delivered. All addresses are securely encrypted.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Saved Addresses */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase flex items-center gap-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${RED}15` }}>
                  <span className="material-symbols-outlined" style={{ color: RED, fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                </div>
                SAVED ADDRESSES
              </h2>
              {!loading && addresses.length > 0 && (
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{addresses.length}</span>
              )}
            </div>

            {addresses.length === 0 && !showForm ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200"
                style={{ background: 'linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%)' }}>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: `${RED}10` }}>
                  <FiMapPin size={28} style={{ color: RED }} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No addresses yet</h3>
                <p className="text-sm text-gray-500 mb-6">Add your first delivery address to continue checkout</p>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setEditingAddress(null); setShowForm(true) }}
                  className="inline-flex items-center gap-2 px-7 h-12 rounded-xl text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${RED}, ${RED_DEEP})`, boxShadow: `0 8px 24px ${RED}30` }}>
                  <FiPlus size={18} /> Add Address
                </motion.button>
              </motion.div>
            ) : (
              <>
                <AnimatePresence mode="popLayout">
                  {addresses.map((addr, i) => {
                    const isSelected = selectedId === addr.id
                    const isDeleting = deleting === addr.id
                    return (
                      <motion.div key={addr.id} layout
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                        transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={() => !isDeleting && setSelectedId(addr.id!)}
                        className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-300 border-2 ${
                          isDeleting ? 'opacity-40 pointer-events-none' : ''
                        }`}
                        style={{
                          background: isSelected
                            ? `linear-gradient(135deg, ${RED_LIGHT} 0%, #FFFFFF 100%)`
                            : 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
                          borderColor: isSelected ? RED : '#F0F0F0',
                          boxShadow: isSelected
                            ? `0 0 0 4px ${RED}15, 0 12px 32px ${RED}15`
                            : '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                        onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = `${RED}40`; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)' } }}
                        onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#F0F0F0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' } }}>
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                              <FiCheck size={10} /> Selected
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: isSelected ? `${RED}15` : '#F5F5F5' }}>
                            <span className="material-symbols-outlined" style={{ color: isSelected ? RED : '#9CA3AF', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                              {addr.addressType === 'Home' ? 'home' : addr.addressType === 'Office' ? 'work' : 'location_on'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-bold text-gray-900">{addr.fullName}</h3>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                              }`}>{addr.addressType}</span>
                              {addr.isDefault && (
                                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600">DEFAULT</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-1.5">
                              <FiPhone size={10} /> {addr.mobile}
                            </p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                            </p>
                            {addr.landmark && <p className="text-[11px] text-gray-400 mt-0.5">Near {addr.landmark}</p>}
                            <p className="text-xs font-bold text-gray-900 mt-1.5">{addr.city}, {addr.state} - {addr.zipCode}</p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              onClick={e => { e.stopPropagation(); setEditingAddress(addr); setShowForm(true) }}
                              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                              style={{ background: '#F5F5F5', color: '#9CA3AF' }}
                              onMouseEnter={e => { e.currentTarget.style.background = `${RED}15`; e.currentTarget.style.color = RED }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#F5F5F5'; e.currentTarget.style.color = '#9CA3AF' }}>
                              <FiEdit2 size={13} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              onClick={e => { e.stopPropagation(); setConfirmDelete(addr.id!) }}
                              disabled={isDeleting}
                              className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 transition-all cursor-pointer disabled:opacity-50">
                              {isDeleting ? <FiLoader size={13} className="animate-spin" /> : <FiTrash2 size={13} />}
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {!showForm && (
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => { setEditingAddress(null); setShowForm(true) }}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold text-xs tracking-widest hover:border-red-300 hover:text-red-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: 'linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%)' }}>
                    <FiPlus size={14} /> ADD NEW ADDRESS
                  </motion.button>
                )}

                <AnimatePresence>
                  {showForm && (
                    <AddressForm
                      key={editingAddress?.id || 'new'}
                      initialAddress={editingAddress || undefined}
                      onSaved={(addr) => {
                        if (editingAddress) {
                          setAddresses(prev => prev.map(a => a.id === addr.id ? addr : a))
                          showToast('Address updated successfully', 'success')
                        } else {
                          setAddresses(prev => [...prev, addr])
                          showToast('Address added successfully', 'success')
                        }
                        if (addr.id) setSelectedId(addr.id)
                        setEditingAddress(null); setShowForm(false)
                      }}
                      onCancel={() => { setEditingAddress(null); setShowForm(false) }}
                    />
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Right: Order Summary & Continue */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl overflow-hidden border border-gray-100/80"
              style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)', boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="px-7 py-5" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
                <h2 className="text-sm font-bold text-white flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${RED}20` }}>
                    <span className="material-symbols-outlined" style={{ color: RED, fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                  </div>
                  DELIVERY SUMMARY
                </h2>
              </div>

              {selectedId ? (
                <div className="p-7">
                  {(() => {
                    const addr = addresses.find(a => a.id === selectedId)
                    if (!addr) return null
                    return (
                      <div className="space-y-5">
                        <div className="p-5 rounded-xl border-2" style={{ borderColor: `${RED}20`, background: `${RED_LIGHT}` }}>
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${RED}15` }}>
                              <span className="material-symbols-outlined" style={{ color: RED, fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>
                                {addr.addressType === 'Home' ? 'home' : addr.addressType === 'Office' ? 'work' : 'location_on'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                <p className="text-sm font-bold text-gray-900">{addr.fullName}</p>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${RED}15`, color: RED }}>{addr.addressType}</span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                              </p>
                              {addr.landmark && <p className="text-[11px] text-gray-400 mt-0.5">Near {addr.landmark}</p>}
                              <p className="text-xs font-bold text-gray-900 mt-1.5">{addr.city}, {addr.state} - {addr.zipCode}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1.5"><FiPhone size={10} /> {addr.mobile}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${RED}10` }}>
                              <Truck size={18} style={{ color: RED }} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivery</p>
                              <p className="text-xs font-bold text-gray-900">3-5 Days</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                              <span className="material-symbols-outlined text-green-500" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>verified</span>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
                              <p className="text-xs font-bold text-gray-900">Verified</p>
                            </div>
                          </div>
                        </div>

                        <motion.button whileHover={{ scale: 1.01, boxShadow: `0 12px 32px ${RED}40` }} whileTap={{ scale: 0.99 }}
                          onClick={handleContinue}
                          className="w-full py-5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-3 transition-all cursor-pointer"
                          style={{ background: `linear-gradient(135deg, ${RED}, ${RED_DEEP})`, boxShadow: `0 8px 24px ${RED}30` }}>
                            <>
                              Continue to Payment
                              <FiChevronRight size={18} />
                            </>
                        </motion.button>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#F5F5F5' }}>
                    <FiMapPin size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">No address selected</p>
                  <p className="text-xs text-gray-400">Choose an address from the left panel to continue</p>
                </div>
              )}
            </div>

            {/* Security badges */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="mt-8 flex items-center justify-center gap-8">
              {[
                { icon: <Shield size={16} />, label: 'SSL ENCRYPTED' },
                { icon: <Lock size={16} />, label: 'SECURE CHECKOUT' },
                { icon: <Truck size={16} />, label: 'SAFE DELIVERY' },
              ].map(badge => (
                <div key={badge.label} className="flex items-center gap-2 opacity-30 hover:opacity-70 transition-opacity">
                  <span className="text-gray-500">{badge.icon}</span>
                  <span className="text-[9px] font-bold tracking-widest text-gray-500">{badge.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                <FiTrash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Address?</h3>
              <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
                This address will be permanently removed from your account. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 h-12 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">
                  Keep Address
                </motion.button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', boxShadow: '0 8px 20px rgba(239,68,68,0.3)' }}>
                  {deleting ? <FiLoader size={16} className="animate-spin" /> : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EcommerceFooter compact />
    </div>
  )
}

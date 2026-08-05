import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronLeft, FiPlus, FiEdit2, FiTrash2, FiPhone, FiCheck, FiLoader, FiMapPin, FiAlertCircle } from 'react-icons/fi'
import { Home, Briefcase } from 'lucide-react'
import { addressService, type AddressData } from '../../services/addressService'
import DoubleRingLoader from '../ui/DoubleRingLoader'
import { authService } from '../../services/authService'
import { useMobileToast } from './useMobileToast'

const RED = '#CB202D'
const RED_DEEP = '#A81D2A'
const SUCCESS = '#16A34A'

const typeIcons: Record<string, React.ReactNode> = {
  Home: <Home size={14} />,
  Office: <Briefcase size={14} />,
  Other: <FiMapPin size={14} />,
}

function Field({ label, value, onChange, error, type = 'text', maxLength }: {
  label: string; value: string; onChange: (v: string) => void; error?: string; type?: string; maxLength?: number
}) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">{label}</label>
      <input type={type} value={value} maxLength={maxLength} onChange={e => onChange(e.target.value)}
        className="w-full h-12 px-3.5 rounded-xl text-[14px] bg-white border outline-none transition"
        style={{ borderColor: error ? '#EF4444' : '#E5E7EB', color: '#111827' }} />
      {error && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><FiAlertCircle size={9} /> {error}</p>}
    </div>
  )
}

export default function MobileCheckoutAddress() {
  const navigate = useNavigate()
  const { show: showToast, Toast } = useMobileToast()

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', '/checkout/address')
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AddressData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const [form, setForm] = useState({
    fullName: '', mobile: '', addressLine1: '', addressLine2: '',
    landmark: '', city: '', state: '', zipCode: '', addressType: 'Home' as const, isDefault: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: keyof typeof form, v: string | boolean) => {
    if (k === 'mobile') v = (v as string).replace(/\D/g, '').slice(0, 10)
    if (k === 'zipCode') v = (v as string).replace(/\D/g, '').slice(0, 6)
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k as string]) setErrors(p => { const n = { ...p }; delete n[k as string]; return n })
  }

  const selectedAddress = addresses.find(a => a.id === selectedId)

  useEffect(() => {
    let mounted = true
    addressService.list()
      .then(data => {
        if (!mounted) return
        const withIds = data.map((a, i) => ({ ...a, id: a.id ?? -(i + 1) }))
        setAddresses(withIds)
        const def = withIds.find(a => a.isDefault && a.id && a.id > 0)
        setSelectedId(def?.id ?? withIds.find(a => a.id && a.id > 0)?.id ?? null)
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const openForm = (addr?: AddressData) => {
    if (addr) {
      setEditing(addr)
      setForm({
        fullName: addr.fullName || '', mobile: addr.mobile || '', addressLine1: addr.addressLine1 || '',
        addressLine2: addr.addressLine2 || '', landmark: addr.landmark || '', city: addr.city || '',
        state: addr.state || '', zipCode: addr.zipCode || '', addressType: (addr.addressType as any) || 'Home', isDefault: addr.isDefault || false,
      })
    } else {
      setEditing(null)
      setForm({ fullName: '', mobile: '', addressLine1: '', addressLine2: '', landmark: '', city: '', state: '', zipCode: '', addressType: 'Home', isDefault: false })
    }
    setErrors({})
    setShowForm(true)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Name is required'
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = '10-digit mobile required'
    if (!form.addressLine1.trim()) e.addressLine1 = 'Address is required'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.state.trim()) e.state = 'State is required'
    if (!/^\d{5,6}$/.test(form.zipCode)) e.zipCode = 'Pincode required'
    return e
  }

  const saveForm = async () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    try {
      if (editing?.id) {
        const updated = await addressService.update(editing.id, { ...form })
        setAddresses(prev => prev.map(a => a.id === updated.id ? updated : a))
        showToast('Address updated', 'success')
      } else {
        const created = await addressService.create({ ...form, country: 'India' })
        setAddresses(prev => [...prev, created])
        if (created.id) setSelectedId(created.id)
        showToast('Address added', 'success')
      }
      setShowForm(false)
    } catch { showToast('Failed to save address', 'error') }
  }

  const handleContinue = async () => {
    if (!selectedId || !selectedAddress) { showToast('Select or add an address', 'error'); return }
    setSubmitting(true)
    try {
      localStorage.setItem('checkout_address_id', String(selectedId))
      setTimeout(() => navigate('/checkout/payment'), 200)
    } catch { showToast('Failed', 'error'); setSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    setDeleting(id)
    try {
      await addressService.delete(id)
      setAddresses(prev => prev.filter(a => a.id !== id))
      if (selectedId === id) setSelectedId(null)
      showToast('Address deleted', 'success')
    } catch { showToast('Failed to delete', 'error') }
    setDeleting(null)
    setConfirmDelete(null)
  }

  return (
    <div className="min-h-screen bg-white max-w-[480px] mx-auto font-sans text-gray-900 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center active:scale-90 transition border border-gray-200">
          <FiChevronLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <p className="text-[15px] font-bold text-gray-900">Delivery Address</p>
          <p className="text-[10px] text-gray-400">Select where to ship your order</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="px-4 pt-3 pb-2 flex items-center">
        {['Cart', 'Address', 'Payment'].map((label, i) => {
          const step = i + 1
          const done = step < 2
          const active = step === 2
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition ${
                  done || active ? 'text-white' : 'bg-white text-gray-400 border border-gray-200'
                }`} style={done || active ? { background: `linear-gradient(135deg,${RED},${RED_DEEP})` } : undefined}>
                  {done ? <FiCheck size={13} /> : step}
                </div>
                <span className={`text-[9px] mt-1 font-semibold ${active ? '' : 'text-gray-400'}`} style={active ? { color: RED } : undefined}>{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-[2px] mx-1.5 rounded-full ${done ? '' : 'bg-gray-200'}`} style={done ? { background: `linear-gradient(135deg,${RED},${RED_DEEP})` } : undefined} />}
            </div>
          )
        })}
      </div>

      {/* Content */}
      <div className="px-4 mt-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><DoubleRingLoader size={36} label="Loading addresses..." /></div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="rounded-2xl p-8 text-center border border-gray-100" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-[#FEE2E2]">
              <FiMapPin size={28} className="text-[#CB202D]" />
            </div>
            <h2 className="text-[16px] font-bold text-gray-900 mb-1">No saved addresses</h2>
            <p className="text-[12px] text-gray-400 mb-5">Add your delivery address to continue checkout</p>
            <button onClick={() => openForm()} className="h-12 px-6 rounded-xl text-[13px] font-bold text-white inline-flex items-center gap-2"
              style={{ background: `linear-gradient(135deg,${RED},${RED_DEEP})` }}>
              <FiPlus size={16} /> Add New Address
            </button>
          </div>
        ) : (
          <>
            {addresses.map(addr => {
              const isSel = selectedId === addr.id
              return (
                <motion.div key={addr.id}
                  onClick={() => setSelectedId(addr.id ?? null)}
                  className={`rounded-2xl p-4 cursor-pointer border-2 transition-all duration-200`}
                  style={{
                    background: isSel ? '#FFF5F5' : '#fff',
                    borderColor: isSel ? RED : '#F3F4F6',
                    boxShadow: isSel ? '0 0 0 3px rgba(203,32,45,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center shrink-0">
                      {typeIcons[addr.addressType] || <FiMapPin size={16} className="text-[#CB202D]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[14px] font-bold text-gray-900">{addr.fullName}</p>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{addr.addressType}</span>
                        {addr.isDefault && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: SUCCESS }}>DEFAULT</span>}
                      </div>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5"><FiPhone size={10} /> {addr.mobile}</p>
                      <p className="text-[12px] text-gray-600 mt-1 leading-snug">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                      {addr.landmark && <p className="text-[11px] text-gray-400">Near {addr.landmark}</p>}
                      <p className="text-[12px] font-semibold text-gray-900">{addr.city}, {addr.state} - {addr.zipCode}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button onClick={e => { e.stopPropagation(); openForm(addr) }}
                        className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition border border-gray-200">
                        <FiEdit2 size={12} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setConfirmDelete(addr.id!) }}
                        className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 active:scale-90 transition border border-red-100">
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {isSel && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold" style={{ color: RED }}>
                      <FiCheck size={13} /> Selected for delivery
                    </div>
                  )}
                </motion.div>
              )
            })}

            {!showForm && (
              <button onClick={() => openForm()} className="w-full h-12 rounded-xl text-[13px] font-bold text-white inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
                style={{ background: `linear-gradient(135deg,${RED},${RED_DEEP})`, boxShadow: '0 4px 16px rgba(203,32,45,0.25)' }}>
                <FiPlus size={16} /> Add New Address
              </button>
            )}

            {/* Form */}
            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-[14px] font-bold text-gray-900">{editing ? 'Edit Address' : 'Add New Address'}</p>
                    <button onClick={() => setShowForm(false)} className="text-[11px] font-medium text-gray-400 hover:text-red-500">Cancel</button>
                  </div>
                  <div className="p-4 space-y-3">
                    <Field label="Full Name" value={form.fullName} onChange={v => set('fullName', v)} error={errors.fullName} />
                    <Field label="Phone Number" value={form.mobile} onChange={v => set('mobile', v)} error={errors.mobile} type="tel" maxLength={10} />
                    <Field label="Address Line 1" value={form.addressLine1} onChange={v => set('addressLine1', v)} error={errors.addressLine1} />
                    <Field label="Address Line 2" value={form.addressLine2} onChange={v => set('addressLine2', v)} />
                    <Field label="Landmark" value={form.landmark} onChange={v => set('landmark', v)} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="City" value={form.city} onChange={v => set('city', v)} error={errors.city} />
                      <Field label="State" value={form.state} onChange={v => set('state', v)} error={errors.state} />
                    </div>
                    <Field label="Pincode" value={form.zipCode} onChange={v => set('zipCode', v)} error={errors.zipCode} type="tel" maxLength={6} />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Save as</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Home', 'Office', 'Other'] as const).map(t => {
                          const active = form.addressType === t
                          return (
                            <button key={t} onClick={() => set('addressType', t)}
                              className={`h-11 rounded-xl text-[12px] font-semibold border-2 transition flex items-center justify-center gap-1.5 ${active ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-500'}`}
                              style={active ? { background: `linear-gradient(135deg,${RED},${RED_DEEP})` } : undefined}>
                              {typeIcons[t]} {t}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <button onClick={() => set('isDefault', !form.isDefault)}
                        className={`w-5 h-5 rounded flex items-center justify-center transition ${form.isDefault ? 'text-white' : ''}`}
                        style={{ background: form.isDefault ? RED : '#fff', border: form.isDefault ? 'none' : '1px solid #D1D5DB' }}>
                        {form.isDefault && <FiCheck size={11} />}
                      </button>
                      <span className="text-[12px] text-gray-500">Set as default address</span>
                    </label>
                    <div className="flex gap-2.5 pt-1">
                      <button onClick={() => setShowForm(false)} className="flex-1 h-12 rounded-xl text-[13px] font-bold border border-gray-200 text-gray-500">Cancel</button>
                      <button onClick={saveForm} className="flex-1 h-12 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2"
                        style={{ background: `linear-gradient(135deg,${RED},${RED_DEEP})` }}>
                        <FiCheck size={14} /> {editing ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Sticky continue bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-[480px] px-4 pb-3 pt-2.5 bg-white/95 backdrop-blur-xl border-t border-gray-100" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
        <button onClick={handleContinue} disabled={submitting || !selectedId}
          className="w-full h-14 rounded-xl text-[14px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition"
          style={{ background: `linear-gradient(135deg,${RED},${RED_DEEP})` }}>
          {submitting ? <FiLoader size={18} className="animate-spin" /> : <>Continue to Payment <FiChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} /></>}
        </button>
      </div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-[320px] shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                <FiTrash2 size={20} className="text-red-500" />
              </div>
              <h3 className="text-[16px] font-bold text-center text-gray-900 mb-1">Delete Address?</h3>
              <p className="text-[12px] text-gray-500 text-center mb-5">This address will be permanently removed from your account.</p>
              <div className="flex gap-2.5">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 h-11 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600">Cancel</button>
                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 h-11 rounded-xl text-[13px] font-bold text-white bg-red-500">
                  {deleting ? <FiLoader size={14} className="animate-spin mx-auto" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {Toast}
    </div>
  )
}

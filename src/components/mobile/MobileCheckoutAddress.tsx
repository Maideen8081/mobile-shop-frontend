import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronLeft, FiPlus, FiEdit2, FiTrash2, FiPhone, FiCheck, FiLoader, FiMapPin } from 'react-icons/fi'
import { Home, Briefcase } from 'lucide-react'
import { addressService, type AddressData } from '../../services/addressService'
import DoubleRingLoader from '../ui/DoubleRingLoader'
import { authService } from '../../services/authService'
import { useMobileToast } from './useMobileToast'

const PURPLE = '#CB202D'
const PURPLE_DEEP = '#A81D2A'
const SUCCESS = '#16A34A'
const card = 'bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]'

const typeIcons: Record<string, any> = {
  Home: <Home size={14} />,
  Office: <Briefcase size={14} />,
  Other: <FiMapPin size={14} />,
}

function Field({ label, value, onChange, error, type = 'text', maxLength }: {
  label: string; value: string; onChange: (v: string) => void; error?: string; type?: string; maxLength?: number
}) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={e => onChange(e.target.value)}
        className="w-full h-12 px-3.5 rounded-2xl text-[14px] bg-[#FFFBFB] border outline-none transition"
        style={{ borderColor: error ? '#EF4444' : '#E5E7EB', color: '#1F2937' }}
      />
      {error && <p className="text-[11px] text-[#EF4444] mt-1">{error}</p>}
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
    if (!form.addressLine2.trim()) e.addressLine2 = 'Address line 2 is required'
    if (!form.landmark.trim()) e.landmark = 'Landmark is required'
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
        showToast('Address added', 'success')
      }
      setShowForm(false)
    } catch {
      showToast('Failed to save address', 'error')
    }
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
  }

  return (
    <div className="min-h-screen bg-[#FFFBFB] max-w-[480px] mx-auto font-sans text-[#1F2937] pb-28" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-[#EEF1F4] px-3 py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} aria-label="Back" className="w-9 h-9 rounded-full bg-[#FEE2E6] flex items-center justify-center active:scale-90 transition">
          <FiChevronLeft size={20} style={{ color: PURPLE }} />
        </button>
        <div>
          <p className="text-[16px] font-bold leading-tight">Delivery Address</p>
          <p className="text-[11px] text-[#6B7280]">Select where to ship</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="px-5 pt-4 pb-1 flex items-center">
        {['Cart', 'Address', 'Payment'].map((label, i) => {
          const step = i + 1
          const done = step < 2
          const active = step === 2
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition ${done ? 'text-white' : active ? 'text-white' : 'bg-white text-[#9CA3AF] border border-[#E5E7EB]'}`}
                  style={done || active ? { background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` } : undefined}>
                  {done ? <FiCheck size={14} /> : step}
                </div>
                <span className={`text-[10px] mt-1 font-semibold ${active ? '' : 'text-[#9CA3AF]'}`} style={active ? { color: PURPLE } : undefined}>{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-[2px] mx-1.5 rounded-full ${done ? '' : 'bg-[#E5E7EB]'}`} style={done ? { background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` } : undefined} />}
            </div>
          )
        })}
      </div>

      <div className="px-3 mt-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><DoubleRingLoader size={40} label="Loading addresses…" /></div>
        ) : addresses.length === 0 ? (
          <div className={`${card} rounded-[24px] p-8 text-center mt-6`}>
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(203,32,45,0.1)' }}>
              <FiMapPin size={32} style={{ color: PURPLE }} />
            </div>
            <h2 className="text-[17px] font-bold text-[#1F2937] mb-1">No saved addresses</h2>
            <p className="text-[13px] text-[#6B7280] mb-5">Add your delivery address to continue checkout.</p>
            <button onClick={() => openForm()} className="h-12 px-6 rounded-2xl text-[14px] font-bold text-white inline-flex items-center gap-2" style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>
              <FiPlus size={16} /> Add New Address
            </button>
          </div>
        ) : (
          <>
            {addresses.map(addr => {
              const isSel = selectedId === addr.id
              return (
                <div key={addr.id}
                  onClick={() => setSelectedId(addr.id ?? null)}
                  className={`${card} p-4 cursor-pointer border-2 transition`}
                  style={{ borderColor: isSel ? PURPLE : 'transparent' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FEE2E6] flex items-center justify-center flex-shrink-0" style={{ color: PURPLE }}>
                      {typeIcons[addr.addressType] || <FiMapPin size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-bold">{addr.fullName}</p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEE2E6]" style={{ color: PURPLE }}>{addr.addressType}</span>
                        {addr.isDefault && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: SUCCESS }}>DEFAULT</span>}
                      </div>
                      <p className="text-[12px] text-[#6B7280] flex items-center gap-1 mt-0.5"><FiPhone size={11} /> {addr.mobile}</p>
                      <p className="text-[12px] text-[#4B5563] mt-1 leading-snug">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                      <p className="text-[12px] font-semibold text-[#1F2937]">{addr.city}, {addr.state} - {addr.zipCode}</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); openForm(addr) }} className="w-8 h-8 rounded-full bg-[#FFFBFB] flex items-center justify-center text-[#6B7280] active:scale-90 transition">
                        <FiEdit2 size={13} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(addr.id!) }} disabled={deleting === addr.id} className="w-8 h-8 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#EF4444] active:scale-90 transition">
                        {deleting === addr.id ? <FiLoader size={13} className="animate-spin" /> : <FiTrash2 size={13} />}
                      </button>
                    </div>
                  </div>
                  {isSel && <div className="mt-3 flex items-center gap-1.5 text-[12px] font-bold" style={{ color: PURPLE }}><FiCheck size={14} /> Selected for delivery</div>}
                </div>
              )
            })}

            <button onClick={() => openForm()} className="w-full h-12 rounded-2xl text-[14px] font-bold text-white inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
              style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})`, boxShadow: '0 8px 20px rgba(203,32,45,0.25)' }}>
              <FiPlus size={18} /> Add New Address
            </button>
          </>
        )}

        {/* Form */}
        {showForm && (
          <div className={`${card} p-4`}>
            <p className="text-[15px] font-extrabold mb-3">{editing ? 'Edit Address' : 'Add New Address'}</p>
            <div className="space-y-3">
              <Field label="Full Name" value={form.fullName} onChange={v => set('fullName', v)} error={errors.fullName} />
              <Field label="Phone Number" value={form.mobile} onChange={v => set('mobile', v)} error={errors.mobile} type="tel" maxLength={10} />
              <Field label="Address Line 1" value={form.addressLine1} onChange={v => set('addressLine1', v)} error={errors.addressLine1} />
              <Field label="Address Line 2" value={form.addressLine2} onChange={v => set('addressLine2', v)} error={errors.addressLine2} />
              <Field label="Landmark" value={form.landmark} onChange={v => set('landmark', v)} error={errors.landmark} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" value={form.city} onChange={v => set('city', v)} error={errors.city} />
                <Field label="State" value={form.state} onChange={v => set('state', v)} error={errors.state} />
              </div>
              <Field label="Pincode" value={form.zipCode} onChange={v => set('zipCode', v)} error={errors.zipCode} type="tel" maxLength={6} />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-2">Save as</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['Home', 'Office', 'Other'] as const).map(t => {
                    const active = form.addressType === t
                    return (
                      <button key={t} onClick={() => set('addressType', t)}
                        className={`h-12 rounded-2xl text-[13px] font-semibold border-2 transition flex flex-col items-center justify-center gap-0.5 ${active ? 'text-white border-transparent' : 'bg-[#FFFBFB] border-[#E5E7EB] text-[#6B7280]'}`}
                        style={active ? { background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` } : undefined}>
                        {typeIcons[t]} {t}
                      </button>
                    )
                  })}
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <span onClick={() => set('isDefault', !form.isDefault)} className={`w-5 h-5 rounded flex items-center justify-center transition ${form.isDefault ? 'text-white' : ''}`} style={{ background: form.isDefault ? PURPLE : '#FFFBFB', border: form.isDefault ? 'none' : '1px solid #E5E7EB' }}>
                  {form.isDefault && <FiCheck size={12} />}
                </span>
                <span className="text-[13px] text-[#4B5563]">Set as default address</span>
              </label>
            </div>
            <div className="flex gap-2.5 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 h-12 rounded-2xl text-[14px] font-bold border border-[#E5E7EB] text-[#6B7280]">Cancel</button>
              <button onClick={saveForm} className="flex-1 h-12 rounded-2xl text-[14px] font-bold text-white" style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>Save</button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky continue bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-[480px] px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 bg-white/95 backdrop-blur-xl border-t border-[#EEF1F4]" style={{ boxShadow: '0 -5px 25px rgba(0,0,0,0.10)' }}>
        <button
          onClick={handleContinue}
          disabled={submitting || (!selectedId && !showForm)}
          className="w-full h-14 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>
          {submitting ? <FiLoader size={18} className="animate-spin" /> : <>Continue to Payment <FiChevronLeft size={18} style={{ transform: 'rotate(180deg)' }} /></>}
        </button>
      </div>
      {Toast}
    </div>
  )
}

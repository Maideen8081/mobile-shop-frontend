import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronLeft, FiPlus, FiEdit2, FiTrash2, FiPhone, FiCheck, FiLoader, FiMapPin, FiStar, FiHome, FiTruck } from 'react-icons/fi'
import { Home, Briefcase } from 'lucide-react'
import { addressService, type AddressData } from '../../services/addressService'
import DoubleRingLoader from '../ui/DoubleRingLoader'
import { useMobileToast } from './useMobileToast'
import MobileBottomNav from './MobileBottomNav'

const PURPLE = '#CB202D'
const PURPLE_DEEP = '#A81D2A'
const SUCCESS = '#16A34A'
const card = 'bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]'

const typeIcons: Record<string, any> = {
  Home: <Home size={16} />,
  Office: <Briefcase size={16} />,
  Other: <FiMapPin size={16} />,
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
        className="w-full h-12 px-3.5 rounded-2xl text-[14px] bg-[#FEE2E6] border outline-none transition focus:bg-white"
        style={{ borderColor: error ? '#EF4444' : '#E5E7EB', color: '#1F2937' }}
      />
      {error && <p className="text-[11px] text-[#EF4444] mt-1">{error}</p>}
    </div>
  )
}

export default function MobileAddressManagement() {
  const navigate = useNavigate()
  const { show: showToast, Toast } = useMobileToast()
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AddressData | null>(null)
  const [saving, setSaving] = useState(false)
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

  useEffect(() => {
    let mounted = true
    addressService.list()
      .then(data => { if (mounted) setAddresses(data) })
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
    setSaving(true)
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
    } catch { showToast('Failed to save', 'error') }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    setDeleting(id)
    try {
      await addressService.delete(id)
      setAddresses(prev => prev.filter(a => Number(a.id) !== id))
      showToast('Address deleted', 'success')
    } catch { showToast('Failed to delete', 'error') }
    setDeleting(null)
  }

  const handleSetDefault = async (id: number) => {
    try {
      const updated = await addressService.setDefault(id)
      setAddresses(prev => prev.map(a => Number(a.id) === Number(id) ? { ...a, ...updated, isDefault: true } : { ...a, isDefault: false }))
      showToast('Default address updated', 'success')
    } catch { showToast('Failed', 'error') }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] max-w-[480px] mx-auto font-sans text-[#1F2937] pb-40" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-[#EEF1F4] px-3 py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} aria-label="Back" className="w-9 h-9 rounded-full bg-[#FEE2E6] flex items-center justify-center active:scale-90 transition">
          <FiChevronLeft size={20} style={{ color: PURPLE }} />
        </button>
        <div>
          <p className="text-[16px] font-bold leading-tight">Manage Addresses</p>
          <p className="text-[11px] text-[#6B7280]">{addresses.length} saved</p>
        </div>
      </div>

      {/* Zepto/Zomato style hero banner */}
      <div className="relative mx-3 mt-3 rounded-[22px] overflow-hidden p-4 text-white" style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>
        <div className="absolute -top-8 -right-6 w-28 h-28 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <FiTruck size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold leading-tight">Where should we deliver?</p>
            <p className="text-[12px] text-white/80 mt-0.5">Add or pick a saved address for faster checkout</p>
          </div>
        </div>
      </div>

      <div className="px-3 mt-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><DoubleRingLoader size={40} label="Loading addresses…" /></div>
        ) : addresses.length === 0 ? (
          <div className={`${card} p-6 flex flex-col items-center text-center`}>
            <div className="w-16 h-16 rounded-2xl bg-[#FEE2E6] flex items-center justify-center mb-3" style={{ color: PURPLE }}><FiHome size={26} /></div>
            <p className="text-[15px] font-bold">No addresses yet</p>
            <p className="text-[12px] text-[#6B7280] mt-1 mb-4">Add your first delivery address to get started</p>
            <button onClick={() => openForm()} className="px-6 h-11 rounded-2xl text-[13px] font-bold text-white flex items-center gap-1.5" style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}><FiPlus size={15} /> Add Address</button>
          </div>
        ) : (
          addresses.map(addr => (
            <div key={addr.id} className={`${card} p-4 border-2`} style={{ borderColor: addr.isDefault ? PURPLE : 'transparent' }}>
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
                  <button onClick={() => openForm(addr)} className="w-8 h-8 rounded-xl bg-[#FEE2E6] flex items-center justify-center text-[#6B7280]">
                    <FiEdit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(addr.id!)} disabled={deleting === addr.id} className="w-8 h-8 rounded-xl bg-[#FEF2F2] flex items-center justify-center text-[#EF4444]">
                    {deleting === addr.id ? <FiLoader size={13} className="animate-spin" /> : <FiTrash2 size={13} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#EEF1F4]">
                {!addr.isDefault ? (
                  <button onClick={() => handleSetDefault(addr.id!)} className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: PURPLE }}>
                    <FiStar size={13} /> Set as default
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#16A34A]">
                    <FiCheck size={13} /> Default delivery address
                  </span>
                )}
              </div>
            </div>
          ))
        )}

        {/* Form sheet */}
        {showForm && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowForm(false)} />
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[480px] bg-[#F7F8FC] rounded-t-[28px] flex flex-col max-h-[90vh]" style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
              <div className="px-4 pt-4 pb-2 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-[#D9D9E3] mx-auto mb-3" />
                <p className="text-[15px] font-extrabold">{editing ? 'Edit Address' : 'Add New Address'}</p>
              </div>
              <div className="px-4 overflow-y-auto flex-1 space-y-3">
                <Field label="Full Name" value={form.fullName} onChange={v => set('fullName', v)} error={errors.fullName} />
                <Field label="Phone Number" value={form.mobile} onChange={v => set('mobile', v)} error={errors.mobile} type="tel" maxLength={10} />
                <Field label="Address Line 1" value={form.addressLine1} onChange={v => set('addressLine1', v)} error={errors.addressLine1} />
                <Field label="Address Line 2 (optional)" value={form.addressLine2} onChange={v => set('addressLine2', v)} />
                <Field label="Landmark (optional)" value={form.landmark} onChange={v => set('landmark', v)} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" value={form.city} onChange={v => set('city', v)} error={errors.city} />
                  <Field label="State" value={form.state} onChange={v => set('state', v)} error={errors.state} />
                </div>
                <Field label="Pincode" value={form.zipCode} onChange={v => set('zipCode', v)} error={errors.zipCode} type="tel" maxLength={6} />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] mb-2">Address Type</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Home', 'Office', 'Other'] as const).map(t => {
                      const active = form.addressType === t
                      return (
                        <button key={t} onClick={() => set('addressType', t)}
                          className={`relative flex flex-col items-center justify-center gap-1.5 h-[68px] rounded-2xl border-2 transition active:scale-95 ${active ? 'text-white border-transparent' : 'bg-white border-[#E5E7EB] text-[#6B7280]'}`}
                          style={active ? { background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` } : undefined}>
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center ${active ? 'bg-white/20' : 'bg-[#FEE2E6]'}`} style={active ? undefined : { color: PURPLE }}>
                            {typeIcons[t]}
                          </span>
                          <span className="text-[12px] font-bold">{t}</span>
                          {active && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white flex items-center justify-center" style={{ color: PURPLE }}>
                              <FiCheck size={10} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <span onClick={() => set('isDefault', !form.isDefault)} className={`w-5 h-5 rounded flex items-center justify-center transition ${form.isDefault ? 'text-white' : ''}`} style={{ background: form.isDefault ? PURPLE : '#FEE2E6', border: form.isDefault ? 'none' : '1px solid #E5E7EB' }}>
                    {form.isDefault && <FiCheck size={12} />}
                  </span>
                  <span className="text-[13px] text-[#4B5563]">Set as default address</span>
                </label>
              </div>
              <div className="flex gap-2.5 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] bg-[#F7F8FC] border-t border-[#EEF1F4] flex-shrink-0">
                <button onClick={() => setShowForm(false)} className="flex-1 h-12 rounded-2xl text-[14px] font-bold border border-[#E5E7EB] text-[#6B7280]">Cancel</button>
                <button onClick={saveForm} disabled={saving} className="flex-[1.4] h-12 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>
                  {saving ? <FiLoader size={16} className="animate-spin" /> : 'Save Address'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Zepto/Zomato style persistent add-address bar */}
      {!showForm && (
        <div className="fixed bottom-[76px] left-1/2 -translate-x-1/2 z-30 w-full max-w-[480px] px-3 pt-3 pb-1 bg-gradient-to-t from-[#F7F8FC] via-[#F7F8FC] to-transparent">
          <button onClick={() => openForm()} className="w-full h-12 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition" style={{ background: `linear-gradient(135deg,${PURPLE},${PURPLE_DEEP})` }}>
            <FiPlus size={18} /> Add New Address
          </button>
        </div>
      )}

      {!showForm && <MobileBottomNav />}
      {Toast}
    </div>
  )
}

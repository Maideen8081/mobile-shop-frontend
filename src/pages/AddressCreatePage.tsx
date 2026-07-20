import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiMapPin, FiHome, FiBriefcase, FiCheck, FiArrowLeft,
  FiUser, FiPhone, FiMail,
} from 'react-icons/fi'
import { addressService, type AddressData } from '../services/addressService'
import MobileAddressManagement from '../components/mobile/MobileAddressManagement'
import { useIsMobile } from '../components/mobile/helpers'

const emptyForm: Omit<AddressData, 'id' | 'createdAt' | 'updatedAt'> = {
  fullName: '',
  mobile: '',
  alternateMobile: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  country: 'India',
  state: '',
  city: '',
  zipCode: '',
  addressType: 'Home',
  isDefault: false,
}

export default function AddressCreatePage() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileAddressManagement />
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = (k: keyof typeof form, v: string | boolean) => {
    if (k === 'mobile' || k === 'alternateMobile') {
      v = (v as string).replace(/\D/g, '').slice(0, 10)
    }
    if (k === 'zipCode') {
      v = (v as string).replace(/\D/g, '').slice(0, 6)
    }
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k as string]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[k as string]
        return next
      })
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.fullName.trim()) errs.fullName = 'Full name is required'
    const digits = form.mobile.replace(/\D/g, '')
    if (!digits) errs.mobile = 'Mobile number is required'
    else if (digits.length < 10) errs.mobile = 'Enter exactly 10 digits'
    if (!form.addressLine1.trim()) errs.addressLine1 = 'Address is required'
    if (!form.city.trim()) errs.city = 'City is required'
    if (!form.state.trim()) errs.state = 'State is required'
    const zip = form.zipCode.replace(/\D/g, '')
    if (!zip) errs.zipCode = 'ZIP code is required'
    else if (!/^\d{5,6}$/.test(zip)) errs.zipCode = 'Enter 5-6 digits'
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      const created = await addressService.create(form)
      navigate('/profile/addresses')
    } catch {
      setErrors({ _form: 'Failed to save address. Please try again.' })
    }
    setSaving(false)
  }

  const typeOptions = ['Home', 'Office', 'Other'] as const
  const typeIcons: Record<string, React.ReactNode> = {
    Home: <FiHome size={14} />,
    Office: <FiBriefcase size={14} />,
    Other: <FiMapPin size={14} />,
  }

  const isValid =
    form.fullName.trim() &&
    /^\d{10}$/.test(form.mobile.replace(/\D/g, '')) &&
    form.addressLine1.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    /^\d{5,6}$/.test(form.zipCode.replace(/\D/g, ''))

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <header
        className="sticky top-0 z-50 w-full shadow-sm flex justify-between items-center"
        style={{ backgroundColor: '#6e7487', padding: '16px 64px', maxWidth: '1440px', margin: '0 auto' }}
      >
        <div className="text-[28px] font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
          PhonePremium
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
          <Link to="/" className="text-[#c0c6db] hover:text-white transition-colors">Home</Link>
          <Link to="/profile/addresses" className="text-[#c0c6db] hover:text-white transition-colors">My Addresses</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button className="text-white transition-transform active:scale-90" onClick={() => navigate('/profile/addresses')}>
            <FiArrowLeft size={20} />
          </button>
        </div>
      </header>

      <main className="flex items-center justify-center relative overflow-hidden" style={{ padding: '80px 64px' }}>
        <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden">
          <div className="absolute rounded-full" style={{ top: '-12rem', right: '-12rem', width: '24rem', height: '24rem', backgroundColor: '#85f8c4', filter: 'blur(120px)' }} />
          <div className="absolute rounded-full" style={{ bottom: '-12rem', left: '-12rem', width: '24rem', height: '24rem', backgroundColor: '#00855d', filter: 'blur(120px)' }} />
        </div>

        <div className="w-full max-w-2xl relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#edeeef', color: '#5d5f5f' }}
            >
              <FiArrowLeft size={18} />
            </button>
            <h1 className="font-bold tracking-tight" style={{ fontSize: '28px', fontFamily: "'Inter', sans-serif", color: '#191c1d' }}>
              Add New Address
            </h1>
          </div>

          <div
            className="rounded-xl overflow-hidden transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(229, 231, 235, 0.5)',
              boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.05)',
            }}
          >
            <div className="flex items-center gap-3 px-8 py-5 border-b" style={{ borderBottom: '1px solid #bccac0' }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(0, 105, 72, 0.1)' }}>
                <FiMapPin size={18} style={{ color: '#006948' }} />
              </div>
              <h2 className="font-semibold text-lg" style={{ fontFamily: "'Inter', sans-serif", color: '#191c1d' }}>
                {form.addressType === 'Home' ? 'Home Address' : form.addressType === 'Office' ? 'Office Address' : 'Delivery Address'}
              </h2>
            </div>

            <div className="p-8 space-y-6">
              {errors._form && (
                <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#ffdad6', color: '#93000a' }}>
                  {errors._form}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  label="Full Name"
                  value={form.fullName}
                  onChange={v => update('fullName', v)}
                  placeholder="John Doe"
                  error={errors.fullName}
                  icon={<FiUser size={14} />}
                />
                <FormField
                  label="Mobile Number"
                  value={form.mobile}
                  onChange={v => update('mobile', v)}
                  placeholder="9876543210"
                  type="tel"
                  maxLength={10}
                  error={errors.mobile}
                  icon={<FiPhone size={14} />}
                />
              </div>

              <FormField
                label="Address Line 1"
                value={form.addressLine1}
                onChange={v => update('addressLine1', v)}
                placeholder="House/Flat No., Street, Area"
                error={errors.addressLine1}
              />
              <FormField
                label="Address Line 2 (optional)"
                value={form.addressLine2 || ''}
                onChange={v => update('addressLine2', v)}
                placeholder="Apartment, building, floor"
              />
              <FormField
                label="Landmark (optional)"
                value={form.landmark || ''}
                onChange={v => update('landmark', v)}
                placeholder="Near school, mall, station..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <FormField label="City" value={form.city} onChange={v => update('city', v)} placeholder="Bangalore" error={errors.city} />
                <FormField label="State" value={form.state} onChange={v => update('state', v)} placeholder="Karnataka" error={errors.state} />
                <FormField label="ZIP Code" value={form.zipCode} onChange={v => update('zipCode', v)} placeholder="560001" type="tel" maxLength={6} error={errors.zipCode} />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider mb-2" style={{ color: '#6d7a72', fontFamily: "'Inter', sans-serif" }}>
                  ADDRESS TYPE
                </label>
                <div className="flex gap-3">
                  {typeOptions.map(type => (
                    <button
                      key={type}
                      onClick={() => update('addressType', type)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      style={{
                        backgroundColor: form.addressType === type ? '#006948' : '#f3f4f5',
                        border: form.addressType === type ? '1px solid transparent' : '1px solid #bccac0',
                        color: form.addressType === type ? '#ffffff' : '#5d5f5f',
                      }}
                    >
                      {typeIcons[type]} {type}
                      {form.addressType === type && <FiCheck size={11} />}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: form.isDefault ? '#006948' : '#ffffff',
                    border: form.isDefault ? '1px solid transparent' : '1px solid #bccac0',
                  }}
                  onClick={() => update('isDefault', !form.isDefault)}
                >
                  {form.isDefault && <FiCheck size={11} className="text-white" />}
                </div>
                <span className="text-sm" style={{ color: '#5d5f5f', fontFamily: "'Inter', sans-serif" }}>Set as default address</span>
              </label>
            </div>

            <div className="flex items-center gap-3 px-8 py-5 border-t" style={{ borderTop: '1px solid #bccac0' }}>
              <button
                onClick={() => navigate(-1)}
                className="flex-1 h-12 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                style={{
                  backgroundColor: '#edeeef',
                  border: '1px solid #bccac0',
                  color: '#5d5f5f',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !isValid}
                className="flex-1 h-12 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{
                  backgroundColor: saving || !isValid ? 'rgba(0, 105, 72, 0.5)' : '#006948',
                  color: '#ffffff',
                  cursor: saving || !isValid ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!saving && isValid) e.currentTarget.style.backgroundColor = '#00855d' }}
                onMouseLeave={e => { if (!saving && isValid) e.currentTarget.style.backgroundColor = '#006948' }}
              >
                {saving ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer
        className="w-full flex flex-col md:flex-row justify-between items-center gap-6 border-t"
        style={{
          padding: '48px 64px',
          maxWidth: '1440px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #bccac0',
        }}
      >
        <div className="text-xl font-semibold" style={{ color: '#006948', fontFamily: "'Inter', sans-serif" }}>
          PhonePremium
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-base" style={{ fontFamily: "'Inter', sans-serif", color: '#5d5f5f' }}>
          <Link to="#" className="hover:underline opacity-80 hover:opacity-100">Privacy Policy</Link>
          <Link to="#" className="hover:underline opacity-80 hover:opacity-100">Terms of Service</Link>
          <Link to="#" className="hover:underline opacity-80 hover:opacity-100">Shipping Info</Link>
          <Link to="#" className="hover:underline opacity-80 hover:opacity-100">Contact Us</Link>
        </div>
        <p className="text-base" style={{ color: '#5d5f5f', fontFamily: "'Inter', sans-serif" }}>
          &copy; 2024 PhonePremium. Engineering Excellence.
        </p>
      </footer>
    </div>
  )
}

function FormField({ label, value, onChange, placeholder, type = 'text', maxLength, error, icon }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  maxLength?: number
  error?: string
  icon?: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-wider mb-1.5" style={{ color: '#6d7a72', fontFamily: "'Inter', sans-serif" }}>
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#bccac0' }}>
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full bg-transparent border-b py-2.5 text-base transition-all outline-none"
          style={{
            borderBottom: `1px solid ${error ? '#ba1a1a' : '#bccac0'}`,
            fontFamily: "'Inter', sans-serif",
            color: '#191c1d',
            paddingLeft: icon ? '36px' : '0',
          }}
          onFocus={e => { e.target.style.borderBottomColor = error ? '#ba1a1a' : '#006948' }}
          onBlur={e => { if (!e.target.value) e.target.style.borderBottomColor = error ? '#ba1a1a' : '#bccac0' }}
        />
      </div>
      {error && (
        <p className="text-xs mt-1" style={{ color: '#ba1a1a', fontFamily: "'Inter', sans-serif" }}>
          {error}
        </p>
      )}
    </div>
  )
}

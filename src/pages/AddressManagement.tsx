import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase, Check, Home, Loader2, MapPin, Pencil, Phone, Plus, Star, Trash2, X,
} from 'lucide-react'
import { addressService, type AddressData } from '../services/addressService'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import EcommerceFooter from '../components/ecommerce/Footer'
import DesktopPageLoader from '../components/ui/DesktopPageLoader'
import MobileAddressManagement from '../components/mobile/MobileAddressManagement'
import { useIsMobile } from '../components/mobile/helpers'
import { useToast } from '../context/ToastContext'
import './AddressManagement.css'

type AddressForm = Omit<AddressData, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
type FormErrors = Partial<Record<keyof AddressForm, string>>

const ADDRESS_TYPES = [
  { value: 'Home', icon: Home },
  { value: 'Office', icon: Briefcase },
  { value: 'Other', icon: MapPin },
] as const

const emptyForm: AddressForm = {
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

function validate(f: AddressForm): FormErrors {
  const e: FormErrors = {}
  if (f.fullName.trim().length < 2) e.fullName = 'Enter the full name'
  if (!/^[6-9]\d{9}$/.test(f.mobile)) e.mobile = 'Enter a valid 10-digit mobile number'
  if (f.addressLine1.trim().length < 3) e.addressLine1 = 'Enter house no., street and area'
  if (!f.city.trim()) e.city = 'Enter the city'
  if (!f.state.trim()) e.state = 'Enter the state'
  if (!/^\d{6}$/.test(f.zipCode)) e.zipCode = 'Enter a valid 6-digit pincode'
  return e
}

function formatPhone(p: string) {
  const d = p.replace(/\D/g, '')
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : p
}

// Default first, then newest.
const sortAddresses = (list: AddressData[]) =>
  [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || Number(b.id) - Number(a.id))

const errorText =(err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

export default function AddressManagement() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileAddressManagement /> : <DesktopAddressManagement />
}

function DesktopAddressManagement() {
  const showToast = useToast().show
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AddressData | null>(null)
  const [form, setForm] = useState<AddressForm>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState<AddressData | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [defaultBusyId, setDefaultBusyId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setAddresses(sortAddresses(await addressService.list()))
  }, [])

  useEffect(() => {
    let alive = true
    addressService.list().then((list) => {
      if (!alive) return
      setAddresses(sortAddresses(list))
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const modalOpen = formOpen || deleting !== null
  useEffect(() => {
    if (!modalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (formOpen && !saving) setFormOpen(false)
      if (deleting && !deleteBusy) setDeleting(null)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [modalOpen, formOpen, saving, deleting, deleteBusy])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm, isDefault: addresses.length === 0 })
    setErrors({})
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (addr: AddressData) => {
    setEditing(addr)
    setForm({
      fullName: addr.fullName,
      mobile: addr.mobile.replace(/\D/g, '').slice(-10),
      alternateMobile: addr.alternateMobile || '',
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      landmark: addr.landmark || '',
      country: addr.country || 'India',
      state: addr.state,
      city: addr.city,
      zipCode: addr.zipCode,
      addressType: addr.addressType,
      isDefault: addr.isDefault,
    })
    setErrors({})
    setFormError('')
    setFormOpen(true)
  }

  const setField = <K extends keyof AddressForm>(key: K, value: AddressForm[K]) => {
    setForm((p) => ({ ...p, [key]: value }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    setFormError('')
    try {
      const payload = { ...form, fullName: form.fullName.trim(), country: form.country.trim() || 'India' }
      if (editing?.id != null) await addressService.update(editing.id, payload)
      else await addressService.create(payload)
      await refresh()
      setFormOpen(false)
      showToast(editing ? 'Address updated' : 'Address added', 'success')
    } catch (err) {
      setFormError(errorText(err, 'Couldn’t save the address. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting?.id) return
    setDeleteBusy(true)
    try {
      await addressService.delete(deleting.id)
      await refresh()
      setDeleting(null)
      showToast('Address removed', 'success')
    } catch (err) {
      showToast(errorText(err, 'Couldn’t delete the address'), 'error')
    } finally {
      setDeleteBusy(false)
    }
  }

  const handleSetDefault = async (id: number | undefined) => {
    if (id == null || defaultBusyId != null) return
    setDefaultBusyId(id)
    try {
      await addressService.setDefault(id)
      await refresh()
      showToast('Default address updated', 'success')
    } catch (err) {
      showToast(errorText(err, 'Couldn’t set the default address'), 'error')
    } finally {
      setDefaultBusyId(null)
    }
  }

  const field = (key: keyof AddressForm, label: string, opts: {
    required?: boolean; full?: boolean; placeholder?: string; inputMode?: 'numeric' | 'tel' | 'text'
    maxDigits?: number; autoComplete?: string; autoFocus?: boolean
  } = {}) => (
    <div className={`am-field${opts.full ? ' full' : ''}${errors[key] ? ' has-error' : ''}`}>
      <label htmlFor={`am-${key}`}>{label}{opts.required && <span> *</span>}</label>
      <input
        id={`am-${key}`}
        value={String(form[key] ?? '')}
        placeholder={opts.placeholder}
        inputMode={opts.inputMode}
        autoComplete={opts.autoComplete}
        autoFocus={opts.autoFocus}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `am-${key}-err` : undefined}
        onChange={(e) => {
          const v = opts.maxDigits ? e.target.value.replace(/\D/g, '').slice(0, opts.maxDigits) : e.target.value
          setField(key, v as never)
        }}
      />
      {errors[key] && <span id={`am-${key}-err`} className="am-field-error">{errors[key]}</span>}
    </div>
  )

  return (
    <div className="am">
      <SiteTopNav />

      <main className="am-main">
        <nav className="am-crumbs" aria-label="Breadcrumb">
          <Link to="/home">Home</Link><span>/</span>
          <Link to="/profile">Profile</Link><span>/</span>
          <span aria-current="page">Addresses</span>
        </nav>

        <header className="am-head">
          <div>
            <h1>Saved addresses</h1>
            <p>
              {loading ? 'Loading…' : addresses.length === 0
                ? 'Add an address to check out faster.'
                : `${addresses.length} saved address${addresses.length !== 1 ? 'es' : ''} · your default is used at checkout`}
            </p>
          </div>
          {!loading && addresses.length > 0 && (
            <button className="am-btn am-btn-primary" onClick={openAdd}><Plus size={17} /> Add new address</button>
          )}
        </header>

        {loading ? (
          <DesktopPageLoader text="Loading your addresses..." />
        ) : addresses.length === 0 ? (
          <section className="am-empty">
            <span className="am-empty-icon"><MapPin size={28} /></span>
            <h2>No saved addresses yet</h2>
            <p>Save your home or office address once and pick it in one tap at checkout.</p>
            <button className="am-btn am-btn-primary" onClick={openAdd}><Plus size={17} /> Add your first address</button>
          </section>
        ) : (
          <div className="am-grid">
            {addresses.map((addr) => {
              const TypeIcon = ADDRESS_TYPES.find((t) => t.value === addr.addressType)?.icon || MapPin
              const busy = defaultBusyId === addr.id
              return (
                <article key={addr.id} className={`am-card${addr.isDefault ? ' is-default' : ''}`}>
                  <div className="am-card-body">
                    <div className="am-card-top">
                      <span className="am-type-icon"><TypeIcon size={20} /></span>
                      <div className="am-who">
                        <div className="am-name-row">
                          <span className="am-name">{addr.fullName}</span>
                          <span className="am-pill am-pill-type">{addr.addressType}</span>
                          {addr.isDefault && <span className="am-pill am-pill-default"><Check size={11} strokeWidth={3} /> Default</span>}
                        </div>
                        <span className="am-phone"><Phone size={13} /> {formatPhone(addr.mobile)}</span>
                      </div>
                    </div>
                    <p className="am-address">
                      {addr.addressLine1}
                      {addr.addressLine2 && <>, {addr.addressLine2}</>}
                      {addr.landmark && <>, near {addr.landmark}</>}
                      <br />
                      {addr.city}, {addr.state} – <strong>{addr.zipCode}</strong>
                      {addr.country && <><br />{addr.country}</>}
                    </p>
                  </div>
                  <div className="am-card-foot">
                    {addr.isDefault ? (
                      <span className="am-default-note"><Check size={14} strokeWidth={3} /> Used at checkout</span>
                    ) : (
                      <button className="am-link-btn" onClick={() => handleSetDefault(addr.id)} disabled={defaultBusyId != null}>
                        {busy ? <Loader2 size={14} className="am-spin" /> : <Star size={14} />}
                        {busy ? 'Setting…' : 'Set as default'}
                      </button>
                    )}
                    <button className="am-icon-btn" onClick={() => openEdit(addr)} aria-label={`Edit address of ${addr.fullName}`}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button className="am-icon-btn is-danger" onClick={() => setDeleting(addr)} aria-label={`Delete address of ${addr.fullName}`}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </article>
              )
            })}
            <button type="button" className="am-add-card" onClick={openAdd}>
              <span><Plus size={22} /></span>
              Add new address
              <small>Home, office or anywhere else</small>
            </button>
          </div>
        )}
      </main>

      <EcommerceFooter compact />

      {formOpen && (
        <div className="am-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setFormOpen(false) }}>
          <form className="am-modal" role="dialog" aria-modal="true" aria-labelledby="am-form-title" onSubmit={handleSave} noValidate>
            <div className="am-modal-head">
              <span className="am-type-icon"><MapPin size={20} /></span>
              <div style={{ flex: 1 }}>
                <h2 id="am-form-title">{editing ? 'Edit address' : 'Add new address'}</h2>
                <p>Fields marked * are required</p>
              </div>
              <button type="button" className="am-close" onClick={() => setFormOpen(false)} disabled={saving} aria-label="Close">
                <X size={17} />
              </button>
            </div>

            <div className="am-modal-body">
              <div className="am-form-grid">
                <div className="am-section-label">Contact</div>
                {field('fullName', 'Full name', { required: true, placeholder: 'e.g. Maideen', autoComplete: 'name', autoFocus: true })}
                {field('mobile', 'Mobile number', { required: true, placeholder: '10-digit number', inputMode: 'tel', maxDigits: 10, autoComplete: 'tel-national' })}

                <div className="am-section-label">Address</div>
                {field('addressLine1', 'House no., building, street', { required: true, full: true, placeholder: 'e.g. 12, Gandhi Street', autoComplete: 'address-line1' })}
                {field('addressLine2', 'Area, colony (optional)', { full: true, placeholder: 'e.g. Anna Nagar', autoComplete: 'address-line2' })}
                {field('landmark', 'Landmark (optional)', { full: true, placeholder: 'e.g. Near bus stand' })}
                {field('zipCode', 'Pincode', { required: true, placeholder: '6 digits', inputMode: 'numeric', maxDigits: 6, autoComplete: 'postal-code' })}
                {field('city', 'City', { required: true, placeholder: 'e.g. Virudhunagar', autoComplete: 'address-level2' })}
                {field('state', 'State', { required: true, placeholder: 'e.g. Tamil Nadu', autoComplete: 'address-level1' })}
                {field('country', 'Country', { placeholder: 'India', autoComplete: 'country-name' })}

                <div className="am-section-label">Save as</div>
                <div className="am-types" role="radiogroup" aria-label="Address type">
                  {ADDRESS_TYPES.map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={form.addressType === value}
                      className="am-type"
                      onClick={() => setField('addressType', value)}
                    >
                      <Icon size={16} /> {value}
                    </button>
                  ))}
                </div>

                <label className="am-toggle">
                  <span>
                    <strong>Make this my default address</strong>
                    <small>It will be selected automatically at checkout</small>
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.isDefault}
                    onChange={(e) => setField('isDefault', e.target.checked)}
                  />
                  <span className="am-switch" aria-hidden="true" />
                </label>
              </div>
              {formError && <p className="am-form-error" role="alert">{formError}</p>}
            </div>

            <div className="am-modal-foot">
              <button type="button" className="am-btn am-btn-ghost" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
              <button type="submit" className="am-btn am-btn-primary" disabled={saving}>
                {saving ? <><Loader2 size={16} className="am-spin" /> Saving…</> : editing ? 'Save changes' : 'Save address'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleting && (
        <div className="am-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !deleteBusy) setDeleting(null) }}>
          <div className="am-modal am-confirm" role="alertdialog" aria-modal="true" aria-labelledby="am-del-title" aria-describedby="am-del-desc">
            <span className="am-confirm-icon"><Trash2 size={24} /></span>
            <h2 id="am-del-title">Delete this address?</h2>
            <p id="am-del-desc">
              {deleting.fullName}, {deleting.city} – {deleting.zipCode} will be removed from your saved addresses.
              {deleting.isDefault && ' You’ll need to choose a new default at checkout.'}
            </p>
            <div className="am-confirm-actions">
              <button className="am-btn am-btn-ghost" onClick={() => setDeleting(null)} disabled={deleteBusy} autoFocus>Keep it</button>
              <button className="am-btn am-btn-danger" onClick={handleDelete} disabled={deleteBusy}>
                {deleteBusy ? <><Loader2 size={16} className="am-spin" /> Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

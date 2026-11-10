import { useRef, useState, type ReactNode } from 'react'
import {
  Briefcase, Check, CircleAlert, CircleCheck, Hash, Home, Landmark, Loader2, Map as MapIcon, MapPin,
  MapPinPlus, Pencil, Phone, Star, UserRound, X, Building2,
} from 'lucide-react'
import { addressService, type AddressData } from '../services/addressService'
import { useToast } from '../context/ToastContext'
import { apiErrorMessage } from '../utils/checkout'
import { INDIAN_STATES } from '../utils/indianStates'

type AddressType = AddressData['addressType']

const TYPES: { value: AddressType; label: string; hint: string; icon: typeof Home }[] = [
  { value: 'Home', label: 'Home', hint: 'All-day delivery', icon: Home },
  { value: 'Office', label: 'Work', hint: '10 AM – 6 PM delivery', icon: Briefcase },
  { value: 'Other', label: 'Other', hint: 'Any other place', icon: MapPin },
]

const NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/

type Form = {
  fullName: string
  mobile: string
  addressLine1: string
  addressLine2: string
  landmark: string
  city: string
  state: string
  zipCode: string
  country: string
  addressType: AddressType
  isDefault: boolean
}
type FieldKey = 'fullName' | 'mobile' | 'addressLine1' | 'addressLine2' | 'landmark' | 'city' | 'state' | 'zipCode'

/** Field order, used to focus the first invalid field on submit. */
const FIELD_ORDER: FieldKey[] = ['fullName', 'mobile', 'addressLine1', 'addressLine2', 'landmark', 'city', 'state', 'zipCode']

function validateField(k: FieldKey, f: Form): string {
  const v = f[k].trim()
  switch (k) {
    case 'fullName':
      if (!v) return 'Please enter the receiver’s full name'
      if (v.length < 3) return 'Name must be at least 3 characters'
      if (v.length > 50) return 'Name must be 50 characters or fewer'
      if (!NAME_RE.test(v)) return 'Use letters, spaces, dots or hyphens only'
      return ''
    case 'mobile':
      if (!v) return 'Please enter a 10-digit mobile number'
      if (v.length !== 10) return `Enter all 10 digits (${v.length}/10)`
      if (!/^[6-9]/.test(v)) return 'Indian mobile numbers start with 6, 7, 8 or 9'
      return ''
    case 'addressLine1':
      if (!v) return 'Please enter your house no., building and street'
      if (v.length < 10) return 'Add a bit more detail (at least 10 characters)'
      if (v.length > 150) return 'Keep this under 150 characters'
      return ''
    case 'addressLine2':
      return v.length > 100 ? 'Keep this under 100 characters' : ''
    case 'landmark':
      return v.length > 80 ? 'Keep this under 80 characters' : ''
    case 'city':
      if (!v) return 'Please enter your city or town'
      if (v.length < 2) return 'City name is too short'
      if (!NAME_RE.test(v)) return 'City should contain letters only'
      return ''
    case 'state':
      return v ? '' : 'Please choose your state'
    case 'zipCode':
      if (!v) return 'Please enter your 6-digit pincode'
      if (!/^[1-9]\d{5}$/.test(v)) return v.length < 6 ? `Pincode must be 6 digits (${v.length}/6)` : 'Enter a valid pincode (it can’t start with 0)'
      return ''
  }
}

function validateAll(f: Form) {
  const e: Partial<Record<FieldKey, string>> = {}
  for (const k of FIELD_ORDER) {
    const msg = validateField(k, f)
    if (msg) e[k] = msg
  }
  return e
}

/* ── One labelled input with icon, error and success states ── */
function Field({ id, label, icon: Icon, required, optional, error, valid, wide, prefix, hint, children }: {
  id: string
  label: string
  icon: typeof Home
  required?: boolean
  optional?: boolean
  error?: string
  valid?: boolean
  wide?: boolean
  prefix?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className={`ca-field${wide ? ' is-wide' : ''}${error ? ' has-error' : ''}${valid ? ' is-valid' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="ca-req" aria-hidden="true"> *</span>}
        {optional && <span className="ca-opt"> (optional)</span>}
      </label>
      <div className="ca-input">
        <Icon size={18} className="ca-input-icon" aria-hidden="true" />
        {prefix && <span className="ca-input-prefix">{prefix}</span>}
        {children}
        {error
          ? <CircleAlert size={18} className="ca-input-state" aria-hidden="true" />
          : valid && <CircleCheck size={18} className="ca-input-state" aria-hidden="true" />}
      </div>
      {error
        ? <p id={`${id}-msg`} className="ca-field-err" role="alert">{error}</p>
        : hint && <p id={`${id}-msg`} className="ca-field-hint">{hint}</p>}
    </div>
  )
}

export default function AddressForm({ initialAddress, onSaved, onCancel, canCancel }: {
  initialAddress?: AddressData | null
  onSaved: (addr: AddressData) => void
  onCancel: () => void
  canCancel: boolean
}) {
  const showToast = useToast().show
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = Boolean(initialAddress?.id)
  const [form, setForm] = useState<Form>({
    fullName: initialAddress?.fullName || '', mobile: initialAddress?.mobile || '',
    addressLine1: initialAddress?.addressLine1 || '', addressLine2: initialAddress?.addressLine2 || '',
    landmark: initialAddress?.landmark || '', city: initialAddress?.city || '', state: initialAddress?.state || '',
    zipCode: initialAddress?.zipCode || '', country: initialAddress?.country || 'India',
    addressType: initialAddress?.addressType || 'Home', isDefault: initialAddress?.isDefault || false,
  })
  // A field shows its error once the user has left it (or tried to submit).
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const errors = validateAll(form)
  const shown = (k: FieldKey) => (touched[k] || submitted ? errors[k] : undefined)
  const isValid = (k: FieldKey) => Boolean((touched[k] || submitted) && !errors[k] && form[k].trim())
  const errorCount = Object.keys(errors).length

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    let value = v
    if (k === 'mobile') value = String(v).replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '').slice(0, 10) as Form[K]
    if (k === 'zipCode') value = String(v).replace(/\D/g, '').slice(0, 6) as Form[K]
    setForm((p) => ({ ...p, [k]: value }))
  }
  const blur = (k: FieldKey) => {
    setTouched((p) => ({ ...p, [k]: true }))
    // Tidy stray spaces once the user leaves a text field.
    if (k !== 'state') setForm((p) => ({ ...p, [k]: p[k].replace(/\s+/g, ' ').trim() }))
  }

  const inputProps = (k: FieldKey) => ({
    id: `ca-${k}`,
    name: k,
    value: form[k],
    onBlur: () => blur(k),
    'aria-invalid': Boolean(shown(k)),
    'aria-describedby': `ca-${k}-msg`,
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (errorCount > 0) {
      const first = FIELD_ORDER.find((k) => errors[k])
      formRef.current?.querySelector<HTMLElement>(`#ca-${first}`)?.focus()
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      fullName: form.fullName.trim(), addressLine1: form.addressLine1.trim(), addressLine2: form.addressLine2.trim(),
      landmark: form.landmark.trim(), city: form.city.trim(), country: 'India',
    }
    try {
      const saved = initialAddress?.id
        ? await addressService.update(initialAddress.id, payload)
        : await addressService.create(payload)
      onSaved(saved)
    } catch (err) {
      showToast(apiErrorMessage(err, 'Failed to save address'), 'error')
    }
    setSaving(false)
  }

  const stateOptions = form.state && !INDIAN_STATES.includes(form.state) ? [form.state, ...INDIAN_STATES] : INDIAN_STATES

  return (
    <form ref={formRef} className="ca-form" onSubmit={handleSave} noValidate>
      <div className="ca-form-head">
        <span className="ca-form-icon">{isEdit ? <Pencil size={22} /> : <MapPinPlus size={22} />}</span>
        <div>
          <h3>{isEdit ? 'Edit address' : 'Add a new address'}</h3>
          <p>Fields marked <span className="ca-req">*</span> are required</p>
        </div>
        {canCancel && (
          <button type="button" className="ca-form-close" onClick={onCancel} aria-label="Cancel and close form">
            <X size={20} />
          </button>
        )}
      </div>

      {submitted && errorCount > 0 && (
        <div className="ca-form-alert" role="alert">
          <CircleAlert size={20} />
          <span>Please fix {errorCount === 1 ? '1 field' : `${errorCount} fields`} highlighted below.</span>
        </div>
      )}

      <section className="ca-form-section">
        <h4><span>1</span> Contact details</h4>
        <div className="ca-form-grid">
          <Field id="ca-fullName" label="Full name" icon={UserRound} required error={shown('fullName')} valid={isValid('fullName')}>
            <input {...inputProps('fullName')} type="text" maxLength={50} autoComplete="name" placeholder="e.g. Maideen" onChange={(e) => set('fullName', e.target.value)} />
          </Field>
          <Field id="ca-mobile" label="Mobile number" icon={Phone} prefix="+91" required error={shown('mobile')} valid={isValid('mobile')} hint="We’ll call this number for delivery updates">
            <input {...inputProps('mobile')} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" onChange={(e) => set('mobile', e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="ca-form-section">
        <h4><span>2</span> Delivery address</h4>
        <div className="ca-form-grid">
          <Field id="ca-addressLine1" label="House no., building, street" icon={Building2} required wide error={shown('addressLine1')} valid={isValid('addressLine1')}>
            <input {...inputProps('addressLine1')} type="text" maxLength={150} autoComplete="address-line1" placeholder="e.g. 6/108, Krishnapuram Main Road" onChange={(e) => set('addressLine1', e.target.value)} />
          </Field>
          <Field id="ca-addressLine2" label="Area, locality" icon={MapIcon} optional error={shown('addressLine2')} valid={isValid('addressLine2')}>
            <input {...inputProps('addressLine2')} type="text" maxLength={100} autoComplete="address-line2" placeholder="e.g. Thambibatti" onChange={(e) => set('addressLine2', e.target.value)} />
          </Field>
          <Field id="ca-landmark" label="Landmark" icon={Landmark} optional error={shown('landmark')} valid={isValid('landmark')}>
            <input {...inputProps('landmark')} type="text" maxLength={80} placeholder="e.g. Near bus stand" onChange={(e) => set('landmark', e.target.value)} />
          </Field>
          <Field id="ca-city" label="City / Town" icon={MapPin} required error={shown('city')} valid={isValid('city')}>
            <input {...inputProps('city')} type="text" maxLength={50} autoComplete="address-level2" placeholder="e.g. Virudhunagar" onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field id="ca-state" label="State" icon={MapIcon} required error={shown('state')} valid={isValid('state')}>
            <select {...inputProps('state')} autoComplete="address-level1" className={form.state ? '' : 'is-placeholder'} onChange={(e) => { set('state', e.target.value); setTouched((p) => ({ ...p, state: true })) }}>
              <option value="" disabled>Select state</option>
              {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field id="ca-zipCode" label="Pincode" icon={Hash} required error={shown('zipCode')} valid={isValid('zipCode')}>
            <input {...inputProps('zipCode')} type="text" inputMode="numeric" autoComplete="postal-code" placeholder="6-digit pincode" onChange={(e) => set('zipCode', e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="ca-form-section">
        <h4><span>3</span> Address type</h4>
        <div className="ca-type" role="radiogroup" aria-label="Address type">
          {TYPES.map(({ value, label, hint, icon: Icon }) => {
            const active = form.addressType === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                className={active ? 'is-active' : ''}
                onClick={() => set('addressType', value)}
              >
                <span className="ca-type-icon"><Icon size={20} /></span>
                <span className="ca-type-text"><strong>{label}</strong><small>{hint}</small></span>
                {active && <Check size={16} strokeWidth={3} className="ca-type-check" />}
              </button>
            )
          })}
        </div>

        <label className="ca-check">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} />
          <span className="ca-check-box"><Check size={13} strokeWidth={3} /></span>
          <span><Star size={15} className="ca-check-star" /> Make this my default address</span>
        </label>
      </section>

      <div className="ca-form-actions">
        {canCancel && <button type="button" className="ca-btn-ghost" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="ca-btn-save" disabled={saving}>
          {saving ? <Loader2 size={18} className="ca-spin" /> : <Check size={18} strokeWidth={2.5} />}
          {saving ? 'Saving…' : isEdit ? 'Update Address' : 'Save & Deliver Here'}
        </button>
      </div>
    </form>
  )
}

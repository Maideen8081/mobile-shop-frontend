import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiCamera, FiCheckCircle, FiDollarSign, FiEdit3, FiImage, FiPlus, FiRotateCcw, FiSmartphone, FiTool, FiUser, FiX,
} from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import { Btn, ErrorBanner, Field, PageHeader, Panel, apiErrorMessage, apiFieldErrors, formatINR, inputBase, textareaBase } from '../components/admin/AdminUI'
import { deviceBrands, deviceCategories, issueCategories } from '../data/repairData'
import { repairService } from '../services/repairService'
import { focusFirstError, rules, validate, validateField, type Schema } from '../utils/adminValidation'
import { useToast } from '../context/ToastContext'

type FormKey =
  | 'customerName' | 'customerMobile' | 'customerAlt' | 'customerEmail' | 'customerAddress'
  | 'deviceCategory' | 'deviceBrand' | 'deviceModel' | 'imei' | 'serial' | 'deviceColor' | 'warranty'
  | 'issueCategory' | 'description' | 'priority' | 'accessories' | 'password' | 'internalNote'
  | 'estimatedCost' | 'estimatedDays' | 'technician'

type FormState = Record<FormKey, string>

const EMPTY: FormState = {
  customerName: '', customerMobile: '', customerAlt: '', customerEmail: '', customerAddress: '',
  deviceCategory: 'Mobile', deviceBrand: '', deviceModel: '', imei: '', serial: '', deviceColor: '', warranty: 'unknown',
  issueCategory: '', description: '', priority: 'medium', accessories: '', password: '', internalNote: '',
  estimatedCost: '', estimatedDays: '2', technician: '',
}

const DRAFT_KEY = 'admin:new-repair-draft'
const MAX_PHOTOS = 10
const MAX_PHOTO_MB = 5
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const schema: Schema<FormKey> = {
  customerName: [rules.required('Customer name'), rules.personName('Customer name'), rules.maxLength('Customer name', 100)],
  customerMobile: [rules.required('Mobile number'), rules.phone10to15('Mobile number')],
  customerAlt: [rules.phone10to15('Alternate number')],
  customerEmail: [rules.email()],
  customerAddress: [rules.maxLength('Address', 500)],
  deviceBrand: [rules.required('Brand'), rules.maxLength('Brand', 100)],
  deviceModel: [rules.required('Model'), rules.maxLength('Model', 100)],
  imei: [rules.imei()],
  serial: [rules.maxLength('Serial number', 100)],
  deviceColor: [rules.maxLength('Colour', 50)],
  issueCategory: [rules.required('Issue category')],
  description: [rules.required('Problem description'), rules.minLength('Problem description', 10), rules.maxLength('Problem description', 2000)],
  accessories: [rules.maxLength('Accessories', 255)],
  internalNote: [rules.maxLength('Internal note', 1000)],
  estimatedCost: [rules.amount('Estimated cost', { allowZero: true, max: 500000 })],
  estimatedDays: [rules.required('Completion time'), rules.intRange('Completion time', 1, 60)],
  technician: [rules.maxLength('Technician name', 100)],
}

// Server field → form field, so DRF errors land on the right input.
const serverFieldMap: Record<string, FormKey> = {
  customer_name: 'customerName', mobile_number: 'customerMobile', customer_mobile: 'customerMobile',
  alternate_number: 'customerAlt', email: 'customerEmail', address: 'customerAddress',
  device_brand: 'deviceBrand', device_model: 'deviceModel', imei_number: 'imei', serial_number: 'serial',
  device_color: 'deviceColor', issue_category: 'issueCategory', problem_description: 'description',
  estimated_cost: 'estimatedCost', estimated_completion_days: 'estimatedDays', assigned_technician: 'technician',
  accessories_submitted: 'accessories',
}

function readDraft(): FormState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : null
  } catch {
    return null
  }
}

function SectionTitle({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <span className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-lg bg-surface-lighter ring-1 ring-inset ring-border flex items-center justify-center text-text-secondary">{icon}</span>
      <span>
        <span className="block">{title}</span>
        {hint && <span className="block text-xs font-normal text-text-label mt-0.5">{hint}</span>}
      </span>
    </span>
  )
}

export default function NewRepairTicket() {
  const navigate = useNavigate()
  const showToast = useToast().show
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormState>(() => readDraft() ?? EMPTY)
  const [draftRestored] = useState(() => !!readDraft())
  const [touched, setTouched] = useState<Partial<Record<FormKey, boolean>>>({})
  const [errors, setErrors] = useState<Partial<Record<FormKey, string>>>({})
  const [photos, setPhotos] = useState<File[]>([])
  const [photoError, setPhotoError] = useState('')
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [created, setCreated] = useState<{ id: number; ticketNumber: string } | null>(null)

  // Auto-save a draft so a phone call or page refresh doesn't lose a half-filled ticket.
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const dirty = (Object.keys(EMPTY) as FormKey[]).some((k) => form[k] !== EMPTY[k])
        if (dirty) localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
        else localStorage.removeItem(DRAFT_KEY)
      } catch { /* storage unavailable: drafts are a convenience only */ }
    }, 400)
    return () => window.clearTimeout(t)
  }, [form])

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [photos])

  const set = (key: FormKey, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (touched[key] || errors[key]) setErrors((e) => ({ ...e, [key]: validateField(schema, key, value) || undefined }))
  }

  const blur = (key: FormKey) => {
    setTouched((t) => ({ ...t, [key]: true }))
    let msg = validateField(schema, key, form[key])
    if (!msg && key === 'customerAlt') msg = rules.differentFrom(() => form.customerMobile, 'Alternate number must differ from the mobile number')(form.customerAlt)
    setErrors((e) => ({ ...e, [key]: msg || undefined }))
  }

  const bind = (key: FormKey) => ({
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(key, e.target.value),
    onBlur: () => blur(key),
  })

  const addPhotos = useCallback((list: FileList | null) => {
    if (!list) return
    setPhotoError('')
    const accepted: File[] = []
    const problems: string[] = []
    for (const file of Array.from(list)) {
      if (!PHOTO_TYPES.includes(file.type)) problems.push(`${file.name}: only JPG, PNG or WebP`)
      else if (file.size > MAX_PHOTO_MB * 1024 * 1024) problems.push(`${file.name}: larger than ${MAX_PHOTO_MB} MB`)
      else accepted.push(file)
    }
    setPhotos((current) => {
      const room = MAX_PHOTOS - current.length
      if (accepted.length > room) problems.push(`Only ${MAX_PHOTOS} photos allowed — ${accepted.length - room} skipped`)
      return [...current, ...accepted.slice(0, Math.max(room, 0))]
    })
    if (problems.length) setPhotoError(problems.join(' · '))
  }, [])

  const resetForm = () => {
    setForm(EMPTY)
    setErrors({})
    setTouched({})
    setPhotos([])
    setPhotoError('')
    setSubmitError('')
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    const errs = validate(schema, form)
    const altMsg = rules.differentFrom(() => form.customerMobile, 'Alternate number must differ from the mobile number')(form.customerAlt)
    if (altMsg && !errs.customerAlt) errs.customerAlt = altMsg
    setErrors(errs)
    setTouched(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, true])))
    if (Object.keys(errs).length) {
      setSubmitError(`Please fix ${Object.keys(errs).length} field${Object.keys(errs).length > 1 ? 's' : ''} highlighted below.`)
      window.setTimeout(() => focusFirstError(formRef.current), 0)
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      const put = (k: string, v: string) => v.trim() && fd.append(k, v.trim())
      put('customer_name', form.customerName)
      put('mobile_number', form.customerMobile.replace(/\D/g, ''))
      put('alternate_number', form.customerAlt.replace(/\D/g, ''))
      put('email', form.customerEmail.toLowerCase())
      put('address', form.customerAddress)
      put('device_brand', form.deviceBrand)
      put('device_model', form.deviceModel)
      put('imei_number', form.imei.replace(/[\s-]/g, ''))
      put('serial_number', form.serial)
      put('device_color', form.deviceColor)
      put('warranty_status', form.warranty)
      put('issue_category', form.issueCategory)
      put('problem_description', `${form.deviceCategory && form.deviceCategory !== 'Mobile' ? `[${form.deviceCategory}] ` : ''}${form.description.trim()}`)
      put('priority', form.priority)
      put('accessories_submitted', form.accessories)
      put('device_password', form.password)
      put('estimated_cost', form.estimatedCost || '0')
      put('estimated_completion_days', form.estimatedDays)
      put('assigned_technician', form.technician)
      photos.forEach((p) => fd.append('photos', p))

      const ticket = await repairService.adminCreate(fd)
      if (form.internalNote.trim()) {
        try {
          await repairService.createNote(ticket.id, form.internalNote.trim(), 'Admin', true)
        } catch {
          showToast('Ticket created, but the internal note could not be saved', 'error')
        }
      }
      resetForm()
      setCreated({ id: ticket.id, ticketNumber: ticket.repairId })
      showToast('Repair ticket created', 'success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const fieldErrs = apiFieldErrors(err)
      const mapped: Partial<Record<FormKey, string>> = {}
      for (const [k, v] of Object.entries(fieldErrs)) if (serverFieldMap[k]) mapped[serverFieldMap[k]] = v
      if (fieldErrs.photos) setPhotoError(fieldErrs.photos)
      if (Object.keys(mapped).length) {
        setErrors((e2) => ({ ...e2, ...mapped }))
        setSubmitError('The server rejected some fields — see the highlighted inputs.')
        window.setTimeout(() => focusFirstError(formRef.current), 0)
      } else {
        setSubmitError(apiErrorMessage(err, 'Could not create the repair ticket. Please try again.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const errorCount = useMemo(() => Object.values(errors).filter(Boolean).length, [errors])
  const requiredDone = (['customerName', 'customerMobile', 'deviceBrand', 'deviceModel', 'issueCategory', 'description'] as FormKey[])
    .filter((k) => form[k].trim() && !errors[k]).length

  if (created) {
    return (
      <PageLayout title="New repair ticket">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="admin-card max-w-xl mx-auto mt-6 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#ecfdf3] text-[#079455] flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle size={26} />
          </div>
          <h2 className="text-xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>Ticket {created.ticketNumber} created</h2>
          <p className="mt-2 text-sm text-text-label">The customer has been notified. You can track progress and update the status from Repairs.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Btn variant="primary" icon={<FiTool size={15} />} onClick={() => navigate('/admin/repair-dashboard')}>Open in Repairs</Btn>
            <Btn icon={<FiPlus size={15} />} onClick={() => setCreated(null)}>Create another</Btn>
          </div>
        </motion.div>
      </PageLayout>
    )
  }

  const err = (k: FormKey) => (touched[k] || errors[k] ? errors[k] : undefined)

  return (
    <PageLayout title="New repair ticket">
      <PageHeader
        title="New repair ticket"
        description="Book in a walk-in device. Fields marked * are required; everything else can be added later from the ticket."
        actions={
          <Btn icon={<FiRotateCcw size={15} />} onClick={resetForm} disabled={submitting}>
            Clear form
          </Btn>
        }
      />

      {draftRestored && (
        <div className="mb-4 rounded-xl bg-[#eff8ff] ring-1 ring-inset ring-[#b2ddff] px-4 py-2.5 text-sm text-[#175cd3] flex items-center gap-2">
          <FiEdit3 size={14} /> We restored your unsaved draft. Use “Clear form” to start fresh.
        </div>
      )}

      <form ref={formRef} onSubmit={submit} noValidate className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="space-y-5">
          <Panel title={<SectionTitle icon={<FiUser size={15} />} title="Customer" hint="Who should we contact about this repair?" />} bodyClassName="p-5 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full name" required error={err('customerName')} className="md:col-span-2">
                {(a) => <input {...a} {...bind('customerName')} autoComplete="off" maxLength={100} placeholder="e.g. Ravi Kumar" className={inputBase} />}
              </Field>
              <Field label="Mobile number" required error={err('customerMobile')} hint="10–15 digits; spaces and dashes are fine">
                {(a) => <input {...a} {...bind('customerMobile')} inputMode="tel" placeholder="98765 43210" className={inputBase} />}
              </Field>
              <Field label="Alternate number" error={err('customerAlt')}>
                {(a) => <input {...a} {...bind('customerAlt')} inputMode="tel" placeholder="Optional" className={inputBase} />}
              </Field>
              <Field label="Email" error={err('customerEmail')} hint="Status updates are sent here">
                {(a) => <input {...a} {...bind('customerEmail')} type="email" inputMode="email" placeholder="name@example.com" className={inputBase} />}
              </Field>
              <Field label="Address" error={err('customerAddress')}>
                {(a) => <input {...a} {...bind('customerAddress')} placeholder="Optional" className={inputBase} />}
              </Field>
            </div>
          </Panel>

          <Panel title={<SectionTitle icon={<FiSmartphone size={15} />} title="Device" hint="What has been handed over?" />} bodyClassName="p-5 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Category">
                {(a) => (
                  <select {...a} {...bind('deviceCategory')} className={inputBase}>
                    {deviceCategories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                )}
              </Field>
              <Field label="Brand" required error={err('deviceBrand')}>
                {(a) => (
                  <>
                    <input {...a} {...bind('deviceBrand')} list="repair-brands" placeholder="Select or type" className={inputBase} />
                    <datalist id="repair-brands">{deviceBrands.map((b) => <option key={b} value={b} />)}</datalist>
                  </>
                )}
              </Field>
              <Field label="Model" required error={err('deviceModel')}>
                {(a) => <input {...a} {...bind('deviceModel')} placeholder="e.g. iPhone 13 Pro" className={inputBase} />}
              </Field>
              <Field label="IMEI" error={err('imei')} hint="Dial *#06# on the device" counter={form.imei ? { value: form.imei.replace(/[\s-]/g, '').length, max: 15 } : undefined}>
                {(a) => <input {...a} {...bind('imei')} inputMode="numeric" placeholder="15 digits" className={`${inputBase} tabular`} />}
              </Field>
              <Field label="Serial number" error={err('serial')}>
                {(a) => <input {...a} {...bind('serial')} placeholder="Optional" className={inputBase} />}
              </Field>
              <Field label="Colour" error={err('deviceColor')}>
                {(a) => <input {...a} {...bind('deviceColor')} placeholder="e.g. Graphite" className={inputBase} />}
              </Field>
              <Field label="Warranty">
                {(a) => (
                  <select {...a} {...bind('warranty')} className={inputBase}>
                    <option value="unknown">Not sure</option>
                    <option value="in_warranty">In warranty</option>
                    <option value="out_of_warranty">Out of warranty</option>
                  </select>
                )}
              </Field>
              <Field label="Accessories received" error={err('accessories')} className="md:col-span-2">
                {(a) => <input {...a} {...bind('accessories')} placeholder="e.g. Box, charger, case" className={inputBase} />}
              </Field>
            </div>
          </Panel>

          <Panel title={<SectionTitle icon={<FiEdit3 size={15} />} title="Problem" hint="Describe what the customer reported" />} bodyClassName="p-5 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Issue category" required error={err('issueCategory')}>
                {(a) => (
                  <select {...a} {...bind('issueCategory')} className={inputBase}>
                    <option value="">Select an issue</option>
                    {issueCategories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                )}
              </Field>
              <Field label="Priority">
                {(a) => (
                  <select {...a} {...bind('priority')} className={inputBase}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                )}
              </Field>
              <Field label="Problem description" required error={err('description')} className="md:col-span-2"
                counter={{ value: form.description.trim().length, max: 2000 }} hint="At least 10 characters — symptoms, when it started, anything already tried">
                {(a) => <textarea {...a} {...bind('description')} rows={4} placeholder="e.g. Screen cracked after a drop; touch stops responding on the left edge." className={textareaBase} />}
              </Field>
              <Field label="Device passcode" hint="Only if the customer agreed to share it">
                {(a) => <input {...a} {...bind('password')} autoComplete="off" placeholder="Optional" className={inputBase} />}
              </Field>
              <Field label="Internal note" error={err('internalNote')} hint="Visible to staff only">
                {(a) => <input {...a} {...bind('internalNote')} placeholder="Optional" className={inputBase} />}
              </Field>
            </div>
          </Panel>

          <Panel title={<SectionTitle icon={<FiCamera size={15} />} title="Condition photos" hint={`Up to ${MAX_PHOTOS} · JPG, PNG or WebP · ${MAX_PHOTO_MB} MB each`} />} bodyClassName="p-5 pt-4">
            <input ref={fileRef} type="file" accept={PHOTO_TYPES.join(',')} multiple className="hidden" onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} />
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addPhotos(e.dataTransfer.files) }}
              className="rounded-xl border-2 border-dashed border-border-dark hover:border-primary/50 hover:bg-[#fdecee]/30 transition-colors p-6 text-center cursor-pointer"
            >
              <FiImage className="mx-auto text-text-muted mb-2" size={22} />
              <p className="text-sm font-medium text-text-primary">Drop photos here or <span className="text-primary">browse</span></p>
              <p className="text-xs text-text-label mt-1">Front, back and every damaged area — this protects you and the customer.</p>
            </div>
            {photoError && <p role="alert" className="mt-2 text-xs font-medium text-danger">{photoError}</p>}
            {photos.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 mt-3">
                <AnimatePresence>
                  {photos.map((p, i) => (
                    <motion.div key={`${p.name}-${p.lastModified}-${i}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="relative group aspect-square rounded-lg overflow-hidden ring-1 ring-border bg-surface-lighter">
                      <img src={previews[i]} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-6 h-6 rounded-md bg-[#101828]/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition">
                        <FiX size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Panel>

          <Panel title={<SectionTitle icon={<FiDollarSign size={15} />} title="Estimate & assignment" hint="Can be revised after diagnosis" />} bodyClassName="p-5 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Estimated cost (₹)" error={err('estimatedCost')} hint="Leave blank if not quoted yet">
                {(a) => <input {...a} {...bind('estimatedCost')} inputMode="decimal" placeholder="0" className={`${inputBase} tabular`} />}
              </Field>
              <Field label="Ready in (days)" required error={err('estimatedDays')}>
                {(a) => <input {...a} {...bind('estimatedDays')} inputMode="numeric" className={`${inputBase} tabular`} />}
              </Field>
              <Field label="Technician" error={err('technician')} hint="Leave blank to assign later">
                {(a) => <input {...a} {...bind('technician')} placeholder="e.g. Suresh" className={inputBase} />}
              </Field>
            </div>
          </Panel>
        </div>

        <aside className="xl:sticky xl:top-24 space-y-4">
          <div className="admin-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-label">Ticket summary</p>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ['Customer', form.customerName || '—'],
                ['Mobile', form.customerMobile || '—'],
                ['Device', [form.deviceBrand, form.deviceModel].filter(Boolean).join(' ') || '—'],
                ['Issue', form.issueCategory || '—'],
                ['Priority', form.priority[0].toUpperCase() + form.priority.slice(1)],
                ['Estimate', form.estimatedCost && !errors.estimatedCost ? formatINR(Number(form.estimatedCost)) : '—'],
                ['Photos', `${photos.length} attached`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-text-label">{k}</dt>
                  <dd className="font-medium text-text-primary text-right truncate">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 pt-4 border-t border-border-light">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-label">Required fields</span>
                <span className="font-semibold text-text-primary tabular">{requiredDone}/6</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-lighter overflow-hidden">
                <div className="h-full rounded-full bg-[#17b26a] transition-all duration-300" style={{ width: `${(requiredDone / 6) * 100}%` }} />
              </div>
            </div>
            {submitError && <div className="mt-4"><ErrorBanner message={submitError} /></div>}
            <Btn type="submit" variant="primary" size="lg" loading={submitting} className="w-full mt-4" icon={<FiCheckCircle size={16} />}>
              {submitting ? 'Creating ticket…' : 'Create ticket'}
            </Btn>
            {errorCount > 0 && !submitError && <p className="mt-2 text-xs text-danger text-center">{errorCount} field{errorCount > 1 ? 's need' : ' needs'} attention</p>}
            <p className="mt-3 text-[11px] text-text-muted text-center">Draft saves automatically on this device.</p>
          </div>
        </aside>
      </form>
    </PageLayout>
  )
}

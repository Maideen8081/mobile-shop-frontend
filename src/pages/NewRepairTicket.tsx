import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUser, FiSmartphone, FiAlertCircle, FiCamera, FiDollarSign, FiCheckCircle, FiArrowLeft, FiArrowRight, FiSend, FiSave, FiCheck, FiX, FiImage, FiEdit3 } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import { deviceCategories, deviceBrands, issueCategories, repairTechnicians } from '../data/repairData'
import { repairService } from '../services/repairService'
import RepairTicketManagement from '../components/repair/RepairTicketManagement'
import CreatableSelect from '../components/ui/CreatableSelect'

const steps = [
  { id: 1, label: 'Customer', icon: FiUser },
  { id: 2, label: 'Device', icon: FiSmartphone },
  { id: 3, label: 'Issue', icon: FiEdit3 },
  { id: 4, label: 'Photos', icon: FiCamera },
  { id: 5, label: 'Estimate', icon: FiDollarSign },
  { id: 6, label: 'Submit', icon: FiCheckCircle },
]

const initialForm = {
  customerName: '', customerMobile: '', customerAlt: '', customerEmail: '', customerAddress: '',
  deviceCategory: '', deviceBrand: '', deviceModel: '', imei: '', serial: '', deviceColor: '',
  deviceCondition: '', warranty: '', purchaseDate: '',
  issueCategory: '', description: '', priority: 'Medium', accessories: '', password: '',
  userQuestions: '',
}

function AnimatedInput({ label, value, onChange, placeholder, type = 'text', required, error, rows }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; error?: string; rows?: number
}) {
  const Tag = rows ? 'textarea' as any : 'input'
  const inputProps = rows ? { rows } : { type }

  const shakeKey = error ? 'shake' : 'no-shake'

  return (
    <motion.div key={shakeKey} animate={error ? { x: [0, -4, 4, -4, 4, -2, 2, 0] } : {}} transition={{ duration: 0.4 }}>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <Tag
        {...inputProps}
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${rows ? 'px-4 py-3 resize-none' : 'h-11 px-4'} rounded-xl border text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-primary/50 ${
          error ? 'border-danger shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : 'border-border hover:border-primary/30'
        } bg-[rgba(15,23,42,0.8)]`}
      />
      {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-danger mt-1 flex items-center gap-1"><FiAlertCircle size={10} />{error}</motion.p>}
    </motion.div>
  )
}

function PhotoUpload({ files, setFiles }: { files: File[]; setFiles: (f: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [files])

  const handleFiles = useCallback((fileList: FileList) => {
    const remaining = 10 - files.length
    if (remaining <= 0) return
    const toAdd = Math.min(fileList.length, remaining)
    const newFiles = Array.from(fileList).slice(0, toAdd)
    setFiles([...files, ...newFiles])
  }, [files, setFiles])

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(previews[idx])
    setFiles(files.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <div onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
          dragOver ? 'border-primary bg-primary/10' : 'border-primary/20 hover:border-primary/40'
        } bg-[rgba(15,23,42,0.8)]`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }} />
        <motion.div animate={{ y: dragOver ? -4 : 0 }} className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FiCamera size={24} className="text-primary" />
          </div>
          <p className="text-sm font-semibold text-text-secondary">Drop images or click to upload</p>
          <p className="text-xs text-text-muted">Show device front, back, and damage areas (max 10)</p>
        </motion.div>
      </div>
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-3">
          <AnimatePresence>
            {files.map((_, i) => (
              <motion.div key={`${i}-${files[i].name}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="relative group aspect-square rounded-xl bg-[#0F172A] border border-border overflow-hidden"
              >
                <img src={previews[i] || ''} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-rose-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                ><FiX size={12} /></button>
              </motion.div>
            ))}
          </AnimatePresence>
          {files.length < 10 && (
            <button type="button" onClick={() => inputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-primary/20 bg-[rgba(15,23,42,0.5)] flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/40 transition-all cursor-pointer">
              <FiImage size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function NewRepairTicket() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ ...initialForm })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [estCost, setEstCost] = useState(0)
  const [estDays, setEstDays] = useState(2)
  const [technician, setTechnician] = useState(0)
  const [customerApproval, setCustomerApproval] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customBrands, setCustomBrands] = useState<string[]>([])
  const [customWarranties, setCustomWarranties] = useState<string[]>([])
  const [customIssues, setCustomIssues] = useState<string[]>([])
  const [customPriorities, setCustomPriorities] = useState<string[]>([])
  const [customTechs, setCustomTechs] = useState<{ id: number; name: string }[]>([])
  const techIdCounter = useRef(100)
  const allCategories = useMemo(() => [...deviceCategories, ...customCategories], [customCategories])
  const allBrands = useMemo(() => [...deviceBrands, ...customBrands], [customBrands])
  const allWarranties = useMemo(() => ['In Warranty', 'Out of Warranty', 'Expired', ...customWarranties], [customWarranties])
  const allIssues = useMemo(() => [...issueCategories, ...customIssues], [customIssues])
  const allPriorities = useMemo(() => ['Low', 'Medium', 'High', 'Urgent', ...customPriorities], [customPriorities])
  const allTechs = useMemo(() => [...repairTechnicians.filter((t) => t.online).map((t) => ({ id: t.id, name: `${t.name} — ${t.speciality}` })), ...customTechs], [customTechs])

  const update = (key: string, val: string) => {
    setForm({ ...form, [key]: val })
    if (errors[key]) {
      const { [key]: _, ...rest } = errors
      setErrors(rest)
    }
  }

  const validate = (s: number): boolean => {
    const errs: Record<string, string> = {}
    if (s >= 1) {
      if (!form.customerName.trim()) errs.customerName = 'Customer Name is required'
      if (!form.customerMobile.trim()) errs.customerMobile = 'Mobile Number is required'
    }
    if (s >= 2) {
      if (!form.deviceCategory) errs.deviceCategory = 'Please select device category'
      if (!form.deviceBrand) errs.deviceBrand = 'Brand is required'
      if (!form.deviceModel.trim()) errs.deviceModel = 'Model is required'
    }
    if (s >= 3) {
      if (!form.issueCategory) errs.issueCategory = 'Please select issue category'
      if (!form.description.trim()) errs.description = 'Problem description is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const goNext = () => {
    if (validate(step)) setStep(step + 1)
  }

  const goPrev = () => setStep(Math.max(1, step - 1))

  const handleSubmit = async () => {
    if (!validate(step)) return
    setSubmitting(true)
    setSubmitError('')

    try {
      const fd = new FormData()
      fd.append('customer_name', form.customerName.trim())
      fd.append('customer_mobile', form.customerMobile.trim())
      if (form.customerAlt.trim()) fd.append('customer_alternate_mobile', form.customerAlt.trim())
      if (form.customerEmail.trim()) fd.append('email', form.customerEmail.trim())
      if (form.customerAddress.trim()) fd.append('address', form.customerAddress.trim())
      fd.append('device_category', form.deviceCategory)
      fd.append('device_brand', form.deviceBrand)
      fd.append('device_model', form.deviceModel.trim())
      if (form.imei.trim()) fd.append('imei_number', form.imei.trim())
      if (form.serial.trim()) fd.append('serial_number', form.serial.trim())
      if (form.deviceColor.trim()) fd.append('device_color', form.deviceColor.trim())
      if (form.deviceCondition.trim()) fd.append('device_condition', form.deviceCondition.trim())
      fd.append('issue_category', form.issueCategory)
      fd.append('problem_description', form.description.trim())
      fd.append('priority', form.priority.toLowerCase())
      if (form.accessories.trim()) fd.append('accessories_submitted', form.accessories.trim())
      if (form.password.trim()) fd.append('device_password', form.password.trim())
      fd.append('estimated_cost', String(estCost))
      fd.append('estimated_completion_days', String(estDays))
      if (technician > 0) fd.append('assigned_technician', String(technician))
      fd.append('customer_approval_required', String(customerApproval))

      imageFiles.forEach((file) => fd.append('photos', file))

      const created = await repairService.create(fd)

      if (form.userQuestions.trim()) {
        try {
          await repairService.createNote(created.id, form.userQuestions.trim(), form.customerName.trim(), false)
        } catch { /* note creation is best-effort */ }
      }

      setForm({ ...initialForm })
      setImageFiles([])
      setEstCost(0)
      setEstDays(2)
      setTechnician(0)
      setCustomerApproval(true)
      setStep(1)
      setSuccessMsg('Repair ticket created successfully! Track it at My Repairs.')
      setRefreshTrigger((p) => p + 1)
      setTimeout(() => setSuccessMsg(''), 6000)
      setSubmitting(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create repair ticket. Please try again.'
      setSubmitError(msg)
      setSubmitting(false)
    }
  }

  const summary = [
    { label: 'Customer', value: form.customerName || '—' },
    { label: 'Category', value: form.deviceCategory || '—' },
    { label: 'Device', value: form.deviceBrand && form.deviceModel ? `${form.deviceBrand} ${form.deviceModel}` : '—' },
    { label: 'Issue', value: form.issueCategory || '—' },
    { label: 'Est. Cost', value: estCost > 0 ? `₹${estCost.toLocaleString('en-IN')}` : '—' },
  ]

  return (
    <PageLayout title="New Repair Ticket">
      {successMsg && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          className="mb-4 flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-lg"
        >
          <FiCheckCircle size={18} className="shrink-0" />
          <span className="text-sm font-semibold flex-1">{successMsg}</span>
          <Link to="/my-repairs"
            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Track Repairs
          </Link>
        </motion.div>
      )}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                  <span className="hover:text-text-secondary transition-colors cursor-pointer">Repairs</span>
                  <span>/</span>
                  <span className="text-text-secondary font-medium">New Ticket</span>
                </div>
                <h1 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">New Repair Ticket</h1>
                <p className="text-sm text-text-muted mt-0.5">Create a new repair ticket with device details and customer information.</p>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-0 p-1 rounded-xl bg-[rgba(15,23,42,0.6)] border border-border shadow-sm overflow-x-auto mb-5">
            {steps.map((s, i) => {
              const Icon = s.icon
              const isActive = step === s.id
              const isDone = step > s.id
              return (
                <button key={s.id} onClick={() => setStep(s.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer relative ${
                    isActive ? 'text-white' : isDone ? 'text-success' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {isActive && (
                    <motion.div layoutId="stepGlow" className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary to-blue-500 shadow-lg shadow-primary/30" />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {isDone ? (
                      <span className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center"><FiCheck size={11} className="text-success" /></span>
                    ) : (
                      <Icon size={13} className={isActive ? 'text-white' : ''} />
                    )}
                    <span className={`hidden sm:inline ${isActive ? 'text-white' : ''}`}>{s.label}</span>
                  </span>
                  {i < steps.length - 1 && (
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-px hidden sm:block ${isDone ? 'bg-success/50' : 'bg-border'}`} />
                  )}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={`step-${step}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl bg-bg-card border border-border p-5 lg:p-6"
            >
              {step === 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><FiUser size={15} className="text-primary" /></div>
                    <h3 className="text-sm font-bold text-text-primary">Customer Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <AnimatedInput label="Customer Name" value={form.customerName} onChange={(v) => update('customerName', v)} placeholder="Full name" required error={errors.customerName} />
                    </div>
                    <AnimatedInput label="Mobile Number" value={form.customerMobile} onChange={(v) => update('customerMobile', v)} placeholder="+91 98765 43210" required error={errors.customerMobile} />
                    <AnimatedInput label="Alternate Number" value={form.customerAlt} onChange={(v) => update('customerAlt', v)} placeholder="+91 ..." />
                    <AnimatedInput label="Email" value={form.customerEmail} onChange={(v) => update('customerEmail', v)} placeholder="email@example.com" type="email" />
                    <AnimatedInput label="Address" value={form.customerAddress} onChange={(v) => update('customerAddress', v)} placeholder="Customer address" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><FiSmartphone size={15} className="text-primary" /></div>
                    <h3 className="text-sm font-bold text-text-primary">Device Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <CreatableSelect label="Device Category" options={allCategories} value={form.deviceCategory} onChange={(v) => update('deviceCategory', v)} placeholder="Select device category" required error={errors.deviceCategory}
                        onCreate={(v) => setCustomCategories((p) => [...p, v])} />
                    </div>
                    <CreatableSelect label="Device Brand" options={allBrands} value={form.deviceBrand} onChange={(v) => update('deviceBrand', v)} placeholder="Select brand" required error={errors.deviceBrand}
                      onCreate={(v) => setCustomBrands((p) => [...p, v])} />
                    <AnimatedInput label="Device Model" value={form.deviceModel} onChange={(v) => update('deviceModel', v)} placeholder="e.g. iPhone 15 Pro Max" required error={errors.deviceModel} />
                    <AnimatedInput label="IMEI Number" value={form.imei} onChange={(v) => update('imei', v)} placeholder="15 digit IMEI" />
                    <AnimatedInput label="Serial Number" value={form.serial} onChange={(v) => update('serial', v)} placeholder="Serial number" />
                    <AnimatedInput label="Device Color" value={form.deviceColor} onChange={(v) => update('deviceColor', v)} placeholder="e.g. Space Gray" />
                    <CreatableSelect label="Warranty Status" options={allWarranties} value={form.warranty} onChange={(v) => update('warranty', v)} placeholder="Select"
                      onCreate={(v) => setCustomWarranties((p) => [...p, v])} />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><FiEdit3 size={15} className="text-primary" /></div>
                    <h3 className="text-sm font-bold text-text-primary">Issue Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <CreatableSelect label="Issue Category" options={allIssues} value={form.issueCategory} onChange={(v) => update('issueCategory', v)} placeholder="Select issue" required error={errors.issueCategory}
                        onCreate={(v) => setCustomIssues((p) => [...p, v])} />
                    </div>
                    <div className="md:col-span-2">
                      <AnimatedInput label="Problem Description" value={form.description} onChange={(v) => update('description', v)} placeholder="Describe the issue in detail..." required error={errors.description} rows={4} />
                    </div>
                    <div className="md:col-span-2">
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-3">
                        <p className="text-xs font-semibold text-primary flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">help</span>
                          Questions for the Admin Team
                        </p>
                        <p className="text-[10px] text-text-muted mt-1">Have any questions about the repair process, cost, parts, or timeline? Let us know below and our team will respond to you.</p>
                      </div>
                      <AnimatedInput label="Your Questions (Optional)" value={form.userQuestions} onChange={(v) => update('userQuestions', v)} placeholder="e.g. How long will the repair take? Do you use original parts? Is there a warranty on the repair?" rows={3} />
                    </div>
                    <CreatableSelect label="Priority" options={allPriorities} value={form.priority} onChange={(v) => update('priority', v)}
                      onCreate={(v) => setCustomPriorities((p) => [...p, v])} />
                    <AnimatedInput label="Accessories Submitted" value={form.accessories} onChange={(v) => update('accessories', v)} placeholder="Box, Charger, Cable" />
                    <AnimatedInput label="Device Password" value={form.password} onChange={(v) => update('password', v)} placeholder="Provided / N/A" />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><FiCamera size={15} className="text-primary" /></div>
                    <h3 className="text-sm font-bold text-text-primary">Device Condition Photos</h3>
                  </div>
                  <PhotoUpload files={imageFiles} setFiles={setImageFiles} />
                </div>
              )}

              {step === 5 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><FiDollarSign size={15} className="text-primary" /></div>
                    <h3 className="text-sm font-bold text-text-primary">Repair Estimation</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatedInput label="Estimated Cost (₹)" value={String(estCost || '')} onChange={(v) => setEstCost(Number(v) || 0)} placeholder="0" type="number" />
                    <AnimatedInput label="Est. Completion (Days)" value={String(estDays)} onChange={(v) => setEstDays(Number(v) || 2)} type="number" />
                    <div className="md:col-span-2">
                      <CreatableSelect label="Assign Technician" options={allTechs.map((t) => t.name)} value={technician === 0 ? '' : allTechs.find((t) => t.id === technician)?.name || ''}
                        onChange={(v) => {
                          const found = allTechs.find((t) => t.name === v)
                          setTechnician(found ? found.id : 0)
                        }}
                        onCreate={(v) => {
                          const newId = techIdCounter.current++
                          setCustomTechs((p) => [...p, { id: newId, name: v }])
                          setTechnician(newId)
                        }}
                        placeholder="Auto Assign" creatable
                      />
                    </div>
                    <div className="flex items-center pt-2">
                      <label className="flex items-center gap-2.5 text-xs font-semibold text-text-secondary cursor-pointer">
                        <input type="checkbox" checked={customerApproval} onChange={(e) => setCustomerApproval(e.target.checked)} className="w-4 h-4 rounded border-primary/20 text-primary focus:ring-primary bg-[rgba(15,23,42,0.8)]" />
                        Customer Approval Required
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="text-center py-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-3xl bg-success/10 flex items-center justify-center mx-auto mb-4"
                  >
                    <FiCheckCircle size={36} className="text-success" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-text-primary">Ready to Create Ticket</h3>
                  <p className="text-sm text-text-muted mt-1 max-w-md mx-auto">Review and confirm the repair ticket details before submission.</p>
                  <div className="max-w-sm mx-auto mt-6 space-y-2 text-left">
                    {[
                      ['Customer', form.customerName],
                      ['Mobile', form.customerMobile],
                      ['Category', form.deviceCategory],
                      ['Device', `${form.deviceBrand} ${form.deviceModel}`],
                      ['Issue', form.issueCategory],
                      ['Cost', `₹${estCost.toLocaleString('en-IN')}`],
                      ['Technician', technician ? repairTechnicians.find((t) => t.id === technician)?.name || 'Auto Assign' : 'Auto Assign'],
                      ...(form.userQuestions.trim() ? [['Questions', form.userQuestions.trim()]] : []),
                    ].map(([label, val], i) => (
                      <motion.div key={label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                        className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-[rgba(15,23,42,0.8)] border border-border text-sm"
                      >
                        <span className="text-text-muted">{label}</span>
                        <span className="font-semibold text-text-primary text-right truncate ml-4">{val || '—'}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {submitError && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger mt-4"
            ><FiAlertCircle size={14} /> {submitError}</motion.div>
          )}
          <div className="flex items-center justify-between gap-3 mt-4">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={goPrev} disabled={step === 1}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[rgba(15,23,42,0.8)] border border-border text-sm font-semibold text-text-secondary hover:border-primary/30 hover:text-text-primary transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            ><FiArrowLeft size={14} /> Previous</motion.button>
            <div className="flex items-center gap-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"
              ><FiSave size={13} /> Save Draft</motion.button>
              {step < 6 ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={goNext}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all cursor-pointer"
                >Next <FiArrowRight size={14} /></motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={submitting} onClick={handleSubmit}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-success to-emerald-600 text-white text-sm font-semibold shadow-lg shadow-success/25 hover:shadow-success/40 transition-all disabled:opacity-50 cursor-pointer"
                ><FiSend size={14} /> {submitting ? 'Creating...' : 'Generate Ticket'}</motion.button>
              )}
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="hidden lg:block w-72 flex-shrink-0"
        >
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl bg-bg-card border border-border p-5 shadow-lg">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Ticket Summary</h4>
              <div className="space-y-3">
                {summary.map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] text-text-muted font-medium">{item.label}</p>
                    <motion.p key={item.value} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-sm font-semibold text-text-primary truncate"
                    >{item.value}</motion.p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-medium">Progress</span>
                  <span className="text-xs font-bold text-primary">{Math.round((step / 6) * 100)}%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-[rgba(15,23,42,0.8)] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(step / 6) * 100}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500"
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <FiCamera size={12} />
                  <span>{imageFiles.length} photo{imageFiles.length !== 1 ? 's' : ''} attached</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-10 pt-8 border-t border-border">
        <RepairTicketManagement refreshTrigger={refreshTrigger} onRefresh={() => setRefreshTrigger((p) => p + 1)} />
      </div>
    </PageLayout>
  )
}

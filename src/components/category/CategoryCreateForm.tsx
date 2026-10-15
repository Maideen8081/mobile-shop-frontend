import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiRefreshCw, FiX, FiImage, FiAlertCircle } from 'react-icons/fi'
import {
  CATEGORY_IMAGE_MAX_MB, IMAGE_ACCEPT, IMAGE_TYPES_LABEL, MAX_SUB_CATEGORIES, NAME_MAX,
  catalogNameError, imageFileError, normalizeName, omitKey, type Errors,
} from '../../utils/catalogValidation'

export interface CategoryCreateData {
  name: string
  status: boolean
  image: File
  subCategoryNames: string[]
}

interface CategoryCreateFormProps {
  /** Resolves to field errors from the server, or null on success. */
  onSubmit: (data: CategoryCreateData) => Promise<Errors | null>
  loading: boolean
  existingNames: string[]
}

export default function CategoryCreateForm({ onSubmit, loading, existingNames }: CategoryCreateFormProps) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [subInput, setSubInput] = useState('')
  const [subs, setSubs] = useState<string[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [shake, setShake] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const clearError = (key: string) => setErrors((prev) => omitKey(prev, key))

  const handleFileSelect = useCallback((f: File) => {
    const err = imageFileError(f, CATEGORY_IMAGE_MAX_MB)
    if (err) { setErrors((prev) => ({ ...prev, category_image: err })); return }
    clearError('category_image')
    setFile(f)
  }, [])

  const nameError = (value: string) => {
    const err = catalogNameError(value, 'Category name')
    if (err) return err
    const lower = normalizeName(value).toLowerCase()
    if (existingNames.some((n) => n.toLowerCase() === lower)) return 'A category with this name already exists'
    return undefined
  }

  const addSub = () => {
    const sub = normalizeName(subInput)
    if (!sub) return
    const err = catalogNameError(sub, 'Sub category name')
      || (subs.some((s) => s.toLowerCase() === sub.toLowerCase()) ? 'This sub category is already in the list' : undefined)
      || (subs.length >= MAX_SUB_CATEGORIES ? `At most ${MAX_SUB_CATEGORIES} sub categories per category` : undefined)
    if (err) { setErrors((prev) => ({ ...prev, sub_category_name: err })); return }
    setSubs([...subs, sub])
    setSubInput('')
    clearError('sub_category_name')
  }

  const validate = (): boolean => {
    const errs: Errors = {}
    const n = nameError(name)
    if (n) errs.category_name = n
    if (!file) errs.category_image = 'Category image is required'
    if (normalizeName(subInput)) errs.sub_category_name = 'Press Add (or Enter) to add this sub category, or clear the field'
    setErrors(errs)
    if (Object.keys(errs).length) setShake((k) => k + 1)
    return Object.keys(errs).length === 0
  }

  const handleReset = () => {
    setName(''); setStatus(true); setFile(null); setSubs([]); setSubInput(''); setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || !validate() || !file) return
    const serverErrors = await onSubmit({ name: normalizeName(name), status, image: file, subCategoryNames: subs })
    if (serverErrors) {
      setErrors(serverErrors)
      setShake((k) => k + 1)
    } else {
      handleReset()
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm outline-none transition-all duration-150 text-text-primary placeholder-text-label ${
      hasError ? 'border-danger ring-1 ring-danger/20' : 'border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
    }`

  const fieldError = (k: string) => (
    <AnimatePresence>
      {errors[k] && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="text-xs mt-1.5 text-danger flex items-start gap-1" role="alert"
        ><FiAlertCircle size={12} className="mt-0.5 shrink-0" />{errors[k]}</motion.p>
      )}
    </AnimatePresence>
  )

  const nameLength = normalizeName(name).length

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-5 lg:p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Create Category</h3>
          <p className="text-xs text-text-muted mt-0.5">Add a new product category to your store</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={status}
          aria-label="Category active"
          onClick={() => setStatus(!status)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="text-xs font-medium text-text-muted">{status ? 'Active' : 'Inactive'}</span>
          <span className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${status ? 'bg-primary' : 'bg-gray-300'}`}>
            <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm ${status ? 'right-0.5' : 'left-0.5'}`}
            />
          </span>
        </button>
      </div>

      <motion.form
        key={shake}
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5"
        animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="cat-name" className="block text-sm font-medium text-text-secondary">
              Category Name <span className="text-danger">*</span>
            </label>
            <span className={`text-[11px] ${nameLength > NAME_MAX ? 'text-danger' : 'text-text-muted'}`}>{nameLength}/{NAME_MAX}</span>
          </div>
          <input
            id="cat-name"
            type="text"
            placeholder="e.g. Smartphones"
            value={name}
            maxLength={NAME_MAX + 20}
            onChange={(e) => { setName(e.target.value); clearError('category_name') }}
            onBlur={() => { const err = name && nameError(name); if (err) setErrors((p) => ({ ...p, category_name: err })) }}
            className={inputClass(!!errors.category_name)}
            aria-invalid={!!errors.category_name}
          />
          {fieldError('category_name')}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Category Image <span className="text-danger">*</span>
          </label>
          <div
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
            role="button"
            tabIndex={0}
            aria-label="Choose category image"
            className={`relative flex flex-col items-center justify-center h-44 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
              dragging ? 'border-primary/60 bg-primary/5'
                : errors.category_image ? 'border-danger ring-1 ring-danger/20 bg-surface-lighter'
                  : 'border-border bg-surface-lighter hover:border-primary/40'
            }`}
          >
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-2xl p-2" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-danger/90 flex items-center justify-center hover:bg-danger transition-colors cursor-pointer shadow-md"
                >
                  <FiX size={13} className="text-white" />
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <FiImage size={22} className="text-primary" />
                </div>
                <p className="text-sm text-text-secondary font-medium">Drop image here or click to browse</p>
                <p className="text-xs text-text-muted mt-1">{IMAGE_TYPES_LABEL}, up to {CATEGORY_IMAGE_MAX_MB}MB</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = '' }}
            className="hidden"
          />
          {fieldError('category_image')}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="cat-sub" className="block text-sm font-medium text-text-secondary">
              Sub Categories <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <span className="text-[11px] text-text-muted">{subs.length}/{MAX_SUB_CATEGORIES}</span>
          </div>
          <div className="flex gap-2">
            <input
              id="cat-sub"
              type="text"
              placeholder="e.g. Android Phones"
              value={subInput}
              disabled={subs.length >= MAX_SUB_CATEGORIES}
              onChange={(e) => { setSubInput(e.target.value); clearError('sub_category_name') }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSub() } }}
              className={`${inputClass(!!errors.sub_category_name)} disabled:opacity-50`}
            />
            <button
              type="button"
              onClick={addSub}
              disabled={!subInput.trim() || subs.length >= MAX_SUB_CATEGORIES}
              className="shrink-0 flex items-center gap-1.5 px-4 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiPlus size={14} /> Add
            </button>
          </div>
          {fieldError('sub_category_name')}
          {subs.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-3">
              <AnimatePresence>
                {subs.map((s) => (
                  <motion.span key={s} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-lg bg-surface-lighter border border-border text-xs font-medium text-text-secondary"
                  >
                    {s}
                    <button type="button" aria-label={`Remove ${s}`} onClick={() => setSubs(subs.filter((x) => x !== s))}
                      className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-danger/10 hover:text-danger cursor-pointer"
                    ><FiX size={11} /></button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          ) : !errors.sub_category_name && (
            <p className="text-[11px] text-text-muted mt-1.5">Products in this category will be grouped under these.</p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiPlus size={15} />}
            {loading ? 'Creating...' : 'Create Category'}
          </motion.button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover transition-all cursor-pointer disabled:opacity-60"
          >
            <FiRefreshCw size={14} /> Reset
          </button>
        </div>
      </motion.form>
    </div>
  )
}

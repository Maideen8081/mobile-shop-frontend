import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiRefreshCw, FiX, FiImage } from 'react-icons/fi'
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_IMAGE_LABEL = 'JPG, JPEG, PNG, and WebP'

interface CategoryCreateFormProps {
  onSubmit: (data: { name: string; status: boolean; image: File | null; subCategoryName: string }) => void
  loading: boolean
}

interface Errors {
  categoryName?: string
  categoryImage?: string
  subCategoryName?: string
}

export default function CategoryCreateForm({
  onSubmit,
  loading,
}: CategoryCreateFormProps) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const [subName, setSubName] = useState('')

  const [errors, setErrors] = useState<Errors>({})
  const [shake, setShake] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleFileSelect = useCallback((f: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) {
      setFile(null)
      setPreview(null)
      setErrors((prev) => ({ ...prev, categoryImage: `Invalid image format. Accepted: ${ACCEPTED_IMAGE_LABEL}` }))
      return
    }
    setErrors((prev) => ({ ...prev, categoryImage: undefined }))
    setFile(f)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }, [handleFileSelect])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const validate = (): boolean => {
    const errs: Errors = {}
    if (!name.trim()) errs.categoryName = 'Category name is required'
    if (!file) errs.categoryImage = 'Category image is required'
    if (subName.trim().length > 60) errs.subCategoryName = 'Subcategory name is too long'
    setErrors(errs)
    if (Object.keys(errs).length > 0) triggerShake()
    return Object.keys(errs).length === 0
  }

  const handleReset = () => {
    setName(''); setStatus(true); setFile(null); setPreview(null)
    setSubName('')
    setErrors({})
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      name: name.trim(),
      status,
      image: file,
      subCategoryName: subName.trim(),
    })
    handleReset()
  }

  const inputBase =
    'w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm outline-none transition-all duration-150 text-text-primary placeholder-text-label'
  const inputClass = (hasError: boolean) =>
    `${inputBase} ${hasError ? 'border-danger ring-1 ring-danger/20' : 'border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/15'}`

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card p-5 lg:p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Create Category</h3>
          <p className="text-xs text-text-muted mt-0.5">Add a new product category to your store</p>
        </div>
        <motion.button
          type="button"
          onClick={() => setStatus(!status)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer ${status ? 'bg-primary' : 'bg-gray-300'}`}
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm ${status ? 'right-0.5' : 'left-0.5'}`}
          />
        </motion.button>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-5"
        animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {/* Category Name */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Category Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Smartphones"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, categoryName: undefined })) }}
            className={inputClass(!!errors.categoryName)}
          />
          {errors.categoryName && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs mt-1.5 text-danger">{errors.categoryName}</motion.p>
          )}
        </div>

        {/* Category Image */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Category Image <span className="text-danger">*</span>
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center h-44 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
              dragging
                ? 'border-primary/60 bg-primary/5'
                : preview
                  ? 'border-border bg-surface-lighter'
                  : errors.categoryImage
                    ? 'border-danger ring-1 ring-danger/20 bg-surface-lighter'
                    : 'border-border bg-surface-lighter hover:border-primary/40'
            }`}
          >
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-2xl p-2" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-danger/90 flex items-center justify-center hover:bg-danger transition-colors cursor-pointer shadow-md"
                >
                  <FiX size={13} className="text-white" />
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <FiImage size={22} className="text-primary" />
                </div>
                <p className="text-sm text-text-secondary font-medium">Drop image here or click to browse</p>
                <p className="text-xs text-text-muted mt-1">Accepted: {ACCEPTED_IMAGE_LABEL}</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
            className="hidden"
          />
          {errors.categoryImage && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs mt-1.5 text-danger">{errors.categoryImage}</motion.p>
          )}
        </div>

        {/* Subcategory (optional) */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Subcategory <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. iOS Phones (leave empty if none)"
            value={subName}
            onChange={(e) => { setSubName(e.target.value); setErrors((prev) => ({ ...prev, subCategoryName: undefined })) }}
            className={inputClass(!!errors.subCategoryName)}
          />
          {errors.subCategoryName ? (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs mt-1.5 text-danger">{errors.subCategoryName}</motion.p>
          ) : (
            <p className="text-[11px] text-text-muted mt-1.5">The subcategory will be added under this category.</p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#22c55e' }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiPlus size={15} />
            )}
            {loading ? 'Creating...' : 'Create Category'}
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover transition-all cursor-pointer"
          >
            <FiRefreshCw size={14} />
            Reset
          </motion.button>
        </div>
      </motion.form>
    </div>
  )
}

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSave, FiUpload, FiTrash2, FiPlus, FiEdit2, FiCheck, FiAlertCircle, FiLock } from 'react-icons/fi'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import Portal from '../ui/Portal'
import { categoryService, subCategoryService, type Category, type SubCategory } from '../../services/categoryService'
import { apiErrorMessage } from '../../utils/checkout'
import {
  CATEGORY_IMAGE_MAX_MB, IMAGE_ACCEPT, IMAGE_TYPES_LABEL, MAX_SUB_CATEGORIES, NAME_MAX,
  catalogNameError, imageFileError, normalizeName, omitKey, type Errors,
} from '../../utils/catalogValidation'

export interface CategoryEditData {
  name: string
  status: 'active' | 'inactive'
  image: File | null
}

interface EditCategoryModalProps {
  open: boolean
  category: Category | null
  existingNames: string[]
  onClose: () => void
  /** Resolves to field errors from the server, or null on success. */
  onSave: (data: CategoryEditData) => Promise<Errors | null>
  /** Called after any sub category change so the list and stats refresh. */
  onSubsChanged: () => void
  loading?: boolean
}

export default function EditCategoryModal(props: EditCategoryModalProps) {
  useLockBodyScroll(props.open)
  if (!props.open || !props.category) return null
  // Keyed so every open starts from the category's current values.
  return <Portal><EditCategoryDialog key={props.category.id} {...props} category={props.category} /></Portal>
}

function EditCategoryDialog({ category, existingNames, onClose, onSave, onSubsChanged, loading }: EditCategoryModalProps & { category: Category }) {
  const [name, setName] = useState(category.name)
  const [status, setStatus] = useState(category.status === 'active')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [subs, setSubs] = useState<SubCategory[]>(category.subcategories)
  const [fetching, setFetching] = useState(true)
  const [busySubId, setBusySubId] = useState<number | 'new' | null>(null)
  const [editingSubId, setEditingSubId] = useState<number | null>(null)
  const [editingSubName, setEditingSubName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [newSubName, setNewSubName] = useState('')
  const [showAddSub, setShowAddSub] = useState(false)
  const [subError, setSubError] = useState('')

  // Fresh sub categories with product counts.
  useEffect(() => {
    let cancelled = false
    categoryService.getById(category.id)
      .then((full) => { if (!cancelled) setSubs(full.subcategories) })
      .catch(() => { /* keep the list we already have */ })
      .finally(() => { if (!cancelled) setFetching(false) })
    return () => { cancelled = true }
  }, [category.id])

  const imagePreview = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile])
  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview) }, [imagePreview])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onClose])

  const currentImage = imagePreview || category.image
  const clearError = (key: string) => setErrors((prev) => omitKey(prev, key))

  const nameError = (value: string) => {
    const err = catalogNameError(value, 'Category name')
    if (err) return err
    const lower = normalizeName(value).toLowerCase()
    if (existingNames.some((n) => n.toLowerCase() === lower && n.toLowerCase() !== category.name.toLowerCase())) {
      return 'A category with this name already exists'
    }
    return undefined
  }

  const subNameError = (value: string, exceptId?: number) => {
    const err = catalogNameError(value, 'Sub category name')
    if (err) return err
    const lower = normalizeName(value).toLowerCase()
    if (subs.some((s) => s.id !== exceptId && s.name.toLowerCase() === lower)) return `"${normalizeName(value)}" already exists in ${category.name}`
    return ''
  }

  const handleSave = async () => {
    const err = nameError(name)
    if (err) { setErrors({ category_name: err }); return }
    const serverErrors = await onSave({ name: normalizeName(name), status: status ? 'active' : 'inactive', image: imageFile })
    if (serverErrors) setErrors(serverErrors)
  }

  const handleImageSelect = (f: File) => {
    const err = imageFileError(f, CATEGORY_IMAGE_MAX_MB)
    if (err) { setErrors((prev) => ({ ...prev, category_image: err })); return }
    clearError('category_image')
    setImageFile(f)
  }

  const runSubAction = async (id: number | 'new', action: () => Promise<void>) => {
    setBusySubId(id)
    setSubError('')
    try {
      await action()
      onSubsChanged()
    } catch (err) {
      setSubError(apiErrorMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setBusySubId(null)
    }
  }

  const handleAddSub = () => {
    const err = subNameError(newSubName)
      || (subs.length >= MAX_SUB_CATEGORIES ? `At most ${MAX_SUB_CATEGORIES} sub categories per category` : '')
    if (err) { setSubError(err); return }
    runSubAction('new', async () => {
      const created = await subCategoryService.create({ parentId: category.id, name: normalizeName(newSubName), status: true })
      setSubs((prev) => [...prev, created])
      setNewSubName('')
      setShowAddSub(false)
    })
  }

  const handleRenameSub = (sub: SubCategory) => {
    const err = subNameError(editingSubName, sub.id)
    if (err) { setSubError(err); return }
    if (normalizeName(editingSubName) === sub.name) { setEditingSubId(null); return }
    runSubAction(sub.id, async () => {
      const updated = await subCategoryService.update(sub.id, { name: normalizeName(editingSubName) })
      setSubs((prev) => prev.map((s) => (s.id === sub.id ? { ...s, ...updated } : s)))
      setEditingSubId(null)
    })
  }

  const handleDeleteSub = (sub: SubCategory) => runSubAction(sub.id, async () => {
    await subCategoryService.delete(sub.id)
    setSubs((prev) => prev.filter((s) => s.id !== sub.id))
    setConfirmDeleteId(null)
  })

  const nameLength = normalizeName(name).length
  const atLimit = subs.length >= MAX_SUB_CATEGORIES

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 sm:items-center bg-black/50 backdrop-blur-sm overflow-y-auto"
        onClick={() => { if (!loading) onClose() }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-category-title"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-white rounded-2xl border border-border shadow-[0_12px_40px_rgba(15,23,42,0.14)] overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-surface-lighter border border-border flex items-center justify-center overflow-hidden shrink-0">
                {currentImage
                  ? <img src={currentImage} alt="" className="w-full h-full object-cover" />
                  : <span className="text-lg font-bold text-text-muted">{category.name.charAt(0).toUpperCase()}</span>}
              </div>
              <div>
                <h3 id="edit-category-title" className="text-base font-semibold text-text-primary">Edit Category</h3>
                <p className="text-xs text-text-muted">
                  {category.products} product{category.products === 1 ? '' : 's'} · {subs.length} sub categor{subs.length === 1 ? 'y' : 'ies'}
                </p>
              </div>
            </div>
            <button onClick={onClose} disabled={loading} aria-label="Close" className="w-8 h-8 rounded-lg bg-surface-lighter flex items-center justify-center hover:bg-surface-hover transition-colors cursor-pointer">
              <FiX size={15} className="text-text-muted" />
            </button>
          </div>

          <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="edit-cat-name" className="text-sm font-medium text-text-secondary">Category Name <span className="text-danger">*</span></label>
                <span className={`text-[11px] ${nameLength > NAME_MAX ? 'text-danger' : 'text-text-muted'}`}>{nameLength}/{NAME_MAX}</span>
              </div>
              <input
                id="edit-cat-name"
                type="text"
                value={name}
                maxLength={NAME_MAX + 20}
                onChange={(e) => { setName(e.target.value); clearError('category_name') }}
                aria-invalid={!!errors.category_name}
                className={`w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary outline-none transition-all ${
                  errors.category_name ? 'border-danger ring-1 ring-danger/20' : 'border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
                }`}
              />
              {errors.category_name && <p role="alert" className="text-xs text-danger mt-1.5">{errors.category_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Category Image</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-surface-lighter border border-border overflow-hidden shrink-0">
                  {currentImage
                    ? <img src={currentImage} alt="Category" className="w-full h-full object-contain" />
                    : <div className="flex items-center justify-center h-full"><FiUpload size={20} className="text-text-muted" /></div>}
                </div>
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
                    ><FiUpload size={12} /> {currentImage ? 'Replace Image' : 'Upload Image'}</button>
                    {imageFile && (
                      <button type="button" onClick={() => setImageFile(null)}
                        className="px-3 py-2 rounded-lg bg-white border border-border text-text-muted text-xs font-medium hover:bg-surface-hover cursor-pointer"
                      >Undo</button>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted">{IMAGE_TYPES_LABEL}, up to {CATEGORY_IMAGE_MAX_MB}MB</p>
                </div>
              </div>
              {errors.category_image && <p role="alert" className="text-xs text-danger mt-1.5">{errors.category_image}</p>}
              <input ref={fileInputRef} type="file" accept={IMAGE_ACCEPT} className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); e.target.value = '' }}
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text-secondary">Status</span>
              <button type="button" role="switch" aria-checked={status} aria-label="Category active" onClick={() => setStatus(!status)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer ${status ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm ${status ? 'right-0.5' : 'left-0.5'}`}
                />
              </button>
              <span className="text-xs text-text-muted">
                {status ? 'Active' : 'Inactive — hidden from shoppers along with its products'}
              </span>
            </div>

            <div className="border-t border-border" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-text-secondary">
                  Sub Categories <span className="text-text-muted font-normal">({subs.length}/{MAX_SUB_CATEGORIES})</span>
                </span>
                <button type="button" onClick={() => { setShowAddSub(!showAddSub); setSubError('') }} disabled={atLimit}
                  title={atLimit ? `At most ${MAX_SUB_CATEGORIES} sub categories per category` : undefined}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                ><FiPlus size={11} /> Add Sub</button>
              </div>

              <AnimatePresence>
                {subError && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert"
                    className="flex items-start gap-1.5 text-xs text-danger mb-3 px-3 py-2 rounded-lg bg-danger/5 border border-danger/15"
                  ><FiAlertCircle size={12} className="mt-0.5 shrink-0" />{subError}</motion.p>
                )}
              </AnimatePresence>

              {showAddSub && !atLimit && (
                <div className="mb-3 p-3 rounded-xl bg-surface-lighter border border-border flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Sub category name"
                    value={newSubName}
                    maxLength={NAME_MAX + 20}
                    onChange={(e) => { setNewSubName(e.target.value); setSubError('') }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSub(); if (e.key === 'Escape') { e.stopPropagation(); setShowAddSub(false) } }}
                    className="flex-1 h-9 px-3 rounded-lg bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                  />
                  <button type="button" onClick={handleAddSub} disabled={busySubId === 'new' || !newSubName.trim()}
                    className="flex items-center gap-1.5 px-3 rounded-lg bg-primary text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {busySubId === 'new' ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiPlus size={11} />} Add
                  </button>
                </div>
              )}

              {fetching && subs.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : subs.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4 bg-surface-lighter rounded-xl border border-dashed border-border">No sub categories yet</p>
              ) : (
                <ul className="space-y-1.5">
                  {subs.map((sub) => {
                    const busy = busySubId === sub.id
                    const inUse = sub.products > 0
                    return (
                      <li key={sub.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-lighter border border-border">
                        {editingSubId === sub.id ? (
                          <>
                            <input type="text" value={editingSubName} autoFocus maxLength={NAME_MAX + 20}
                              onChange={(e) => { setEditingSubName(e.target.value); setSubError('') }}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSub(sub); if (e.key === 'Escape') { e.stopPropagation(); setEditingSubId(null) } }}
                              aria-label="Sub category name"
                              className="flex-1 h-8 px-3 rounded-lg bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                            />
                            <button onClick={() => handleRenameSub(sub)} disabled={busy} aria-label="Save name"
                              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer disabled:opacity-50"
                            ><FiCheck size={12} /></button>
                            <button onClick={() => setEditingSubId(null)} aria-label="Cancel rename"
                              className="p-1.5 rounded-lg bg-white border border-border text-text-muted hover:bg-surface-hover cursor-pointer"
                            ><FiX size={12} /></button>
                          </>
                        ) : confirmDeleteId === sub.id ? (
                          <>
                            <span className="flex-1 text-xs text-text-secondary">Delete <strong>{sub.name}</strong>?</span>
                            <button onClick={() => handleDeleteSub(sub)} disabled={busy}
                              className="px-2.5 py-1 rounded-lg bg-danger text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                            >{busy ? 'Deleting…' : 'Delete'}</button>
                            <button onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-border text-text-muted text-xs cursor-pointer"
                            >Cancel</button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm text-text-secondary truncate">{sub.name}</span>
                            <span className="text-[10px] text-text-muted bg-white px-1.5 py-0.5 rounded border border-border shrink-0">
                              {sub.products} product{sub.products === 1 ? '' : 's'}
                            </span>
                            <button onClick={() => { setEditingSubId(sub.id); setEditingSubName(sub.name); setConfirmDeleteId(null); setSubError('') }}
                              aria-label={`Rename ${sub.name}`}
                              className="p-1.5 rounded-lg bg-white border border-border text-text-muted hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
                            ><FiEdit2 size={12} /></button>
                            <button
                              onClick={() => { setConfirmDeleteId(sub.id); setEditingSubId(null); setSubError('') }}
                              disabled={inUse}
                              aria-label={`Delete ${sub.name}`}
                              title={inUse ? 'Move its products to another sub category first' : undefined}
                              className="p-1.5 rounded-lg bg-white border border-border text-text-muted hover:text-danger hover:border-danger/40 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >{inUse ? <FiLock size={12} /> : <FiTrash2 size={12} />}</button>
                          </>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white border-t border-border px-6 py-4 flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave size={14} />}
              {loading ? 'Saving...' : 'Save Changes'}
            </motion.button>
            <button onClick={onClose} disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover transition-colors cursor-pointer"
            >Cancel</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

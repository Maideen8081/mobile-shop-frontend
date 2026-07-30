import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSave, FiUpload, FiTrash2, FiPlus, FiEdit2, FiCheck } from 'react-icons/fi'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { categoryService, subCategoryService, type Category, type SubCategory } from '../../services/categoryService'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_IMAGE_LABEL = 'JPG, JPEG, PNG, and WebP'

interface EditCategoryModalProps {
  open: boolean
  category: Category | null
  onClose: () => void
  onSave: (data: { name: string; status: 'active' | 'inactive'; image?: File | null; imageRemoved?: boolean }) => void
  loading?: boolean
}

export default function EditCategoryModal({ open, category, onClose, onSave, loading }: EditCategoryModalProps) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [subs, setSubs] = useState<SubCategory[]>([])
  const [editingSubId, setEditingSubId] = useState<number | null>(null)
  const [editingSubName, setEditingSubName] = useState('')
  const [submittingSub, setSubmittingSub] = useState(false)

  const [newSubName, setNewSubName] = useState('')
  const [newSubStatus, setNewSubStatus] = useState(true)
  const [showAddSub, setShowAddSub] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [addSubError, setAddSubError] = useState('')

  // Fetch full category data (with subcategories) when modal opens
  useEffect(() => {
    if (open && category) {
      setFetching(true)
      setName(category.name)
      setStatus(category.status === 'active')
      setImageFile(null)
      setImagePreview(null)
      setImageRemoved(false)
      setImageError('')
      setEditingSubId(null)
      setNewSubName('')
      setNewSubStatus(true)
      setShowAddSub(false)
      setAddSubError('')

      if (category.subcategories.length > 0) {
        setSubs([...category.subcategories])
        setFetching(false)
      } else {
        setSubs([])
        categoryService.getById(category.id).then((full) => {
          setSubs([...full.subcategories])
        }).catch(() => {
          // Fallback: keep empty
        }).finally(() => setFetching(false))
      }
    }
  }, [open, category])

  useEffect(() => {
    if (!imageFile) return
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    setImageRemoved(false)
    setImageError('')
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  useLockBodyScroll(open)
  if (!open || !category) return null

  const currentImage = imageRemoved ? null : (imagePreview || category.image)

  const handleSave = () => {
    onSave({
      name,
      status: status ? 'active' : 'inactive',
      image: imageFile,
      imageRemoved,
    })
  }

  const handleImageSelect = (f: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) {
      setImageError(`Invalid image format. Accepted: ${ACCEPTED_IMAGE_LABEL}`)
      return
    }
    setImageError('')
    setImageFile(f)
  }

  const handleDeleteSub = async (subId: number) => {
    setSubmittingSub(true)
    try {
      await subCategoryService.delete(subId)
      setSubs((prev) => prev.filter((s) => s.id !== subId))
    } catch {
      console.error('Failed to delete sub category')
    } finally {
      setSubmittingSub(false)
    }
  }

  const handleUpdateSubName = async (subId: number) => {
    if (!editingSubName.trim()) return
    setSubmittingSub(true)
    try {
      await subCategoryService.update(subId, { name: editingSubName.trim() })
      setSubs((prev) => prev.map((s) => s.id === subId ? { ...s, name: editingSubName.trim() } : s))
      setEditingSubId(null)
    } catch {
      console.error('Failed to update sub category')
    } finally {
      setSubmittingSub(false)
    }
  }

  const handleAddSub = async () => {
    if (!newSubName.trim()) return
    if (subs.length >= 5) {
      setAddSubError('Maximum 5 subcategories allowed per category')
      return
    }
    setAddSubError('')
    setSubmittingSub(true)
    try {
      const res = await subCategoryService.create({
        parentId: category.id,
        name: newSubName.trim(),
        status: newSubStatus,
      })
      const newSub: SubCategory = {
        id: res?.data?.id ?? Date.now(),
        name: newSubName.trim(),
        products: 0,
      }
      setSubs((prev) => [...prev, newSub])
      setNewSubName('')
      setNewSubStatus(true)
      setShowAddSub(false)
    } catch {
      console.error('Failed to add sub category')
    } finally {
      setSubmittingSub(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 sm:items-center bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-2xl border border-border shadow-[0_12px_40px_rgba(15,23,42,0.14)] overflow-hidden"
          >
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-surface-lighter border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {currentImage ? (
                      <img src={currentImage} alt={category.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-lg font-bold text-text-muted">{category.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">Edit Category</h3>
                    <p className="text-xs text-text-muted">Manage category and subcategories</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-lighter flex items-center justify-center hover:bg-surface-hover transition-colors cursor-pointer">
                  <FiX size={15} className="text-text-muted" />
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto space-y-5">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Category Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-surface-lighter border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 transition-all"
                />
              </div>

              {/* Category Image */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Category Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-surface-lighter border border-border overflow-hidden shrink-0">
                    {currentImage ? (
                      <img src={currentImage} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <FiUpload size={20} className="text-text-muted" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <FiUpload size={12} />
                      Replace Image
                    </button>
                    {currentImage && (
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); setImageRemoved(true) }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/10 text-danger text-xs font-semibold hover:bg-danger/20 transition-colors cursor-pointer"
                      >
                        <FiTrash2 size={12} />
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>
                {imageError && <p className="text-xs text-danger mt-1.5">{imageError}</p>}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f) }}
                  className="hidden"
                />
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-text-secondary">Status</label>
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
                <span className="text-xs text-text-muted">{status ? 'Active' : 'Inactive'}</span>
              </div>

              <div className="border-t border-border" />

              {/* Sub Categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-text-secondary">
                    Subcategories <span className="text-text-muted font-normal">({subs.length} / 5)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (subs.length >= 5) {
                        setAddSubError('Maximum 5 subcategories allowed per category')
                        return
                      }
                      setAddSubError('')
                      setShowAddSub(!showAddSub)
                    }}
                    disabled={subs.length >= 5}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiPlus size={11} />
                    Add Sub
                  </button>
                </div>

                {addSubError && (
                  <p className="text-[11px] text-danger mb-2">{addSubError}</p>
                )}

                {fetching && (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {showAddSub && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 p-3 rounded-xl bg-surface-lighter border border-border space-y-3"
                  >
                    <p className="text-[11px] text-text-muted font-medium">
                      Parent: <span className="text-text-secondary">{category.name}</span>
                    </p>
                    <input
                      type="text"
                      placeholder="Subcategory name"
                      value={newSubName}
                      onChange={(e) => { setNewSubName(e.target.value); setAddSubError('') }}
                      className="w-full h-9 px-3 rounded-lg bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 transition-all"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddSub}
                        disabled={submittingSub || !newSubName.trim() || subs.length >= 5}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {submittingSub ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FiPlus size={11} />
                        )}
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddSub(false); setNewSubName(''); setAddSubError('') }}
                        className="px-3 py-1.5 rounded-lg bg-white border border-border text-text-muted text-xs font-medium hover:bg-surface-hover transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {!fetching && subs.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4 bg-surface-lighter rounded-xl border border-dashed border-border">
                    No subcategories yet
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {subs.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-lighter border border-border group"
                      >
                        {editingSubId === sub.id ? (
                          <>
                            <input
                              type="text"
                              value={editingSubName}
                              onChange={(e) => setEditingSubName(e.target.value)}
                              className="flex-1 h-8 px-3 rounded-lg bg-white border border-border text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 transition-all"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateSubName(sub.id)}
                              disabled={submittingSub}
                              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <FiCheck size={12} />
                            </button>
                            <button
                              onClick={() => setEditingSubId(null)}
                              className="p-1.5 rounded-lg bg-white border border-border text-text-muted hover:bg-surface-hover transition-colors cursor-pointer"
                            >
                              <FiX size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-sm text-text-secondary">{sub.name}</span>
                              <span className="text-[10px] text-text-muted bg-white px-1.5 py-0.5 rounded border border-border">
                                {sub.products} products
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => { setEditingSubId(sub.id); setEditingSubName(sub.name) }}
                                className="p-1.5 rounded-lg bg-white border border-border text-text-muted hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
                              >
                                <FiEdit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteSub(sub.id)}
                                disabled={submittingSub}
                                className="p-1.5 rounded-lg bg-white border border-border text-text-muted hover:text-danger hover:border-danger/40 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 bg-white border-t border-border px-6 py-4 flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#CB202D' }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSave size={14} />
                )}
                {loading ? 'Saving...' : 'Save Changes'}
              </motion.button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

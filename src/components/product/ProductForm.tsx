import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiRefreshCw, FiSave, FiAlertCircle, FiImage, FiX, FiUploadCloud } from 'react-icons/fi'
import GlassCard from '../dashboard/GlassCard'
import FeatureInputList from './FeatureInputList'
import CareInstructionList from './CareInstructionList'
import VariantCard from './VariantCard'
import PreviewCard from './PreviewCard'
import SearchableDropdown from './SearchableDropdown'
import CreatableSelect from '../ui/CreatableSelect'
import { brands } from '../../data/productData'
import type { Product } from '../../data/productData'
import type { SubCategory } from '../../services/categoryService'
import {
  IMAGE_ACCEPT, IMAGE_TYPES_LABEL, PRODUCT, PRODUCT_IMAGE_MAX_MB,
  duplicateVariantIndexes, imageFileError, omitKey, validateProduct, validateVariant, type Errors,
} from '../../utils/catalogValidation'
import {
  buildProductFormData, emptyProductDraft, fileDraft, newVariantDraft, nextKey, productToDraft, releaseImage,
  type ProductDraft, type VariantDraft,
} from './productDraft'

// Server field names → form field names, so API errors land next to the right input.
const SERVER_FIELDS: Record<string, string> = {
  product_name: 'name', brand: 'brand', model_number: 'model', category: 'category', sub_category: 'subcategory',
  description: 'description', features: 'features', care_instructions: 'careInstructions',
  common_image: 'cover', remove_common_image: 'cover', variants: 'variants', variant_images: 'variants',
}

interface ProductFormProps {
  mode: 'create' | 'edit'
  initial?: Product | null
  categoryOptions: { id: number; name: string }[]
  subcategoryOptions: SubCategory[]
  /** Resolves to server field errors, or null on success. */
  onSubmit: (formData: FormData) => Promise<Errors | null>
  onCancel?: () => void
  loading?: boolean
  /** "drawer" drops the preview column for the narrow edit panel. */
  layout?: 'page' | 'drawer'
}

export default function ProductForm({
  mode, initial, categoryOptions, subcategoryOptions, onSubmit, onCancel, loading, layout = 'page',
}: ProductFormProps) {
  const [draft, setDraft] = useState<ProductDraft>(() => (initial ? productToDraft(initial) : emptyProductDraft()))
  const [errors, setErrors] = useState<Errors>({})
  const [variantErrors, setVariantErrors] = useState<Record<string, Errors>>({})
  const [shakeKey, setShakeKey] = useState(0)
  const [previewIdx, setPreviewIdx] = useState(0)
  const [extraBrands, setExtraBrands] = useState<string[]>([])
  const coverRef = useRef<HTMLInputElement>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K], errorKey: string = key) => {
    setDraft((d) => ({ ...d, [key]: value }))
    if (errors[errorKey]) setErrors((e) => omitKey(e, errorKey))
  }

  // Category options: active categories, plus the product's current one if it was deactivated since.
  const categories = useMemo(() => {
    const list = [...categoryOptions]
    if (initial?.categoryId && !list.some((c) => c.id === initial.categoryId)) {
      list.unshift({ id: initial.categoryId, name: `${initial.category} (inactive)` })
    }
    return list
  }, [categoryOptions, initial])
  const category = categories.find((c) => c.id === draft.categoryId)
  const subs = subcategoryOptions.filter((s) => s.parentId === draft.categoryId)
  const sub = subs.find((s) => s.id === draft.subcategoryId)
  const brandOptions = useMemo(
    () => Array.from(new Set([...brands, ...extraBrands, ...(draft.brand ? [draft.brand] : [])])),
    [extraBrands, draft.brand],
  )

  const updateVariant = (key: string, v: VariantDraft) => {
    setDraft((d) => ({ ...d, variants: d.variants.map((x) => (x.key === key ? v : x)) }))
    if (variantErrors[key]) setVariantErrors((ve) => { const next = { ...ve }; delete next[key]; return next })
  }
  const addVariant = () => setDraft((d) => ({ ...d, variants: [...d.variants, newVariantDraft()] }))
  const removeVariant = (key: string) => setDraft((d) => {
    d.variants.find((v) => v.key === key)?.images.forEach(releaseImage)
    return { ...d, variants: d.variants.filter((v) => v.key !== key) }
  })
  // Images aren't copied: each saved image belongs to exactly one variant.
  const duplicateVariant = (key: string) => setDraft((d) => {
    const src = d.variants.find((v) => v.key === key)
    if (!src) return d
    const copy: VariantDraft = { ...src, key: nextKey('v'), dbId: undefined, name: `${src.name} (copy)`, images: [] }
    return { ...d, variants: [...d.variants, copy] }
  })

  const pickCover = (f: File) => {
    const err = imageFileError(f, PRODUCT_IMAGE_MAX_MB)
    if (err) { setErrors((e) => ({ ...e, cover: err })); return }
    if (draft.cover) releaseImage(draft.cover)
    setDraft((d) => ({ ...d, cover: fileDraft(f), coverRemoved: false }))
    setErrors((e) => omitKey(e, 'cover'))
  }
  const removeCover = () => {
    if (draft.cover) releaseImage(draft.cover)
    setDraft((d) => ({ ...d, cover: null, coverRemoved: true }))
  }

  const validate = (): boolean => {
    const errs = validateProduct({
      name: draft.name, brand: draft.brand, model: draft.model,
      category: draft.categoryId ? String(draft.categoryId) : '',
      subcategory: draft.subcategoryId ? String(draft.subcategoryId) : '',
      categoryHasSubs: subs.length > 0,
      description: draft.description, features: draft.features, careInstructions: draft.careInstructions,
    })
    if (draft.variants.length === 0) errs.variants = 'Add at least one variant'
    else if (draft.variants.length > PRODUCT.maxVariants) errs.variants = `At most ${PRODUCT.maxVariants} variants`

    const vErrs: Record<string, Errors> = {}
    draft.variants.forEach((v) => {
      const e = validateVariant({ ...v, imageCount: v.images.length })
      if (Object.keys(e).length) vErrs[v.key] = e
    })
    duplicateVariantIndexes(draft.variants).forEach((i) => {
      const key = draft.variants[i].key
      vErrs[key] = { ...vErrs[key], color: 'Another variant already has this color, RAM and storage' }
    })

    setErrors(errs)
    setVariantErrors(vErrs)
    const ok = !Object.keys(errs).length && !Object.keys(vErrs).length
    if (!ok) {
      setShakeKey((k) => k + 1)
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    return ok
  }

  const handleSave = async () => {
    if (loading || !validate()) return
    const serverErrors = await onSubmit(buildProductFormData(draft, mode === 'edit'))
    if (serverErrors) {
      const mapped: Errors = {}
      for (const [k, msg] of Object.entries(serverErrors)) {
        const field = SERVER_FIELDS[k] || 'form'
        mapped[field] = mapped[field] ? `${mapped[field]} · ${msg}` : msg
      }
      setErrors(mapped)
      setShakeKey((k) => k + 1)
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (mode === 'create') {
      reset()
    }
  }

  const reset = () => {
    draft.variants.forEach((v) => v.images.forEach(releaseImage))
    if (draft.cover) releaseImage(draft.cover)
    setDraft(initial ? productToDraft(initial) : emptyProductDraft())
    setErrors({}); setVariantErrors({}); setPreviewIdx(0)
  }

  const errorCount = Object.keys(errors).length + Object.keys(variantErrors).length
  const totalStock = draft.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
  const prices = draft.variants.map((v) => v.discountPrice || v.price).filter((p) => p > 0)
  const previewVariant = draft.variants[previewIdx] || draft.variants[0]

  const inputCls = (err?: string) =>
    `w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-primary/50 ${err ? 'border-danger' : 'border-border'}`
  const fieldError = (k: string) => (errors[k] ? (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="text-xs text-danger mt-1 flex items-start gap-1">
      <FiAlertCircle size={11} className="mt-0.5 shrink-0" /> {errors[k]}
    </motion.p>
  ) : null)
  const toggle = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
        value ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-lighter border-border text-text-muted hover:border-primary/20'
      }`}
    >
      <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${value ? 'border-primary bg-primary' : 'border-border'}`}>
        {value && <span className="w-1.5 h-1.5 rounded-sm bg-white" />}
      </span>
      {label}
    </button>
  )

  const form = (
    <div className="space-y-6">
      <div ref={topRef} className="scroll-mt-24" />
      <AnimatePresence>
        {errorCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert"
            className="flex items-start gap-2 px-4 py-3 rounded-xl bg-danger/5 border border-danger/20 text-sm text-danger"
          >
            <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Please fix the highlighted fields before saving.</p>
              {errors.form && <p className="text-xs mt-0.5">{errors.form}</p>}
              {errors.variants && <p className="text-xs mt-0.5">{errors.variants}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section>
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block md:col-span-2">
            <span className="flex justify-between text-xs font-semibold text-text-secondary mb-1.5">
              <span>Product Name <span className="text-danger">*</span></span>
              <span className="font-normal text-text-muted">{draft.name.trim().length}/{PRODUCT.nameMax}</span>
            </span>
            <input type="text" placeholder="e.g. iPhone 15 Pro Max" value={draft.name} maxLength={PRODUCT.nameMax + 20}
              onChange={(e) => set('name', e.target.value)} className={inputCls(errors.name)} aria-invalid={!!errors.name} />
            {fieldError('name')}
          </label>
          <div>
            <CreatableSelect label="Brand" options={brandOptions} value={draft.brand}
              onChange={(v) => set('brand', v)}
              onCreate={(v) => { const b = v.trim(); setExtraBrands((x) => [...x, b]); set('brand', b) }}
              placeholder="Select or type a brand" error={errors.brand} required />
          </div>
          <label className="block">
            <span className="block text-xs font-semibold text-text-secondary mb-1.5">Model Number <span className="text-danger">*</span></span>
            <input type="text" placeholder="e.g. A2849" value={draft.model} maxLength={PRODUCT.modelMax}
              onChange={(e) => set('model', e.target.value)} className={inputCls(errors.model)} aria-invalid={!!errors.model} />
            {fieldError('model')}
          </label>
          <div>
            <SearchableDropdown label="Category" options={categories.map((c) => c.name)} value={category?.name || ''}
              onChange={(name) => {
                const id = categories.find((c) => c.name === name)?.id ?? null
                setDraft((d) => ({ ...d, categoryId: id, subcategoryId: id === d.categoryId ? d.subcategoryId : null }))
                setErrors((e) => omitKey(e, 'category', 'subcategory'))
              }}
              placeholder={categories.length ? 'Select Category' : 'No active categories'} error={errors.category} required />
          </div>
          <div>
            {draft.categoryId && subs.length === 0 ? (
              <div>
                <span className="block text-xs font-semibold text-text-secondary mb-1.5">Sub Category</span>
                <p className="h-11 px-4 flex items-center rounded-xl bg-surface-lighter border border-dashed border-border text-xs text-text-muted">
                  {category?.name} has no sub categories
                </p>
              </div>
            ) : (
              <SearchableDropdown label="Sub Category" options={subs.map((s) => s.name)} value={sub?.name || ''}
                onChange={(name) => set('subcategoryId', subs.find((s) => s.name === name)?.id ?? null, 'subcategory')}
                placeholder={draft.categoryId ? 'Select Sub Category' : 'Select a category first'} error={errors.subcategory} required={subs.length > 0} />
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-border pt-5">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Cover Image <span className="normal-case font-normal tracking-normal">(optional — used on listing cards)</span></h4>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-xl bg-surface-lighter border border-border overflow-hidden shrink-0 flex items-center justify-center">
            {draft.cover ? <img src={draft.cover.src} alt="Cover" className="w-full h-full object-contain" /> : <FiImage size={22} className="text-text-muted" />}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <button type="button" onClick={() => coverRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 cursor-pointer"
              ><FiUploadCloud size={12} /> {draft.cover ? 'Replace' : 'Upload'}</button>
              {draft.cover && (
                <button type="button" onClick={removeCover}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/10 text-danger text-xs font-semibold hover:bg-danger/20 cursor-pointer"
                ><FiX size={12} /> Remove</button>
              )}
            </div>
            <p className="text-[11px] text-text-muted">{IMAGE_TYPES_LABEL}, up to {PRODUCT_IMAGE_MAX_MB}MB. Without one, the first variant image is used.</p>
          </div>
          <input ref={coverRef} type="file" accept={IMAGE_ACCEPT} className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) pickCover(f); e.target.value = '' }} />
        </div>
        {fieldError('cover')}
      </section>

      <section className="border-t border-border pt-5">
        <label className="block">
          <span className="flex justify-between text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
            <span>Description</span>
            <span className="font-normal normal-case tracking-normal">{draft.description.trim().length}/{PRODUCT.descriptionMax}</span>
          </span>
          <textarea rows={4} placeholder="Detailed product description..." value={draft.description} maxLength={PRODUCT.descriptionMax + 100}
            onChange={(e) => set('description', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl bg-surface-lighter border text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-primary/50 resize-y ${errors.description ? 'border-danger' : 'border-border'}`} />
        </label>
        {fieldError('description')}
      </section>

      <section className="border-t border-border pt-5">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Visibility & Tags</h4>
        <div className="flex flex-wrap gap-2">
          {toggle(draft.published ? '● Published' : '○ Hidden from shop', draft.published, (v) => set('published', v))}
          {toggle('Trending', draft.trending, (v) => set('trending', v))}
          {toggle('New arrival', draft.newArrival, (v) => set('newArrival', v))}
          {toggle('Best selling', draft.bestSelling, (v) => set('bestSelling', v))}
          {toggle('Featured', draft.featured, (v) => set('featured', v))}
          {toggle('Refurbished', draft.refurbished, (v) => set('refurbished', v))}
        </div>
      </section>

      <section className="border-t border-border pt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <FeatureInputList features={draft.features} onChange={(f) => set('features', f)} label="Features"
          maxItems={PRODUCT.maxFeatures} maxLength={PRODUCT.featureMax} error={errors.features} />
        <CareInstructionList instructions={draft.careInstructions} onChange={(c) => set('careInstructions', c)} error={errors.careInstructions} />
      </section>

      <section className="border-t border-border pt-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Variants ({draft.variants.length}/{PRODUCT.maxVariants}) <span className="text-danger">*</span>
            </h4>
            <p className="text-[10px] text-text-muted mt-0.5">Each variant is a unique color + RAM + storage with its own price, stock and images</p>
          </div>
          <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={addVariant}
            disabled={draft.variants.length >= PRODUCT.maxVariants}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
          ><FiPlus size={13} /> Add Variant</motion.button>
        </div>
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {draft.variants.map((v, i) => (
              <VariantCard key={v.key} variant={v} index={i} canDelete={draft.variants.length > 1}
                onChange={(val) => updateVariant(v.key, val)}
                onDelete={() => removeVariant(v.key)}
                onDuplicate={() => duplicateVariant(v.key)}
                errors={variantErrors[v.key]}
              />
            ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  )

  const actions = (
    <div className="flex flex-wrap items-center gap-3">
      <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
      >
        {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave size={15} />}
        {loading ? 'Saving...' : mode === 'create' ? 'Save Product' : 'Save Changes'}
      </motion.button>
      {onCancel && (
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-surface-lighter border border-border text-text-secondary text-sm font-semibold hover:bg-surface-hover cursor-pointer disabled:opacity-50"
        >Cancel</button>
      )}
      <button type="button" onClick={reset} disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-lighter border border-border text-text-muted text-sm font-semibold hover:bg-rose-50 cursor-pointer disabled:opacity-50"
      ><FiRefreshCw size={14} /> {mode === 'create' ? 'Reset' : 'Discard changes'}</button>
    </div>
  )

  if (layout === 'drawer') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6">
          <motion.div key={shakeKey} animate={shakeKey ? { x: [0, -4, 4, -4, 4, 0] } : {}} transition={{ duration: 0.35 }}>{form}</motion.div>
        </div>
        <div className="border-t border-border p-4 bg-bg-card">{actions}</div>
      </div>
    )
  }

  return (
    <motion.div key={shakeKey} animate={shakeKey ? { x: [0, -4, 4, -4, 4, 0] } : {}} transition={{ duration: 0.35 }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-5 lg:p-6">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-text-primary tracking-tight">{mode === 'edit' ? 'Product details' : 'Add New Product'}</h3>
              <p className="text-xs text-text-muted mt-0.5">Fields marked * are required</p>
            </div>
            {form}
            <div className="border-t border-border pt-5 mt-6">{actions}</div>
          </GlassCard>
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Live Preview</h4>
                {draft.variants.length > 1 && (
                  <select value={previewIdx} onChange={(e) => setPreviewIdx(Number(e.target.value))} aria-label="Preview variant"
                    className="text-[10px] px-2 py-1 rounded-lg bg-surface-lighter border border-border text-text-secondary outline-none cursor-pointer"
                  >
                    {draft.variants.map((v, i) => <option key={v.key} value={i}>{v.name || `Variant ${i + 1}`}</option>)}
                  </select>
                )}
              </div>
              <PreviewCard product={{
                name: draft.name, originalPrice: previewVariant?.price || 0, discountPrice: previewVariant?.discountPrice || 0,
                thumbnail: previewVariant?.images[0]?.src || draft.cover?.src || '📱', category: category?.name || '', brand: draft.brand,
                stock: previewVariant?.stock || 0, trending: draft.trending, newArrival: draft.newArrival,
                ram: previewVariant?.ram || '', storage: previewVariant?.storage || '', battery: previewVariant?.battery || 0,
                processor: previewVariant?.processor || '', display: previewVariant?.display || '', camera: previewVariant?.camera || '',
                color: previewVariant?.color || '', images: previewVariant?.images.map((img) => img.src) || [],
              }} />
            </GlassCard>
            <GlassCard className="p-4">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Summary</h4>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between"><dt className="text-text-muted">Variants</dt><dd className="font-semibold text-text-primary">{draft.variants.length}</dd></div>
                <div className="flex justify-between"><dt className="text-text-muted">Total stock</dt><dd className="font-semibold text-text-primary">{totalStock.toLocaleString('en-IN')}</dd></div>
                {prices.length > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Price range</dt>
                    <dd className="font-semibold text-text-primary">
                      ₹{Math.min(...prices).toLocaleString('en-IN')}{Math.max(...prices) > Math.min(...prices) ? ` – ₹${Math.max(...prices).toLocaleString('en-IN')}` : ''}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between"><dt className="text-text-muted">Status</dt><dd className="font-semibold text-text-primary">{draft.published ? 'Published' : 'Hidden'}</dd></div>
              </dl>
            </GlassCard>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

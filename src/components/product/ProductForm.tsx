import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiRefreshCw, FiSave, FiAlertCircle, FiImage, FiUploadCloud, FiX } from 'react-icons/fi'
import GlassCard from '../dashboard/GlassCard'
import FeatureInputList from './FeatureInputList'
import CareInstructionList from './CareInstructionList'
import VariantCard from './VariantCard'
import PreviewCard from './PreviewCard'
import SearchableDropdown from './SearchableDropdown'
import { categories, subcategories, brands } from '../../data/productData'
import type { Variant } from '../../data/productData'

let variantIdCounter = 1
const newVariant = (): Variant => ({
  id: `v${variantIdCounter++}`, name: '', ram: '', storage: '', battery: 0,
  color: '', processor: '', display: '', camera: '',
  price: 0, discountPrice: 0, stock: 0, lowStockAlert: 5, images: [],
})

interface FormErrors {
  [key: string]: string
}

interface ProductFormProps {
  onSubmit?: (formData: FormData) => Promise<void>
  loading?: boolean
  categoryOptions?: { id: number; name: string }[]
  subcategoryOptions?: { id: number; name: string }[]
  categoryNames?: string[]
  subcategoryNames?: string[]
}

function dataURLToBlob(dataURL: string): Blob {
  const arr = dataURL.split(',')
  if (arr.length < 2) return new Blob([])
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const raw = window.atob(arr[1])
  const u8 = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) u8[i] = raw.charCodeAt(i)
  return new Blob([u8], { type: mime })
}

export default function ProductForm({ onSubmit, loading, categoryOptions, subcategoryOptions, categoryNames, subcategoryNames }: ProductFormProps) {
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [description, setDescription] = useState('')
  const [features, setFeatures] = useState<string[]>([])
  const [careInstructions, setCareInstructions] = useState<string[]>([])
  const [variants, setVariants] = useState<Variant[]>([newVariant()])
  const [trending, setTrending] = useState(false)
  const [newArrival, setNewArrival] = useState(false)
  const [bestSelling, setBestSelling] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [refurbished, setRefurbished] = useState(false)
  const [status, setStatus] = useState(true)
  const [errors, setErrors] = useState<FormErrors>({})
  const [variantErrors, setVariantErrors] = useState<Record<string, FormErrors>>({})
  const [shakeKey, setShakeKey] = useState(0)
  const [productImages, setProductImages] = useState<string[]>([])
  const [productImgDragOver, setProductImgDragOver] = useState(false)
  const productImgRef = useRef<HTMLInputElement>(null)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0)

  const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0)
  const minPrice = Math.min(...variants.map((v) => v.discountPrice || v.price || Infinity))
  const maxPrice = Math.max(...variants.map((v) => v.price || 0))
  const effectivePrice = minPrice === Infinity ? 0 : minPrice

  const addVariant = () => setVariants([...variants, newVariant()])
  const updateVariant = (i: number, v: Variant) => {
    const next = [...variants]
    next[i] = v
    setVariants(next)
    const ve = { ...variantErrors }
    delete ve[v.id]
    setVariantErrors(ve)
  }
  const removeVariant = (i: number) => {
    const next = variants.filter((_, idx) => idx !== i)
    setVariants(next)
    if (selectedVariantIdx >= next.length) setSelectedVariantIdx(Math.max(0, next.length - 1))
  }
  const duplicateVariant = (i: number) => {
    const copy = { ...variants[i], id: `v${variantIdCounter++}`, images: [...variants[i].images] }
    setVariants([...variants, copy])
  }

  const handleProductImages = useCallback((files: FileList) => {
    const remaining = 10 - productImages.length
    if (remaining <= 0) return
    const toAdd = Math.min(files.length, remaining)
    for (let i = 0; i < toAdd; i++) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setProductImages((prev) => [...prev, e.target.result as string])
        }
      }
      reader.readAsDataURL(files[i])
    }
  }, [productImages])

  const addProductImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleProductImages(e.target.files)
    e.target.value = ''
  }

  const removeProductImage = (idx: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const validate = (): boolean => {
    const errs: FormErrors = {}
    const vErrs: Record<string, FormErrors> = {}

    if (!name.trim()) errs.name = 'Product name is required'
    if (!brand) errs.brand = 'Please select a brand'
    if (!model.trim()) errs.model = 'Model number is required'
    if (!category) errs.category = 'Please select a category'
    if (!subcategory) errs.subcategory = 'Please select a subcategory'

    variants.forEach((v) => {
      const ve: FormErrors = {}
      if (!v.name.trim()) ve.name = 'Variant name is required'
      if (!v.color.trim()) ve.color = 'Color is required'
      if (!v.ram) ve.ram = 'RAM size is required'
      if (!v.storage) ve.storage = 'Storage size is required'
      if (!v.battery || v.battery <= 0) ve.battery = 'Battery capacity is required'
      if (!v.processor.trim()) ve.processor = 'Processor is required'
      if (!v.display.trim()) ve.display = 'Display size is required'
      if (!v.camera.trim()) ve.camera = 'Camera details is required'
      if (!v.price || v.price <= 0) ve.price = 'Price must be greater than 0'
      if (v.images.length === 0) ve.images = 'At least one variant image required'
      if (Object.keys(ve).length > 0) vErrs[v.id] = ve
    })

    if (variants.length === 0) errs.variants = 'At least one variant is required'

    setErrors(errs)
    setVariantErrors(vErrs)
    if (Object.keys(errs).length > 0 || Object.keys(vErrs).length > 0) setShakeKey((k) => k + 1)

    return Object.keys(errs).length === 0 && Object.keys(vErrs).length === 0
  }

  const buildFormData = useCallback((): FormData => {
    const fd = new FormData()
    fd.append('product_name', name.trim())
    fd.append('brand', brand)
    fd.append('model_number', model.trim())

    const catMap = new Map((categoryOptions || []).map((c) => [c.name, c.id]))
    const subMap = new Map((subcategoryOptions || []).map((s) => [s.name, s.id]))
    fd.append('category', String(catMap.get(category) ?? category))
    fd.append('sub_category', String(subMap.get(subcategory) ?? subcategory))

    fd.append('description', description)
    fd.append('is_published', status ? 'true' : 'false')
    fd.append('is_trending', String(trending))
    fd.append('is_new_arrival', String(newArrival))
    fd.append('is_best_selling', String(bestSelling))
    fd.append('is_featured', String(featured))
    fd.append('is_refurbished', String(refurbished))

    fd.append('features', JSON.stringify(
      features.filter(Boolean).map((f) => ({ feature_text: f }))
    ))

    fd.append('care_instructions', JSON.stringify(
      careInstructions.filter(Boolean).map((c) => ({ instruction_text: c }))
    ))

    const variantPayload = variants.map((v) => ({
      variant_name: v.name,
      color: v.color,
      ram_size: v.ram,
      storage_size: v.storage,
      battery_capacity: v.battery,
      processor: v.processor,
      display_size: v.display,
      camera_details: v.camera,
      price: v.price,
      discount_price: v.discountPrice || 0,
      stock_quantity: v.stock,
      low_stock_alert: v.lowStockAlert || 5,
    }))

    fd.append('variants', JSON.stringify(variantPayload))

    const allFiles: File[] = []
    const imageMap: Record<string, number[]> = {}
    variants.forEach((v, vi) => {
      const indices: number[] = []
      v.images.forEach((img, ii) => {
        if (img.startsWith('data:')) {
          const blob = dataURLToBlob(img)
          const file = new File([blob], `v${vi}_${ii}.jpg`, { type: blob.type || 'image/jpeg' })
          allFiles.push(file)
          indices.push(allFiles.length - 1)
        }
      })
      if (indices.length > 0) imageMap[String(vi)] = indices
    })

    allFiles.forEach((f) => fd.append('variant_images', f))
    if (Object.keys(imageMap).length > 0)     fd.append('variant_image_map', JSON.stringify(imageMap))

    const existingUrls: string[] = []
    const productAllFiles: File[] = []
    const productImgIndices: number[] = []
    productImages.forEach((img, ii) => {
      if (img.startsWith('data:')) {
        const blob = dataURLToBlob(img)
        const file = new File([blob], `product_${ii}.jpg`, { type: blob.type || 'image/jpeg' })
        productAllFiles.push(file)
        productImgIndices.push(productAllFiles.length - 1)
      } else if (img.startsWith('http') || img.startsWith('blob:')) {
        existingUrls.push(img)
      }
    })
    productAllFiles.forEach((f) => fd.append('product_images', f))
    if (productImgIndices.length > 0) {
      fd.append('product_image_map', JSON.stringify(productImgIndices))
      fd.append('common_image', productAllFiles[0], productAllFiles[0].name)
    }
    if (existingUrls.length > 0) {
      fd.append('existing_product_images', JSON.stringify(existingUrls))
    }

    return fd
  }, [name, brand, model, category, subcategory, categoryOptions, subcategoryOptions, description, status, trending, newArrival, bestSelling, featured, features, careInstructions, variants, productImages])

  const handleSave = async () => {
    if (!validate()) return
    if (!onSubmit) return
    const fd = buildFormData()
    await onSubmit(fd)
  }

  const reset = () => {
    setName(''); setBrand(''); setModel(''); setCategory(''); setSubcategory('')
    setDescription(''); setFeatures([]); setCareInstructions([])
    setVariants([newVariant()]); setTrending(false); setNewArrival(false); setBestSelling(false)
    setFeatured(false); setRefurbished(false); setStatus(true)
    setProductImages([]); setErrors({}); setVariantErrors({}); setSelectedVariantIdx(0)
  }

  const getError = (field: string) => errors[field] || ''
  const hasError = (field: string) => !!errors[field]

  const previewVariant = variants[selectedVariantIdx] || variants[0]

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <button type="button" onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
        value ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-lighter border-border text-text-muted hover:border-primary/20'
      }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${value ? 'border-primary bg-primary' : 'border-border'}`}>
        {value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
      {label}
    </button>
  )

  const FieldError = ({ field }: { field: string }) => {
    if (!errors[field]) return null
    return (
      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="text-xs text-danger mt-1 flex items-center gap-1"
      ><FiAlertCircle size={11} /> {errors[field]}</motion.p>
    )
  }

  return (
    <motion.div key={shakeKey} animate={Object.keys(errors).length > 0 ? { x: [0, -4, 4, -4, 4, -2, 2, 0] } : {}} transition={{ duration: 0.4 }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-5 lg:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-tight">Add New Product</h3>
                <p className="text-xs text-text-muted mt-0.5">Fill details to create a new mobile product</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setStatus(!status)}
                  className={`relative w-20 h-8 rounded-xl border transition-all cursor-pointer ${status ? 'bg-emerald-50 border-emerald-200/50' : 'bg-rose-50 border-rose-200/50'}`}
                >
                  <span className={`text-[10px] font-semibold ${status ? 'text-emerald-700' : 'text-rose-600'}`}>{status ? 'Active' : 'Inactive'}</span>
                  <span className={`absolute top-1 bottom-1 w-4 rounded-lg bg-white shadow-sm transition-all duration-200 ${status ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Product Name <span className="text-danger">*</span>
                    </label>
                    <input type="text" placeholder="e.g. iPhone 15 Pro Max" value={name}
                      onChange={(e) => { setName(e.target.value); if (errors.name) { const { name: _, ...r } = errors; setErrors(r) } }}
                      className={`w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-primary/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.08)] ${hasError('name') ? 'border-danger' : 'border-border'}`}
                    />
                    <FieldError field="name" />
                  </div>
                  <div>
                    <SearchableDropdown label="Brand" options={brands} value={brand}
                      onChange={(v) => { setBrand(v); if (errors.brand) { const { brand: _, ...r } = errors; setErrors(r) } }}
                      placeholder="Select Brand" error={getError('brand')} required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Model Number <span className="text-danger">*</span>
                    </label>
                    <input type="text" placeholder="e.g. A2849" value={model}
                      onChange={(e) => { setModel(e.target.value); if (errors.model) { const { model: _, ...r } = errors; setErrors(r) } }}
                      className={`w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary outline-none transition-all focus:border-primary/50 ${hasError('model') ? 'border-danger' : 'border-border'}`}
                    />
                    <FieldError field="model" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <SearchableDropdown label="Category" options={categoryNames || categories} value={category}
                      onChange={(v) => { setCategory(v); if (errors.category) { const { category: _, ...r } = errors; setErrors(r) } }}
                      placeholder="Select Category" error={getError('category')} required
                    />
                  </div>
                  <div>
                    <SearchableDropdown label="Sub Category" options={subcategoryNames || subcategories} value={subcategory}
                      onChange={(v) => { setSubcategory(v); if (errors.subcategory) { const { subcategory: _, ...r } = errors; setErrors(r) } }}
                      placeholder="Select Sub Category" error={getError('subcategory')} required
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Product Images ({productImages.length}/10)</h5>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setProductImgDragOver(true) }}
                    onDragLeave={() => setProductImgDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setProductImgDragOver(false); if (e.dataTransfer.files) handleProductImages(e.dataTransfer.files) }}
                    className={`rounded-xl border-2 border-dashed p-4 text-center transition-all duration-200 cursor-pointer ${
                      productImgDragOver ? 'border-primary bg-primary/10' : 'border-primary/20 hover:border-primary/30 bg-surface-lighter'
                    }`}
                    onClick={() => productImgRef.current?.click()}
                  >
                    <input ref={productImgRef} type="file" accept="image/*" multiple className="hidden" onChange={addProductImages} />
                    <div className="flex flex-col items-center gap-1.5">
                      <FiUploadCloud size={18} className="text-primary" />
                      <p className="text-xs font-semibold text-text-secondary">Drop product images or click to upload</p>
                      <p className="text-[10px] text-text-muted">Up to 10 images | PNG, JPG, WebP</p>
                    </div>
                  </div>
                  {productImages.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-3">
                      {productImages.map((img, i) => (
                        <div key={`pi-${i}-${img.slice(0, 30)}`}
                          className="relative group aspect-square rounded-xl bg-surface-lighter border border-border overflow-hidden"
                        >
                          <img src={img} alt={`Product image ${i + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeProductImage(i)}
                            className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <span className="w-6 h-6 rounded-lg bg-white/90 flex items-center justify-center hover:bg-white">
                              <FiX size={10} className="text-danger" />
                            </span>
                          </button>
                        </div>
                      ))}
                      {productImages.length < 10 && (
                        <button type="button" onClick={() => productImgRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-primary/20 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                        ><FiImage size={18} /></button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-5">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Description</h4>
                <textarea rows={3} placeholder="Detailed product description..." value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-lighter border border-border text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-primary/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.08)] resize-none"
                />
              </div>

              <div className="border-t border-border pt-5">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  <Toggle label="🔥 Trending" value={trending} onChange={setTrending} />
                  <Toggle label="✨ New Arrival" value={newArrival} onChange={setNewArrival} />
                  <Toggle label="🏆 Best Selling" value={bestSelling} onChange={setBestSelling} />
                  <Toggle label="⭐ Featured" value={featured} onChange={setFeatured} />
                  <Toggle label="♻️ Refurbished" value={refurbished} onChange={setRefurbished} />
                </div>
              </div>

              <div className="border-t border-border pt-5">
                <FeatureInputList features={features} onChange={setFeatures} label="Product Features" placeholder="e.g. 120Hz AMOLED Display" />
              </div>

              <div className="border-t border-border pt-5">
                <CareInstructionList instructions={careInstructions} onChange={setCareInstructions} />
              </div>

              <div className="border-t border-border pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Product Variants <span className="text-danger">*</span>
                    </h4>
                    <p className="text-[10px] text-text-muted mt-0.5">Each variant represents a unique configuration (RAM, storage, color, price)</p>
                  </div>
                  <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={addVariant}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer"
                  ><FiPlus size={13} /> Add Variant</motion.button>
                </div>
                {getError('variants') && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-danger mb-3 flex items-center gap-1"
                  ><FiAlertCircle size={11} /> {errors.variants}</motion.p>
                )}
                <div className="space-y-3">
                  <AnimatePresence>
                    {variants.map((v, i) => (
                      <VariantCard key={v.id} variant={v} index={i}
                        onChange={(val) => updateVariant(i, val)}
                        onDelete={() => removeVariant(i)}
                        onDuplicate={() => duplicateVariant(i)}
                        errors={variantErrors[v.id] || {}}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="border-t border-border pt-5 flex flex-wrap items-center gap-3">
                <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
                ><FiSave size={15} /> {loading ? 'Saving...' : 'Save Product'}</motion.button>
                <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={reset} disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-lighter border border-border text-text-muted text-sm font-semibold hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-50"
                ><FiRefreshCw size={14} /> Reset</motion.button>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Live Preview</h4>
                {variants.length > 1 && (
                  <select value={selectedVariantIdx} onChange={(e) => setSelectedVariantIdx(Number(e.target.value))}
                    className="text-[10px] px-2 py-1 rounded-lg bg-surface-lighter border border-border text-text-secondary outline-none cursor-pointer"
                  >
                    {variants.map((_, i) => (<option key={i} value={i}>Variant {i + 1}</option>))}
                  </select>
                )}
              </div>
              <PreviewCard product={{
                name, originalPrice: previewVariant?.price || 0,
                discountPrice: previewVariant?.discountPrice || 0,
                thumbnail: previewVariant?.images?.[0] || '📱', category, brand,
                stock: previewVariant?.stock || 0, trending, newArrival,
                ram: previewVariant?.ram || '', storage: previewVariant?.storage || '',
                battery: previewVariant?.battery || 0, processor: previewVariant?.processor || '',
                display: previewVariant?.display || '', camera: previewVariant?.camera || '',
                color: previewVariant?.color || '', images: previewVariant?.images || [],
              }} />
            </GlassCard>
            {variants.length > 0 && (
              <GlassCard className="p-4">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Summary</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-text-muted">Variants</span><span className="font-semibold text-text-primary">{variants.length}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Total Stock</span><span className="font-semibold text-text-primary">{totalStock}</span></div>
                  {effectivePrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Price Range</span>
                      <span className="font-semibold text-text-primary">₹{effectivePrice.toLocaleString('en-IN')}{maxPrice > effectivePrice ? ` - ₹${maxPrice.toLocaleString('en-IN')}` : ''}</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

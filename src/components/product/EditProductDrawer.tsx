import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSave, FiImage, FiUploadCloud } from 'react-icons/fi'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import FeatureInputList from './FeatureInputList'
import CareInstructionList from './CareInstructionList'
import VariantCard from './VariantCard'
import SearchableDropdown from './SearchableDropdown'
import { categories, subcategories, brands } from '../../data/productData'
import type { Product, Variant } from '../../data/productData'

interface EditProductDrawerProps {
  open: boolean
  product: Product | null
  onClose: () => void
  onSave?: (id: number, formData: FormData) => Promise<void>
  loading?: boolean
  categoryOptions?: { id: number; name: string }[]
  subcategoryOptions?: { id: number; name: string }[]
  categoryNames?: string[]
  subcategoryNames?: string[]
}

let variantIdCounter = 100
const newVariant = (): Variant => ({
  id: `v${variantIdCounter++}`, name: '', ram: '', storage: '', battery: 0,
  color: '', processor: '', display: '', camera: '',
  price: 0, discountPrice: 0, stock: 0, lowStockAlert: 5, images: [],
})

function dataURLToBlob(dataURL: string): Blob {
  const arr = dataURL.split(',')
  if (arr.length < 2) return new Blob([])
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const raw = window.atob(arr[1])
  const u8 = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) u8[i] = raw.charCodeAt(i)
  return new Blob([u8], { type: mime })
}

export default function EditProductDrawer({ open, product, onClose, onSave, loading, categoryOptions, subcategoryOptions, categoryNames, subcategoryNames }: EditProductDrawerProps) {
  useLockBodyScroll(open)
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [description, setDescription] = useState('')
  const [features, setFeatures] = useState<string[]>([])
  const [careInstructions, setCareInstructions] = useState<string[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [trending, setTrending] = useState(false)
  const [newArrival, setNewArrival] = useState(false)
  const [bestSelling, setBestSelling] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [refurbished, setRefurbished] = useState(false)
  const [status, setStatus] = useState(true)
  const [productImages, setProductImages] = useState<string[]>([])
  const [productImgDragOver, setProductImgDragOver] = useState(false)
  const productImgRef = useRef<HTMLInputElement>(null)
  const [activeSection, setActiveSection] = useState('basic')

  useEffect(() => {
    if (!product) return
    setName(product.name)
    setBrand(product.brand)
    setModel(product.model)
    setCategory(product.category)
    setSubcategory(product.subcategory)
    setDescription(product.description)
    setFeatures([...product.features])
    setCareInstructions([...product.careInstructions])
    setVariants(product.variants.map((v) => ({ ...v, images: [...v.images] })))
    setProductImages(product.images ? [...product.images] : [])
    setTrending(product.trending)
    setNewArrival(product.newArrival)
    setBestSelling(product.bestSelling)
    setFeatured(product.featured)
    setRefurbished(product.refurbished)
    setStatus(product.status === 'active')
  }, [product])

  const addVariant = () => setVariants([...variants, newVariant()])
  const updateVariant = (i: number, v: Variant) => {
    const next = [...variants]
    next[i] = v
    setVariants(next)
  }
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i))
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
          setProductImages((prev) => [...prev, e.target?.result as string])
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

    fd.append('features', JSON.stringify(features.filter(Boolean).map((f) => ({ feature_text: f }))))
    fd.append('care_instructions', JSON.stringify(careInstructions.filter(Boolean).map((c) => ({ instruction_text: c }))))

    const variantPayload = variants.map((v) => ({
      variant_name: v.name, color: v.color, ram_size: v.ram, storage_size: v.storage,
      battery_capacity: v.battery, processor: v.processor, display_size: v.display,
      camera_details: v.camera, price: v.price, discount_price: v.discountPrice || 0,
      stock_quantity: v.stock, low_stock_alert: v.lowStockAlert || 5,
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
    if (Object.keys(imageMap).length > 0) fd.append('variant_image_map', JSON.stringify(imageMap))

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
    if (!product || !onSave) return
    const fd = buildFormData()
    await onSave(product.id, fd)
  }

  const sections = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'features', label: 'Features' },
    { id: 'variants', label: 'Variants' },
  ]

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <button type="button" onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${value ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-lighter border-border text-text-muted hover:border-primary/20'}`}
    >
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${value ? 'border-primary bg-primary' : 'border-border'}`}>
        {value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
      {label}
    </button>
  )

  const thumb = productImages[0] || product?.variants?.[0]?.images?.[0] || '📱'

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={onClose}
        >
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 w-full max-w-2xl lg:max-w-3xl bg-bg-card border-l border-border shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">{thumb}</div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Edit Product</h3>
                  <p className="text-xs text-text-muted">{product?.name?.slice(0, 40) || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setStatus(!status)}
                  className={`relative w-20 h-8 rounded-xl border transition-all cursor-pointer ${status ? 'bg-primary/10 border-primary/20' : 'bg-rose-50 border-rose-200/50'}`}
                >
                  <span className={`text-[10px] font-semibold ${status ? 'text-primary' : 'text-rose-600'}`}>{status ? 'Active' : 'Inactive'}</span>
                  <span className={`absolute top-1 bottom-1 w-4 rounded-lg bg-white shadow-sm transition-all duration-200 ${status ? 'right-1' : 'left-1'}`} />
                </button>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer ml-2">
                  <FiX size={16} className="text-text-muted" />
                </button>
              </div>
            </div>

            <div className="flex gap-1 p-3 border-b border-border overflow-x-auto flex-shrink-0">
              {sections.map((sec) => (
                <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${activeSection === sec.id ? 'bg-primary text-white' : 'text-text-muted hover:text-text-secondary hover:bg-primary/10'}`}
                >{sec.label}</button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(activeSection === 'basic' || activeSection === 'all') && (
                <div>
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Product Name</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-surface-lighter border border-border text-sm text-text-primary outline-none transition-all focus:border-primary/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.08)]"
                      />
                    </div>
                    <div><SearchableDropdown label="Brand" options={brands} value={brand} onChange={setBrand} placeholder="Select Brand" /></div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">Model Number</label>
                      <input type="text" value={model} onChange={(e) => setModel(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-surface-lighter border border-border text-sm text-text-primary outline-none transition-all focus:border-primary/50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div><SearchableDropdown label="Category" options={categoryNames || categories} value={category} onChange={setCategory} placeholder="Select Category" /></div>
                    <div><SearchableDropdown label="Sub Category" options={subcategoryNames || subcategories} value={subcategory} onChange={setSubcategory} placeholder="Select Sub Category" /></div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Full Description</label>
                    <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface-lighter border border-border text-sm text-text-primary outline-none transition-all focus:border-primary/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.08)] resize-none"
                    />
                  </div>
                  <div className="mt-4">
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
                          <div key={`pi-${i}`}
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
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      <Toggle label="🔥 Trending" value={trending} onChange={setTrending} />
                      <Toggle label="✨ New Arrival" value={newArrival} onChange={setNewArrival} />
                      <Toggle label="🏆 Best Selling" value={bestSelling} onChange={setBestSelling} />
                      <Toggle label="⭐ Featured" value={featured} onChange={setFeatured} />
                      <Toggle label="♻️ Refurbished" value={refurbished} onChange={setRefurbished} />
                    </div>
                  </div>
                </div>
              )}

              {(activeSection === 'features' || activeSection === 'all') && (
                <>
                  <div className="border-t border-border pt-5">
                    <FeatureInputList features={features} onChange={setFeatures} label="Product Features" placeholder="e.g. 120Hz AMOLED Display" />
                  </div>
                  <div className="border-t border-border pt-5">
                    <CareInstructionList instructions={careInstructions} onChange={setCareInstructions} />
                  </div>
                </>
              )}

              {(activeSection === 'variants' || activeSection === 'all') && (
                <div className="border-t border-border pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Product Variants</h4>
                      <p className="text-[10px] text-text-muted mt-0.5">Each variant represents a unique configuration</p>
                    </div>
                    <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={addVariant}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer"
                    ><FiX size={13} className="rotate-45" /> Add Variant</motion.button>
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {variants.map((v, i) => (
                        <VariantCard key={v.id} variant={v} index={i}
                          onChange={(val) => updateVariant(i, val)}
                          onDelete={() => removeVariant(i)}
                          onDuplicate={() => duplicateVariant(i)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border p-4 flex-shrink-0 bg-bg-card">
              <div className="flex items-center justify-end gap-3">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-surface-lighter border border-border text-text-secondary text-sm font-semibold hover:bg-surface-hover transition-all cursor-pointer">Cancel</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
                ><FiSave size={15} /> {loading ? 'Saving...' : 'Save Changes'}</motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

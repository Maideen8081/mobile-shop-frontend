import type { Product } from '../../data/productData'

/** An image in the form: either already saved (id + url) or a newly picked file. */
export interface ImageDraft {
  key: string
  src: string
  id?: number
  file?: File
}

export interface VariantDraft {
  key: string
  dbId?: number
  name: string
  color: string
  ram: string
  storage: string
  battery: number
  processor: string
  display: string
  camera: string
  price: number
  discountPrice: number
  stock: number
  lowStockAlert: number
  images: ImageDraft[]
}

export interface ProductDraft {
  name: string
  brand: string
  model: string
  categoryId: number | null
  subcategoryId: number | null
  description: string
  features: string[]
  careInstructions: string[]
  trending: boolean
  newArrival: boolean
  bestSelling: boolean
  featured: boolean
  refurbished: boolean
  published: boolean
  cover: ImageDraft | null
  coverRemoved: boolean
  variants: VariantDraft[]
}

let keySeq = 0
export const nextKey = (prefix: string) => `${prefix}${++keySeq}`

export function fileDraft(file: File): ImageDraft {
  return { key: nextKey('img'), src: URL.createObjectURL(file), file }
}

export function releaseImage(img: ImageDraft) {
  if (img.file) URL.revokeObjectURL(img.src)
}

export function newVariantDraft(): VariantDraft {
  return {
    key: nextKey('v'), name: '', color: '', ram: '', storage: '', battery: 0, processor: '', display: '', camera: '',
    price: 0, discountPrice: 0, stock: 0, lowStockAlert: 5, images: [],
  }
}

export function emptyProductDraft(): ProductDraft {
  return {
    name: '', brand: '', model: '', categoryId: null, subcategoryId: null, description: '',
    features: [], careInstructions: [], trending: false, newArrival: false, bestSelling: false,
    featured: false, refurbished: false, published: true, cover: null, coverRemoved: false,
    variants: [newVariantDraft()],
  }
}

export function productToDraft(p: Product): ProductDraft {
  return {
    name: p.name,
    brand: p.brand,
    model: p.model,
    categoryId: p.categoryId ?? null,
    subcategoryId: p.subcategoryId ?? null,
    description: p.description,
    features: [...p.features],
    careInstructions: [...p.careInstructions],
    trending: p.trending,
    newArrival: p.newArrival,
    bestSelling: p.bestSelling,
    featured: p.featured,
    refurbished: p.refurbished,
    published: p.status === 'active',
    cover: p.coverImage ? { key: nextKey('img'), src: p.coverImage } : null,
    coverRemoved: false,
    variants: p.variants.map((v) => ({
      key: nextKey('v'),
      dbId: v.dbId,
      name: v.name,
      color: v.color,
      ram: v.ram,
      storage: v.storage,
      battery: v.battery,
      processor: v.processor,
      display: v.display,
      camera: v.camera,
      price: v.price,
      discountPrice: v.discountPrice,
      stock: v.stock,
      lowStockAlert: v.lowStockAlert,
      // Main image first, as the backend orders them.
      images: [...(v.imageRefs || [])]
        .sort((a, b) => Number(b.isMain) - Number(a.isMain))
        .map((ref) => ({ key: nextKey('img'), src: ref.url, id: ref.id })),
    })),
  }
}

/**
 * Multipart body for POST /products/create/ and PUT /products/<id>/update/.
 * Each variant lists its images in display order as "id:<saved image>" or
 * "file:<index into variant_images>"; the first one becomes the main image.
 */
export function buildProductFormData(d: ProductDraft, isEdit: boolean): FormData {
  const fd = new FormData()
  const squash = (s: string) => s.split(/\s+/).filter(Boolean).join(' ')
  fd.append('product_name', squash(d.name))
  fd.append('brand', squash(d.brand))
  fd.append('model_number', d.model.trim())
  fd.append('category', String(d.categoryId ?? ''))
  fd.append('sub_category', d.subcategoryId ? String(d.subcategoryId) : '')
  fd.append('description', d.description.trim())
  fd.append('is_published', String(d.published))
  fd.append('is_trending', String(d.trending))
  fd.append('is_new_arrival', String(d.newArrival))
  fd.append('is_best_selling', String(d.bestSelling))
  fd.append('is_featured', String(d.featured))
  fd.append('is_refurbished', String(d.refurbished))
  fd.append('features', JSON.stringify(d.features.map((t) => ({ feature_text: t.trim() }))))
  fd.append('care_instructions', JSON.stringify(d.careInstructions.map((t) => ({ instruction_text: t.trim() }))))

  if (d.cover?.file) fd.append('common_image', d.cover.file, d.cover.file.name)
  else if (isEdit && d.coverRemoved && !d.cover) fd.append('remove_common_image', 'true')

  const files: File[] = []
  const variants = d.variants.map((v) => ({
    ...(v.dbId ? { id: v.dbId } : {}),
    variant_name: v.name.trim(),
    color: v.color.trim(),
    ram_size: v.ram.trim(),
    storage_size: v.storage.trim(),
    battery_capacity: v.battery,
    processor: v.processor.trim(),
    display_size: v.display.trim(),
    camera_details: v.camera.trim(),
    price: v.price,
    discount_price: v.discountPrice || null,
    stock_quantity: v.stock,
    low_stock_alert: v.lowStockAlert,
    image_order: v.images.map((img) => {
      if (img.id) return `id:${img.id}`
      files.push(img.file as File)
      return `file:${files.length - 1}`
    }),
  }))
  fd.append('variants', JSON.stringify(variants))
  files.forEach((f) => fd.append('variant_images', f, f.name))
  return fd
}

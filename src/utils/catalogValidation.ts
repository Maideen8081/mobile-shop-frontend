// Catalog rules for the admin forms. These mirror the backend exactly
// (apps/categories/validators.py, apps/products/validators.py) and the
// database constraints, so a form that passes here is accepted by the API.
// Change both sides together.

export const NAME_MIN = 2
export const NAME_MAX = 60
export const MAX_SUB_CATEGORIES = 5
const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 &'().,/+-]*$/
const NAME_CHARS_HINT = "letters, numbers, spaces and & ' ( ) . , / + -"

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'
export const IMAGE_TYPES_LABEL = 'JPG, PNG or WebP'
export const CATEGORY_IMAGE_MAX_MB = 2
export const PRODUCT_IMAGE_MAX_MB = 5

export const PRODUCT = {
  nameMin: 2,
  nameMax: 200,
  brandMin: 2,
  brandMax: 100,
  modelMax: 100,
  descriptionMax: 5000,
  maxFeatures: 20,
  featureMax: 255,
  maxCare: 20,
  careMax: 500,
  maxVariants: 20,
  maxImagesPerVariant: 10,
  priceMax: 99_999_999.99,
  stockMax: 100_000,
  lowStockMax: 1000,
  batteryMin: 500,
  batteryMax: 20_000,
} as const

const MODEL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ._/+-]*$/

/** Same normalisation the backend applies: trim and collapse inner whitespace. */
export const normalizeName = (value: string) => value.split(/\s+/).filter(Boolean).join(' ')

export function catalogNameError(value: string, label: string): string | undefined {
  const name = normalizeName(value)
  if (!name) return `${label} is required`
  if (name.length < NAME_MIN) return `${label} must be at least ${NAME_MIN} characters`
  if (name.length > NAME_MAX) return `${label} must be at most ${NAME_MAX} characters`
  if (!NAME_PATTERN.test(name)) return `${label} must start with a letter or number and use only ${NAME_CHARS_HINT}`
  return undefined
}

export function imageFileError(file: File, maxMb: number): string | undefined {
  if (!IMAGE_TYPES.includes(file.type)) return `"${file.name}" is not a ${IMAGE_TYPES_LABEL} image`
  if (file.size > maxMb * 1024 * 1024) return `"${file.name}" is larger than ${maxMb}MB`
  return undefined
}

// ── Products ──

export interface VariantInput {
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
  imageCount: number
}

export interface ProductInput {
  name: string
  brand: string
  model: string
  category: string
  subcategory: string
  categoryHasSubs: boolean
  description: string
  features: string[]
  careInstructions: string[]
}

export type Errors = Record<string, string>

const isWhole = (n: number) => Number.isFinite(n) && Number.isInteger(n)
/** At most 2 decimal places, tolerant of float noise (19.99 * 100 = 1998.9999…). */
const hasPaise = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6

function textError(value: string, label: string, max: number): string | undefined {
  const v = value.trim()
  if (!v) return `${label} is required`
  if (v.length > max) return `${label} must be at most ${max} characters`
  return undefined
}

export function validateProduct(p: ProductInput): Errors {
  const e: Errors = {}
  const name = normalizeName(p.name)
  if (!name) e.name = 'Product name is required'
  else if (name.length < PRODUCT.nameMin) e.name = `Product name must be at least ${PRODUCT.nameMin} characters`
  else if (name.length > PRODUCT.nameMax) e.name = `Product name must be at most ${PRODUCT.nameMax} characters`

  const brand = normalizeName(p.brand)
  if (!brand) e.brand = 'Select a brand'
  else if (brand.length < PRODUCT.brandMin || brand.length > PRODUCT.brandMax) e.brand = `Brand must be ${PRODUCT.brandMin}–${PRODUCT.brandMax} characters`

  const model = p.model.trim()
  if (!model) e.model = 'Model number is required'
  else if (model.length > PRODUCT.modelMax) e.model = `Model number must be at most ${PRODUCT.modelMax} characters`
  else if (!MODEL_PATTERN.test(model)) e.model = 'Use only letters, numbers, spaces and . _ / + - (start with a letter or number)'

  if (!p.category) e.category = 'Select a category'
  if (p.categoryHasSubs && !p.subcategory) e.subcategory = 'Select a sub category'

  if (p.description.trim().length > PRODUCT.descriptionMax) e.description = `Description must be at most ${PRODUCT.descriptionMax} characters`

  const features = p.features.map((f) => f.trim())
  if (features.some((f) => !f)) e.features = 'Remove empty features or fill them in'
  else if (features.some((f) => f.length > PRODUCT.featureMax)) e.features = `Each feature must be at most ${PRODUCT.featureMax} characters`
  else if (features.length > PRODUCT.maxFeatures) e.features = `At most ${PRODUCT.maxFeatures} features`

  const care = p.careInstructions.map((c) => c.trim())
  if (care.some((c) => !c)) e.careInstructions = 'Remove empty care instructions or fill them in'
  else if (care.some((c) => c.length > PRODUCT.careMax)) e.careInstructions = `Each care instruction must be at most ${PRODUCT.careMax} characters`
  else if (care.length > PRODUCT.maxCare) e.careInstructions = `At most ${PRODUCT.maxCare} care instructions`
  return e
}

export function validateVariant(v: VariantInput): Errors {
  const e: Errors = {}
  const set = (k: string, msg?: string) => { if (msg) e[k] = msg }
  set('name', textError(v.name, 'Variant name', 100))
  set('color', textError(v.color, 'Color', 50))
  set('ram', textError(v.ram, 'RAM size', 20))
  set('storage', textError(v.storage, 'Storage size', 20))
  set('processor', textError(v.processor, 'Processor', 100))
  set('display', textError(v.display, 'Display size', 50))
  set('camera', textError(v.camera, 'Camera details', 255))

  if (!v.battery) e.battery = 'Battery capacity is required'
  else if (!isWhole(v.battery) || v.battery < PRODUCT.batteryMin || v.battery > PRODUCT.batteryMax)
    e.battery = `Enter a whole number between ${PRODUCT.batteryMin} and ${PRODUCT.batteryMax} mAh`

  if (!Number.isFinite(v.price) || v.price <= 0) e.price = 'Price must be greater than 0'
  else if (v.price > PRODUCT.priceMax) e.price = 'Price is too large'
  else if (!hasPaise(v.price)) e.price = 'Use at most 2 decimal places'

  if (v.discountPrice) {
    if (v.discountPrice < 0) e.discountPrice = 'Discount price cannot be negative'
    else if (v.discountPrice >= v.price) e.discountPrice = 'Discount price must be lower than the price'
    else if (!hasPaise(v.discountPrice)) e.discountPrice = 'Use at most 2 decimal places'
  }

  if (!isWhole(v.stock) || v.stock < 0) e.stock = 'Stock must be a whole number, 0 or more'
  else if (v.stock > PRODUCT.stockMax) e.stock = `Stock cannot exceed ${PRODUCT.stockMax.toLocaleString('en-IN')}`

  if (!isWhole(v.lowStockAlert) || v.lowStockAlert < 0 || v.lowStockAlert > PRODUCT.lowStockMax)
    e.lowStockAlert = `Enter a whole number from 0 to ${PRODUCT.lowStockMax}`

  if (v.imageCount < 1) e.images = 'Add at least one image'
  else if (v.imageCount > PRODUCT.maxImagesPerVariant) e.images = `At most ${PRODUCT.maxImagesPerVariant} images`
  return e
}

/** Index of each variant whose color + RAM + storage repeats an earlier one. */
export function duplicateVariantIndexes(variants: Pick<VariantInput, 'color' | 'ram' | 'storage'>[]): number[] {
  const seen = new Set<string>()
  const dupes: number[] = []
  variants.forEach((v, i) => {
    const key = [v.color, v.ram, v.storage].map((s) => s.trim().toLowerCase()).join('|')
    if (seen.has(key)) dupes.push(i)
    seen.add(key)
  })
  return dupes
}

/**
 * DRF validation errors as { field: message }. Nested lists such as
 * variants: ["Variant 2: price — ..."] are joined into one message.
 */
export function serverFieldErrors(err: unknown): Errors {
  const response = (err as { response?: { status?: number; data?: unknown } } | null)?.response
  const data = response?.data
  if (!data || typeof data !== 'object' || response?.status !== 400) return {}
  const out: Errors = {}
  for (const [key, value] of Object.entries(data)) {
    if (key === 'success') continue
    const flat = [value].flat(3).filter((m): m is string => typeof m === 'string')
    if (flat.length) out[key] = flat.join(' · ')
  }
  return out
}

/** Copy of an error map without one key (clears a field's error). */
export function omitKey(errors: Errors, ...keys: string[]): Errors {
  const next = { ...errors }
  keys.forEach((k) => delete next[k])
  return next
}

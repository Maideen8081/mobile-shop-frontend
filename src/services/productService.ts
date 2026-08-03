import api from './api'

const PRODUCTS_URL = '/api/v1/products'

export interface ApiVariantImage {
  id: number
  image: string
  is_main: boolean
}

export interface ApiVariant {
  id: number
  variant_name: string
  color: string
  ram_size: string
  storage_size: string
  battery_capacity: number
  processor: string
  display_size: string
  camera_details: string
  price: number
  discount_price: number
  stock: number
  low_stock_alert: number
  images: ApiVariantImage[]
}

export interface ApiFeature {
  id?: number
  feature_text: string
}

export interface ApiCareInstruction {
  id?: number
  instruction_text: string
}

export interface ApiProduct {
  id: number
  product_name: string
  brand: string
  model_number: string
  category: number | { id: number; name: string }
  sub_category: number | { id: number; name: string }
  description: string
  status: 'active' | 'inactive'
  trending: boolean
  new_arrival: boolean
  best_selling: boolean
  featured: boolean
  features: ApiFeature[]
  care_instructions: ApiCareInstruction[]
  variants: ApiVariant[]
  rating: number
  sold: number
  created: string
}

export interface ProductStats {
  total_products: number
  active_products: number
  inactive_products: number
  trending_products: number
  new_arrival_products: number
  best_selling_products: number
  featured_products: number
  total_variants: number
  low_stock_products: number
}

export interface ProductListParams {
  page?: number
  page_size?: number
  category?: string
  sub_category?: string
  status?: string
  is_trending?: boolean
  is_best_selling?: boolean
  is_new_arrival?: boolean
  is_featured?: boolean
  is_refurbished?: boolean
  search?: string
  brand?: string
  price_min?: number
  price_max?: number
  rating_min?: number
  ordering?: string
}

function unwrapData<T>(res: { data: any }): T {
  const body = res.data
  return body?.success === true && 'data' in body ? body.data : body
}

function toBool(v: any): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return v === 'true' || v === '1' || v === 'True' || v === 'yes'
  return false
}

function extractImageField(raw: any): string[] {
  const fieldNames = [
    'images', 'variantimage_set', 'variant_images', 'product_images',
    'common_image',
    'attachments', 'photos', 'pictures', 'media', 'pics', 'files',
    'gallery', 'screenshots', 'thumbnails',
  ]
  for (const field of fieldNames) {
    const src = raw[field]
    if (Array.isArray(src)) {
      const mapped = src.map((img: any) => {
        if (typeof img === 'string') return img
        return img.image ?? img.url ?? img.src ?? img.file ?? img.path ?? img.thumbnail ?? String(img)
      }).filter(Boolean)
      if (mapped.length > 0) return mapped
    }
    if (typeof src === 'string') return [src]
  }
  if (typeof raw.image === 'string') return [raw.image]
  if (typeof raw.thumbnail === 'string') return [raw.thumbnail]
  return []
}

function normalizeProduct(raw: any): any {
  return {
    id: raw.id,
    name: raw.product_name ?? raw.name,
    brand: raw.brand ?? '',
    model: raw.model_number ?? raw.model ?? '',
    category: typeof raw.category === 'object' && raw.category ? raw.category.name || raw.category.category_name || '' : raw.category_name || String(raw.category) || '',
    subcategory: typeof raw.sub_category === 'object' && raw.sub_category ? raw.sub_category.name || raw.sub_category.sub_category_name || '' : raw.sub_category_name || String(raw.sub_category) || '',
    description: raw.description ?? '',
    features: Array.isArray(raw.features) ? raw.features.map((f: any) => f.feature_text ?? f) : [],
    careInstructions: Array.isArray(raw.care_instructions) ? raw.care_instructions.map((c: any) => c.instruction_text ?? c) : [],
    variants: Array.isArray(raw.variants) ? raw.variants.map(normalizeVariant) : [],
    minPrice: parseFloat(raw.min_price ?? raw.minPrice ?? raw.starting_price ?? raw.price ?? raw.discount_price) || 0,
    price: parseFloat(raw.price ?? raw.max_price ?? raw.mrp) || 0,
    rawMinPrice: raw.min_price,
    rawPrice: raw.price,
    rawDiscountPrice: raw.discount_price,
    images: extractImageField(raw),
    trending: toBool(raw.is_trending ?? raw.trending),
    newArrival: toBool(raw.is_new_arrival ?? raw.new_arrival),
    bestSelling: toBool(raw.is_best_selling ?? raw.best_selling),
    featured: toBool(raw.is_featured ?? raw.featured),
    refurbished: toBool(raw.is_refurbished ?? false),
    status: raw.is_published === true ? 'active' as const : raw.status === 'active' ? 'active' as const : 'inactive' as const,
    rating: raw.rating ?? 0,
    sold: raw.sold ?? 0,
    created: raw.created_at ?? raw.created ?? '',
    videoUrl: raw.video_url ?? raw.videoUrl ?? '',
  }
}

function normalizeVariant(raw: any): any {
  return {
    id: String(raw.id),
    name: raw.variant_name ?? raw.name ?? '',
    ram: raw.ram_size ?? raw.ram ?? '',
    storage: raw.storage_size ?? raw.storage ?? '',
    battery: Number(raw.battery_capacity ?? raw.battery ?? 0),
    color: raw.color ?? '',
    processor: raw.processor ?? '',
    display: raw.display_size ?? raw.display ?? '',
    camera: raw.camera_details ?? raw.camera ?? '',
    price: parseFloat(raw.price ?? raw.selling_price ?? raw.unit_price) || 0,
    discountPrice: parseFloat(raw.discount_price ?? raw.discountPrice ?? raw.sale_price) || 0,
    stock: Number(raw.stock_quantity ?? raw.stock ?? raw.quantity ?? 0),
    lowStockAlert: Number(raw.low_stock_alert ?? raw.lowStockAlert ?? 5),
    images: extractImageField(raw),
  }
}

function toArray(data: any): any[] {
  if (Array.isArray(data)) return data
  if (data?.results && Array.isArray(data.results)) return data.results
  if (data?.data && Array.isArray(data.data)) return data.data
  return []
}

export const productService = {
  list: (params?: ProductListParams) =>
    api.get(`${PRODUCTS_URL}/`, { params }).then((r) =>
      toArray(unwrapData<any>(r as any)).map(normalizeProduct),
    ),

  listPaginated: (params?: ProductListParams) =>
    api.get(`${PRODUCTS_URL}/`, { params }).then((r) => {
      const data = unwrapData<any>(r as any)
      return {
        results: toArray(data).map(normalizeProduct),
        count: data?.count ?? data?.total ?? data?.results?.length ?? 0,
        next: data?.next ?? null,
        previous: data?.previous ?? null,
      }
    }),

  create: (formData: FormData) =>
    api.post(`${PRODUCTS_URL}/create/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => normalizeProduct(unwrapData<any>(r as any))),

  getById: (id: number) =>
    api.get(`${PRODUCTS_URL}/${id}/`).then((r) =>
      normalizeProduct(unwrapData<any>(r as any)),
    ),

  update: (id: number, formData: FormData) =>
    api.put(`${PRODUCTS_URL}/${id}/update/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => normalizeProduct(unwrapData<any>(r as any))),

  delete: (id: number) =>
    api.delete(`${PRODUCTS_URL}/${id}/delete/`).then((r) => r.data),

  search: (query: string) =>
    api.get(`${PRODUCTS_URL}/search/`, { params: { query } }).then((r) =>
      toArray(unwrapData<any>(r as any)).map(normalizeProduct),
    ),

  lowStock: () =>
    api.get(`${PRODUCTS_URL}/low-stock/`).then((r) =>
      toArray(unwrapData<any>(r as any)).map(normalizeProduct),
    ),

  dashboardCounts: () =>
    api.get(`${PRODUCTS_URL}/dashboard-counts/`).then((r) =>
      unwrapData<ProductStats>(r as any),
    ),

  uploadVariantImages: (variantId: number, formData: FormData) =>
    api.post(`${PRODUCTS_URL}/${variantId}/images/upload/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  deleteVariantImage: (imageId: number) =>
    api.delete(`${PRODUCTS_URL}/images/${imageId}/delete/`).then((r) => r.data),
}

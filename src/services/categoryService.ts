import api from './api'

const CATEGORIES_URL = '/api/v1/categories'
const SUBCATEGORIES_URL = '/api/v1/sub-categories'

export interface Category {
  id: number
  name: string
  image: string | null
  status: 'active' | 'inactive'
  products: number
  sub_category_count: number
  created: string
  subcategories: SubCategory[]
}

export interface SubCategory {
  id: number
  name: string
  products: number
}

export interface CategoryStats {
  total_categories: number
  total_subcategories: number
  active_categories: number
  inactive_categories: number
}

export interface DropdownCategory {
  id: number
  name: string
  image?: string
  status?: string
}

function unwrapData<T>(res: { data: any }): T {
  const body = res.data
  return body?.success === true && 'data' in body ? body.data : body
}

function normalizeCategory(raw: any): Category {
  return {
    id: raw.id,
    name: raw.category_name ?? raw.name,
    image: raw.category_image ?? raw.image ?? null,
    status: raw.status === 'active' ? 'active' : 'inactive',
    products: raw.products ?? raw.product_count ?? 0,
    sub_category_count: raw.sub_category_count ?? (Array.isArray(raw.subcategories) ? raw.subcategories.length : 0),
    created: raw.created ?? raw.created_at ?? '',
    subcategories: Array.isArray(raw.subcategories)
      ? raw.subcategories.map((s: any) => ({
          id: s.id,
          name: s.sub_category_name ?? s.name,
          products: s.products ?? s.product_count ?? 0,
        }))
      : [],
  }
}

function toArray(data: any): any[] {
  if (Array.isArray(data)) return data
  if (data?.results && Array.isArray(data.results)) return data.results
  if (data?.data && Array.isArray(data.data)) return data.data
  return []
}

export const categoryService = {
  list: () =>
    api.get(`${CATEGORIES_URL}/`).then((r) =>
      toArray(unwrapData<any>(r as any)).map(normalizeCategory),
    ),

  create: (data: FormData) =>
    api.post(`${CATEGORIES_URL}/create/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => normalizeCategory(unwrapData<any>(r as any))),

  update: (id: number, data: FormData) =>
    api.put(`${CATEGORIES_URL}/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => normalizeCategory(unwrapData<any>(r as any))),

  delete: (id: number) =>
    api.delete(`${CATEGORIES_URL}/${id}/`).then((r) => r.data),

  dashboardCounts: () =>
    api.get(`${CATEGORIES_URL}/dashboard-counts/`).then((r) => unwrapData<CategoryStats>(r as any)),

  getById: (id: number) =>
    api.get(`${CATEGORIES_URL}/${id}/`).then((r) =>
      normalizeCategory(unwrapData<any>(r as any)),
    ),

  dropdown: () =>
    api.get(`${CATEGORIES_URL}/dropdown/`).then((r) =>
      toArray(unwrapData<any>(r as any)),
    ),
}

export const subCategoryService = {
  list: () =>
    api.get(`${SUBCATEGORIES_URL}/`).then((r) =>
      toArray(unwrapData<any>(r as any)),
    ),

  create: (data: { parentId: number; name: string; status: boolean }) =>
    api.post(`${SUBCATEGORIES_URL}/create/`, {
      parent_category: data.parentId,
      sub_category_name: data.name,
      status: data.status ? 'active' : 'inactive',
    }).then((r) => r.data),

  update: (id: number, data: { name: string }) =>
    api.put(`${SUBCATEGORIES_URL}/${id}/`, {
      sub_category_name: data.name,
    }).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`${SUBCATEGORIES_URL}/${id}/`).then((r) => r.data),
}

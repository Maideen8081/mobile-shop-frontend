import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiSmartphone, FiGrid, FiList, FiRefreshCw } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import StatWidget from '../components/product/StatWidget'
import FilterBar from '../components/product/FilterBar'
import ProductForm from '../components/product/ProductForm'
import ProductTable from '../components/product/ProductTable'
import ProductCard from '../components/product/ProductCard'
import EmptyState from '../components/product/EmptyState'
import EditProductDrawer from '../components/product/EditProductDrawer'
import DeleteModal from '../components/product/DeleteModal'
import Toast from '../components/category/Toast'
import { productService } from '../services/productService'
import type { ProductStats } from '../services/productService'
import { categoryService, subCategoryService } from '../services/categoryService'
import { productStats, categories } from '../data/productData'
import type { Product } from '../data/productData'

type ViewMode = 'table' | 'cards'

const statConfig = [
  { label: 'Total Products', icon: 'FiPackage', color: '#CB202D', bgGlow: 'rgba(203,32,45,0.12)' },
  { label: 'Active Products', icon: 'FiCheckCircle', color: '#CB202D', bgGlow: 'rgba(203,32,45,0.12)' },
  { label: 'Trending', icon: 'FiTrendingUp', color: '#A81D2A', bgGlow: 'rgba(203,32,45,0.10)' },
  { label: 'Best Selling', icon: 'FiAward', color: '#CB202D', bgGlow: 'rgba(203,32,45,0.08)' },
  { label: 'Low Stock', icon: 'FiAlertTriangle', color: '#ef4444', bgGlow: 'rgba(239,68,68,0.12)' },
  { label: 'Total Variants', icon: 'FiLayers', color: '#A81D2A', bgGlow: 'rgba(203,32,45,0.06)' },
]

function safeStats(s: any): ProductStats | null {
  if (!s || typeof s !== 'object') return null
  return {
    total_products: Number(s.total_products) || 0,
    active_products: Number(s.active_products) || 0,
    inactive_products: Number(s.inactive_products) || 0,
    trending_products: Number(s.trending_products ?? s.trending) || 0,
    new_arrival_products: Number(s.new_arrival_products ?? s.new_arrival) || 0,
    best_selling_products: Number(s.best_selling_products ?? s.best_selling) || 0,
    featured_products: Number(s.featured_products ?? s.featured) || 0,
    total_variants: Number(s.total_variants) || 0,
    low_stock_products: Number(s.low_stock_products ?? s.low_stock) || 0,
  }
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<ProductStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterTag, setFilterTag] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editDrawer, setEditDrawer] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<{ id: number; name: string }[]>([])
  const [subcategoryOptions, setSubcategoryOptions] = useState<{ id: number; name: string }[]>([])
  const loadIdRef = useRef(0)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadProducts = useCallback(async (tag?: string) => {
    const id = ++loadIdRef.current
    try {
      const params: Record<string, any> = {}
      if (tag && tag !== 'all') {
        if (tag === 'trending') params.is_trending = true
        else if (tag === 'newArrival') params.is_new_arrival = true
        else if (tag === 'bestSelling') params.is_best_selling = true
        else if (tag === 'featured') params.is_featured = true
      }
      const data = await productService.list(params as any)
      if (id !== loadIdRef.current) return
      const list = Array.isArray(data) ? data : []
      if (list.length > 0) {
        const details = await Promise.all(
          list.map((p: any) => productService.getById(p.id).catch(() => p))
        )
        if (id !== loadIdRef.current) return
        console.log(`[loadProducts] tag="${tag}" count=${details.length}`, details.map((p: any) => ({ id: p.id, name: p.name, trending: p.trending, newArrival: p.newArrival, bestSelling: p.bestSelling, featured: p.featured })))
        setProducts(details as any)
      } else {
        setProducts([])
      }
    } catch {
      if (id === loadIdRef.current) setProducts([])
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const s = await productService.dashboardCounts()
      setStats(safeStats(s))
    } catch {
      setStats(null)
    }
  }, [])

  const loadCategoryOptions = useCallback(async () => {
    try {
      const cats = await categoryService.dropdown()
      if (Array.isArray(cats)) setCategoryOptions(cats.map((c: any) => ({ id: c.id, name: c.name ?? c.category_name ?? '' })))
    } catch (err: any) {
      showToast('Failed to load categories: ' + (err?.message || 'API error'), 'error')
    }
  }, [])

  const loadSubcategoryOptions = useCallback(async () => {
    try {
      const subs = await subCategoryService.list()
      if (Array.isArray(subs)) setSubcategoryOptions(subs.map((s: any) => ({ id: s.id, name: s.name ?? s.sub_category_name ?? '' })))
    } catch (err: any) {
      showToast('Failed to load subcategories: ' + (err?.message || 'API error'), 'error')
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadProducts(filterTag), loadStats(), loadCategoryOptions(), loadSubcategoryOptions()])
    setLoading(false)
  }, [loadProducts, loadStats, loadCategoryOptions, loadSubcategoryOptions, filterTag])

  useEffect(() => { fetchData() }, [fetchData])

  const handleProductCreate = async (formData: FormData) => {
    setSubmitting(true)
    try {
      await productService.create(formData)
      showToast('Product created successfully', 'success')
      setShowForm(false)
      await Promise.all([loadProducts(filterTag), loadStats()])
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create product'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = useCallback(async (product: Product) => {
    setEditDrawer({ open: true, product: null })
    try {
      const detail = await productService.getById(product.id)
      setEditDrawer({ open: true, product: detail as any })
    } catch {
      setEditDrawer({ open: true, product })
    }
  }, [])

  const handleProductUpdate = async (id: number, formData: FormData) => {
    setSubmitting(true)
    try {
      await productService.update(id, formData)
      showToast('Product updated successfully', 'success')
      setEditDrawer({ open: false, product: null })
      await Promise.all([loadProducts(filterTag), loadStats()])
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update product'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleProductDelete = async () => {
    if (!deleteModal.product) return
    setSubmitting(true)
    try {
      await productService.delete(deleteModal.product.id)
      showToast('Product deleted successfully', 'success')
      setDeleteModal({ open: false, product: null })
      await Promise.all([loadProducts(filterTag), loadStats()])
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete product'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const productList = Array.isArray(products) ? products : []

  const filtered = useMemo(() => {
    const result = productList.filter((p) => {
      const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()) || p.model.toLowerCase().includes(search.toLowerCase())
      const matchCategory = filterCategory === 'all' || p.category === filterCategory
      const matchTag = filterTag === 'all'
        || (filterTag === 'trending' && p.trending)
        || (filterTag === 'newArrival' && p.newArrival)
        || (filterTag === 'bestSelling' && p.bestSelling)
        || (filterTag === 'featured' && p.featured)
      return matchSearch && matchCategory && matchTag
    })
    console.log(`[filter] tag="${filterTag}" category="${filterCategory}" search="${search}" total=${productList.length} filtered=${result.length}`)
    return result
  }, [productList, search, filterCategory, filterTag])

  const categoryNames = categoryOptions.map((c) => c.name)
  const subcategoryNames = subcategoryOptions.map((s) => s.name)
  const statValues = stats ? [
    { ...statConfig[0], value: stats.total_products },
    { ...statConfig[1], value: stats.active_products },
    { ...statConfig[2], value: stats.trending_products },
    { ...statConfig[3], value: stats.best_selling_products },
    { ...statConfig[4], value: stats.low_stock_products },
    { ...statConfig[5], value: stats.total_variants },
  ] : productStats

  return (
    <PageLayout title="Product Management">
      <Toast message={toast?.message || ''} type={toast?.type || 'success'} visible={!!toast} onClose={() => setToast(null)} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <span className="hover:text-text-secondary transition-colors cursor-pointer">Dashboard</span>
              <span>/</span>
              <span className="text-text-secondary font-medium">Product Management</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">Product Management</h1>
            <p className="text-sm text-text-muted mt-0.5">Add and manage mobile products, accessories, and variants efficiently.</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer"
            ><FiPlus size={15} /> {showForm ? 'Hide Form' : 'Add Product'}</motion.button>
            <button onClick={fetchData} className="p-2.5 rounded-xl bg-bg-card border border-border text-text-muted hover:text-text-secondary transition-colors cursor-pointer" aria-label="Refresh">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statValues.map((s, i) => <StatWidget key={s.label} {...s} delay={i * 0.05} />)}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <ProductForm onSubmit={handleProductCreate} loading={submitting} categoryOptions={categoryOptions} subcategoryOptions={subcategoryOptions} categoryNames={categoryNames} subcategoryNames={subcategoryNames} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <FilterBar search={search} onSearchChange={setSearch} filterCategory={filterCategory} onFilterCategoryChange={setFilterCategory} categories={categoryNames.length > 0 ? categoryNames : categories} />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 0.95 }}
          className="flex items-center gap-1 p-1 rounded-xl bg-bg-card border border-border flex-shrink-0"
        >
          {([{ mode: 'table' as const, icon: FiList, label: 'Table' }, { mode: 'cards' as const, icon: FiGrid, label: 'Cards' }]).map(({ mode, icon: Icon, label }) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${viewMode === mode ? 'bg-primary text-white' : 'text-text-muted hover:text-text-secondary hover:bg-primary/10'}`}
            ><Icon size={14} /><span className="hidden sm:inline">{label}</span></button>
          ))}
        </motion.div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mt-3">
        {[
          { key: 'all', label: 'All', icon: '📋' },
          { key: 'trending', label: 'Trending', icon: '🔥' },
          { key: 'newArrival', label: 'New Arrival', icon: '✨' },
          { key: 'bestSelling', label: 'Best Selling', icon: '🏆' },
          { key: 'featured', label: 'Featured', icon: '⭐' },
        ].map(({ key, label, icon }) => (
          <motion.button key={key} whileTap={{ scale: 0.95 }}
            onClick={() => setFilterTag(key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterTag === key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-bg-card border border-border text-text-muted hover:text-text-secondary hover:border-primary/30'
            }`}
          ><span>{icon}</span> {label}</motion.button>
        ))}
        {filterTag !== 'all' && (
          <span className="text-[10px] text-text-muted ml-1">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onAction={() => setShowForm(true)} />
      ) : viewMode === 'table' ? (
        <motion.div key="table-view" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
          <ProductTable data={filtered}
            onEdit={handleEdit}
            onDelete={(p) => setDeleteModal({ open: true, product: p })}
          />
        </motion.div>
      ) : (
        <motion.div key="cards-view" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i}
              onEdit={handleEdit}
              onDelete={(p) => setDeleteModal({ open: true, product: p })}
            />
          ))}
        </motion.div>
      )}

      <div className="flex items-center justify-between text-xs text-text-muted pt-2">
        <span>Showing {filtered.length} of {productList.length} products</span>
        <div className="flex items-center gap-1"><FiSmartphone size={12} /> <span>Mobile Shop Management</span></div>
      </div>

      <EditProductDrawer
        open={editDrawer.open}
        product={editDrawer.product}
        onClose={() => setEditDrawer({ open: false, product: null })}
        onSave={handleProductUpdate}
        loading={submitting}
        categoryOptions={categoryOptions}
        subcategoryOptions={subcategoryOptions}
        categoryNames={categoryNames}
        subcategoryNames={subcategoryNames}
      />
      <DeleteModal
        open={deleteModal.open}
        product={deleteModal.product}
        onClose={() => setDeleteModal({ open: false, product: null })}
        onConfirm={handleProductDelete}
      />
    </PageLayout>
  )
}

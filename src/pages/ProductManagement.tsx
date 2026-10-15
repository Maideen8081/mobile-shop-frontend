import { useState, useEffect, useCallback, useMemo } from 'react'
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
import { categoryService, subCategoryService, type SubCategory } from '../services/categoryService'
import type { Product } from '../data/productData'
import { apiErrorMessage } from '../utils/checkout'
import { serverFieldErrors, type Errors } from '../utils/catalogValidation'

type ViewMode = 'table' | 'cards'
type Tag = 'all' | 'trending' | 'newArrival' | 'bestSelling' | 'featured' | 'hidden'

const statConfig = [
  { label: 'Total Products', icon: 'FiPackage', color: '#CB202D', bgGlow: 'rgba(203,32,45,0.12)' },
  { label: 'Published', icon: 'FiCheckCircle', color: '#CB202D', bgGlow: 'rgba(203,32,45,0.12)' },
  { label: 'Trending', icon: 'FiTrendingUp', color: '#A81D2A', bgGlow: 'rgba(203,32,45,0.10)' },
  { label: 'Best Selling', icon: 'FiAward', color: '#CB202D', bgGlow: 'rgba(203,32,45,0.08)' },
  { label: 'Low Stock Products', icon: 'FiAlertTriangle', color: '#ef4444', bgGlow: 'rgba(239,68,68,0.12)' },
  { label: 'Total Variants', icon: 'FiLayers', color: '#A81D2A', bgGlow: 'rgba(203,32,45,0.06)' },
]

const TAGS: { key: Tag; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '📋' },
  { key: 'trending', label: 'Trending', icon: '🔥' },
  { key: 'newArrival', label: 'New Arrival', icon: '✨' },
  { key: 'bestSelling', label: 'Best Selling', icon: '🏆' },
  { key: 'featured', label: 'Featured', icon: '⭐' },
  { key: 'hidden', label: 'Hidden', icon: '🙈' },
]

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<ProductStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterTag, setFilterTag] = useState<Tag>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editDrawer, setEditDrawer] = useState<{ open: boolean; product: Product | null; error?: string }>({ open: false, product: null })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<{ id: number; name: string }[]>([])
  const [subcategoryOptions, setSubcategoryOptions] = useState<SubCategory[]>([])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), type === 'error' ? 6000 : 4000)
  }

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await productService.listAllForAdmin())
      setLoadError('')
    } catch (err) {
      setLoadError(apiErrorMessage(err, 'Could not load products. Check your connection and try again.'))
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      setStats(await productService.dashboardCounts())
    } catch {
      setStats(null)
    }
  }, [])

  const loadOptions = useCallback(async () => {
    try {
      const [cats, subs] = await Promise.all([categoryService.dropdown(), subCategoryService.list()])
      setCategoryOptions(cats.map((c: { id: number; category_name?: string; name?: string }) => ({ id: c.id, name: c.category_name ?? c.name ?? '' })))
      setSubcategoryOptions(subs)
    } catch (err) {
      showToast(apiErrorMessage(err, 'Failed to load categories'), 'error')
    }
  }, [])

  // Initial load: `loading` already starts true.
  useEffect(() => {
    Promise.all([loadProducts(), loadStats(), loadOptions()]).finally(() => setLoading(false))
  }, [loadProducts, loadStats, loadOptions])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([loadProducts(), loadStats(), loadOptions()])
    setLoading(false)
  }

  const afterWrite = () => Promise.all([loadProducts(), loadStats()])

  const handleCreate = async (formData: FormData): Promise<Errors | null> => {
    setSubmitting(true)
    try {
      await productService.create(formData)
      showToast('Product created successfully', 'success')
      setShowForm(false)
      await afterWrite()
      return null
    } catch (err) {
      showToast(apiErrorMessage(err, 'Failed to create product'), 'error')
      return serverFieldErrors(err)
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = useCallback(async (product: Product) => {
    setEditDrawer({ open: true, product: null })
    try {
      // Fetch the full product: the edit form needs image ids, features and care instructions.
      setEditDrawer({ open: true, product: await productService.getById(product.id) })
    } catch (err) {
      setEditDrawer({ open: true, product: null, error: apiErrorMessage(err, 'Could not load this product.') })
    }
  }, [])

  const handleUpdate = async (id: number, formData: FormData): Promise<Errors | null> => {
    setSubmitting(true)
    try {
      await productService.update(id, formData)
      showToast('Product updated successfully', 'success')
      setEditDrawer({ open: false, product: null })
      await afterWrite()
      return null
    } catch (err) {
      showToast(apiErrorMessage(err, 'Failed to update product'), 'error')
      return serverFieldErrors(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.product) return
    setSubmitting(true)
    try {
      await productService.delete(deleteModal.product.id)
      showToast('Product deleted successfully', 'success')
      setDeleteModal({ open: false, product: null })
      await afterWrite()
    } catch (err) {
      showToast(apiErrorMessage(err, 'Failed to delete product'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const categoryNames = useMemo(
    () => Array.from(new Set([...categoryOptions.map((c) => c.name), ...products.map((p) => p.category).filter(Boolean)])),
    [categoryOptions, products],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchSearch = !q || [p.name, p.brand, p.model].some((s) => s.toLowerCase().includes(q))
      const matchCategory = filterCategory === 'all' || p.category === filterCategory
      const matchTag = filterTag === 'all'
        || (filterTag === 'hidden' ? p.status !== 'active' : p[filterTag])
      return matchSearch && matchCategory && matchTag
    })
  }, [products, search, filterCategory, filterTag])

  const statValues = stats ? [
    { ...statConfig[0], value: stats.total_products },
    { ...statConfig[1], value: stats.active_products },
    { ...statConfig[2], value: stats.trending_products },
    { ...statConfig[3], value: stats.best_selling_products },
    { ...statConfig[4], value: stats.low_stock_products ?? 0 },
    { ...statConfig[5], value: stats.total_variants },
  ] : []

  const hasFilters = !!search || filterCategory !== 'all' || filterTag !== 'all'

  return (
    <PageLayout title="Product Management">
      <Toast message={toast?.message || ''} type={toast?.type || 'success'} visible={!!toast} onClose={() => setToast(null)} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <span>Dashboard</span>
              <span>/</span>
              <span className="text-text-secondary font-medium">Product Management</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">Product Management</h1>
            <p className="text-sm text-text-muted mt-0.5">Add and manage mobile products, accessories, and variants.</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowForm(!showForm)}
              disabled={!showForm && categoryOptions.length === 0 && !loading}
              title={categoryOptions.length === 0 ? 'Create an active category first' : undefined}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            ><FiPlus size={15} /> {showForm ? 'Hide Form' : 'Add Product'}</motion.button>
            <button onClick={fetchData} className="p-2.5 rounded-xl bg-bg-card border border-border text-text-muted hover:text-text-secondary transition-colors cursor-pointer" aria-label="Refresh">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </motion.div>

      {statValues.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statValues.map((s, i) => <StatWidget key={s.label} {...s} delay={i * 0.05} />)}
        </div>
      )}

      {loadError && (
        <div role="alert" className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-500">
          {loadError}
          <button onClick={fetchData} className="ml-2 underline cursor-pointer">Retry</button>
        </div>
      )}

      {!loading && categoryOptions.length === 0 && !loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          There are no active categories yet. Create one in Category Management before adding products.
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <ProductForm mode="create" onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={submitting}
              categoryOptions={categoryOptions} subcategoryOptions={subcategoryOptions} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <FilterBar search={search} onSearchChange={setSearch} filterCategory={filterCategory} onFilterCategoryChange={setFilterCategory} categories={categoryNames} />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-card border border-border flex-shrink-0">
          {([{ mode: 'table' as const, icon: FiList, label: 'Table' }, { mode: 'cards' as const, icon: FiGrid, label: 'Cards' }]).map(({ mode, icon: Icon, label }) => (
            <button key={mode} onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${viewMode === mode ? 'bg-primary text-white' : 'text-text-muted hover:text-text-secondary hover:bg-primary/10'}`}
            ><Icon size={14} /><span className="hidden sm:inline">{label}</span></button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {TAGS.map(({ key, label, icon }) => (
          <motion.button key={key} whileTap={{ scale: 0.95 }} onClick={() => setFilterTag(key)} aria-pressed={filterTag === key}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterTag === key ? 'bg-primary text-white shadow-sm' : 'bg-bg-card border border-border text-text-muted hover:text-text-secondary hover:border-primary/30'
            }`}
          ><span>{icon}</span> {label}</motion.button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        loadError ? null : <EmptyState onAction={() => setShowForm(true)} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-text-muted">
          No products match these filters.
          {hasFilters && (
            <button onClick={() => { setSearch(''); setFilterCategory('all'); setFilterTag('all') }} className="ml-1 text-primary font-medium underline cursor-pointer">Clear filters</button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <ProductTable data={filtered} onEdit={openEdit} onDelete={(p) => setDeleteModal({ open: true, product: p })} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} onEdit={openEdit} onDelete={(p) => setDeleteModal({ open: true, product: p })} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-text-muted pt-2">
        <span>Showing {filtered.length} of {products.length} products</span>
        <div className="flex items-center gap-1"><FiSmartphone size={12} /> <span>Mobile Shop Management</span></div>
      </div>

      <EditProductDrawer
        open={editDrawer.open}
        product={editDrawer.product}
        loadError={editDrawer.error}
        onClose={() => setEditDrawer({ open: false, product: null })}
        onSave={handleUpdate}
        loading={submitting}
        categoryOptions={categoryOptions}
        subcategoryOptions={subcategoryOptions}
      />
      <DeleteModal
        open={deleteModal.open}
        product={deleteModal.product}
        onClose={() => setDeleteModal({ open: false, product: null })}
        onConfirm={handleDelete}
        loading={submitting}
      />
    </PageLayout>
  )
}

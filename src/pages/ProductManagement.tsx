import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiPlus, FiRefreshCw, FiPackage, FiCheckCircle, FiTrendingUp, FiAward, FiAlertTriangle, FiLayers } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import {
  Btn, ErrorBanner, ExportBtn, FilterMenu, FilterSelect, KpiCard, PageHeader, Pagination, SearchBox, ShowingSelect, Skeleton,
  ToolbarBtn, exportCsv, useTable, type Tone,
} from '../components/admin/AdminUI'
import ProductTable, { productMinPrice, productSorters, productStock } from '../components/product/ProductTable'
import ProductCard from '../components/product/ProductCard'
import EmptyState from '../components/product/EmptyState'
import DeleteModal from '../components/product/DeleteModal'
import Toast from '../components/category/Toast'
import { productService } from '../services/productService'
import type { ProductStats } from '../services/productService'
import { categoryService } from '../services/categoryService'
import type { Product } from '../data/productData'
import { apiErrorMessage } from '../utils/checkout'

type Tag = 'all' | 'trending' | 'newArrival' | 'bestSelling' | 'featured' | 'hidden'

const statConfig: { label: string; icon: React.ReactNode; tone: Tone }[] = [
  { label: 'Total products', icon: <FiPackage size={16} />, tone: 'neutral' },
  { label: 'Published', icon: <FiCheckCircle size={16} />, tone: 'success' },
  { label: 'Trending', icon: <FiTrendingUp size={16} />, tone: 'brand' },
  { label: 'Best selling', icon: <FiAward size={16} />, tone: 'violet' },
  { label: 'Low stock', icon: <FiAlertTriangle size={16} />, tone: 'warning' },
  { label: 'Variants', icon: <FiLayers size={16} />, tone: 'info' },
]

const TAGS: { key: Tag; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'trending', label: 'Trending' },
  { key: 'newArrival', label: 'New arrival' },
  { key: 'bestSelling', label: 'Best selling' },
  { key: 'featured', label: 'Featured' },
  { key: 'hidden', label: 'Inactive' },
]

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<ProductStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterTag, setFilterTag] = useState<Tag>('all')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<{ id: number; name: string }[]>([])

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
      const cats = await categoryService.dropdown()
      setCategoryOptions(cats.map((c: { id: number; category_name?: string; name?: string }) => ({ id: c.id, name: c.category_name ?? c.name ?? '' })))
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

  // Create and edit live on their own pages (ProductEditorPage).
  const openCreate = () => navigate('/admin/products/new')
  const openEdit = useCallback((product: Product) => navigate(`/admin/products/${product.id}/edit`), [navigate])

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

  const hasFilters = !!search || filterCategory !== 'all' || filterTag !== 'all'
  const table = useTable(filtered, { sorters: productSorters, resetKey: `${search}|${filterCategory}|${filterTag}` })
  const resetFilters = () => { setSearch(''); setFilterCategory('all'); setFilterTag('all') }

  const exportProducts = () =>
    exportCsv(
      'products',
      ['Product ID', 'Name', 'Brand', 'Model', 'Category', 'Subcategory', 'Variants', 'Stock', 'Price from (INR)', 'Status'],
      table.sorted.map((p) => [`PRD${String(p.id).padStart(5, '0')}`, p.name, p.brand, p.model, p.category, p.subcategory, p.variants.length, productStock(p), productMinPrice(p), p.status]),
    )

  // Old "?new=1" links (bookmarks, quick-create) now go to the create page.
  useEffect(() => {
    if (searchParams.get('new') === '1') navigate('/admin/products/new', { replace: true })
  }, [searchParams, navigate])

  return (
    <PageLayout title="Product">
      <Toast message={toast?.message || ''} type={toast?.type || 'success'} visible={!!toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Product"
        actions={
          <>
            <SearchBox value={search} onChange={setSearch} placeholder="Search products" />
            <ShowingSelect value={table.pageSize} onChange={table.setPageSize} />
            <FilterMenu activeCount={(filterCategory !== 'all' ? 1 : 0) + (filterTag !== 'all' ? 1 : 0)} onReset={() => { setFilterCategory('all'); setFilterTag('all') }}>
              <FilterSelect
                label="Category"
                value={filterCategory}
                onChange={setFilterCategory}
                options={[{ value: 'all', label: 'All categories' }, ...categoryNames.map((c) => ({ value: c, label: c }))]}
              />
              <FilterSelect
                label="Collection"
                value={filterTag}
                onChange={(v) => setFilterTag(v as Tag)}
                options={TAGS.map(({ key, label }) => ({
                  value: key,
                  label: `${label} (${key === 'all' ? products.length : products.filter((p) => (key === 'hidden' ? p.status !== 'active' : p[key])).length})`,
                }))}
              />
            </FilterMenu>
            <ExportBtn onClick={exportProducts} disabled={filtered.length === 0} />
            <ToolbarBtn onClick={fetchData} aria-label="Refresh" title="Refresh" className="!px-3" icon={<FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />} />
            <Btn
              variant="primary"
              onClick={openCreate}
              disabled={categoryOptions.length === 0 && !loading}
              title={categoryOptions.length === 0 ? 'Create an active category first' : undefined}
              icon={<FiPlus size={16} />}
              className="h-11 px-5"
            >
              Add New Product
            </Btn>
          </>
        }
      />

      <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {statConfig.map((cfg, i) => (
          <KpiCard
            key={cfg.label}
            loading={!stats && loading}
            label={cfg.label}
            icon={cfg.icon}
            tone={cfg.tone}
            value={stats ? [stats.total_products, stats.active_products, stats.trending_products, stats.best_selling_products, stats.low_stock_products ?? 0, stats.total_variants][i] : '—'}
          />
        ))}
      </div>

      {loadError && <ErrorBanner message={loadError} onRetry={fetchData} />}

      {!loading && categoryOptions.length === 0 && !loadError && (
        <div className="rounded-xl bg-[#fffaeb] ring-1 ring-inset ring-[#fedf89] px-4 py-3 text-sm text-[#b54708]">
          There are no active categories yet. Create one in Categories before adding products.
        </div>
      )}


      {loading ? (
        <div className="table-wrap p-4 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : products.length === 0 ? (
        loadError ? null : <EmptyState onAction={openCreate} />
      ) : filtered.length === 0 ? (
        <div className="table-wrap text-center py-14 text-sm text-text-label">
          No products match these filters.
          {hasFilters && (
            <button onClick={resetFilters} className="ml-1 text-primary font-medium underline cursor-pointer">Clear filters</button>
          )}
        </div>
      ) : (
        <>
          <div className="table-wrap hidden sm:block">
            <ProductTable data={table.rows} sort={table.sort} onSort={table.toggleSort} onEdit={openEdit} onDelete={(p) => setDeleteModal({ open: true, product: p })} />
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage}
              summary={`${table.total} of ${products.length} products`} />
          </div>
          <div className="sm:hidden space-y-3">
            {table.rows.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onEdit={openEdit} onDelete={(p) => setDeleteModal({ open: true, product: p })} />
            ))}
            <div className="table-wrap">
              <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} summary={`${table.total} of ${products.length} products`} />
            </div>
          </div>
        </>
      )}
      </div>

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

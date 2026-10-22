import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiPlus, FiGrid, FiRefreshCw, FiFolder, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import {
  Btn, ErrorBanner, ExportBtn, FilterMenu, FilterSelect, KpiCard, PageHeader, Pagination, SearchBox, ShowingSelect, Skeleton,
  ToolbarBtn, exportCsv, useTable, type Tone,
} from '../components/admin/AdminUI'
import CategoryTable, { categorySorters } from '../components/category/CategoryTable'
import CategoryCard from '../components/category/CategoryCard'
import EmptyState from '../components/category/EmptyState'
import EditCategoryModal from '../components/category/EditCategoryModal'
import DeleteModal from '../components/category/DeleteModal'
import Toast from '../components/category/Toast'
import { categoryService, subCategoryService, type Category, type SubCategory, type CategoryStats } from '../services/categoryService'
import type { CategoryEditData } from '../components/category/EditCategoryModal'
import { apiErrorMessage } from '../utils/checkout'
import { serverFieldErrors, type Errors } from '../utils/catalogValidation'


function safeStats(s: any): CategoryStats | null {
  if (!s || typeof s !== 'object') return null
  return {
    total_categories: Number(s.total_categories) || 0,
    total_subcategories: Number(s.total_sub_categories ?? s.total_subcategories) || 0,
    active_categories: Number(s.active_categories) || 0,
    inactive_categories: Number(s.inactive_categories) || 0,
  }
}

function safeCategories(c: any): Category[] {
  if (!Array.isArray(c)) return []
  return c.filter(Boolean)
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<CategoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editModal, setEditModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null })
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Old "?new=1" links (bookmarks, quick-create) now go to the create page.
  useEffect(() => {
    if (searchParams.get('new') === '1') navigate('/admin/categories/new', { replace: true })
  }, [searchParams, navigate])
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), type === 'error' ? 6000 : 4000)
  }

  const loadList = useCallback(async () => {
    try {
      const [cats, subs] = await Promise.all([categoryService.list(), subCategoryService.list()])
      const byParent = subs.reduce((acc: Record<number, SubCategory[]>, s) => {
        if (s.parentId) (acc[s.parentId] ||= []).push(s)
        return acc
      }, {})
      setCategories(safeCategories(cats).map((cat) => {
        const csubs = byParent[cat.id] || []
        return { ...cat, subcategories: csubs, sub_category_count: csubs.length }
      }))
      setError('')
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load categories. Check your connection and try again.'))
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const s = await categoryService.dashboardCounts()
      setStats(safeStats(s))
    } catch {
      setStats(null)
    }
  }, [])

  // Initial load: `loading` already starts true.
  useEffect(() => {
    Promise.all([loadList(), loadStats()]).finally(() => setLoading(false))
  }, [loadList, loadStats])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([loadList(), loadStats()])
    setLoading(false)
  }

  const refresh = () => Promise.all([loadList(), loadStats()])

  // Creating a category happens on its own page (CategoryEditorPage).
  const openCreate = () => navigate('/admin/categories/new')

  const handleEdit = async (editData: CategoryEditData): Promise<Errors | null> => {
    if (!editModal.category) return null
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('category_name', editData.name)
      fd.append('status', editData.status)
      if (editData.image) fd.append('category_image', editData.image)
      await categoryService.update(editModal.category.id, fd)
      await refresh()
      setEditModal({ open: false, category: null })
      showToast('Category updated successfully', 'success')
      return null
    } catch (err) {
      showToast(apiErrorMessage(err, 'Failed to update category'), 'error')
      return serverFieldErrors(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.category) return
    setSubmitting(true)
    try {
      const res = await categoryService.delete(deleteModal.category.id)
      await refresh()
      setDeleteModal({ open: false, category: null })
      showToast(res?.message || 'Category deleted successfully', 'success')
    } catch (err) {
      showToast(apiErrorMessage(err, 'Failed to delete category'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const catList = Array.isArray(categories) ? categories : []
  const filtered = catList.filter((cat) => {
    if (!cat || typeof cat.name !== 'string') return false
    const matchSearch = cat.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || cat.status === filterStatus
    return matchSearch && matchStatus
  })

  const hasFilters = !!search || filterStatus !== 'all'
  const table = useTable(filtered, { sorters: categorySorters, resetKey: `${search}|${filterStatus}` })

  const exportCategories = () =>
    exportCsv(
      'categories',
      ['Category ID', 'Name', 'Sub categories', 'Products', 'Created', 'Status'],
      table.sorted.map((c) => [`CAT${String(c.id).padStart(4, '0')}`, c.name, c.subcategories.map((s) => s.name).join('; '), c.products, c.created, c.status]),
    )

  const kpis: { label: string; icon: React.ReactNode; tone: Tone; value?: number }[] = [
    { label: 'Total categories', icon: <FiFolder size={16} />, tone: 'brand', value: stats?.total_categories },
    { label: 'Sub categories', icon: <FiGrid size={16} />, tone: 'violet', value: stats?.total_subcategories },
    { label: 'Active', icon: <FiCheckCircle size={16} />, tone: 'success', value: stats?.active_categories },
    { label: 'Inactive', icon: <FiXCircle size={16} />, tone: 'danger', value: stats?.inactive_categories },
  ]

  return (
    <PageLayout title="Category">
      <Toast
        message={toast?.message || ''}
        type={toast?.type || 'success'}
        visible={!!toast}
        onClose={() => setToast(null)}
      />

      <PageHeader
        title="Category"
        actions={
          <>
            <SearchBox value={search} onChange={setSearch} placeholder="Search categories" />
            <ShowingSelect value={table.pageSize} onChange={table.setPageSize} />
            <FilterMenu activeCount={filterStatus !== 'all' ? 1 : 0} onReset={() => setFilterStatus('all')}>
              <FilterSelect
                label="Status"
                value={filterStatus}
                onChange={setFilterStatus}
                options={[{ value: 'all', label: 'All status' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
              />
            </FilterMenu>
            <ExportBtn onClick={exportCategories} disabled={filtered.length === 0} />
            <ToolbarBtn onClick={fetchData} aria-label="Refresh" title="Refresh" className="!px-3" icon={<FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />} />
            <Btn
              variant="primary"
              onClick={openCreate}
              icon={<FiPlus size={16} />}
              className="h-11 px-5"
            >
              Add New Category
            </Btn>
          </>
        }
      />

      <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} loading={!stats && loading} label={k.label} icon={k.icon} tone={k.tone} value={k.value ?? '—'} />
        ))}
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchData} />}


      {loading ? (
        <div className="table-wrap p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : catList.length === 0 ? (
        error ? null : <EmptyState onAction={openCreate} />
      ) : filtered.length === 0 ? (
        <div className="table-wrap text-center py-14 text-sm text-text-label">
          No categories match your search.
          {hasFilters && (
            <button onClick={() => { setSearch(''); setFilterStatus('all') }} className="ml-1 text-primary font-medium underline cursor-pointer">Clear filters</button>
          )}
        </div>
      ) : (
        <>
          <div className="table-wrap hidden sm:block">
            <CategoryTable
              data={table.rows}
              sort={table.sort}
              onSort={table.toggleSort}
              onEdit={(cat) => setEditModal({ open: true, category: cat })}
              onDelete={(cat) => setDeleteModal({ open: true, category: cat })}
            />
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} summary={`${table.total} of ${catList.length} categories`} />
          </div>
          <div className="sm:hidden space-y-3">
            {table.rows.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                index={i}
                onEdit={(cat) => setEditModal({ open: true, category: cat })}
                onDelete={(cat) => setDeleteModal({ open: true, category: cat })}
              />
            ))}
            <div className="table-wrap">
              <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} summary={`${table.total} of ${catList.length} categories`} />
            </div>
          </div>
        </>
      )}
      </div>

      <EditCategoryModal
        open={editModal.open}
        category={editModal.category}
        existingNames={catList.map((c) => c.name)}
        onClose={() => setEditModal({ open: false, category: null })}
        onSave={handleEdit}
        onSubsChanged={refresh}
        loading={submitting}
      />

      <DeleteModal
        open={deleteModal.open}
        category={deleteModal.category}
        onClose={() => setDeleteModal({ open: false, category: null })}
        onConfirm={handleDelete}
        loading={submitting}
      />
    </PageLayout>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiGrid, FiList, FiSmartphone, FiRefreshCw } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import StatWidget from '../components/category/StatWidget'
import SearchFilterBar from '../components/category/SearchFilterBar'
import CategoryCreateForm from '../components/category/CategoryCreateForm'
import CategoryTable from '../components/category/CategoryTable'
import CategoryCard from '../components/category/CategoryCard'
import EmptyState from '../components/category/EmptyState'
import EditCategoryModal from '../components/category/EditCategoryModal'
import DeleteModal from '../components/category/DeleteModal'
import Toast from '../components/category/Toast'
import { categoryService, subCategoryService, type Category, type SubCategory, type CategoryStats } from '../services/categoryService'

type ViewMode = 'table' | 'cards'

const statConfig = [
  { label: 'Total Categories', icon: 'FiFolder', color: '#8b5cf6' },
  { label: 'Sub Categories', icon: 'FiGrid', color: '#4f6bff' },
  { label: 'Active Categories', icon: 'FiCheckCircle', color: '#CB202D' },
  { label: 'Inactive', icon: 'FiXCircle', color: '#ef4444' },
]

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
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [editModal, setEditModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null })
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadList = useCallback(async () => {
    try {
      const [cats, subs] = await Promise.all([
        categoryService.list(),
        subCategoryService.list().catch(() => []),
      ])
      const categorySubs = Array.isArray(subs)
        ? subs.reduce((acc: Record<number, SubCategory[]>, s: any) => {
            const parentId = s.parent_category ?? s.parentCategory ?? s.parent_id
            if (parentId) {
              if (!acc[parentId]) acc[parentId] = []
              acc[parentId].push({
                id: s.id,
                name: s.sub_category_name ?? s.name,
                products: s.products ?? s.product_count ?? 0,
              })
            }
            return acc
          }, {})
        : {}
      const merged = safeCategories(cats).map((cat) => {
        const csubs = categorySubs[cat.id] || []
        return {
          ...cat,
          subcategories: csubs,
          sub_category_count: csubs.length,
        }
      })
      setCategories(merged)
    } catch {
      setCategories([])
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

  const fetchData = useCallback(async () => {
    setLoading(true); setError('')
    await Promise.all([loadList(), loadStats()])
    setLoading(false)
  }, [loadList, loadStats])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCombinedCreate = async (data: {
    name: string
    status: boolean
    image: File | null
    subCategoryName: string
  }) => {
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('category_name', data.name)
      fd.append('status', data.status ? 'active' : 'inactive')
      if (data.image) fd.append('category_image', data.image)
      const created = await categoryService.create(fd)
      await loadList()

      if (data.subCategoryName) {
        await subCategoryService.create({
          parentId: created.id,
          name: data.subCategoryName,
          status: true,
        })
        await loadList()
        showToast('Category and subcategory created successfully', 'success')
      } else {
        showToast('Category created successfully', 'success')
      }
      await loadStats()
      setShowForm(false)
    } catch {
      showToast('Failed to create category', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (editData: { name: string; status: 'active' | 'inactive'; image?: File | null; imageRemoved?: boolean }) => {
    if (!editModal.category) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('category_name', editData.name)
      fd.append('status', editData.status)
      if (editData.image) {
        fd.append('category_image', editData.image)
      } else if (editData.imageRemoved) {
        fd.append('category_image', '')
      }
      await categoryService.update(editModal.category.id, fd)
      await Promise.all([loadList(), loadStats()])
      setEditModal({ open: false, category: null })
      showToast('Category updated successfully', 'success')
    } catch {
      showToast('Failed to update category', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.category) return
    setSubmitting(true)
    try {
      await categoryService.delete(deleteModal.category.id)
      await Promise.all([loadList(), loadStats()])
      setDeleteModal({ open: false, category: null })
      showToast('Category deleted successfully', 'success')
    } catch {
      showToast('Failed to delete category', 'error')
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

  const statValues = stats ? [
    { ...statConfig[0], value: stats.total_categories },
    { ...statConfig[1], value: stats.total_subcategories },
    { ...statConfig[2], value: stats.active_categories },
    { ...statConfig[3], value: stats.inactive_categories },
  ] : []

  return (
    <PageLayout title="Category Management">
      <Toast
        message={toast?.message || ''}
        type={toast?.type || 'success'}
        visible={!!toast}
        onClose={() => setToast(null)}
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <span className="hover:text-text-secondary transition-colors cursor-pointer">Dashboard</span>
              <span className="text-text-secondary">/</span>
              <span className="text-text-muted font-medium">Category Management</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">Category Management</h1>
            <p className="text-sm text-text-muted mt-0.5">
              Create and manage product categories and subcategories for your mobile shop inventory.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setShowForm(!showForm); setError('') }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-medium transition-all cursor-pointer shadow-sm"
            >
              <FiPlus size={15} />
              {showForm ? 'Hide Form' : 'Create Category'}
            </motion.button>
            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
              aria-label="Refresh"
            >
              <FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statValues.map((stat, i) => (
          <StatWidget key={stat.label} {...stat} delay={i * 0.06} />
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline hover:text-red-300">Dismiss</button>
        </div>
      )}

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <CategoryCreateForm
            onSubmit={handleCombinedCreate}
            loading={submitting}
          />
        </motion.div>
      )}

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
      />

      <div className="flex items-center justify-end gap-1 bg-white/5 rounded-lg p-0.5 w-fit ml-auto">
        {(['table', 'cards'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              viewMode === mode ? 'bg-bg-card text-text-primary shadow-sm border border-border' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {mode === 'table' ? <FiList size={13} /> : <FiGrid size={13} />}
            {mode}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onAction={() => setShowForm(true)} />
      ) : viewMode === 'table' ? (
        <div className="hidden sm:block">
          <CategoryTable
            data={filtered}
            onEdit={(cat) => setEditModal({ open: true, category: cat })}
            onDelete={(cat) => setDeleteModal({ open: true, category: cat })}
          />
        </div>
      ) : null}

      {(viewMode === 'cards' || filtered.length > 0) && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${viewMode === 'table' ? 'sm:hidden' : ''}`}>
          {filtered.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              index={i}
              onEdit={(cat) => setEditModal({ open: true, category: cat })}
              onDelete={(cat) => setDeleteModal({ open: true, category: cat })}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-text-muted pt-2">
        <span>Showing {filtered.length} of {catList.length} categories</span>
        <div className="flex items-center gap-1">
          <FiSmartphone size={12} />
          <span>Mobile Shop Management</span>
        </div>
      </div>

      <EditCategoryModal
        open={editModal.open}
        category={editModal.category}
        onClose={() => setEditModal({ open: false, category: null })}
        onSave={handleEdit}
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

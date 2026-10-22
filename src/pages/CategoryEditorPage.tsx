import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiImage, FiLayers } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import { ErrorBanner, PageHeader, Skeleton } from '../components/admin/AdminUI'
import CategoryCreateForm, { type CategoryCreateData } from '../components/category/CategoryCreateForm'
import { categoryService, subCategoryService } from '../services/categoryService'
import { useToast } from '../context/ToastContext'
import { apiErrorMessage } from '../utils/checkout'
import { serverFieldErrors, type Errors } from '../utils/catalogValidation'

const TIPS = [
  { icon: <FiCheckCircle size={15} />, title: 'Name it the way shoppers search', text: 'Short and plural, e.g. “Smartphones”, “Power Banks”. Names must be unique.' },
  { icon: <FiImage size={15} />, title: 'Use a clean square image', text: 'Shown on the storefront category tiles. JPG, PNG or WebP up to 2 MB.' },
  { icon: <FiLayers size={15} />, title: 'Add sub categories now or later', text: 'Up to 5 here; you can add, rename or remove them from the list page.' },
]

/** Full-page "Add category" screen (previously an inline form above the table). */
export default function CategoryEditorPage() {
  const navigate = useNavigate()
  const showToast = useToast().show
  const [existingNames, setExistingNames] = useState<string[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadNames = useCallback(async () => {
    setLoadError('')
    try {
      const cats = await categoryService.list()
      setExistingNames((Array.isArray(cats) ? cats : []).map((c: { name: string }) => c.name))
    } catch (err) {
      // Duplicate names are still rejected by the server; this list only gives early feedback.
      setExistingNames([])
      setLoadError(apiErrorMessage(err, 'Could not load existing categories — duplicate names will be checked on save.'))
    }
  }, [])

  useEffect(() => {
    loadNames()
  }, [loadNames])

  const handleCreate = async (data: CategoryCreateData): Promise<Errors | null> => {
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('category_name', data.name)
      fd.append('status', data.status ? 'active' : 'inactive')
      fd.append('category_image', data.image)
      let created
      try {
        created = await categoryService.create(fd)
      } catch (err) {
        const fieldErrors = serverFieldErrors(err)
        showToast(apiErrorMessage(err, 'Failed to create category'), 'error')
        return Object.keys(fieldErrors).length ? fieldErrors : {}
      }

      const failedSubs: string[] = []
      for (const name of data.subCategoryNames) {
        try {
          await subCategoryService.create({ parentId: created.id, name, status: true })
        } catch (err) {
          failedSubs.push(`${name} (${apiErrorMessage(err, 'failed')})`)
        }
      }
      if (failedSubs.length) {
        showToast(`Category created, but these sub categories failed: ${failedSubs.join(', ')}`, 'error')
      } else {
        const n = data.subCategoryNames.length
        showToast(n ? `“${data.name}” created with ${n} sub categor${n === 1 ? 'y' : 'ies'}` : `“${data.name}” created`, 'success')
      }
      navigate('/admin/categories')
      return null
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageLayout title="Add category">
      <Link to="/admin/categories" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-label hover:text-primary mb-3">
        <FiArrowLeft size={15} /> Back to categories
      </Link>
      <PageHeader title="Add category" description="Create a new category to organise products on the storefront." />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <div className="space-y-4 min-w-0">
          {loadError && <ErrorBanner message={loadError} onRetry={loadNames} />}
          {existingNames === null ? (
            <div className="admin-card p-6 space-y-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-40" />
              <Skeleton className="h-10" />
            </div>
          ) : (
            <CategoryCreateForm onSubmit={handleCreate} loading={submitting} existingNames={existingNames} />
          )}
        </div>

        <aside className="admin-card p-5 xl:sticky xl:top-24">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-label mb-4">Good to know</p>
          <ul className="space-y-4">
            {TIPS.map((t) => (
              <li key={t.title} className="flex gap-3">
                <span className="w-8 h-8 rounded-lg bg-primary-container text-primary flex items-center justify-center shrink-0">{t.icon}</span>
                <span>
                  <span className="block text-sm font-medium text-text-primary">{t.title}</span>
                  <span className="block text-xs text-text-label mt-0.5">{t.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </PageLayout>
  )
}

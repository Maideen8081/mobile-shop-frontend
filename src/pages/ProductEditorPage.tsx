import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import { Btn, ErrorBanner, PageHeader, Skeleton } from '../components/admin/AdminUI'
import ProductForm from '../components/product/ProductForm'
import { productService } from '../services/productService'
import { categoryService, subCategoryService, type SubCategory } from '../services/categoryService'
import type { Product } from '../data/productData'
import { useToast } from '../context/ToastContext'
import { apiErrorMessage } from '../utils/checkout'
import { serverFieldErrors, type Errors } from '../utils/catalogValidation'

/**
 * Full-page product editor: /admin/products/new and /admin/products/:id/edit.
 * Replaces the inline create form and the edit drawer on the list page.
 */
export default function ProductEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const showToast = useToast().show

  const [product, setProduct] = useState<Product | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<{ id: number; name: string }[]>([])
  const [subcategoryOptions, setSubcategoryOptions] = useState<SubCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const productId = Number(id)
      if (isEdit && (!Number.isInteger(productId) || productId <= 0)) throw new Error('Invalid product link.')
      const [cats, subs, existing] = await Promise.all([
        categoryService.dropdown(),
        subCategoryService.list(),
        isEdit ? productService.getById(productId) : Promise.resolve(null),
      ])
      setCategoryOptions(cats.map((c: { id: number; category_name?: string; name?: string }) => ({ id: c.id, name: c.category_name ?? c.name ?? '' })))
      setSubcategoryOptions(subs)
      setProduct(existing)
    } catch (err) {
      setLoadError(apiErrorMessage(err, isEdit ? 'Could not load this product.' : 'Could not load categories.'))
    } finally {
      setLoading(false)
    }
  }, [id, isEdit])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (formData: FormData): Promise<Errors | null> => {
    setSubmitting(true)
    try {
      if (isEdit && product) {
        await productService.update(product.id, formData)
        showToast(`“${product.name}” updated`, 'success')
      } else {
        await productService.create(formData)
        showToast('Product created', 'success')
      }
      navigate('/admin/products')
      return null
    } catch (err) {
      showToast(apiErrorMessage(err, isEdit ? 'Failed to update product' : 'Failed to create product'), 'error')
      return serverFieldErrors(err)
    } finally {
      setSubmitting(false)
    }
  }

  const title = isEdit ? 'Edit product' : 'Add product'
  const noCategories = !loading && !loadError && categoryOptions.length === 0 && !isEdit

  return (
    <PageLayout title={title}>
      <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-label hover:text-primary mb-3">
        <FiArrowLeft size={15} /> Back to products
      </Link>
      <PageHeader
        title={isEdit && product ? product.name : title}
        description={
          isEdit
            ? product ? `${product.brand} · ${product.model}. Changes go live on the storefront when you save.` : 'Loading product…'
            : 'Fill in the basics, then add at least one variant with its price, stock and images.'
        }
      />

      {loadError ? (
        <ErrorBanner message={loadError} onRetry={load} />
      ) : loading ? (
        <div className="admin-card p-6 space-y-4">
          <Skeleton className="h-10" />
          <div className="grid grid-cols-2 gap-4"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      ) : noCategories ? (
        <div className="admin-card p-8 text-center">
          <p className="text-sm font-semibold text-text-primary">Create a category first</p>
          <p className="mt-1 text-sm text-text-label">Every product needs an active category before it can be added.</p>
          <Btn variant="primary" className="mt-5" onClick={() => navigate('/admin/categories/new')}>Add category</Btn>
        </div>
      ) : (
        <ProductForm
          key={product?.id ?? 'new'}
          mode={isEdit ? 'edit' : 'create'}
          initial={product}
          categoryOptions={categoryOptions}
          subcategoryOptions={subcategoryOptions}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/products')}
          loading={submitting}
        />
      )}
    </PageLayout>
  )
}

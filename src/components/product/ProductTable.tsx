import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import StatusBadge, { TagBadge } from './StatusBadge'
import { RowMenu, SortTh, Thumb, type SortState } from '../admin/AdminUI'
import type { Product } from '../../data/productData'

export const productThumb = (p: Product) => p.coverImage || p.images?.[0] || p.variants[0]?.images?.[0] || null
export const productStock = (p: Product) => p.variants.reduce((s, v) => s + (v.stock || 0), 0)
export const productMinPrice = (p: Product) => {
  const prices = p.variants.map((v) => v.discountPrice || v.price).filter(Boolean)
  return prices.length ? Math.min(...prices) : 0
}

/** Column key → value used for sorting (see useTable). */
export const productSorters: Record<string, (p: Product) => string | number> = {
  name: (p) => p.name,
  id: (p) => p.id,
  price: productMinPrice,
  stock: productStock,
  category: (p) => p.category,
  variants: (p) => p.variants.length,
  status: (p) => p.status,
}

interface ProductTableProps {
  data: Product[]
  sort: SortState
  onSort: (key: string) => void
  onEdit?: (p: Product) => void
  onDelete?: (p: Product) => void
}

export default function ProductTable({ data, sort, onSort, onEdit, onDelete }: ProductTableProps) {
  const th = { sort, onSort }
  return (
    <div className="table-scroll">
      <table className="min-w-[920px]">
        <thead>
          <tr>
            <SortTh label="Product Name" sortKey="name" {...th} />
            <SortTh label="Product ID" sortKey="id" {...th} />
            <SortTh label="Price" sortKey="price" {...th} />
            <SortTh label="Stock" sortKey="stock" {...th} />
            <SortTh label="Category" sortKey="category" {...th} />
            <SortTh label="Variants" sortKey="variants" {...th} />
            <SortTh label="Status" sortKey="status" {...th} />
            <SortTh label="Action" align="center" />
          </tr>
        </thead>
        <tbody>
          {data.map((p) => {
            const stock = productStock(p)
            const minPrice = productMinPrice(p)
            const isLow = p.variants.some((v) => v.lowStockAlert && v.stock <= v.lowStockAlert)
            return (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-3 min-w-[220px]">
                    <Thumb src={productThumb(p)} name={p.name} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-text-primary truncate max-w-[220px]">{p.name}</p>
                        {p.trending && <TagBadge label="Trending" color="trending" />}
                        {p.newArrival && <TagBadge label="New" color="new" />}
                      </div>
                      <p className="text-xs text-text-muted truncate">{[p.brand, p.model].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap">#PRD{String(p.id).padStart(5, '0')}</td>
                <td className="whitespace-nowrap">{minPrice > 0 ? `₹${minPrice.toLocaleString('en-IN')}` : '—'}</td>
                <td className="whitespace-nowrap">
                  <span className={stock === 0 ? 'text-danger font-medium' : isLow ? 'text-warning font-medium' : ''}>
                    {stock.toLocaleString('en-IN')} pcs
                  </span>
                </td>
                <td>{p.category || '—'}</td>
                <td>{p.variants.length}</td>
                <td><StatusBadge status={p.status} /></td>
                <td className="text-center">
                  <RowMenu
                    label={`Actions for ${p.name}`}
                    items={[
                      { label: 'Edit product', icon: <FiEdit2 size={15} />, onClick: () => onEdit?.(p) },
                      { label: 'Delete', icon: <FiTrash2 size={15} />, onClick: () => onDelete?.(p), danger: true },
                    ]}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

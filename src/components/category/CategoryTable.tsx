import { Fragment, useState } from 'react'
import { FiEdit2, FiTrash2, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import StatusBadge from './StatusBadge'
import { RowMenu, SortTh, Thumb, type SortState } from '../admin/AdminUI'
import type { Category } from '../../services/categoryService'

/** Column key → value used for sorting (see useTable). */
export const categorySorters: Record<string, (c: Category) => string | number> = {
  name: (c) => c.name,
  id: (c) => c.id,
  subs: (c) => c.sub_category_count,
  products: (c) => c.products,
  created: (c) => {
    const t = Date.parse(c.created)
    return Number.isNaN(t) ? c.created : t
  },
  status: (c) => c.status,
}

interface CategoryTableProps {
  data: Category[]
  sort: SortState
  onSort: (key: string) => void
  onEdit?: (cat: Category) => void
  onDelete?: (cat: Category) => void
}

export default function CategoryTable({ data, sort, onSort, onEdit, onDelete }: CategoryTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const th = { sort, onSort }

  return (
    <div className="table-scroll">
      <table className="min-w-[820px]">
        <thead>
          <tr>
            <SortTh label="Category Name" sortKey="name" {...th} />
            <SortTh label="Category ID" sortKey="id" {...th} />
            <SortTh label="Sub Categories" sortKey="subs" {...th} />
            <SortTh label="Products" sortKey="products" {...th} />
            <SortTh label="Created" sortKey="created" {...th} />
            <SortTh label="Status" sortKey="status" {...th} />
            <SortTh label="Action" align="center" />
          </tr>
        </thead>
        <tbody>
          {data.map((cat) => {
            const open = expanded === cat.id && cat.subcategories.length > 0
            return (
              <Fragment key={cat.id}>
                <tr>
                  <td>
                    <div className="flex items-center gap-3">
                      <Thumb src={cat.image} name={cat.name} />
                      <p className="text-sm font-semibold text-text-primary">{cat.name}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">#CAT{String(cat.id).padStart(4, '0')}</td>
                  <td>
                    {cat.sub_category_count > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : cat.id)}
                        aria-expanded={open}
                        className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        {cat.sub_category_count}
                        {open ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                      </button>
                    ) : (
                      0
                    )}
                  </td>
                  <td>{cat.products}</td>
                  <td className="whitespace-nowrap">{cat.created}</td>
                  <td><StatusBadge status={cat.status} /></td>
                  <td className="text-center">
                    <RowMenu
                      label={`Actions for ${cat.name}`}
                      items={[
                        { label: 'Edit category', icon: <FiEdit2 size={15} />, onClick: () => onEdit?.(cat) },
                        { label: 'Delete', icon: <FiTrash2 size={15} />, onClick: () => onDelete?.(cat), danger: true },
                      ]}
                    />
                  </td>
                </tr>
                {open && (
                  <tr className="hover:!bg-transparent">
                    <td colSpan={7} className="!pt-0 bg-[#fcfcfd]">
                      <div className="flex flex-wrap gap-1.5 pl-12 pt-3">
                        {cat.subcategories.map((sub) => (
                          <span key={sub.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#fdecee] text-primary">
                            {sub.name}
                            <span className="opacity-60">({sub.products})</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

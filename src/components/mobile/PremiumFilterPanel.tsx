import { useRef, useEffect, useState } from 'react'
import { X, ChevronDown, ChevronUp, SlidersHorizontal, Tag, DollarSign, Check } from 'lucide-react'
import { createPortal } from 'react-dom'

interface FilterOption {
  label: string
  value: string
  count?: number
}

interface PriceRange {
  min: number
  max: number
}

interface PremiumFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: {
    categories: string[]
    brands: string[]
    priceRange: PriceRange | null
    rating: number
    sortBy: string
    tags: string[]
  }) => void
  initialFilters?: {
    categories: string[]
    brands: string[]
    priceRange: PriceRange | null
    rating: number
    sortBy: string
    tags: string[]
  }
  availableFilters?: {
    categories: FilterOption[]
    brands: FilterOption[]
    priceRanges: PriceRange[]
    tags: FilterOption[]
  }
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
]

const DEFAULT_PRICE_RANGES: PriceRange[] = [
  { min: 0, max: 500 },
  { min: 500, max: 1000 },
  { min: 1000, max: 5000 },
  { min: 5000, max: 10000 },
  { min: 10000, max: 25000 },
  { min: 25000, max: 50000 },
  { min: 50000, max: 100000 },
  { min: 100000, max: Infinity },
]

export default function PremiumFilterPanel({
  isOpen,
  onClose,
  onApply,
  initialFilters = {
    categories: [],
    brands: [],
    priceRange: null,
    rating: 0,
    sortBy: 'newest',
    tags: [],
  },
  availableFilters = {
    categories: [],
    brands: [],
    priceRanges: DEFAULT_PRICE_RANGES,
    tags: [],
  },
}: PremiumFilterPanelProps) {
  const [filters, setFilters] = useState(initialFilters)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true,
    brands: true,
    price: true,
    sort: true,
    tags: true,
  })
  const panelRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true))
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleFilter = (type: 'categories' | 'brands' | 'tags', value: string) => {
    setFilters(prev => {
      const current = prev[type] as string[]
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [type]: next }
    })
  }

  const setPriceRange = (range: PriceRange | null) => {
    setFilters(prev => ({ ...prev, priceRange: range }))
  }

  const setSortBy = (sortBy: string) => {
    setFilters(prev => ({ ...prev, sortBy }))
  }

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: null,
      rating: 0,
      sortBy: 'newest',
      tags: [],
    })
  }

  const hasActiveFilters = filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.priceRange !== null ||
    filters.tags.length > 0

  const activeFilterCount = filters.categories.length +
    filters.brands.length +
    (filters.priceRange ? 1 : 0) +
    filters.tags.length

  if (!isOpen) return null

  const panelContent = (
    <div className="fixed inset-0 z-50">
      <style jsx>{`
        .sheet-overlay {
          transition: opacity 0.3s ease;
        }
        .sheet-overlay.visible { opacity: 1; }
        .sheet-overlay.hidden { opacity: 0; }

        .sheet-panel {
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .sheet-panel.visible { transform: translateY(0); }
        .sheet-panel.hidden { transform: translateY(100%); }

        .handle-bar {
          width: 36px;
          height: 4px;
          border-radius: 999px;
          background: #D1D5DB;
        }
        .filter-chip {
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .filter-chip:active { transform: scale(0.95); }
        .filter-chip.active {
          background: #4F46E5;
          color: white;
          border-color: #4F46E5;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
        }
        .filter-chip.active span { color: white; }
        .price-btn {
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .price-btn:active { transform: scale(0.95); }
        .price-btn.active {
          background: #4F46E5;
          color: white;
          border-color: #4F46E5;
        }
        .sort-row {
          transition: all 0.15s ease;
        }
        .sort-row:active { transform: scale(0.98); }
        .sort-row.active {
          background: #EEF2FF;
          border-color: #4F46E5;
          color: #4F46E5;
        }
        .sort-row.active svg { color: #4F46E5; }
      `}</style>

      <div
        className={`sheet-overlay absolute inset-0 bg-black/40 backdrop-blur-sm ${isVisible ? 'visible' : 'hidden'}`}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className={`sheet-panel absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.1)] flex flex-col ${isVisible ? 'visible' : 'hidden'}`}
        style={{ maxHeight: '68vh' }}
      >
        <div className="flex-shrink-0 flex flex-col items-center pt-3 pb-0">
          <div className="handle-bar mb-3" />
          <div className="w-full flex items-center justify-between px-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <SlidersHorizontal size={18} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Filters</h2>
                {activeFilterCount > 0 && (
                  <p className="text-[11px] text-indigo-600 font-semibold">{activeFilterCount} active</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 rounded-full active:scale-95 transition-all"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 active:scale-95 transition-all"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="w-full h-px bg-slate-100" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
          {availableFilters.categories.length > 0 && (
            <FilterSection
              title="Category"
              expanded={expandedSections.categories}
              onToggle={() => toggleSection('categories')}
            >
              <div className="flex flex-wrap gap-2">
                {availableFilters.categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => toggleFilter('categories', cat.value)}
                    className={`filter-chip inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border ${
                      filters.categories.includes(cat.value)
                        ? 'active'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {cat.label}
                    {cat.count !== undefined && (
                      <span className={`text-[10px] font-bold ${
                        filters.categories.includes(cat.value) ? 'text-white/70' : 'text-slate-400'
                      }`}>
                        {cat.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </FilterSection>
          )}

          {availableFilters.brands.length > 0 && (
            <FilterSection
              title="Brand"
              expanded={expandedSections.brands}
              onToggle={() => toggleSection('brands')}
            >
              <div className="flex flex-wrap gap-2">
                {availableFilters.brands.map((brand) => (
                  <button
                    key={brand.value}
                    onClick={() => toggleFilter('brands', brand.value)}
                    className={`filter-chip inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border ${
                      filters.brands.includes(brand.value)
                        ? 'active'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {brand.label}
                    {brand.count !== undefined && (
                      <span className={`text-[10px] font-bold ${
                        filters.brands.includes(brand.value) ? 'text-white/70' : 'text-slate-400'
                      }`}>
                        {brand.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </FilterSection>
          )}

          {availableFilters.priceRanges.length > 0 && (
            <FilterSection
              title="Price"
              expanded={expandedSections.price}
              onToggle={() => toggleSection('price')}
            >
              <div className="flex flex-wrap gap-2">
                {DEFAULT_PRICE_RANGES.map((range, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPriceRange(filters.priceRange?.min === range.min && filters.priceRange?.max === range.max ? null : range)}
                    className={`price-btn px-3.5 py-2 rounded-xl text-[13px] font-medium border ${
                      filters.priceRange?.min === range.min && filters.priceRange?.max === range.max
                        ? 'active'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {range.min === 0 && range.max === Infinity ? 'All' :
                     range.max === Infinity ? `₹${range.min.toLocaleString()}+` :
                     `₹${range.min.toLocaleString()} - ₹${range.max.toLocaleString()}`}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    value={filters.priceRange?.min || ''}
                    onChange={(e) => setPriceRange({ min: parseInt(e.target.value) || 0, max: filters.priceRange?.max || Infinity })}
                    placeholder="Min price"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>
                <span className="text-slate-300 font-medium">—</span>
                <div className="flex-1">
                  <input
                    type="number"
                    value={filters.priceRange?.max !== Infinity ? filters.priceRange?.max : ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setPriceRange({ min: filters.priceRange?.min || 0, max: val || Infinity })
                    }}
                    placeholder="Max price"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>
              </div>
            </FilterSection>
          )}

          {availableFilters.tags.length > 0 && (
            <FilterSection
              title="Type"
              expanded={expandedSections.tags}
              onToggle={() => toggleSection('tags')}
            >
              <div className="flex flex-wrap gap-2">
                {availableFilters.tags.map((tag) => (
                  <button
                    key={tag.value}
                    onClick={() => toggleFilter('tags', tag.value)}
                    className={`filter-chip inline-flex items-center px-4 py-2 rounded-full text-[13px] font-medium border ${
                      filters.tags.includes(tag.value)
                        ? 'active'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </FilterSection>
          )}

          <FilterSection
            title="Sort By"
            expanded={expandedSections.sort}
            onToggle={() => toggleSection('sort')}
          >
            <div className="space-y-2">
              {SORT_OPTIONS.map((sort) => (
                <button
                  key={sort.value}
                  onClick={() => setSortBy(sort.value)}
                  className={`sort-row w-full px-4 py-3 rounded-xl text-left text-[13px] font-medium border flex items-center justify-between ${
                    filters.sortBy === sort.value
                      ? 'active'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {sort.label}
                  {filters.sortBy === sort.value && <Check size={16} className="text-indigo-600" />}
                </button>
              ))}
            </div>
          </FilterSection>
        </div>

        <div className="flex-shrink-0 px-5 pb-6 pt-3 border-t border-slate-100">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm active:scale-[0.98] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => { onApply(filters); onClose(); }}
              className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-semibold text-sm active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(79,70,229,0.25)]"
            >
              Apply{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(panelContent, document.body)
}

function FilterSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-50/80 rounded-2xl border border-slate-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5"
        aria-expanded={expanded}
      >
        <span className="font-semibold text-[14px] text-slate-800">{title}</span>
        <div className="text-slate-400">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          {children}
        </div>
      )}
    </div>
  )
}

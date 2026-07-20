import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, ArrowLeft, Flame } from 'lucide-react'
import { productService } from '../../services/productService'
import ProductCard from './ProductCard'

const POPULAR_TERMS = ['iPhone', 'Samsung', 'Charger', 'Case', 'Headphones', 'Screen', 'Pixel', 'OnePlus']

export default function MobileSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [suggested, setSuggested] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useRef<number | undefined>(undefined)

  // Load suggested "top products" once.
  useEffect(() => {
    productService
      .list({ is_best_selling: true, page_size: 10 } as any)
      .then((p) => setSuggested((p || []).slice(0, 8)))
      .catch(() => setSuggested([]))
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    window.clearTimeout(debounce.current)
    debounce.current = window.setTimeout(() => {
      productService
        .search(q)
        .then((r) => setResults((r || []).slice(0, 30)))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 300)
    return () => window.clearTimeout(debounce.current)
  }, [query])

  const runTerm = (term: string) => {
    setQuery(term)
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#0F172A] max-w-[480px] mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] px-3 py-2.5 flex items-center gap-2">
        <button onClick={() => navigate(-1)} aria-label="Back" className="w-9 h-9 rounded-full bg-[#EEF2FF] flex items-center justify-center active:scale-90 transition flex-shrink-0">
          <ArrowLeft size={19} className="text-[#0F172A]" />
        </button>
        <div className="flex-1 flex items-center gap-2 h-11 bg-[#EEF2FF] rounded-2xl px-3.5">
          <Search size={19} className="text-[#4F46E5] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands, categories..."
            className="flex-1 bg-transparent outline-none text-[14px] text-[#0F172A] placeholder:text-[#94A3B8]"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear" className="text-[#64748B] active:scale-90 transition">
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3.5 pb-24">
        {!query.trim() ? (
          <>
            {/* Popular searches */}
            <div className="mt-5">
              <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TERMS.map((t) => (
                  <button
                    key={t}
                    onClick={() => runTerm(t)}
                    className="px-3.5 py-2 rounded-full bg-white border border-[#E5E7EB] text-[13px] font-semibold text-[#0F172A] active:scale-95 transition"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Top products */}
            <div className="mt-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                  <Flame size={17} />
                </span>
                <h2 className="text-[17px] font-extrabold text-[#0F172A] tracking-tight">Top Products</h2>
              </div>
              {suggested.length === 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
                      <div className="aspect-square bg-[#F1F5F9] animate-pulse" />
                      <div className="p-2.5 space-y-2">
                        <div className="h-3 w-3/4 bg-[#E5E7EB] rounded animate-pulse" />
                        <div className="h-4 w-1/2 bg-[#E5E7EB] rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {suggested.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-[12px] text-[#64748B] mt-4 mb-3">
              {loading ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'} for "${query}"`}
            </p>
            {results.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 rounded-3xl bg-[#EEF2FF] flex items-center justify-center mb-4">
                  <Search size={32} className="text-[#4F46E5]" />
                </div>
                <h3 className="text-[16px] font-bold text-[#0F172A]">No products found</h3>
                <p className="text-[13px] text-[#64748B] mt-1.5 max-w-[240px]">Try a different keyword or browse popular searches.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

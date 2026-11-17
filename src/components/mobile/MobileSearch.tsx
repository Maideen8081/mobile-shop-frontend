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
    <div className="min-h-screen bg-[#F8F9FB] text-[#1d2522] max-w-[480px] mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#f7f6f2] px-3 py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} aria-label="Back" className="w-10 h-10 rounded-full bg-[#dfe6cf] flex items-center justify-center active:scale-90 transition flex-shrink-0">
          <ArrowLeft size={19} className="text-[#0f3b2c]" />
        </button>
        <div className="flex-1 flex items-center gap-2 h-11 bg-transparent px-1">
          <Search size={19} className="text-[#0f3b2c] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands, categories..."
            className="flex-1 bg-transparent outline-none text-body-sm text-[#0f3b2c] placeholder:text-[#5d6762]"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear" className="text-[#5d6762] active:scale-90 transition">
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
              <p className="text-caption font-bold text-[#5d6762] uppercase tracking-wider mb-2.5">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TERMS.map((t) => (
                  <button
                    key={t}
                    onClick={() => runTerm(t)}
                    className="px-3.5 py-2 rounded-[8px] bg-white border border-[#ece9e2] text-label font-semibold text-[#1d2522] active:scale-95 transition"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Top products */}
            <div className="mt-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-xl bg-[#dfe6cf] text-[#0f3b2c] flex items-center justify-center">
                  <Flame size={17} />
                </span>
                <h2 className="text-title-sm font-extrabold text-[#1d2522] tracking-tight">Top Products</h2>
              </div>
              {suggested.length === 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white border border-[#ece9e2] overflow-hidden">
                      <div className="aspect-square bg-[#f7f6f2] animate-pulse" />
                      <div className="p-2.5 space-y-2">
                        <div className="h-3 w-3/4 bg-[#ece9e2] rounded animate-pulse" />
                        <div className="h-4 w-1/2 bg-[#ece9e2] rounded animate-pulse" />
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
            <p className="text-caption text-[#5d6762] mt-4 mb-3">
              {loading ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'} for "${query}"`}
            </p>
            {results.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 rounded-3xl bg-[#dfe6cf] flex items-center justify-center mb-4">
                  <Search size={32} className="text-[#0f3b2c]" />
                </div>
                <h3 className="text-body font-bold text-[#1d2522]">No products found</h3>
                <p className="text-label text-[#5d6762] mt-1.5 max-w-[240px]">Try a different keyword or browse popular searches.</p>
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

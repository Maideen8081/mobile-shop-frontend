import PageLoading from '../ui/PageLoading'
import StorefrontIllustration from '../ecommerce/StorefrontIllustration'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, X, ArrowLeft, Flame } from 'lucide-react'
import { productService } from '../../services/productService'
import ProductCard from './ProductCard'

const POPULAR_TERMS = ['iPhone', 'Samsung', 'Charger', 'Case', 'Headphones', 'Screen', 'Pixel', 'OnePlus']

export default function MobileSearch() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const urlQuery = params.get('q') ?? ''
  const [query, setQuery] = useState(urlQuery)
  const [results, setResults] = useState<any[]>([])
  const [suggested, setSuggested] = useState<any[]>([])
  const [loading, setLoading] = useState(Boolean(urlQuery.trim()))
  const [suggestedLoading, setSuggestedLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setQuery(urlQuery) }, [urlQuery])

  // Load suggested "top products" once.
  useEffect(() => {
    let active = true
    productService
      .list({ is_best_selling: true, page_size: 10 } as any)
      .then((p) => { if (active) setSuggested(p.slice(0, 8)) })
      .catch(() => {})
      .finally(() => { if (active) setSuggestedLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const q = query.trim()
    setFailed(false)
    if (!q) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    let active = true
    const debounce = window.setTimeout(() => {
      productService
        .search(q)
        .then((r) => { if (active) setResults(r.slice(0, 30)) })
        .catch(() => { if (active) { setResults([]); setFailed(true) } })
        .finally(() => { if (active) setLoading(false) })
    }, 300)
    return () => { active = false; window.clearTimeout(debounce) }
  }, [query, retry])

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
        <div className="min-w-0 flex-1 flex items-center gap-2 h-11 bg-transparent px-1">
          <Search size={19} className="text-[#0f3b2c] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands, categories..."
            aria-label="Search products"
            className="min-w-0 flex-1 bg-transparent outline-none text-base text-[#0f3b2c] placeholder:text-[#5d6762]"
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
              {suggestedLoading ? (
                <PageLoading label="Loading top products…" className="py-10" />
              ) : suggested.length === 0 ? (
                <p className="py-4 text-caption text-[#5d6762]">No top products to show right now.</p>
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
            {!loading && !failed && (
              <p className="text-caption text-[#5d6762] mt-4 mb-3">
                {`${results.length} result${results.length === 1 ? '' : 's'} for "${query}"`}
              </p>
            )}
            {loading ? (
              <PageLoading label="Searching products…" className="py-12" />
            ) : failed ? (
              <div className="py-12 text-center" role="alert">
                <p className="font-semibold">Couldn’t load search results.</p>
                <button type="button" className="mt-3 text-[#0f3b2c] underline" onClick={() => setRetry((value) => value + 1)}>Try again</button>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <StorefrontIllustration kind="search" />
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

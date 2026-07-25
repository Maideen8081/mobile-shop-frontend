import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImageUrl } from './helpers'
import { FALLBACK_IMG } from './fallback'
import { categoryService, type Category } from '../../services/categoryService'
import { C } from './theme'

export default function FeaturedCollections() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    let cancelled = false
    categoryService
      .list()
      .then((cats) => {
        if (cancelled) return
        const active = (cats || []).filter((c) => c.status === 'active' && c.image)
        setCategories(active.slice(0, 4))
      })
      .catch(() => !cancelled && setCategories([]))
    return () => { cancelled = true }
  }, [])

  if (!categories.length) return null

  return (
    <section className="mt-7 px-3.5">
      <div className="flex items-center justify-between mb-3">
        <h2 className={C.sectionTitle}>Featured Collections</h2>
        <button
          onClick={() => navigate('/collection/all')}
          className={C.viewAll}
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {categories.map((c) => {
          const img = getImageUrl(c.image)
          const to = `/collection/${c.name?.toLowerCase().replace(/\s+/g, '-') || c.id}`
          return (
            <button
              key={c.id}
              onClick={() => navigate(to)}
              className="relative h-[140px] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(15,23,42,0.08)] bg-[#FEE2E6] active:scale-[0.97] transition-transform duration-150 group"
            >
              <img
                src={img || FALLBACK_IMG}
                alt={c.name}
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
                className="w-full h-full object-cover transition-transform duration-300 group-active:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                <h3 className="text-white text-[14px] font-extrabold leading-tight drop-shadow">{c.name}</h3>
                {typeof c.products === 'number' && (
                  <p className="text-white/85 text-[10.5px] mt-0.5 font-medium">{c.products} products</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

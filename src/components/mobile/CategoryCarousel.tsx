import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Category } from '../../services/categoryService'
import { useHorizontalArrows, getImageUrl } from './helpers'
import { FALLBACK_IMG } from './fallback'

const CATEGORY_ICONS: Record<string, string> = {
  Smartphones: '📱', Phone: '📱', Phones: '📱',
  Earbuds: '🎧', Audio: '🎧', Headphones: '🎧',
  Watches: '⌚', Wearables: '⌚', Watch: '⌚',
  Laptops: '💻', Laptop: '💻', Computer: '💻',
  'Power Banks': '🔋', Powerbank: '🔋', Power: '🔋',
  Chargers: '🔌', Charger: '🔌',
  Gaming: '🎮',
  Cameras: '📷', Camera: '📷',
  Storage: '💾',
  Monitors: '🖥',
}

export default function CategoryCarousel({ categories }: { categories: Category[] }) {
  const { ref, update } = useHorizontalArrows()
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <section>
      <div
        ref={ref}
        onScroll={update}
        className="flex gap-3.5 overflow-x-auto px-3.5 pb-1 snap-x snap-mandatory scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {categories.map((cat) => {
          const img = getImageUrl(cat.image)
          const active = selected === cat.id
          return (
            <Link
              key={cat.id}
              to={`/collection/${encodeURIComponent(cat.name)}`}
              onClick={() => setSelected(cat.id)}
              className="snap-start flex-shrink-0 w-[76px] flex flex-col items-center gap-2 active:scale-95 transition"
            >
              <div
                className={`w-[72px] h-[72px] rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${active ? 'scale-105' : 'hover:scale-105'}`}
                style={active
                  ? { background: 'linear-gradient(135deg,#0f3b2c,#18503c)', boxShadow: '0 10px 24px rgba(15,59,44,0.40)' }
                  : { background: '#FFFFFF', boxShadow: '0 6px 18px rgba(15,59,44,0.08)' }}
              >
                {img ? (
                  <img src={img} alt={cat.name} loading="lazy" className="w-full h-full object-cover rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }} />
                ) : (
                  <span className="text-heading leading-none">{CATEGORY_ICONS[cat.name] || '🛍️'}</span>
                )}
              </div>
              <span className="text-micro text-center leading-tight max-w-[76px] truncate font-semibold text-[#0f3b2c]">
                {cat.name}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

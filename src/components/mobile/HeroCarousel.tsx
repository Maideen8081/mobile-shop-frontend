import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FALLBACK_IMG } from './fallback'

type Banner = {
  id: number
  brand: string
  title: string
  desc: string
  tag: string
  image: string
  link: string
}

const BANNERS: Banner[] = [
  { id: 1, brand: 'Samsung', title: 'Galaxy Unpacked', desc: 'Discover the new era of Galaxy AI smartphones.', tag: 'Up to 18% OFF', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80', link: '/collection/all' },
  { id: 2, brand: 'Apple', title: 'iPhone 16 Pro', desc: 'Titanium. So strong. So light. So Pro.', tag: 'New Arrival', image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=80', link: '/collection/all' },
  { id: 3, brand: 'Nothing', title: 'Nothing Phone (3)', desc: 'Designed to be different. Glyph Interface.', tag: 'Trending', image: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=1200&q=80', link: '/collection/all' },
  { id: 4, brand: 'OnePlus', title: 'OnePlus 13', desc: 'Never Settle. Hasselblad flagship camera.', tag: 'Flagship', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80', link: '/collection/all' },
  { id: 5, brand: 'Google Pixel', title: 'Pixel 9 Pro', desc: 'Gemini built in. The most helpful phone.', tag: 'Best Seller', image: 'https://images.unsplash.com/photo-1592890288564-76628a30a657?auto=format&fit=crop&w=1200&q=80', link: '/collection/all' },
  { id: 6, brand: 'Motorola', title: 'Edge 50 Ultra', desc: 'Snap. Share. Repeat. Wooden finish design.', tag: 'Hot Deal', image: 'https://images.unsplash.com/photo-1624096100767-3d208fc6e1c4?auto=format&fit=crop&w=1200&q=80', link: '/collection/all' },
  { id: 7, brand: 'Xiaomi', title: 'Xiaomi 15', desc: 'Leica optics. Lightning fast charging.', tag: 'Limited', image: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=1200&q=80', link: '/collection/all' },
  { id: 8, brand: 'Realme', title: 'Realme 14 Pro', desc: 'Style meets flagship performance.', tag: 'Save More', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80', link: '/collection/all' },
  { id: 9, brand: 'Accessories', title: 'Audio & More', desc: 'Earbuds, watches & power banks up to 40% off.', tag: 'Mega Sale', image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=1200&q=80', link: '/collection/all' },
  { id: 10, brand: 'Laptops', title: 'Laptop Fest', desc: 'Premium laptops & MacBooks at best prices.', tag: 'Top Picks', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80', link: '/collection/all' },
]

export default function HeroCarousel() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const startX = useRef(0)
  const dragX = useRef(0)

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % BANNERS.length), 3000)
    return () => clearInterval(t)
  }, [])

  const goTo = (i: number) => setIndex((i + BANNERS.length) % BANNERS.length)

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; dragX.current = 0 }
  const onTouchMove = (e: React.TouchEvent) => { dragX.current = e.touches[0].clientX - startX.current }
  const onTouchEnd = () => { if (Math.abs(dragX.current) > 50) goTo(dragX.current < 0 ? index + 1 : index - 1) }

  return (
    <section className="px-3.5 mt-4">
      <div
        className="relative h-[200px] rounded-3xl overflow-hidden shadow-[0_12px_34px_rgba(108,59,255,0.22)]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {BANNERS.map((b, i) => (
            <div
              key={b.id}
              className="relative w-full h-full flex-shrink-0"
              onClick={() => b.link && navigate(b.link)}
              role="button"
            >
              <img src={b.image} alt={b.brand} loading={i === 0 ? 'eager' : 'lazy'} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }} />
              <div className="absolute inset-0 bg-gradient-to-r from-[#4B2ECC]/80 via-[#6C3BFF]/45 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-4">
                <span className="self-start mb-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-[10px] font-semibold tracking-wide uppercase text-white">{b.tag}</span>
                <p className="text-[11px] font-medium text-white/85">{b.brand}</p>
                <h3 className="text-white text-[19px] font-extrabold leading-tight drop-shadow-sm">{b.title}</h3>
                <p className="text-white/90 text-[12px] mt-0.5 font-medium line-clamp-1">{b.desc}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(b.link) }}
                  className="mt-2.5 self-start inline-flex items-center gap-1 bg-white text-[#6C3BFF] text-[12px] font-bold px-4 py-2 rounded-full active:scale-95 transition"
                >
                  Shop Now
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-3 left-4 flex gap-1.5">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

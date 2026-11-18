import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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
  const [index, setIndex] = useState(0)
  const startX = useRef(0)
  const dragX = useRef(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setIndex((i) => (i + 1) % BANNERS.length), 6000)
    return () => clearInterval(t)
  }, [])

  const goTo = (i: number) => setIndex((i + BANNERS.length) % BANNERS.length)

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; dragX.current = 0 }
  const onTouchMove = (e: React.TouchEvent) => { dragX.current = e.touches[0].clientX - startX.current }
  const onTouchEnd = () => { if (Math.abs(dragX.current) > 50) goTo(dragX.current < 0 ? index + 1 : index - 1) }

  return (
    <section className="mobile-home-hero px-3.5 mt-4" aria-label="Featured offers">
      <div
        className="relative h-[280px] rounded-3xl overflow-hidden shadow-[0_12px_34px_rgba(15,59,44,0.22)]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {BANNERS.map((b, i) => (
            <Link
              key={b.id}
              to={b.link}
              tabIndex={i === index ? 0 : -1}
              aria-hidden={i !== index}
              className="relative w-full h-full flex-shrink-0"
            >
              <img src={b.image} alt="" loading={i === 0 ? 'eager' : 'lazy'} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }} />
              <div className="mobile-home-hero-copy absolute inset-0 flex flex-col justify-end px-5 pb-12 pt-5">
                <span className="self-start mb-2 px-3 py-1 rounded-[8px] bg-white/20 backdrop-blur text-micro font-semibold tracking-wide uppercase text-white">{b.tag}</span>
                <p className="text-micro font-medium text-white/85">{b.brand}</p>
                <h2 className="font-display text-white text-title leading-tight">{b.title}</h2>
                <p className="text-white/90 text-caption mt-1 font-medium">{b.desc}</p>
                <span className="mt-3 self-start rounded-full bg-[#e7edce] px-4 py-2 text-caption font-bold text-[#0b2e22]">
                  Shop Now
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="absolute bottom-1 left-4 right-4 flex">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-pressed={i === index}
              aria-label={`Go to slide ${i + 1}`}
              className="grid h-9 min-w-0 flex-1 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-white"
            >
              <span className={`h-1.5 rounded-full ${i === index ? 'w-4 bg-[#e7edce]' : 'w-1.5 bg-white/60'}`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

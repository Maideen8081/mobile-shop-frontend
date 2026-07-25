import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, A11y, Keyboard, Pagination } from 'swiper/modules'
import type { Swiper as SwiperClass } from 'swiper/types'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

/* ----------------------------- Banner data ----------------------------- */
/* Full-bleed Unsplash background photos (watermark-free, CDN-served). */

type AdBanner = {
  id: number
  eyebrow: string
  title: string
  tagline: string
  offer: string
  cta: string
  link: string
  image: string
  accent: string
}

const BANNERS: AdBanner[] = [
  {
    id: 1,
    eyebrow: 'Latest Smartphones',
    title: 'Flagship Upgrades Are Here',
    tagline: 'Samsung Galaxy S25 Ultra · iPhone 17 Pro · Nothing Phone 3',
    offer: 'Up to 35% OFF',
    cta: 'Shop Now',
    link: '/collection/all',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=80',
    accent: '#38BDFF',
  },
  {
    id: 2,
    eyebrow: 'Gaming Phones',
    title: 'Level Up Your Game',
    tagline: 'ROG Phone · RedMagic · iQOO · POCO',
    offer: 'Free Gaming Accessories',
    cta: 'Explore',
    link: '/collection/all',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80',
    accent: '#A855F7',
  },
  {
    id: 3,
    eyebrow: 'Wireless Earbuds',
    title: 'Sound, Untangled',
    tagline: 'Nothing Ear · AirPods · Samsung Buds · OnePlus Buds',
    offer: 'Starting ₹999',
    cta: 'Shop Now',
    link: '/collection/all',
    image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=80',
    accent: '#0EA5E9',
  },
  {
    id: 4,
    eyebrow: 'Smart Watches',
    title: 'Track Every Beat',
    tagline: 'Apple Watch · Galaxy Watch · CMF Watch · Noise',
    offer: 'Flat 40% OFF',
    cta: 'Shop Now',
    link: '/collection/all',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80',
    accent: '#34D399',
  },
  {
    id: 5,
    eyebrow: 'Mobile Accessories',
    title: 'Essentials, Sorted',
    tagline: 'Chargers · Power Banks · USB-C Cables · Cases',
    offer: 'Buy 2 Get 1 Free',
    cta: 'Shop Now',
    link: '/collection/all',
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
    accent: '#CB202D',
  },
  {
    id: 6,
    eyebrow: 'Premium Headphones',
    title: 'Hear The Difference',
    tagline: 'Sony · JBL · boAt · Marshall',
    offer: 'Starting ₹1499',
    cta: 'Explore',
    link: '/collection/all',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    accent: '#F59E0B',
  },
  {
    id: 7,
    eyebrow: 'Laptop Collection',
    title: 'Power To Create',
    tagline: 'MacBook · Dell XPS · ASUS · Lenovo · HP',
    offer: 'Student Discount Available',
    cta: 'Shop Now',
    link: '/collection/all',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    accent: '#38BDF8',
  },
  {
    id: 8,
    eyebrow: 'Tablet Collection',
    title: 'Your Canvas, Anywhere',
    tagline: 'iPad · Samsung Tab · Xiaomi Pad · Lenovo Tab',
    offer: 'Starting ₹9,999',
    cta: 'Shop Now',
    link: '/collection/all',
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1200&q=80',
    accent: '#D97706',
  },
  {
    id: 9,
    eyebrow: 'Smart Home Devices',
    title: 'Smarter Living',
    tagline: 'Alexa · Google Nest · Smart Bulbs · Cameras',
    offer: 'Smart Living Sale',
    cta: 'Explore',
    link: '/collection/all',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80',
    accent: '#22D3EE',
  },
  {
    id: 10,
    eyebrow: 'Mega Electronics Sale',
    title: 'Everything, On Sale',
    tagline: 'Phones · Laptops · Smartwatches · Earbuds · Accessories',
    offer: 'Up to 70% OFF',
    cta: 'Grab Deals',
    link: '/collection/all',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=80',
    accent: '#FBBF24',
  },
]

/* ------------------------------- Styles -------------------------------- */

const sectionStyle: React.CSSProperties = { maxWidth: 1400, marginLeft: 'auto', marginRight: 'auto' }
const heights = 'h-[200px] min-[768px]:h-[260px] min-[1024px]:h-[360px]'

/* ----------------------------- Component ------------------------------- */

export default function AdCarousel() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  const swiperRef = useRef<SwiperClass | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 500)
    return () => clearTimeout(t)
  }, [])

  const slides = useMemo(() => BANNERS, [])

  return (
    <section className="mt-7 px-4" style={sectionStyle}>
      <div
        className={`relative w-full ${heights} rounded-[20px] min-[1024px]:rounded-[28px] overflow-hidden shadow-[0_12px_36px_rgba(15,23,42,0.18)]`}
        onMouseEnter={() => swiperRef.current?.autoplay?.stop()}
        onMouseLeave={() => swiperRef.current?.autoplay?.start()}
      >
        {!loaded && (
          <div className="absolute inset-0 bg-[#FEE2E6] animate-pulse flex items-center justify-center z-30">
            <div className="w-10 h-10 rounded-full border-4 border-[#C7D2FE] border-t-[#CB202D] animate-spin" />
          </div>
        )}

        <Swiper
          modules={[Autoplay, Navigation, A11y, Keyboard, Pagination]}
          slidesPerView={1}
          loop
          speed={700}
          keyboard={{ enabled: true }}
          autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          navigation={{ prevEl: '.ad-prev', nextEl: '.ad-next' }}
          pagination={{ clickable: true, el: '.ad-dots', bulletClass: 'ad-bullet', bulletActiveClass: 'ad-bullet-active' }}
          a11y={{ enabled: true }}
          className="w-full h-full"
          onSwiper={(s) => { swiperRef.current = s }}
          onTouchStart={() => swiperRef.current?.autoplay?.stop()}
          onTouchEnd={() => swiperRef.current?.autoplay?.start()}
        >
          {slides.map((b) => (
            <SwiperSlide key={b.id} className="w-full h-full">
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate(b.link)}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(b.link) }}
                aria-label={`${b.eyebrow} — ${b.offer}`}
                className="relative w-full h-full flex items-center overflow-hidden"
              >
                {/* Full-bleed background photo (one image per slide) */}
                <img
                  src={b.image}
                  alt={b.title}
                  loading="lazy"
                  draggable={false}
                  className="ad-slide-img absolute inset-0 w-full h-full object-cover select-none"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement
                    el.style.display = 'none'
                  }}
                />
                {/* Gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                {/* Accent glow line */}
                <div className="absolute left-0 top-0 h-full w-1.5" style={{ background: b.accent }} />

                {/* Text content */}
                <div className="relative z-10 px-5 sm:px-8 md:px-12 max-w-[80%] flex flex-col gap-1.5">
                  <span className="text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.18em] text-white/90">
                    {b.eyebrow}
                  </span>
                  <h3 className="text-[21px] sm:text-[32px] md:text-[46px] font-extrabold leading-[1.04] tracking-tight text-white drop-shadow-sm">
                    {b.title}
                  </h3>
                  <p className="text-[10px] sm:text-[12.5px] font-medium text-white/90 max-w-[92%] leading-snug">
                    {b.tagline}
                  </p>
                  <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                    <span
                      className="text-[12px] sm:text-[15px] font-extrabold px-3 py-1 rounded-full shadow text-[#0F172A]"
                      style={{ background: b.accent }}
                    >
                      {b.offer}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(b.link) }}
                      className="flex items-center gap-1 text-[11px] sm:text-[13px] font-bold px-3.5 py-1.5 rounded-full bg-white text-[#0F172A] shadow-md active:scale-95 transition"
                    >
                      {b.cta} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Desktop arrows (hidden on mobile) */}
        <button
          aria-label="Previous slide"
          className="ad-prev hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 backdrop-blur items-center justify-center shadow-lg hover:bg-white active:scale-90 transition"
        >
          <ChevronLeft size={20} className="text-[#0F172A]" />
        </button>
        <button
          aria-label="Next slide"
          className="ad-next hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 backdrop-blur items-center justify-center shadow-lg hover:bg-white active:scale-90 transition"
        >
          <ChevronRight size={20} className="text-[#0F172A]" />
        </button>
      </div>

      {/* Indicator dots — green active, light gray inactive, animated */}
      <style>{`
        .ad-dots { display: flex; gap: 6px; justify-content: center; margin-top: 12px; }
        .ad-bullet {
          width: 6px; height: 6px; border-radius: 999px;
          background: #CBD5E1; cursor: pointer; transition: all 0.35s ease;
        }
        .ad-bullet-active { width: 22px; background: #059669; }
        /* Ken Burns slow zoom on the active slide's image for a premium ad feel */
        .ad-slide-img { transform: scale(1.04); transition: transform 4.5s ease-out; }
        .swiper-slide-active .ad-slide-img { transform: scale(1.12); }
      `}</style>
      <div className="ad-dots" />
    </section>
  )
}

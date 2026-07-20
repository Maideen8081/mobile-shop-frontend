import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import {
  ChevronLeft, ChevronRight, ArrowRight, Zap, Camera,
  Sparkles, Smartphone, Watch, Headphones, Gamepad2, Gift, Star,
  Timer, ShieldCheck, Truck
} from 'lucide-react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

const topSlides = [
  {
    id: 1,
    bg: 'from-slate-50 via-white to-zinc-50',
    accent: 'slate',
    productImage: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=800&fit=crop&q=80',
    title: 'The Ultimate iPhone',
    brand: 'iPhone 16 Pro Max',
    subtitle: 'A18 Pro Chip · 48MP Fusion Camera · Titanium Design',
    desc: '256GB · 8GB RAM · 6.9" OLED · 5G',
    price: '₹1,29,900',
    oldPrice: '₹1,44,900',
    cta: 'Buy Now',
    ctaLink: '/shop',
    features: ['A18 Pro', '48MP Fusion', 'Titanium'],
    badge: '📱',
    discount: 10,
  },
  {
    id: 2,
    bg: 'from-zinc-50 via-white to-gray-50',
    accent: 'gray',
    productImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop&q=80',
    title: 'Supercharged Performance',
    brand: 'MacBook Pro M4',
    subtitle: 'M4 Chip · 16-core Neural Engine · 24hr Battery',
    desc: '512GB SSD · 16GB RAM · 14" Liquid Retina XDR',
    price: '₹1,69,900',
    oldPrice: '₹1,89,900',
    cta: 'Shop Now',
    ctaLink: '/shop',
    features: ['M4 Chip', '24hr Battery', 'XDR Display'],
    badge: '💻',
    discount: 11,
  },
  {
    id: 3,
    bg: 'from-stone-50 via-white to-neutral-50',
    accent: 'stone',
    productImage: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af1?w=600&h=600&fit=crop&q=80',
    title: 'Sound Reimagined',
    brand: 'AirPods Pro 2nd Gen',
    subtitle: 'H2 Chip · Adaptive Audio · Active Noise Cancellation',
    desc: 'USB-C · IP54 · 6hr Battery',
    price: '₹24,900',
    oldPrice: '₹29,900',
    cta: 'Explore',
    ctaLink: '/shop',
    features: ['H2 Chip', 'ANC', 'Adaptive Audio'],
    badge: '🎧',
    discount: 17,
  },
  {
    id: 4,
    bg: 'from-blue-50 via-white to-indigo-50',
    accent: 'blue',
    productImage: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=600&fit=crop&q=80',
    title: 'Creativity Unleashed',
    brand: 'iPad Air M3',
    subtitle: 'M3 Chip · Apple Pencil Pro · 12MP Camera',
    desc: '128GB · 8GB RAM · 11" Liquid Retina',
    price: '₹64,900',
    oldPrice: '₹74,900',
    cta: 'Pre-Order',
    ctaLink: '/shop',
    features: ['M3 Chip', 'Pencil Pro', 'Liquid Retina'],
    badge: '📟',
    discount: 13,
  },
  {
    id: 5,
    bg: 'from-orange-50 via-white to-amber-50',
    accent: 'orange',
    productImage: 'https://images.unsplash.com/photo-1546868871-af0de0ae72d8?w=600&h=600&fit=crop&q=80',
    title: 'Adventure Awaits',
    brand: 'Apple Watch Ultra 3',
    subtitle: 'S10 Chip · 36hr Battery · Precision GPS',
    desc: '49mm Titanium · 5000 nits · Dive to 40m',
    price: '₹89,900',
    oldPrice: '₹99,900',
    cta: 'Buy Now',
    ctaLink: '/shop',
    features: ['S10 Chip', '36hr Battery', 'Precision GPS'],
    badge: '⌚',
    discount: 10,
  },
]

interface BottomSlide {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  color: string
  emoji: string
  discount: string
  image: string
}

const bottomSlides: BottomSlide[] = [
  { icon: Watch, label: 'Smart Watches', color: 'from-cyan-500 to-blue-600', emoji: '⌚', discount: '40% Off', image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72d8?w=300&h=300&fit=crop&q=80' },
  { icon: Headphones, label: 'Premium Earbuds', color: 'from-emerald-500 to-teal-600', emoji: '🎧', discount: '50% Off', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&q=80' },
  { icon: Gamepad2, label: 'Gaming Gear', color: 'from-purple-500 to-pink-600', emoji: '🎮', discount: '30% Off', image: 'https://images.unsplash.com/photo-1605901309584-2f3b1d1a5e6c?w=300&h=300&fit=crop&q=80' },
  { icon: Smartphone, label: 'Phone Cases', color: 'from-amber-500 to-orange-600', emoji: '📱', discount: '25% Off', image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=300&h=300&fit=crop&q=80' },
  { icon: Zap, label: 'Power Banks', color: 'from-green-500 to-emerald-600', emoji: '🔋', discount: '35% Off', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&h=300&fit=crop&q=80' },
  { icon: Camera, label: 'Action Cameras', color: 'from-rose-500 to-red-600', emoji: '📸', discount: '20% Off', image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=300&fit=crop&q=80' },
  { icon: Star, label: 'Top Rated', color: 'from-indigo-500 to-violet-600', emoji: '⭐', discount: 'Flash Sale', image: 'https://images.unsplash.com/photo-1535324493251-5a372f7a0ec0?w=300&h=300&fit=crop&q=80' },
  { icon: Gift, label: 'Bundle Deals', color: 'from-teal-500 to-cyan-600', emoji: '🎁', discount: 'Combo Offer', image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=300&h=300&fit=crop&q=80' },
]

function FloatingParticles({ count = 8, light = true }: { count?: number; light?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-1.5 h-1.5 rounded-full ${light ? 'bg-emerald-400/20' : 'bg-white/20'}`}
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -30 - Math.random() * 40, 0], opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 3 }}
        />
      ))}
    </div>
  )
}

function ProductImage({ src, isActive }: { src: string; isActive: boolean }) {
  return (
    <div className="relative">
      <motion.div
        animate={isActive ? { y: [0, -10, 0] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <motion.div
          animate={isActive ? { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 via-teal-400/20 to-transparent rounded-full blur-[80px] scale-150"
        />
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.8 }}
          animate={isActive ? { opacity: 1, x: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative bg-white/60 backdrop-blur-sm rounded-[20px] sm:rounded-[28px] p-2 sm:p-3 shadow-2xl border border-white/70"
        >
          <motion.div
            animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-2 -right-2 w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 z-10"
          >
            <Sparkles size={14} className="text-white" />
          </motion.div>
          <img
            src={src}
            alt="Product"
            className="w-[220px] h-[400px] sm:w-[260px] sm:h-[460px] lg:w-[320px] lg:h-[600px] object-contain rounded-[14px] sm:rounded-[20px] shadow-inner"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          <motion.div
            animate={isActive ? { opacity: [0.6, 1, 0.6] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-2.5 sm:px-3 py-1 flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[7px] sm:text-[8px] font-semibold text-white">AI Powered</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function TopSlide({ slide, isActive }: { slide: typeof topSlides[0]; isActive: boolean }) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isActive && contentRef.current) {
      const els = contentRef.current.querySelectorAll('.anim-el')
      gsap.fromTo(els, { opacity: 0, y: 50 },
        { opacity: 1, y: 0, stagger: 0.12, duration: 0.7, ease: 'power3.out' }
      )
    }
  }, [isActive])

  return (
    <div className={`relative w-full min-h-[60vh] lg:h-[80vh] overflow-hidden bg-gradient-to-br ${slide.bg}`}>
      <motion.div
        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0"
      >
        <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-${slide.accent}-400/10 rounded-full blur-[120px]`} />
        <div className={`absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-${slide.accent}-300/10 rounded-full blur-[100px]`} />
      </motion.div>
      <FloatingParticles count={8} light />

      <div ref={contentRef} className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="h-full flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-2 lg:gap-12">
          <div className="flex-1 text-center lg:text-left pt-4 sm:pt-8 lg:pt-0 pb-2 lg:pb-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isActive ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="inline-flex items-center gap-1.5 bg-white shadow-lg shadow-black/5 border border-slate-200 rounded-full px-3 py-1 mb-2 lg:mb-4"
            >
              <span className="text-sm lg:text-lg">{slide.badge}</span>
              <span className="text-[9px] lg:text-xs font-semibold text-slate-600 uppercase tracking-widest">New Launch</span>
            </motion.div>

            <h2 className="anim-el text-3xl sm:text-4xl lg:text-7xl font-extrabold text-slate-900 leading-tight">
              {slide.title}
            </h2>
            <h3 className="anim-el text-2xl sm:text-3xl lg:text-6xl font-black mt-0.5 lg:mt-1 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {slide.brand}
            </h3>
            <p className="anim-el text-sm sm:text-base lg:text-xl text-slate-600 mt-1 lg:mt-3 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {slide.subtitle}
            </p>

            <div className="anim-el flex flex-wrap justify-center lg:justify-start gap-1.5 lg:gap-3 mt-2 lg:mt-4">
              {slide.features.map((f, idx) => (
                <motion.span
                  key={idx}
                  whileHover={{ scale: 1.05, y: -1 }}
                  className="inline-flex items-center gap-1 text-[9px] lg:text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-full px-2 lg:px-4 py-0.5 lg:py-1.5 shadow-sm"
                >
                  <Sparkles size={8} className="lg:hidden text-emerald-500" />
                  <Sparkles size={12} className="hidden lg:block text-emerald-500" /> {f}
                </motion.span>
              ))}
            </div>

            <div className="anim-el flex items-center justify-center lg:justify-start gap-2 lg:gap-4 mt-2 lg:mt-5">
              <motion.span
                animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-2xl sm:text-3xl lg:text-5xl font-black text-slate-900"
              >
                {slide.price}
              </motion.span>
              <span className="text-xs sm:text-sm lg:text-lg text-slate-400 line-through">{slide.oldPrice}</span>
              <span className="text-[9px] lg:text-xs font-bold text-emerald-600 bg-emerald-100 border border-emerald-200 px-1.5 lg:px-3 py-0.5 lg:py-1 rounded-full">
                {slide.discount}% OFF
              </span>
            </div>

            <div className="anim-el flex items-center justify-center lg:justify-start gap-2 lg:gap-4 mt-3 lg:mt-6">
              <Link to={slide.ctaLink}
                className="group inline-flex items-center gap-1.5 lg:gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-5 lg:px-8 py-2.5 lg:py-4 rounded-xl hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all duration-300 text-xs lg:text-base"
              >
                {slide.cta}
                <ArrowRight size={14} className="lg:hidden" />
                <ArrowRight size={18} className="hidden lg:block group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/shop"
                className="inline-flex items-center gap-1.5 text-xs lg:text-base font-semibold text-slate-600 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300 bg-white px-4 lg:px-6 py-2.5 lg:py-4 rounded-xl transition-all duration-300 shadow-sm"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center lg:justify-end relative mt-0 lg:mt-0 scale-[0.8] sm:scale-[0.9] lg:scale-100 origin-center">
            <ProductImage src={slide.productImage} isActive={isActive} />
          </div>
        </div>
      </div>
    </div>
  )
}

function BottomCard({ item }: { item: BottomSlide }) {
  const Icon = item.icon
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      className="group relative bg-white rounded-xl lg:rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all duration-500 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-500/5"
    >
      <div className="relative h-28 sm:h-32 lg:h-36 overflow-hidden">
        <img
          src={item.image}
          alt={item.label}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className={`absolute top-2 right-2 w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
          <Icon size={14} className="text-white" />
        </div>
        <div className="absolute bottom-2 left-2 right-2">
          <h4 className="text-[11px] lg:text-sm font-bold text-white drop-shadow-lg">{item.label}</h4>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[8px] lg:text-[10px] font-bold text-emerald-300 bg-black/30 backdrop-blur-sm px-1.5 lg:px-2 py-0.5 rounded-full border border-emerald-400/30">
              {item.discount}
            </span>
            <span className="text-[8px] lg:text-[10px] text-white/60">{item.emoji}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function PremiumDoubleCarousel() {
  const swiperRef = useRef<any>(null)
  const bottomSwiperRef = useRef<any>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') swiperRef.current?.slidePrev()
      if (e.key === 'ArrowRight') swiperRef.current?.slideNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <section className="relative w-full bg-white pt-20 lg:pt-36 overflow-hidden">
      <div className="max-w-[100vw] mx-auto">
        {/* === TOP CAROUSEL === */}
        <div className="relative group">
          <Swiper
            onSwiper={(s) => { swiperRef.current = s }}
            modules={[Autoplay, Navigation, Pagination, EffectFade]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            speed={800}
            autoplay={{ delay: 5500, disableOnInteraction: false, pauseOnMouseEnter: true }}
            loop={true}
            pagination={{ clickable: true, el: '.custom-pagination' }}
            navigation={{ nextEl: '.custom-next', prevEl: '.custom-prev' }}
            className="w-full"
          >
            {topSlides.map((slide) => (
              <SwiperSlide key={slide.id}>
                {({ isActive }) => <TopSlide slide={slide} isActive={isActive} />}
              </SwiperSlide>
            ))}
          </Swiper>

          <button className="custom-prev absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 lg:w-11 lg:h-11 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 duration-300 cursor-pointer">
            <ChevronLeft size={18} className="lg:hidden" />
            <ChevronLeft size={20} className="hidden lg:block" />
          </button>
          <button className="custom-next absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 lg:w-11 lg:h-11 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 duration-300 cursor-pointer">
            <ChevronRight size={18} className="lg:hidden" />
            <ChevronRight size={20} className="hidden lg:block" />
          </button>

          <div className="custom-pagination absolute bottom-3 lg:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 lg:gap-2 [&_.swiper-pagination-bullet]:w-2 [&_.swiper-pagination-bullet]:h-2 [&_.swiper-pagination-bullet]:rounded-full [&_.swiper-pagination-bullet]:bg-slate-300 [&_.swiper-pagination-bullet-active]:bg-emerald-500 [&_.swiper-pagination-bullet-active]:w-6 lg:[&_.swiper-pagination-bullet-active]:w-8 [&_.swiper-pagination-bullet-active]:rounded-full [&_.swiper-pagination-bullet-active]:shadow-lg [&_.swiper-pagination-bullet-active]:shadow-emerald-500/40" />
        </div>

        {/* === BOTTOM CAROUSEL === */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 mt-6 lg:mt-10 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-3 lg:mb-4"
          >
            <div className="flex items-center gap-1.5 lg:gap-2">
              <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] lg:text-xs font-semibold text-emerald-600 uppercase tracking-widest">Deals &amp; Offers</span>
            </div>
            <Link to="/shop" className="text-[10px] lg:text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1">
              View All <ChevronRight size={10} className="lg:hidden" />
              <ChevronRight size={12} className="hidden lg:block" />
            </Link>
          </motion.div>

          <Swiper
            onSwiper={(s) => { bottomSwiperRef.current = s }}
            modules={[Autoplay]}
            spaceBetween={12}
            slidesPerView={2.2}
            autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            loop={true}
            breakpoints={{
              480: { slidesPerView: 2.5, spaceBetween: 12 },
              640: { slidesPerView: 3, spaceBetween: 14 },
              768: { slidesPerView: 4, spaceBetween: 16 },
              1024: { slidesPerView: 5, spaceBetween: 20 },
              1280: { slidesPerView: 6, spaceBetween: 24 },
            }}
            className="w-full"
          >
            {bottomSlides.map((item, i) => (
              <SwiperSlide key={i}>
                <BottomCard item={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* === BOTTOM INFO BAR === */}
        <div className="border-t border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 lg:py-4">
            <div className="flex flex-wrap items-center justify-center lg:justify-between gap-3 lg:gap-4">
              {[
                { icon: Truck, label: 'Free Express Delivery', sub: 'Orders above ₹999' },
                { icon: ShieldCheck, label: '1 Year Warranty', sub: 'Brand assured' },
                { icon: Timer, label: '30-Day Returns', sub: 'No questions asked' },
                { icon: Star, label: '4.8★ Trust Score', sub: '50K+ reviews' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex items-center gap-1.5 lg:gap-2 text-slate-500">
                    <Icon size={12} className="lg:hidden text-emerald-500" />
                    <Icon size={14} className="hidden lg:block text-emerald-500" />
                    <div>
                      <p className="text-[9px] lg:text-[10px] font-semibold text-slate-700">{item.label}</p>
                      <p className="text-[7px] lg:text-[8px] text-slate-400">{item.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
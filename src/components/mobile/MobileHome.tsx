import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MobileHeader from './MobileHeader'
import CategoryCarousel from './CategoryCarousel'
import BenefitsBanner from './BenefitsBanner'
import HeroCarousel from './HeroCarousel'
import AdCarousel from './AdCarousel'
import { ProductSection } from './ProductSection'
import FlashSale from './FlashSale'
import RepairServices from './RepairServices'
import RefurbishedSection from './RefurbishedSection'
import FeaturedCollections from './FeaturedCollections'
import VideoShowcase from './VideoShowcase'
import TopSales from './TopSales'
import CouponsOffers from './CouponsOffers'
import Partners from './Partners'
import Testimonials from './Testimonials'
import MobileBottomNav from './MobileBottomNav'
import MobileCartBarActions from './MobileCartBarActions'
import MobileHomeLoader from './MobileHomeLoader'
import { categoryService, type Category } from '../../services/categoryService'
import { productService } from '../../services/productService'

type Slide = { id?: number; title?: string; subtitle?: string; image?: string; link?: string }

// Reuse the exact same hero imagery/text as the web (desktop) LandingPage
const HERO_SLIDES: Slide[] = [
  { title: 'Premium TWS Earbuds — Crystal Clarity', subtitle: 'Noise-cancelling wireless earbuds with immersive sound.', image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=1920&q=80', link: '/collection/all' },
  { title: 'Premium Headphones & Audio Gear', subtitle: 'Wireless earbuds and high-fidelity audio for every budget.', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1920&q=80', link: '/collection/all' },
  { title: 'Phone Accessories & Enhancements', subtitle: 'Fast chargers, premium cases, screen protectors, power banks.', image: 'https://images.unsplash.com/photo-1592890288564-76628a30a657?w=1920&q=80', link: '/collection/all' },
  { title: 'Quality Spare Parts & Repairs', subtitle: 'Genuine screens, batteries, charging ports — certified service.', image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1920&q=80', link: '/repairs' },
  { title: 'One Stop Tech Store — All You Need', subtitle: 'From phones to accessories to repairs under one roof.', image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1920&q=80', link: '/collection/all' },
]

// Module-level cache: persists across re-mounts (navigating back from product detail).
// On first load → fetch from API and cache. On subsequent mounts → use cache instantly.
let cachedData: {
  categories: Category[]
  flashSale: any[]
  trending: any[]
  bestSellers: any[]
  newArrivals: any[]
  featured: any[]
  refurbished: any[]
  recommended: any[]
} | null = null

export default function MobileHome() {
  const [categories, setCategories] = useState<Category[]>(() => cachedData?.categories ?? [])
  const [heroSlides] = useState<Slide[]>(HERO_SLIDES)
  const [flashSale, setFlashSale] = useState<any[]>(() => cachedData?.flashSale ?? [])
  const [trending, setTrending] = useState<any[]>(() => cachedData?.trending ?? [])
  const [bestSellers, setBestSellers] = useState<any[]>(() => cachedData?.bestSellers ?? [])
  const [newArrivals, setNewArrivals] = useState<any[]>(() => cachedData?.newArrivals ?? [])
  const [featured, setFeatured] = useState<any[]>(() => cachedData?.featured ?? [])
  const [refurbished, setRefurbished] = useState<any[]>(() => cachedData?.refurbished ?? [])
  const [recommended, setRecommended] = useState<any[]>(() => cachedData?.recommended ?? [])
  const [loading, setLoading] = useState(!cachedData)

  useEffect(() => {
    if (cachedData) return
    let cancelled = false
    const load = async () => {
      const [cats, trend, best, fresh, feat, refurb, all] = await Promise.all([
        categoryService.list().catch(() => [] as Category[]),
        productService.list({ is_trending: true, page_size: 10 } as any).catch(() => [] as any[]),
        productService.list({ is_best_selling: true, page_size: 10 } as any).catch(() => [] as any[]),
        productService.list({ is_new_arrival: true, page_size: 10 } as any).catch(() => [] as any[]),
        productService.list({ is_featured: true, page_size: 10 } as any).catch(() => [] as any[]),
        productService.list({ is_refurbished: true, page_size: 10 } as any).catch(() => [] as any[]),
        productService.list({ page_size: 12 } as any).catch(() => [] as any[]),
      ])

      if (cancelled) return

      const activeCats = cats.filter((c) => c.status === 'active')
      const deals = all.filter((p) => {
        const v = (p.variants || [])[0]
        return v && v.discountPrice > 0 && v.discountPrice < v.price
      })

      cachedData = {
        categories: activeCats,
        flashSale: deals.slice(0, 10),
        trending: trend.slice(0, 10),
        bestSellers: best.slice(0, 10),
        newArrivals: fresh.slice(0, 10),
        featured: feat.slice(0, 10),
        refurbished: refurb.slice(0, 10),
        recommended: all.slice(0, 10),
      }

      setCategories(cachedData.categories)
      setFlashSale(cachedData.flashSale)
      setTrending(cachedData.trending)
      setBestSellers(cachedData.bestSellers)
      setNewArrivals(cachedData.newArrivals)
      setFeatured(cachedData.featured)
      setRefurbished(cachedData.refurbished)
      setRecommended(cachedData.recommended)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-[#FFFBFB] font-sans text-[#1F2937] max-w-[480px] mx-auto relative" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* Full-screen animated loading overlay — Zepto/Blinkit style */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="home-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <MobileHomeLoader />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky header + category wrapper — stays pinned on scroll, no flicker */}
      <div className="sticky top-0 z-50 bg-[#FFFBFB] will-change-transform" style={{ transform: 'translateZ(0)' }}>
        <MobileHeader />
        <div className="bg-[#FFFBFB] pt-9 pb-3">
          <CategoryCarousel categories={categories} />
        </div>
      </div>

      <div className="px-4 mt-4">
        <p className="text-[18px] font-extrabold text-[#1F2937] leading-snug tracking-tight">
          Welcome to Mobile Shop 👋
        </p>
        <p className="text-[13px] text-[#6B7280] mt-1 leading-snug font-medium">
          Find the best phones, accessories & deals — all in one place.
        </p>
      </div>

      <div className="pb-28">
        <HeroCarousel />
        <BenefitsBanner />

        <FlashSale products={flashSale} />
        <ProductSection title="Trending Products" viewAllTo="/collection/all?tab=trending" products={trending} />
        <FeaturedCollections />
        <ProductSection title="Best Sellers" viewAllTo="/collection/all?tab=best" products={bestSellers} />
        <TopSales banner={heroSlides[0]} products={[...bestSellers, ...trending, ...featured].slice(0, 5)} />
        <ProductSection title="New Arrivals" viewAllTo="/collection/all?tab=new" products={newArrivals} />
        <CouponsOffers />
        <ProductSection title="Featured" viewAllTo="/collection/all?tab=featured" products={featured} />
        <AdCarousel />
        <RefurbishedSection products={refurbished} />
        <RepairServices />
        <VideoShowcase />
        <Partners />
        <Testimonials />
        <ProductSection title="Recommended For You" viewAllTo="/collection/all" products={recommended} />
      </div>

      <MobileBottomNav />
      <MobileCartBarActions />
    </div>
  )
}

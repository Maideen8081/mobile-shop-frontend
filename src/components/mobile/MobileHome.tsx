import { useEffect, useState } from 'react'
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
import CouponsOffers from './CouponsOffers'
import Partners from './Partners'
import Testimonials from './Testimonials'
import StoreLocation from '../ecommerce/StoreLocation'
import MobileBottomNav from './MobileBottomNav'
import MobileCartBarActions from './MobileCartBarActions'
import { useBootHold } from '../LoadingScreen/bootLoader'
import { categoryService, type Category } from '../../services/categoryService'
import { productService } from '../../services/productService'
import '../../pages/HomeTheme.css'

// Module-level cache: persists across re-mounts (navigating back from product detail).
// On first load → fetch from API and cache. On subsequent mounts → use cache instantly.
let sharedCachedData: {
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
  const [categories, setCategories] = useState<Category[]>(() => sharedCachedData?.categories ?? [])
  const [flashSale, setFlashSale] = useState<any[]>(() => sharedCachedData?.flashSale ?? [])
  const [trending, setTrending] = useState<any[]>(() => sharedCachedData?.trending ?? [])
  const [bestSellers, setBestSellers] = useState<any[]>(() => sharedCachedData?.bestSellers ?? [])
  const [newArrivals, setNewArrivals] = useState<any[]>(() => sharedCachedData?.newArrivals ?? [])
  const [featured, setFeatured] = useState<any[]>(() => sharedCachedData?.featured ?? [])
  const [refurbished, setRefurbished] = useState<any[]>(() => sharedCachedData?.refurbished ?? [])
  const [recommended, setRecommended] = useState<any[]>(() => sharedCachedData?.recommended ?? [])
  const [loading, setLoading] = useState(!sharedCachedData)
  // Keeps the app's first-load splash up until the home data arrives.
  useBootHold(loading)

  useEffect(() => {
    if (sharedCachedData) return
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

      // Only real catalog data: a section with nothing to show is hidden, never filled with mock items.
      const activeCats = cats.filter((c) => c.status === 'active' && (c.products ?? 0) > 0)
      const deals = all.filter((p) => {
        const v = (p.variants || [])[0]
        return v && v.discountPrice > 0 && v.discountPrice < v.price
      })

      sharedCachedData = {
        categories: activeCats,
        flashSale: deals.slice(0, 10),
        trending: trend.slice(0, 10),
        bestSellers: best.slice(0, 10),
        newArrivals: fresh.slice(0, 10),
        featured: feat.slice(0, 10),
        refurbished: refurb.slice(0, 10),
        recommended: all.slice(0, 10),
      }

      setCategories(sharedCachedData.categories)
      setFlashSale(sharedCachedData.flashSale)
      setTrending(sharedCachedData.trending)
      setBestSellers(sharedCachedData.bestSellers)
      setNewArrivals(sharedCachedData.newArrivals)
      setFeatured(sharedCachedData.featured)
      setRefurbished(sharedCachedData.refurbished)
      setRecommended(sharedCachedData.recommended)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="home-theme mobile-home min-h-screen font-sans text-[#1d2522] max-w-[480px] mx-auto relative" style={{ fontFamily: 'var(--font-ui)' }}>

      {/* Sticky header + category wrapper — stays pinned on scroll, no flicker */}
      <div className="mobile-home-header sticky top-0 z-50 will-change-transform" style={{ transform: 'translateZ(0)' }}>
        <MobileHeader />
        <div className="pt-9 pb-3">
          <CategoryCarousel categories={categories} />
        </div>
      </div>

      <main className="pb-28">
        <div className="mobile-home-intro">
          <h1>PhoneFix</h1>
          <p>Phones, accessories and expert repairs.</p>
        </div>
        <HeroCarousel />
        <BenefitsBanner />

        <FlashSale products={flashSale} />
        <ProductSection title="Trending Products" viewAllTo="/collection/all?tab=trending" products={trending} />
        <FeaturedCollections />
        <ProductSection title="Best Sellers" viewAllTo="/collection/all?tab=best" products={bestSellers} />
        <ProductSection title="New Arrivals" viewAllTo="/collection/all?tab=new" products={newArrivals} />
        <CouponsOffers />
        <ProductSection title="Featured" viewAllTo="/collection/all?tab=featured" products={featured} />
        <AdCarousel />
        <RefurbishedSection products={refurbished} loading={loading && refurbished.length === 0} />
        <RepairServices />
        <VideoShowcase />
        <Partners />
        <Testimonials />
        <ProductSection title="Recommended For You" viewAllTo="/collection/all" products={recommended} />
        <StoreLocation compact />
      </main>

      <MobileBottomNav />
      <MobileCartBarActions />
    </div>
  )
}

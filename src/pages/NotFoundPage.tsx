import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import ProductSuggestions from '../components/ecommerce/ProductSuggestions'
import { usePageMeta } from '../hooks/usePageMeta'

/** Catch-all for unknown URLs. */
export default function NotFoundPage() {
  usePageMeta({ title: 'Page not found', description: 'The page you are looking for does not exist.', noindex: true })
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <div className="min-h-screen bg-[#FFF7F3] text-[#210D35]">
      <SiteTopNav />
      <main className="px-4 py-16 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#4A2470]">Error 404</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">We can’t find that page</h1>
        <p className="mx-auto mt-3 max-w-md text-[#6b6b70]">
          The link may be broken or the page may have moved. Try one of these instead.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/home" className="inline-flex h-11 items-center rounded-full bg-[#210D35] px-6 text-sm font-bold text-[#FFF7F3]">Go to home</Link>
          <Link to="/collection/all" className="inline-flex h-11 items-center rounded-full border border-[#210D35]/20 px-6 text-sm font-bold">Browse products</Link>
          <Link to="/support" className="inline-flex h-11 items-center rounded-full border border-[#210D35]/20 px-6 text-sm font-bold">Get help</Link>
        </div>
        <ProductSuggestions title="Popular right now" />
      </main>
    </div>
  )
}

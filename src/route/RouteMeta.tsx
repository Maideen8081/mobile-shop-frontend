import { useLocation } from 'react-router-dom'
import { usePageMeta, type PageMeta } from '../hooks/usePageMeta'

const STATIC: Record<string, PageMeta> = {
  '/': { description: 'Explore phones, audio and charging gear, then step into the PhoneFix store.' },
  '/home': { description: 'Shop the latest smartphones, earbuds, chargers and certified refurbished phones, with fast delivery and expert repairs.' },
  '/search': { title: 'Search' },
  '/repairs': { title: 'Phone Repair Services', description: 'Screen, battery, charging port and water-damage repairs with genuine parts and a 6-month warranty.' },
  '/book-repair': { title: 'Book a Repair', description: 'Book a phone repair in four quick steps. Free diagnosis and upfront quotes.' },
  '/phones': { title: 'Smartphones', description: 'Latest flagship and value smartphones from Apple, Samsung, Google and more.' },
  '/accessories': { title: 'Accessories', description: 'Earbuds, headphones, chargers, cables and power banks from brands you trust.' },
  '/trade-in': { title: 'Trade-In', description: 'Get an instant trade-in quote for your old phone and save on your next upgrade.' },
  '/about': { title: 'About Us', description: 'PhoneFix sells genuine phones and accessories and repairs devices with certified technicians.' },
  '/support': { title: 'Support', description: 'Chat with PhoneFix support about orders, repairs and products.' },
  '/login': { title: 'Log in', noindex: true },
  '/signup': { title: 'Create account', noindex: true },
  '/cart': { title: 'Cart', noindex: true },
  '/wishlist': { title: 'Wishlist', noindex: true },
  '/orders': { title: 'My Orders', noindex: true },
  '/profile': { title: 'My Profile', noindex: true },
  '/my-repairs': { title: 'My Repairs', noindex: true },
}

function metaFor(pathname: string): PageMeta {
  if (STATIC[pathname]) return STATIC[pathname]
  if (pathname.startsWith('/checkout')) return { title: 'Checkout', noindex: true }
  if (pathname.startsWith('/admin')) return { title: 'Admin', noindex: true }
  if (pathname.startsWith('/collection/')) return { title: 'Shop' }
  if (pathname.startsWith('/product/')) return { title: 'Product' }
  return {}
}

/** Default page title/description per route; pages with richer data override it. */
export default function RouteMeta() {
  const { pathname } = useLocation()
  usePageMeta(metaFor(pathname))
  return null
}

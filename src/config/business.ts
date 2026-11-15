/**
 * Business facts shown across the site. Keep every number and contact here so
 * pages never contradict each other. Real contact details come from env vars
 * (see .env.example); when one isn't set, the link is hidden rather than
 * showing a placeholder.
 */
import { MAX_TRADE_IN_VALUE } from '../data/tradeInPrices'

const env = import.meta.env

const phoneDigits = String(env.VITE_CONTACT_PHONE || '').replace(/[^\d+]/g, '')

export const BUSINESS = {
  name: 'PhoneFix',
  /** e.g. +919812345678 — empty hides phone links. */
  phoneTel: phoneDigits,
  phoneDisplay: phoneDigits ? formatIndianPhone(phoneDigits) : '',
  whatsappUrl: phoneDigits ? `https://wa.me/${phoneDigits.replace(/^\+/, '')}` : '',
  email: String(env.VITE_CONTACT_EMAIL || 'support@phonefixpro.com'),
  city: 'Chennai, Tamil Nadu',
  hours: 'Mon – Sat, 10 AM – 8 PM',
  instagramUrl: String(env.VITE_INSTAGRAM_URL || ''),
  facebookUrl: String(env.VITE_FACEBOOK_URL || ''),
  youtubeUrl: String(env.VITE_YOUTUBE_URL || ''),
  // Claims (one source of truth).
  devicesRepaired: '5,000+',
  expressRepairMinutes: 45,
  repairWarrantyMonths: 6,
  tradeInMaxValue: MAX_TRADE_IN_VALUE,
  freeDeliveryOver: 500,
  returnDays: 7,
} as const

export const tradeInUpTo = () => `₹${BUSINESS.tradeInMaxValue.toLocaleString('en-IN')}`

function formatIndianPhone(tel: string): string {
  const d = tel.replace(/^\+?91/, '')
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : tel
}

export const POLICY_LINKS = [
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/refund-policy', label: 'Refund Policy' },
  { to: '/shipping-policy', label: 'Shipping Policy' },
]

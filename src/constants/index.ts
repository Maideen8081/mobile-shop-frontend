import { type Variants } from 'framer-motion'

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0 },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0 },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

export const springTap = { type: 'spring' as const, stiffness: 400, damping: 17 }

export const easeOut = 'easeOut' as const

export const INPUT_CLASSES =
  'w-full px-4 py-3 rounded-xl border border-border bg-surface-lighter text-sm text-text-primary placeholder-text-label outline-none transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20'

export const SHADOW_CARD = '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'

export type StoreBenefit = { icon: string; title: string; subtitle: string }
export type StoreBenefitBadge = { icon: string; label: string }

export const STORE_BENEFITS: StoreBenefit[] = [
  { icon: 'truck', title: 'Free Shipping', subtitle: 'On all orders' },
  { icon: 'shield', title: 'Secure Payment', subtitle: '100% protected' },
]

export const STORE_BENEFIT_BADGES: StoreBenefitBadge[] = [
  { icon: 'check', label: 'Free Shipping' },
  { icon: 'check', label: 'Secure Payment' },
  { icon: 'check', label: 'Easy Returns' },
  { icon: 'check', label: 'Genuine Products' },
]

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ShoppingCart,
  Headphones,
  Smartphone,
  Package,
  Truck,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Clock,
  Star,
} from 'lucide-react'

const stages = [
  {
    Icon: ShoppingCart,
    animation: 'loader-float',
    message: 'Finding the best products...',
    sub: 'Scanning thousands of items',
  },
  {
    Icon: Headphones,
    animation: 'loader-bounce-x',
    message: 'Loading your favorites...',
    sub: 'Curating top picks for you',
  },
  {
    Icon: Smartphone,
    animation: 'loader-scale-pulse',
    message: 'Preparing today\'s deals...',
    sub: 'Unbeatable prices await',
  },
  {
    Icon: Package,
    animation: 'loader-rotate',
    message: 'Almost ready...',
    sub: 'Finalizing your storefront',
  },
  {
    Icon: Truck,
    animation: 'loader-drive',
    message: 'Fresh products on the way...',
    sub: 'Fast delivery guaranteed',
  },
  {
    Icon: ShoppingBag,
    animation: 'loader-float',
    message: 'Just a moment more...',
    sub: 'Your shop is loading',
  },
]

const trustBadges = [
  { Icon: Zap, label: '10-Min Delivery' },
  { Icon: ShieldCheck, label: 'Quality Assured' },
  { Icon: Clock, label: '24/7 Support' },
  { Icon: Star, label: 'Top Rated' },
]

export default function MobileHomeLoader() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => (prev + 1) % stages.length)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  const { Icon, animation, message, sub } = stages[stage]

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col overflow-hidden"
      style={{
        width: '100vw',
        height: '100dvh',
        touchAction: 'none',
        userSelect: 'none',
        background: 'linear-gradient(160deg, #1a0533 0%, #2d1065 25%, #6C3BFF 55%, #8B5CF6 80%, #a78bfa 100%)',
      }}
    >
      {/* Decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/3 -left-16 w-48 h-48 rounded-full bg-purple-300/10 blur-2xl" />
        <div className="absolute bottom-20 right-0 w-56 h-56 rounded-full bg-indigo-400/8 blur-3xl" />
      </div>

      {/* ─── TOP: App branding + delivery promise ─── */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-14 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/10">
            <ShoppingBag size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white text-[18px] font-extrabold tracking-tight leading-tight">PhoneFix Pro</p>
            <p className="text-white/50 text-[11px] font-medium tracking-wide">Your Tech Store</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <Truck size={13} className="text-green-400" />
          <span className="text-white/80 text-[11px] font-semibold">10-min delivery</span>
        </div>
      </div>

      {/* ─── CENTER: Animated icon + messages ─── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Animated icon circle */}
        <div className="relative w-[200px] h-[200px] mb-8">
          {/* Glow ring */}
          <div
            className="absolute inset-[-8px] rounded-full opacity-40"
            style={{
              background: 'conic-gradient(from 0deg, transparent, rgba(139,92,246,0.5), transparent, rgba(139,92,246,0.5), transparent)',
              animation: 'spin 4s linear infinite',
            }}
          />
          {/* Main circle */}
          <div
            className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-xl border border-white/15"
            style={{ boxShadow: '0 25px 80px rgba(108,59,255,0.3), inset 0 1px 1px rgba(255,255,255,0.1)' }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: 15 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className={animation}>
                <Icon size={88} className="text-white drop-shadow-lg" strokeWidth={1.3} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Loading message + subtitle */}
        <div className="text-center h-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-white text-[19px] font-bold tracking-tight">{message}</p>
              <p className="text-white/50 text-[13px] font-medium mt-1.5">{sub}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2.5 mt-8">
          {stages.map((_, i) => (
            <div
              key={i}
              className="relative"
            >
              <span
                className={`block rounded-full transition-all duration-500 ${
                  i === stage
                    ? 'w-7 h-2 bg-white'
                    : i < stage
                    ? 'w-2 h-2 bg-white/50'
                    : 'w-2 h-2 bg-white/25'
                }`}
              />
            </div>
          ))}
        </div>

        <p className="text-white/40 text-[11px] mt-5 font-semibold tracking-widest uppercase">Please wait</p>
      </div>

      {/* ─── BOTTOM: Trust badges ─── */}
      <div className="relative z-10 px-6 pb-10">
        <div className="flex items-center justify-center gap-6">
          {trustBadges.map(({ Icon: BadgeIcon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-white/8 backdrop-blur flex items-center justify-center border border-white/8">
                <BadgeIcon size={16} className="text-white/60" />
              </div>
              <span className="text-white/40 text-[9px] font-semibold tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

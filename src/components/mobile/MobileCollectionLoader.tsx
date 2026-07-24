import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag, Zap, Truck, ShieldCheck, Star } from 'lucide-react'

const messages = [
  { text: 'Loading products...', sub: 'Scanning thousands of items' },
  { text: 'Curating best deals...', sub: 'Unbeatable prices await' },
  { text: 'Preparing collection...', sub: 'Premium products incoming' },
  { text: 'Almost ready...', sub: 'Finalizing your storefront' },
]

const badges = [
  { Icon: Zap, label: '10-Min Delivery' },
  { Icon: ShieldCheck, label: 'Quality Assured' },
  { Icon: Truck, label: 'Fast Shipping' },
  { Icon: Star, label: 'Top Rated' },
]

export default function MobileCollectionLoader() {
  const [stage, setStage] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
    setElapsed(0)
    let raf: number
    const tick = () => {
      setElapsed(Date.now() - startRef.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setStage((p) => (p + 1) % messages.length), 2000)
    return () => clearInterval(t)
  }, [])

  const secs = (elapsed / 1000).toFixed(1)
  const { text, sub } = messages[stage]

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      {/* Pulsing bag icon */}
      <div className="relative mb-8">
        {/* Glow */}
        <div
          className="absolute inset-[-20px] rounded-full blur-2xl opacity-20"
          style={{ background: '#4F46E5' }}
        />
        {/* Pulse rings */}
        <div className="absolute inset-[-12px] rounded-full border border-[#4F46E5]/15 collection-pulse-1" />
        <div className="absolute inset-[-12px] rounded-full border border-[#4F46E5]/10 collection-pulse-2" />

        <div className="relative w-[88px] h-[88px] rounded-full bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center shadow-[0_16px_48px_rgba(79,70,229,0.3)]">
          <div className="absolute inset-[4px] rounded-full border border-white/15" />
          <ShoppingBag size={36} className="text-white" strokeWidth={1.8} />
        </div>
      </div>

      {/* Message */}
      <div className="h-12 flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            <p className="text-[15px] font-bold text-[#1F2937]">{text}</p>
            <p className="text-[12px] text-[#9CA3AF] mt-0.5">{sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="w-[200px] mt-6">
        <div className="h-[3px] rounded-full bg-[#F1F5F9] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#818CF8]"
            style={{
              width: elapsed < 500 ? '15%' : elapsed < 1500 ? '45%' : elapsed < 2500 ? '75%' : '92%',
              transition: 'width 0.6s ease',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-[#9CA3AF] font-medium">{secs}s elapsed</span>
          <span className="text-[10px] text-[#4F46E5] font-bold">{stage + 1}/{messages.length}</span>
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-5 mt-8">
        {badges.map(({ Icon: BadgeIcon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-xl bg-[#F1ECFF] flex items-center justify-center">
              <BadgeIcon size={14} className="text-[#4F46E5]" />
            </div>
            <span className="text-[9px] text-[#9CA3AF] font-semibold">{label}</span>
          </div>
        ))}
      </div>

      <style>{`
        .collection-pulse-1 { animation: cpulse 2s ease-out infinite; }
        .collection-pulse-2 { animation: cpulse 2s ease-out 0.7s infinite; }
        @keyframes cpulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

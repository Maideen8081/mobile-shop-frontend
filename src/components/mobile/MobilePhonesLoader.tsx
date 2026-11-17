import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Smartphone, Zap, ShieldCheck, Truck, Star } from 'lucide-react'

const messages = [
  { text: 'Loading phones...', sub: 'Finding the best deals' },
  { text: 'Scanning flagships...', sub: 'iPhone, Galaxy, Pixel & more' },
  { text: 'Almost ready...', sub: 'Setting up your collection' },
]

const badges = [
  { Icon: Zap, label: 'Fast Delivery', color: '#059669' },
  { Icon: ShieldCheck, label: 'Genuine', color: '#0f3b2c' },
  { Icon: Truck, label: 'Free Ship', color: '#0EA5E9' },
  { Icon: Star, label: 'Top Rated', color: '#F59E0B' },
]

export default function MobilePhonesLoader() {
  const [stage, setStage] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
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

  const { text, sub } = messages[stage]
  const progress = Math.min((elapsed / 2000) * 100, 92)

  return (
    <div className="flex flex-col items-center py-10 px-5">
      {/* Icon */}
      <div className="relative mb-5">
        <div className="absolute inset-[-16px] rounded-[8px] bg-[#0f3b2c]/10 blur-xl" />
        <div className="absolute inset-[-10px] rounded-[8px] border border-[#0f3b2c]/10 ploader-pulse-1" />
        <div className="absolute inset-[-10px] rounded-[8px] border border-[#0f3b2c]/5 ploader-pulse-2" />

        <div className="relative w-[72px] h-[72px] rounded-[8px] bg-gradient-to-br from-[#0f3b2c] to-[#18503c] flex items-center justify-center shadow-[0_12px_32px_rgba(15,59,44,0.25)]">
          <div className="absolute inset-[3px] rounded-[8px] border border-white/15" />
          <Smartphone size={30} className="text-white" strokeWidth={1.8} />
        </div>
      </div>

      {/* Message */}
      <div className="text-center min-h-[44px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-body-sm font-bold text-[#1d2522]">{text}</p>
            <p className="text-micro text-[#9aa29e] mt-0.5">{sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress */}
      <div className="w-[180px] mt-4">
        <div className="h-[2px] rounded-[8px] bg-[#f7f6f2] overflow-hidden">
          <motion.div
            className="h-full rounded-[8px] bg-gradient-to-r from-[#0f3b2c] to-[#18503c]"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-micro text-[#d6d6cd] text-center mt-1.5 font-medium">{(elapsed / 1000).toFixed(1)}s</p>
      </div>

      {/* Skeleton cards */}
      <div className="grid grid-cols-2 gap-2.5 mt-6 w-full max-w-[340px]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-[#f7f6f2] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="aspect-square bg-gradient-to-br from-[#F8F9FB] to-[#FDD] ploader-shimmer" style={{ animationDelay: `${i * 150}ms` }} />
            <div className="p-2.5">
              <div className="h-2.5 bg-[#f7f6f2] rounded-[8px] w-3/4 ploader-shimmer" style={{ animationDelay: `${i * 150 + 100}ms` }} />
              <div className="h-2 bg-[#F8F9FB] rounded-[8px] w-1/2 mt-1.5 ploader-shimmer" style={{ animationDelay: `${i * 150 + 200}ms` }} />
              <div className="flex items-center justify-between mt-2">
                <div className="h-3 bg-[#dfe6cf] rounded-[8px] w-16 ploader-shimmer" style={{ animationDelay: `${i * 150 + 300}ms` }} />
                <div className="h-5 bg-[#0f3b2c]/10 rounded-[8px] w-10 ploader-shimmer" style={{ animationDelay: `${i * 150 + 400}ms` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="flex items-center justify-center gap-5 mt-6">
        {badges.map(({ Icon: BadgeIcon, label, color }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}10` }}>
              <BadgeIcon size={13} style={{ color }} strokeWidth={2} />
            </div>
            <span className="text-micro text-[#94A3B8] font-semibold">{label}</span>
          </div>
        ))}
      </div>

      <style>{`
        .ploader-pulse-1 { animation: ppulse 2s ease-out infinite; }
        .ploader-pulse-2 { animation: ppulse 2s ease-out 0.7s infinite; }
        @keyframes ppulse {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .ploader-shimmer {
          background: linear-gradient(110deg, #f7f6f2 30%, #FDD 50%, #f7f6f2 70%);
          background-size: 200% 100%;
          animation: pshimmer 1.8s ease-in-out infinite;
        }
        @keyframes pshimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

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
  { Icon: ShieldCheck, label: 'Genuine', color: '#4F46E5' },
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
        <div className="absolute inset-[-16px] rounded-full bg-[#6C3BFF]/10 blur-xl" />
        <div className="absolute inset-[-10px] rounded-full border border-[#6C3BFF]/10 ploader-pulse-1" />
        <div className="absolute inset-[-10px] rounded-full border border-[#6C3BFF]/5 ploader-pulse-2" />

        <div className="relative w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#6C3BFF] to-[#4B2ECC] flex items-center justify-center shadow-[0_12px_32px_rgba(108,59,255,0.25)]">
          <div className="absolute inset-[3px] rounded-full border border-white/15" />
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
            <p className="text-[14px] font-bold text-[#1F2937]">{text}</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">{sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress */}
      <div className="w-[180px] mt-4">
        <div className="h-[2px] rounded-full bg-[#F1F5F9] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#6C3BFF] to-[#818CF8]"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-[9px] text-[#CBD5E1] text-center mt-1.5 font-medium">{(elapsed / 1000).toFixed(1)}s</p>
      </div>

      {/* Skeleton cards */}
      <div className="grid grid-cols-2 gap-2.5 mt-6 w-full max-w-[340px]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-[#F1F5F9] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="aspect-square bg-gradient-to-br from-[#F8F9FB] to-[#EDE9FE] ploader-shimmer" style={{ animationDelay: `${i * 150}ms` }} />
            <div className="p-2.5">
              <div className="h-2.5 bg-[#F1F5F9] rounded-full w-3/4 ploader-shimmer" style={{ animationDelay: `${i * 150 + 100}ms` }} />
              <div className="h-2 bg-[#F8F9FB] rounded-full w-1/2 mt-1.5 ploader-shimmer" style={{ animationDelay: `${i * 150 + 200}ms` }} />
              <div className="flex items-center justify-between mt-2">
                <div className="h-3 bg-[#EEF2FF] rounded-full w-16 ploader-shimmer" style={{ animationDelay: `${i * 150 + 300}ms` }} />
                <div className="h-5 bg-[#6C3BFF]/10 rounded-full w-10 ploader-shimmer" style={{ animationDelay: `${i * 150 + 400}ms` }} />
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
            <span className="text-[8px] text-[#94A3B8] font-semibold">{label}</span>
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
          background: linear-gradient(110deg, #F1F5F9 30%, #EDE9FE 50%, #F1F5F9 70%);
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

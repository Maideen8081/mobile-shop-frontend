import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ShoppingBag,
  Zap,
  ShieldCheck,
  Clock,
  Star,
  Smartphone,
  Headphones,
  Laptop,
  Watch,
  Camera,
  Speaker,
  Tablet,
} from 'lucide-react'

const stages = [
  { text: 'Discovering latest phones...', sub: 'New arrivals just dropped' },
  { text: 'Loading audio deals...', sub: 'Premium sound, best prices' },
  { text: 'Checking accessories...', sub: 'Cases, chargers & more' },
  { text: 'Preparing fast delivery...', sub: '10-minute express available' },
  { text: 'Setting up your store...', sub: 'Personalized for you' },
]

const orbitIcons = [
  { Icon: Smartphone, color: '#4F46E5' },
  { Icon: Headphones, color: '#0EA5E9' },
  { Icon: Laptop, color: '#7C3AED' },
  { Icon: Watch, color: '#059669' },
  { Icon: Camera, color: '#F59E0B' },
  { Icon: Speaker, color: '#E11D48' },
  { Icon: Tablet, color: '#6366F1' },
  { Icon: ShoppingBag, color: '#0EA5E9' },
]

const badges = [
  { Icon: Zap, label: '10-Min Delivery', color: '#34D399' },
  { Icon: ShieldCheck, label: '100% Genuine', color: '#60A5FA' },
  { Icon: Clock, label: '24/7 Support', color: '#FBBF24' },
  { Icon: Star, label: '4.9 Rating', color: '#F472B6' },
]

export default function MobileHomeLoader() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStage((p) => (p + 1) % stages.length), 2400)
    return () => clearInterval(t)
  }, [])

  const { text, sub } = stages[stage]

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{
        width: '100vw',
        height: '100dvh',
        background: 'linear-gradient(165deg, #1e1145 0%, #2d1b69 30%, #4F46E5 70%, #6366F1 100%)',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[-20%] w-[300px] h-[300px] rounded-full bg-white/[0.03] blur-[60px]" />
        <div className="absolute bottom-[20%] left-[-15%] w-[250px] h-[250px] rounded-full bg-purple-400/[0.06] blur-[50px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* ─── TOP: Brand ─── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-[14px] bg-white/12 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <ShoppingBag size={20} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-white text-[16px] font-extrabold tracking-[-0.02em]">PhoneFix Pro</p>
            <p className="text-white/40 text-[10px] font-semibold tracking-[0.08em] uppercase">Your Tech Store</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/8">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/70 text-[10px] font-semibold">Live</span>
        </div>
      </div>

      {/* ─── CENTER: White circle + rotating orbit icons ─── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Orbit ring + center */}
        <div className="relative w-[240px] h-[240px] mb-10">

          {/* Rotating orbit icons */}
          <div
            className="absolute inset-0"
            style={{ animation: 'h-orbit 10s linear infinite' }}
          >
            {orbitIcons.map(({ Icon, color }, i) => {
              const angle = (i / orbitIcons.length) * 360
              const rad = (angle * Math.PI) / 180
              const r = 92
              const x = 120 + r * Math.cos(rad) - 18
              const y = 120 + r * Math.sin(rad) - 18
              return (
                <div
                  key={i}
                  className="absolute w-[36px] h-[36px] rounded-full flex items-center justify-center"
                  style={{
                    left: x,
                    top: y,
                    background: `linear-gradient(135deg, ${color}DD, ${color}99)`,
                    boxShadow: `0 4px 12px ${color}40, 0 0 0 2px ${color}30`,
                    animation: 'h-orbit-reverse 10s linear infinite',
                  }}
                >
                  <Icon size={16} className="text-white" strokeWidth={2.2} />
                </div>
              )
            })}
          </div>

          {/* Center white circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative w-[100px] h-[100px] rounded-full bg-white flex items-center justify-center"
              style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.25), 0 0 0 6px rgba(255,255,255,0.08)' }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={stage}
                  initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.7, rotate: 20 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ShoppingBag size={40} className="text-[#4F46E5]" strokeWidth={1.8} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="text-center min-h-[56px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-white text-[17px] font-bold tracking-[-0.01em]">{text}</p>
              <p className="text-white/40 text-[12px] font-medium mt-1">{sub}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-1.5 mt-6">
          {stages.map((_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-all duration-400 ${
                i === stage ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ─── BOTTOM: Trust badges ─── */}
      <div className="relative z-10 px-5 pb-8">
        <div className="flex items-center justify-between">
          {badges.map(({ Icon: BadgeIcon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                style={{ background: `${color}15`, border: `1px solid ${color}20` }}
              >
                <BadgeIcon size={15} style={{ color }} strokeWidth={2} />
              </div>
              <span className="text-white/35 text-[8px] font-semibold tracking-wide text-center leading-tight max-w-[60px]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes h-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes h-orbit-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  )
}

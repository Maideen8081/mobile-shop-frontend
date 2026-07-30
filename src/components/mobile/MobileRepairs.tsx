import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Wrench, Smartphone, BatteryCharging, Droplets, Camera, Plug, Volume2, Lock, Cpu, Check, ShieldCheck, Clock, Star } from 'lucide-react'
import { BRAND } from './theme'

const services = [
  { icon: Smartphone, title: 'Screen Repair', desc: 'Cracked or shattered screen? We replace it with premium OEM-grade glass in under 60 minutes.' },
  { icon: BatteryCharging, title: 'Battery Replacement', desc: 'Fast, reliable battery swaps to bring your device back to full life with genuine components.' },
  { icon: Droplets, title: 'Water Damage Repair', desc: 'Advanced ultrasonic cleaning and component-level restoration for liquid-damaged devices.' },
  { icon: Camera, title: 'Camera Repair', desc: 'Fixing blurry shots, broken lenses, and camera module failures on all major brands.' },
  { icon: Plug, title: 'Charging Port Fix', desc: 'Loose or non-functional charging port? We diagnose and repair or replace the port assembly.' },
  { icon: Volume2, title: 'Speaker & Mic Repair', desc: 'Restore sound quality with precise speaker, earpiece, and microphone repairs.' },
  { icon: Lock, title: 'Software Unlocking', desc: 'iCloud lock removal, FRP bypass, and software-level issues resolved securely.' },
  { icon: Cpu, title: 'Motherboard Repair', desc: 'Advanced micro-soldering for board-level issues including no power, water damage, and more.' },
]

const brands = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Realme', 'Motorola']

const steps = [
  { step: '01', title: 'Bring It In', desc: 'Visit any of our locations or mail your device using our secure prepaid shipping kit.' },
  { step: '02', title: 'Free Diagnosis', desc: 'Our experts run a full diagnostic and provide a transparent quote with no hidden fees.' },
  { step: '03', title: 'We Fix It', desc: 'Certified technicians perform the repair using premium components in record time.' },
  { step: '04', title: 'Enjoy Peace of Mind', desc: 'Pick up your device with a 90-day warranty and a renewed sense of reliability.' },
]

const stats = [
  { label: 'Repairs Done', value: '10K+', icon: Wrench },
  { label: 'Avg. Time', value: '45 min', icon: Clock },
  { label: 'Warranty', value: '90 Days', icon: ShieldCheck },
  { label: 'Rating', value: '4.8★', icon: Star },
]

function ServiceCard({ service, index, onBook }: { service: typeof services[0]; index: number; onBook: (title: string) => void }) {
  const Icon = service.icon
  const [pressed, setPressed] = useState(false)

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={() => onBook(service.title)}
      className="w-full text-left active:scale-[0.98] transition-transform"
    >
      <div
        className={`rounded-2xl p-4 flex items-center gap-3.5 ${pressed ? 'border-[#CB202D] ring-2 ring-[#CB202D]/15' : ''}`}
        style={{
          background: '#ffffff',
          border: `1px solid ${BRAND.line}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,32,45,0.1)', color: BRAND.primary }}>
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold leading-tight" style={{ color: BRAND.ink }}>{service.title}</h3>
          <p className="text-[11.5px] mt-0.5 leading-snug line-clamp-2" style={{ color: BRAND.muted }}>{service.desc}</p>
        </div>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,32,45,0.1)' }}>
          <ArrowRight size={14} style={{ color: BRAND.primary }} />
        </div>
      </div>
    </motion.button>
  )
}

function StepCard({ item, idx, active }: { item: typeof steps[0]; idx: number; active: boolean }) {
  return (
    <motion.div
      animate={{ scale: active ? 1.01 : 1 }}
      className={`rounded-2xl p-4 flex gap-3.5 transition-all duration-300`}
      style={{
        background: active ? 'rgba(203,32,45,0.06)' : '#ffffff',
        border: `1px solid ${active ? 'rgba(203,32,45,0.3)' : BRAND.line}`,
        boxShadow: active ? '0 4px 20px rgba(203,32,45,0.1)' : '0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div className="relative flex-shrink-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg ${active ? 'text-white' : ''}`}
          style={{ background: active ? 'linear-gradient(135deg,#CB202D,#A81D2A)' : 'rgba(203,32,45,0.08)', color: active ? '#fff' : BRAND.muted }}>
          {active ? <Check size={18} /> : item.step}
        </div>
        {idx < steps.length - 1 && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6" style={{ background: active ? BRAND.primary : BRAND.line }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[14px] font-bold" style={{ color: BRAND.ink }}>{item.title}</h3>
        <p className="text-[11.5px] mt-0.5 leading-snug" style={{ color: BRAND.muted }}>{item.desc}</p>
      </div>
    </motion.div>
  )
}

export default function MobileRepairs() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  const handleBook = (title?: string) => {
    navigate(title ? `/book-repair/${encodeURIComponent(title)}` : '/book-repair')
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: '#FFFBFB', color: BRAND.ink }}>
      {/* ─── HEADER ─── */}
      <div className="relative z-30 w-full">
        <header
          className="relative w-full px-4 pt-3 pb-8 text-white overflow-hidden"
          style={{
            background: 'linear-gradient(135deg,#CB202D 0%,#A81D2A 100%)',
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-8 w-32 h-32 rounded-full bg-white/8 blur-3xl" />

          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center active:scale-90 transition flex-shrink-0"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[18px] font-bold leading-tight truncate">Repair Services</h1>
              <p className="text-[11px] text-white/80 mt-0.5 truncate">Professional device repair — fast & guaranteed</p>
            </div>
          </div>

          {/* Hero banner inside header */}
          <div className="relative z-10 mt-4">
            <div className="rounded-2xl p-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Wrench size={26} className="text-white" />
                  </motion.div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[17px] font-extrabold text-white leading-tight">We Fix It, Fast</h2>
                  <p className="text-[11px] text-white/80 mt-0.5">Screen, battery, water damage & more</p>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <span className="text-[10px] font-bold text-white">4.8</span>
                  <Star size={11} className="text-white fill-white" />
                </div>
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                {stats.map((s) => {
                  const SIcon = s.icon
                  return (
                    <div key={s.label} className="text-center">
                      <SIcon size={14} className="mx-auto text-white/80" />
                      <p className="text-[11px] font-extrabold text-white mt-0.5">{s.value}</p>
                      <p className="text-[8px] text-white/60 uppercase tracking-wider">{s.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* ─── SERVICES ─── */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[17px] font-extrabold tracking-tight" style={{ color: BRAND.ink }}>Our Services</h2>
            <p className="text-[11px] mt-0.5" style={{ color: BRAND.muted }}>Choose a repair type to get started</p>
          </div>
          <button onClick={() => handleBook()} className="text-[12px] font-bold flex items-center gap-0.5 active:opacity-70" style={{ color: BRAND.primary }}>
            View All <ArrowRight size={13} />
          </button>
        </div>

        <div className="space-y-2.5">
          {services.map((svc, idx) => (
            <ServiceCard key={svc.title} service={svc} index={idx} onBook={handleBook} />
          ))}
        </div>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(135deg,#CB202D,#A81D2A)' }} />
          <div>
            <h2 className="text-[17px] font-extrabold tracking-tight" style={{ color: BRAND.ink }}>How It Works</h2>
            <p className="text-[11px]" style={{ color: BRAND.muted }}>Four simple steps to get your device fixed</p>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <div className="space-y-3">
            {steps.map((item, idx) => (
              <StepCard key={item.step} item={item} idx={idx} active={idx === activeStep} />
            ))}
          </div>
        </AnimatePresence>
      </div>

      {/* ─── BRANDS ─── */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(135deg,#CB202D,#A81D2A)' }} />
          <div>
            <h2 className="text-[17px] font-extrabold tracking-tight" style={{ color: BRAND.ink }}>Brands We Service</h2>
            <p className="text-[11px]" style={{ color: BRAND.muted }}>All major brands supported</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {brands.map((brand, i) => (
            <motion.div
              key={brand}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl px-4 py-2.5 font-bold text-[13px]"
              style={{
                background: '#ffffff',
                border: `1px solid ${BRAND.line}`,
                color: BRAND.ink,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              {brand}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── FAQ ─── */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(135deg,#CB202D,#A81D2A)' }} />
          <div>
            <h2 className="text-[17px] font-extrabold tracking-tight" style={{ color: BRAND.ink }}>Quick FAQs</h2>
            <p className="text-[11px]" style={{ color: BRAND.muted }}>Common questions answered</p>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { q: 'How long does a typical repair take?', a: 'Most repairs are completed within 45-60 minutes. Complex board-level repairs may take 24-48 hours.' },
            { q: 'Do you offer a warranty?', a: 'Yes! All repairs come with a 90-day warranty covering parts and labor.' },
            { q: 'Can I mail in my device?', a: 'Absolutely. We provide a secure prepaid shipping kit for mail-in repairs.' },
          ].map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <button
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full rounded-2xl p-4 text-left active:scale-[0.99] transition-transform"
                style={{
                  background: '#ffffff',
                  border: `1px solid ${BRAND.line}`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[13px] font-bold flex-1" style={{ color: BRAND.ink }}>{faq.q}</h3>
                  <motion.span
                    animate={{ rotate: activeFaq === i ? 180 : 0 }}
                    className="material-symbols-outlined text-lg flex-shrink-0" style={{ color: BRAND.primary }}
                  >
                    expand_more
                  </motion.span>
                </div>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[12px] mt-2 leading-relaxed overflow-hidden" style={{ color: BRAND.muted }}
                    >
                      {faq.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── CTA ─── */}
      <div className="px-4 mt-6 mb-8">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handleBook()}
          className="w-full flex items-center justify-center gap-2 rounded-2xl text-white text-[15px] font-bold shadow-lg"
          style={{
            background: 'linear-gradient(135deg,#CB202D,#A81D2A)',
            boxShadow: '0 8px 28px rgba(203,32,45,0.3)',
            height: '50px',
          }}
        >
          <Wrench size={18} />
          Schedule a Repair
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/my-repairs')}
          className="w-full flex items-center justify-center gap-2 rounded-2xl text-[15px] font-bold mt-3"
          style={{
            background: '#ffffff',
            border: `1.5px solid ${BRAND.primary}`,
            color: BRAND.primary,
            height: '50px',
          }}
        >
          <span className="material-symbols-outlined text-lg">history</span>
          My Repairs
        </motion.button>
        <p className="text-[10px] text-center mt-2" style={{ color: BRAND.muted }}>Free diagnosis — pay only if you approve the repair</p>
      </div>
    </div>
  )
}

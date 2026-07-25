import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Search, ArrowRight, Wrench, RefreshCw, Smartphone, BatteryCharging, Droplets, Camera, Plug, Volume2, Lock, Cpu } from 'lucide-react'

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

export default function MobileRepairs() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-[#0F172A] max-w-[480px] mx-auto pb-24">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#EEF1F4] shadow-[0_4px_16px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-2 px-3.5 h-[54px]">
          <button onClick={() => navigate(-1)} aria-label="Back" className="w-9 h-9 rounded-full bg-[#FEE2E6] flex items-center justify-center active:scale-90 transition flex-shrink-0">
            <ChevronLeft size={20} className="text-[#CB202D]" />
          </button>
          <div className="flex-1 flex justify-center min-w-0">
            <h1 className="text-[18px] font-extrabold text-[#1F2937] truncate">Repairs</h1>
          </div>
          <button onClick={() => navigate('/search')} aria-label="Search" className="w-9 h-9 rounded-full bg-[#FEE2E6] flex items-center justify-center active:scale-90 transition flex-shrink-0">
            <Search size={18} className="text-[#CB202D]" />
          </button>
        </div>

        {/* Hero banner */}
        <div className="px-3.5 pt-3.5">
          <div className="relative overflow-hidden rounded-3xl p-4 h-[140px] shadow-[0_12px_30px_rgba(203,32,45,0.22)]" style={{ background: 'linear-gradient(135deg,#CB202D 0%,#A81D2A 100%)' }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute right-3 bottom-3 w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Wrench size={26} className="text-white" />
            </div>
            <div className="relative z-10 flex flex-col justify-center h-full max-w-[80%]">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">
                <RefreshCw size={12} /> Repair Services
              </span>
              <h2 className="text-[20px] font-extrabold text-white leading-tight mt-1 drop-shadow-sm">We Fix It, Fast & Guaranteed</h2>
              <p className="text-[11.5px] text-white/90 mt-0.5 leading-snug">Screen, battery, water damage & more — done right.</p>
            </div>
          </div>
        </div>
      </header>

      {/* Services */}
      <div className="px-3.5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-extrabold text-[#0F172A] tracking-tight">Our Services</h2>
          <button onClick={() => navigate('/book-repair')} className="text-[12px] font-bold text-[#CB202D] flex items-center gap-0.5 active:opacity-70">
            Book <ArrowRight size={13} />
          </button>
        </div>

        <div className="space-y-2.5">
          {services.map((svc) => {
            const Icon = svc.icon
            return (
              <button
                key={svc.title}
                onClick={() => navigate(`/book-repair/${encodeURIComponent(svc.title)}`)}
                className="w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_16px_rgba(15,23,42,0.05)] p-3.5 flex items-center gap-3 text-left active:scale-[0.98] transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FEE2E6] text-[#CB202D] flex items-center justify-center flex-shrink-0">
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold text-[#1F2937] leading-tight">{svc.title}</h3>
                  <p className="text-[11.5px] text-[#64748B] mt-0.5 leading-snug line-clamp-2">{svc.desc}</p>
                </div>
                <ArrowRight size={16} className="text-[#CB202D] flex-shrink-0" />
              </button>
            )
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="px-3.5 mt-5">
        <h2 className="text-[17px] font-extrabold text-[#0F172A] tracking-tight mb-3">How It Works</h2>
        <div className="space-y-2.5">
          {steps.map((item, idx) => {
            const active = idx === activeStep
            return (
            <div key={item.step} className={`flex gap-3 items-center bg-white rounded-2xl border shadow-[0_4px_16px_rgba(15,23,42,0.05)] p-3.5 transition-all duration-500 ${active ? 'border-[#CB202D] ring-2 ring-[#CB202D]/20 -translate-y-0.5' : 'border-[#E5E7EB]'}`}>
              <span className={`font-extrabold text-2xl w-10 flex-shrink-0 ${active ? 'text-[#CB202D]' : 'text-[#CBD5E1]'}`}>{item.step}</span>
              <div className="min-w-0">
                <h3 className="text-[14px] font-bold text-[#1F2937]">{item.title}</h3>
                <p className="text-[11.5px] text-[#64748B] mt-0.5 leading-snug">{item.desc}</p>
              </div>
            </div>
            )
          })}
        </div>
      </div>

      {/* Brands */}
      <div className="px-3.5 mt-5">
        <h2 className="text-[17px] font-extrabold text-[#0F172A] tracking-tight mb-3">Brands We Service</h2>
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => (
            <div key={brand} className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-[#1F2937] font-bold text-[13px] shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
              {brand}
            </div>
          ))}
        </div>
      </div>

      {/* Schedule CTA */}
      <div className="px-3.5 mt-5">
        <button onClick={() => navigate('/book-repair')} className="w-full flex items-center justify-center gap-2 h-12 rounded-full text-white text-[14px] font-bold active:scale-95 transition" style={{ background: 'linear-gradient(135deg,#CB202D,#A81D2A)' }}>
          <Wrench size={17} /> Schedule a Repair
        </button>
      </div>
    </div>
  )
}

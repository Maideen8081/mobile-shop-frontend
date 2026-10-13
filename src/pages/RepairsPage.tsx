import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useIsMobile } from '../components/mobile/helpers'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import EcommerceFooter from '../components/ecommerce/Footer'
import MobileRepairs from '../components/mobile/MobileRepairs'
import SectionHeading, { Accent } from '../components/ui/SectionHeading'
import repairVideo from '../assets/Repairing_smartphone_internal_ci…_1080p_20261012230812.mp4'

const services = [
  { icon: 'phone_iphone', title: 'Screen Repair', desc: 'Cracked or shattered screen? We replace it with premium OEM-grade glass in under 60 minutes.' },
  { icon: 'battery_charging_full', title: 'Battery Replacement', desc: 'Fast, reliable battery swaps to bring your device back to full life with genuine components.' },
  { icon: 'water_damage', title: 'Water Damage Repair', desc: 'Advanced ultrasonic cleaning and component-level restoration for liquid-damaged devices.' },
  { icon: 'camera_alt', title: 'Camera Repair', desc: 'Fixing blurry shots, broken lenses, and camera module failures on all major brands.' },
  { icon: 'charging_station', title: 'Charging Port Fix', desc: 'Loose or non-functional charging port? We diagnose and repair or replace the port assembly.' },
  { icon: 'volume_up', title: 'Speaker & Mic Repair', desc: 'Restore sound quality with precise speaker, earpiece, and microphone repairs.' },
  { icon: 'lock', title: 'Software Unlocking', desc: 'iCloud lock removal, FRP bypass, and software-level issues resolved securely.' },
  { icon: 'memory', title: 'Motherboard Repair', desc: 'Advanced micro-soldering for board-level issues including no power, water damage, and more.' },
]

const brands = [
  { name: 'Apple', icon: 'phone_iphone', color: '#1d1d1f' },
  { name: 'Samsung', icon: 'smartphone', color: '#1428A0' },
  { name: 'Google', icon: 'google_home_devices', color: '#4285F4' },
  { name: 'OnePlus', icon: 'mobile_friendly', color: '#F5010C' },
  { name: 'Xiaomi', icon: 'devices', color: '#FF6900' },
  { name: 'Oppo', icon: 'phone_android', color: '#1D6FA4' },
  { name: 'Realme', icon: 'stay_current_portrait', color: '#FFD700' },
  { name: 'Motorola', icon: 'tap_and_play', color: '#E1000F' },
]

/* Hero copy that rotates over a single looping repair clip, the same way the
   landing page rotates its copy over its video. */
const heroSlides = [
  {
    tag: 'Screen Repair',
    title: ['Professional', 'Screen', 'Repair — 60 Min'],
    desc: 'Cracked or shattered screen? We replace it with premium OEM-grade glass while you wait. Fast, reliable, guaranteed.',
  },
  {
    tag: 'Battery Service',
    title: ['Battery', 'Replacement', '— Full Day Power'],
    desc: 'Fast, reliable battery swaps using genuine components to bring your device back to full life.',
  },
  {
    tag: 'Water Damage',
    title: ['Water', 'Damage', 'Restoration'],
    desc: 'Advanced ultrasonic cleaning and component-level restoration for liquid-damaged devices of all brands.',
  },
  {
    tag: 'Motherboard',
    title: ['Advanced', 'Micro-Soldering', '& Board Repair'],
    desc: 'Board-level repairs including no power, water damage, and complex component-level restoration.',
  },
  {
    tag: 'All Repairs',
    title: ['Complete', 'Repair', 'Services — One Stop'],
    desc: 'From simple screen fixes to complex motherboard repairs — our certified technicians handle it all.',
  },
]

export default function RepairsPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileRepairs /> : <DesktopRepairs />
}

function DesktopRepairs() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  /* Restarted on every slide change so a manual pick gets a full 5s. */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [currentSlide])

  /* Pause the background clip while the tab is hidden. */
  useEffect(() => {
    const onVisibility = () => {
      const video = videoRef.current
      if (!video) return
      if (document.hidden) video.pause()
      else void video.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            const staggers = entry.target.querySelectorAll('.stagger-item')
            staggers.forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 120)
            })
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08 }
    )
    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md selection:bg-[#D91E36]/30 selection:text-[#A3122A]">
      <SiteTopNav />

      {/* ─── HERO CAROUSEL ─── */}
      <section className="hero-section relative overflow-hidden bg-black" style={{ height: 'min(82vh, 680px)', minHeight: '480px' }}>
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={repairVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(217,30,54,0.06)_0%,transparent_60%)]" />
        <div className="absolute inset-x-0 top-0 h-[220px] bg-gradient-to-b from-black/55 via-black/18 to-transparent" />
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            aria-hidden={i !== currentSlide}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              i === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <div className="relative h-full max-w-[1440px] mx-auto px-6 md:px-16 flex items-center">
              <div className="max-w-3xl">
                <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-[8px] bg-[#D91E36]/10 border border-[#D91E36]/25 text-[#D91E36] text-sm font-bold tracking-[0.15em] uppercase mb-8 backdrop-blur-md transition-all duration-700 delay-200 ${
                  i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}>
                  <span className="relative w-2 h-2">
                    <span className="absolute inset-0 rounded-[8px] bg-[#D91E36] animate-ping" />
                    <span className="absolute inset-0 rounded-[8px] bg-[#D91E36]" />
                  </span>
                  {slide.tag}
                </div>
                <h1 className={`text-[clamp(42px,6vw,80px)] font-extrabold leading-[1.05] text-white mb-6 transition-all duration-700 delay-300 ${
                  i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}>
                  {slide.title[0]}<br />
                  <span className="relative inline-block bg-gradient-to-r from-[#D91E36] via-[#E53E4E] to-[#D91E36] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient italic drop-shadow-[0_0_40px_rgba(217,30,54,0.4)]">
                    {slide.title[1]}
                    <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D91E36] to-transparent rounded-[8px] opacity-60 animate-pulse" />
                  </span>{' '}
                  <span className="text-white/90">{slide.title[2]}</span>
                </h1>
                <p className={`text-lg md:text-2xl text-white/70 leading-relaxed max-w-2xl mb-10 transition-all duration-700 delay-400 ${
                  i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}>
                  {slide.desc}
                </p>
                <div className={`flex flex-wrap gap-4 transition-all duration-700 delay-500 ${
                  i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}>
                  <Link to="/book-repair"
                    className="group inline-flex items-center gap-2 bg-[#D91E36] text-white font-bold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-[8px] shadow-[0_0_30px_rgba(217,30,54,0.3)] hover:shadow-[0_0_60px_rgba(217,30,54,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 animate-float cursor-pointer"
                  >
                    <span>Schedule Repair</span>
                    <span className="material-symbols-outlined text-lg md:text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </Link>
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/20 font-semibold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-[8px] hover:bg-white/20 hover:border-white/40 transition-all duration-300"
                  >
                    <span className="material-symbols-outlined text-lg md:text-xl">build</span>
                    Get a Quote
                  </Link>
                  <Link
                    to="/my-repairs"
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/20 font-semibold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-[8px] hover:bg-white/20 hover:border-white/40 transition-all duration-300"
                  >
                    <span className="material-symbols-outlined text-lg md:text-xl">history</span>
                    My Repairs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show slide ${i + 1}: ${heroSlides[i].tag}`}
              onClick={() => setCurrentSlide(i)}
              className={`relative h-1.5 rounded-[8px] transition-all duration-500 overflow-hidden ${
                i === currentSlide ? 'w-16 bg-[#D91E36]' : 'w-6 bg-white/30 hover:bg-white/50'
              }`}
            >
              {i === currentSlide && (
                <span className="absolute inset-0 bg-white/40 rounded-[8px] animate-pulse" />
              )}
            </button>
          ))}
        </div>
        <div className="absolute bottom-10 right-6 md:right-12 z-20 text-white/40 text-sm font-mono tracking-wider">
          {String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <SectionHeading
            className="mb-14"
            align="center"
            eyebrow="Our Services"
            icon="handyman"
            title={<>Precision <Accent>Repair</Accent> Services</>}
            subtitle="We cover everything from simple fixes to complex board-level repairs. All work is backed by our satisfaction guarantee."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((svc, idx) => (
              <div
                key={svc.title}
                className="glass-card p-6 md:p-8 rounded-[1.75rem] flex flex-col gap-4 group transition-all duration-500 hover:shadow-[0_20px_60px_rgba(217,30,54,0.10)] hover:border-[#D91E36]/25 hover:-translate-y-1 stagger-item"
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#D91E36]/15 text-[#A3122A] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#D91E36]/25 transition-all duration-300">
                  <span className="material-symbols-outlined text-2xl">{svc.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface mb-2">{svc.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{svc.desc}</p>
                </div>
                <Link to={`/book-repair/${encodeURIComponent(svc.title)}`} className="inline-flex items-center gap-1.5 text-[#A3122A] font-bold text-sm group-hover:gap-3 transition-all duration-300 mt-auto pt-2 cursor-pointer">
                  Book Now <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low/20 scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeading
                className="mb-8"
                eyebrow="Process"
                icon="route"
                title={<>How It <Accent>Works</Accent></>}
              />
              <div className="space-y-8">
                {[
                  { step: '01', title: 'Bring It In', desc: 'Visit any of our locations or mail your device using our secure prepaid shipping kit.' },
                  { step: '02', title: 'Free Diagnosis', desc: 'Our experts run a full diagnostic and provide a transparent quote with no hidden fees.' },
                  { step: '03', title: 'We Fix It', desc: 'Certified technicians perform the repair using premium components in record time.' },
                  { step: '04', title: 'Enjoy Peace of Mind', desc: 'Pick up your device with a 90-day warranty and a renewed sense of reliability.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-5 group stagger-item">
                    <span className="text-[#D91E36] font-extrabold text-3xl w-14 flex-shrink-0 group-hover:scale-110 transition-transform">{item.step}</span>
                    <div className="pt-1">
                      <h3 className="text-lg font-bold text-on-surface mb-1">{item.title}</h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative group">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[1.5rem] overflow-hidden shadow-lg aspect-[3/4]">
                  <img
                    alt="Technician repairing phone screen"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src="https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80"
                  />
                </div>
                <div className="flex flex-col gap-4 pt-8">
                  <div className="rounded-[1.5rem] overflow-hidden shadow-lg aspect-square">
                    <img
                      alt="Phone motherboard micro-soldering"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
                    />
                  </div>
                  <div className="rounded-[1.5rem] overflow-hidden shadow-lg flex-1">
                    <img
                      alt="Battery replacement service"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src="https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80"
                    />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3 z-10">
                <div className="w-10 h-10 rounded-xl bg-[#D91E36]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#D91E36] text-xl">verified</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#191c1d]">90-Day Warranty</div>
                  <div className="text-[10px] text-gray-500">On all repairs</div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-[#D91E36] rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3 z-10">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-xl">timer</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">60-Min Repairs</div>
                  <div className="text-[10px] text-white/80">Screen & battery</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BRANDS ─── */}
      <section className="py-20 px-6 md:px-12 scroll-reveal" style={{ background: 'linear-gradient(135deg, #0f0c0c 0%, #1a0a0d 50%, #0f0c0c 100%)' }}>
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#D91E36]/10 border border-[#D91E36]/25 text-[#D91E36] text-xs font-bold tracking-[0.15em] uppercase mb-5">
              <span className="material-symbols-outlined text-sm">verified</span>
              Brands
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Brands We <span className="text-[#D91E36]">Service</span>
            </h2>
            <p className="text-white/60 text-base max-w-xl mx-auto">We work on all major smartphone brands. Don't see yours? Give us a call.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {brands.map((brand) => (
              <div
                key={brand.name}
                className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/8 hover:border-[#D91E36]/40 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(circle at center, ${brand.color}10 0%, transparent 70%)` }} />
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 relative z-10"
                  style={{ background: `${brand.color}20`, border: `1px solid ${brand.color}40` }}
                >
                  <span className="material-symbols-outlined text-2xl" style={{ color: brand.color }}>{brand.icon}</span>
                </div>
                <span className="text-white font-bold text-base relative z-10">{brand.name}</span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${brand.color}, transparent)` }} />
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-white/40 text-sm">Don't see your brand? <Link to="/about" className="text-[#D91E36] hover:text-[#E53E4E] font-semibold transition-colors">Contact us</Link> — we service most devices.</p>
          </div>
        </div>
      </section>

      <EcommerceFooter compact />
    </div>
  )
}

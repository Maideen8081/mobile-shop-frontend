import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useIsMobile } from '../components/mobile/helpers'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
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
  { name: 'Apple', models: 'iPhone 8 – iPhone 16 Pro Max', color: '#1d1d1f', tint: '#f2f2f4' },
  { name: 'Samsung', models: 'Galaxy S, Z Fold/Flip, A & M series', color: '#1428A0', tint: '#eef1fb' },
  { name: 'Google', models: 'Pixel 4 – Pixel 9 Pro', color: '#4285F4', tint: '#edf3fe' },
  { name: 'OnePlus', models: 'OnePlus 7 – 13, Nord series', color: '#EB0029', tint: '#fdecef' },
  { name: 'Xiaomi', models: 'Xiaomi, Redmi & Poco', color: '#FF6900', tint: '#fff2e9' },
  { name: 'Oppo', models: 'Find, Reno, A & F series', color: '#1D6F42', tint: '#ebf5ef' },
  { name: 'Realme', models: 'Number, GT, Narzo & C series', color: '#C79B00', tint: '#fcf6e3' },
  { name: 'Motorola', models: 'Edge, Razr & Moto G series', color: '#5C88DA', tint: '#eff4fc' },
]

const moreBrands = ['Vivo', 'iQOO', 'Nothing', 'Honor', 'Nokia', 'Asus', 'Infinix', 'Tecno', 'Lava']

const brandFixes = ['Screen', 'Battery', 'Charging port', 'Camera']

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
                  <div className="text-micro text-gray-500">On all repairs</div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-[#D91E36] rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3 z-10">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-xl">timer</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">60-Min Repairs</div>
                  <div className="text-micro text-white/80">Screen & battery</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BRANDS ─── */}
      <section className="py-20 px-6 md:px-12 scroll-reveal bg-white border-t border-[#ece4e0]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDECEE] text-[#D91E36] text-micro font-bold tracking-[0.14em] uppercase mb-4">
                <span className="material-symbols-outlined text-body">verified</span>
                Brands we service
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#1b1210] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Every major phone brand, <span className="text-[#D91E36]">fixed right</span>
              </h2>
              <p className="text-[#857d79] text-base mt-3 max-w-xl">
                Genuine-grade parts, trained technicians and a 6-month warranty, whichever phone you carry.
              </p>
            </div>
            <Link
              to="/book-repair"
              className="inline-flex items-center gap-2 self-start md:self-auto h-12 px-6 rounded-xl text-white text-sm font-bold shadow-[0_8px_20px_rgba(217,30,54,0.28)] hover:shadow-[0_12px_26px_rgba(217,30,54,0.38)] transition-shadow"
              style={{ background: 'linear-gradient(135deg, #D91E36, #A3122A)' }}
            >
              <span className="material-symbols-outlined text-title-sm">build</span>
              Book a repair
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {brands.map((brand) => (
              <Link
                key={brand.name}
                to="/book-repair"
                aria-label={`Book a ${brand.name} repair`}
                className="group relative flex flex-col p-5 rounded-2xl border-[1.5px] border-[#ece4e0] bg-white hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(27,18,16,0.10)] transition-all duration-200 overflow-hidden"
                style={{ ['--brand' as string]: brand.color }}
              >
                <span className="absolute inset-x-0 top-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: brand.color }} />
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="inline-flex items-center justify-center h-11 px-4 rounded-xl text-title font-extrabold tracking-tight"
                    style={{ background: brand.tint, color: brand.color, fontFamily: 'var(--font-display)' }}
                  >
                    {brand.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-micro font-semibold text-[#059669] bg-[#e7f6f0] px-2 py-1 rounded-full">
                    <span className="material-symbols-outlined text-label">bolt</span>
                    Same day
                  </span>
                </div>
                <p className="text-label text-[#4a403d] font-medium mb-3">{brand.models}</p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {brandFixes.map((fix) => (
                    <span key={fix} className="text-micro text-[#857d79] bg-[#fbf8f6] border border-[#ece4e0] px-2 py-0.5 rounded-md">{fix}</span>
                  ))}
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-label font-bold text-[#D91E36]">
                  Book {brand.name} repair
                  <span className="material-symbols-outlined text-title-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-col lg:flex-row lg:items-center gap-4 p-5 rounded-2xl bg-[#fbf8f6] border border-[#ece4e0]">
            <div className="flex items-center gap-3 shrink-0">
              <span className="w-10 h-10 rounded-xl bg-[#FDECEE] text-[#D91E36] flex items-center justify-center">
                <span className="material-symbols-outlined text-title">devices_other</span>
              </span>
              <span className="text-sm font-bold text-[#1b1210]">We also repair</span>
            </div>
            <div className="flex flex-wrap gap-2 flex-1">
              {moreBrands.map((b) => (
                <span key={b} className="text-label font-semibold text-[#4a403d] bg-white border border-[#ece4e0] px-3 py-1.5 rounded-full">{b}</span>
              ))}
            </div>
            <p className="text-sm text-[#857d79] shrink-0">
              Brand not listed?{' '}
              <Link to="/support" className="text-[#D91E36] font-bold hover:underline">Ask us</Link>
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}

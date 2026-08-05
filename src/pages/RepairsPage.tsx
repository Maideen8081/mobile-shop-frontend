import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useIsMobile } from '../components/mobile/helpers'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import EcommerceFooter from '../components/ecommerce/Footer'
import MobileRepairs from '../components/mobile/MobileRepairs'

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

const brands = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Realme', 'Motorola']

const heroSlides = [
  {
    tag: 'Screen Repair',
    title: ['Professional', 'Screen', 'Repair — 60 Min'],
    desc: 'Cracked or shattered screen? We replace it with premium OEM-grade glass while you wait. Fast, reliable, guaranteed.',
    img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=1920&q=80',
  },
  {
    tag: 'Battery Service',
    title: ['Battery', 'Replacement', '— Full Day Power'],
    desc: 'Fast, reliable battery swaps using genuine components to bring your device back to full life.',
    img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1920&q=80',
  },
  {
    tag: 'Water Damage',
    title: ['Water', 'Damage', 'Restoration'],
    desc: 'Advanced ultrasonic cleaning and component-level restoration for liquid-damaged devices of all brands.',
    img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1920&q=80',
  },
  {
    tag: 'Motherboard',
    title: ['Advanced', 'Micro-Soldering', '& Board Repair'],
    desc: 'Board-level repairs including no power, water damage, and complex component-level restoration.',
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1920&q=80',
  },
  {
    tag: 'All Repairs',
    title: ['Complete', 'Repair', 'Services — One Stop'],
    desc: 'From simple screen fixes to complex motherboard repairs — our certified technicians handle it all.',
    img: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1920&q=80',
  },
]

export default function RepairsPage() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileRepairs />
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(interval)
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
    <div className="min-h-screen bg-surface text-on-surface font-body-md selection:bg-[#CB202D]/30 selection:text-[#A81D2A]">
      <SiteTopNav />

      {/* ─── HERO CAROUSEL ─── */}
      <section className="hero-section relative h-screen overflow-hidden bg-black">
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              i === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img src={slide.img} alt="" className="absolute inset-0 w-full h-full object-cover scale-110" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(203,32,45,0.06)_0%,transparent_60%)]" />
            <div className="relative h-full max-w-[1440px] mx-auto px-6 md:px-16 flex items-center">
              <div className="max-w-3xl">
                <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#CB202D]/10 border border-[#CB202D]/25 text-[#CB202D] text-sm font-bold tracking-[0.15em] uppercase mb-8 backdrop-blur-md transition-all duration-700 delay-200 ${
                  i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}>
                  <span className="relative w-2 h-2">
                    <span className="absolute inset-0 rounded-full bg-[#CB202D] animate-ping" />
                    <span className="absolute inset-0 rounded-full bg-[#CB202D]" />
                  </span>
                  {slide.tag}
                </div>
                <h1 className={`text-[clamp(42px,6vw,80px)] font-extrabold leading-[1.05] text-white mb-6 transition-all duration-700 delay-300 ${
                  i === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}>
                  {slide.title[0]}<br />
                  <span className="relative inline-block bg-gradient-to-r from-[#CB202D] via-[#E53E4E] to-[#CB202D] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient italic drop-shadow-[0_0_40px_rgba(203,32,45,0.4)]">
                    {slide.title[1]}
                    <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CB202D] to-transparent rounded-full opacity-60 animate-pulse" />
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
                    className="group inline-flex items-center gap-2 bg-[#CB202D] text-[#A81D2A] font-bold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-full shadow-[0_0_30px_rgba(203,32,45,0.3)] hover:shadow-[0_0_60px_rgba(203,32,45,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 animate-float cursor-pointer"
                  >
                    <span>Schedule Repair</span>
                    <span className="material-symbols-outlined text-lg md:text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </Link>
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/20 font-semibold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-full hover:bg-white/20 hover:border-white/40 transition-all duration-300"
                  >
                    <span className="material-symbols-outlined text-lg md:text-xl">build</span>
                    Get a Quote
                  </Link>
                  <Link
                    to="/my-repairs"
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/20 font-semibold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-full hover:bg-white/20 hover:border-white/40 transition-all duration-300"
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
              onClick={() => setCurrentSlide(i)}
              className={`relative h-1.5 rounded-full transition-all duration-500 overflow-hidden ${
                i === currentSlide ? 'w-16 bg-[#CB202D]' : 'w-6 bg-white/30 hover:bg-white/50'
              }`}
            >
              {i === currentSlide && (
                <span className="absolute inset-0 bg-white/40 rounded-full animate-pulse" />
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
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-[#CB202D] tracking-[0.2em] uppercase mb-3">Our Services</span>
            <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface mb-4">Precision Repair Services</h2>
            <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">We cover everything from simple fixes to complex board-level repairs. All work is backed by our satisfaction guarantee.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((svc, idx) => (
              <div
                key={svc.title}
                className="glass-card p-6 md:p-8 rounded-[1.75rem] flex flex-col gap-4 group transition-all duration-500 hover:shadow-[0_20px_60px_rgba(203,32,45,0.10)] hover:border-[#CB202D]/25 hover:-translate-y-1 stagger-item"
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#CB202D]/15 text-[#A81D2A] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#CB202D]/25 transition-all duration-300">
                  <span className="material-symbols-outlined text-2xl">{svc.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface mb-2">{svc.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{svc.desc}</p>
                </div>
                <Link to={`/book-repair/${encodeURIComponent(svc.title)}`} className="inline-flex items-center gap-1.5 text-[#A81D2A] font-bold text-sm group-hover:gap-3 transition-all duration-300 mt-auto pt-2 cursor-pointer">
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
              <span className="inline-block text-xs font-bold text-[#CB202D] tracking-[0.2em] uppercase mb-3">Process</span>
              <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface mb-8">How It Works</h2>
              <div className="space-y-8">
                {[
                  { step: '01', title: 'Bring It In', desc: 'Visit any of our locations or mail your device using our secure prepaid shipping kit.' },
                  { step: '02', title: 'Free Diagnosis', desc: 'Our experts run a full diagnostic and provide a transparent quote with no hidden fees.' },
                  { step: '03', title: 'We Fix It', desc: 'Certified technicians perform the repair using premium components in record time.' },
                  { step: '04', title: 'Enjoy Peace of Mind', desc: 'Pick up your device with a 90-day warranty and a renewed sense of reliability.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-5 group stagger-item">
                    <span className="text-[#CB202D] font-extrabold text-3xl w-14 flex-shrink-0 group-hover:scale-110 transition-transform">{item.step}</span>
                    <div className="pt-1">
                      <h3 className="text-lg font-bold text-on-surface mb-1">{item.title}</h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative group rounded-[2rem] overflow-hidden shadow-xl">
              <img alt="Repair technician at work" className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── BRANDS ─── */}
      <section className="py-20 px-6 md:px-12 bg-[#A81D2A] scroll-reveal">
        <div className="max-w-[1440px] mx-auto text-center">
          <span className="inline-block text-xs font-bold text-[#CB202D] tracking-[0.2em] uppercase mb-3">Brands</span>
          <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-white mb-4">Brands We Service</h2>
          <p className="text-white/60 text-lg mb-12 max-w-xl mx-auto">We work on all major smartphone brands. Don't see yours? Give us a call.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {brands.map((brand) => (
              <div key={brand} className="bg-white/5 border border-white/10 rounded-xl px-7 py-4 text-white font-bold text-lg hover:bg-white/10 hover:border-[#CB202D]/30 hover:text-[#CB202D] transition-all duration-300 cursor-pointer">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      <EcommerceFooter compact />
    </div>
  )
}

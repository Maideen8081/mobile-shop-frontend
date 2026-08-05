import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import EcommerceFooter from '../components/ecommerce/Footer'

const team = [
  { name: 'Marcus Chen', role: 'Founder & Lead Technician', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
  { name: 'Sarah Jenkins', role: 'Operations Manager', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
  { name: 'David Park', role: 'Senior Repair Technician', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80' },
  { name: 'Emily Rodriguez', role: 'Customer Experience Lead', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80' },
]

const stats = [
  { value: '5,000+', label: 'Devices Repaired' },
  { value: '4.9', label: 'Customer Rating' },
  { value: '8+', label: 'Years Experience' },
  { value: '3', label: 'Local Shops' },
]

const heroSlides = [
  {
    tag: 'Our Story',
    title: ['Precision', 'Meets', 'Passion'],
    desc: 'We are a team of certified technicians and tech enthusiasts dedicated to keeping you connected with reliable, affordable repair solutions.',
    img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80',
  },
  {
    tag: 'Expert Team',
    title: ['Certified', 'Technicians', 'at Your Service'],
    desc: 'Our skilled team has over 8 years of combined experience in smartphone repairs and customer service.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80',
  },
  {
    tag: 'Our Workshop',
    title: ['State-of-the-Art', 'Repair', 'Facility'],
    desc: 'Fully equipped with advanced diagnostic tools and micro-soldering stations for precision repairs.',
    img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1920&q=80',
  },
  {
    tag: 'Customer Love',
    title: ['Trusted by', 'Thousands', 'of Customers'],
    desc: 'Rated 4.9 stars with thousands of satisfied customers — our reputation speaks for itself.',
    img: 'https://images.unsplash.com/photo-1552581234-26160f608093?w=1920&q=80',
  },
  {
    tag: 'Get in Touch',
    title: ['Contact', 'Us', 'Today'],
    desc: 'Visit any of our 3 locations, call us, or book an appointment online. We are here to help.',
    img: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1920&q=80',
  },
]

export default function AboutPage() {
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
                  <Link
                    to="/about"
                    className="group inline-flex items-center gap-2 bg-[#CB202D] text-[#A81D2A] font-bold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-full shadow-[0_0_30px_rgba(203,32,45,0.3)] hover:shadow-[0_0_60px_rgba(203,32,45,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 animate-float"
                  >
                    <span>Learn More</span>
                    <span className="material-symbols-outlined text-lg md:text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </Link>
                  <Link
                    to="/repairs"
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/20 font-semibold text-base md:text-lg px-8 md:px-10 py-3.5 md:py-4 rounded-full hover:bg-white/20 hover:border-white/40 transition-all duration-300"
                  >
                    <span className="material-symbols-outlined text-lg md:text-xl">build</span>
                    Book Repair
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

      {/* ─── STATS ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-8 rounded-2xl text-center group hover:shadow-[0_12px_40px_rgba(203,32,45,0.10)] hover:border-[#CB202D]/20 transition-all duration-500 stagger-item">
                <div className="text-[clamp(32px,4vw,48px)] font-extrabold text-[#A81D2A] mb-2">{stat.value}</div>
                <div className="text-sm text-on-surface-variant font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── OUR STORY ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low/20 scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-xs font-bold text-[#CB202D] tracking-[0.2em] uppercase mb-3">Our Story</span>
              <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface mb-6">From a Small Shop to Trusted Repair Network</h2>
              <div className="space-y-4 text-base md:text-lg text-on-surface-variant leading-relaxed">
                <p>PhoneFix Pro was founded in 2017 with a simple mission: make quality device repairs accessible and affordable for everyone. What started as a small counter-service shop has grown into a trusted repair network with three locations and thousands of satisfied customers.</p>
                <p>We believe in transparency, quality craftsmanship, and genuine care for our customers. Every device that comes through our doors is treated with the same precision and attention we would give our own.</p>
              </div>
            </div>
            <div className="relative group rounded-[2rem] overflow-hidden shadow-xl">
              <img alt="Our workshop" className="w-full h-[450px] object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── TEAM ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-[#CB202D] tracking-[0.2em] uppercase mb-3">Team</span>
            <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-on-surface mb-4">Meet Our Team</h2>
            <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">The people behind the repairs — skilled, certified, and passionate about what they do.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="glass-card p-6 md:p-8 rounded-2xl text-center group transition-all duration-500 hover:shadow-[0_20px_60px_rgba(203,32,45,0.10)] hover:border-[#CB202D]/25 hover:-translate-y-1 stagger-item">
                <div className="w-24 h-24 rounded-full mx-auto mb-5 overflow-hidden ring-2 ring-[#CB202D]/20 group-hover:ring-[#CB202D]/40 transition-all duration-300">
                  <img alt={member.name} className="w-full h-full object-cover" src={member.img} />
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-1">{member.name}</h3>
                <p className="text-sm text-on-surface-variant">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low/20 scroll-reveal">
        <div className="max-w-[1440px] mx-auto">
          <div className="glass-card rounded-[2.5rem] overflow-hidden border border-[#CB202D]/15 relative shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#A81D2A] via-[#A81D2A]/80 to-transparent z-10" />
            <div className="relative z-20 flex flex-col md:flex-row items-center justify-between p-10 md:p-16">
              <div className="max-w-xl text-center md:text-left">
                <h2 className="text-[clamp(28px,3.5vw,44px)] font-extrabold text-white mb-4">Ready to Visit Us?</h2>
                <p className="text-white/70 text-lg mb-8">Stop by any of our locations for a free diagnostic and consultation. No appointment needed.</p>
                <Link to="/about" className="inline-flex items-center gap-2 bg-[#CB202D] text-[#A81D2A] font-bold text-base px-8 py-3.5 rounded-full shadow-[0_0_30px_rgba(203,32,45,0.3)] hover:shadow-[0_0_50px_rgba(203,32,45,0.5)] hover:scale-105 active:scale-95 transition-all duration-300">
                  Find a Shop
                  <span className="material-symbols-outlined text-lg">storefront</span>
                </Link>
              </div>
              <div className="relative hidden md:block">
                <span className="material-symbols-outlined text-[160px] text-white/10">storefront</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <EcommerceFooter compact />
    </div>
  )
}

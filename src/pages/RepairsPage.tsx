import { useBackgroundVideo } from '../hooks/useBackgroundVideo'
import { useState, useEffect, useRef } from 'react'
import { BUSINESS } from '../config/business'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, BatteryCharging, Camera, Check, ClipboardCheck, Cpu, Droplets, Headphones,
  History, Lock, MessageCircle, Mic, Phone, Plug, ShieldCheck, Smartphone, Sparkles, Timer, Truck, Wrench, Zap,
} from 'lucide-react'
import { useIsMobile } from '../components/mobile/helpers'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import MobileRepairs from '../components/mobile/MobileRepairs'
import { repairService, type RepairService } from '../services/repairService'
import repairVideo from '../assets/Repairing_smartphone_internal_ci…_1080p_20261012230812.mp4'
import './RepairsPage.css'

const services = [
  { icon: Smartphone, title: 'Screen Repair', desc: 'Cracked or shattered screen? We replace it with premium OEM-grade glass in under 60 minutes.' },
  { icon: BatteryCharging, title: 'Battery Replacement', desc: 'Fast, reliable battery swaps to bring your device back to full life with genuine components.' },
  { icon: Droplets, title: 'Water Damage Repair', desc: 'Advanced ultrasonic cleaning and component-level restoration for liquid-damaged devices.' },
  { icon: Camera, title: 'Camera Repair', desc: 'Fixing blurry shots, broken lenses, and camera module failures on all major brands.' },
  { icon: Plug, title: 'Charging Port Fix', desc: 'Loose or non-functional charging port? We diagnose and repair or replace the port assembly.' },
  { icon: Mic, title: 'Speaker & Mic Repair', desc: 'Restore sound quality with precise speaker, earpiece, and microphone repairs.' },
  { icon: Lock, title: 'Software Unlocking', desc: 'iCloud lock removal, FRP bypass, and software-level issues resolved securely.' },
  { icon: Cpu, title: 'Motherboard Repair', desc: 'Advanced micro-soldering for board-level issues including no power, water damage, and more.' },
]

const brands = [
  { name: 'Apple', models: 'iPhone 8 – iPhone 16 Pro Max' },
  { name: 'Samsung', models: 'Galaxy S, Z Fold/Flip, A & M series' },
  { name: 'Google', models: 'Pixel 4 – Pixel 9 Pro' },
  { name: 'OnePlus', models: 'OnePlus 7 – 13, Nord series' },
  { name: 'Xiaomi', models: 'Xiaomi, Redmi & Poco' },
  { name: 'Oppo', models: 'Find, Reno, A & F series' },
  { name: 'Realme', models: 'Number, GT, Narzo & C series' },
  { name: 'Motorola', models: 'Edge, Razr & Moto G series' },
]
const moreBrands = ['Vivo', 'iQOO', 'Nothing', 'Honor', 'Nokia', 'Asus', 'Infinix', 'Tecno', 'Lava']
const brandFixes = ['Screen', 'Battery', 'Charging port', 'Camera']

const steps = [
  { icon: Smartphone, title: 'Book or Walk In', desc: 'Book online in 2 minutes or visit our store — we can also pick up your device.' },
  { icon: ClipboardCheck, title: 'Free Diagnosis', desc: 'Our experts run a full check and share a transparent quote with no hidden fees.' },
  { icon: Wrench, title: 'We Fix It', desc: 'Certified technicians repair it with premium, genuine-grade parts.' },
  { icon: BadgeCheck, title: 'Pick Up & Relax', desc: 'Collect your device, or get it delivered — backed by our repair warranty.' },
]

/* Hero copy rotates over the looping repair clip. */
const heroSlides = [
  { tag: 'Screen Repair', title: ['Professional', 'Screen Repair', 'in 60 Minutes'], desc: 'Cracked or shattered screen? We replace it with premium OEM-grade glass while you wait.' },
  { tag: 'Battery Service', title: ['Battery', 'Replacement', 'for Full-Day Power'], desc: 'Fast, reliable battery swaps using genuine components to bring your device back to life.' },
  { tag: 'Water Damage', title: ['Water', 'Damage', 'Restoration'], desc: 'Ultrasonic cleaning and component-level restoration for liquid-damaged devices of all brands.' },
  { tag: 'Motherboard', title: ['Advanced', 'Micro-Soldering', '& Board Repair'], desc: 'Board-level repairs including no power, water damage and complex component restoration.' },
  { tag: 'All Repairs', title: ['Complete', 'Repair Services', 'in One Place'], desc: 'From simple screen fixes to motherboard repairs — our certified technicians handle it all.' },
]

export default function RepairsPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileRepairs /> : <DesktopRepairs />
}

function DesktopRepairs() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [apiServices, setApiServices] = useState<RepairService[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)

  // Restarted on every slide change so a manual pick gets a full 5s.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => setCurrentSlide((p) => (p + 1) % heroSlides.length), 5000)
    return () => clearTimeout(t)
  }, [currentSlide])

  useBackgroundVideo(videoRef)

  useEffect(() => {
    repairService.getServices().then(setApiServices).catch(() => {})
  }, [])

  // Reveal sections as they scroll into view.
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } })
    }, { threshold: 0.1 })
    document.querySelectorAll('.rp-reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const priceFor = (title: string) => {
    const s = apiServices.find((x) => x.name.toLowerCase() === title.toLowerCase())
    return s && s.estimated_price > 0 ? Number(s.estimated_price) : 0
  }

  return (
    <div className="rp-page">
      <SiteTopNav />
      <main className="rp-wrap">
        {/* ── Hero with the repair video ── */}
        <section className="rp-hero">
          <video ref={videoRef} className="rp-hero-video" muted loop playsInline preload="none" poster="/products/repair-internals.jpg" aria-hidden="true" tabIndex={-1}>
            <source src={repairVideo} type="video/mp4" />
          </video>
          <span className="rp-hero-shade" aria-hidden="true" />

          <div className="rp-hero-slides">
            {heroSlides.map((slide, i) => (
              <div key={slide.tag} className={`rp-slide${i === currentSlide ? ' is-active' : ''}`} aria-hidden={i !== currentSlide}>
                <span className="rp-tag"><i aria-hidden="true" /> {slide.tag}</span>
                <h1>{slide.title[0]} <em>{slide.title[1]}</em><br />{slide.title[2]}</h1>
                <p>{slide.desc}</p>
              </div>
            ))}
            <div className="rp-hero-actions">
              <Link to="/book-repair" className="rp-btn rp-btn--sun"><Wrench aria-hidden="true" /> Book a Repair <ArrowRight aria-hidden="true" /></Link>
              <Link to="/my-repairs" className="rp-btn rp-btn--glass"><History aria-hidden="true" /> My Repairs</Link>
              <Link to="/support" className="rp-btn rp-btn--glass"><MessageCircle aria-hidden="true" /> Get a Quote</Link>
            </div>
            <ul className="rp-hero-chips">
              <li><ShieldCheck aria-hidden="true" /> Certified Technicians</li>
              <li><Zap aria-hidden="true" /> Genuine Parts</li>
              <li><Timer aria-hidden="true" /> 60-Min Screen &amp; Battery</li>
            </ul>
          </div>

          <div className="rp-hero-dots">
            {heroSlides.map((s, i) => (
              <button key={s.tag} type="button" className={i === currentSlide ? 'is-active' : ''} onClick={() => setCurrentSlide(i)} aria-label={`Show slide ${i + 1}: ${s.tag}`} />
            ))}
            <span>{String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}</span>
          </div>
        </section>

        <ul className="rp-trust">
          <li><ClipboardCheck aria-hidden="true" /><div><b>Free Diagnosis</b><span>Know the cost before we start</span></div></li>
          <li><Truck aria-hidden="true" /><div><b>Pickup &amp; Drop</b><span>From your doorstep</span></div></li>
          <li><Zap aria-hidden="true" /><div><b>Genuine Parts</b><span>OEM-grade components</span></div></li>
          <li><ShieldCheck aria-hidden="true" /><div><b>Repair Warranty</b><span>On every repair</span></div></li>
        </ul>

        {/* ── Services ── */}
        <section className="rp-section rp-reveal">
          <div className="rp-head">
            <div>
              <span className="rp-eyebrow"><Wrench aria-hidden="true" /> Our Services</span>
              <h2>Precision <em>Repair</em> Services</h2>
              <p>From simple fixes to complex board-level repairs — all backed by our satisfaction guarantee.</p>
            </div>
            <Link to="/book-repair" className="rp-link">Book any repair <ArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="rp-services">
            {services.map(({ icon: Icon, title, desc }) => {
              const price = priceFor(title)
              return (
                <Link key={title} to={`/book-repair/${encodeURIComponent(title)}`} className="rp-service">
                  <span className="rp-service-icon"><Icon aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <span className="rp-service-foot">
                    {price > 0 ? <span className="rp-price">from <b>₹{price.toLocaleString('en-IN')}</b></span> : <span className="rp-price">Free diagnosis</span>}
                    <span className="rp-service-cta">Book Now <ArrowRight aria-hidden="true" /></span>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="rp-section rp-how rp-reveal">
          <div className="rp-head rp-head--center">
            <div>
              <span className="rp-eyebrow"><Sparkles aria-hidden="true" /> Process</span>
              <h2>How It <em>Works</em></h2>
              <p>Four simple steps from broken to brand-new.</p>
            </div>
          </div>
          <ol className="rp-steps">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <li key={title}>
                <span className="rp-step-icon"><Icon aria-hidden="true" /><b>{i + 1}</b></span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Brands ── */}
        <section className="rp-section rp-reveal">
          <div className="rp-head">
            <div>
              <span className="rp-eyebrow"><BadgeCheck aria-hidden="true" /> Brands we service</span>
              <h2>Every major phone brand, <em>fixed right</em></h2>
              <p>Genuine-grade parts and trained technicians, whichever phone you carry.</p>
            </div>
          </div>
          <div className="rp-brands">
            {brands.map((b) => (
              <Link key={b.name} to="/book-repair" className="rp-brand" aria-label={`Book a ${b.name} repair`}>
                <span className="rp-brand-top">
                  <span className="rp-brand-name">{b.name}</span>
                  <span className="rp-same-day"><Zap aria-hidden="true" /> Same day</span>
                </span>
                <span className="rp-brand-models">{b.models}</span>
                <span className="rp-brand-fixes">{brandFixes.map((f) => <i key={f}>{f}</i>)}</span>
                <span className="rp-brand-cta">Book {b.name} repair <ArrowRight aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
          <div className="rp-more">
            <span className="rp-more-label"><Smartphone aria-hidden="true" /> We also repair</span>
            <div>{moreBrands.map((b) => <span key={b}>{b}</span>)}</div>
            <p>Brand not listed? <Link to="/support">Ask us</Link></p>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="rp-cta rp-reveal">
          <div>
            <h2>Not sure what’s wrong with your phone?</h2>
            <p>Describe the problem to our assistant or call us — we’ll tell you the fix and the cost.</p>
            <ul>
              <li><Check aria-hidden="true" /> No-obligation quote</li>
              <li><Check aria-hidden="true" /> Mon – Sat, 10 AM – 8 PM</li>
            </ul>
          </div>
          <div className="rp-cta-actions">
            <Link to="/support" className="rp-btn rp-btn--sun"><Headphones aria-hidden="true" /> Chat with an Expert</Link>
            {BUSINESS.phoneTel && <a href={`tel:${BUSINESS.phoneTel}`} className="rp-btn rp-btn--glass"><Phone aria-hidden="true" /> {BUSINESS.phoneDisplay}</a>}
          </div>
        </section>
      </main>
    </div>
  )
}

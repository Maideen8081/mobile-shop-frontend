import { useBackgroundVideo } from '../hooks/useBackgroundVideo'
import { useEffect, useRef } from 'react'
import { BUSINESS } from '../config/business'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, BatteryCharging, Clock, Cpu, HandCoins, Headphones, Heart, MapPin, Phone,
  Recycle, ReceiptText, ShieldCheck, Smartphone, Sparkles, Star, Store, Users, Wrench, Zap,
} from 'lucide-react'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import StoreLocation from '../components/ecommerce/StoreLocation'
import StoreFooter from '../components/ecommerce/StoreFooter'
import heroVideo from '../assets/Smartphone_internal_components_1080p_20261002155902.mp4'
import './AboutPage.css'

const stats = [
  { icon: Wrench, value: BUSINESS.devicesRepaired, label: 'Devices repaired' },
  { icon: Star, value: '4.9', label: 'Customer rating' },
  { icon: Clock, value: '8+', label: 'Years of experience' },
  { icon: Store, value: '3', label: 'Local shops' },
]

const services = [
  { icon: Wrench, title: 'Expert Repairs', desc: 'Screen, battery, charging port, water damage and board-level repairs.', to: '/repairs' },
  { icon: Smartphone, title: 'New Smartphones', desc: 'The latest phones from top brands with brand warranty and easy EMI.', to: '/phones' },
  { icon: Recycle, title: 'Refurbished Phones', desc: 'Tested, certified devices that look and work like new.', to: '/collection/all' },
  { icon: HandCoins, title: 'Trade-In', desc: 'Get an instant quote for your old phone and free pickup.', to: '/trade-in' },
  { icon: Headphones, title: 'Accessories', desc: 'Earbuds, chargers, cables and power banks you can trust.', to: '/accessories' },
]

const promises = [
  { icon: ReceiptText, title: 'Transparent pricing', desc: 'Free diagnosis and a clear quote before we touch your device.' },
  { icon: BadgeCheck, title: 'Genuine parts', desc: 'OEM-grade components on every repair, never cheap copies.' },
  { icon: Cpu, title: 'Certified technicians', desc: 'Trained for micro-soldering and board-level work.' },
  { icon: ShieldCheck, title: 'Warranty included', desc: 'Every repair is backed by our parts & labour warranty.' },
]

const team = [
  { name: 'Marcus Chen', role: 'Founder & Lead Technician' },
  { name: 'Sarah Jenkins', role: 'Operations Manager' },
  { name: 'David Park', role: 'Senior Repair Technician' },
  { name: 'Emily Rodriguez', role: 'Customer Experience Lead' },
]

const initials = (name: string) => name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()

export default function AboutPage() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useBackgroundVideo(videoRef)

  // Reveal sections as they scroll into view.
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } })
    }, { threshold: 0.1 })
    document.querySelectorAll('.ab-reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="ab-page">
      <SiteTopNav />

      <main className="ab-wrap">
        {/* ── Hero ── */}
        <section className="ab-hero">
          <video ref={videoRef} className="ab-hero-video" muted loop playsInline preload="none" poster="/products/repair-internals.jpg" aria-hidden="true" tabIndex={-1}>
            <source src={heroVideo} type="video/mp4" />
          </video>
          <span className="ab-hero-shade" aria-hidden="true" />

          <div className="ab-hero-copy">
            <span className="ab-tag"><i aria-hidden="true" /> Our Story</span>
            <h1>Precision <em>Meets</em><br />Passion</h1>
            <p>
              We are a team of certified technicians and tech enthusiasts dedicated to keeping you connected
              with reliable, affordable repair solutions.
            </p>
            <div className="ab-hero-actions">
              <Link to="/book-repair" className="ab-btn ab-btn--sun"><Wrench aria-hidden="true" /> Book a Repair <ArrowRight aria-hidden="true" /></Link>
              <a href="#visit" className="ab-btn ab-btn--glass"><MapPin aria-hidden="true" /> Visit Our Store</a>
            </div>
            <ul className="ab-hero-chips">
              <li><ShieldCheck aria-hidden="true" /> Certified Technicians</li>
              <li><Zap aria-hidden="true" /> Genuine Parts</li>
              <li><Heart aria-hidden="true" /> Trusted Since 2017</li>
            </ul>
          </div>

          <div className="ab-hero-card" aria-hidden="true">
            <span className="ab-hero-card-icon"><Star /></span>
            <strong>4.9<small>/5</small></strong>
            <span className="ab-stars">★★★★★</span>
            <p>Rated by thousands of happy customers</p>
          </div>
        </section>

        {/* ── Stats ── */}
        <ul className="ab-stats">
          {stats.map(({ icon: Icon, value, label }) => (
            <li key={label}>
              <Icon aria-hidden="true" />
              <div><b>{value}</b><span>{label}</span></div>
            </li>
          ))}
        </ul>

        {/* ── Story ── */}
        <section className="ab-section ab-story ab-reveal">
          <div className="ab-story-media">
            <img src="/products/repair-internals.jpg" alt="Inside a smartphone on our repair bench" loading="lazy" />
            <div className="ab-since">
              <span>Since</span>
              <b>2017</b>
            </div>
          </div>
          <div className="ab-story-copy">
            <span className="ab-eyebrow"><Sparkles aria-hidden="true" /> Our Story</span>
            <h2>From a small shop to a <em>trusted</em> repair network</h2>
            <p>
              PhoneFix Pro was founded in 2017 with a simple mission: make quality device repairs accessible and
              affordable for everyone. What started as a small counter-service shop has grown into a trusted repair
              network with three locations and thousands of satisfied customers.
            </p>
            <p>
              We believe in transparency, quality craftsmanship, and genuine care for our customers. Every device that
              comes through our doors is treated with the same precision and attention we would give our own.
            </p>
            <ul className="ab-checks">
              <li><BadgeCheck aria-hidden="true" /> Free diagnosis on every device</li>
              <li><BatteryCharging aria-hidden="true" /> Most screen &amp; battery jobs in 60 minutes</li>
              <li><ShieldCheck aria-hidden="true" /> Warranty on parts &amp; labour</li>
            </ul>
          </div>
        </section>

        {/* ── What we do ── */}
        <section className="ab-section ab-reveal">
          <div className="ab-head ab-head--center">
            <span className="ab-eyebrow"><Smartphone aria-hidden="true" /> What We Do</span>
            <h2>Everything your phone needs, <em>in one place</em></h2>
            <p>Buy, repair, upgrade or trade in — with the same team looking after you every step of the way.</p>
          </div>
          <div className="ab-services">
            {services.map(({ icon: Icon, title, desc, to }) => (
              <Link key={title} to={to} className="ab-service">
                <span className="ab-icon"><Icon aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="ab-service-cta">Explore <ArrowRight aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Promise ── */}
        <section className="ab-section ab-promise ab-reveal">
          <div className="ab-promise-intro">
            <span className="ab-eyebrow ab-eyebrow--dark"><ShieldCheck aria-hidden="true" /> Our Promise</span>
            <h2>Why customers <em>trust</em> PhoneFix</h2>
            <p>No hidden charges, no shortcuts. Just honest work done right the first time.</p>
            <Link to="/repairs" className="ab-btn ab-btn--sun">See Repair Services <ArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="ab-promise-grid">
            {promises.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="ab-promise-card">
                <span className="ab-icon ab-icon--sun"><Icon aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Team ── */}
        <section className="ab-section ab-reveal">
          <div className="ab-head ab-head--center">
            <span className="ab-eyebrow"><Users aria-hidden="true" /> Our Team</span>
            <h2>Meet the people behind <em>the repairs</em></h2>
            <p>Skilled, certified and passionate about what they do.</p>
          </div>
          <div className="ab-team">
            {team.map((m) => (
              <div key={m.name} className="ab-member">
                <span className="ab-avatar" aria-hidden="true">{initials(m.name)}</span>
                <h3>{m.name}</h3>
                <p>{m.role}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Visit us ── */}
      <div id="visit" className="ab-visit">
        <StoreLocation />
      </div>

      {/* ── CTA ── */}
      <div className="ab-wrap ab-wrap--cta">
        <section className="ab-cta ab-reveal">
          <div>
            <h2>Ready to give your phone <em>a second life?</em></h2>
            <p>Walk in for a free diagnosis, or book online and we&apos;ll pick it up from your doorstep.</p>
          </div>
          <div className="ab-cta-actions">
            <Link to="/book-repair" className="ab-btn ab-btn--sun"><Wrench aria-hidden="true" /> Book a Repair</Link>
            {BUSINESS.phoneTel && <a href={`tel:${BUSINESS.phoneTel}`} className="ab-btn ab-btn--glass"><Phone aria-hidden="true" /> {BUSINESS.phoneDisplay}</a>}
          </div>
        </section>
      </div>

      <StoreFooter />
    </div>
  )
}

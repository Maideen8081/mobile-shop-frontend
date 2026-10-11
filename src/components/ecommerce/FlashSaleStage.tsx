import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './FlashSaleStage.css'

export interface FlashSaleCard {
  id: number
  name: string
  image: string
  price: number
  mrp: number
  off: number
}

interface FlashSaleTab {
  key: string
  label: string
  icon: string
}

interface FlashSaleStageProps {
  cards: FlashSaleCard[]
  tabs: readonly FlashSaleTab[]
  activeTab: string
  onTabChange: (key: string) => void
}

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`

/**
 * Desktop-only "Tech Essentials" offer band — the landing page's attention
 * centrepiece. It reuses the app's own surface background, colour tokens and
 * `.btn-*` variants so it merges with the rest of the page (and adds no new
 * one-off text colours or button styles), then layers on a scroll-triggered 3D
 * rise so the section unfolds as soon as a sliver scrolls into view.
 */
export default function FlashSaleStage({ cards, tabs, activeTab, onTabChange }: FlashSaleStageProps) {
  const [clock, setClock] = useState({ h: '00', m: '00', s: '00' })
  const [pct, setPct] = useState(25)
  const revealRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const end = new Date()
    end.setHours(24, 0, 0, 0)
    const pad = (n: number) => String(n).padStart(2, '0')
    const tick = () => {
      const now = Date.now()
      if (now >= end.getTime()) end.setDate(end.getDate() + 1)
      const total = Math.max(0, Math.floor((end.getTime() - now) / 1000))
      setClock({ h: pad(Math.floor(total / 3600)), m: pad(Math.floor((total % 3600) / 60)), s: pad(total % 60) })
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const start = performance.now() + 450
    const run = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - start) / 1400))
      const eased = 1 - Math.pow(1 - p, 3)
      setPct(Math.round(eased * 25))
      if (p < 1) raf = requestAnimationFrame(run)
    }
    raf = requestAnimationFrame(run)
    return () => cancelAnimationFrame(raf)
  }, [])

  /* Reveal the band the moment it starts entering the viewport, so a minimal
     scroll is enough. Disconnected after firing — it plays once. */
  useEffect(() => {
    const el = revealRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const units = [
    { value: clock.h, label: 'hours' },
    { value: clock.m, label: 'minutes' },
    { value: clock.s, label: 'seconds' },
  ]

  return (
    <section
      className="hidden lg:block relative overflow-hidden bg-surface py-20 px-6 md:px-12"
      aria-labelledby="flash-sale-title"
    >
      {/* Attention backdrop: brand-tinted wash + slow breathing glows. Decorative. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="absolute -top-24 left-[12%] w-[420px] h-[420px] rounded-full bg-pf-red/10 blur-3xl animate-glow-pulse" />
        <div className="absolute -bottom-32 right-[10%] w-[380px] h-[380px] rounded-full bg-pf-red/10 blur-3xl animate-glow-pulse" />
      </div>

      <div ref={revealRef} className={`fs-3d relative max-w-[1440px] mx-auto ${inView ? 'fs-in' : ''}`}>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 xl:gap-16 items-center">
          {/* Offer copy */}
          <div className="fs-rise flex flex-col justify-center" style={{ '--fs-i': 0 } as React.CSSProperties}>
            <span className="inline-flex items-center gap-2 self-start bg-pf-red/10 border border-pf-red/20 text-pf-red text-xs font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-base">local_fire_department</span>
              Flash Sale
              <span className="w-1.5 h-1.5 rounded-full bg-pf-red animate-pulse" aria-hidden="true" />
            </span>
            <h2
              id="flash-sale-title"
              className="text-[clamp(28px,3.5vw,46px)] font-extrabold text-on-surface leading-tight mt-5"
            >
              Tech Essentials
              <br />
              <span className="text-pf-red">Up to {pct}% Off</span>
            </h2>
            <p className="text-base md:text-lg text-on-surface-variant leading-relaxed mt-5 max-w-xl">
              Grab the latest flagships and premium accessories at unbeatable prices. Certified
              performance, uncompromised quality — refurbs and new arrivals included.
            </p>

            <div className="flex items-center gap-3 flex-wrap mt-8 p-3 rounded-2xl bg-white/80 border border-pf-red/15 shadow-red-subtle">
              <span className="text-sm font-semibold text-pf-red-dark pl-1">Offer ends in</span>
              <div className="flex gap-2" role="timer" aria-live="off">
                {units.map((u) => (
                  <div
                    key={u.label}
                    className="min-w-[64px] px-3 py-2 rounded-xl bg-pf-red/5 border border-pf-red/15 text-center"
                  >
                    <b key={u.value} className="pfx-num block font-display text-2xl font-bold text-pf-red">
                      {u.value}
                    </b>
                    <small className="block text-xs text-on-surface-variant">{u.label}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap mt-8">
              <Link to="/collection/all" className="btn btn-primary btn-md w-fit">
                Claim Offer Now
                <span className="material-symbols-outlined text-lg">bolt</span>
              </Link>
              <Link to="/collection/all?tab=new" className="btn btn-quiet btn-md w-fit">
                See All Deals
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-surface-variant mt-8">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-pf-red">verified</span>
                Certified performance
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-pf-red">local_shipping</span>
                Free delivery over ₹500
              </li>
            </ul>
          </div>

          {/* Advertised products — the same real data and `.btn` segmented control
              the rest of the page already uses. */}
          <div className="min-w-0">
            <div
              className="fs-rise flex items-center justify-between flex-wrap gap-3 mb-5"
              style={{ '--fs-i': 1 } as React.CSSProperties}
            >
              <div
                role="tablist"
                aria-label="Advertised products"
                className="flex gap-1.5 p-1.5 rounded-[8px] bg-white border border-pf-red/10"
              >
                {tabs.map((tab) => {
                  const selected = tab.key === activeTab
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => onTabChange(tab.key)}
                      className={`btn btn-quiet btn-sm flex-1 !px-3 ${selected ? 'is-active' : ''}`}
                    >
                      <span className="material-symbols-outlined text-base">{tab.icon}</span>
                      {tab.label}
                    </button>
                  )
                })}
              </div>
              <span className="inline-flex items-center gap-1.5 bg-pf-red-dark text-white px-3 py-1.5 rounded-[8px] text-xs font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-white" aria-hidden="true" />
                Limited Offer
              </span>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {cards.map((card, i) => (
                <Link
                  key={card.id}
                  to={`/product/${card.id}`}
                  className="fs-rise group flex flex-col bg-white rounded-2xl border border-pf-red/10 p-4 shadow-red-subtle hover:border-pf-red/40 hover:shadow-red-medium hover:-translate-y-1 transition-all duration-300"
                  style={{ '--fs-i': 2 + i } as React.CSSProperties}
                >
                  <div className="relative h-28 xl:h-32 rounded-xl bg-surface-container-low flex items-center justify-center overflow-hidden mb-3">
                    {card.off > 0 && (
                      <span className="absolute top-2 left-2 z-10 bg-pf-red text-white text-xs font-bold px-2 py-1 rounded-[8px]">
                        -{card.off}%
                      </span>
                    )}
                    {card.image ? (
                      <img
                        src={card.image}
                        alt={card.name}
                        loading="lazy"
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.visibility = 'hidden'
                        }}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant">
                        inventory_2
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-on-surface leading-tight line-clamp-2 mb-1 group-hover:text-pf-red-dark transition-colors">
                    {card.name}
                  </p>
                  <div className="mt-auto flex items-baseline gap-2 pt-1">
                    <span className="text-pf-red font-extrabold text-base">{fmt(card.price)}</span>
                    {card.mrp > card.price && (
                      <span className="text-xs text-on-surface-variant line-through">{fmt(card.mrp)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

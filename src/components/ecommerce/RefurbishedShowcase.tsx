import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import SectionHeading, { Accent } from '../ui/SectionHeading'
import ProductCard from './ProductCard'
import './RefurbishedShowcase.css'

export interface RefurbishedDevice {
  id: number
  name: string
  image: string
  price: number
  mrp: number
  save: number
  meta: string
  rating: number
  grade: string
}

interface RefurbishedShowcaseProps {
  devices: RefurbishedDevice[]
  loading: boolean
}

const CHECKS = [
  'Display and touch',
  'Battery health',
  'Cameras',
  'Speakers and mic',
  'Buttons and ports',
  'Network and Wi-Fi',
]

function Ic({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg className={`rfc-ic ${className ?? ''}`.trim()} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  )
}

/** Refurbished band — a snap-scrolling rail of inspection-verified devices with
 *  a quick-view dialog. Ported from the PhoneFix "certified refurbished" design
 *  and wired to the store's real product data and colour tokens. */
export default function RefurbishedShowcase({ devices, loading }: RefurbishedShowcaseProps) {
  const rootRef = useRef<HTMLElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, sx: 0, sl: 0, moved: 0 })

  const [prog, setProg] = useState({ tw: 30, tx: 0, show: true })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  /* ── reveal on scroll (header + trust strip) ── */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = root.querySelectorAll<HTMLElement>('.rfc-rv')
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('rfc-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('rfc-in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.2 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [devices.length, loading])

  /* ── rail progress + arrow availability ── */
  const sync = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    const max = rail.scrollWidth - rail.clientWidth
    const ratio = rail.clientWidth / rail.scrollWidth
    const tw = Math.min(100, ratio * 100)
    setProg({
      tw,
      tx: max > 0 ? (rail.scrollLeft / max) * (100 / tw * 100 - 100) : 0,
      show: max > 4,
    })
    setCanPrev(rail.scrollLeft > 4)
    setCanNext(rail.scrollLeft < max - 4)
  }, [])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const onScroll = () => requestAnimationFrame(sync)
    rail.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', sync)
    sync()
    return () => {
      rail.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', sync)
    }
  }, [sync, devices.length, loading])

  /* ── mouse drag-to-scroll ── */
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current
      if (!d.active) return
      const dx = e.clientX - d.sx
      d.moved = Math.max(d.moved, Math.abs(dx))
      if (d.moved > 5 && railRef.current) {
        railRef.current.classList.add('rfc-drag')
        railRef.current.scrollLeft = d.sl - dx
      }
    }
    const up = () => {
      if (!drag.current.active) return
      drag.current.active = false
      setTimeout(() => railRef.current?.classList.remove('rfc-drag'), 0)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    drag.current = { active: true, sx: e.clientX, sl: railRef.current?.scrollLeft ?? 0, moved: 0 }
  }

  const scrollByCard = (dir: number) => {
    const rail = railRef.current
    if (!rail) return
    const card = rail.querySelector('.pc')
    const amount = card ? card.getBoundingClientRect().width + 20 : 320
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    rail.scrollBy({ left: dir * amount, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <section className="rfc" ref={rootRef} aria-label="Certified refurbished devices">
      <div className="rfc-wrap">
        <SectionHeading
          className="rfc-head"
          eyebrow="Refurbished"
          icon="verified_user"
          title={<>Certified <Accent>Refurbished</Accent></>}
          subtitle="Pristine devices, verified for excellence."
        >
          <div className="rfc-head-r">
            <div className="rfc-arrows" role="group" aria-label="Scroll devices">
              <button
                className="rfc-arrow"
                type="button"
                aria-label="Previous devices"
                disabled={!canPrev}
                onClick={() => scrollByCard(-1)}
              >
                <Ic>
                  <path d="m15 6-6 6 6 6" />
                </Ic>
              </button>
              <button
                className="rfc-arrow"
                type="button"
                aria-label="Next devices"
                disabled={!canNext}
                onClick={() => scrollByCard(1)}
              >
                <Ic>
                  <path d="m9 6 6 6-6 6" />
                </Ic>
              </button>
            </div>
            <Link className="btn btn-secondary btn-sm rfc-vc" to="/phones">
              View Collection
              <Ic>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </Ic>
            </Link>
          </div>
        </SectionHeading>

        <div className="rfc-railwrap">
          {loading ? (
            <div className="rfc-rail" aria-hidden="true">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="pc pc-skel">
                  <div className="pc-plate" />
                  <div className="pc-body">
                    <div className="pc-skel-line" style={{ width: '70%' }} />
                    <div className="pc-skel-line" style={{ width: '45%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div
                className="rfc-rail"
                ref={railRef}
                onPointerDown={onPointerDown}
                tabIndex={-1}
                aria-label="Certified refurbished devices"
              >
                {devices.map((d, i) => (
                  <ProductCard
                    key={d.id}
                    {...d}
                    order={i}
                    badge="Refurbished"
                    overlayTitle="40-point check passed"
                    checks={CHECKS}
                    certTitle="Customer rating"
                    certText="12-month warranty"
                  />
                ))}
              </div>
              <div className="rfc-prog" style={{ visibility: prog.show ? 'visible' : 'hidden' }} aria-hidden="true">
                <i style={{ '--tw': `${prog.tw}%`, '--tx': `${prog.tx}%` } as CSSProperties} />
              </div>
            </>
          )}
        </div>

        <div className="rfc-trust rfc-rv">
          <div>
            <span className="rfc-ico">
              <Ic>
                <path d="M9 11l3 3 8-8" />
                <path d="M20 12a8 8 0 1 1-4.5-7.2" />
              </Ic>
            </span>
            <p>
              <b>40-point inspection</b>
              <span>Every device is tested before it ships.</span>
            </p>
          </div>
          <div>
            <span className="rfc-ico">
              <Ic>
                <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" />
              </Ic>
            </span>
            <p>
              <b>12-month warranty</b>
              <span>Covered for a full year after purchase.</span>
            </p>
          </div>
          <div>
            <span className="rfc-ico">
              <Ic>
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </Ic>
            </span>
            <p>
              <b>7-day easy returns</b>
              <span>Not happy? Send it back.</span>
            </p>
          </div>
        </div>

        <p className="rfc-next">In action</p>
      </div>
    </section>
  )
}

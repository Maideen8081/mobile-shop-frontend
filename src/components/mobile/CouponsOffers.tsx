import { useNavigate } from 'react-router-dom'
import { Tag, ChevronRight } from 'lucide-react'
import { VALID_COUPONS } from './cartLogic'
import { C } from './theme'

export default function CouponsOffers() {
  const navigate = useNavigate()
  const coupons = Object.entries(VALID_COUPONS).map(([code, c]) => ({
    code,
    label: c.label,
    discount: c.discount,
    fixed: !!c.fixed,
  }))

  if (!coupons.length) return null

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between px-3.5 mb-3">
        <h2 className={C.sectionTitle}>Coupons &amp; Offers</h2>
        <button
          onClick={() => navigate('/collection/all')}
          className={C.viewAll}
        >
          View All <ChevronRight size={14} />
        </button>
      </div>

      {/* Coupon cards — horizontal scroll, snap */}
      <div
        className="flex gap-3 overflow-x-auto px-3.5 pb-1 snap-x snap-mandatory scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
      >
        {coupons.map((c) => (
          <div
            key={c.code}
            className="snap-start flex-shrink-0 w-[150px] h-[112px] rounded-2xl bg-white border border-[#EEF1F4] shadow-[0_4px_14px_rgba(15,23,42,0.06)] p-3 flex flex-col active:scale-[0.97] transition relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full" style={{ background: C.gradSoft }} />
            <div className="relative w-7 h-7 rounded-full bg-[#4F46E5] flex items-center justify-center shrink-0">
              <Tag size={14} className="text-white" />
            </div>
            <p className="relative text-[20px] font-extrabold text-[#0F172A] leading-tight mt-1.5">{c.label}</p>
            <div className="relative mt-auto">
              <span className="text-[10px] font-bold text-[#4F46E5] bg-[#EEF2FF] rounded px-1.5 py-0.5 inline-block">
                {c.code}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

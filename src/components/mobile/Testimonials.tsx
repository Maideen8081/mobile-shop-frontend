import { Star } from 'lucide-react'
import { C } from './theme'

const testimonials = [
  { name: 'Arjun Sharma', quote: 'Fixed my iPhone screen in under 45 minutes. The precision is unmatched.', badge: 'Verified Repair' },
  { name: 'Priya Kapur', quote: 'Bought a refurbished Pixel and it looks brand new. Warranty gives total peace of mind.', badge: 'Verified Purchase' },
  { name: 'Rahul Mehta', quote: 'Excellent diagnostics. Honest people saved me from an unnecessary repair.', badge: 'Verified Repair' },
]

export default function Testimonials() {
  return (
    <section className="mt-7">
      <div className="px-3.5 mb-3">
        <h2 className={C.sectionTitle}>Trusted by Thousands</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto px-3.5 pb-1 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
        {testimonials.map((t, i) => (
          <div key={i} className="w-[260px] flex-shrink-0 snap-start rounded-2xl bg-white border border-[#ECDFF6] shadow-[0_2px_10px_rgba(33,13,53,0.05)] p-4">
            <div className="flex text-[#7C4DCC] mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={13} className="fill-[#7C4DCC]" />
              ))}
            </div>
            <p className="text-caption text-[#210D35] italic leading-relaxed">“{t.quote}”</p>
            <div className="mt-3 flex items-center gap-2 border-t border-[#ECDFF6] pt-2.5">
              <span className="w-5 h-5 rounded-[8px] bg-[#16A34A] text-white flex items-center justify-center text-micro font-bold">✓</span>
              <div>
                <h4 className="text-caption font-bold text-[#210D35]">{t.name}</h4>
                <span className="text-micro font-bold text-[#5B3A7E] uppercase tracking-widest">{t.badge}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

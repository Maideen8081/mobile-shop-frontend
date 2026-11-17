import { BUSINESS } from '../../config/business'
import { Truck, ShieldCheck, RotateCcw, BadgeCheck, Sparkles } from 'lucide-react'

type Benefit = {
  title: string
  subtitle: string
  Icon: any
  iconBg: string
  iconColor: string
}

const BENEFITS: Benefit[] = [
  { title: 'Free Delivery', subtitle: `On orders over ₹${BUSINESS.freeDeliveryOver}`, Icon: Truck, iconBg: '#ECFDF5', iconColor: '#059669' },
  { title: 'Secure Payment', subtitle: '100% safe & encrypted', Icon: ShieldCheck, iconBg: '#dfe6cf', iconColor: '#0f3b2c' },
  { title: 'Easy Returns', subtitle: '7-day hassle-free', Icon: RotateCcw, iconBg: '#dfe6cf', iconColor: '#18503c' },
  { title: 'Genuine Products', subtitle: '100% authentic guarantee', Icon: BadgeCheck, iconBg: '#dfe6cf', iconColor: '#0f3b2c' },
]

export default function BenefitsBanner() {
  return (
    <section className="mt-6 px-3.5">
      <div className="flex items-center gap-1.5 mb-2.5 px-0.5">
        <Sparkles size={14} className="text-[#0f3b2c]" />
        <h2 className="text-label font-bold text-[#0f3b2c] tracking-tight">Why shop with us</h2>
      </div>

      {/* Static 2x2 grid — full text, no scroll, Zepto-style colorful chips */}
      <div className="grid grid-cols-2 gap-2.5">
        {BENEFITS.map((b) => {
          const { Icon } = b
          return (
            <div
              key={b.title}
              className="flex items-center gap-2.5 rounded-2xl bg-white border border-[#f7f6f2] shadow-[0_3px_12px_rgba(15,59,44,0.05)] px-3 py-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: b.iconBg }}
              >
                <Icon size={20} style={{ color: b.iconColor }} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-caption font-bold text-[#0f3b2c] leading-tight">{b.title}</h3>
                <p className="text-micro text-[#5d6762] leading-tight mt-0.5">{b.subtitle}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

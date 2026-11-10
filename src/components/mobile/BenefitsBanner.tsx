import { Truck, ShieldCheck, RotateCcw, BadgeCheck, Sparkles } from 'lucide-react'

type Benefit = {
  title: string
  subtitle: string
  Icon: any
  iconBg: string
  iconColor: string
}

const BENEFITS: Benefit[] = [
  { title: 'Free Shipping', subtitle: 'On all orders, no minimum', Icon: Truck, iconBg: '#ECFDF5', iconColor: '#059669' },
  { title: 'Secure Payment', subtitle: '100% safe & encrypted', Icon: ShieldCheck, iconBg: '#F3E8FF', iconColor: '#210D35' },
  { title: 'Easy Returns', subtitle: '7-day hassle-free', Icon: RotateCcw, iconBg: '#F3E8FF', iconColor: '#5B3A7E' },
  { title: 'Genuine Products', subtitle: '100% authentic guarantee', Icon: BadgeCheck, iconBg: '#F3E8FF', iconColor: '#210D35' },
]

export default function BenefitsBanner() {
  return (
    <section className="mt-6 px-3.5">
      <div className="flex items-center gap-1.5 mb-2.5 px-0.5">
        <Sparkles size={14} className="text-[#210D35]" />
        <h2 className="text-label font-bold text-[#210D35] tracking-tight">Why shop with us</h2>
      </div>

      {/* Static 2x2 grid — full text, no scroll, Zepto-style colorful chips */}
      <div className="grid grid-cols-2 gap-2.5">
        {BENEFITS.map((b) => {
          const { Icon } = b
          return (
            <div
              key={b.title}
              className="flex items-center gap-2.5 rounded-2xl bg-white border border-[#ECDFF6] shadow-[0_3px_12px_rgba(33,13,53,0.05)] px-3 py-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: b.iconBg }}
              >
                <Icon size={20} style={{ color: b.iconColor }} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-caption font-bold text-[#210D35] leading-tight">{b.title}</h3>
                <p className="text-micro text-[#7C668A] leading-tight mt-0.5">{b.subtitle}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

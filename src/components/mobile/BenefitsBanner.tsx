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
  { title: 'Secure Payment', subtitle: '100% safe & encrypted', Icon: ShieldCheck, iconBg: '#EEF2FF', iconColor: '#4F46E5' },
  { title: 'Easy Returns', subtitle: '7-day hassle-free', Icon: RotateCcw, iconBg: '#FEF3C7', iconColor: '#D97706' },
  { title: 'Genuine Products', subtitle: '100% authentic guarantee', Icon: BadgeCheck, iconBg: '#FCE7F3', iconColor: '#DB2777' },
]

export default function BenefitsBanner() {
  return (
    <section className="mt-6 px-3.5">
      <div className="flex items-center gap-1.5 mb-2.5 px-0.5">
        <Sparkles size={14} className="text-[#4F46E5]" />
        <h2 className="text-[13px] font-extrabold text-[#0F172A] tracking-tight">Why shop with us</h2>
      </div>

      {/* Static 2x2 grid — full text, no scroll, Zepto-style colorful chips */}
      <div className="grid grid-cols-2 gap-2.5">
        {BENEFITS.map((b) => {
          const { Icon } = b
          return (
            <div
              key={b.title}
              className="flex items-center gap-2.5 rounded-2xl bg-white border border-[#EEF1F6] shadow-[0_3px_12px_rgba(15,23,42,0.04)] px-3 py-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: b.iconBg }}
              >
                <Icon size={20} style={{ color: b.iconColor }} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[12.5px] font-bold text-[#0F172A] leading-tight">{b.title}</h3>
                <p className="text-[10.5px] text-[#64748B] leading-tight mt-0.5">{b.subtitle}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

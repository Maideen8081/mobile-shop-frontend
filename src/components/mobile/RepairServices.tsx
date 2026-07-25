import { Link } from 'react-router-dom'
import { Zap, Truck, Wrench } from 'lucide-react'
import { C } from './theme'

const services = [
  { icon: Zap, title: 'Express Repair', desc: 'Screen or battery fixed in under 60 minutes while you wait.' },
  { icon: Truck, title: 'Mail-In Service', desc: 'Secure prepaid shipping kits with online tracking.' },
  { icon: Wrench, title: 'On-Site Tech', desc: 'We come to your home or office for specific repairs.' },
]

export default function RepairServices() {
  return (
    <section className="mt-7">
      <div className="px-3.5 mb-3">
        <h2 className={C.sectionTitle}>Precision Repair Services</h2>
        <p className="text-[12px] text-[#64748B] mt-0.5 font-medium">From micro-soldering to full restoration.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 px-3.5">
        {services.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.title}
              to="/repairs"
              className="flex items-center gap-3 rounded-2xl bg-white border border-[#EEF1F4] shadow-[0_2px_10px_rgba(15,23,42,0.05)] p-3.5 active:scale-[0.99] transition"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${C.iconWrap}`}>
                <Icon size={24} className="text-[#CB202D]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[14px] font-bold text-[#0F172A]">{s.title}</h3>
                <p className="text-[11.5px] text-[#64748B] leading-snug mt-0.5">{s.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

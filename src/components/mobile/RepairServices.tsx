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
        <p className="text-caption text-[#5d6762] mt-0.5 font-medium">From micro-soldering to full restoration.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 px-3.5">
        {services.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.title}
              to="/repairs"
              className="flex items-center gap-3 rounded-2xl bg-white border border-[#f7f6f2] shadow-[0_2px_10px_rgba(15,59,44,0.05)] p-3.5 active:scale-[0.99] transition"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${C.iconWrap}`}>
                <Icon size={24} className="text-[#0f3b2c]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-body-sm font-bold text-[#0f3b2c]">{s.title}</h3>
                <p className="text-caption text-[#5d6762] leading-snug mt-0.5">{s.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import ProductCard from './ProductCard'

function useCountdown() {
  const [t, setT] = useState({ h: '02', m: '40', s: '00' })
  useEffect(() => {
    const id = setInterval(() => {
      let s = parseInt(t.s) - 1
      let m = parseInt(t.m)
      let h = parseInt(t.h)
      if (s < 0) { s = 59; m-- }
      if (m < 0) { m = 59; h-- }
      if (h < 0) { h = 23 }
      setT({ h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0'), s: String(s).padStart(2, '0') })
    }, 1000)
    return () => clearInterval(id)
  }, [t.s, t.m, t.h])
  return t
}

export default function FlashSale({ products }: { products: any[] }) {
  const t = useCountdown()
  if (!products.length) return null
  return (
    <section className="mt-7">
      <div className="flex items-center justify-between px-3.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center">
            <Flame size={18} className="text-[#EF4444]" fill="#EF4444" />
          </span>
          <h2 className="text-[17px] font-extrabold text-[#0F172A] tracking-tight">Flash Sale</h2>
        </div>
        <div className="flex items-center gap-1">
          {[t.h, t.m, t.s].map((u, i) => (
            <span key={i} className="bg-[#0F172A] text-white text-[12px] font-bold px-1.5 py-1 rounded-md tabular-nums min-w-[26px] text-center">
              {u}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2.5 px-3.5 pb-1 sm:grid-cols-4">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}

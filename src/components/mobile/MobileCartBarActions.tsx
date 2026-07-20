import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Minus, Plus, Trash2, ChevronRight } from 'lucide-react'
import { useCart, resolveImage } from './cartLogic'
import { getImageUrl } from './helpers'

export default function MobileCartBarActions({ hidden = false }: { hidden?: boolean }) {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, subtotal, totalItems } = useCart()
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(false)
  const [bounce, setBounce] = useState(false)
  const prevCount = useRef(0)

  useEffect(() => {
    const update = () => {
      const len = (JSON.parse(localStorage.getItem('cart') || '[]') as any[]).length
      setVisible(len > 0)
      if (len > prevCount.current) {
        setBounce(true)
        setTimeout(() => setBounce(false), 600)
      }
      prevCount.current = len
    }
    update()
    window.addEventListener('cart-updated', update)
    return () => window.removeEventListener('cart-updated', update)
  }, [])

  if (!visible || totalItems === 0 || hidden) return null

  return (
    <div className="fixed bottom-[84px] left-1/2 -translate-x-1/2 z-40 w-full max-w-[480px] px-3 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        {/* Expanded item list with add / remove */}
        {open && (
          <div className="bg-white rounded-2xl shadow-[0_14px_34px_rgba(108,59,255,0.18)] border border-[#ECEAFB] p-2 max-h-[40vh] overflow-y-auto">
            {items.map((it) => {
              const im = getImageUrl(resolveImage(it))
              return (
                <div key={`${it.productId}-${it.variantId ?? 'd'}`} className="flex items-center gap-2.5 py-2 border-b border-[#F1ECFF] last:border-0">
                  <div className="w-11 h-11 rounded-xl bg-[#F8F9FF] overflow-hidden flex-shrink-0">
                    <img src={im || ''} alt={it.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-[#1F2937] leading-tight truncate">{it.name}</p>
                    <p className="text-[11px] text-[#6B7280]">₹{Number(it.price).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQuantity(it.productId, -1)} aria-label="Decrease" className="w-7 h-7 rounded-full bg-[#F1ECFF] flex items-center justify-center active:scale-90 transition">
                      <Minus size={14} className="text-[#1F2937]" />
                    </button>
                    <span className="text-[13px] font-bold w-5 text-center">{it.quantity}</span>
                    <button onClick={() => updateQuantity(it.productId, 1)} aria-label="Increase" className="w-7 h-7 rounded-full bg-[#F1ECFF] flex items-center justify-center active:scale-90 transition">
                      <Plus size={14} className="text-[#1F2937]" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(it.productId)} aria-label="Remove" className="w-7 h-7 rounded-full bg-[#FEF2F2] flex items-center justify-center active:scale-90 transition">
                    <Trash2 size={13} className="text-[#EF4444]" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Main bar */}
        <button
          onClick={() => navigate('/cart')}
          className={`w-full flex items-center justify-between gap-3 rounded-full pl-4 pr-2 py-2.5 shadow-[0_12px_30px_rgba(108,59,255,0.38)] bg-[#6C3BFF] text-white active:scale-[0.99] transition ${bounce ? 'animate-bounce' : ''}`}
          style={{ background: 'linear-gradient(135deg,#6C3BFF,#4B2ECC)' }}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={18} />
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#6C3BFF] text-[10px] font-extrabold flex items-center justify-center">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            </span>
            <span className="text-left min-w-0">
              <span className="block text-[12px] font-bold leading-none">{totalItems} item{totalItems > 1 ? 's' : ''} added</span>
              <span className="block text-[11px] text-white/80 leading-none mt-1">Tap to {open ? 'hide' : 'view & edit'}</span>
            </span>
          </span>
          <span className="flex items-center gap-1.5 bg-white text-[#6C3BFF] text-[13px] font-extrabold px-4 py-2 rounded-full flex-shrink-0">
            ₹{subtotal.toLocaleString('en-IN')} <ChevronRight size={15} />
          </span>
        </button>

        {/* Toggle expand */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="self-center pointer-events-auto px-4 py-1.5 rounded-full bg-white shadow-[0_6px_18px_rgba(108,59,255,0.12)] border border-[#ECEAFB] text-[12px] font-bold text-[#6C3BFF] active:scale-95 transition"
        >
          {open ? 'Hide cart' : 'View cart items'}
        </button>
      </div>
    </div>
  )
}

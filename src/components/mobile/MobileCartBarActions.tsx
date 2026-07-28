import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Minus, Plus, Trash2, ChevronRight } from 'lucide-react'
import { cartService, type CartItem } from '../../services/cartService'

export default function MobileCartBarActions({ hidden = false }: { hidden?: boolean }) {
  const navigate = useNavigate()
  const [items, setItems] = useState<CartItem[]>([])
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(false)
  const [bounce, setBounce] = useState(false)
  const prevCount = useRef(0)

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  const load = () => cartService.getItems().then(setItems)

  useEffect(() => {
    load()
    const update = () => {
      const count = cartService.getCachedCartCount()
      setVisible(count > 0)
      if (count > prevCount.current) {
        setBounce(true)
        setTimeout(() => setBounce(false), 600)
      }
      prevCount.current = count
      load()
    }
    update()
    window.addEventListener('cart-updated', update)
    return () => window.removeEventListener('cart-updated', update)
  }, [])

  if (!visible || totalItems === 0 || hidden) return null

  return (
    <div className="fixed bottom-[84px] left-1/2 -translate-x-1/2 z-40 w-full max-w-[480px] px-3 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        {open && (
          <div className="bg-white rounded-2xl shadow-[0_14px_34px_rgba(203,32,45,0.18)] border border-[#FEE2E2] p-2 max-h-[40vh] overflow-y-auto">
            {items.map((it) => (
              <div key={`${it.productId}-${it.variantId ?? 'd'}`} className="flex items-center gap-2.5 py-2 border-b border-[#FEE2E6] last:border-0">
                <div className="w-11 h-11 rounded-xl bg-[#FFFBFB] overflow-hidden flex-shrink-0">
                  <img src={it.image || ''} alt={it.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-[#1F2937] leading-tight truncate">{it.name}</p>
                  <p className="text-[11px] text-[#6B7280]">₹{Number(it.price).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => cartService.updateQuantity(it.productId, it.variantId, -1).then(load)} aria-label="Decrease" className="w-7 h-7 rounded-full bg-[#FEE2E6] flex items-center justify-center active:scale-90 transition">
                    <Minus size={14} className="text-[#1F2937]" />
                  </button>
                  <span className="text-[13px] font-bold w-5 text-center">{it.quantity}</span>
                  <button onClick={() => cartService.updateQuantity(it.productId, it.variantId, 1).then(load)} aria-label="Increase" className="w-7 h-7 rounded-full bg-[#FEE2E6] flex items-center justify-center active:scale-90 transition">
                    <Plus size={14} className="text-[#1F2937]" />
                  </button>
                </div>
                <button onClick={() => cartService.removeItem(it.productId, it.variantId).then(load)} aria-label="Remove" className="w-7 h-7 rounded-full bg-[#FEF2F2] flex items-center justify-center active:scale-90 transition">
                  <Trash2 size={13} className="text-[#EF4444]" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate('/cart')}
          className={`w-full flex items-center justify-between gap-3 rounded-full pl-4 pr-2 py-2.5 shadow-[0_12px_30px_rgba(203,32,45,0.38)] bg-[#CB202D] text-white active:scale-[0.99] transition ${bounce ? 'animate-bounce' : ''}`}
          style={{ background: 'linear-gradient(135deg,#CB202D,#A81D2A)' }}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={18} />
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#CB202D] text-[10px] font-extrabold flex items-center justify-center">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            </span>
            <span className="text-left min-w-0">
              <span className="block text-[12px] font-bold leading-none">{totalItems} item{totalItems > 1 ? 's' : ''} added</span>
              <span className="block text-[11px] text-white/80 leading-none mt-1">Tap to {open ? 'hide' : 'view & edit'}</span>
            </span>
          </span>
          <span className="flex items-center gap-1.5 bg-white text-[#CB202D] text-[13px] font-extrabold px-4 py-2 rounded-full flex-shrink-0">
            ₹{subtotal.toLocaleString('en-IN')} <ChevronRight size={15} />
          </span>
        </button>

        <button
          onClick={() => setOpen((v) => !v)}
          className="self-center pointer-events-auto px-4 py-1.5 rounded-full bg-white shadow-[0_6px_18px_rgba(203,32,45,0.12)] border border-[#FEE2E2] text-[12px] font-bold text-[#CB202D] active:scale-95 transition"
        >
          {open ? 'Hide cart' : 'View cart items'}
        </button>
      </div>
    </div>
  )
}

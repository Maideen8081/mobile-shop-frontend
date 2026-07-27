import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiShoppingCart, FiTrash2, FiMinus, FiPlus } from 'react-icons/fi'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { Link } from 'react-router-dom'

interface CartItem {
  productId: number
  name: string
  brand?: string
  price: number
  quantity: number
  emoji?: string
  image?: string
  storage?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const emojiToImage: Record<string, string> = {
  '📱': 'https://pngimg.com/d/iphone16_PNG37.png',
  '📲': 'https://pngimg.com/d/samsung_PNG2.png',
  '🎧': 'https://pngimg.com/d/headphones_PNG7645.png',
  '⌚': 'https://pngimg.com/d/apple_watch_PNG19558.png',
  '📟': 'https://pngimg.com/d/ipad_PNG2133.png',
  '💻': 'https://pngimg.com/d/laptop_PNG101814.png',
  '🎮': 'https://pngimg.com/d/ps5_PNG31.png',
  '📷': 'https://pngimg.com/d/camera_PNG101583.png',
}

function resolveCartImage(item: CartItem): string {
  if (item.image) {
    if (item.image.startsWith('http') || item.image.startsWith('data:')) return item.image
    const mapped = emojiToImage[item.image]
    if (mapped) return mapped
    return `${API_BASE_URL.replace(/\/$/, '')}/${item.image.replace(/^\//, '')}`
  }
  if (item.emoji && emojiToImage[item.emoji]) return emojiToImage[item.emoji]
  return ''
}

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useLockBodyScroll(open)
  const [items, setItems] = useState<CartItem[]>([])
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('cart') || '[]')
      setItems(stored)
    } catch {
      setItems([])
    }
  }, [open])

  const updateQuantity = (productId: number, delta: number) => {
    const updated = items.map(item => {
      if (item.productId !== productId) return item
      const qty = Math.max(0, item.quantity + delta)
      return qty === 0 ? null : { ...item, quantity: qty }
    }).filter(Boolean) as CartItem[]
    setItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    window.dispatchEvent(new Event('cart-updated'))
  }

  const removeItem = (productId: number) => {
    const updated = items.filter(item => item.productId !== productId)
    setItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    window.dispatchEvent(new Event('cart-updated'))
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0f172a] border-l border-white/5 shadow-2xl z-[101] flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CB202D] to-[#E53E4E] flex items-center justify-center">
                  <FiShoppingCart size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Your Cart</h2>
                  <p className="text-xs text-white/40">{count} items</p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <FiShoppingCart size={32} className="text-white/20" />
                  </div>
                  <h3 className="text-lg font-semibold text-white/60 mb-2">Your cart is empty</h3>
                  <p className="text-sm text-white/30 mb-6">Looks like you haven't added anything yet.</p>
                  <button onClick={onClose} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#CB202D] to-[#E53E4E] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#CB202D]/20 transition-all cursor-pointer">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const imgUrl = resolveCartImage(item)
                  const hasImg = imgUrl && !imgErrors[item.productId]
                  return (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="group flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-all"
                  >
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-[#CB202D]/10 to-[#E53E4E]/10 overflow-hidden shrink-0">
                      {hasImg ? (
                        <img
                          src={imgUrl}
                          alt={item.name}
                          className="w-full h-full object-cover scale-125"
                          onError={() => setImgErrors(p => ({ ...p, [item.productId]: true }))}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {item.emoji || <FiShoppingCart size={28} className="text-white/30" />}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                      {item.storage && <p className="text-xs text-white/40 mt-0.5">{item.storage}</p>}
                      <p className="text-sm font-bold text-[#E53E4E] mt-1">${item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#CB202D]/30 transition-all cursor-pointer">
                            <FiMinus size={10} />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#CB202D]/30 transition-all cursor-pointer">
                            <FiPlus size={10} />
                          </button>
                        </div>
                        <button onClick={() => removeItem(item.productId)} className="ml-auto w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all cursor-pointer">
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )})
              )}
            </div>

            {items.length > 0 && (
              <div className="p-5 border-t border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-white/60">Subtotal</span>
                  <span className="text-xl font-bold text-white">${total.toFixed(2)}</span>
                </div>
                <Link to="/checkout"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#CB202D] to-[#E53E4E] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#CB202D]/25 transition-all"
                >
                  <FiShoppingCart size={16} /> Checkout
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

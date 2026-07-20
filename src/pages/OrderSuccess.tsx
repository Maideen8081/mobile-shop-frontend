import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import StorefrontNavbar from '../components/ecommerce/StorefrontNavbar'
import BackBar from '../components/ecommerce/BackBar'
import EcommerceFooter from '../components/ecommerce/Footer'
import MobileOrderSuccess from '../components/mobile/MobileOrderSuccess'
import { useIsMobile } from '../components/mobile/helpers'

interface OrderItem {
  productId: number
  name: string
  price: number
  quantity: number
  emoji?: string
  image?: string
  storage?: string
  ram?: string
  color?: string
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
  '🛡️': 'https://pngimg.com/d/iphone15_PNG40.png',
}

function resolveImage(item: OrderItem): string {
  if (item.image) {
    if (item.image.startsWith('http') || item.image.startsWith('data:')) return item.image
    const mapped = emojiToImage[item.image]
    if (mapped) return mapped
    return `${API_BASE_URL.replace(/\/$/, '')}/${item.image.replace(/^\//, '')}`
  }
  if (item.emoji && emojiToImage[item.emoji]) return emojiToImage[item.emoji]
  return ''
}

function formatPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function OrderSuccess() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileOrderSuccess />
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [orderData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('last_order')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const orderId = params.get('order_id') || orderData?.orderId || 'ORD-' + String(Math.random()).slice(2, 10).toUpperCase()
  const deliveryDate = orderData?.deliveryDate || (() => {
    const d = new Date()
    d.setDate(d.getDate() + 5)
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  })()
  const items: OrderItem[] = orderData?.items || []
  const total = orderData?.total ?? items.reduce((s, i) => s + i.price * i.quantity, 0)

  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})

  return (
    <div className="min-h-screen bg-[#f7fafd] text-[#181c1e] overflow-x-hidden">
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(217, 222, 229, 0.5);
          box-shadow: 0 10px 30px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255, 255, 255, 0.8);
        }
        .neon-mint-glow {
          filter: drop-shadow(0 0 10px rgba(79, 227, 193, 0.6));
        }
        .progress-fill {
          transition: width 2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .float-animation {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>

      {/* Parallax Background Circles */}
      <div className="fixed w-[600px] h-[600px] rounded-full bg-[#4FE3C1] top-[-200px] left-[-100px] -z-10 opacity-15 blur-[80px]" />
      <div className="fixed w-[500px] h-[500px] rounded-full bg-[#454747] top-[40%] right-[-100px] -z-10 opacity-15 blur-[80px]" />

      {/* Parallax mouse effect */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('mousemove', (e) => {
              const circles = document.querySelectorAll('.parallax-circle');
              const x = (window.innerWidth - e.pageX * 2) / 100;
              const y = (window.innerHeight - e.pageY * 2) / 100;
              circles.forEach((circle, index) => {
                const speed = (index + 1) * 2;
                circle.style.transform = 'translate(' + (x * speed) + 'px, ' + (y * speed) + 'px)';
              });
            });
          `
        }}
      />

      <StorefrontNavbar activeLabel="Home" />
      <div className="pt-24"><BackBar label="Continue Shopping" to="/collection/all" /></div>

      <main className="max-w-4xl mx-auto px-4 pt-8 pb-12 flex flex-col items-center">
        {/* Main Glass Card */}
        <div className="glass-card w-full rounded-[2rem] p-10 flex flex-col items-center text-center relative overflow-hidden">
          {/* Success Icon */}
          <div className="w-32 h-32 mb-8 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[#4FE3C1]/20 rounded-full blur-xl animate-pulse" />
            <div className="glass-card rounded-full w-24 h-24 flex items-center justify-center neon-mint-glow float-animation border-[#4FE3C1]/30">
              <span className="material-symbols-outlined text-[#4FE3C1] text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
            </div>
          </div>

          <h1 className="text-[2.25rem] md:text-[3.5rem] font-bold text-[#454747] mb-4" style={{ letterSpacing: '-0.02em' }}>
            Order Confirmed!
          </h1>
          <p className="text-lg text-[#434748] max-w-2xl mb-8">
            Your order has been placed successfully. We'll send you a confirmation email with tracking details shortly.
          </p>

          {/* Order ID */}
          <div className="flex items-center gap-3 bg-white/40 border border-[rgba(217,222,229,0.5)] px-6 py-4 rounded-full mb-12 group cursor-pointer hover:bg-white/60 transition-all duration-300">
            <span className="text-[0.75rem] tracking-[0.1em] text-[#454747]/60 font-bold">ORDER ID:</span>
            <span className="font-bold text-[#4FE3C1]">{orderId}</span>
            <span className="material-symbols-outlined text-[#4FE3C1] text-lg group-hover:scale-110 transition-transform"
              onClick={() => { navigator.clipboard.writeText(orderId) }}
            >
              content_copy
            </span>
          </div>

          {/* Grid Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
            {/* Delivery Card */}
            <div className="bg-white/30 rounded-2xl p-6 border border-[rgba(217,222,229,0.5)] flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[0.75rem] tracking-[0.1em] text-[#434748]/60 font-bold">Estimated Delivery</span>
                <span className="material-symbols-outlined text-[#4FE3C1]">calendar_today</span>
              </div>
              <div className="text-3xl font-bold text-[#454747]">{deliveryDate}</div>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between text-[10px] tracking-[0.1em] text-[#434748]/80 font-bold">
                  <span>STATUS: PAYMENT CONFIRMED & PROCESSING</span>
                  <span className="text-[#4FE3C1] font-bold">88%</span>
                </div>
                <div className="w-full bg-white/50 h-2 rounded-full overflow-hidden">
                  <div className="progress-fill h-full bg-[#4FE3C1] rounded-full" style={{ width: '88%', boxShadow: '0 0 8px rgba(79,227,193,0.8)' }} />
                </div>
              </div>
            </div>

            {/* Order Items Card */}
            <div className="bg-white/30 rounded-2xl p-6 border border-[rgba(217,222,229,0.5)]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[0.75rem] tracking-[0.1em] text-[#434748]/60 font-bold">Order Items</span>
                <span className="material-symbols-outlined text-[#4FE3C1]">shopping_bag</span>
              </div>
              <div className="flex flex-col gap-3">
                {items.length === 0 ? (
                  <p className="text-sm text-[#434748]/60">Order details loading...</p>
                ) : items.map((item, idx) => {
                  const imgUrl = resolveImage(item)
                  const hasImg = imgUrl && !imgErrors[item.productId]
                  return (
                    <div key={item.productId}>
                      {idx > 0 && <div className="h-px bg-[rgba(217,222,229,0.5)] my-3" />}
                      <div className="flex items-center gap-3">
                        {hasImg ? (
                          <img src={imgUrl} alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={() => setImgErrors(p => ({ ...p, [item.productId]: true }))}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#ebeef1] flex items-center justify-center text-xl">
                            {item.emoji || '📦'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-[#454747] font-bold block truncate">{item.name}</span>
                          <span className="text-[10px] text-[#434748]/60">
                            Qty: {item.quantity}
                            {item.storage && ` | ${item.storage}`}
                          </span>
                        </div>
                        <span className="material-symbols-outlined text-[#4FE3C1] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="mt-8 flex items-baseline gap-2">
            <span className="text-[0.75rem] tracking-[0.1em] text-[#434748]/60 font-bold">Total Amount:</span>
            <span className="text-4xl font-extrabold text-[#454747] tracking-tighter">
              {formatPrice(total)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4 mt-12 w-full justify-center">
            <button onClick={() => navigate(`/orders?order_id=${orderId}`)}
              className="flex items-center justify-center gap-2 px-10 py-4 rounded-full font-bold text-white transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #4FE3C1 0%, #006b58 100%)',
                boxShadow: '0 8px 20px rgba(79,227,193,0.3)',
              }}
            >
              <span className="material-symbols-outlined">rocket_launch</span>
              Track Order
            </button>
            <button onClick={() => navigate('/collection/all')}
              className="flex items-center justify-center gap-2 px-10 py-4 rounded-full font-bold text-[#454747] transition-all duration-300 bg-white/20 backdrop-blur-xl border border-[rgba(217,222,229,0.5)] hover:bg-white/40"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              Continue Shopping
            </button>
          </div>
        </div>
      </main>

      {/* Footer Badges */}
      <footer className="max-w-5xl mx-auto px-4 py-8 mt-12">
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#4FE3C1]">security</span>
            <span className="text-[10px] tracking-widest text-[#454747] uppercase font-bold">Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#4FE3C1]">lock_person</span>
            <span className="text-[10px] tracking-widest text-[#454747] uppercase font-bold">Encrypted Checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#4FE3C1]">verified</span>
            <span className="text-[10px] tracking-widest text-[#454747] uppercase font-bold">Trusted Service</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#4FE3C1]">support</span>
            <span className="text-[10px] tracking-widest text-[#454747] uppercase font-bold">24/7 Support</span>
          </div>
        </div>
      </footer>

      <EcommerceFooter />
    </div>
  )
}

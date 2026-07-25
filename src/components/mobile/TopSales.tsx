import { useNavigate } from 'react-router-dom'
import { ChevronRight, Sparkles, Flame, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { getImageUrl, getProductImage, getProductPrice } from './helpers'
import { FALLBACK_IMG } from './fallback'
import { C } from './theme'

function TopProduct({ product, index = 0 }: { product: any; index?: number }) {
  const navigate = useNavigate()
  const img = getProductImage(product)
  const { price, discount: mrp, discountPct } = getProductPrice(product)

  return (
    <motion.div
      onClick={() => navigate(`/product/${product.id}`)}
      role="button"
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.96 }}
      className="group relative flex flex-col h-full cursor-pointer overflow-hidden rounded-2xl bg-white shadow-[0_6px_18px_rgba(203,32,45,0.10)]"
    >
      {discountPct > 0 && (
        <span className="absolute top-1.5 left-1.5 z-10 text-[9px] font-extrabold text-white px-1.5 py-0.5 rounded-full bg-[#EF4444] shadow-sm">
          −{discountPct}%
        </span>
      )}
      <div className="relative w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#FEE2E6] to-[#F8F9FB] aspect-square">
        <img
          src={img || FALLBACK_IMG}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-active:scale-110"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
        />
      </div>
      <div className="px-2 py-1.5 flex flex-col gap-0.5">
        {Number(price) > 0 && (
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-[12px] font-extrabold text-[#A81D2A] leading-none">${Number(price).toFixed(2)}</span>
            {discountPct > 0 && Number(mrp) > Number(price) && (
              <span className="text-[9.5px] text-[#94A3B8] line-through leading-none">${Number(mrp).toFixed(2)}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

type Slide = { id?: number | string; title?: string; subtitle?: string; image?: string; link?: string }

function Banner({ slide }: { slide: Slide | undefined }) {
  const navigate = useNavigate()
  if (!slide) return null
  const img = getImageUrl(slide.image)
  return (
    <motion.div
      onClick={() => slide.link && navigate(slide.link)}
      role="button"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.985 }}
      className="relative h-[132px] rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(203,32,45,0.28)]"
      style={{ background: 'linear-gradient(120deg,#A81D2A 0%,#CB202D 45%,#CB202D 100%)' }}
    >
      {img ? (
        <img src={img} alt={slide.title || ''} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }} className="absolute inset-0 w-full h-full object-cover opacity-90" />
      ) : null}

      {/* Animated shine sweep */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
          backgroundSize: '250% 100%',
        }}
        animate={{ backgroundPositionX: ['150%', '-50%'] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
      />

      {/* Floating glow orbs */}
      <motion.div
        aria-hidden
        className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/20 blur-2xl"
        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-[#00FF88]/25 blur-2xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />

      {(slide.title || slide.subtitle) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent flex flex-col justify-end p-3.5">
          {slide.title && <h3 className="text-white text-[15px] font-extrabold leading-tight drop-shadow-sm">{slide.title}</h3>}
          {slide.subtitle && <p className="text-white/90 text-[11px] mt-0.5 font-medium">{slide.subtitle}</p>}
        </div>
      )}
    </motion.div>
  )
}

export default function TopSales({ banner, products }: { banner?: Slide; products: any[] }) {
  const navigate = useNavigate()
  if (!products.length) return null

  const [featured, ...rest] = products
  const grid = rest.slice(0, 4)
  const viewAll = '/collection/all?tab=best'

  return (
    <section className="mt-7 mx-3.5 rounded-3xl p-3.5 overflow-hidden shadow-[0_12px_32px_rgba(203,32,45,0.16)] relative"
      style={{ background: 'linear-gradient(160deg,#FEE2E6 0%,#F5F3FF 100%)' }}
    >
      {/* Soft animated background blobs */}
      <motion.div
        aria-hidden
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#C7D2FE]/50 blur-3xl"
        animate={{ scale: [1, 1.15, 1], x: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-12 -left-8 w-36 h-36 rounded-full bg-[#DDD6FE]/50 blur-3xl"
        animate={{ scale: [1, 1.2, 1], y: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.span
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#CB202D] to-[#CB202D] text-white flex items-center justify-center shadow-md"
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Flame size={18} fill="currentColor" />
            </motion.span>
            <h2 className="text-[17px] font-extrabold text-[#A81D2A] tracking-tight">Top Sales</h2>
            <motion.span
              className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
              style={{ background: 'linear-gradient(135deg,#EF4444,#F59E0B)' }}
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles size={10} /> Special Offer
            </motion.span>
          </div>
          <motion.button
            onClick={() => navigate(viewAll)}
            className={`${C.viewAll} relative overflow-hidden`}
            whileTap={{ scale: 0.94 }}
          >
            View All <ChevronRight size={14} />
          </motion.button>
        </div>

        <div className="mb-3">
          <Banner slide={banner} />
        </div>

        {/* Animated deal marquee */}
        <div className="relative mb-3 overflow-hidden rounded-full bg-white/70 border border-[#E0E7FF] py-1.5 px-3">
          <motion.div
            className="flex items-center gap-4 whitespace-nowrap text-[10.5px] font-bold text-[#A81D2A]"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          >
            {[...Array(2)].flatMap((_, dup) => [
              '🔥 Limited Time Deals', '⚡ Up to 50% Off', '🎁 Free Gift on Orders',
              '🚚 Free Express Delivery', '💎 Premium Selection', '⏰ Ends Soon',
            ].map((t, i) => (
              <span key={`${dup}-${i}`} className="flex items-center gap-4">
                {t}<span className="text-[#C7D2FE]">•</span>
              </span>
            )))}
          </motion.div>
        </div>

        <div className="flex gap-2.5">
          {/* Large featured product (left) */}
          <div className="flex-[0_0_50%] min-w-0">
            <TopProduct product={featured} index={0} />
          </div>

          {/* 2x2 grid of smaller products (right) */}
          <div className="flex-1 grid grid-cols-2 gap-2.5 min-w-0">
            {grid.map((p, i) => (
              <TopProduct key={p.id} product={p} index={i + 1} />
            ))}
          </div>
        </div>

        <motion.button
          onClick={() => navigate(viewAll)}
          whileTap={{ scale: 0.97 }}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(203,32,45,0.30)]"
          style={{ background: 'linear-gradient(135deg,#CB202D,#CB202D)' }}
        >
          Explore All Top Deals <ArrowRight size={15} />
        </motion.button>
      </div>
    </section>
  )
}

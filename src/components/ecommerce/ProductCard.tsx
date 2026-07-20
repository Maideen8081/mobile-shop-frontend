import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiHeart, FiEye, FiStar } from 'react-icons/fi'
import type { Product } from '../../data/ecommerceData'

export default function ProductCard({ product, index = 0, layout = 'grid' }: { product: Product & { image?: string }; index?: number; layout?: 'grid' | 'list' | 'compact' }) {
  const [imgError, setImgError] = useState(false)
  const discountColor = product.discount >= 50 ? 'from-rose-500 to-pink-500' : product.discount >= 25 ? 'from-orange-500 to-amber-500' : 'from-emerald-500 to-green-500'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300, damping: 15 } }}
      className={`group relative bg-[#111827]/80 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-[#7c3aed]/10 border border-white/5 hover:border-[#7c3aed]/20 backdrop-blur-sm ${
        layout === 'list' ? 'flex' : ''
      }`}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-br from-[#7c3aed]/0 via-transparent to-[#a78bfa]/0 opacity-0 group-hover:opacity-100 rounded-2xl blur transition-all duration-700 pointer-events-none" />

      <div className={`relative ${layout === 'list' ? 'w-48 shrink-0' : ''} bg-gradient-to-br from-[#7c3aed]/10 to-[#a78bfa]/10 ${layout === 'grid' || layout === 'compact' ? 'h-48' : 'h-full'} flex items-center justify-center overflow-hidden`}>
        {product.image && !imgError && (product.image.startsWith('http') || product.image.startsWith('data:')) ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" onError={() => setImgError(true)} />
        ) : null}
        <motion.span whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }} transition={{ duration: 0.6 }}
          className="text-6xl lg:text-7xl select-none transition-transform duration-700 group-hover:scale-110"
        >{product.emoji}</motion.span>

        {product.badge && (
          <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] text-white shadow-lg shadow-[#7c3aed]/20">
            {product.badge}
          </span>
        )}
        {product.discount > 0 && (
          <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${discountColor} text-white shadow-lg`}>
            -{product.discount}%
          </span>
        )}
        {product.isNew && (
          <span className="absolute bottom-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30">
            New
          </span>
        )}

        <div className="absolute inset-0 bg-[#0f172a]/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm">
          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-[#0f172a]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-[#a78bfa] hover:border-[#7c3aed]/30 transition-all"
          ><FiHeart size={16} /></motion.button>
          <Link to={`/product/${product.id}`}
            className="w-10 h-10 rounded-xl bg-[#0f172a]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-[#06b6d4] hover:border-[#06b6d4]/30 transition-all"
          ><FiEye size={16} /></Link>
        </div>
      </div>

      <div className={`p-4 ${layout === 'list' ? 'flex-1 flex flex-col justify-center' : ''}`}>
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">{product.brand}</p>
        <Link to={`/product/${product.id}`}>
          <h4 className={`font-bold text-white leading-tight mb-2 hover:text-[#a78bfa] transition-colors ${layout === 'compact' ? 'text-sm' : 'text-sm lg:text-base'}`}>
            {product.name}
          </h4>
        </Link>

        {layout !== 'compact' && (
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, j) => (
                <FiStar key={j} size={11} className={j < Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-white/20'} />
              ))}
            </div>
            <span className="text-[10px] text-white/30">({product.reviews.toLocaleString()})</span>
          </div>
        )}

        <div className="flex items-baseline gap-2 mb-1">
          <span className={`font-bold text-white ${layout === 'compact' ? 'text-sm' : 'text-lg'}`}>
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.oldPrice > 0 && (
            <span className="text-xs text-white/30 line-through">₹{product.oldPrice.toLocaleString('en-IN')}</span>
          )}
        </div>

        {layout !== 'compact' && (product.emi || product.exchange) && (
          <div className="flex items-center gap-2 mt-1.5 mb-3 flex-wrap">
            {product.emi && <span className="text-[10px] text-[#a78bfa] bg-[#7c3aed]/10 px-2 py-0.5 rounded-full">{product.emi}</span>}
            {product.exchange && <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{product.exchange}</span>}
          </div>
        )}

        <Link to={`/product/${product.id}`}
          className={`w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] text-white font-semibold hover:shadow-lg hover:shadow-[#7c3aed]/20 transition-all ${
            layout === 'compact' ? 'py-2 text-xs' : 'py-2.5 text-sm'
          }`}
        >
          <FiEye size={14} /> View Product
        </Link>
      </div>
    </motion.div>
  )
}

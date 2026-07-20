import { motion } from 'framer-motion'
import { FiPackage, FiPlus } from 'react-icons/fi'

interface EmptyStateProps {
  onAction?: () => void
}

export default function EmptyState({ onAction }: EmptyStateProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6"
      >
        <FiPackage size={40} className="text-primary" />
      </motion.div>
      <h3 className="text-lg font-bold text-text-primary tracking-tight">No Products Added Yet</h3>
      <p className="text-sm text-text-muted mt-1 text-center max-w-sm">Start adding products to build your mobile shop inventory.</p>
      {onAction && (
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onAction}
          className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold cursor-pointer"
        ><FiPlus size={16} /> Create First Product</motion.button>
      )}
    </motion.div>
  )
}

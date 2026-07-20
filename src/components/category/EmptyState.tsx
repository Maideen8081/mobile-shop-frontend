import { motion } from 'framer-motion'
import { FiPackage, FiPlus } from 'react-icons/fi'

interface EmptyStateProps {
  onAction?: () => void
}

export default function EmptyState({ onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mb-4">
        <FiPackage size={28} className="text-text-muted" />
      </div>
      <h3 className="text-base font-semibold text-text-secondary">No Categories Created Yet</h3>
      <p className="text-sm text-text-muted mt-1 text-center max-w-sm">
        Get started by creating your first product category to organize your mobile shop inventory.
      </p>
      {onAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="mt-5 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium transition-all cursor-pointer"
        >
          <FiPlus size={15} />
          Create First Category
        </motion.button>
      )}
    </motion.div>
  )
}

import { motion } from 'framer-motion'

interface StatusBadgeProps {
  status: 'active' | 'inactive'
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const isActive = status === 'active'

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
        isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-500'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </motion.span>
  )
}

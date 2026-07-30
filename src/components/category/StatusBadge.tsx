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
        isActive ? 'bg-primary/10 text-primary' : 'bg-white text-text-secondary border border-border'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-text-muted'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </motion.span>
  )
}

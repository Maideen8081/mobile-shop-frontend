import { motion, AnimatePresence } from 'framer-motion'
import { FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  visible: boolean
  onClose: () => void
}

export default function Toast({ message, type, visible, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-xl backdrop-blur-sm"
          style={{
            backgroundColor: type === 'success' ? 'rgba(6, 95, 70, 0.95)' : 'rgba(127, 29, 29, 0.95)',
            borderColor: type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
          }}
        >
          {type === 'success' ? (
            <FiCheckCircle size={18} className="text-primary shrink-0" />
          ) : (
            <FiAlertCircle size={18} className="text-red-400 shrink-0" />
          )}
          <span className="text-sm text-white font-medium">{message}</span>
          <button
            onClick={onClose}
            className="ml-1 p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <FiX size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

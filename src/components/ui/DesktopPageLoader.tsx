import { motion } from 'framer-motion'

interface DesktopPageLoaderProps {
  text?: string
  fullScreen?: boolean
  className?: string
}

export default function DesktopPageLoader({ text = 'Loading...', fullScreen = true, className = '' }: DesktopPageLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'min-h-[60vh]' : 'py-20'} ${className}`}>
      {/* Premium dual-ring spinner */}
      <div className="relative w-16 h-16 mb-5">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: '3px solid transparent',
            borderTopColor: '#D91E36',
            borderRightColor: '#D91E3640',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        {/* Inner ring */}
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{
            border: '2px solid transparent',
            borderBottomColor: '#D91E3680',
            borderLeftColor: '#D91E3630',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
        {/* Center dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#D91E36' }} />
        </motion.div>
      </div>
      {/* Text */}
      <motion.p
        className="text-sm font-semibold text-gray-400 tracking-wide"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
        {text}
      </motion.p>
    </div>
  )
}

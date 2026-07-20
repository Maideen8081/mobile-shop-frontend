import { useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'

interface BackBarProps {
  label?: string
  to?: string
}

export default function BackBar({ label = 'Back', to }: BackBarProps) {
  const navigate = useNavigate()

  return (
    <div className="w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-[8px]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <button
          onClick={() => (to ? navigate(to) : navigate(-1))}
          className="flex items-center gap-1.5 h-10 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <FiArrowLeft size={14} />
          {label}
        </button>
      </div>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'

interface BackBarProps {
  label?: string
  to?: string
}

export default function BackBar({ label = 'Back', to }: BackBarProps) {
  const navigate = useNavigate()

  return (
    <div className="w-full sticky top-0 z-40" style={{ background: 'rgba(251,248,246,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(163,18,42,0.08)' }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <button
          onClick={() => (to ? navigate(to) : navigate(-1))}
          className="flex items-center gap-2 cursor-pointer group transition-all"
          style={{ height: 44 }}
        >
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110"
            style={{ background: 'rgba(163,18,42,0.08)', color: '#A3122A' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 'var(--text-body)' }}>arrow_back</span>
          </span>
          <span
            className="text-xs font-semibold transition-colors duration-200 group-hover:text-[#A3122A]"
            style={{ color: 'rgba(59,75,61,0.7)', letterSpacing: '0.02em' }}
          >
            {label}
          </span>
        </button>
      </div>
    </div>
  )
}

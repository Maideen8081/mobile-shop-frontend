interface DoubleRingLoaderProps {
  size?: number
  color?: string
  className?: string
  label?: string
}

export default function DoubleRingLoader({ size = 48, color = '#CB202D', className = '', label }: DoubleRingLoaderProps) {
  const stroke = Math.max(3, size * 0.07)
  const r1 = (size - stroke) / 2
  const r2 = r1 * 0.55
  const c = size / 2
  const circ1 = 2 * Math.PI * r1
  const circ2 = 2 * Math.PI * r2

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer ring */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0"
          style={{ animation: 'zSpin 1.2s linear infinite' }}
        >
          <circle
            cx={c} cy={c} r={r1}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${circ1 * 0.75} ${circ1 * 0.25}`}
            strokeLinecap="round"
          />
        </svg>

        {/* Inner ring */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0"
          style={{ animation: 'zSpin 0.9s linear infinite reverse' }}
        >
          <circle
            cx={c} cy={c} r={r2}
            fill="none"
            stroke={color}
            strokeWidth={stroke * 0.8}
            strokeDasharray={`${circ2 * 0.6} ${circ2 * 0.4}`}
            strokeLinecap="round"
            opacity={0.45}
          />
        </svg>
      </div>

      {label && (
        <p className="mt-3 text-[13px] font-semibold text-[#6B7280]">{label}</p>
      )}

      <style>{`
        @keyframes zSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

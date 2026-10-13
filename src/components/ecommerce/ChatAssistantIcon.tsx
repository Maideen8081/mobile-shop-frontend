type ChatAssistantIconProps = {
  className?: string
  size?: number
}

export default function ChatAssistantIcon({ className, size = 52 }: ChatAssistantIconProps) {
  const id = 'cai'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Head gradient – warm white top, cool steel bottom */}
        <linearGradient id={`${id}-head`} x1="20" y1="8" x2="60" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f0f9ff" />
          <stop offset="55%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#bfdbfe" />
        </linearGradient>
        {/* Head shadow underside */}
        <linearGradient id={`${id}-headSh`} x1="20" y1="42" x2="60" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.5" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        {/* Visor dark */}
        <linearGradient id={`${id}-visor`} x1="18" y1="18" x2="62" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0c1445" />
          <stop offset="100%" stopColor="#060a28" />
        </linearGradient>
        {/* Eye glow */}
        <radialGradient id={`${id}-eyeL`} cx="50%" cy="42%" r="50%">
          <stop offset="0%" stopColor="#7df9ff" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-eyeR`} cx="50%" cy="42%" r="50%">
          <stop offset="0%" stopColor="#7df9ff" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        {/* Body gradient */}
        <linearGradient id={`${id}-body`} x1="18" y1="50" x2="62" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#bfdbfe" />
        </linearGradient>
        {/* Arm gradient */}
        <linearGradient id={`${id}-arm`} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
        {/* Chest panel */}
        <linearGradient id={`${id}-chest`} x1="25" y1="55" x2="55" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f2044" />
          <stop offset="100%" stopColor="#050e22" />
        </linearGradient>
        {/* Gloss highlight */}
        <radialGradient id={`${id}-gloss`} cx="35%" cy="25%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Eye ambient bloom */}
        <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`${id}-softglow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── Antenna ── */}
      <rect x="38.5" y="2" width="3" height="8" rx="1.5" fill="#93c5fd" />
      {/* Antenna orb */}
      <circle cx="40" cy="2" r="3.5" fill="#38bdf8" filter={`url(#${id}-softglow)`} />
      <circle cx="40" cy="2" r="2" fill="#bae6fd" />
      <circle cx="39.2" cy="1.3" r="0.7" fill="white" opacity="0.9" />

      {/* ── Head ── */}
      <rect x="17" y="10" width="46" height="34" rx="10" fill={`url(#${id}-head)`} />
      {/* Head underside shading */}
      <rect x="17" y="10" width="46" height="34" rx="10" fill={`url(#${id}-headSh)`} />
      {/* Head side bolts */}
      <circle cx="17" cy="24" r="3" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1" />
      <circle cx="17" cy="24" r="1.2" fill="#60a5fa" />
      <circle cx="63" cy="24" r="3" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1" />
      <circle cx="63" cy="24" r="1.2" fill="#60a5fa" />

      {/* ── Visor / face panel ── */}
      <rect x="22" y="17" width="36" height="18" rx="6" fill={`url(#${id}-visor)`} />
      {/* Visor inner bevel */}
      <rect x="23" y="18" width="34" height="16" rx="5" fill="none" stroke="rgba(100,180,255,0.15)" strokeWidth="1" />

      {/* ── Left eye ── */}
      <ellipse cx="31.5" cy="26" rx="6" ry="5" fill={`url(#${id}-eyeL)`} filter={`url(#${id}-glow)`} />
      {/* Eye inner bright core */}
      <ellipse cx="31.5" cy="26" rx="3.5" ry="2.8" fill="#7df9ff" opacity="0.9" />
      <ellipse cx="30.4" cy="24.8" rx="1.4" ry="1" fill="white" opacity="0.85" />
      {/* Eye scan line */}
      <rect x="25.5" y="25.3" width="12" height="1.2" rx="0.6" fill="#bae6fd" opacity="0.35" />

      {/* ── Right eye ── */}
      <ellipse cx="48.5" cy="26" rx="6" ry="5" fill={`url(#${id}-eyeR)`} filter={`url(#${id}-glow)`} />
      <ellipse cx="48.5" cy="26" rx="3.5" ry="2.8" fill="#7df9ff" opacity="0.9" />
      <ellipse cx="47.4" cy="24.8" rx="1.4" ry="1" fill="white" opacity="0.85" />
      <rect x="42.5" y="25.3" width="12" height="1.2" rx="0.6" fill="#bae6fd" opacity="0.35" />

      {/* ── Mouth ── */}
      {/* Mouth tray */}
      <rect x="27" y="37" width="26" height="5" rx="2.5" fill="#0c1445" opacity="0.7" />
      {/* Smile pixels */}
      <rect x="29" y="38.5" width="3.5" height="2" rx="1" fill="#38bdf8" opacity="0.9" />
      <rect x="34" y="38.5" width="3.5" height="2" rx="1" fill="#34d399" opacity="0.9" />
      <rect x="39" y="38.5" width="3.5" height="2" rx="1" fill="#34d399" opacity="0.9" />
      <rect x="44" y="38.5" width="3.5" height="2" rx="1" fill="#38bdf8" opacity="0.9" />

      {/* ── Neck ── */}
      <rect x="34" y="44" width="12" height="6" rx="3" fill="#bfdbfe" />
      <rect x="36" y="45.5" width="3" height="3" rx="1" fill="#93c5fd" opacity="0.6" />
      <rect x="41" y="45.5" width="3" height="3" rx="1" fill="#93c5fd" opacity="0.6" />

      {/* ── Left arm ── */}
      <rect x="9" y="52" width="10" height="20" rx="5" fill="#dbeafe" />
      <rect x="9" y="52" width="10" height="20" rx="5" fill="none" stroke="#93c5fd" strokeWidth="0.8" />
      {/* Hand */}
      <ellipse cx="14" cy="73.5" rx="5.5" ry="3.5" fill="#bfdbfe" />
      <circle cx="11" cy="73" r="1.5" fill="#93c5fd" />
      <circle cx="14" cy="74" r="1.5" fill="#93c5fd" />
      <circle cx="17" cy="73" r="1.5" fill="#93c5fd" />

      {/* ── Right arm ── */}
      <rect x="61" y="52" width="10" height="20" rx="5" fill="#dbeafe" />
      <rect x="61" y="52" width="10" height="20" rx="5" fill="none" stroke="#93c5fd" strokeWidth="0.8" />
      <ellipse cx="66" cy="73.5" rx="5.5" ry="3.5" fill="#bfdbfe" />
      <circle cx="63" cy="73" r="1.5" fill="#93c5fd" />
      <circle cx="66" cy="74" r="1.5" fill="#93c5fd" />
      <circle cx="69" cy="73" r="1.5" fill="#93c5fd" />

      {/* ── Body ── */}
      <rect x="19" y="50" width="42" height="26" rx="10" fill={`url(#${id}-body)`} />
      <rect x="19" y="50" width="42" height="26" rx="10" fill="none" stroke="#93c5fd" strokeWidth="0.8" />

      {/* ── Chest panel ── */}
      <rect x="25" y="55" width="30" height="16" rx="5" fill={`url(#${id}-chest)`} />
      <rect x="26" y="56" width="28" height="14" rx="4" fill="none" stroke="rgba(56,189,248,0.25)" strokeWidth="0.8" />

      {/* Status LEDs */}
      <circle cx="32" cy="60" r="2.8" fill="#38bdf8" filter={`url(#${id}-glow)`} />
      <circle cx="32" cy="60" r="1.5" fill="#7df9ff" />
      <circle cx="40" cy="60" r="2.8" fill="#34d399" filter={`url(#${id}-glow)`} />
      <circle cx="40" cy="60" r="1.5" fill="#6ee7b7" />
      <circle cx="48" cy="60" r="2.8" fill="#f87171" filter={`url(#${id}-glow)`} />
      <circle cx="48" cy="60" r="1.5" fill="#fca5a5" />

      {/* Mini screen / wave inside chest */}
      <rect x="28" y="64" width="24" height="4" rx="2" fill="#0f2044" opacity="0.6" />
      <polyline points="29,66 32,64.5 35,67 38,64.5 41,67 44,64.5 47,66 50,65" stroke="#38bdf8" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />

      {/* ── Body gloss highlight ── */}
      <ellipse cx="32" cy="54" rx="10" ry="4" fill="white" opacity="0.18" />

      {/* ── Head glass gloss ── */}
      <rect x="17" y="10" width="46" height="34" rx="10" fill={`url(#${id}-gloss)`} />
    </svg>
  )
}

import { useId } from 'react'

type ChatAssistantIconProps = {
  className?: string
  size?: number
  /** Blink + sparkle twinkle. Off for tiny inline uses. */
  animated?: boolean
}

/**
 * "Fixie" — the PhoneFix AI assistant mascot.
 * A speech-bubble shaped bot with a glowing visor face and a sparkle antenna,
 * drawn in the store palette (deep purple · lavender · sunshine yellow).
 */
export default function ChatAssistantIcon({ className, size = 52, animated = size >= 28 }: ChatAssistantIconProps) {
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `fx-${uid}-${name}`

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
        <linearGradient id={id('shell')} x1="14" y1="16" x2="66" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f3eaff" />
          <stop offset="45%" stopColor="#d0adff" />
          <stop offset="100%" stopColor="#8a4fe0" />
        </linearGradient>
        <linearGradient id={id('visor')} x1="22" y1="26" x2="58" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2e1250" />
          <stop offset="100%" stopColor="#14061f" />
        </linearGradient>
        <radialGradient id={id('eye')} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fff8c4" />
          <stop offset="55%" stopColor="#ffd014" />
          <stop offset="100%" stopColor="#ffb800" />
        </radialGradient>
        <radialGradient id={id('glow')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd014" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffd014" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('gloss')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Antenna + AI sparkle */}
      <path d="M40 18.5V11" stroke="#8a4fe0" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="40" cy="8" r="7" fill={`url(#${id('glow')})`} />
      <path d="M40 2.5l1.6 4 4 1.5-4 1.5-1.6 4-1.6-4-4-1.5 4-1.5 1.6-4Z" fill="#ffd014">
        {animated && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 40 8;90 40 8;90 40 8"
            keyTimes="0;0.25;1"
            dur="3.2s"
            repeatCount="indefinite"
          />
        )}
      </path>

      {/* Speech-bubble head with tail */}
      <path
        d="M24 18h32c7.7 0 14 6.3 14 14v14c0 7.7-6.3 14-14 14H35l-11.5 9.2c-1.3 1-3.2.1-3.2-1.6V59.4C14.2 57.8 10 52.4 10 46V32c0-7.7 6.3-14 14-14Z"
        fill={`url(#${id('shell')})`}
      />
      <path
        d="M24 18h32c7.7 0 14 6.3 14 14v14c0 7.7-6.3 14-14 14H35l-11.5 9.2c-1.3 1-3.2.1-3.2-1.6V59.4C14.2 57.8 10 52.4 10 46V32c0-7.7 6.3-14 14-14Z"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />
      {/* Top gloss */}
      <path d="M22 21.5h36c4 0 7.4 2.4 8.8 5.8H13.2c1.4-3.4 4.8-5.8 8.8-5.8Z" fill={`url(#${id('gloss')})`} opacity="0.7" />

      {/* Ear pods */}
      <rect x="5" y="32" width="6" height="12" rx="3" fill="#ffd014" />
      <rect x="69" y="32" width="6" height="12" rx="3" fill="#ffd014" />

      {/* Visor face */}
      <rect x="18" y="26" width="44" height="26" rx="12" fill={`url(#${id('visor')})`} />
      <rect x="18.6" y="26.6" width="42.8" height="24.8" rx="11.4" stroke="#d0adff" strokeOpacity="0.35" strokeWidth="1.2" />

      {/* Eyes (blink) */}
      <g>
        <ellipse cx="31" cy="37.5" rx="3.6" ry="4.4" fill={`url(#${id('eye')})`}>
          {animated && (
            <animate attributeName="ry" values="4.4;4.4;0.6;4.4;4.4" keyTimes="0;0.9;0.93;0.96;1" dur="4.5s" repeatCount="indefinite" />
          )}
        </ellipse>
        <ellipse cx="49" cy="37.5" rx="3.6" ry="4.4" fill={`url(#${id('eye')})`}>
          {animated && (
            <animate attributeName="ry" values="4.4;4.4;0.6;4.4;4.4" keyTimes="0;0.9;0.93;0.96;1" dur="4.5s" repeatCount="indefinite" />
          )}
        </ellipse>
        <circle cx="32.2" cy="36" r="1.1" fill="#fff" />
        <circle cx="50.2" cy="36" r="1.1" fill="#fff" />
      </g>

      {/* Smile */}
      <path d="M35 45c2.8 2.4 7.2 2.4 10 0" stroke="#ffd014" strokeWidth="2.2" strokeLinecap="round" />
      {/* Cheeks */}
      <circle cx="24.5" cy="44.5" r="2.2" fill="#ff8ab3" opacity="0.55" />
      <circle cx="55.5" cy="44.5" r="2.2" fill="#ff8ab3" opacity="0.55" />

      {/* Side sparkle */}
      <path d="M66 12l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1 1-2.6Z" fill="#ffffff">
        {animated && <animate attributeName="opacity" values="0.2;1;0.2" dur="2.4s" repeatCount="indefinite" />}
      </path>
    </svg>
  )
}

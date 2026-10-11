import { useRef, useState } from 'react'

interface YouTubeLiteProps {
  /** YouTube video id, e.g. "GVpAOzDBxkk". */
  videoId: string
  title: string
  subtitle?: string
  className?: string
}

/**
 * Lightweight YouTube facade: shows the video's thumbnail until the user
 * hovers (plays muted, so autoplay is allowed) or clicks (plays with sound),
 * then swaps in the real player inside the same box.
 */
export default function YouTubeLite({ videoId, title, subtitle, className = '' }: YouTubeLiteProps) {
  const [active, setActive] = useState(false)
  const [sound, setSound] = useState(false)
  const hoverTimer = useRef<number | undefined>(undefined)

  const start = (withSound: boolean) => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
    setSound(withSound)
    setActive(true)
  }

  const onEnter = () => {
    if (active) return
    hoverTimer.current = window.setTimeout(() => start(false), 400)
  }

  const onLeave = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
  }

  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1${
    sound ? '' : '&mute=1'
  }`

  return (
    <div
      className={`relative group rounded-2xl overflow-hidden shadow-xl aspect-video bg-black ${className}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {active ? (
        <iframe
          key={sound ? 'sound' : 'muted'}
          className="absolute inset-0 w-full h-full"
          src={src}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => start(true)}
          aria-label={`Play video: ${title}`}
          className="absolute inset-0 w-full h-full cursor-pointer"
        >
          <img
            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
            onError={(e) => {
              e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            }}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-left">
            <span className="text-white text-lg md:text-xl font-bold">{title}</span>
            {subtitle && <p className="text-white/80 text-sm mt-1">{subtitle}</p>}
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 rounded-full bg-pf-red/90 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 animate-glow-pulse">
            <span className="material-symbols-outlined text-white text-3xl">play_arrow</span>
          </div>
          <div className="absolute top-4 right-4 w-12 h-12 rounded-[8px] bg-pf-red/20 backdrop-blur-sm border border-pf-red/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="material-symbols-outlined text-pf-red">play_arrow</span>
          </div>
        </button>
      )}
    </div>
  )
}

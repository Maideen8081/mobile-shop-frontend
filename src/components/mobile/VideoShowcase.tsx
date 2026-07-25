import { Play } from 'lucide-react'
import { C } from './theme'

const clips = [
  { title: 'Precision Micro-Soldering', desc: 'Board-level repair with microscopic accuracy', poster: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=900&q=80', video: 'https://cdn.coverr.co/videos/coverr-close-up-of-a-smartphone-display-5682/1080p.mp4' },
  { title: 'Diagnostic Calibration', desc: 'Advanced testing for peak performance', poster: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&q=80', video: 'https://cdn.coverr.co/videos/coverr-phone-in-hands-5600/1080p.mp4' },
]

export default function VideoShowcase() {
  return (
    <section className="mt-7">
      <div className="px-3.5 mb-3">
        <h2 className={C.sectionTitle}>See the Precision in Action</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto px-3.5 pb-1 scrollbar-hide">
        {clips.map((c) => (
          <div key={c.title} className="w-[280px] flex-shrink-0 rounded-2xl overflow-hidden bg-black relative aspect-video shadow-[0_6px_18px_rgba(15,23,42,0.18)]">
            <video className="w-full h-full object-cover" autoPlay muted loop playsInline poster={c.poster}>
              <source src={c.video} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <span className="text-white text-[13px] font-bold block">{c.title}</span>
              <span className="text-white/60 text-[11px]">{c.desc}</span>
            </div>
            <div className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-[#CB202D]/25 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Play size={16} className="text-white" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

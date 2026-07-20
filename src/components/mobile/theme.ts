// Cohesive design tokens for the mobile shop experience.
// A single source of truth so every mobile screen feels like one polished app.
// Palette: fresh teal/emerald brand, warm amber accent, soft neutral surfaces.

export const BRAND = {
  primary: '#4F46E5', // indigo-600
  primaryDark: '#4338CA', // indigo-700
  primaryLight: '#818CF8', // indigo-400
  primarySoft: '#EEF2FF', // soft indigo surface
  primarySoftBorder: '#E0E7FF',
  accent: '#0EA5E9', // sky-500
  accentDark: '#0284C7',
  success: '#059669', // emerald-600
  danger: '#EF4444', // red
  star: '#F59E0B', // amber
  info: '#0EA5E9', // sky
  // Multi-color accents for varied UI elements (still professional).
  colorful: {
    indigo: '#4F46E5',
    sky: '#0EA5E9',
    emerald: '#059669',
    amber: '#F59E0B',
    rose: '#E11D48',
    violet: '#7C3AED',
  },
  ink: '#0F172A',
  muted: '#64748B',
  line: '#E5E7EB', // slate-200 hairline
  surface: '#FFFFFF',
  canvas: '#F8F9FB', // neutral slate page background
  white: '#FFFFFF',
}

// Reusable class fragments (kept as strings so every component stays in sync).
export const C = {
  pageBg: 'bg-[#F8F9FB]',
  card: 'bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_16px_rgba(15,23,42,0.05)]',
  cardPress: 'active:scale-[0.98] transition',
  sectionTitle: 'text-[17px] font-extrabold text-[#0F172A] tracking-tight',
  viewAll: 'text-[12px] font-bold text-[#4F46E5] flex items-center gap-0.5 active:opacity-70',
  chip: 'text-[10px] font-bold px-2 py-0.5 rounded-full',
  primaryBtn:
    'bg-[#4F46E5] text-white font-bold active:scale-95 transition shadow-[0_6px_16px_rgba(79,70,229,0.28)]',
  iconWrap: 'rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center',
  pill: 'rounded-full',
  // Professional indigo gradient for header / hero / banners.
  grad: 'linear-gradient(135deg,#4338CA 0%,#4F46E5 55%,#6366F1 100%)',
  gradSoft: 'linear-gradient(135deg,#EEF2FF 0%,#E0E7FF 100%)',
}

export const scrollHide = 'scrollbar-hide'

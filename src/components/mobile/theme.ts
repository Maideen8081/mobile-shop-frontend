// Cohesive design tokens for the mobile shop experience.
// Home palette: warm cream canvas, deep purple ink, soft lavender accents.

export const BRAND = {
  primary: '#210D35', // zomato red
  primaryDark: '#3A1E52', // deeper red
  primaryLight: '#2E1544', // lighter red
  primarySoft: '#F3E8FF', // soft red surface
  primarySoftBorder: '#FDD',
  accent: '#7B3FD0', // coral accent
  accentDark: '#210D35',
  success: '#059669', // emerald-600
  danger: '#EF4444', // red
  star: '#F59E0B', // amber
  info: '#0EA5E9', // sky
  colorful: {
    red: '#210D35',
    sky: '#0EA5E9',
    emerald: '#059669',
    amber: '#F59E0B',
    rose: '#E11D48',
    coral: '#7B3FD0',
  },
  ink: '#0F172A',
  muted: '#64748B',
  line: '#E5E7EB',
  surface: '#FFFFFF',
  canvas: '#FFFBFB',
  white: '#FFFFFF',
}

export const C = {
  pageBg: 'bg-[#FFF7F3]',
  card: 'bg-white rounded-2xl border border-[#ECDFF6] shadow-[0_4px_16px_rgba(33,13,53,0.06)]',
  cardPress: 'active:scale-[0.98] transition',
  sectionTitle: 'text-[17px] font-extrabold text-[#210D35] tracking-tight',
  viewAll: 'text-[12px] font-bold text-[#210D35] flex items-center gap-0.5 active:opacity-70',
  chip: 'text-[10px] font-bold px-2 py-0.5 rounded-[8px]',
  primaryBtn:
    'bg-[#210D35] text-white font-bold active:scale-95 transition shadow-[0_6px_16px_rgba(33,13,53,0.28)]',
  iconWrap: 'rounded-xl bg-[#F3E8FF] text-[#210D35] flex items-center justify-center',
  pill: 'rounded-[8px]',
  grad: 'linear-gradient(135deg,#210D35 0%,#2E1544 55%,#5B3A7E 100%)',
  gradSoft: 'linear-gradient(135deg,#F3E8FF 0%,#EADFF5 100%)',
}

export const scrollHide = 'scrollbar-hide'

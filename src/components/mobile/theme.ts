// Cohesive design tokens for the mobile shop experience.
// Home palette: warm cream canvas, deep green ink, soft sage accents.

export const BRAND = {
  primary: '#0f3b2c', // zomato red
  primaryDark: '#18503c', // deeper red
  primaryLight: '#18503c', // lighter red
  primarySoft: '#dfe6cf', // soft red surface
  primarySoftBorder: '#FDD',
  accent: '#0f3b2c', // coral accent
  accentDark: '#0f3b2c',
  success: '#059669', // emerald-600
  danger: '#EF4444', // red
  star: '#F59E0B', // amber
  info: '#0EA5E9', // sky
  colorful: {
    red: '#0f3b2c',
    sky: '#0EA5E9',
    emerald: '#059669',
    amber: '#F59E0B',
    rose: '#0f3b2c',
    coral: '#0f3b2c',
  },
  ink: '#1d2522',
  muted: '#5d6762',
  line: '#ece9e2',
  surface: '#FFFFFF',
  canvas: '#f7f6f2',
  white: '#FFFFFF',
}

export const C = {
  pageBg: 'bg-[#f7f6f2]',
  card: 'bg-white rounded-2xl border border-[#f7f6f2] shadow-[0_4px_16px_rgba(15,59,44,0.06)]',
  cardPress: 'active:scale-[0.98] transition',
  sectionTitle: 'text-[17px] font-extrabold text-[#0f3b2c] tracking-tight',
  viewAll: 'text-[12px] font-bold text-[#0f3b2c] flex items-center gap-0.5 active:opacity-70',
  chip: 'text-[10px] font-bold px-2 py-0.5 rounded-[8px]',
  primaryBtn:
    'bg-[#0f3b2c] text-white font-bold active:scale-95 transition shadow-[0_6px_16px_rgba(15,59,44,0.28)]',
  iconWrap: 'rounded-xl bg-[#dfe6cf] text-[#0f3b2c] flex items-center justify-center',
  pill: 'rounded-[8px]',
  grad: 'linear-gradient(135deg,#0f3b2c 0%,#18503c 55%,#18503c 100%)',
  gradSoft: 'linear-gradient(135deg,#dfe6cf 0%,#f7f6f2 100%)',
}

export const scrollHide = 'scrollbar-hide'

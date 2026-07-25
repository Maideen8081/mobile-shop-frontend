// Cohesive design tokens for the mobile shop experience.
// Palette: Zomato-style bold red & white brand.

export const BRAND = {
  primary: '#CB202D', // zomato red
  primaryDark: '#A81D2A', // deeper red
  primaryLight: '#E53E4E', // lighter red
  primarySoft: '#FEE2E6', // soft red surface
  primarySoftBorder: '#FDD',
  accent: '#FF5A65', // coral accent
  accentDark: '#CB202D',
  success: '#059669', // emerald-600
  danger: '#EF4444', // red
  star: '#F59E0B', // amber
  info: '#0EA5E9', // sky
  colorful: {
    red: '#CB202D',
    sky: '#0EA5E9',
    emerald: '#059669',
    amber: '#F59E0B',
    rose: '#E11D48',
    coral: '#FF5A65',
  },
  ink: '#0F172A',
  muted: '#64748B',
  line: '#E5E7EB',
  surface: '#FFFFFF',
  canvas: '#FFFBFB',
  white: '#FFFFFF',
}

export const C = {
  pageBg: 'bg-[#FFFBFB]',
  card: 'bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_16px_rgba(15,23,42,0.05)]',
  cardPress: 'active:scale-[0.98] transition',
  sectionTitle: 'text-[17px] font-extrabold text-[#0F172A] tracking-tight',
  viewAll: 'text-[12px] font-bold text-[#CB202D] flex items-center gap-0.5 active:opacity-70',
  chip: 'text-[10px] font-bold px-2 py-0.5 rounded-full',
  primaryBtn:
    'bg-[#CB202D] text-white font-bold active:scale-95 transition shadow-[0_6px_16px_rgba(203,32,45,0.28)]',
  iconWrap: 'rounded-xl bg-[#FEE2E6] text-[#CB202D] flex items-center justify-center',
  pill: 'rounded-full',
  grad: 'linear-gradient(135deg,#A81D2A 0%,#CB202D 55%,#FF5A65 100%)',
  gradSoft: 'linear-gradient(135deg,#FEE2E6 0%,#FDD 100%)',
}

export const scrollHide = 'scrollbar-hide'

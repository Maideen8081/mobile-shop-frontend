/**
 * Trade-in pricing, shared by the desktop and mobile trade-in pages.
 *
 * Each model has a "Like New" value at its base storage. Condition scales it
 * and extra storage adds a bonus. The advertised ranges on the page are worked
 * out from the same numbers, so a quote can never contradict them.
 */

export const TRADE_IN_BRANDS = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo'] as const

export const CONDITIONS = [
  { value: 'Mint - Like New', title: 'Like New', desc: 'No scratches, works perfectly', factor: 1.0 },
  { value: 'Good - Minor Scratches', title: 'Good', desc: 'Light scratches, fully working', factor: 0.8 },
  { value: 'Fair - Visible Wear', title: 'Fair', desc: 'Visible dents or wear', factor: 0.6 },
  { value: 'Broken - Damaged Screen/Body', title: 'Broken', desc: 'Cracked screen or body', factor: 0.3 },
] as const

export const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB']
const STORAGE_STEP = 0.06 // each step above the model's base storage adds 6%

export interface TradeInModel {
  brand: string
  model: string
  /** Value in Like New condition at baseStorage. */
  topValue: number
  baseStorage: string
}

const m = (brand: string, model: string, topValue: number, baseStorage = '128GB'): TradeInModel => ({ brand, model, topValue, baseStorage })

export const TRADE_IN_MODELS: TradeInModel[] = [
  m('Apple', 'iPhone 16 Pro Max', 45000, '256GB'),
  m('Apple', 'iPhone 16 Pro', 40000),
  m('Apple', 'iPhone 16', 32000),
  m('Apple', 'iPhone 15 Pro Max', 38000, '256GB'),
  m('Apple', 'iPhone 15 Pro', 33000),
  m('Apple', 'iPhone 15', 26000),
  m('Apple', 'iPhone 14 Pro Max', 30000),
  m('Apple', 'iPhone 14', 20000),
  m('Apple', 'iPhone 13', 16000),
  m('Apple', 'iPhone 12', 11000, '64GB'),
  m('Apple', 'iPhone 11', 8000, '64GB'),
  m('Apple', 'iPhone SE (2022)', 7000, '64GB'),
  m('Apple', 'iPhone XR', 5000, '64GB'),
  m('Apple', 'iPhone 8', 2500, '64GB'),
  m('Samsung', 'Galaxy S25 Ultra', 42000, '256GB'),
  m('Samsung', 'Galaxy S24 Ultra', 33000, '256GB'),
  m('Samsung', 'Galaxy S24', 22000),
  m('Samsung', 'Galaxy S23', 16000),
  m('Samsung', 'Galaxy Z Fold 6', 45000, '256GB'),
  m('Samsung', 'Galaxy Z Flip 6', 28000, '256GB'),
  m('Samsung', 'Galaxy A55', 10000),
  m('Samsung', 'Galaxy A35', 7500),
  m('Google', 'Pixel 10 Pro', 30000),
  m('Google', 'Pixel 9 Pro', 26000),
  m('Google', 'Pixel 9', 20000),
  m('Google', 'Pixel 8', 13000),
  m('Google', 'Pixel 7a', 8000),
  m('OnePlus', 'OnePlus 13', 26000, '256GB'),
  m('OnePlus', 'OnePlus 12', 20000, '256GB'),
  m('OnePlus', 'OnePlus Nord 4', 9000),
  m('Xiaomi', 'Xiaomi 15 Ultra', 24000, '256GB'),
  m('Xiaomi', 'Xiaomi 14', 15000, '256GB'),
  m('Xiaomi', 'Redmi Note 13 Pro', 6500),
  m('Oppo', 'Find X8 Pro', 22000, '256GB'),
  m('Oppo', 'Reno 12 Pro', 9000, '256GB'),
]

export const OTHER_MODEL = 'Other model'

/** Conservative Like New value for a model not in the list (confirmed on inspection). */
const OTHER_MODEL_VALUE: Record<string, number> = {
  Apple: 6000, Samsung: 5000, Google: 5000, OnePlus: 4000, Xiaomi: 3000, Oppo: 3000,
}

export function modelsFor(brand: string): TradeInModel[] {
  return TRADE_IN_MODELS.filter((x) => x.brand === brand)
}

function storageFactor(model: TradeInModel, storage: string): number {
  const base = STORAGE_OPTIONS.indexOf(model.baseStorage)
  const chosen = STORAGE_OPTIONS.indexOf(storage)
  if (base < 0 || chosen < 0 || chosen <= base) return 0
  return (chosen - base) * STORAGE_STEP
}

const round500 = (n: number) => Math.round(n / 500) * 500
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export interface TradeInQuote {
  finalValue: number
  breakdown: { label: string; amount: number }[]
  /** True when the model isn't in our table: value is a floor, confirmed on inspection. */
  approximate: boolean
}

export function quoteTradeIn(brand: string, model: string, condition: string, storage: string): TradeInQuote | null {
  if (!brand || !model || !condition) return null
  const known = TRADE_IN_MODELS.find((x) => x.brand === brand && x.model === model)
  const cond = CONDITIONS.find((c) => c.value === condition)
  if (!cond) return null
  const entry = known ?? { brand, model, topValue: OTHER_MODEL_VALUE[brand] ?? 3000, baseStorage: '64GB' }
  const base = entry.topValue
  const afterCondition = round500(base * cond.factor)
  const bonus = round500(afterCondition * storageFactor(entry, storage))
  return {
    finalValue: afterCondition + bonus,
    approximate: !known,
    breakdown: [
      { label: `Like New value (${known ? model : `${brand}, other model`})`, amount: base },
      { label: `Condition (${cond.title})`, amount: afterCondition - base },
      { label: `Storage bonus${storage ? ` (${storage})` : ''}`, amount: bonus },
    ],
  }
}

/** "₹30,500 – ₹45,000": Good condition to Like New, at base storage. */
export function valueRange(model: TradeInModel): string {
  const low = round500(model.topValue * CONDITIONS[1].factor)
  return `${inr(low)} – ${inr(model.topValue)}`
}

/** Highest Like New value we pay, for "up to ₹X" claims. */
export const MAX_TRADE_IN_VALUE = Math.max(...TRADE_IN_MODELS.map((x) => x.topValue))

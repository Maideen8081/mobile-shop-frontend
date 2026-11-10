/**
 * Contract test: the storefront shows totals with the same constants the
 * server charges (apps/common/pricing.py). Skipped when the backend repo isn't
 * checked out next to the frontend.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { DELIVERY_CHARGE, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '../../src/components/mobile/cartLogic'

const pricingPy = resolve(__dirname, '../../../mobileShopBackend/apps/common/pricing.py')
const src = existsSync(pricingPy) ? readFileSync(pricingPy, 'utf8') : ''
const serverValue = (name: string) =>
  Number(new RegExp(name + "\\s*=\\s*Decimal\\('([\\d.]+)'\\)").exec(src)?.[1])

describe.skipIf(!src)('pricing matches the backend', () => {
  it('uses the same GST rate', () => expect(TAX_RATE).toBe(serverValue('TAX_RATE')))
  it('uses the same free-shipping threshold', () => expect(FREE_SHIPPING_THRESHOLD).toBe(serverValue('FREE_SHIPPING_THRESHOLD')))
  it('uses the same delivery charge', () => expect(DELIVERY_CHARGE).toBe(serverValue('DELIVERY_CHARGE')))
})

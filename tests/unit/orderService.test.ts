import { describe, it, expect } from 'vitest'
import { formatOrderId, normalizeStatus } from '../../src/services/orderService'

describe('order helpers', () => {
  it('formats order ids', () => {
    expect(formatOrderId(42)).toBe('ORD-00000042')
    expect(formatOrderId('ord-abc')).toBe('ORD-ABC')
    expect(formatOrderId('  ')).toBe('')
  })

  it('normalizes status labels to API values', () => {
    expect(normalizeStatus('Out for Delivery')).toBe('out_for_delivery')
    expect(normalizeStatus('Packed')).toBe('processing')
    expect(normalizeStatus('')).toBe('order_placed')
    expect(normalizeStatus('Returned Item')).toBe('returned_item')
  })
})

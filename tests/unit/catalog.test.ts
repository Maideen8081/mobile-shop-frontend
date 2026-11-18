import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/services/api'
import { productService } from '../../src/services/productService'
import { invalidateRequests } from '../../src/utils/requestCache'

vi.mock('../../src/services/api', () => ({ default: { get: vi.fn() } }))

describe('catalog pagination', () => {
  beforeEach(() => {
    invalidateRequests('products:')
    vi.resetAllMocks()
  })

  it('reads pagination metadata beside the products in the API response', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { success: true, count: 24, next: '/api/v1/products/?page=2', previous: null, data: [{ id: 1 }] },
    })
    const page = await productService.listPaginated({ page: 1, page_size: 12 })
    expect(page.count).toBe(24)
    expect(page.next).toBe('/api/v1/products/?page=2')
    expect(page.results.map((product) => product.id)).toEqual([1])
  })

  it('shares a burst of identical reads and retries after a failed request', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Temporary outage'))
    const batch = await Promise.allSettled(Array.from({ length: 100 }, () => productService.listPaginated({ page: 2 })))
    expect(batch.every((result) => result.status === 'rejected')).toBe(true)
    expect(api.get).toHaveBeenCalledTimes(1)

    vi.mocked(api.get).mockResolvedValue({ data: { success: true, count: 0, data: [] } })
    await expect(productService.listPaginated({ page: 2 })).resolves.toMatchObject({ count: 0, results: [] })
    expect(api.get).toHaveBeenCalledTimes(2)
  })
})

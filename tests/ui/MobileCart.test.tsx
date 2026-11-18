import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const cartItems = [
  { productId: 1, variantId: 11, name: 'Nova X', brand: 'Nova', price: 400, quantity: 1, image: '' },
]

vi.mock('../../src/components/mobile/MobileTopSection', () => ({ default: () => <header /> }))
vi.mock('../../src/services/cartService', () => ({
  cartService: {
    getItems: vi.fn(async () => cartItems),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
  },
}))
vi.mock('../../src/services/productService', () => ({
  productService: { list: vi.fn(async () => []), getById: vi.fn(async () => ({ variants: [{ id: 11, stock: 9 }] })) },
}))
// The real coupon code runs; only the HTTP call is faked.
vi.mock('../../src/services/api', () => ({ default: { post: vi.fn(), get: vi.fn() } }))

import MobileCart from '../../src/components/mobile/MobileCart'
import { ToastProvider } from '../../src/context/ToastContext'
import api from '../../src/services/api'

function renderCart() {
  return render(<MemoryRouter><ToastProvider><MobileCart /></ToastProvider></MemoryRouter>)
}

// Subtotal 400 → GST 72 + delivery 49 = 521. No platform fee or tip: the server charges neither.
const grandTotal = () => screen.getByText('Grand Total').parentElement!

describe('MobileCart', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset()
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } })
  })

  it('shows the same total the server will charge', async () => {
    renderCart()
    await screen.findByText('Nova X')
    expect(within(grandTotal()).getByText('₹521')).toBeInTheDocument()
    expect(screen.queryByText('Platform Fee')).not.toBeInTheDocument()
    expect(screen.queryByText(/Delivery Partner Tip/)).not.toBeInTheDocument()
  })

  it('applies a coupon only after the server accepts it, and saves it for checkout', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: { coupon_code: 'SAVE10', discount_amount: '40.00' } } })
    renderCart()
    await screen.findByText('Nova X')

    await userEvent.type(screen.getByPlaceholderText('Enter coupon code'), 'save10')
    await userEvent.click(screen.getByRole('button', { name: /apply coupon/i }))

    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith('/api/v1/coupon/apply/', { code: 'SAVE10', subtotal: '400.00' })
    await waitFor(() => expect(within(grandTotal()).getByText('₹481')).toBeInTheDocument())
    expect(JSON.parse(localStorage.getItem('checkout_coupon')!)).toEqual({ code: 'SAVE10', discount: 40 })
  })

  it('rejects a code the server does not know, without discounting', async () => {
    vi.mocked(api.post).mockImplementationOnce(() => Promise.reject({ response: { data: { code: ['Invalid coupon code.'] } } }))
    renderCart()
    await screen.findByText('Nova X')

    await userEvent.type(screen.getByPlaceholderText('Enter coupon code'), 'PHONE10')
    await userEvent.click(screen.getByRole('button', { name: /apply coupon/i }))

    expect(await screen.findByText('Invalid coupon code.')).toBeInTheDocument()
    expect(within(grandTotal()).getByText('₹521')).toBeInTheDocument()
    expect(localStorage.getItem('checkout_coupon')).toBeNull()
  })
})

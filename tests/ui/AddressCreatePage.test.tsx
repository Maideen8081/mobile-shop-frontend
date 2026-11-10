import { describe, it, expect, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/components/mobile/MobileAddressManagement', () => ({
  default: () => <div>mobile address manager</div>,
}))
vi.mock('../../src/components/ecommerce/SiteTopNav', () => ({ default: () => <nav /> }))
vi.mock('../../src/services/authService', () => ({ authService: { isAuthenticated: () => true } }))
vi.mock('../../src/services/addressService', () => ({ addressService: { create: vi.fn() } }))

import AddressCreatePage from '../../src/pages/AddressCreatePage'

function resizeTo(width: number) {
  act(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
    window.dispatchEvent(new Event('resize'))
  })
}

describe('AddressCreatePage', () => {
  it('survives the viewport crossing the mobile breakpoint in both directions', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 })
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<MemoryRouter><AddressCreatePage /></MemoryRouter>)
    expect(screen.queryByText('mobile address manager')).not.toBeInTheDocument()

    resizeTo(390)
    expect(screen.getByText('mobile address manager')).toBeInTheDocument()

    resizeTo(1280)
    expect(screen.queryByText('mobile address manager')).not.toBeInTheDocument()
    // React reports hook-order violations through console.error.
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/hooks/i)
  })
})

import { LoaderCircle, LockKeyhole } from 'lucide-react'
import { formatINR } from '../../utils/checkout'
import './PlaceOrderButton.css'

export default function PlaceOrderButton({ total, disabled, placing, onPlaceOrder, available = true }: {
  total: number
  disabled: boolean
  placing: boolean
  onPlaceOrder: () => void
  available?: boolean
}) {
  return (
    <button
      type="button"
      className="place-order-button"
      disabled={disabled || placing || !available}
      aria-busy={placing}
      onClick={onPlaceOrder}
    >
      <span className="place-order-icon" aria-hidden="true">
        {placing ? <LoaderCircle size={18} className="place-order-spinner" /> : <LockKeyhole size={18} />}
      </span>
      <span className="place-order-copy">
        <strong>{placing ? 'Placing order…' : available ? 'Place order' : 'Payment unavailable'}</strong>
        {available && !placing && <span>Pay on delivery</span>}
      </span>
      {available && !placing && <span className="place-order-amount">{formatINR(total)}</span>}
    </button>
  )
}

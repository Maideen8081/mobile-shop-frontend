import { useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import { resumePendingCart } from '../utils/cartAuth'

/** Adds items a guest tried to add to the cart as soon as they sign in. */
export default function PendingCartResumer() {
  const { show } = useToast()
  useEffect(() => {
    const run = () => {
      resumePendingCart().then((n) => {
        if (n > 0) show(n === 1 ? 'Added to your cart' : `${n} items added to your cart`, 'success')
      })
    }
    run()
    window.addEventListener('auth-changed', run)
    return () => window.removeEventListener('auth-changed', run)
  }, [show])
  return null
}

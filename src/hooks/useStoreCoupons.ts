import { useEffect, useState } from 'react'
import { offerService, type StoreCoupon } from '../services/offerService'

/** Live coupons from the API. Empty while loading or when there are none. */
export function useStoreCoupons(): StoreCoupon[] {
  const [coupons, setCoupons] = useState<StoreCoupon[]>([])
  useEffect(() => {
    let alive = true
    offerService.getActiveCoupons().then((c) => { if (alive) setCoupons(c) }).catch(() => {})
    return () => { alive = false }
  }, [])
  return coupons
}

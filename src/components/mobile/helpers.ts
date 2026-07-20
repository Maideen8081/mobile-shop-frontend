import { useEffect, useRef, useState } from 'react'

const MOBILE_MAX = 480

export function useIsMobile(breakpoint = MOBILE_MAX + 1): boolean {
  const get = () =>
    typeof window !== 'undefined' &&
    (window.innerWidth <= breakpoint || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent))

  const [isMobile, setIsMobile] = useState(get)

  useEffect(() => {
    const onResize = () => setIsMobile(get())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return isMobile
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = API_BASE_URL.replace(/\/+$/, '')
  if (path.startsWith('/')) return `${base}/${path.replace(/^\/+/, '')}`
  if (/^[\w\-./]+$/.test(path)) return `${base}/${path.replace(/^\/+/, '')}`
  return ''
}

export function getProductImage(product: any): string {
  const variants = product?.variants || []
  const raw =
    product?.images?.[0] ||
    variants[0]?.images?.[0] ||
    product?.common_image ||
    product?.image ||
    product?.thumbnail ||
    variants[0]?.image ||
    ''
  return getImageUrl(raw)
}

export function getProductPrice(product: any): { price: number; discount: number; discountPct: number } {
  const variant = (product?.variants || [])[0]
  const price = Number(variant?.price || product?.price || 0)
  const discount = Number(variant?.discountPrice || product?.discountPrice || 0)
  const finalPrice = discount > 0 ? discount : price
  const mrp = price > 0 ? price : finalPrice
  const discountPct = mrp > 0 && discount > 0 && discount < mrp
    ? Math.round(((mrp - discount) / mrp) * 100)
    : 0
  return { price: finalPrice, discount: mrp, discountPct }
}

export function useHorizontalArrows() {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = () => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  })

  const scroll = (dir: 'left' | 'right') => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return { ref, canLeft, canRight, update, scroll }
}

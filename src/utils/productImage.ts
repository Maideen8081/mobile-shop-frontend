import { useEffect, useState } from 'react'
import { removeBackground } from './removeBackground'

/*
 * Product photo for large frames: background removed (same as the home page
 * cards), then the empty margin around the product trimmed off so it can fill
 * the frame. Falls back to the original image whenever processing isn't
 * possible (e.g. a cross-origin image without CORS headers).
 */

const PAD = 0.03 // keep a little breathing room around the product
const cache = new Map<string, Promise<string | null>>()

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (!src.startsWith('blob:') && !src.startsWith('data:')) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Crops transparent margins. Returns null when there's nothing to trim. */
async function trimTransparent(src: string): Promise<string | null> {
  let img: HTMLImageElement
  try { img = await loadImage(src) } catch { return null }
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) return null
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0)
  let px: Uint8ClampedArray
  try { px = ctx.getImageData(0, 0, w, h).data } catch { return null }

  let top = h, left = w, right = -1, bottom = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > 24) {
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }
  if (right < 0) return null // fully transparent
  const bw = right - left + 1
  const bh = bottom - top + 1
  if (bw > w * 0.96 && bh > h * 0.96) return null // already tight

  const pad = Math.round(Math.max(bw, bh) * PAD)
  const sx = Math.max(0, left - pad)
  const sy = Math.max(0, top - pad)
  const sw = Math.min(w - sx, bw + pad * 2)
  const sh = Math.min(h - sy, bh + pad * 2)
  const out = document.createElement('canvas')
  out.width = sw
  out.height = sh
  out.getContext('2d')?.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'))
  return blob ? URL.createObjectURL(blob) : null
}

export function prepareProductImage(src: string): Promise<string | null> {
  let job = cache.get(src)
  if (!job) {
    job = (async () => {
      const cut = await removeBackground(src)
      const trimmed = await trimTransparent(cut || src)
      return trimmed || cut
    })().catch(() => null)
    cache.set(src, job)
  }
  return job
}

/** React hook: the cleaned-up image once ready, the original until then. */
export function useProductImage(src: string | undefined): { src: string | undefined; ready: boolean; cut: boolean } {
  const [state, setState] = useState<{ for?: string; url: string | null }>({ url: null })

  useEffect(() => {
    if (!src) return
    let alive = true
    prepareProductImage(src).then((url) => { if (alive) setState({ for: src, url }) })
    return () => { alive = false }
  }, [src])

  const ready = state.for === src
  return { src: ready && state.url ? state.url : src, ready, cut: ready && !!state.url }
}

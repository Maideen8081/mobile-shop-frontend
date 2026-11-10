import { useEffect, useState } from 'react'

/**
 * Automatic background removal for product photos, done in the browser.
 *
 * Product shots are usually taken on a plain studio background (white,
 * grey or a flat colour). We sample the image border to find that colour,
 * flood-fill inward from the edges over every pixel close to it, and make
 * those pixels transparent with a soft edge. Pixels of the same colour that
 * sit *inside* the product (e.g. a white phone face) are untouched because
 * the fill only spreads from the border.
 *
 * Images that don't have a plain border (lifestyle photos, already-transparent
 * PNGs) are returned unchanged. If the image server doesn't allow
 * cross-origin reads, the original image is used.
 *
 * Results are cached per URL and processed one at a time so scrolling
 * stays smooth.
 */

const MAX_SIDE = 720
/** Colour distance (0–441) still treated as background. */
const TOLERANCE = 34
/** Extra band beyond the tolerance that fades out, for smooth edges. */
const FEATHER = 26
/** Share of border pixels that must match for the background to count as plain. */
const MIN_PLAIN_BORDER = 0.6

const cache = new Map<string, Promise<string | null>>()
let queue: Promise<unknown> = Promise.resolve()

const idle = () =>
  new Promise<void>((resolve) => {
    const ric = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout: number }) => number)
      | undefined
    if (ric) ric(() => resolve(), { timeout: 600 })
    else setTimeout(resolve, 16)
  })

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function process(src: string): Promise<string | null> {
  if (!src || src.startsWith('data:image/svg')) return null
  await idle()

  let img: HTMLImageElement
  try {
    img = await loadImage(src)
  } catch {
    return null
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, w, h)

  let data: ImageData
  try {
    data = ctx.getImageData(0, 0, w, h)
  } catch {
    return null // cross-origin image without CORS headers
  }
  const px = data.data

  /* ── 1. Find the background colour from the border ── */
  const border: number[] = []
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x)
  for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1)

  let transparent = 0
  const rs: number[] = []
  const gs: number[] = []
  const bs: number[] = []
  for (const i of border) {
    const o = i * 4
    if (px[o + 3] < 20) transparent++
    rs.push(px[o])
    gs.push(px[o + 1])
    bs.push(px[o + 2])
  }
  /* Already a cut-out — nothing to do. */
  if (transparent / border.length > 0.5) return null

  const median = (a: number[]) => a.sort((p, q) => p - q)[a.length >> 1]
  const br = median(rs)
  const bg = median(gs)
  const bb = median(bs)

  const dist = (o: number) => {
    const dr = px[o] - br
    const dg = px[o + 1] - bg
    const db = px[o + 2] - bb
    return Math.sqrt(dr * dr + dg * dg + db * db)
  }

  let plain = 0
  for (const i of border) if (dist(i * 4) <= TOLERANCE) plain++
  if (plain / border.length < MIN_PLAIN_BORDER) return null // busy background

  /* ── 2. Flood-fill from the edges ── */
  const limit = TOLERANCE + FEATHER
  const seen = new Uint8Array(w * h)
  const stack = new Int32Array(w * h)
  let sp = 0
  for (const i of border) {
    if (!seen[i] && dist(i * 4) <= limit) {
      seen[i] = 1
      stack[sp++] = i
    }
  }
  while (sp > 0) {
    const i = stack[--sp]
    const o = i * 4
    const d = dist(o)
    /* Soft edge: fully clear inside the tolerance, fade across the feather band. */
    const keep = d <= TOLERANCE ? 0 : (d - TOLERANCE) / FEATHER
    px[o + 3] = Math.round(px[o + 3] * keep)
    /* Only keep spreading through clearly-background pixels. */
    if (d > TOLERANCE) continue
    const x = i % w
    const y = (i / w) | 0
    if (x > 0 && !seen[i - 1] && dist(o - 4) <= limit) (seen[i - 1] = 1), (stack[sp++] = i - 1)
    if (x < w - 1 && !seen[i + 1] && dist(o + 4) <= limit) (seen[i + 1] = 1), (stack[sp++] = i + 1)
    if (y > 0 && !seen[i - w] && dist(o - w * 4) <= limit) (seen[i - w] = 1), (stack[sp++] = i - w)
    if (y < h - 1 && !seen[i + w] && dist(o + w * 4) <= limit) (seen[i + w] = 1), (stack[sp++] = i + w)
  }

  ctx.putImageData(data, 0, 0)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  return blob ? URL.createObjectURL(blob) : null
}

/** Background-free version of `src`, or null when it can't / needn't be cut out. */
export function removeBackground(src: string): Promise<string | null> {
  let job = cache.get(src)
  if (!job) {
    job = queue.then(() => process(src)).catch(() => null)
    queue = job
    cache.set(src, job)
  }
  return job
}

/**
 * React hook: returns the cut-out image once ready, otherwise the original.
 * `done` tells the caller whether processing has finished (either way).
 */
export function useCutout(src: string | undefined): { src: string | undefined; cut: boolean; done: boolean } {
  const [state, setState] = useState<{ for?: string; url: string | null; done: boolean }>({
    url: null,
    done: false,
  })

  useEffect(() => {
    if (!src) return
    let alive = true
    removeBackground(src).then((url) => {
      if (alive) setState({ for: src, url, done: true })
    })
    return () => {
      alive = false
    }
  }, [src])

  const ready = state.for === src && state.done
  return {
    src: ready && state.url ? state.url : src,
    cut: ready && !!state.url,
    done: ready,
  }
}

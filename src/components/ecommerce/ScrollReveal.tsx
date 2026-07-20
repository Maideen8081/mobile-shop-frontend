import { useEffect, useRef, useState } from 'react'

const TOTAL_FRAMES = 240

function pad(i: number): string {
  return String(i + 1).padStart(3, '0')
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  vw: number,
  vh: number,
) {
  const canvasRatio = vw / vh
  const imageRatio = img.naturalWidth / img.naturalHeight
  let drawWidth: number
  let drawHeight: number
  let x: number
  let y: number

  if (imageRatio > canvasRatio) {
    drawHeight = vh
    drawWidth = drawHeight * imageRatio
    x = (vw - drawWidth) / 2
    y = 0
  } else {
    drawWidth = vw
    drawHeight = drawWidth / imageRatio
    x = 0
    y = (vh - drawHeight) / 2
  }

  ctx.clearRect(0, 0, vw, vh)
  ctx.drawImage(img, x, y, drawWidth, drawHeight)
}

function panelOpacity(progress: number, start: number, end: number): number {
  if (progress < start || progress > end) return 0
  const range = end - start
  const fadeZone = range * 0.2
  const midStart = start + fadeZone
  const midEnd = end - fadeZone
  if (progress < midStart) return (progress - start) / fadeZone
  if (progress > midEnd) return (end - progress) / fadeZone
  return 1
}

const panels = [
  {
    heading: 'Reimagined Performance',
    text: 'Experience flagship speed, seamless multitasking, and ultra-smooth interactions engineered for the future.',
    start: 0,
    end: 0.25,
  },
  {
    heading: 'Precision Crafted Design',
    text: 'Every curve, material, and detail is designed to deliver a premium feel and timeless elegance.',
    start: 0.3,
    end: 0.6,
  },
  {
    heading: 'Built For Everyday Power',
    text: 'Long-lasting battery life, intelligent optimization, and performance that adapts to your lifestyle.',
    start: 0.65,
    end: 0.95,
  },
]

export default function ScrollReveal() {
  const [ready, setReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(TOTAL_FRAMES).fill(null),
  )
  const currentFrameRef = useRef(-1)
  const prevFrameRef = useRef<HTMLImageElement | null>(null)
  const loadedCountRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function setupCanvas() {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = '100vw'
      canvas.style.height = '100vh'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    setupCanvas()
    window.addEventListener('resize', setupCanvas, { passive: true })

    function renderFrame(index: number) {
      const img = imagesRef.current[index]
      if (!img || !img.complete) {
        if (prevFrameRef.current) {
          drawImageCover(ctx, prevFrameRef.current, window.innerWidth, window.innerHeight)
        }
        return
      }
      prevFrameRef.current = img
      drawImageCover(ctx, img, window.innerWidth, window.innerHeight)
    }

    function onScroll() {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const maxScroll = rect.height - window.innerHeight
      const progress = maxScroll > 0 ? Math.max(0, Math.min(1, -rect.top / maxScroll)) : 0
      const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1)))
      if (frameIndex !== currentFrameRef.current) {
        currentFrameRef.current = frameIndex
        renderFrame(frameIndex)
      }
    }

    let raf = 0
    function tick() {
      onScroll()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', setupCanvas)
    }
  }, [])

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imagesRef.current[0] = img
      prevFrameRef.current = img
      loadedCountRef.current = 1
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0)
          drawImageCover(ctx, img, window.innerWidth, window.innerHeight)
        }
      }
      setReady(true)
    }
    img.onerror = () => {
      console.error('Failed:', img.src)
      setReady(true)
    }
    const src = `/images/ezgif-frame-${pad(0)}.jpg`
    console.log('Loading:', src)
    img.src = src
  }, [])

  useEffect(() => {
    let cancelled = false

    function loadChunk(start: number, end: number) {
      for (let i = start; i <= end && i <= TOTAL_FRAMES; i++) {
        if (cancelled) return
        const idx = i - 1
        if (imagesRef.current[idx]) continue
        const img = new Image()
        img.onload = () => {
          if (cancelled) return
          imagesRef.current[idx] = img
          loadedCountRef.current++
        }
        img.onerror = () => {
          console.error('Failed:', img.src)
        }
        img.src = `/images/ezgif-frame-${pad(idx)}.jpg`
      }
    }

    function scheduleLoad() {
      if (cancelled) return
      const loaded = loadedCountRef.current
      if (loaded >= TOTAL_FRAMES) return
      const nextStart = loaded + 1
      const nextEnd = Math.min(nextStart + 9, TOTAL_FRAMES)
      loadChunk(nextStart, nextEnd)
      if (nextEnd < TOTAL_FRAMES) {
        requestIdleCallback(scheduleLoad, { timeout: 2000 })
      }
    }

    if (loadedCountRef.current >= 1) {
      requestIdleCallback(scheduleLoad, { timeout: 1000 })
    }

    return () => { cancelled = true }
  }, [ready])

  return (
    <section className="relative bg-black overflow-hidden">
      {!ready && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center"
          style={{ background: '#000' }}
        >
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6" />
            <p className="text-white/60 text-sm tracking-widest uppercase">
              Loading Product Experience...
            </p>
          </div>
        </div>
      )}

      <div ref={containerRef} style={{ height: '800vh' }} />

      <div
        className="fixed inset-0 top-0 left-0 w-screen h-screen"
        style={{ zIndex: 1 }}
      >
        <canvas
          ref={canvasRef}
          className="block absolute top-0 left-0"
          style={{ width: '100vw', height: '100vh' }}
        />
      </div>

      <div
        className="fixed inset-0 top-0 left-0 w-screen h-screen flex items-center px-6 md:px-8 lg:px-16 pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <div className="relative w-full max-w-[600px]">
          {panels.map((panel) => (
            <ScrollPanel
              key={panel.heading}
              heading={panel.heading}
              text={panel.text}
              start={panel.start}
              end={panel.end}
              containerRef={containerRef}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function ScrollPanel({
  heading,
  text,
  start,
  end,
  containerRef,
}: {
  heading: string
  text: string
  start: number
  end: number
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const elRef = useRef<HTMLDivElement>(null)
  const opacityRef = useRef(0)

  useEffect(() => {
    let raf = 0

    function update() {
      const container = containerRef.current
      if (!container) { raf = requestAnimationFrame(update); return }
      const rect = container.getBoundingClientRect()
      const maxScroll = rect.height - window.innerHeight
      const progress = maxScroll > 0 ? Math.max(0, Math.min(1, -rect.top / maxScroll)) : 0
      const op = panelOpacity(progress, start, end)
      if (Math.abs(op - opacityRef.current) > 0.005) {
        opacityRef.current = op
        if (elRef.current) {
          elRef.current.style.opacity = String(op)
          elRef.current.style.transform = `translateY(${(1 - op) * 24}px)`
        }
      }
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [start, end, containerRef])

  return (
    <div
      ref={elRef}
      style={{
        opacity: 0,
        transform: 'translateY(24px)',
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        zIndex: 11,
      }}
      className="w-full max-w-[420px] absolute top-0 left-0"
    >
      <h3
        className="text-white text-2xl md:text-3xl font-bold mb-3"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {heading}
      </h3>
      <p
        className="text-sm md:text-base leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.75)' }}
      >
        {text}
      </p>
    </div>
  )
}

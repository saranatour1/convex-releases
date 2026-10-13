import { useEffect, useRef } from 'react'

export type Mode = 'idle' | 'listening' | 'thinking' | 'speaking'

// Soft stipple, not a lattice: random points, tiny and faint, with only a few
// Convex-colored specks. Density is higher near the rim, like the reference.
const SPARKS = ['#f3b01c', '#ee342f', '#8d2676']
const N = 700

const points = Array.from({ length: N }, () => {
  const u = Math.random() * 2 - 1
  const a = Math.random() * Math.PI * 2
  const r = Math.sqrt(1 - u * u)
  return {
    x: Math.cos(a) * r,
    y: u,
    z: Math.sin(a) * r,
    color: Math.random() < 0.05 ? SPARKS[Math.floor(Math.random() * 3)] : null,
    seed: Math.random() * Math.PI * 2,
  }
})

export function Sphere({ mode }: { mode: Mode }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const modeRef = useRef(mode)
  modeRef.current = mode

  useEffect(() => {
    const el = canvas.current!
    const ctx = el.getContext('2d')!
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const size = 240
    const dpr = devicePixelRatio || 1
    el.width = el.height = size * dpr
    ctx.scale(dpr, dpr)
    let raf = 0
    let spin = 0

    const frame = (t: number) => {
      const m = modeRef.current
      spin += m === 'thinking' ? 0.006 : 0.0012
      const ink = getComputedStyle(el).color
      // The whole cloud breathes; louder when we are listening or speaking.
      const energy =
        m === 'listening'
          ? 0.05
          : m === 'speaking'
            ? 0.04
            : m === 'thinking'
              ? 0.025
              : 0.012
      const cos = Math.cos(spin)
      const sin = Math.sin(spin)
      ctx.clearRect(0, 0, size, size)
      for (const p of points) {
        const drift =
          1 +
          energy *
            Math.sin(t / 700 + p.seed * 4 + (m === 'speaking' ? p.y * 5 : 0))
        const x = (p.x * cos + p.z * sin) * drift
        const z = (p.z * cos - p.x * sin) * drift
        const y = p.y * drift
        // Rim dots are brighter than the face, which keeps it airy rather than solid.
        const rim = 1 - Math.abs(z)
        ctx.globalAlpha = (0.12 + 0.5 * rim * rim) * (z < 0 ? 0.55 : 1)
        ctx.fillStyle = p.color ?? ink
        ctx.beginPath()
        ctx.arc(
          size / 2 + x * 100,
          size / 2 + y * 100,
          0.55 + rim * 0.45,
          0,
          6.3,
        )
        ctx.fill()
      }
      if (!still) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvas} className="size-60 text-foreground" aria-hidden />
}

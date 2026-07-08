import {
  cellWaveOrder,
  gradientPresets,
  sampleGradient,
  type GradientPresetName,
  type SpinPattern,
} from "gradient-spin"

/**
 * Animated favicon: redraws the 3×3 spinner on a canvas and swaps the
 * <link rel="icon"> href, so the tab icon runs the same wave as the page.
 * Follows the playground's preset/pattern via setFaviconSpinConfig. Chrome /
 * Edge / Firefox animate; Safari keeps the static SVG. Under
 * prefers-reduced-motion the static favicon.svg is left untouched.
 *
 * Timer cadence is ~2 frames per wavefront step — background tabs throttle
 * timers to ~1Hz, which just slows the wave instead of breaking it.
 */

const SIZE = 64
// Grid drawn at 0.6 of the canvas, centered — full-bleed read too heavy in
// the tab strip next to text-based favicons.
const SCALE = 0.6
const CELL = 16 * SCALE
const GAP = 8 * SCALE
const RADIUS = 4 * SCALE
const OFFSET = (SIZE - (CELL * 3 + GAP * 2)) / 2
const PERIOD_MS = 750
const FRAME_MS = 50

type FaviconConfig = { preset: GradientPresetName; pattern: SpinPattern }

let config: FaviconConfig = { preset: "sunrise", pattern: "arrow-up" }
let cells: Array<{ row: number; col: number; phase: number; color: string }> = []

function rebuildCells() {
  const stops = gradientPresets[config.preset]
  const seeds = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      seeds.push({ row, col, ...cellWaveOrder(config.pattern, row, col, 3, 3) })
    }
  }
  // Colors follow the library default: top→bottom row mapping.
  cells = seeds.map((seed) => ({
    row: seed.row,
    col: seed.col,
    phase: seed.max === 0 ? 0 : seed.d / (seed.max + 1),
    color: sampleGradient(stops, seed.row / 2),
  }))
}

/** The library keyframe curve: 0%→1, 45%→dim, 92%→dim, 100%→1 (dim = 0.1). */
const DIM = 0.1
function opacityAt(local: number) {
  if (local <= 0.45) return 1 - (local / 0.45) * (1 - DIM)
  if (local <= 0.92) return DIM
  return DIM + ((local - 0.92) / 0.08) * (1 - DIM)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + s, y, x + s, y + s, r)
  ctx.arcTo(x + s, y + s, x, y + s, r)
  ctx.arcTo(x, y + s, x, y, r)
  ctx.arcTo(x, y, x + s, y, r)
  ctx.fill()
}

export function setFaviconSpinConfig(next: FaviconConfig) {
  config = next
  rebuildCells()
}

export function startFaviconSpin() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
  if (!link) return
  const canvas = document.createElement("canvas")
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  // The static link declares image/svg+xml; once we start feeding PNG data
  // URIs a stale type makes browsers re-sniff (visible as a flicker).
  link.type = "image/png"
  rebuildCells()

  const drawFrame = (alphaFor: (cell: (typeof cells)[number]) => number) => {
    ctx.clearRect(0, 0, SIZE, SIZE)
    for (const cell of cells) {
      const alpha = alphaFor(cell)
      if (alpha <= 0.01) continue
      ctx.globalAlpha = alpha
      ctx.fillStyle = cell.color
      roundRect(ctx, OFFSET + cell.col * (CELL + GAP), OFFSET + cell.row * (CELL + GAP), CELL, RADIUS)
    }
    ctx.globalAlpha = 1
    const next = canvas.toDataURL("image/png")
    if (next !== link.href) link.href = next
  }

  const start = performance.now()
  let timer: number | null = null
  const tick = () => {
    const t = ((performance.now() - start) / PERIOD_MS) % 1
    // negative-delay equivalent: cell progress = t + (1 - phase)
    drawFrame((cell) => opacityAt((t + 1 - cell.phase) % 1))
  }
  const play = () => {
    if (timer === null) timer = window.setInterval(tick, FRAME_MS)
  }
  const pause = () => {
    if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
    // Background-tab timers are throttled to ~1Hz, which reads as random
    // blinking exactly where favicons matter most — park on a clean static
    // full-brightness frame instead and resume when the tab is visible.
    drawFrame(() => 1)
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause()
    else play()
  })
  if (document.hidden) pause()
  else play()
}

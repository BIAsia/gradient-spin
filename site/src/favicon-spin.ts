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
const CELL = 16
const GAP = 8
const RADIUS = 4
const PERIOD_MS = 750
const FRAME_MS = 125

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
  const ordered = [...seeds].sort((a, b) => a.d - b.d || a.row - b.row || a.col - b.col)
  const rank = new Map<string, number>()
  ordered.forEach((seed, index) => {
    rank.set(`${seed.row}-${seed.col}`, index)
  })
  cells = seeds.map((seed) => ({
    row: seed.row,
    col: seed.col,
    phase: seed.max === 0 ? 0 : seed.d / (seed.max + 1),
    color: sampleGradient(stops, (rank.get(`${seed.row}-${seed.col}`) ?? 0) / 8),
  }))
}

/** The library keyframe curve: 0%→1, 45%→dim, 92%→dim, 100%→1 (dim = 0). */
function opacityAt(local: number) {
  if (local <= 0.45) return 1 - local / 0.45
  if (local <= 0.92) return 0
  return (local - 0.92) / 0.08
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
  rebuildCells()
  const start = performance.now()
  setInterval(() => {
    const t = ((performance.now() - start) / PERIOD_MS) % 1
    ctx.clearRect(0, 0, SIZE, SIZE)
    for (const cell of cells) {
      // negative-delay equivalent: cell progress = t + (1 - phase)
      const local = (t + 1 - cell.phase) % 1
      const alpha = opacityAt(local)
      if (alpha <= 0.01) continue
      ctx.globalAlpha = alpha
      ctx.fillStyle = cell.color
      roundRect(ctx, cell.col * (CELL + GAP), cell.row * (CELL + GAP), CELL, RADIUS)
    }
    ctx.globalAlpha = 1
    link.href = canvas.toDataURL("image/png")
  }, FRAME_MS)
}

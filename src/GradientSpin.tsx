"use client"

import { type CSSProperties, useInsertionEffect, useMemo } from "react"
import { cellWaveOrder } from "./patterns"
import { gradientPresets } from "./presets"
import { sampleGradient } from "./sample-gradient"
import type { GradientInput, GradientSpinProps, GradientStop } from "./types"

/**
 * GradientSpin — a matrix-of-cells loading spinner. A brightness wavefront
 * travels across the grid in an infinite loop; the pattern is a per-cell
 * phase (delay = distance function over the grid), so the whole animation is
 * ONE shared CSS keyframe animating opacity only. Compositor-friendly: it
 * keeps ticking while the main thread is busy with the work you're waiting
 * for. Negative delays mean the loop mounts already in steady state.
 *
 * Styles are injected once at runtime (`useInsertionEffect`, id-deduped) —
 * no CSS import, no Tailwind, zero dependencies.
 */

const STYLE_ID = "gradient-spin-styles"

const STYLE_TEXT = `@keyframes gradient-spin-pulse {
  0% { opacity: 1; }
  45% { opacity: var(--gspin-dim, 0); }
  92% { opacity: var(--gspin-dim, 0); }
  100% { opacity: 1; }
}
.gradient-spin-cell {
  opacity: var(--gspin-dim, 0);
  animation: gradient-spin-pulse var(--gspin-period, 750ms) linear infinite;
  animation-delay: calc((var(--gspin-phase, 0) - 1) * var(--gspin-period, 750ms));
}
@media (prefers-reduced-motion: reduce) {
  [data-gspin-reduced-motion="respect"] .gradient-spin-cell {
    animation: none;
    opacity: 0.6;
  }
}`

function useInjectedStyles() {
  useInsertionEffect(() => {
    if (typeof document === "undefined") return
    if (document.getElementById(STYLE_ID)) return
    const element = document.createElement("style")
    element.id = STYLE_ID
    element.textContent = STYLE_TEXT
    document.head.appendChild(element)
    // Deliberately never removed: the sheet is shared by every instance and
    // is a handful of bytes — churning it on unmount buys nothing.
  }, [])
}

function resolveStops(gradient: GradientInput): readonly GradientStop[] {
  return typeof gradient === "string" ? gradientPresets[gradient] : gradient
}

export function GradientSpin({
  gradient = "sunrise",
  pattern = "arrow-up",
  rows = 3,
  cols = 3,
  cellSize = 4,
  cellGap = 2,
  cellRadius = 1,
  period = 750,
  dim = 0,
  colorBy = "path",
  label = "Loading",
  respectReducedMotion = true,
  className,
  style,
  ...rest
}: GradientSpinProps) {
  useInjectedStyles()

  const stops = resolveStops(gradient)

  const cells = useMemo(() => {
    const seeds: Array<{ row: number; col: number; d: number; max: number }> = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        seeds.push({ row, col, ...cellWaveOrder(pattern, row, col, rows, cols) })
      }
    }
    // "path" color axis: EVERY cell gets a unique sample point so the full
    // multi-stop ramp is always visible — rank cells along the wave (ties on
    // equal distance broken spatially) instead of sampling at the distance
    // value itself, which would collapse a 3×3 arrow to only 4 samples.
    const pathRank = new Map<string, number>()
    if (colorBy === "path") {
      const ordered = [...seeds].sort((a, b) => a.d - b.d || a.row - b.row || a.col - b.col)
      ordered.forEach((seed, index) => {
        pathRank.set(`${seed.row}-${seed.col}`, index)
      })
    }
    return seeds.map((seed) => {
      const key = `${seed.row}-${seed.col}`
      // +1 keeps the wrap-around gap the same as the gap between fronts, so
      // the loop re-enters seamlessly instead of first/last firing together.
      const phase = seed.max === 0 ? 0 : seed.d / (seed.max + 1)
      const colorT =
        colorBy === "path"
          ? seeds.length > 1
            ? (pathRank.get(key) ?? 0) / (seeds.length - 1)
            : 0
          : rows > 1
            ? seed.row / (rows - 1)
            : 0
      return { key, color: sampleGradient(stops, colorT), phase }
    })
  }, [pattern, rows, cols, colorBy, stops])

  const rootStyle: CSSProperties = {
    display: "inline-grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridAutoRows: `${cellSize}px`,
    gap: `${cellGap}px`,
    ...style,
  }
  ;(rootStyle as Record<string, string | number>)["--gspin-period"] = `${period}ms`
  ;(rootStyle as Record<string, string | number>)["--gspin-dim"] = dim

  return (
    <span
      role="status"
      aria-label={label}
      data-gspin-reduced-motion={respectReducedMotion ? "respect" : "ignore"}
      className={className}
      style={rootStyle}
      {...rest}
    >
      {cells.map((cell) => (
        <span
          key={cell.key}
          className="gradient-spin-cell"
          style={
            {
              backgroundColor: cell.color,
              borderRadius: `${cellRadius}px`,
              "--gspin-phase": cell.phase,
            } as CSSProperties
          }
        />
      ))}
    </span>
  )
}

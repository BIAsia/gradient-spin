import type { HTMLAttributes } from "react"

/** A single stop in the gradient, positioned 0..1 along the ramp. */
export interface GradientStop {
  position: number
  color: string
}

export type GradientPresetName =
  | "sunrise"
  | "bubble"
  | "peach"
  | "tonic"
  | "mint"
  | "spring"
  | "twilight"
  | "bay"

/** Either an explicit multi-stop gradient or a built-in preset name. */
export type GradientInput = GradientStop[] | GradientPresetName

/**
 * Wavefront shape. Each pattern is a distance function over the grid — cells
 * at equal distance light together and form the moving front.
 */
export type SpinPattern = "arrow-up" | "diagonal" | "snake" | "ripple"

export interface GradientSpinProps extends HTMLAttributes<HTMLSpanElement> {
  /** Multi-stop gradient or a preset name. Defaults to `"sunrise"`. */
  gradient?: GradientInput
  /** Wavefront shape. Defaults to `"arrow-up"`. */
  pattern?: SpinPattern
  /** Grid rows. Defaults to `3`. */
  rows?: number
  /** Grid columns. Defaults to `3`. */
  cols?: number
  /** Cell edge length in px. Defaults to `4`. */
  cellSize?: number
  /** Gap between cells in px. Defaults to `2`. */
  cellGap?: number
  /** Cell corner radius in px. Defaults to `1`. */
  cellRadius?: number
  /** One full wave sweep in ms. Defaults to `750`. */
  period?: number
  /** Resting opacity of unlit cells, 0..1. Defaults to `0.1`. */
  dim?: number
  /**
   * How the gradient maps onto cells: `"row"` maps it top→bottom like a
   * backdrop, `"path"` walks the ramp along the wave's travel order (every
   * cell gets a unique sample). Defaults to `"row"`.
   */
  colorBy?: "path" | "row"
  /** Accessible label for the spinner. Defaults to `"Loading"`. */
  label?: string
  /** Freeze to a static mid-state under `prefers-reduced-motion`. Defaults to `true`. */
  respectReducedMotion?: boolean
}

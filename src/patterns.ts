import type { SpinPattern } from "./types"

export const spinPatterns: readonly SpinPattern[] = ["arrow-up", "diagonal", "snake", "ripple"]

/**
 * Spatial period (in cells along the travel direction) for the scrolling
 * patterns. A single corner-to-corner sweep teleports on wrap — the trailing
 * comet is still lit at one end while the new head enters the opposite end, so
 * you briefly see two counter-running waves (worst on large/oblong grids).
 * Tiling the wave into repeating bands fixes this: one stripe exits an edge
 * exactly as the next enters the other, seamlessly and independent of grid
 * size. Lower = denser stripes.
 */
const SCROLL_BAND = 4

/**
 * Wave order for a cell: `d` is the cell's distance along the pattern's travel
 * direction, `max` the largest distance in the grid. Cells with equal `d`
 * light together and form the wavefront shape. The `phase = d / (max + 1)`
 * mapping in GradientSpin makes the wrap gap match the inter-front gap, so
 * `d = raw % SCROLL_BAND, max = SCROLL_BAND - 1` yields a seamless scroll.
 */
export function cellWaveOrder(
  pattern: SpinPattern,
  row: number,
  col: number,
  rows: number,
  cols: number
): { d: number; max: number } {
  const centerCol = (cols - 1) / 2
  switch (pattern) {
    case "arrow-up": {
      // Chevron fold across the center column: equal-d cells form a "^" whose
      // apex climbs upward as d grows.
      return {
        d: rows - 1 - row + Math.abs(col - centerCol),
        max: rows - 1 + centerCol,
      }
    }
    case "diagonal":
      // Anti-diagonal stripes scrolling toward the bottom-right, tiled so the
      // loop scrolls seamlessly instead of sweeping corner-to-corner once.
      return { d: (row + col) % SCROLL_BAND, max: SCROLL_BAND - 1 }
    case "snake": {
      // Boustrophedon index from the bottom-left — the wave runs the grid like
      // a snake, alternating direction per row — tiled into scrolling comets so
      // the loop never teleports from the top end back to the bottom start.
      const rowFromBottom = rows - 1 - row
      const leftToRight = rowFromBottom % 2 === 0
      const path = rowFromBottom * cols + (leftToRight ? col : cols - 1 - col)
      return { d: path % SCROLL_BAND, max: SCROLL_BAND - 1 }
    }
    case "ripple": {
      // Chebyshev distance → expanding square rings, the most "LED matrix" of
      // the distance functions.
      const centerRow = (rows - 1) / 2
      return {
        d: Math.max(Math.abs(row - centerRow), Math.abs(col - centerCol)),
        max: Math.max(centerRow, centerCol),
      }
    }
  }
}

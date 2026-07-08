import type { SpinPattern } from "./types"

export const spinPatterns: readonly SpinPattern[] = ["arrow-up", "diagonal", "snake", "ripple"]

/**
 * Wave order for a cell: `d` is the cell's distance along the pattern's travel
 * direction, `max` the largest distance in the grid. Cells with equal `d`
 * light together and form the wavefront shape.
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
      return { d: row + col, max: rows + cols - 2 }
    case "snake": {
      // Boustrophedon index from the bottom-left — the wave runs the grid like
      // a snake, alternating direction per row.
      const rowFromBottom = rows - 1 - row
      const leftToRight = rowFromBottom % 2 === 0
      return {
        d: rowFromBottom * cols + (leftToRight ? col : cols - 1 - col),
        max: rows * cols - 1,
      }
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

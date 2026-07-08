# gradient-spin

A zero-dependency React matrix loading spinner — a grid of cells swept by a
gradient wavefront. The cousin of a progress bar's shimmer: cells light up in
**arrow / diagonal / snake / ripple** patterns, colored by a multi-stop
gradient sampled in OKLab.

**Live demo → [gradient-spin.vercel.app](https://gradient-spin.vercel.app)**
· Sister library: [gradient-shimmer](https://github.com/BIAsia/gradient-shimmer)
(same gradient palettes, for text).

## Why

- **One CSS keyframe, compositor-only.** Every cell shares a single
  opacity-only animation with a negative per-cell delay (delay = distance
  function over the grid). The spinner keeps ticking even while the main
  thread is busy with the work you're waiting for — exactly when a spinner
  matters.
- **Steady-state mount.** Negative delays mean the loop is already mid-flight
  on first paint: no fill-in ramp.
- **Gradient-true cells.** Colors are sampled from the gradient in **OKLab**
  (straight sRGB lerp detours through gray), with a minimum-chroma rescue so
  near-neutral stops never render as dirty gray squares. Every cell gets a
  unique sample point along the wave path, so the full ramp is always visible
  — even on a 3×3.
- **No CSS import.** Styles are injected once at runtime (`useInsertionEffect`,
  id-deduped). No Tailwind, no setup, zero runtime dependencies.
- **Accessible.** `role="status"` + `aria-label`; freezes to a static
  mid-state under `prefers-reduced-motion`.

## Install

```sh
npm i gradient-spin
```

## Usage

```tsx
import { GradientSpin } from "gradient-spin"

// Defaults: 3×3, 4px cells, 750ms, "sunrise" gradient, arrow-up wave.
<GradientSpin />

// A chat feed's "loading older messages" strip:
<GradientSpin gradient="bay" pattern="snake" label="Loading older messages" />

// Custom gradient stops:
<GradientSpin
  gradient={[
    { color: "#B6D3EF", position: 0 },
    { color: "#F888A0", position: 1 },
  ]}
  rows={5}
  cols={7}
/>
```

## Props

| Prop                   | Type                                        | Default      |
| ---------------------- | ------------------------------------------- | ------------ |
| `gradient`             | preset name \| `GradientStop[]`             | `"sunrise"`  |
| `pattern`              | `"arrow-up" \| "diagonal" \| "snake" \| "ripple"` | `"arrow-up"` |
| `rows`                 | `number`                                    | `3`          |
| `cols`                 | `number`                                    | `3`          |
| `cellSize`             | `number` (px)                               | `4`          |
| `cellGap`              | `number` (px)                               | `2`          |
| `cellRadius`           | `number` (px)                               | `1`          |
| `period`               | `number` (ms per sweep)                     | `750`        |
| `dim`                  | `number` (0..1 resting opacity)             | `0`          |
| `colorBy`              | `"path" \| "row"`                           | `"path"`     |
| `label`                | `string` (aria-label)                       | `"Loading"`  |
| `respectReducedMotion` | `boolean`                                   | `true`       |

Plus any `HTMLAttributes<HTMLSpanElement>` — `className`, `style`, etc.

**Presets** (shared with gradient-shimmer): `sunrise` · `bubble` · `peach` ·
`tonic` · `mint` · `spring` · `twilight` · `bay`. Exported as
`gradientPresets`; the OKLab sampler is exported as `sampleGradient(stops, t)`.

## How the patterns work

Each pattern is a distance function `d(row, col)`; cells at equal distance
form the wavefront, and a cell's animation delay is `-(d / (max + 1)) ×
period`:

- **arrow-up** — chevron fold across the center column: `(rows−1−row) + |col−center|`
- **diagonal** — `row + col`
- **snake** — boustrophedon index from the bottom-left
- **ripple** — Chebyshev distance from the center (expanding square rings)

## Development

```sh
pnpm install
pnpm --dir site dev   # demo site at localhost:3021, aliased to library source
pnpm build            # tsup → dist (ESM + CJS + dts)
pnpm smoke:pack       # pack the tarball into a temp React 18 consumer
```

## License

MIT © [ziye](https://x.com/mona_biasia)

import type { GradientStop } from "./types"

function hexChannel(hex: string, offset: number) {
  return Number.parseInt(hex.slice(offset, offset + 2), 16)
}

function srgbToLinear(value: number) {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function linearToSrgb(value: number) {
  const clamped = Math.min(Math.max(value, 0), 1)
  return clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055
}

interface Oklab {
  l: number
  a: number
  b: number
}

function hexToOklab(hex: string): Oklab {
  const normalized = hex.replace(/^#/, "")
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized
  const r = srgbToLinear(hexChannel(expanded, 0) / 255)
  const g = srgbToLinear(hexChannel(expanded, 2) / 255)
  const b = srgbToLinear(hexChannel(expanded, 4) / 255)
  const lmsL = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const lmsM = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const lmsS = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return {
    l: 0.2104542553 * lmsL + 0.793617785 * lmsM - 0.0040720468 * lmsS,
    a: 1.9779984951 * lmsL - 2.428592205 * lmsM + 0.4505937099 * lmsS,
    b: 0.0259040371 * lmsL + 0.7827717662 * lmsM - 0.808675766 * lmsS,
  }
}

function oklabToRgbString({ l, a, b }: Oklab): string {
  const lmsL = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const lmsM = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const lmsS = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const r = linearToSrgb(4.0767416621 * lmsL - 3.3077115913 * lmsM + 0.2309699292 * lmsS)
  const g = linearToSrgb(-1.2684380046 * lmsL + 2.6097574011 * lmsM - 0.3413193965 * lmsS)
  const bl = linearToSrgb(-0.0041960863 * lmsL - 0.7034186147 * lmsM + 1.707614701 * lmsS)
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(bl * 255)})`
}

/**
 * Sample a color at `t` (0..1) from gradient stops. Interpolates in OKLab —
 * straight sRGB lerp detours through desaturated gray between hue families.
 */
export function sampleGradient(stops: readonly GradientStop[], t: number): string {
  if (stops.length === 0) return "currentColor"
  const sorted = [...stops].sort((a, b) => a.position - b.position)
  const clamped = Math.min(Math.max(t, sorted[0].position), sorted[sorted.length - 1].position)
  let lower = sorted[0]
  let upper = sorted[sorted.length - 1]
  for (let index = 0; index < sorted.length - 1; index++) {
    if (clamped >= sorted[index].position && clamped <= sorted[index + 1].position) {
      lower = sorted[index]
      upper = sorted[index + 1]
      break
    }
  }
  const span = upper.position - lower.position
  const mix = span === 0 ? 0 : (clamped - lower.position) / span
  const from = hexToOklab(lower.color)
  const to = hexToOklab(upper.color)
  return oklabToRgbString({
    l: from.l + (to.l - from.l) * mix,
    a: from.a + (to.a - from.a) * mix,
    b: from.b + (to.b - from.b) * mix,
  })
}

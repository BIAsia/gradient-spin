import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"

// Register once. SplitText + ScrollTrigger ship in the main gsap package
// (free since 3.13), so no extra license/bundle plumbing on the site.
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

// Conditional refs (copy check, slider value) and StrictMode's double-invoke
// produce harmless "target not found" noise — quiet it.
gsap.config({ nullTargetWarn: false })

/** True when the user asked for reduced motion. Mirrors the library's own gate. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

export { gsap, ScrollTrigger, SplitText, useGSAP }

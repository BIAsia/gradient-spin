import Lenis from "lenis"
import { useEffect } from "react"
import { gsap, ScrollTrigger, prefersReducedMotion } from "./gsap"

/**
 * Inertial smooth scrolling (Lenis) driven off GSAP's ticker so ScrollTrigger
 * stays perfectly in sync. Disabled under reduced motion — native scroll only.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true })
    lenis.on("scroll", ScrollTrigger.update)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])
}

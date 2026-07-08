import type { RefObject } from "react"
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "./gsap"

/**
 * Orchestrates the whole page: entrance choreography (runs on mount) plus
 * scroll-linked reveals. Everything is built inside a GSAP scope so `useGSAP`
 * reverts it cleanly across StrictMode re-mounts.
 *
 * Initial hidden states live in CSS (`.motion-ready [data-enter]` etc.) so there
 * is no flash before this runs — and if JS never runs, content stays visible.
 */
export function usePageMotion(scope: RefObject<HTMLElement | null>, revealKey: number = 0) {
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      document.documentElement.classList.add("motion-ready")

      // --- Scroll-linked reveals (built every run; useGSAP reverts the old set) ---
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 86%",
        onEnter: (els) =>
          gsap.to(els, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.08,
            overwrite: true,
          }),
      })

      ScrollTrigger.batch("[data-prop-row]", {
        start: "top 92%",
        onEnter: (els) =>
          gsap.to(els, {
            autoAlpha: 1,
            x: 0,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.04,
            overwrite: true,
          }),
      })

      // --- Entrance: plays immediately on mount, top → bottom, ~500ms total ---
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

      // Use element refs (not a selector) so we can clear the inline transform
      // GSAP leaves behind — otherwise it outranks the CSS `:hover` lift and the
      // buttons never move on hover.
      const navPills = gsap.utils.toArray<HTMLElement>(
        scope.current?.querySelectorAll("[data-nav] .pill-link") ?? []
      )
      tl.fromTo(
        navPills,
        { y: -12, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.3,
          stagger: { amount: 0.08 },
          onComplete: () => gsap.set(navPills, { clearProps: "transform" }),
        },
        0
      )

      // The hero word reveals with a soft blur-in (no clip/wipe), then the
      // shimmer ignites.
      const title = scope.current?.querySelector<HTMLElement>("[data-hero-title]")
      if (title) {
        tl.fromTo(
          title,
          { autoAlpha: 0, filter: "blur(12px)", yPercent: 6 },
          { autoAlpha: 1, filter: "blur(0px)", yPercent: 0, duration: 0.5 },
          0.05
        )
      }

      // The swatch row — and the swatches inside it — ride in with the hero items.
      tl.to(
        "[data-hero-item]",
        { y: 0, autoAlpha: 1, duration: 0.28, stagger: { amount: 0.08 } },
        0.13
      )
    },
    { scope, dependencies: [revealKey] }
  )
}

import { useEffect, useState } from "react"

type Theme = "light" | "dark"
const KEY = "gspin-theme"

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme)
}

function initialTheme(): Theme {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem(KEY) as Theme | null
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/** Light/dark toggle. Crossfades the whole page via the View Transitions API. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    apply(theme)
    localStorage.setItem(KEY, theme)
  }, [theme])

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark"
    const start = () => setTheme(next)
    if (document.startViewTransition) document.startViewTransition(start)
    else start()
  }

  return (
    <button
      type="button"
      className="pill-link theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <circle cx="8" cy="8" r="3.2" />
      <path d="M8 .8v1.8M8 13.4v1.8M2.1 2.1l1.3 1.3M12.6 12.6l1.3 1.3M.8 8h1.8M13.4 8h1.8M2.1 13.9l1.3-1.3M12.6 3.4l1.3-1.3" />
    </svg>
  )
}

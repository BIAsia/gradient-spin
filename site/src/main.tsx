import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import { startFaviconSpin } from "./favicon-spin"
import "./styles.css"

// Resolve the theme before first paint so there's no light/dark flash.
const stored = localStorage.getItem("gspin-theme")
const theme =
  stored === "light" || stored === "dark"
    ? stored
    : window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
document.documentElement.setAttribute("data-theme", theme)

// Tab icon runs the same wave as the page (no-op under reduced motion).
startFaviconSpin()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

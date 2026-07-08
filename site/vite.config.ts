import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// The demo always consumes the library SOURCE (not dist/) so the site is a
// live integration test — same dogfooding alias as gradient-shimmer.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "gradient-spin": path.resolve(__dirname, "../src/index.ts"),
    },
  },
  server: {
    port: 3021,
    fs: { allow: [path.resolve(__dirname, "..")] },
  },
})

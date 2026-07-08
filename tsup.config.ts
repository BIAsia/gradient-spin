import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: false,
  treeshake: true,
  target: "es2020",
  external: ["react", "react-dom"],
  // The "use client" directive is re-added after bundling by
  // scripts/add-use-client.mjs — esbuild strips module-level directives, and a
  // banner is unreliable, so we prepend it post-build (see the build script).
})

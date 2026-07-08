// esbuild strips module-level "use client" directives when bundling, so we
// re-add it to the built entry files. Required for React Server Components
// (Next.js App Router): the component uses hooks + the Web Animations API.
import { readFileSync, writeFileSync } from "node:fs"

const DIRECTIVE = '"use client";\n'

for (const file of ["dist/index.js", "dist/index.cjs"]) {
  const contents = readFileSync(file, "utf8")
  if (!contents.startsWith('"use client"') && !contents.startsWith("'use client'")) {
    writeFileSync(file, DIRECTIVE + contents)
  }
}

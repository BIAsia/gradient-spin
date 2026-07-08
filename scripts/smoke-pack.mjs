import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { join } from "node:path"
import { tmpdir } from "node:os"

const root = fileURLToPath(new URL("..", import.meta.url))
const workdir = join(tmpdir(), `gradient-spin-smoke-${Date.now()}`)
const packDir = join(workdir, "pack")
const consumerDir = join(workdir, "consumer")

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, npm_config_fund: "false", npm_config_audit: "false" },
  })
}

function capture(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, npm_config_fund: "false", npm_config_audit: "false" },
  })
}

mkdirSync(packDir, { recursive: true })
mkdirSync(consumerDir, { recursive: true })

try {
  run("npm", ["run", "build"], root)
  const packJson = capture(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", packDir],
    root
  )
  const [{ filename }] = JSON.parse(packJson)
  const tarball = join(packDir, filename)
  if (!existsSync(tarball)) throw new Error(`Packed tarball was not created: ${tarball}`)

  writeFileSync(
    join(consumerDir, "package.json"),
    JSON.stringify(
      {
        private: true,
        type: "module",
        dependencies: {
          "@types/react": "18.3.18",
          "gradient-spin": `file:${tarball}`,
          react: "18.3.1",
          "react-dom": "18.3.1",
          typescript: "^5.5.0",
        },
      },
      null,
      2
    )
  )

  run("npm", ["install", "--ignore-scripts"], consumerDir)

  writeFileSync(
    join(consumerDir, "esm.mjs"),
    `import { GradientSpin, gradientPresets, sampleGradient, spinPatterns } from "gradient-spin"

if (typeof GradientSpin !== "function") throw new Error("GradientSpin ESM export missing")
if (Object.keys(gradientPresets).length < 1) throw new Error("gradientPresets ESM export missing")
if (spinPatterns.length !== 4) throw new Error("spinPatterns ESM export missing")
const color = sampleGradient([{ color: "#B6D3EF", position: 0 }, { color: "#F888A0", position: 1 }], 0.5)
if (!color.startsWith("rgb(")) throw new Error("sampleGradient did not return an rgb() color")
`
  )

  writeFileSync(
    join(consumerDir, "cjs.cjs"),
    `const pkg = require("gradient-spin")

if (typeof pkg.GradientSpin !== "function") throw new Error("GradientSpin CJS export missing")
if (typeof pkg.sampleGradient !== "function") throw new Error("sampleGradient CJS export missing")
`
  )

  writeFileSync(
    join(consumerDir, "typecheck.tsx"),
    `import { GradientSpin, type GradientSpinProps } from "gradient-spin"

const props: GradientSpinProps = {
  gradient: "sunrise",
  pattern: "snake",
  rows: 5,
  cols: 7,
  period: 900,
  label: "Loading older messages",
  id: "feed-spinner",
}

export const node = <GradientSpin {...props} data-state="loading" />
`
  )

  writeFileSync(
    join(consumerDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
        },
        include: ["typecheck.tsx"],
      },
      null,
      2
    )
  )

  run("node", ["esm.mjs"], consumerDir)
  run("node", ["cjs.cjs"], consumerDir)
  run("npx", ["tsc", "--noEmit"], consumerDir)
  console.log(`smoke ok: ${filename}`)
} finally {
  if (!process.env.KEEP_GRADIENT_SHIMMER_SMOKE) {
    rmSync(workdir, { recursive: true, force: true })
  } else {
    console.log(`kept smoke workspace: ${workdir}`)
  }
}

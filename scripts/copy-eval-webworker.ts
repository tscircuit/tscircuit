import { existsSync } from "node:fs"
import { copyFile, mkdir } from "node:fs/promises"
import { join } from "node:path"

const src = join(
  import.meta.dirname,
  "../node_modules/@tscircuit/eval/dist/webworker/entrypoint.js",
)
const destDir = join(import.meta.dirname, "../dist")
const dest = join(destDir, "webworker.min.js")

if (existsSync(src)) {
  await mkdir(destDir, { recursive: true })
  await copyFile(src, dest)
} else {
  console.warn(
    `[tscircuit] Eval webworker source not found at "${src}". Ensure @tscircuit/eval is installed.`,
  )
}

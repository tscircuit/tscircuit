import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const src = join(import.meta.dirname, "../node_modules/@tscircuit/eval/dist/webworker/entrypoint.js")
const wasmPath = require.resolve("@tscircuit/krt-wasm/pkg-node/grid_router_bg.wasm")
const [worker, wasm] = await Promise.all([readFile(src), readFile(wasmPath)])

// Eval embeds the Node/browser-compatible KRT loader and its base64 WASM.
if (!worker.includes(wasm.toString("base64"))) {
  throw new Error(
    "The eval worker does not embed the installed @tscircuit/krt-wasm binary. Align the eval and tscircuit KRT versions before publishing.",
  )
}

const destDir = join(import.meta.dirname, "../dist")
await mkdir(destDir, { recursive: true })
await writeFile(join(destDir, "webworker.min.js"), worker)

import { access, mkdir, writeFile, readFile } from "fs/promises"
import { join } from "node:path"

const PLACEHOLDER = '"<--INJECT_TSCIRCUIT_EVAL_WEB_WORKER_BLOB_URL-->"'
const PLACEHOLDER_RE = /"<--INJECT_TSCIRCUIT_EVAL_WEB_WORKER_BLOB_URL-->"/g

const src = join(
  import.meta.dirname,
  "../node_modules/@tscircuit/runframe/dist/standalone.min.js",
)
const workerPath = join(
  import.meta.dirname,
  "../node_modules/@tscircuit/eval/dist/webworker/entrypoint.js",
)
const destDir = join(import.meta.dirname, "../dist")
const dest = join(destDir, "browser.min.js")

async function assertReadable(path: string, label: string) {
  try {
    await access(path)
  } catch {
    throw new Error(
      `Missing ${label} at ${path}. Run bun install before building.`,
    )
  }
}

await assertReadable(src, "@tscircuit/runframe standalone bundle")
await assertReadable(workerPath, "@tscircuit/eval webworker entrypoint")

const content = await readFile(src, "utf-8")
const placeholderMatches = content.match(PLACEHOLDER_RE)?.length ?? 0

if (placeholderMatches === 0) {
  throw new Error(
    `Runframe standalone bundle is missing the expected worker placeholder ${PLACEHOLDER}. ` +
      `Refusing to publish a broken browser.min.js. Check @tscircuit/runframe compatibility.`,
  )
}

const workerJs = await readFile(workerPath, "utf-8")
const base64Worker = Buffer.from(workerJs).toString("base64")
const workerBlobUrl = `URL.createObjectURL(new Blob([atob("${base64Worker}")], { type: 'application/javascript' }))`

// Replace the quoted placeholder (including the surrounding quotes) with the JS expression
const modifiedContent = content.replace(PLACEHOLDER_RE, workerBlobUrl)

const leftover = modifiedContent.match(PLACEHOLDER_RE)?.length ?? 0
if (leftover > 0) {
  throw new Error(
    `Failed to inject eval webworker blob URL: ${leftover} placeholder(s) remain after replacement.`,
  )
}

if (!modifiedContent.includes("URL.createObjectURL(new Blob([atob(")) {
  throw new Error(
    "Worker blob URL injection produced a bundle without the expected createObjectURL(atob(...)) expression.",
  )
}

await mkdir(destDir, { recursive: true })
await writeFile(dest, modifiedContent)

console.log(
  `Injected eval webworker into browser.min.js (${placeholderMatches} placeholder(s) replaced)`,
)

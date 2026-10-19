import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

export function injectWebWorkerBlobUrl(
  standaloneContent: string,
  workerJs: string,
): string {
  const base64Worker = Buffer.from(workerJs).toString("base64")
  const workerBlobUrl = `URL.createObjectURL(new Blob([atob("${base64Worker}")], { type: 'application/javascript' }))`

  return standaloneContent.replace(
    /"<--INJECT_TSCIRCUIT_EVAL_WEB_WORKER_BLOB_URL-->"/g,
    workerBlobUrl,
  )
}

async function run() {
  const src = join(
    import.meta.dirname,
    "../node_modules/@tscircuit/runframe/dist/standalone.min.js",
  )
  const destDir = join(import.meta.dirname, "../dist")
  const dest = join(destDir, "browser.min.js")

  if (!existsSync(src)) {
    console.warn(
      `[WARN] Source runframe standalone not found at ${src}, skipping copy.`,
    )
    return
  }

  const content = await readFile(src, "utf-8")

  const workerPath = join(
    import.meta.dirname,
    "../node_modules/@tscircuit/eval/dist/webworker/entrypoint.js",
  )
  let workerJs = ""
  if (existsSync(workerPath)) {
    workerJs = await readFile(workerPath, "utf-8")
  } else {
    console.warn(
      `[WARN] Webworker entrypoint not found at ${workerPath}, embedding empty worker stub.`,
    )
  }

  const modifiedContent = injectWebWorkerBlobUrl(content, workerJs)

  await mkdir(destDir, { recursive: true })
  await writeFile(dest, modifiedContent)
  console.log(
    `[INFO] Successfully copied and injected standalone bundle to ${dest}`,
  )
}

if (import.meta.main) {
  run().catch((err) => {
    console.error("[ERROR] Failed to copy runframe standalone bundle:", err)
    process.exit(1)
  })
}

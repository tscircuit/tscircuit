import { expect, test } from "bun:test"
import { access, readFile } from "node:fs/promises"
import { join } from "node:path"
import { $ } from "bun"

const root = join(import.meta.dirname, "..")
const browserBundle = join(root, "dist", "browser.min.js")
const placeholder = "<--INJECT_TSCIRCUIT_EVAL_WEB_WORKER_BLOB_URL-->"

test("copy-runframe-standalone injects worker blob and leaves no placeholder", async () => {
  const result = await $`bun run scripts/copy-runframe-standalone.ts`.cwd(root)
  expect(result.exitCode).toBe(0)

  await access(browserBundle)
  const content = await readFile(browserBundle, "utf-8")

  expect(content.includes(placeholder)).toBe(false)
  const injectedBlobMarker = "URL.createObjectURL(new Blob([atob("
  expect(content.includes(injectedBlobMarker)).toBe(true)
}, 60_000)

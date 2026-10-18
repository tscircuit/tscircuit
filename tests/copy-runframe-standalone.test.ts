import { expect, test } from "bun:test"
import { existsSync } from "node:fs"
import { readFile, stat } from "node:fs/promises"
import { join } from "node:path"

test("copy-runframe-standalone replaces eval worker placeholder and writes browser bundle", async () => {
  const projectRoot = join(import.meta.dirname, "..")
  const scriptPath = join(projectRoot, "scripts", "copy-runframe-standalone.ts")
  const destPath = join(projectRoot, "dist", "browser.min.js")

  // Execute the standalone bundling script
  const proc = Bun.spawnSync([process.execPath, "run", scriptPath], {
    cwd: projectRoot,
  })
  expect(proc.exitCode).toBe(0)

  // Verify the bundle exists
  expect(existsSync(destPath)).toBe(true)

  // Verify file size is substantial (> 100KB)
  const stats = await stat(destPath)
  expect(stats.size).toBeGreaterThan(100_000)

  // Verify placeholder token is completely removed
  const bundleContent = await readFile(destPath, "utf-8")
  expect(bundleContent).not.toContain("<--INJECT_TSCIRCUIT_EVAL_WEB_WORKER_BLOB_URL-->")

  // Verify the worker blob instantiation code is injected
  expect(bundleContent).toContain("URL.createObjectURL(new Blob([atob(")
}, 30_000)

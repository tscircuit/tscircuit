import { expect, test } from "bun:test"
import { existsSync } from "node:fs"
import { readFile, stat } from "node:fs/promises"
import { join } from "node:path"

test("copy-eval-webworker copies eval webworker entrypoint to dist/webworker.min.js", async () => {
  const projectRoot = join(import.meta.dirname, "..")
  const scriptPath = join(projectRoot, "scripts", "copy-eval-webworker.ts")
  const srcPath = join(
    projectRoot,
    "node_modules",
    "@tscircuit",
    "eval",
    "dist",
    "webworker",
    "entrypoint.js",
  )
  const destPath = join(projectRoot, "dist", "webworker.min.js")

  // Execute the copy-eval-webworker script
  const proc = Bun.spawnSync([process.execPath, "run", scriptPath], {
    cwd: projectRoot,
  })
  expect(proc.exitCode).toBe(0)

  // Verify the destination webworker bundle exists
  expect(existsSync(destPath)).toBe(true)

  // Verify file has non-zero size
  const stats = await stat(destPath)
  expect(stats.size).toBeGreaterThan(0)

  // If source exists in node_modules, verify the content matches exactly
  if (existsSync(srcPath)) {
    const srcContent = await readFile(srcPath, "utf-8")
    const destContent = await readFile(destPath, "utf-8")
    expect(destContent).toBe(srcContent)
  }

  // Verify running again is idempotent and exits cleanly
  const secondRun = Bun.spawnSync([process.execPath, "run", scriptPath], {
    cwd: projectRoot,
  })
  expect(secondRun.exitCode).toBe(0)
}, 30_000)

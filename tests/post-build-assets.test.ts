import { expect, test } from "bun:test"
import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

test("post-build-assets copies static asset definitions and references globals", async () => {
  const projectRoot = join(import.meta.dirname, "..")
  const distDir = join(projectRoot, "dist")
  const staticAssetsDist = join(distDir, "static-assets.d.ts")
  const indexDts = join(distDir, "index.d.ts")

  // Ensure index.d.ts exists (create a dummy if not yet built)
  const initialContent = existsSync(indexDts)
    ? await readFile(indexDts, "utf-8")
    : "export * from './index';\n"
  await writeFile(indexDts, initialContent)

  // Run the post-build script
  const proc = Bun.spawnSync([process.execPath, "run", "scripts/post-build-assets.ts"], {
    cwd: projectRoot,
  })
  expect(proc.exitCode).toBe(0)

  // Verify static-assets.d.ts was copied to dist
  expect(existsSync(staticAssetsDist)).toBe(true)
  const staticAssetsOriginal = await readFile(
    join(projectRoot, "types/static-assets.d.ts"),
    "utf-8",
  )
  const staticAssetsCopied = await readFile(staticAssetsDist, "utf-8")
  expect(staticAssetsCopied).toBe(staticAssetsOriginal)

  // Verify index.d.ts has reference
  const updatedContent = await readFile(indexDts, "utf-8")
  expect(updatedContent).toStartWith('/// <reference path="../globals.d.ts" />')

  // Run again to verify idempotency (no duplicate reference lines)
  const proc2 = Bun.spawnSync([process.execPath, "run", "scripts/post-build-assets.ts"], {
    cwd: projectRoot,
  })
  expect(proc2.exitCode).toBe(0)

  const contentAfterSecondRun = await readFile(indexDts, "utf-8")
  const referenceMatches = contentAfterSecondRun.match(
    /\/\/\/ <reference path="\.\.\/globals\.d\.ts" \/>/g,
  )
  expect(referenceMatches?.length).toBe(1)
})

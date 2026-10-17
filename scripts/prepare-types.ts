import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const distDir = join(import.meta.dirname, "../dist")
const staticAssetsSrc = join(import.meta.dirname, "../types/static-assets.d.ts")
const staticAssetsDest = join(distDir, "static-assets.d.ts")
const indexDtsPath = join(distDir, "index.d.ts")

await mkdir(distDir, { recursive: true })

// 1. Copy static-assets.d.ts into dist/
await copyFile(staticAssetsSrc, staticAssetsDest)

// 2. Prepend global types reference to dist/index.d.ts
const referenceDirective = '/// <reference path="../globals.d.ts" />\n'
try {
  const currentContent = await readFile(indexDtsPath, "utf-8")
  if (!currentContent.includes(referenceDirective.trim())) {
    await writeFile(indexDtsPath, referenceDirective + currentContent, "utf-8")
  }
} catch (error) {
  console.warn("Could not prepend reference to dist/index.d.ts:", error)
}

import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join } from "node:path"

const projectRoot = join(import.meta.dirname, "..")
const distDir = join(projectRoot, "dist")
const staticAssetsSrc = join(projectRoot, "types", "static-assets.d.ts")
const staticAssetsDest = join(distDir, "static-assets.d.ts")
const indexDts = join(distDir, "index.d.ts")

await mkdir(distDir, { recursive: true })

if (existsSync(staticAssetsSrc)) {
  await copyFile(staticAssetsSrc, staticAssetsDest)
}

if (existsSync(indexDts)) {
  const content = await readFile(indexDts, "utf-8")
  const referenceDirective = '/// <reference path="../globals.d.ts" />'
  if (!content.includes(referenceDirective)) {
    await writeFile(indexDts, `${referenceDirective}\n${content}`)
  }
}

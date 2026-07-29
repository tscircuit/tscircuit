import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const REFERENCE_LINE = '/// <reference path="../globals.d.ts" />'
const root = join(import.meta.dirname, "..")
const distDir = join(root, "dist")
const indexDtsPath = join(distDir, "index.d.ts")
const globalsPath = join(root, "globals.d.ts")
const staticAssetsDest = join(distDir, "static-assets.d.ts")

async function assertExists(path: string, label: string) {
  try {
    await access(path)
  } catch {
    throw new Error(`Missing ${label} at ${path}`)
  }
}

await assertExists(indexDtsPath, "generated dist/index.d.ts")
await assertExists(globalsPath, "globals.d.ts")

const original = await readFile(indexDtsPath, "utf-8")
const trimmed = original.replace(/^\uFEFF/, "")

let next = trimmed
if (!trimmed.startsWith(REFERENCE_LINE)) {
  // Drop any prior accidental duplicate reference lines, then prepend once.
  const withoutRefs = trimmed
    .split("\n")
    .filter((line) => line.trim() !== REFERENCE_LINE)
    .join("\n")
  next = `${REFERENCE_LINE}\n${withoutRefs}`
}

await mkdir(distDir, { recursive: true })
await writeFile(indexDtsPath, next)

// Keep published static asset module typings identical to globals.d.ts so the
// two copies cannot drift across releases.
await copyFile(globalsPath, staticAssetsDest)

console.log(
  trimmed.startsWith(REFERENCE_LINE)
    ? "dist/index.d.ts already references globals.d.ts"
    : "Prepended globals.d.ts reference to dist/index.d.ts",
)
console.log("Synced dist/static-assets.d.ts from globals.d.ts")

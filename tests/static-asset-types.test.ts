import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

test("globals.d.ts and types/static-assets.d.ts declare matching ambient static assets", async () => {
  const globalsPath = join(import.meta.dirname, "../globals.d.ts")
  const staticAssetsPath = join(
    import.meta.dirname,
    "../types/static-assets.d.ts",
  )

  const globalsContent = await readFile(globalsPath, "utf-8")
  const staticAssetsContent = await readFile(staticAssetsPath, "utf-8")

  expect(globalsContent.trim()).toBe(staticAssetsContent.trim())
})

test("ambient declarations include all supported CAD and graphic asset extensions", async () => {
  const globalsPath = join(import.meta.dirname, "../globals.d.ts")
  const content = await readFile(globalsPath, "utf-8")

  const expectedModulePatterns = [
    'declare module "*.obj"',
    'declare module "*.stl"',
    'declare module "*.kicad_mod"',
    'declare module "*.kicad_sym"',
    'declare module "*.kicad_pcb"',
    'declare module "*.glb"',
    'declare module "*.gltf"',
    'declare module "*.step"',
    'declare module "*.stp"',
    'declare module "*.svg"',
  ]

  for (const pattern of expectedModulePatterns) {
    expect(content).toContain(pattern)
  }
})

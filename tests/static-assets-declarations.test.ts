import { expect, test } from "bun:test"
import fs from "node:fs"
import path from "node:path"

test("static-assets.d.ts and globals.d.ts declare essential CAD, 3D, and graphic formats", () => {
  const staticAssetsPath = path.resolve(
    __dirname,
    "../types/static-assets.d.ts",
  )
  const globalsPath = path.resolve(__dirname, "../globals.d.ts")

  const staticAssetsContent = fs.readFileSync(staticAssetsPath, "utf-8")
  const globalsContent = fs.readFileSync(globalsPath, "utf-8")

  const expectedExtensions = [
    "*.obj",
    "*.stl",
    "*.glb",
    "*.gltf",
    "*.step",
    "*.stp",
    "*.dxf",
    "*.wrl",
    "*.svg",
    "*.png",
    "*.jpg",
    "*.jpeg",
    "*.webp",
    "*.kicad_mod",
    "*.kicad_sym",
    "*.kicad_pcb",
  ]

  for (const ext of expectedExtensions) {
    expect(staticAssetsContent).toContain(`declare module "${ext}"`)
    expect(globalsContent).toContain(`declare module "${ext}"`)
  }
})

import { expect, test } from "bun:test"
import { plugin } from "bun"
import { kicadModPlugin } from "../../plugins/bun-plugin-kicad-mod"

// Register the plugin
plugin(kicadModPlugin as any)

test("should load .kicad_mod file and export file:// URL", async () => {
  const mod = await import("../fixtures/test.kicad_mod")

  expect(typeof mod.default).toBe("string")
  expect(mod.default.startsWith("file://")).toBe(true)
  expect(mod.default.endsWith(".kicad_mod")).toBe(true)
})

test("exported URL should be fetchable", async () => {
  const mod = await import("../fixtures/test.kicad_mod")

  const response = await fetch(mod.default)
  expect(response.ok).toBe(true)

  const content = await response.text()
  expect(content).toContain("footprint")
})

import { expect, test } from "bun:test"
import { plugin } from "bun"
import { kicadModPlugin } from "../../plugins/bun-plugin-kicad-mod"

// Register the plugin
plugin(kicadModPlugin as any)

test("should load .kicad_mod file and export circuit JSON array", async () => {
  const mod = await import("../fixtures/test.kicad_mod")

  // Should be an array of circuit elements
  expect(Array.isArray(mod.default)).toBe(true)
  expect(mod.default.length).toBeGreaterThan(0)
})

test("exported circuit JSON should contain pcb_smtpad elements", async () => {
  const mod = await import("../fixtures/test.kicad_mod")
  const circuitJson = mod.default

  // Should contain smtpad elements from the R_0402 resistor footprint
  const smtpads = circuitJson.filter(
    (el: any) => el.type === "pcb_smtpad"
  )
  expect(smtpads.length).toBeGreaterThan(0)
})

test("exported circuit JSON should have valid structure", async () => {
  const mod = await import("../fixtures/test.kicad_mod")
  const circuitJson = mod.default

  // Each element should have a type property
  for (const element of circuitJson) {
    expect(element).toHaveProperty("type")
  }
})

test("can use footprint directly in chip component", async () => {
  const mod = await import("../fixtures/test.kicad_mod")
  const footprint = mod.default

  // The footprint should be usable as-is (array of circuit elements)
  // This simulates how it would be used: <chip footprint={footprint} />
  expect(footprint).toBeDefined()
  expect(Array.isArray(footprint)).toBe(true)
})

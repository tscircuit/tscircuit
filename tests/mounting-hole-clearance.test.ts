import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getMountingHoleClearances } from "../src/mounting-hole-clearance"

test("getMountingHoleClearances: handles empty circuit", () => {
  const result = getMountingHoleClearances([])
  expect(result.totalMountingHoles).toBe(0)
  expect(result.encroachmentsCount).toBe(0)
  expect(result.allClear).toBe(true)
})

test("getMountingHoleClearances: detects clearance encroachment around mounting hole", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_hole",
      pcb_hole_id: "m_hole1",
      hole_diameter: 3.0, // radius = 1.5, required keepout with 1.5 margin = 3.0mm
      x: 10,
      y: 10,
    },
    // Safe via 5mm away
    {
      type: "pcb_via",
      pcb_via_id: "via_safe",
      x: 15,
      y: 10,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top", "bottom"],
    },
    // Encroaching via 2mm away (< 3.0mm)
    {
      type: "pcb_via",
      pcb_via_id: "via_violating",
      x: 12,
      y: 10,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top", "bottom"],
    },
  ]

  const report = getMountingHoleClearances(circuitJson, {
    keepoutMarginMm: 1.5,
  })
  expect(report.totalMountingHoles).toBe(1)
  expect(report.allClear).toBe(false)
  expect(report.encroachmentsCount).toBe(1)
  expect(report.encroachments[0].encroachingElementId).toBe("via_violating")
  expect(report.encroachments[0].distanceMm).toBe(2)
  expect(report.encroachments[0].requiredKeepoutMm).toBe(3)
})

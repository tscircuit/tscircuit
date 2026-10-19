import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getDrillSummary } from "../index"

test("getDrillSummary aggregates hole sizes by diameter and plating", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_via",
      pcb_via_id: "v1",
      x: 0,
      y: 0,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_via",
      pcb_via_id: "v2",
      x: 2,
      y: 0,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "ph1",
      x: 10,
      y: 0,
      outer_diameter: 1.6,
      hole_diameter: 1.0,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_hole",
      pcb_hole_id: "h1",
      x: 20,
      y: 20,
      hole_diameter: 3.2, // Mounting hole (unplated)
    },
  ]

  const summary = getDrillSummary(circuitJson)

  expect(summary.totalHoleCount).toBe(4)
  expect(summary.totalViaCount).toBe(2)
  expect(summary.totalPlatedHoleCount).toBe(1)
  expect(summary.totalUnplatedHoleCount).toBe(1)

  expect(summary.tools.length).toBe(3)

  // 0.3mm plated (vias)
  expect(summary.tools[0].diameterMm).toBe(0.3)
  expect(summary.tools[0].isPlated).toBe(true)
  expect(summary.tools[0].count).toBe(2)
  expect(summary.tools[0].holeTypes).toEqual(["via"])

  // 1.0mm plated (through-hole component)
  expect(summary.tools[1].diameterMm).toBe(1.0)
  expect(summary.tools[1].isPlated).toBe(true)
  expect(summary.tools[1].count).toBe(1)

  // 3.2mm unplated (mounting hole)
  expect(summary.tools[2].diameterMm).toBe(3.2)
  expect(summary.tools[2].isPlated).toBe(false)
  expect(summary.tools[2].count).toBe(1)
})

import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getPcbPadSummary } from "../index"

test("getPcbPadSummary calculates pad counts, shapes, and layer distribution", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad1",
      shape: "rect",
      layer: "top",
      x: 0,
      y: 0,
      width: 1,
      height: 2,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad2",
      shape: "circle",
      layer: "bottom",
      x: 5,
      y: 0,
      radius: 0.5,
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "ph1",
      shape: "circle",
      layers: ["top", "bottom"],
      x: 10,
      y: 0,
      hole_diameter: 0.8,
      outer_diameter: 1.6,
    },
  ]

  const summary = getPcbPadSummary(circuitJson)

  expect(summary.totalPads).toBe(3)
  expect(summary.smtPadCount).toBe(2)
  expect(summary.throughHolePadCount).toBe(1)

  expect(summary.padsByShape.rect).toBe(1)
  expect(summary.padsByShape.circle).toBe(2)

  expect(summary.padsByLayer.top).toBe(2) // 1 smtpad + 1 plated hole
  expect(summary.padsByLayer.bottom).toBe(2) // 1 smtpad + 1 plated hole
})

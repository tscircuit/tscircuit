import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getPadCountSummary } from "../src/pad-count-summary"

test("getPadCountSummary correctly classifies and tallies pad metrics", () => {
  const elements: AnyCircuitElement[] = [
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_1",
      pcb_component_id: "comp_U1",
      shape: "rect",
      layer: "top",
      width: 1,
      height: 2,
      x: 0,
      y: 0,
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_2",
      pcb_component_id: "comp_U1",
      shape: "circle",
      layer: "top",
      radius: 0.5,
      x: 2,
      y: 0,
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_3",
      pcb_component_id: "comp_R1",
      shape: "pill",
      layer: "bottom",
      width: 1,
      height: 3,
      x: 0,
      y: 5,
    } as any,
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "hole_1",
      pcb_component_id: "comp_CONN1",
      shape: "circle",
      hole_diameter: 1.0,
      outer_diameter: 1.6,
      x: 10,
      y: 10,
    } as any,
    {
      type: "pcb_hole",
      pcb_hole_id: "mount_hole_1",
      hole_diameter: 3.2,
      x: 0,
      y: 20,
    } as any,
  ]

  const summary = getPadCountSummary(elements)

  expect(summary.totalPads).toBe(4) // 3 SMT + 1 Plated
  expect(summary.totalSmtPads).toBe(3)
  expect(summary.totalPlatedHoles).toBe(1)
  expect(summary.totalNonPlatedHoles).toBe(1)

  // Layers
  expect(summary.smtPadsByLayer.top).toBe(2)
  expect(summary.smtPadsByLayer.bottom).toBe(1)

  // Shapes
  expect(summary.shapes.rect).toBe(1)
  expect(summary.shapes.circle).toBe(2) // 1 smt circle + 1 plated circle
  expect(summary.shapes.pill).toBe(1)

  // By component
  expect(summary.padsByComponent["comp_U1"]).toBe(2)
  expect(summary.padsByComponent["comp_R1"]).toBe(1)
  expect(summary.padsByComponent["comp_CONN1"]).toBe(1)
})

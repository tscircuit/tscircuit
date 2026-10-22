import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getComponentRotations } from "../index"

test("getComponentRotations normalizes angles and classifies orthogonal components", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_component",
      source_component_id: "sc1",
      name: "R1",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pc1",
      source_component_id: "sc1",
      center: { x: 0, y: 0 },
      rotation: 90,
      layer: "top",
      width: 2,
      height: 1,
    },
    {
      type: "source_component",
      source_component_id: "sc2",
      name: "C1",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pc2",
      source_component_id: "sc2",
      center: { x: 10, y: 0 },
      rotation: 45, // Non-orthogonal
      layer: "top",
      width: 2,
      height: 1,
    },
  ]

  const report = getComponentRotations(circuitJson)

  expect(report.components.length).toBe(2)
  expect(report.orthogonalCount).toBe(1)
  expect(report.nonOrthogonalCount).toBe(1)

  const r1 = report.components.find((c) => c.name === "R1")
  expect(r1?.rotationDeg).toBe(90)
  expect(r1?.isOrthogonal).toBe(true)

  const c1 = report.components.find((c) => c.name === "C1")
  expect(c1?.rotationDeg).toBe(45)
  expect(c1?.isOrthogonal).toBe(false)
})

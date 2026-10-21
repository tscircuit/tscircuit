import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { checkDecouplingCapProximity } from "../src/decoupling-audit"

test("checkDecouplingCapProximity: handles empty circuit", () => {
  const result = checkDecouplingCapProximity([])
  expect(result.totalChips).toBe(0)
  expect(result.totalDecouplingCaps).toBe(0)
  expect(result.allSatisfied).toBe(true)
})

test("checkDecouplingCapProximity: verifies decoupling cap proximity", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_component",
      source_component_id: "u1",
      name: "U1",
      ftype: "simple_chip",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_u1",
      source_component_id: "u1",
      center: { x: 10, y: 10 },
      layer: "top",
      rotation: 0,
      width: 8,
      height: 8,
    },
    {
      type: "source_component",
      source_component_id: "c1",
      name: "C1",
      ftype: "simple_capacitor",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_c1",
      source_component_id: "c1",
      center: { x: 12, y: 10 }, // 2mm away
      layer: "top",
      rotation: 0,
      width: 2,
      height: 1,
    },
  ]

  const report = checkDecouplingCapProximity(circuitJson, {
    maxDistanceMm: 3.0,
  })
  expect(report.totalChips).toBe(1)
  expect(report.totalDecouplingCaps).toBe(1)
  expect(report.allSatisfied).toBe(true)
  expect(report.chipAudits[0].isWithinThreshold).toBe(true)
  expect(report.chipAudits[0].nearestCapacitor?.distanceMm).toBe(2)
})

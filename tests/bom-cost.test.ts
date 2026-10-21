import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { estimateCircuitBomCost } from "../src/bom-cost"

test("estimateCircuitBomCost: handles empty circuit", () => {
  const result = estimateCircuitBomCost([])
  expect(result.totalComponents).toBe(0)
  expect(result.estimatedUnitCost).toBe(0)
  expect(result.breakdownByCategory).toEqual({})
})

test("estimateCircuitBomCost: calculates component costs with volume discounts", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_component",
      source_component_id: "r1",
      name: "R1",
      ftype: "simple_resistor",
    },
    {
      type: "source_component",
      source_component_id: "r2",
      name: "R2",
      ftype: "simple_resistor",
    },
    {
      type: "source_component",
      source_component_id: "u1",
      name: "U1",
      ftype: "simple_chip",
    },
  ]

  const singleReport = estimateCircuitBomCost(circuitJson, { volumeTier: 1 })
  expect(singleReport.totalComponents).toBe(3)
  expect(singleReport.breakdownByCategory.resistor.count).toBe(2)
  expect(singleReport.breakdownByCategory.chip.count).toBe(1)
  expect(singleReport.estimatedUnitCost).toBeCloseTo(1.27, 2)

  const volumeReport = estimateCircuitBomCost(circuitJson, { volumeTier: 100 })
  expect(volumeReport.estimatedUnitCost).toBeLessThan(
    singleReport.estimatedUnitCost,
  )
})

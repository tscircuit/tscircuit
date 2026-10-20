import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSolderPasteMaskSummary } from "../src/solder-paste-summary"

test("getSolderPasteMaskSummary: handles empty input", () => {
  const result = getSolderPasteMaskSummary([])
  expect(result.totalApertures).toBe(0)
  expect(result.totalAreaMm2).toBe(0)
  expect(result.top.apertureCount).toBe(0)
  expect(result.bottom.apertureCount).toBe(0)
})

test("getSolderPasteMaskSummary: calculates apertures and area", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad1",
      shape: "rect",
      width: 2,
      height: 3,
      x: 0,
      y: 0,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad2",
      shape: "circle",
      radius: 1, // Area = pi * 1 = ~3.142
      x: 5,
      y: 5,
      layer: "bottom",
    },
  ]

  const summary = getSolderPasteMaskSummary(circuitJson)
  expect(summary.totalApertures).toBe(2)
  expect(summary.top.apertureCount).toBe(1)
  expect(summary.top.totalAreaMm2).toBe(6)
  expect(summary.bottom.apertureCount).toBe(1)
  expect(summary.bottom.totalAreaMm2).toBeCloseTo(3.142, 2)
  expect(summary.totalAreaMm2).toBeCloseTo(9.142, 2)
})

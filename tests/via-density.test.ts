import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getViaDensityMap } from "../index"

test("getViaDensityMap calculates spatial via clusters and max density per cell", () => {
  const circuitJson: CircuitJson = [
    // 3 vias in cell [0, 10] x [0, 10]
    {
      type: "pcb_via",
      pcb_via_id: "v1",
      x: 1,
      y: 1,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
    },
    {
      type: "pcb_via",
      pcb_via_id: "v2",
      x: 2,
      y: 2,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
    },
    {
      type: "pcb_via",
      pcb_via_id: "v3",
      x: 3,
      y: 3,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
    },
    // 1 via in cell [10, 20] x [0, 10]
    {
      type: "pcb_via",
      pcb_via_id: "v4",
      x: 15,
      y: 5,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
    },
  ]

  const report = getViaDensityMap(circuitJson, 10)

  expect(report.totalVias).toBe(4)
  expect(report.maxDensityInCell).toBe(3)
  expect(report.cells.length).toBe(2)

  const denseCell = report.cells[0]
  expect(denseCell.viaCount).toBe(3)
  expect(denseCell.minX).toBe(0)
  expect(denseCell.maxX).toBe(10)
})

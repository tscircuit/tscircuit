import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getCopperPourSummary } from "../index"

test("getCopperPourSummary extracts polygon vertex count and bounding box", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: "cp1",
      layer: "bottom",
      source_net_id: "net_gnd",
      polygon_points: [
        { x: -10, y: -10 },
        { x: 10, y: -10 },
        { x: 10, y: 10 },
        { x: -10, y: 10 },
      ],
    } as any,
  ]

  const report = getCopperPourSummary(circuitJson)

  expect(report.totalPourCount).toBe(1)
  expect(report.layersWithPours).toEqual(["bottom"])

  const pour = report.pours[0]
  expect(pour.id).toBe("cp1")
  expect(pour.sourceNetId).toBe("net_gnd")
  expect(pour.polygonPointsCount).toBe(4)
  expect(pour.minX).toBe(-10)
  expect(pour.maxX).toBe(10)
  expect(pour.minY).toBe(-10)
  expect(pour.maxY).toBe(10)
})

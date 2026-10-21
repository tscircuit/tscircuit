import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSchematicBounds } from "../src/schematic-bounds"

test("getSchematicBounds: handles empty circuit", () => {
  const result = getSchematicBounds([])
  expect(result.elementCount).toBe(0)
  expect(result.width).toBe(0)
  expect(result.height).toBe(0)
  expect(result.center).toEqual({ x: 0, y: 0 })
})

test("getSchematicBounds: computes bounding box from schematic symbols and wires", () => {
  const circuitJson: CircuitJson = [
    {
      type: "schematic_component",
      schematic_component_id: "sc1",
      center: { x: 10, y: 10 },
      size: { width: 4, height: 4 }, // x: [8, 12], y: [8, 12]
      source_component_id: "src1",
    },
    {
      type: "schematic_wire",
      schematic_wire_id: "wire1",
      edges: [{ from: { x: 12, y: 10 }, to: { x: 30, y: 20 } }],
    },
  ]

  const bounds = getSchematicBounds(circuitJson)
  expect(bounds.elementCount).toBe(2)
  expect(bounds.minX).toBe(8)
  expect(bounds.maxX).toBe(30)
  expect(bounds.minY).toBe(8)
  expect(bounds.maxY).toBe(20)
  expect(bounds.width).toBe(22)
  expect(bounds.height).toBe(12)
  expect(bounds.center).toEqual({ x: 19, y: 14 })
})

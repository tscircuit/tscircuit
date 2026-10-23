import { expect, test } from "bun:test"
import { getPcbBounds } from "../index"
import type { CircuitJson } from "circuit-json"

test("getPcbBounds accurately extracts bounds from pcb_board", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "b1",
      width: 100,
      height: 50,
      center: { x: 10, y: 20 },
    },
  ]

  const bounds = getPcbBounds(circuitJson)
  expect(bounds).not.toBeNull()
  expect(bounds?.width).toBe(100)
  expect(bounds?.height).toBe(50)
  expect(bounds?.minX).toBe(-40)
  expect(bounds?.maxX).toBe(60)
  expect(bounds?.minY).toBe(-5)
  expect(bounds?.maxY).toBe(45)
  expect(bounds?.center.x).toBe(10)
  expect(bounds?.center.y).toBe(20)
})

test("getPcbBounds calculates envelope when board element is absent", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_via",
      x: -10,
      y: -20,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top"],
      pcb_via_id: "v1",
    },
    {
      type: "pcb_via",
      x: 30,
      y: 40,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top"],
      pcb_via_id: "v2",
    },
  ]

  const bounds = getPcbBounds(circuitJson)
  expect(bounds).not.toBeNull()
  expect(bounds?.minX).toBe(-10)
  expect(bounds?.maxX).toBe(30)
  expect(bounds?.minY).toBe(-20)
  expect(bounds?.maxY).toBe(40)
  expect(bounds?.width).toBe(40)
  expect(bounds?.height).toBe(60)
  expect(bounds?.center.x).toBe(10)
  expect(bounds?.center.y).toBe(10)
})

test("getPcbBounds returns null for non-pcb circuits", () => {
  const circuitJson: CircuitJson = [
    { type: "source_group", source_group_id: "sg1" },
  ]
  expect(getPcbBounds(circuitJson)).toBeNull()
})

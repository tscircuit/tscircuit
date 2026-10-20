import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getPcbBoardGeometry } from "../index"

test("getPcbBoardGeometry calculates rectangular board dimensions and area", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "b1",
      width: 50,
      height: 40,
      center: { x: 0, y: 0 },
    },
  ]

  const geo = getPcbBoardGeometry(circuitJson)
  expect(geo).not.toBeNull()
  expect(geo?.widthMm).toBe(50)
  expect(geo?.heightMm).toBe(40)
  expect(geo?.areaMm2).toBe(2000)
  expect(geo?.areaCm2).toBe(20)
  expect(geo?.perimeterMm).toBe(180)
  expect(geo?.aspectRatio).toBe(1.25) // 50 / 40
  expect(geo?.isCircular).toBe(false)
})

test("getPcbBoardGeometry calculates circular board dimensions", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "b_circ",
      radius: 20,
      center: { x: 0, y: 0 },
    } as any,
  ]

  const geo = getPcbBoardGeometry(circuitJson)
  expect(geo?.isCircular).toBe(true)
  expect(geo?.widthMm).toBe(40)
  expect(geo?.areaMm2).toBeCloseTo(1256.64, 1)
})

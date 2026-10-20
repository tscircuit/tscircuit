import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getBoardDimensions } from "../src/board-dimensions"

test("getBoardDimensions correctly handles rectangular boards", () => {
  const elements: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "board_1",
      width: 50,
      height: 30,
      center: { x: 10, y: 15 },
      num_layers: 4,
    } as any,
  ]

  const report = getBoardDimensions(elements)
  expect(report).not.toBeNull()
  expect(report!.shape).toBe("rect")
  expect(report!.widthMm).toBe(50)
  expect(report!.heightMm).toBe(30)
  expect(report!.areaMm2).toBe(1500)
  expect(report!.center).toEqual({ x: 10, y: 15 })
  expect(report!.numLayers).toBe(4)
  expect(report!.bounds).toEqual({
    minX: -15,
    maxX: 35,
    minY: 0,
    maxY: 30,
  })
})

test("getBoardDimensions correctly handles outline polygon boards", () => {
  const elements: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "board_poly",
      num_layers: 2,
      outline: [
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 40, y: 20 },
        { x: 0, y: 20 },
      ],
    } as any,
  ]

  const report = getBoardDimensions(elements)
  expect(report).not.toBeNull()
  expect(report!.shape).toBe("polygon")
  expect(report!.widthMm).toBe(40)
  expect(report!.heightMm).toBe(20)
  expect(report!.areaMm2).toBe(800)
  expect(report!.center).toEqual({ x: 20, y: 10 })
  expect(report!.bounds).toEqual({
    minX: 0,
    maxX: 40,
    minY: 0,
    maxY: 20,
  })
})

test("getBoardDimensions returns null when no pcb_board exists", () => {
  const report = getBoardDimensions([])
  expect(report).toBeNull()
})

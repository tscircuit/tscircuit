import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSilkscreenDrawingsSummary } from "../src/silkscreen-drawings"

test("getSilkscreenDrawingsSummary: handles empty input", () => {
  const result = getSilkscreenDrawingsSummary([])
  expect(result.totalDrawings).toBe(0)
  expect(result.top.totalDrawings).toBe(0)
  expect(result.bottom.totalDrawings).toBe(0)
})

test("getSilkscreenDrawingsSummary: summarizes drawings by layer", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_silkscreen_rect",
      pcb_silkscreen_rect_id: "rect1",
      center: { x: 0, y: 0 },
      width: 10,
      height: 10,
      layer: "top",
    },
    {
      type: "pcb_silkscreen_circle",
      pcb_silkscreen_circle_id: "circ1",
      center: { x: 5, y: 5 },
      radius: 2,
      layer: "top",
    },
    {
      type: "pcb_silkscreen_line",
      pcb_silkscreen_line_id: "line1",
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 10,
      stroke_width: 0.1,
      layer: "bottom",
    },
    {
      type: "pcb_silkscreen_path",
      pcb_silkscreen_path_id: "path1",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      stroke_width: 0.1,
      layer: "bottom",
    },
  ]

  const summary = getSilkscreenDrawingsSummary(circuitJson)
  expect(summary.totalDrawings).toBe(4)
  expect(summary.top.rects).toBe(1)
  expect(summary.top.circles).toBe(1)
  expect(summary.top.totalDrawings).toBe(2)
  expect(summary.bottom.lines).toBe(1)
  expect(summary.bottom.paths).toBe(1)
  expect(summary.bottom.totalDrawings).toBe(2)
})

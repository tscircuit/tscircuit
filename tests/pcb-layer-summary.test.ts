import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getPcbLayerSummary } from "../index"

test("getPcbLayerSummary analyzes layer usage and stackup estimation", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_component",
      pcb_component_id: "c1",
      layer: "top",
      center: { x: 0, y: 0 },
      width: 5,
      height: 5,
    },
    {
      type: "pcb_component",
      pcb_component_id: "c2",
      layer: "bottom",
      center: { x: 10, y: 10 },
      width: 5,
      height: 5,
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "t1",
      route: [
        { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
        { route_type: "wire", x: 5, y: 0, width: 0.2, layer: "top" },
      ],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "t2",
      route: [
        { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "inner1" },
        { route_type: "wire", x: 5, y: 0, width: 0.2, layer: "inner1" },
      ],
    },
    {
      type: "pcb_via",
      pcb_via_id: "v1",
      x: 5,
      y: 0,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
      layers: ["top", "inner1"],
    },
    {
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: "st1",
      text: "REV 2",
      layer: "top",
      font: "tscircuit2024",
      font_size: 1,
      pcb_component_id: "c1",
    },
  ]

  const summary = getPcbLayerSummary(circuitJson)

  expect(summary.hasTopComponents).toBe(true)
  expect(summary.hasBottomComponents).toBe(true)
  expect(summary.hasThroughHoleComponents).toBe(true)
  expect(summary.copperLayers).toContain("top")
  expect(summary.copperLayers).toContain("inner1")
  expect(summary.silkscreenLayers).toContain("top")
  expect(summary.estimatedLayerCount).toBe(3) // 2 + 1 inner
})

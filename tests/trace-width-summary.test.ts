import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getPcbTraceWidthSummary } from "../index"

test("getPcbTraceWidthSummary calculates min, max, average, and fine-pitch counts", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_trace",
      pcb_trace_id: "tr1",
      route: [
        { route_type: "wire", x: 0, y: 0, width: 0.1, layer: "top" }, // Fine pitch (<0.15mm)
        { route_type: "wire", x: 5, y: 0, width: 0.1, layer: "top" },
      ],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "tr2",
      route: [
        { route_type: "wire", x: 0, y: 5, width: 0.5, layer: "bottom" }, // Power trace
        { route_type: "wire", x: 10, y: 5, width: 0.5, layer: "bottom" },
      ],
    },
  ]

  const report = getPcbTraceWidthSummary(circuitJson)

  expect(report.totalTraces).toBe(2)
  expect(report.finePitchTraceCount).toBe(1)
  expect(report.minWidthMm).toBe(0.1)
  expect(report.maxWidthMm).toBe(0.5)
  expect(report.averageWidthMm).toBe(0.3)
  expect(report.widthHistogram["0.100mm"]).toBe(2)
  expect(report.widthHistogram["0.500mm"]).toBe(2)
})

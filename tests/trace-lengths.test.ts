import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getPcbTraceLengths } from "../index"

test("getPcbTraceLengths computes euclidean trace lengths and segments", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_trace",
      pcb_trace_id: "tr1",
      source_trace_id: "str1",
      route: [
        { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
        { route_type: "wire", x: 3, y: 4, width: 0.2, layer: "top" }, // hypot(3,4) = 5
        { route_type: "wire", x: 3, y: 14, width: 0.2, layer: "top" }, // dist 10
      ],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "tr2",
      route: [
        { route_type: "wire", x: 10, y: 10, width: 0.15, layer: "bottom" },
        { route_type: "wire", x: 20, y: 10, width: 0.15, layer: "bottom" }, // dist 10
      ],
    },
  ]

  const report = getPcbTraceLengths(circuitJson)

  expect(report.traceCount).toBe(2)
  expect(report.totalTraceLengthMm).toBe(25) // 15 + 10

  const tr1 = report.traces.find((t) => t.pcbTraceId === "tr1")
  expect(tr1).toBeDefined()
  expect(tr1?.totalLengthMm).toBe(15)
  expect(tr1?.segmentCount).toBe(2)
  expect(tr1?.layers).toEqual(["top"])

  const tr2 = report.traces.find((t) => t.pcbTraceId === "tr2")
  expect(tr2?.totalLengthMm).toBe(10)
  expect(tr2?.layers).toEqual(["bottom"])
})

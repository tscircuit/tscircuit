import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getPcbTraceLengthSummary } from "../src/trace-length-summary"

test("getPcbTraceLengthSummary calculates correct total and per-net trace lengths", () => {
  const elements: AnyCircuitElement[] = [
    {
      type: "pcb_trace",
      pcb_trace_id: "trace_1",
      source_net_id: "net_VCC",
      route: [
        { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
        { route_type: "wire", x: 10, y: 0, width: 0.2, layer: "top" },
        { route_type: "wire", x: 10, y: 10, width: 0.2, layer: "top" },
      ],
    } as any,
    {
      type: "pcb_trace",
      pcb_trace_id: "trace_2",
      source_net_id: "net_VCC",
      route: [
        { route_type: "wire", x: 2, y: 2, width: 0.2, layer: "top" },
        { route_type: "wire", x: 6, y: 5, width: 0.2, layer: "top" }, // length = 5
      ],
    } as any,
    {
      type: "pcb_trace",
      pcb_trace_id: "trace_3",
      source_net_id: "net_GND",
      route: [
        { route_type: "wire", x: 0, y: 0, width: 0.5, layer: "bottom" },
        { route_type: "wire", x: 0, y: 15, width: 0.5, layer: "bottom" }, // length = 15
      ],
    } as any,
  ]

  const summary = getPcbTraceLengthSummary(elements)

  expect(summary.totalTraceCount).toBe(3)
  expect(summary.totalRoutedSegments).toBe(4)
  expect(summary.totalCircuitTraceLengthMm).toBe(40) // 20 + 5 + 15

  // Net VCC check
  const vcc = summary.netBreakdown["net_VCC"]
  expect(vcc).toBeDefined()
  expect(vcc.traceCount).toBe(2)
  expect(vcc.totalLengthMm).toBe(25)
  expect(vcc.averageLengthMm).toBe(12.5)
  expect(vcc.maxLengthMm).toBe(20)
  expect(vcc.minLengthMm).toBe(5)

  // Net GND check
  const gnd = summary.netBreakdown["net_GND"]
  expect(gnd).toBeDefined()
  expect(gnd.traceCount).toBe(1)
  expect(gnd.totalLengthMm).toBe(15)
})

test("getPcbTraceLengthSummary handles empty and unrouted traces gracefully", () => {
  const elements: AnyCircuitElement[] = [
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_1",
      shape: "rect",
      width: 1,
      height: 1,
      x: 0,
      y: 0,
      layer: "top",
    } as any,
    {
      type: "pcb_trace",
      pcb_trace_id: "trace_empty",
      source_net_id: "net_FLOAT",
      route: [],
    } as any,
  ]

  const summary = getPcbTraceLengthSummary(elements)
  expect(summary.totalTraceCount).toBe(1)
  expect(summary.totalCircuitTraceLengthMm).toBe(0)
  expect(summary.totalRoutedSegments).toBe(0)
  expect(summary.netBreakdown["net_FLOAT"].totalLengthMm).toBe(0)
})

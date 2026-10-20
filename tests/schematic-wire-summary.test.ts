import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSchematicWireSummary } from "../index"

test("getSchematicWireSummary calculates total wire length and segment count", () => {
  const circuitJson: CircuitJson = [
    {
      type: "schematic_trace",
      schematic_trace_id: "sch_tr1",
      source_trace_id: "str1",
      edges: [
        { from: { x: 0, y: 0 }, to: { x: 3, y: 4 } }, // dist = 5
        { from: { x: 3, y: 4 }, to: { x: 3, y: 14 } }, // dist = 10
      ],
    } as any,
  ]

  const summary = getSchematicWireSummary(circuitJson)

  expect(summary.totalTraces).toBe(1)
  expect(summary.totalWireLength).toBe(15)

  const tr1 = summary.traces[0]
  expect(tr1.schematicTraceId).toBe("sch_tr1")
  expect(tr1.totalLength).toBe(15)
  expect(tr1.segmentCount).toBe(2)
})

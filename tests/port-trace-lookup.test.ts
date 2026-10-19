import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTracesConnectingPorts } from "../index"

test("getTracesConnectingPorts locates direct and net-mediated traces", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_port",
      source_port_id: "p1",
      source_component_id: "c1",
      name: "out",
    },
    {
      type: "source_port",
      source_port_id: "p2",
      source_component_id: "c2",
      name: "in",
    },
    {
      type: "source_port",
      source_port_id: "p3",
      source_component_id: "c3",
      name: "unrelated",
    },
    {
      type: "source_trace",
      source_trace_id: "tr_direct",
      connected_source_port_ids: ["p1", "p2"],
    },
    {
      type: "source_trace",
      source_trace_id: "tr_other",
      connected_source_port_ids: ["p1", "p3"],
    },
  ]

  const directTraces = getTracesConnectingPorts(circuitJson, "p1", "p2")
  expect(directTraces.length).toBe(1)
  expect(directTraces[0].source_trace_id).toBe("tr_direct")

  const nonConnecting = getTracesConnectingPorts(circuitJson, "p2", "p3")
  expect(nonConnecting.length).toBe(0)
})

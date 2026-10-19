import { expect, test } from "bun:test"
import { getUnconnectedPorts } from "../index"
import type { CircuitJson } from "circuit-json"

test("getUnconnectedPorts detects unconnected component pins", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_component",
      source_component_id: "r1",
      name: "R1",
      ftype: "simple_resistor",
    },
    {
      type: "source_port",
      source_port_id: "r1_p1",
      source_component_id: "r1",
      name: "1",
    },
    {
      type: "source_port",
      source_port_id: "r1_p2",
      source_component_id: "r1",
      name: "2",
    },
    {
      type: "source_component",
      source_component_id: "c1",
      name: "C1",
      ftype: "simple_capacitor",
    },
    {
      type: "source_port",
      source_port_id: "c1_p1",
      source_component_id: "c1",
      name: "1",
    },
    // Connect r1_p1 to c1_p1
    {
      type: "source_trace",
      source_trace_id: "t1",
      connected_source_port_ids: ["r1_p1", "c1_p1"],
      connected_source_net_ids: [],
    },
  ]

  const unconnected = getUnconnectedPorts(circuitJson)

  // r1_p2 is unconnected
  expect(unconnected.length).toBe(1)
  expect(unconnected[0].portId).toBe("r1_p2")
  expect(unconnected[0].componentName).toBe("R1")
  expect(unconnected[0].portName).toBe("2")
})

test("getUnconnectedPorts returns empty array when all ports are connected", () => {
  const circuitJson: CircuitJson = [
    { type: "source_component", source_component_id: "r1", name: "R1" },
    { type: "source_port", source_port_id: "p1", source_component_id: "r1" },
    {
      type: "source_trace",
      source_trace_id: "t1",
      connected_source_port_ids: ["p1"],
      connected_source_net_ids: [],
    },
  ]
  const unconnected = getUnconnectedPorts(circuitJson)
  expect(unconnected.length).toBe(0)
})

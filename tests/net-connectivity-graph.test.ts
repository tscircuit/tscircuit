import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getNetConnectivityGraph } from "../src/net-connectivity-graph"

test("getNetConnectivityGraph correctly builds adjacency list and net grouping", () => {
  const elements: AnyCircuitElement[] = [
    {
      type: "source_component",
      source_component_id: "comp_R1",
      name: "R1",
    } as any,
    {
      type: "source_component",
      source_component_id: "comp_R2",
      name: "R2",
    } as any,
    {
      type: "source_port",
      source_port_id: "port_R1_1",
      source_component_id: "comp_R1",
      name: "pin1",
    } as any,
    {
      type: "source_port",
      source_port_id: "port_R1_2",
      source_component_id: "comp_R1",
      name: "pin2",
    } as any,
    {
      type: "source_port",
      source_port_id: "port_R2_1",
      source_component_id: "comp_R2",
      name: "pin1",
    } as any,
    {
      type: "source_port",
      source_port_id: "port_R2_2",
      source_component_id: "comp_R2",
      name: "pin2",
    } as any,
    {
      type: "source_trace",
      source_trace_id: "trace_VCC",
      connected_source_port_ids: ["port_R1_1", "port_R2_1"],
      connected_source_net_ids: ["net_VCC"],
    } as any,
  ]

  const graph = getNetConnectivityGraph(elements)

  expect(graph.totalNodes).toBe(4) // 4 ports
  expect(graph.totalEdges).toBe(1)
  expect(graph.totalNets).toBe(1)
  expect(graph.isolatedPortsCount).toBe(2) // R1.pin2 and R2.pin2 are unconnected

  // Net check
  const netVcc = graph.nets["net_VCC"]
  expect(netVcc).toBeDefined()
  expect(netVcc.ports).toEqual(["port_R1_1", "port_R2_1"])
  expect(netVcc.components).toEqual(["comp_R1", "comp_R2"])

  // Adjacency check
  expect(graph.adjacencyList["port_R1_1"]).toContain("port_R2_1")
  expect(graph.adjacencyList["port_R2_1"]).toContain("port_R1_1")
  expect(graph.adjacencyList["port_R1_2"]).toHaveLength(0)
})

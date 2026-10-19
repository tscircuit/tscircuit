import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getCircuitNetlist } from "../index"

test("getCircuitNetlist groups connected pins by net", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_component",
      source_component_id: "sc_r1",
      name: "R1",
    },
    {
      type: "source_component",
      source_component_id: "sc_u1",
      name: "U1",
    },
    {
      type: "source_port",
      source_port_id: "sp_r1_1",
      source_component_id: "sc_r1",
      name: "pin1",
      pin_number: 1,
    },
    {
      type: "source_port",
      source_port_id: "sp_r1_2",
      source_component_id: "sc_r1",
      name: "pin2",
      pin_number: 2,
    },
    {
      type: "source_port",
      source_port_id: "sp_u1_1",
      source_component_id: "sc_u1",
      name: "VCC",
      pin_number: 1,
    },
    {
      type: "source_port",
      source_port_id: "sp_u1_2",
      source_component_id: "sc_u1",
      name: "GND",
      pin_number: 2,
    },
    {
      type: "source_net",
      source_net_id: "sn_vcc",
      name: "VCC",
    },
    {
      type: "source_trace",
      source_trace_id: "st_1",
      connected_source_port_ids: ["sp_r1_1", "sp_u1_1"],
      connected_source_net_ids: ["sn_vcc"],
    },
    {
      type: "source_trace",
      source_trace_id: "st_2",
      connected_source_port_ids: ["sp_r1_2", "sp_u1_2"],
    },
  ]

  const netlist = getCircuitNetlist(circuitJson)

  // Explicit net VCC
  expect(netlist.VCC).toBeDefined()
  expect(netlist.VCC.connections.length).toBe(2)
  expect(netlist.VCC.connections[0].componentName).toBe("R1")
  expect(netlist.VCC.connections[0].pinNumber).toBe(1)
  expect(netlist.VCC.connections[1].componentName).toBe("U1")
  expect(netlist.VCC.connections[1].pinNumber).toBe(1)

  // Synthetic net for anonymous trace st_2
  expect(netlist["N$st_2"]).toBeDefined()
  expect(netlist["N$st_2"].connections.length).toBe(2)
})

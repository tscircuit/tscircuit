import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { checkNetContinuity } from "../index"

test("checkNetContinuity detects split nets and reports connected islands", () => {
  const circuitJsonWithSplitNet: CircuitJson = [
    { type: "source_component", source_component_id: "c_u1", name: "U1" },
    { type: "source_component", source_component_id: "c_u2", name: "U2" },
    { type: "source_component", source_component_id: "c_r1", name: "R1" },
    { type: "source_component", source_component_id: "c_r2", name: "R2" },

    {
      type: "source_port",
      source_port_id: "p_u1_vcc",
      source_component_id: "c_u1",
      name: "VCC",
    },
    {
      type: "source_port",
      source_port_id: "p_r1_1",
      source_component_id: "c_r1",
      name: "1",
    },
    {
      type: "source_port",
      source_port_id: "p_u2_vcc",
      source_component_id: "c_u2",
      name: "VCC",
    },
    {
      type: "source_port",
      source_port_id: "p_r2_1",
      source_component_id: "c_r2",
      name: "1",
    },

    { type: "source_net", source_net_id: "net_vcc", name: "VCC" },

    // Trace 1 connects U1.VCC and R1.1
    {
      type: "source_trace",
      source_trace_id: "tr1",
      connected_source_port_ids: ["p_u1_vcc", "p_r1_1"],
      connected_source_net_ids: ["net_vcc"],
    },
    // Trace 2 connects U2.VCC and R2.1 (on same net VCC, but disconnected from U1/R1)
    {
      type: "source_trace",
      source_trace_id: "tr2",
      connected_source_port_ids: ["p_u2_vcc", "p_r2_1"],
      connected_source_net_ids: ["net_vcc"],
    },
  ]

  const report = checkNetContinuity(circuitJsonWithSplitNet)

  expect(report.isFullyConnected).toBe(false)
  expect(report.disconnectedNets.length).toBe(1)

  const splitVcc = report.disconnectedNets[0]
  expect(splitVcc.netName).toBe("VCC")
  expect(splitVcc.islandCount).toBe(2)
  expect(splitVcc.islands).toContainEqual(["R1.1", "U1.VCC"])
  expect(splitVcc.islands).toContainEqual(["R2.1", "U2.VCC"])
})

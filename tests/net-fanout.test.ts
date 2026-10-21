import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getNetFanoutSummary } from "../src/net-fanout"

test("getNetFanoutSummary: handles empty circuit", () => {
  const result = getNetFanoutSummary([])
  expect(result.totalNets).toBe(0)
  expect(result.maxFanout).toBe(0)
  expect(result.highFanoutNets).toEqual([])
})

test("getNetFanoutSummary: calculates fanout per net correctly", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_net",
      source_net_id: "net_clk",
      name: "CLK",
    },
    {
      type: "source_net",
      source_net_id: "net_gnd",
      name: "GND",
    },
    {
      type: "source_port",
      source_port_id: "p1",
      source_net_id: "net_clk",
    },
    {
      type: "source_port",
      source_port_id: "p2",
      source_net_id: "net_clk",
    },
    {
      type: "source_port",
      source_port_id: "p3",
      source_net_id: "net_clk",
    },
    {
      type: "source_port",
      source_port_id: "p4",
      source_net_id: "net_clk",
    },
    // Net GND has 5 ports
    {
      type: "source_port",
      source_port_id: "g1",
      source_net_id: "net_gnd",
    },
    {
      type: "source_port",
      source_port_id: "g2",
      source_net_id: "net_gnd",
    },
    {
      type: "source_port",
      source_port_id: "g3",
      source_net_id: "net_gnd",
    },
    {
      type: "source_port",
      source_port_id: "g4",
      source_net_id: "net_gnd",
    },
    {
      type: "source_port",
      source_port_id: "g5",
      source_net_id: "net_gnd",
    },
  ]

  const summary = getNetFanoutSummary(circuitJson, { highFanoutThreshold: 4 })
  expect(summary.totalNets).toBe(2)
  expect(summary.maxFanout).toBe(5)
  expect(summary.highFanoutNets.length).toBe(2)
  expect(summary.highFanoutNets[0].netName).toBe("GND")
  expect(summary.highFanoutNets[0].isPowerGround).toBe(true)
  expect(summary.highFanoutNets[0].fanout).toBe(5)
  expect(summary.highFanoutNets[1].netName).toBe("CLK")
  expect(summary.highFanoutNets[1].isPowerGround).toBe(false)
  expect(summary.highFanoutNets[1].fanout).toBe(4)
})

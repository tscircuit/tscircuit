import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getControlledImpedanceTraces } from "../index"

test("getControlledImpedanceTraces classifies differential pairs, clocks, and RF traces", () => {
  const circuitJson: CircuitJson = [
    { type: "source_net", source_net_id: "sn_dp", name: "USB_DP" },
    { type: "source_net", source_net_id: "sn_dm", name: "USB_DM" },
    { type: "source_net", source_net_id: "sn_rf", name: "RF_IN" },
    { type: "source_net", source_net_id: "sn_clk", name: "SYS_CLK" },
    { type: "source_net", source_net_id: "sn_gpio", name: "GPIO1" },

    {
      type: "source_trace",
      source_trace_id: "st_dp",
      connected_source_net_ids: ["sn_dp"],
    },
    {
      type: "source_trace",
      source_trace_id: "st_dm",
      connected_source_net_ids: ["sn_dm"],
    },
    {
      type: "source_trace",
      source_trace_id: "st_rf",
      connected_source_net_ids: ["sn_rf"],
    },
    {
      type: "source_trace",
      source_trace_id: "st_clk",
      connected_source_net_ids: ["sn_clk"],
    },
    {
      type: "source_trace",
      source_trace_id: "st_gpio",
      connected_source_net_ids: ["sn_gpio"],
    },

    {
      type: "pcb_trace",
      pcb_trace_id: "pt_dp",
      source_trace_id: "st_dp",
      route: [],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "pt_dm",
      source_trace_id: "st_dm",
      route: [],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "pt_rf",
      source_trace_id: "st_rf",
      route: [],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "pt_clk",
      source_trace_id: "st_clk",
      route: [],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "pt_gpio",
      source_trace_id: "st_gpio",
      route: [],
    },
  ]

  const results = getControlledImpedanceTraces(circuitJson)

  expect(results.length).toBe(4) // DP, DM, RF, CLK (GPIO excluded)

  const dp = results.find((r) => r.netName === "USB_DP")
  expect(dp?.signalType).toBe("differential_pair")
  expect(dp?.polarity).toBe("positive")

  const dm = results.find((r) => r.netName === "USB_DM")
  expect(dm?.signalType).toBe("differential_pair")
  expect(dm?.polarity).toBe("negative")

  const rf = results.find((r) => r.netName === "RF_IN")
  expect(rf?.signalType).toBe("rf_antenna")

  const clk = results.find((r) => r.netName === "SYS_CLK")
  expect(clk?.signalType).toBe("high_speed_clock")
})

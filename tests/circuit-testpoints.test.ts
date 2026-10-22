import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getCircuitTestPoints } from "../index"

test("getCircuitTestPoints discovers testpoints and maps coordinates and nets", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_component",
      source_component_id: "sc_tp1",
      name: "TP1",
    },
    {
      type: "source_port",
      source_port_id: "sp_tp1",
      source_component_id: "sc_tp1",
      name: "1",
    },
    {
      type: "source_net",
      source_net_id: "sn_vcc",
      name: "VCC_3V3",
    },
    {
      type: "source_trace",
      source_trace_id: "tr1",
      connected_source_port_ids: ["sp_tp1"],
      connected_source_net_ids: ["sn_vcc"],
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_tp1",
      source_component_id: "sc_tp1",
      center: { x: 12.5, y: 8.0 },
      layer: "top",
      width: 1.5,
      height: 1.5,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_tp1",
      pcb_component_id: "pcb_tp1",
      x: 12.5,
      y: 8.0,
      width: 1.2,
      height: 1.2,
      shape: "circle",
      layer: "top",
    },
    // Non-testpoint component
    {
      type: "source_component",
      source_component_id: "sc_r1",
      name: "R1",
    },
  ]

  const testPoints = getCircuitTestPoints(circuitJson)

  expect(testPoints.length).toBe(1)
  const tp = testPoints[0]
  expect(tp.name).toBe("TP1")
  expect(tp.netName).toBe("VCC_3V3")
  expect(tp.x).toBe(12.5)
  expect(tp.y).toBe(8.0)
  expect(tp.layer).toBe("top")
  expect(tp.padType).toBe("smtpad")
})

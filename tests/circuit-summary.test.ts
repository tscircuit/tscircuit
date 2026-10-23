import { expect, test } from "bun:test"
import { getCircuitSummary } from "../index"
import type { CircuitJson } from "circuit-json"

test("getCircuitSummary aggregates component, trace, and board counts accurately", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_board",
      width: 50,
      height: 40,
      center: { x: 0, y: 0 },
      pcb_board_id: "board1",
    },
    {
      type: "source_component",
      source_component_id: "r1",
      name: "R1",
      ftype: "simple_resistor",
    },
    {
      type: "source_component",
      source_component_id: "c1",
      name: "C1",
      ftype: "simple_capacitor",
    },
    {
      type: "pcb_component",
      source_component_id: "r1",
      pcb_component_id: "pr1",
      center: { x: 5, y: 5 },
      layer: "top",
      rotation: 0,
      width: 2,
      height: 1,
    },
    { type: "pcb_trace", route: [], pcb_trace_id: "pt1" },
    {
      type: "pcb_via",
      x: 2,
      y: 2,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top", "bottom"],
      from_layer: "top",
      to_layer: "bottom",
      pcb_via_id: "v1",
    },
    {
      type: "pcb_hole",
      hole_shape: "round",
      hole_diameter: 2,
      x: 0,
      y: 0,
      pcb_hole_id: "h1",
    },
    {
      type: "source_net",
      source_net_id: "net_gnd",
      name: "GND",
      member_source_group_ids: [],
    },
  ]

  const summary = getCircuitSummary(circuitJson)

  expect(summary.totalElements).toBe(8)
  expect(summary.boardCount).toBe(1)
  expect(summary.sourceComponentCount).toBe(2)
  expect(summary.pcbComponentCount).toBe(1)
  expect(summary.traceCount).toBe(1)
  expect(summary.viaCount).toBe(1)
  expect(summary.holeCount).toBe(1)
  expect(summary.netCount).toBe(1)
  expect(summary.byType.pcb_board).toBe(1)
  expect(summary.byType.source_component).toBe(2)
})

test("getCircuitSummary handles empty circuit array", () => {
  const summary = getCircuitSummary([])
  expect(summary.totalElements).toBe(0)
  expect(summary.boardCount).toBe(0)
  expect(summary.sourceComponentCount).toBe(0)
  expect(Object.keys(summary.byType).length).toBe(0)
})

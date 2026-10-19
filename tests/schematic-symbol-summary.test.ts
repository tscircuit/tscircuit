import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSchematicSymbolSummary } from "../index"

test("getSchematicSymbolSummary detects placed vs unplaced schematic symbols", () => {
  const circuitJson: CircuitJson = [
    { type: "source_component", source_component_id: "c1", name: "R1" },
    { type: "source_component", source_component_id: "c2", name: "R2" },
    {
      type: "schematic_component",
      schematic_component_id: "sch1",
      source_component_id: "c1",
      center: { x: 0, y: 0 },
      symbol_name: "boxresistor",
    } as any,
    {
      type: "schematic_port",
      schematic_port_id: "sp1",
      source_port_id: "p1",
      schematic_component_id: "sch1",
      center: { x: -2, y: 0 },
      facing_direction: "left",
    },
  ]

  const summary = getSchematicSymbolSummary(circuitJson)

  expect(summary.totalSchematicComponents).toBe(1)
  expect(summary.totalSchematicPorts).toBe(1)
  expect(summary.unplacedComponentIds).toEqual(["c2"])
  expect(summary.componentsBySymbolType.boxresistor).toBe(1)
})

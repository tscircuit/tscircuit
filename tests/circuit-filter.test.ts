import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { filterCircuitJson } from "../index"

test("filterCircuitJson filters by domains, layers, and types", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_component",
      source_component_id: "sc1",
      name: "R1",
    },
    {
      type: "schematic_component",
      schematic_component_id: "sch1",
      source_component_id: "sc1",
      center: { x: 0, y: 0 },
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb1",
      source_component_id: "sc1",
      layer: "top",
      center: { x: 0, y: 0 },
      width: 10,
      height: 5,
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb2",
      source_component_id: "sc1",
      layer: "bottom",
      center: { x: 0, y: 0 },
      width: 10,
      height: 5,
    },
    {
      type: "cad_component",
      cad_component_id: "cad1",
      source_component_id: "sc1",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
  ]

  // Filter by domain "pcb"
  const pcbElements = filterCircuitJson(circuitJson, { domains: ["pcb"] })
  expect(pcbElements.length).toBe(2)
  expect(pcbElements.every((e) => e.type.startsWith("pcb_"))).toBe(true)

  // Filter by excludeDomains ["cad", "source"]
  const withoutCadSource = filterCircuitJson(circuitJson, {
    excludeDomains: ["cad", "source"],
  })
  expect(withoutCadSource.length).toBe(3)

  // Filter by layer "top"
  const topElements = filterCircuitJson(circuitJson, { layers: ["top"] })
  expect(topElements.length).toBe(1)
  expect((topElements[0] as any).pcb_component_id).toBe("pcb1")

  // Filter by exact type
  const schematicOnly = filterCircuitJson(circuitJson, {
    types: ["schematic_component"],
  })
  expect(schematicOnly.length).toBe(1)
  expect(schematicOnly[0].type).toBe("schematic_component")
})

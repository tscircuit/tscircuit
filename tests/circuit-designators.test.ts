import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getComponentDesignators } from "../index"

test("getComponentDesignators classifies prefixes and identifies duplicates and gaps", () => {
  const circuitJson: CircuitJson = [
    { type: "source_component", source_component_id: "c1", name: "R1" },
    { type: "source_component", source_component_id: "c2", name: "R3" },
    { type: "source_component", source_component_id: "c3", name: "R4" },
    { type: "source_component", source_component_id: "c4", name: "C1" },
    { type: "source_component", source_component_id: "c5", name: "C2" },
    { type: "source_component", source_component_id: "c6", name: "U1" },
    { type: "source_component", source_component_id: "c7", name: "R1" }, // Duplicate
  ]

  const summary = getComponentDesignators(circuitJson)

  expect(summary.totalComponents).toBe(7)
  expect(summary.duplicates).toEqual(["R1"])

  // Prefix R
  const rGroup = summary.prefixes.R
  expect(rGroup).toBeDefined()
  expect(rGroup.designators).toEqual(["R1", "R1", "R3", "R4"])
  expect(rGroup.missingNumbers).toEqual([2]) // R2 is missing

  // Prefix C
  const cGroup = summary.prefixes.C
  expect(cGroup).toBeDefined()
  expect(cGroup.designators).toEqual(["C1", "C2"])
  expect(cGroup.missingNumbers).toEqual([])

  // Prefix U
  const uGroup = summary.prefixes.U
  expect(uGroup).toBeDefined()
  expect(uGroup.count).toBe(1)
})

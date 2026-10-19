import { expect, test } from "bun:test"
import { getCircuitBom } from "../index"
import type { CircuitJson } from "circuit-json"

test("getCircuitBom aggregates components by part numbers and designators", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_component",
      source_component_id: "r1",
      name: "R1",
      ftype: "simple_resistor",
      supplier_part_numbers: { jlcpcb: ["C12345"] },
    },
    {
      type: "source_component",
      source_component_id: "r2",
      name: "R2",
      ftype: "simple_resistor",
      supplier_part_numbers: { jlcpcb: ["C12345"] },
    },
    {
      type: "source_component",
      source_component_id: "c1",
      name: "C1",
      ftype: "simple_capacitor",
      supplier_part_numbers: { jlcpcb: ["C99999"] },
    },
  ]

  const bom = getCircuitBom(circuitJson)

  expect(bom.length).toBe(2)

  const resistorBom = bom.find((b) =>
    b.supplierPartNumbers?.jlcpcb?.includes("C12345"),
  )
  expect(resistorBom).toBeDefined()
  expect(resistorBom?.count).toBe(2)
  expect(resistorBom?.designators).toContain("R1")
  expect(resistorBom?.designators).toContain("R2")

  const capacitorBom = bom.find((b) =>
    b.supplierPartNumbers?.jlcpcb?.includes("C99999"),
  )
  expect(capacitorBom).toBeDefined()
  expect(capacitorBom?.count).toBe(1)
  expect(capacitorBom?.designators).toContain("C1")
})

test("getCircuitBom handles empty circuit", () => {
  const bom = getCircuitBom([])
  expect(bom.length).toBe(0)
})

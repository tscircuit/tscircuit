import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getComponentBOMSummary } from "../src/component-bom-summary"

test("getComponentBOMSummary groups identical parts and formats designators", () => {
  const elements: AnyCircuitElement[] = [
    {
      type: "source_component",
      source_component_id: "r1",
      name: "R1",
      ftype: "simple_resistor",
      resistance: "10k",
      footprint: "0402",
    } as any,
    {
      type: "source_component",
      source_component_id: "r2",
      name: "R2",
      ftype: "simple_resistor",
      resistance: "10k",
      footprint: "0402",
    } as any,
    {
      type: "source_component",
      source_component_id: "r10",
      name: "R10",
      ftype: "simple_resistor",
      resistance: "10k",
      footprint: "0402",
    } as any,
    {
      type: "source_component",
      source_component_id: "c1",
      name: "C1",
      ftype: "simple_capacitor",
      capacitance: "100nF",
      footprint: "0603",
    } as any,
    {
      type: "source_component",
      source_component_id: "u1",
      name: "U1",
      ftype: "simple_chip",
      manufacturer_part_number: "NE555P",
      footprint: "SOIC-8",
      supplier_part_numbers: { jlcpcb: "C46749" },
    } as any,
  ]

  const bom = getComponentBOMSummary(elements)

  expect(bom.totalComponents).toBe(5)
  expect(bom.uniquePartsCount).toBe(3) // 10k resistors (3), 100nF cap (1), NE555P chip (1)

  // Resistor group check (R1, R2, R10 natural sorted)
  const resLine = bom.lineItems.find((item) => item.componentType === "resistor")
  expect(resLine).toBeDefined()
  expect(resLine!.quantity).toBe(3)
  expect(resLine!.designators).toEqual(["R1", "R2", "R10"])
  expect(resLine!.designatorString).toBe("R1, R2, R10")
  expect(resLine!.value).toBe("10k")

  // Chip check
  const chipLine = bom.lineItems.find((item) => item.componentType === "chip")
  expect(chipLine).toBeDefined()
  expect(chipLine!.quantity).toBe(1)
  expect(chipLine!.manufacturerPartNumber).toBe("NE555P")
  expect(chipLine!.supplierPartNumbers?.jlcpcb).toBe("C46749")
})

test("getComponentBOMSummary handles empty circuit json gracefully", () => {
  const bom = getComponentBOMSummary([])
  expect(bom.totalComponents).toBe(0)
  expect(bom.uniquePartsCount).toBe(0)
  expect(bom.lineItems).toHaveLength(0)
})

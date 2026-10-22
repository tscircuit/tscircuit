import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { classifyFootprint, getFootprintTypeSummary } from "../index"

test("classifyFootprint accurately classifies SMD passives, ICs, and through-hole", () => {
  expect(classifyFootprint("0402")).toBe("smd_passive")
  expect(classifyFootprint("0805")).toBe("smd_passive")
  expect(classifyFootprint("soic8")).toBe("ic_smd")
  expect(classifyFootprint("qfn32")).toBe("ic_smd")
  expect(classifyFootprint("dip8")).toBe("through_hole")
  expect(classifyFootprint("usb_c")).toBe("connector")
  expect(classifyFootprint("custom_widget")).toBe("other")
})

test("getFootprintTypeSummary groups components by package family", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_component",
      source_component_id: "c1",
      name: "R1",
      footprint: "0603",
    } as any,
    {
      type: "source_component",
      source_component_id: "c2",
      name: "U1",
      footprint: "soic16",
    } as any,
    {
      type: "source_component",
      source_component_id: "c3",
      name: "J1",
      footprint: "header_4pin",
    } as any,
  ]

  const report = getFootprintTypeSummary(circuitJson)

  expect(report.totalClassified).toBe(3)
  expect(report.categoryCounts.smd_passive).toBe(1)
  expect(report.categoryCounts.ic_smd).toBe(1)
  expect(report.categoryCounts.connector).toBe(1)
})

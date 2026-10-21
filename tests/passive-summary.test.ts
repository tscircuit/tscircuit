import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getPassiveComponentsSummary } from "../index"

test("getPassiveComponentsSummary classifies passives and tallies values", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_component",
      source_component_id: "sc_r1",
      name: "R1",
      ftype: "resistor",
      resistance: "10k",
    } as any,
    {
      type: "source_component",
      source_component_id: "sc_r2",
      name: "R2",
      ftype: "resistor",
      resistance: "10k",
    } as any,
    {
      type: "source_component",
      source_component_id: "sc_r3",
      name: "R3",
      ftype: "resistor",
      resistance: "1k",
    } as any,
    {
      type: "source_component",
      source_component_id: "sc_c1",
      name: "C1",
      ftype: "capacitor",
      capacitance: "100nF",
    } as any,
    {
      type: "source_component",
      source_component_id: "sc_c2",
      name: "C2",
      ftype: "capacitor",
      capacitance: "10uF",
    } as any,
    {
      type: "source_component",
      source_component_id: "sc_l1",
      name: "L1",
      ftype: "inductor",
      inductance: "2.2uH",
    } as any,
    {
      type: "source_component",
      source_component_id: "sc_u1",
      name: "U1",
      ftype: "chip",
    } as any,
  ]

  const report = getPassiveComponentsSummary(circuitJson)

  expect(report.totalResistors).toBe(3)
  expect(report.totalCapacitors).toBe(2)
  expect(report.totalInductors).toBe(1)
  expect(report.totalPassives).toBe(6)
  expect(report.totalActives).toBe(1)

  expect(report.resistorValues["10k"]).toBe(2)
  expect(report.resistorValues["1k"]).toBe(1)
  expect(report.capacitorValues["100nF"]).toBe(1)
  expect(report.inductorValues["2.2uH"]).toBe(1)
})

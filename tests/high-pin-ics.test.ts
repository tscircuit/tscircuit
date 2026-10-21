import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getHighPinCountIcs } from "../src/high-pin-ics"

test("getHighPinCountIcs: handles empty input", () => {
  const result = getHighPinCountIcs([])
  expect(result.totalHighPinComponents).toBe(0)
  expect(result.highestPinCount).toBe(0)
  expect(result.components).toEqual([])
})

test("getHighPinCountIcs: detects and sorts ICs with high pin counts", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_component",
      source_component_id: "mcu1",
      name: "STM32F401",
      ftype: "simple_chip",
    },
    {
      type: "source_component",
      source_component_id: "r1",
      name: "R1",
      ftype: "simple_resistor",
    },
  ]

  // Add 32 ports to MCU
  for (let i = 1; i <= 32; i++) {
    circuitJson.push({
      type: "source_port",
      source_port_id: `port_mcu_${i}`,
      source_component_id: "mcu1",
      name: `PA${i}`,
    })
  }

  // Add 2 ports to R1
  circuitJson.push(
    {
      type: "source_port",
      source_port_id: "port_r1_1",
      source_component_id: "r1",
      name: "1",
    },
    {
      type: "source_port",
      source_port_id: "port_r1_2",
      source_component_id: "r1",
      name: "2",
    },
  )

  const report = getHighPinCountIcs(circuitJson, { minPinCount: 16 })
  expect(report.totalHighPinComponents).toBe(1)
  expect(report.highestPinCount).toBe(32)
  expect(report.components[0].name).toBe("STM32F401")
  expect(report.components[0].pinCount).toBe(32)
})

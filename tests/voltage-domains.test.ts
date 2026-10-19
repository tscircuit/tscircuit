import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getCircuitVoltageDomains } from "../index"

test("getCircuitVoltageDomains classifies power rails, grounds, and voltage levels", () => {
  const circuitJson: CircuitJson = [
    { type: "source_net", source_net_id: "n1", name: "3V3" },
    { type: "source_net", source_net_id: "n2", name: "GND" },
    { type: "source_net", source_net_id: "n3", name: "VBUS" },
    { type: "source_net", source_net_id: "n4", name: "SPI_MOSI" },
  ]

  const report = getCircuitVoltageDomains(circuitJson)

  expect(report.groundNets).toEqual(["GND"])
  expect(report.powerRails).toEqual(["3V3", "VBUS"])

  const v33 = report.domains.find((d) => d.netName === "3V3")
  expect(v33?.isPowerRail).toBe(true)
  expect(v33?.voltageLevel).toBe("3.3V")

  const gnd = report.domains.find((d) => d.netName === "GND")
  expect(gnd?.isGround).toBe(true)
  expect(gnd?.voltageLevel).toBe("0V")

  const mosi = report.domains.find((d) => d.netName === "SPI_MOSI")
  expect(mosi?.isPowerRail).toBe(false)
  expect(mosi?.isGround).toBe(false)
})

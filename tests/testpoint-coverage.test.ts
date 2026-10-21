import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTestPointCoverage } from "../src/testpoint-coverage"

test("getTestPointCoverage: handles empty circuit", () => {
  const result = getTestPointCoverage([])
  expect(result.totalNetsCount).toBe(0)
  expect(result.totalTestpointsCount).toBe(0)
  expect(result.coveragePercentage).toBe(0)
})

test("getTestPointCoverage: calculates coverage accurately", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_net",
      source_net_id: "net_vcc",
      name: "VCC",
    },
    {
      type: "source_net",
      source_net_id: "net_spi_mosi",
      name: "SPI_MOSI",
    },
    {
      type: "source_component",
      source_component_id: "tp1",
      name: "TP_VCC",
      ftype: "simple_test_point",
    },
    {
      type: "source_port",
      source_port_id: "tp1_p1",
      source_component_id: "tp1",
      source_net_id: "net_vcc",
    },
  ]

  const report = getTestPointCoverage(circuitJson)
  expect(report.totalNetsCount).toBe(2)
  expect(report.totalTestpointsCount).toBe(1)
  expect(report.coveredNetsCount).toBe(1)
  expect(report.coveragePercentage).toBe(50.0)
  expect(report.coveredNetNames).toContain("VCC")
  expect(report.uncoveredNetNames).toContain("SPI_MOSI")
})

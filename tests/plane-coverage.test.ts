import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { checkPowerGroundPlaneCoverage } from "../src/plane-coverage"

test("checkPowerGroundPlaneCoverage: reports missing planes on empty circuit", () => {
  const result = checkPowerGroundPlaneCoverage([])
  expect(result.totalCopperPours).toBe(0)
  expect(result.hasGroundPlane).toBe(false)
  expect(result.hasPowerPlane).toBe(false)
  expect(result.missingCrucialPlanes).toContain("GND")
  expect(result.missingCrucialPlanes).toContain("Power")
})

test("checkPowerGroundPlaneCoverage: identifies ground and power pours", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_net",
      source_net_id: "net_gnd",
      name: "GND",
    },
    {
      type: "source_net",
      source_net_id: "net_3v3",
      name: "3V3",
    },
    {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: "pour_gnd",
      layer: "bottom",
      source_net_id: "net_gnd",
      polygon: [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 0, y: 50 },
      ],
    },
  ]

  const report = checkPowerGroundPlaneCoverage(circuitJson)
  expect(report.totalCopperPours).toBe(1)
  expect(report.hasGroundPlane).toBe(true)
  expect(report.hasPowerPlane).toBe(false)
  expect(report.missingCrucialPlanes).toEqual(["Power"])
  expect(report.planeNets).toEqual(["GND"])
})

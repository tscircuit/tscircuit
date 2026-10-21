import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getCopperPourIslands } from "../src/copper-islands"

test("getCopperPourIslands: handles empty circuit", () => {
  const result = getCopperPourIslands([])
  expect(result.totalPours).toBe(0)
  expect(result.floatingCount).toBe(0)
  expect(result.hasFloatingIslands).toBe(false)
})

test("getCopperPourIslands: identifies floating pours without nets or stitching", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_net",
      source_net_id: "net_gnd",
      name: "GND",
    },
    // Pour 1: GND pour with connected via
    {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: "pour_stitched",
      layer: "top",
      source_net_id: "net_gnd",
      polygon: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
    },
    {
      type: "pcb_via",
      pcb_via_id: "via_gnd",
      source_net_id: "net_gnd",
      x: 5,
      y: 5,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top", "bottom"],
    },
    // Pour 2: Floating pour with no net
    {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: "pour_floating_no_net",
      layer: "bottom",
      polygon: [
        { x: 20, y: 20 },
        { x: 30, y: 20 },
        { x: 30, y: 30 },
        { x: 20, y: 30 },
      ],
    },
  ]

  const report = getCopperPourIslands(circuitJson)
  expect(report.totalPours).toBe(2)
  expect(report.floatingCount).toBe(1)
  expect(report.hasFloatingIslands).toBe(true)
  expect(report.floatingIslands[0].pourId).toBe("pour_floating_no_net")
  expect(report.floatingIslands[0].reason).toBe("no_net_assigned")
})

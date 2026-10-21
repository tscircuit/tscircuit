import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getThermalViaClusters } from "../src/thermal-vias"

test("getThermalViaClusters: returns empty report for empty circuit", () => {
  const result = getThermalViaClusters([])
  expect(result.totalVias).toBe(0)
  expect(result.clusterCount).toBe(0)
  expect(result.clusters).toEqual([])
})

test("getThermalViaClusters: detects tight 2x2 grid of thermal vias", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_via",
      pcb_via_id: "via1",
      x: 10,
      y: 10,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_via",
      pcb_via_id: "via2",
      x: 11,
      y: 10,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_via",
      pcb_via_id: "via3",
      x: 10,
      y: 11,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_via",
      pcb_via_id: "via4",
      x: 11,
      y: 11,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top", "bottom"],
    },
    // Isolated distant via
    {
      type: "pcb_via",
      pcb_via_id: "via_isolated",
      x: 50,
      y: 50,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
      layers: ["top", "bottom"],
    },
  ]

  const report = getThermalViaClusters(circuitJson, { maxSpacingMm: 1.5 })
  expect(report.totalVias).toBe(5)
  expect(report.clusterCount).toBe(1)
  expect(report.clusters[0].viaCount).toBe(4)
  expect(report.clusters[0].center).toEqual({ x: 10.5, y: 10.5 })
  expect(report.clusters[0].viaIds).toContain("via1")
  expect(report.clusters[0].viaIds).toContain("via4")
  expect(report.clusters[0].viaIds).not.toContain("via_isolated")
})

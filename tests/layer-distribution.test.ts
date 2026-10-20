import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getLayerDistributionSummary } from "../src/layer-distribution"

test("getLayerDistributionSummary correctly tallies elements and percentages per layer", () => {
  const elements: AnyCircuitElement[] = [
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_top_1",
      layer: "top",
      shape: "rect",
      width: 1,
      height: 1,
      x: 0,
      y: 0,
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_top_2",
      layer: "top",
      shape: "rect",
      width: 1,
      height: 1,
      x: 2,
      y: 0,
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_bot_1",
      layer: "bottom",
      shape: "rect",
      width: 1,
      height: 1,
      x: 0,
      y: 5,
    } as any,
    {
      type: "pcb_via",
      pcb_via_id: "via_1",
      from_layer: "top",
      to_layer: "bottom",
      layers: ["top", "bottom"],
      x: 5,
      y: 5,
      hole_diameter: 0.3,
      outer_diameter: 0.6,
    } as any,
    {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: "pour_inner1",
      layer: "inner1",
      polygons: [],
    } as any,
    {
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: "silk_1",
      layer: "top",
      text: "R1",
      x: 0,
      y: 1,
    } as any,
  ]

  const summary = getLayerDistributionSummary(elements)

  expect(summary.activeLayers).toEqual(["bottom", "inner1", "top"])

  // Top layer check: 2 smtPads + 1 via + 1 silk = 4 elements
  const top = summary.layerCounts["top"]
  expect(top.smtPads).toBe(2)
  expect(top.vias).toBe(1)
  expect(top.silkscreenElements).toBe(1)
  expect(top.totalElements).toBe(4)

  // Bottom layer check: 1 smtPad + 1 via = 2 elements
  const bottom = summary.layerCounts["bottom"]
  expect(bottom.smtPads).toBe(1)
  expect(bottom.vias).toBe(1)
  expect(bottom.totalElements).toBe(2)

  // Inner1 layer check: 1 copper pour
  const inner1 = summary.layerCounts["inner1"]
  expect(inner1.copperPours).toBe(1)
  expect(inner1.totalElements).toBe(1)

  // Total copper: 2 (top pads) + 1 (bottom pad) + 2 (via top+bot) + 1 (pour inner1) = 6
  expect(summary.totalCopperElements).toBe(6)

  // Top copper = 2 + 1 = 3 -> 50%
  expect(summary.layerUtilizationPercentages["top"]).toBe(50)
})

test("getLayerDistributionSummary returns clean empty state for empty board", () => {
  const summary = getLayerDistributionSummary([])
  expect(summary.activeLayers).toHaveLength(0)
  expect(summary.totalCopperElements).toBe(0)
  expect(Object.keys(summary.layerUtilizationPercentages)).toHaveLength(0)
})

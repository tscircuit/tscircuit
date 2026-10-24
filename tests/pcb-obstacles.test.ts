import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getPcbObstaclesSummary } from "../src/pcb-obstacles"

test("getPcbObstaclesSummary correctly extracts routing obstacles across layers", () => {
  const elements: AnyCircuitElement[] = [
    {
      type: "pcb_keepout",
      pcb_keepout_id: "keepout_1",
      layer: "top",
      shape: "rect",
      width: 10,
      height: 10,
      center: { x: 0, y: 0 },
    } as any,
    {
      type: "pcb_cutout",
      pcb_cutout_id: "cutout_1",
      shape: "circle",
      radius: 5,
      center: { x: 20, y: 20 },
    } as any,
    {
      type: "pcb_hole",
      pcb_hole_id: "hole_1",
      hole_diameter: 2,
      x: -10,
      y: -10,
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_1",
      layer: "top",
      shape: "rect",
      width: 2,
      height: 4,
      x: 5,
      y: 5,
      source_net_id: "net_SIG",
    } as any,
  ]

  const summary = getPcbObstaclesSummary(elements)

  expect(summary.keepoutsCount).toBe(1)
  expect(summary.cutoutsCount).toBe(1)
  expect(summary.holesCount).toBe(1)
  expect(summary.padsCount).toBe(1)

  // Top layer should have keepout and pad
  const topObstacles = summary.obstaclesByLayer["top"]
  expect(topObstacles).toBeDefined()
  expect(topObstacles.some((o) => o.type === "keepout")).toBe(true)
  expect(topObstacles.some((o) => o.type === "pad")).toBe(true)

  // "all" layer should have cutout and hole
  const allObstacles = summary.obstaclesByLayer["all"]
  expect(allObstacles).toBeDefined()
  expect(allObstacles.some((o) => o.type === "cutout")).toBe(true)
  expect(allObstacles.some((o) => o.type === "hole")).toBe(true)
})

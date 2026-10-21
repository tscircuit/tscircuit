import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getCircuitCentroid } from "../src/circuit-centroid"

test("getCircuitCentroid: returns defaults for empty circuit", () => {
  const result = getCircuitCentroid([])
  expect(result.componentCount).toBe(0)
  expect(result.centerOfMass).toEqual({ x: 0, y: 0 })
  expect(result.boundingCenter).toEqual({ x: 0, y: 0 })
  expect(result.offsetsFromBoardCenter).toBeUndefined()
})

test("getCircuitCentroid: calculates centroid and bounding center correctly", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_component",
      pcb_component_id: "pcb_c1",
      center: { x: 10, y: 20 },
      width: 5,
      height: 5,
      layer: "top",
      rotation: 0,
      source_component_id: "sc1",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_c2",
      center: { x: 30, y: 40 },
      width: 5,
      height: 5,
      layer: "top",
      rotation: 0,
      source_component_id: "sc2",
    },
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 20, y: 25 },
      width: 50,
      height: 50,
      num_layers: 2,
      thickness: 1.6,
    },
  ]

  const result = getCircuitCentroid(circuitJson)
  expect(result.componentCount).toBe(2)
  expect(result.centerOfMass).toEqual({ x: 20, y: 30 })
  expect(result.boundingCenter).toEqual({ x: 20, y: 30 })
  expect(result.offsetsFromBoardCenter).toEqual({ dx: 0, dy: 5 })
})

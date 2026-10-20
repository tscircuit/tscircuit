import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getComponentPinPitch } from "../index"

test("getComponentPinPitch calculates minimum center-to-center pad spacing", () => {
  const circuitJson: CircuitJson = [
    { type: "source_component", source_component_id: "sc_u1", name: "U1" },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_u1",
      source_component_id: "sc_u1",
      center: { x: 0, y: 0 },
      width: 5,
      height: 4,
      layer: "top",
    },
    // SOIC pin row with 1.27mm pitch
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "p1",
      pcb_component_id: "pcb_u1",
      x: -2,
      y: -1.27,
      shape: "rect",
      width: 1,
      height: 0.5,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "p2",
      pcb_component_id: "pcb_u1",
      x: -2,
      y: 0,
      shape: "rect",
      width: 1,
      height: 0.5,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "p3",
      pcb_component_id: "pcb_u1",
      x: -2,
      y: 1.27,
      shape: "rect",
      width: 1,
      height: 0.5,
      layer: "top",
    },
  ]

  // Query by component name
  const pitch = getComponentPinPitch(circuitJson, "U1")
  expect(pitch).toBe(1.27)

  // Query by PCB component ID
  const pitchByPcb = getComponentPinPitch(circuitJson, "pcb_u1")
  expect(pitchByPcb).toBe(1.27)

  // Query non-existent
  expect(getComponentPinPitch(circuitJson, "UNKNOWN")).toBeNull()
})

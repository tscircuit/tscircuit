import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"

test("PCB SMT pad with solder mask coverage", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={20} height={15}>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          1: "VCC",
          2: "GND",
          3: "SCL",
          4: "SDA",
          5: "INT",
          6: "NC",
          7: "NC",
          8: "NC",
        }}
      />
    </board>,
  )

  // Add SMT pads directly to the circuit - they should be created by the chip
  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  // Debug: print all items to see what's there
  console.log("Circuit JSON items:", circuitJson.map(item => ({ type: item.type, x: item.x, y: item.y })))

  // Check that we have pcb_smtpad elements from the chip
  const smtPads = circuitJson.filter(item => item.type === "pcb_smtpad")
  console.log("Found SMT pads:", smtPads.length)

  // Should have 8 pads from the SOIC8 chip
  expect(smtPads.length).toBe(8)

  // Debug: print smtpad properties
  console.log("SMT pad properties:", smtPads.map(pad => ({
    x: pad.x,
    y: pad.y,
    shape: pad.shape,
    layer: pad.layer,
    is_covered_with_solder_mask: pad.is_covered_with_solder_mask,
    ...pad
  })))

  // Check that all smt pads have the is_covered_with_solder_mask property
  smtPads.forEach(pad => {
    expect(pad).toHaveProperty("is_covered_with_solder_mask")
    // All chip pads should be false by default
    expect(pad.is_covered_with_solder_mask).toBe(false)
  })

  // Test that we can find specific pads and their properties
  const pad1 = smtPads.find(pad => pad.x === -2.15 && pad.y === 1.905)
  const pad2 = smtPads.find(pad => pad.x === -2.15 && pad.y === 0.635)

  expect(pad1).toBeDefined()
  expect(pad2).toBeDefined()
  expect(pad1?.is_covered_with_solder_mask).toBe(false)
  expect(pad2?.is_covered_with_solder_mask).toBe(false)
})

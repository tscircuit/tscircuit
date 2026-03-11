import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"

/**
 * Capacitive Touch Slider demonstration
 *
 * This example shows how to create a capacitive touch slider using
 * polygon-shaped SMT pads with solder mask coverage.
 *
 * The solder mask acts as the dielectric layer, and the copper pads
 * underneath form the capacitive sensing electrodes.
 *
 * Related: tscircuit/tscircuit#786
 */

/**
 * Generate a diamond (rhombus) polygon centered at (offsetX, offsetY)
 */
function diamondPoints(
  halfWidth: number,
  halfHeight: number,
  offsetX = 0,
  offsetY = 0,
) {
  return [
    { x: offsetX, y: offsetY + halfHeight },
    { x: offsetX + halfWidth, y: offsetY },
    { x: offsetX, y: offsetY - halfHeight },
    { x: offsetX - halfWidth, y: offsetY },
  ]
}

test("capacitive touch slider - polygon smtpads with solder mask coverage", async () => {
  const circuit = new Circuit()

  const NUM_PADS = 5
  const PAD_HALF_WIDTH = 1.2 // mm
  const PAD_HALF_HEIGHT = 2.5 // mm
  const SPACING = 3.0 // mm, center-to-center

  circuit.add(
    <board width={`${NUM_PADS * SPACING + 4}mm`} height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            {Array.from({ length: NUM_PADS }, (_, i) => {
              const offsetX = (i - (NUM_PADS - 1) / 2) * SPACING
              return (
                <smtpad
                  key={i}
                  name={`pad${i + 1}`}
                  shape="polygon"
                  points={diamondPoints(PAD_HALF_WIDTH, PAD_HALF_HEIGHT, offsetX, 0)}
                  portHints={[`pin${i + 1}`]}
                  coveredWithSolderMask={true}
                />
              )
            })}
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toBeTruthy()

  // Get the PCB SMT pads from the circuit JSON
  const smtPads = circuitJson.filter((el: any) => el.type === "pcb_smtpad")

  // Verify all 5 pads exist
  expect(smtPads).toHaveLength(NUM_PADS)

  // Verify all pads are polygon shape and covered with solder mask
  for (const pad of smtPads) {
    expect(pad.shape).toBe("polygon")
    expect(pad.is_covered_with_solder_mask).toBe(true)
  }

  // No solder paste should be generated for covered pads
  const solderPaste = circuitJson.filter(
    (el: any) => el.type === "pcb_solder_paste",
  )
  expect(solderPaste).toHaveLength(0)

  // Each pad should have the correct number of polygon points (4 for diamond)
  for (const pad of smtPads) {
    expect(pad.points).toHaveLength(4)
  }

  // Verify pads are spread out (distinct centroids along the slider axis)
  const centroids = smtPads.map((pad: any) => {
    const pts = pad.points
    const cx = pts.reduce((s: number, p: any) => s + p.x, 0) / pts.length
    return Math.round(cx * 100) / 100
  })
  const uniqueCentroids = new Set(centroids)
  expect(uniqueCentroids.size).toBe(NUM_PADS)
})

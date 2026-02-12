import { expect, test } from "bun:test"
import React from "react"
import { Circuit } from "../dist"

test("capacitive touch slider with covered smtpads produces correct circuit json", async () => {
  const circuit = new Circuit()

  // A capacitive touch slider consists of multiple pads in a row, each
  // covered with solder mask so that a finger can slide across them
  // without directly contacting the copper.
  const sliderPadCount = 5
  const padWidth = 4 // mm
  const padHeight = 10 // mm
  const padSpacing = 5 // mm
  const totalWidth = sliderPadCount * padSpacing
  const startX = -totalWidth / 2 + padSpacing / 2

  circuit.add(
    <board width="40mm" height="20mm">
      {Array.from({ length: sliderPadCount }, (_, i) => (
        <chip
          key={`PAD${i + 1}`}
          name={`PAD${i + 1}`}
          pcbX={startX + i * padSpacing}
          pcbY={0}
          footprint={
            <footprint>
              <smtpad
                shape="rect"
                width={`${padWidth}mm`}
                height={`${padHeight}mm`}
                portHints={["1"]}
                coveredWithSolderMask
              />
            </footprint>
          }
        />
      ))}
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  const smtpads = circuitJson.filter(
    (el: any) => el.type === "pcb_smtpad",
  ) as any[]

  // Verify all slider pads are covered with solder mask
  const coveredPads = smtpads.filter(
    (p: any) => p.is_covered_with_solder_mask === true,
  )
  expect(coveredPads.length).toBe(sliderPadCount)

  // Verify the pads have the correct dimensions
  for (const pad of coveredPads) {
    expect(pad.shape).toBe("rect")
    expect(pad.width).toBeCloseTo(padWidth, 1)
    expect(pad.height).toBeCloseTo(padHeight, 1)
  }

  // Verify pads are spaced correctly across the board
  const xPositions = coveredPads
    .map((p: any) => p.x)
    .sort((a: number, b: number) => a - b)
  for (let i = 1; i < xPositions.length; i++) {
    const spacing = xPositions[i] - xPositions[i - 1]
    expect(spacing).toBeCloseTo(padSpacing, 1)
  }
})

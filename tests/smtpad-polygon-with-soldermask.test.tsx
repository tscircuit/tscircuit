import { expect, test } from "bun:test"
import React from "react"
import { Circuit } from "../dist"

test("polygon smtpads with coveredWithSolderMask for capacitive touch slider", async () => {
  const circuit = new Circuit()

  // A capacitive touch slider uses polygon-shaped pads covered with solder mask.
  // The solder mask protects the copper from oxidation while allowing
  // capacitive sensing through the thin mask layer.
  circuit.add(
    <board width="50mm" height="20mm">
      {/* 5 polygon touch pads arranged horizontally */}
      {Array.from({ length: 5 }, (_, i) => (
        <chip
          key={`PAD${i + 1}`}
          name={`PAD${i + 1}`}
          pcbX={-16 + i * 8}
          pcbY={0}
          footprint={
            <footprint>
              <smtpad
                shape="polygon"
                points={[
                  { x: 0, y: -3 },
                  { x: 5, y: -3 },
                  { x: 5, y: 3 },
                  { x: 0, y: 3 },
                ]}
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

  // Find all pcb_smtpad elements
  const smtpads = circuitJson.filter(
    (el: any) => el.type === "pcb_smtpad",
  ) as any[]

  expect(smtpads.length).toBe(5)

  for (const pad of smtpads) {
    // Verify polygon shape
    expect(pad.shape).toBe("polygon")

    // Verify solder mask coverage is set
    expect(pad.is_covered_with_solder_mask).toBe(true)

    // Verify polygon points are present (polygon smtpads use points, not x/y)
    expect(pad.points).toBeTruthy()
    expect(pad.points.length).toBe(4)
  }

  // Verify no solder paste generated (covered pads should not have paste)
  const solderPaste = circuitJson.filter(
    (el: any) => el.type === "pcb_solder_paste",
  )
  expect(solderPaste.length).toBe(0)

  // Verify pads are positioned at different x locations by checking centroids
  const centroids = smtpads.map((pad: any) => {
    const cx =
      pad.points.reduce((sum: number, p: any) => sum + p.x, 0) /
      pad.points.length
    return cx
  })
  const sortedCentroids = [...centroids].sort((a: number, b: number) => a - b)

  // All centroids should be distinct (pads spread across the board)
  for (let i = 1; i < sortedCentroids.length; i++) {
    expect(sortedCentroids[i]).not.toBe(sortedCentroids[i - 1])
  }

  // Snapshot the polygon smtpad elements to catch regressions
  const smtpadSnapshot = smtpads.map((pad: any) => ({
    type: pad.type,
    shape: pad.shape,
    is_covered_with_solder_mask: pad.is_covered_with_solder_mask,
    points: pad.points,
  }))
  expect(smtpadSnapshot).toMatchSnapshot()
})

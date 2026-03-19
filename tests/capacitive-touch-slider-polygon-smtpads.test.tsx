import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"

test("capacitive touch slider with polygon smtpads and solder mask", () => {
  const circuit = new Circuit()

  const padSpacing = 2.5
  const numPads = 5

  const diamondPoints = (cx: number, cy: number, r: number) => [
    { x: cx, y: cy - r },
    { x: cx + r, y: cy },
    { x: cx, y: cy + r },
    { x: cx - r, y: cy },
  ]

  circuit.add(
    <board width={20} height={10} autorouter="auto">
      {Array.from({ length: numPads }, (_, i) => {
        const cx = (i - (numPads - 1) / 2) * padSpacing
        return (
          <smtpad
            key={i}
            name={`PAD${i + 1}`}
            shape="polygon"
            points={diamondPoints(cx, 0, 1)}
            layer="top"
            coveredWithSolderMask={true}
          />
        )
      })}
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  const smtpads = circuitJson.filter((el: any) => el.type === "pcb_smtpad")
  const solderPaste = circuitJson.filter(
    (el: any) => el.type === "pcb_solder_paste",
  )

  expect(smtpads).toHaveLength(numPads)

  for (const pad of smtpads) {
    expect(pad.shape).toBe("polygon")
    expect(pad.is_covered_with_solder_mask).toBe(true)
    expect(pad.points).toHaveLength(4)
  }

  expect(solderPaste).toHaveLength(0)
})

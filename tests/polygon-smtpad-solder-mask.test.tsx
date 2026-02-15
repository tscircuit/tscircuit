import { expect, test } from "bun:test"
import React from "react"
import { Circuit } from "../dist"

test("polygon smtpad with coveredWithSolderMask sets is_covered_with_solder_mask in circuit json", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="polygon"
              points={[
                { x: -3, y: -3 },
                { x: 3, y: -3 },
                { x: 3, y: 3 },
                { x: -3, y: 3 },
              ]}
              portHints={["pin1"]}
              coveredWithSolderMask
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  const smtpads = circuitJson.filter(
    (el: any) => el.type === "pcb_smtpad",
  ) as any[]

  expect(smtpads.length).toBeGreaterThan(0)

  const polygonPad = smtpads.find((p: any) => p.shape === "polygon")
  expect(polygonPad).toBeTruthy()
  expect(polygonPad.is_covered_with_solder_mask).toBe(true)
  expect(polygonPad.points).toBeTruthy()
  expect(polygonPad.points.length).toBe(4)
})

import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"
import { convertCircuitJsonToPinoutSvg } from "circuit-to-svg"

test("pinout pipeline keeps board title and pin label metadata", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={20} height={20} title="My Demo Board">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          1: "VIN",
          2: "GND",
          3: "SCL",
          4: "SDA",
        }}
        pinAttributes={{
          1: { color: "gray", labels: ["VIN"] },
          2: { color: "gray", labels: ["GND"] },
          3: { color: "gray", labels: ["SCL"] },
          4: { color: "gray", labels: ["SDA"] },
        }}
      />
    </board>,
  )

  circuit.render()
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const pinoutSvg = convertCircuitJsonToPinoutSvg(circuitJson)

  expect(pinoutSvg).toBeTruthy()
  expect(pinoutSvg).toContain("My Demo Board")
  expect(JSON.stringify(circuitJson)).toMatch(/VIN|GND|SCL|SDA/)
})

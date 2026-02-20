import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"

test("pinout svg includes board title and pin label metadata path", async () => {
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

  await circuit.render()
  const pinoutSvg = circuit.getPinoutSvg()

  expect(pinoutSvg).toBeTruthy()
  expect(pinoutSvg).toContain("My Demo Board")
  expect(pinoutSvg).toMatch(/VIN|GND|SCL|SDA/)
})

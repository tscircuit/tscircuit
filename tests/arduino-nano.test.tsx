import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"

test("Arduino Nano compiles without errors", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="18mm" height="43.18mm">
      <chip
        name="U1"
        manufacturerPartNumber="ATmega328P-PU"
        footprint="dip28_p2.54mm"
        pinLabels={{
          pin1: "RESET",
          pin2: "RXD",
          pin3: "TXD",
          pin7: "VCC",
          pin8: "GND",
          pin9: "XTAL1",
          pin10: "XTAL2",
          pin19: "D13_SCK",
          pin20: "AVCC",
          pin21: "AREF",
          pin22: "GND2",
        }}
      />
      <resistor
        name="R1"
        resistance="10kohm"
        footprint="0402"
        connections={{ pin1: "net.VCC5", pin2: "net.RESET" }}
      />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()
  expect(circuitJson).toBeTruthy()
  expect(circuitJson.length).toBeGreaterThan(0)
})

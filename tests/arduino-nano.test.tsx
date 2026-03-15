import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"

// Minimal test that validates the Arduino Nano snippet compiles
// Full circuit rendering is CPU-intensive; we test component creation
test("Arduino Nano snippet imports and creates circuit json", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="45mm" height="18mm" routingDisabled>
      <chip
        name="U1"
        footprint="tqfp32"
        manufacturerPartNumber="ATmega328P-AU"
        pinLabels={{
          pin30: "PD0_RXD",
          pin31: "PD1_TXD",
          pin7: "XTAL1",
          pin8: "XTAL2",
          pin29: "N_RESET",
          pin17: "PB5_SCK",
          pin4: "VCC1",
          pin3: "GND1",
        }}
      />
      <chip
        name="U2"
        footprint="soic16"
        manufacturerPartNumber="CH340G"
        pinLabels={{
          pin2: "TXD",
          pin3: "RXD",
          pin16: "VCC",
          pin1: "GND",
        }}
      />
      <resistor name="R1" resistance="1k" footprint="0402" />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <led name="LED1" footprint="0402" color="green" />
      <trace from=".U2 > .TXD" to=".U1 > .PD0_RXD" />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toBeTruthy()
  expect(Array.isArray(circuitJson)).toBe(true)

  const components = circuitJson.filter(
    (item: any) => item.type === "source_component",
  )
  expect(components.length).toBeGreaterThanOrEqual(5)

  const board = circuitJson.find((item: any) => item.type === "source_board")
  expect(board).toBeDefined()
})

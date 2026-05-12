import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"
import { ArduinoNano } from "../snippets/arduino-nano"

test("Arduino Nano compiles to circuit JSON", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  expect(Array.isArray(circuitJson)).toBe(true)
  expect(circuitJson.length).toBeGreaterThan(0)
})

test("Arduino Nano board dimensions are 45mm × 18mm", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const board = circuitJson.find((item: any) => item.type === "pcb_board")
  expect(board).toBeDefined()
  expect(board?.width).toBe(45)
  expect(board?.height).toBe(18)
})

test("Arduino Nano has expected ICs: ATmega328P, CH340G, and regulators", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const components = circuitJson.filter(
    (item: any) => item.type === "source_component",
  )

  const names = components.map((c: any) => c.name)
  expect(names).toContain("U1")
  expect(names).toContain("U2")
  expect(names).toContain("U3")
  expect(names).toContain("U4")
})

test("Arduino Nano has crystal oscillators Y1 and Y2", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const components = circuitJson.filter(
    (item: any) => item.type === "source_component",
  )

  const names = components.map((c: any) => c.name)
  expect(names).toContain("Y1")
  expect(names).toContain("Y2")
})

import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"
import { ArduinoNano } from "../snippets/arduino-nano"

test("Arduino Nano circuit compiles and renders successfully", async () => {
  const circuit = new Circuit()

  circuit.add(<ArduinoNano />)

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toBeTruthy()
  expect(circuitJson).toBeDefined()
  expect(Array.isArray(circuitJson)).toBe(true)
})

test("Arduino Nano contains required components", async () => {
  const circuit = new Circuit()

  circuit.add(<ArduinoNano />)

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  // Check that the circuit has components
  const components = circuitJson.filter(
    (item: any) => item.type === "source_component",
  )
  expect(components.length).toBeGreaterThan(0)

  // Check that the board is defined
  const board = circuitJson.find((item: any) => item.type === "source_board")
  expect(board).toBeDefined()
})

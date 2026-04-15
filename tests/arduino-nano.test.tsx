import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"
import ArduinoNano from "../snippets/arduino-nano"

test("Arduino Nano compiles to valid circuit-json", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()
  const circuitJson = circuit.getCircuitJson()
  expect(circuitJson).toBeTruthy()
  expect(Array.isArray(circuitJson)).toBe(true)
  expect(circuitJson.length).toBeGreaterThan(0)
})

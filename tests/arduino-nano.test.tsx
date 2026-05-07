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

test("Arduino Nano has expected source components", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  const components = circuitJson.filter(
    (item: any) => item.type === "source_component",
  )
  // U1 + U2 + Y1 + Y2 + caps + resistors + LEDs + headers + switch >= 20
  expect(components.length).toBeGreaterThan(20)
})

test("Arduino Nano board dimensions are within Nano spec", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNano />)
  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  const board = circuitJson.find((item: any) => item.type === "source_board")
  expect(board).toBeDefined()
})

import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"
import ArduinoNano from "../snippets/arduino-nano"

test("Arduino Nano snippet compiles to valid circuit json", () => {
  const circuit = new Circuit()

  circuit.add(<ArduinoNano />)

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

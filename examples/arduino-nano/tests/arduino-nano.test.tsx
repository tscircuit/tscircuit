import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../../../dist"
import { ArduinoNanoV3 } from "../ArduinoNanoV3"

test("Arduino Nano V3 generates valid circuit JSON", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNanoV3 />)
  circuit.render()

  const json = circuit.getCircuitJson()
  expect(json).toBeTruthy()

  // Verify we have at least 20 source components (21 in BOM)
  const components = json.filter((el: any) => el.type === "source_component")
  expect(components.length).toBeGreaterThanOrEqual(20)
})

test("Arduino Nano V3 has correct board dimensions", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNanoV3 />)
  circuit.render()

  const json = circuit.getCircuitJson()
  const board = json.find((el: any) => el.type === "pcb_board") as any
  expect(board).toBeTruthy()
  expect(board.width).toBe(18)
  expect(board.height).toBe(45)
})

test("Arduino Nano V3 has traces defined", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNanoV3 />)
  circuit.render()

  const json = circuit.getCircuitJson()
  const traces = json.filter((el: any) => el.type === "source_trace")
  // We have 60+ traces across all modules
  expect(traces.length).toBeGreaterThanOrEqual(30)
})

test("Arduino Nano V3 includes core MCU and USB-serial IC", async () => {
  const circuit = new Circuit()
  circuit.add(<ArduinoNanoV3 />)
  circuit.render()

  const json = circuit.getCircuitJson()
  const names = json
    .filter((el: any) => el.type === "source_component")
    .map((el: any) => el.name)

  expect(names).toContain("U1")
  expect(names).toContain("U2")
  expect(names).toContain("U3")
})

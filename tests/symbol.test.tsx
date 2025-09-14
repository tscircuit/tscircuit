import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"


test("add resistor with symbol", async () => {
  const circuit = new Circuit()

  // Add a resistor with a symbol to the circuit
  circuit.add(
    <board width={10} height={10}>
      <resistor name="R1" resistance="10kohm" symbol="test-symbol" />
    </board>
  )

  // Render the circuit
  circuit.render()
  
  // Get the circuit JSON
  const circuitJson = circuit.getCircuitJson()
  
  // Basic validation of circuit JSON
  expect(circuitJson).toBeTruthy()
  expect(Array.isArray(circuitJson)).toBe(true)
})

test("add capacitor with symbol", async () => {
  const circuit = new Circuit()

  // Add a capacitor with a symbol to the circuit
  circuit.add(
    <board width={10} height={10}>
      <capacitor name="C1" capacitance="10uF" symbol="test-symbol" />
    </board>
  )

  // Render the circuit
  circuit.render()
  
  // Get the circuit JSON
  const circuitJson = circuit.getCircuitJson()
  
  // Basic validation of circuit JSON
  expect(circuitJson).toBeTruthy()
  expect(Array.isArray(circuitJson)).toBe(true)
})

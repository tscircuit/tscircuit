import React from "react"
import { Circuit } from "./dist"

// Create a new circuit
const circuit = new Circuit()

// Add components to the circuit
circuit.add(
  <board width={10} height={10}>
    <resistor name="R1" resistance="10kohm" />
  </board>
)

// Render the circuit
circuit.render()

// Get the circuit JSON
const circuitJson = circuit.getCircuitJson()
console.log("Circuit created successfully!")
console.log("Circuit JSON:", JSON.stringify(circuitJson, null, 2))

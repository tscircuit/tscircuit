import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"
import { Symbol } from "../src/components/Symbol"

test("render symbol component", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={10} height={10}>
      <Symbol symbol="test-symbol" x={5} y={5} rotation={45} width={2} height={2} />
    </board>
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()
  
  // Verify the symbol was added to the circuit
  expect(circuitJson.components.some((c: any) => c.type === 'symbol')).toBe(true)
  
  // Verify the symbol has the correct properties
  const symbol = circuitJson.components.find((c: any) => c.type === 'symbol')
  expect(symbol).toBeDefined()
  expect(symbol.props.symbol).toBe('test-symbol')
  expect(symbol.props.x).toBe(5)
  expect(symbol.props.y).toBe(5)
  expect(symbol.props.rotation).toBe(45)
  expect(symbol.props.width).toBe(2)
  expect(symbol.props.height).toBe(2)
})

test("normal component with symbol prop", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={10} height={10}>
      <component type="custom" symbol="test-symbol" x={3} y={3} />
    </board>
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()
  
  // Verify the component with symbol was added
  const component = circuitJson.components.find((c: any) => c.type === 'custom')
  expect(component).toBeDefined()
  expect(component.props.symbol).toBe('test-symbol')
})

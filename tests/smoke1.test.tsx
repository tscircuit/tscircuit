import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"

test("smoke test for getting circuit json", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={10} height={10}>
      <resistor name="R1" resistance="10kohm" />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toBeTruthy()
})

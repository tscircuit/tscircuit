import React from "react"
import { test, expect } from "bun:test"
import { runTscircuitCode } from "../dist"

test("smoke test for getting circuit json", async () => {

  const circuitJson = await runTscircuitCode(`
    export default () => (
      <board width={10} height={10}>
        <resistor name="R1" resistance="10kohm" />
      </board>
    )
  `)

  expect(circuitJson).toBeTruthy()
})

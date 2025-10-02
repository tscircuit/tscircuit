import React from "react"
import { test, expect } from "bun:test"
import { runTscircuitCode } from "../dist"

test("board template - arduinoshield", async () => {
  const circuitJson = await runTscircuitCode(`
    export default () => (
      <board width="68.58" height="53.34">
        <resistor name="R1" resistance="10kohm" />
      </board>
    )
  `)

  expect(circuitJson).toBeTruthy()
  const board = circuitJson.find((item: any) => item.type === "pcb_board")
  expect(board).toBeTruthy()
  expect(board?.width).toBe(68.58)
  expect(board?.height).toBe(53.34)
})

test("board template - raspberrypihat", async () => {
  const circuitJson = await runTscircuitCode(`
    export default () => (
      <board width="65" height="56.5">
        <capacitor name="C1" capacitance="10uf" />
      </board>
    )
  `)

  expect(circuitJson).toBeTruthy()
  const board = circuitJson.find((item: any) => item.type === "pcb_board")
  expect(board).toBeTruthy()
  expect(board?.width).toBe(65)
  expect(board?.height).toBe(56.5)
})

test("board template - sparkfunmicromod_processor", async () => {
  const circuitJson = await runTscircuitCode(`
    export default () => (
      <board width="22" height="22">
        <chip name="U1" footprint="sot23" />
      </board>
    )
  `)

  expect(circuitJson).toBeTruthy()
  const board = circuitJson.find((item: any) => item.type === "pcb_board")
  expect(board).toBeTruthy()
  expect(board?.width).toBe(22)
  expect(board?.height).toBe(22)
})

test("board template - sparkfunmicromod_host", async () => {
  const circuitJson = await runTscircuitCode(`
    export default () => (
      <board width="75" height="75">
        <led name="LED1" />
      </board>
    )
  `)

  expect(circuitJson).toBeTruthy()
  const board = circuitJson.find((item: any) => item.type === "pcb_board")
  expect(board).toBeTruthy()
  expect(board?.width).toBe(75)
  expect(board?.height).toBe(75)
})

test("board without template (backward compatibility)", async () => {
  const circuitJson = await runTscircuitCode(`
    export default () => (
      <board width="50mm" height="30mm">
        <resistor name="R1" resistance="1k" />
      </board>
    )
  `)

  expect(circuitJson).toBeTruthy()
  const board = circuitJson.find((item: any) => item.type === "pcb_board")
  expect(board).toBeTruthy()
  expect(board?.width).toBe(50)
  expect(board?.height).toBe(30)
})

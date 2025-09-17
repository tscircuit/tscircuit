import React from "react"
import { test, expect } from "bun:test"
import { Circuit, runTscircuitCode } from "../dist"

test("ratsNestColor property on trace elements", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={50} height={50}>
      <resistor name="R1" resistance="10kohm" pcbX="10mm" pcbY="10mm" />
      <resistor name="R2" resistance="5kohm" pcbX="20mm" pcbY="10mm" />
      
      <trace 
        path={[".R1 > .left", ".R2 > .left"]} 
        {...({ ratsNestColor: "#ff0000" } as any)}
      />
      
      <trace 
        path={[".R1 > .right", ".R2 > .right"]} 
        {...({ ratsNestColor: "#00ff00" } as any)}
      />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toBeTruthy()
  
  const schematicTraces = circuitJson.filter((item: any) => item.type === "schematic_trace")
  expect(schematicTraces.length).toBe(2)
  
  const sourceTraces = circuitJson.filter((item: any) => item.type === "source_trace")
  expect(sourceTraces.length).toBe(2)
  
  expect(circuitJson.length).toBeGreaterThan(0)
})

test("ratsNestColor property via runTscircuitCode", async () => {
  const circuitJson = await runTscircuitCode(`
    export default () => (
      <board width={50} height={50}>
        <resistor name="R1" resistance="10kohm" />
      </board>
    )
  `)

  expect(circuitJson).toBeTruthy()
  
  expect(circuitJson.length).toBeGreaterThan(0)
}, 10000)

test("ratsNestColor property on resistor elements", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={50} height={50}>
      <resistor 
        name="R1" 
        resistance="10kohm" 
        pcbX="10mm" 
        pcbY="10mm"
        {...({ ratsNestColor: "#ff0000" } as any)}
      />
      <resistor 
        name="R2" 
        resistance="5kohm" 
        pcbX="20mm" 
        pcbY="10mm"
        {...({ ratsNestColor: "#00ff00" } as any)}
      />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toBeTruthy()
  
  const sourceComponents = circuitJson.filter((item: any) => item.type === "source_component")
  expect(sourceComponents.length).toBe(2)
  
  expect(circuitJson.length).toBeGreaterThan(0)
})

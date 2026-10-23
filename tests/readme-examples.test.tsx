import { expect, test } from "bun:test"
import React from "react"
import { Circuit, assembly, jscad } from "../index"

test("README programmatic API snippet compiles and executes", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="50mm" height="50mm">
      <resistor
        name="R1"
        resistance="10kohm"
        footprint="0805"
        pcbX="10mm"
        pcbY="10mm"
      />
      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="0805"
        pcbX="25mm"
        pcbY="10mm"
      />
      <trace path={[".R1 > .pin2", ".C1 > .pin1"]} />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toBeDefined()
  expect(circuitJson.length).toBeGreaterThan(0)
  expect(circuitJson.some((e) => e.type === "source_component")).toBe(true)
})

test("README 3D assembly and printedpart snippet compiles and executes", async () => {
  const circuit = new Circuit()

  circuit.add(
    <assembly.device>
      <assembly.motor name="MOTOR" model="nema17_backfaceholes" />
      <assembly.printedpart
        name="SPACER"
        mountedTo="MOTOR.backface"
        mountFace="motor"
        jscad={
          <jscad.union>
            <jscad.cuboid size={[42, 42, 4]} center={[0, 0, 2]} />
            <jscad.rotate angles={[0, Math.PI, 0]}>
              <jscad.rectangle name="motor" size={[42, 42]} reference />
            </jscad.rotate>
            <jscad.translate offset={[0, 0, 4]}>
              <jscad.rectangle name="board" size={[42, 42]} reference />
            </jscad.translate>
          </jscad.union>
        }
      />
      <board
        name="CONTROLLER"
        width={42}
        height={42}
        mountedTo="SPACER.board"
      />
    </assembly.device>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toBeDefined()
  expect(circuitJson.length).toBeGreaterThan(0)
  expect(circuitJson.some((e) => e.type === "cad_component")).toBe(true)
})

import React from "react"
import { expect, test } from "bun:test"
import { Circuit, assembly, jscad } from "tscircuit"

test("published exports assemble a printed part between a motor and board", () => {
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

  const json = circuit.getCircuitJson()
  const sources = json.filter((element) => element.type === "source_component")
  expect(sources.map(({ name, ftype }) => ({ name, ftype }))).toEqual([
    { name: "MOTOR", ftype: "motor" },
    { name: "SPACER", ftype: "printedpart" },
  ])
  const cad = json.filter((element) => element.type === "cad_component")
  expect(cad).toHaveLength(2)
  const spacer = cad.find(
    (model) => model.source_component_id === sources[1].source_component_id,
  )!
  expect(spacer.model_jscad).toMatchObject({ type: "rotate" })
  expect(JSON.stringify(spacer.model_jscad)).not.toContain('"reference":true')
  expect(json.filter((element) => element.type === "pcb_board")).toHaveLength(1)
})

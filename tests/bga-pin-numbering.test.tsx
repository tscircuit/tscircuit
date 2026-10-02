import React from "react"
import { expect, test } from "bun:test"
import { Circuit } from "../dist"

test("the installed runtime preserves sparse column-major BGA identities", async () => {
  const circuit = new Circuit()
  circuit.add(
    <board width={5} height={5}>
      <chip
        name="U1"
        footprint="bga5_grid3x2_p0.8_pad0.4_missing(A1)_blorigin_pinnumbering(columnmajor)"
        pinLabels={{
          pin1: ["B1"],
          pin2: ["A2"],
          pin3: ["B2"],
          pin4: ["A3"],
          pin5: ["B3"],
        }}
        pinAttributes={{
          A2: { requiresPower: true, requiresVoltage: "1.8V" },
          B1: { requiresGround: true },
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.source_port.list()).toHaveLength(5)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(5)
  const supply = circuit.db.source_port
    .list()
    .find((port) => port.pin_number === 2)!
  expect(supply.requires_voltage).toBe("1.8V")
  const pcbPort = circuit.db.pcb_port
    .list()
    .find((port) => port.source_port_id === supply.source_port_id)!
  const pad = circuit.db.pcb_smtpad
    .list()
    .find((pad) => pad.pcb_port_id === pcbPort.pcb_port_id)!
  if (pad.shape !== "circle") throw new Error("Expected a circular BGA pad")
  expect(pad.port_hints).toEqual(["2", "A2"])
  expect(pad.x).toBeCloseTo(0)
  expect(pad.y).toBeCloseTo(0.4)
})

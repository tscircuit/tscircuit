import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"

test("noConnect sets do_not_connect and schematic shows a cross at the pin", () => {
  const circuit = new Circuit()
  circuit.add(
    <board width={10} height={10}>
      <chip
        name="U1"
        footprint="sot23-5"
        pinLabels={{
          pin1: "VIN",
          pin2: "GND",
          pin3: "EN",
          pin4: "NC",
          pin5: "VOUT",
        }}
        noConnect={["pin4"]}
      />
    </board>,
  )
  circuit.render()
  const json = circuit.getCircuitJson()
  const ncPort = json.find(
    (e): e is Extract<(typeof json)[number], { type: "source_port" }> =>
      e.type === "source_port" && e.name === "NC",
  )
  expect(ncPort?.do_not_connect).toBe(true)
  const svg = convertCircuitJsonToSchematicSvg(json)
  const xLines = (svg.match(/<line /g) ?? []).length
  expect(xLines).toBeGreaterThanOrEqual(2)
})

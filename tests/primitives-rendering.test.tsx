import { expect, test } from "bun:test"
import React from "react"
import { Circuit } from "../index"

test("renders core circuit primitives and verifies Circuit JSON serialization", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="60mm" height="60mm">
      <resistor
        name="R1"
        resistance="10kohm"
        footprint="0805"
        pcbX="5mm"
        pcbY="5mm"
      />
      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="0805"
        pcbX="15mm"
        pcbY="5mm"
      />
      <inductor
        name="L1"
        inductance="10uH"
        footprint="0805"
        pcbX="25mm"
        pcbY="5mm"
      />
      <diode
        name="D1"
        footprint="0805"
        pcbX="5mm"
        pcbY="15mm"
      />
      <led
        name="LED1"
        color="green"
        footprint="0805"
        pcbX="15mm"
        pcbY="15mm"
      />
      <via
        fromLayer="top"
        toLayer="bottom"
        x="30mm"
        y="10mm"
        holeDiameter="0.3mm"
        outerDiameter="0.6mm"
      />
      <hole x="35mm" y="10mm" diameter="2mm" />
      <platedhole x="40mm" y="10mm" holeDiameter="1mm" outerDiameter="1.6mm" />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  expect(circuitJson).toBeDefined()
  expect(Array.isArray(circuitJson)).toBe(true)

  // Verify board presence
  const boards = circuitJson.filter((e) => e.type === "pcb_board")
  expect(boards.length).toBe(1)
  expect(boards[0].width).toBe(60)
  expect(boards[0].height).toBe(60)

  // Verify source components created
  const sourceComponents = circuitJson.filter((e) => e.type === "source_component")
  const sourceNames = sourceComponents.map((c: any) => c.name)
  expect(sourceNames).toContain("R1")
  expect(sourceNames).toContain("C1")
  expect(sourceNames).toContain("L1")
  expect(sourceNames).toContain("D1")
  expect(sourceNames).toContain("LED1")

  // Verify pcb vias, holes, plated holes
  const vias = circuitJson.filter((e) => e.type === "pcb_via")
  expect(vias.length).toBeGreaterThanOrEqual(1)

  const holes = circuitJson.filter((e) => e.type === "pcb_hole")
  expect(holes.length).toBeGreaterThanOrEqual(1)

  const platedHoles = circuitJson.filter((e) => e.type === "pcb_plated_hole")
  expect(platedHoles.length).toBeGreaterThanOrEqual(1)
})

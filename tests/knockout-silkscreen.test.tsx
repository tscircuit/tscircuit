import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

test("knockout silkscreen text produces is_knockout in circuit json", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={10} height={10}>
      <silkscreentext
        text="HELLO"
        pcbX={0}
        pcbY={0}
        isKnockout={true}
        layer="top"
        anchorAlignment="center"
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  const silkscreenTextEl = circuitJson.find(
    (el: any) => el.type === "pcb_silkscreen_text",
  ) as any

  expect(silkscreenTextEl).toBeTruthy()
  expect(silkscreenTextEl.is_knockout).toBe(true)
})

test("knockout silkscreen text with padding produces SVG mask element", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={10} height={10}>
      <silkscreentext
        text="HELLO"
        pcbX={0}
        pcbY={0}
        isKnockout={true}
        knockoutPadding={0.3}
        layer="top"
        anchorAlignment="center"
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  const silkscreenTextEl = circuitJson.find(
    (el: any) => el.type === "pcb_silkscreen_text",
  ) as any

  expect(silkscreenTextEl).toBeTruthy()
  expect(silkscreenTextEl.is_knockout).toBe(true)
  expect(silkscreenTextEl.knockout_padding).toBeTruthy()
  expect(silkscreenTextEl.knockout_padding.left).toBe(0.3)
  expect(silkscreenTextEl.knockout_padding.right).toBe(0.3)
  expect(silkscreenTextEl.knockout_padding.top).toBe(0.3)
  expect(silkscreenTextEl.knockout_padding.bottom).toBe(0.3)

  const svg = convertCircuitJsonToPcbSvg(circuitJson as any)

  expect(svg).toContain("pcb-silkscreen-text-knockout")
  expect(svg).toContain("<mask")
})

test("non-knockout silkscreen text does not produce mask element", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={10} height={10}>
      <silkscreentext
        text="HELLO"
        pcbX={0}
        pcbY={0}
        layer="top"
        anchorAlignment="center"
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  const silkscreenTextEl = circuitJson.find(
    (el: any) => el.type === "pcb_silkscreen_text",
  ) as any

  expect(silkscreenTextEl).toBeTruthy()
  expect(silkscreenTextEl.is_knockout).toBeFalsy()

  const svg = convertCircuitJsonToPcbSvg(circuitJson as any)

  expect(svg).not.toContain("pcb-silkscreen-text-knockout")
})

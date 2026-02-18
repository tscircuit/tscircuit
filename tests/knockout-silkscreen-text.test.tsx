import React from "react"
import { test, expect } from "bun:test"
import { Circuit } from "../dist"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

test("knockout silkscreen text generates correct circuit json", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={20} height={20}>
      <chip
        name="U1"
        footprint="soic8"
        pcbX={0}
        pcbY={0}
      />
      <silkscreentext
        text="KNOCKOUT"
        pcbX={0}
        pcbY={5}
        fontSize={1}
        isKnockout={true}
      />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  const silkscreenTexts = circuitJson.filter(
    (el: any) => el.type === "pcb_silkscreen_text",
  )

  // Find the knockout silkscreen text (not auto-generated component labels)
  const knockoutText = silkscreenTexts.find(
    (el: any) => el.text === "KNOCKOUT",
  )

  expect(knockoutText).toBeTruthy()
  expect(knockoutText.is_knockout).toBe(true)
  expect(knockoutText.text).toBe("KNOCKOUT")
})

test("knockout silkscreen text with custom padding generates correct circuit json", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={20} height={20}>
      <chip
        name="U1"
        footprint="soic8"
        pcbX={0}
        pcbY={0}
      />
      <silkscreentext
        text="PADDED"
        pcbX={0}
        pcbY={5}
        fontSize={1.5}
        isKnockout={true}
        knockoutPadding="0.5mm"
      />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  const knockoutText = circuitJson.find(
    (el: any) => el.type === "pcb_silkscreen_text" && el.text === "PADDED",
  )

  expect(knockoutText).toBeTruthy()
  expect(knockoutText.is_knockout).toBe(true)
  expect(knockoutText.knockout_padding).toBeTruthy()
  expect(knockoutText.knockout_padding.left).toBe(0.5)
  expect(knockoutText.knockout_padding.right).toBe(0.5)
  expect(knockoutText.knockout_padding.top).toBe(0.5)
  expect(knockoutText.knockout_padding.bottom).toBe(0.5)
})

test("knockout silkscreen text with per-side padding", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={20} height={20}>
      <chip
        name="U1"
        footprint="soic8"
        pcbX={0}
        pcbY={0}
      />
      <silkscreentext
        text="ASYMMETRIC"
        pcbX={0}
        pcbY={5}
        fontSize={1}
        isKnockout={true}
        knockoutPaddingLeft="0.3mm"
        knockoutPaddingRight="0.5mm"
        knockoutPaddingTop="0.2mm"
        knockoutPaddingBottom="0.4mm"
      />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  const knockoutText = circuitJson.find(
    (el: any) => el.type === "pcb_silkscreen_text" && el.text === "ASYMMETRIC",
  )

  expect(knockoutText).toBeTruthy()
  expect(knockoutText.is_knockout).toBe(true)
  expect(knockoutText.knockout_padding).toBeTruthy()
  expect(knockoutText.knockout_padding.left).toBe(0.3)
  expect(knockoutText.knockout_padding.right).toBe(0.5)
  expect(knockoutText.knockout_padding.top).toBe(0.2)
  expect(knockoutText.knockout_padding.bottom).toBe(0.4)
})

test("knockout silkscreen text renders to SVG with mask", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={20} height={20}>
      <chip
        name="U1"
        footprint="soic8"
        pcbX={0}
        pcbY={0}
      />
      <silkscreentext
        text="KO"
        pcbX={0}
        pcbY={5}
        fontSize={1}
        isKnockout={true}
      />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  const svg = convertCircuitJsonToPcbSvg(circuitJson as any)

  // Knockout rendering uses SVG masks
  expect(svg).toContain("silkscreen-knockout-mask")
  expect(svg).toContain("<mask")
  expect(svg).toContain("pcb-silkscreen-text-knockout")
})

test("non-knockout silkscreen text does not include mask", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width={20} height={20}>
      <silkscreentext
        text="NORMAL"
        pcbX={0}
        pcbY={0}
        fontSize={1}
      />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  const svg = convertCircuitJsonToPcbSvg(circuitJson as any)

  // Normal text should not have knockout mask elements
  expect(svg).not.toContain("pcb-silkscreen-text-knockout")
})

import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSilkscreenTexts } from "../index"

test("getSilkscreenTexts extracts text properties, layers, and positions", () => {
  const circuitJson: CircuitJson = [
    {
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: "txt1",
      text: "STATUS_LED",
      layer: "top",
      anchor_position: { x: 5, y: 10 },
      font: "tscircuit2024",
      font_size: 1.2,
      pcb_component_id: "c1",
    },
    {
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: "txt2",
      text: "LOGO",
      layer: "bottom",
      anchor_position: { x: 0, y: 0 },
      font: "tscircuit2024",
      font_size: 2.0,
    },
  ]

  const texts = getSilkscreenTexts(circuitJson)

  expect(texts.length).toBe(2)

  const logo = texts.find((t) => t.text === "LOGO")
  expect(logo?.layer).toBe("bottom")
  expect(logo?.fontSize).toBe(2.0)

  const status = texts.find((t) => t.text === "STATUS_LED")
  expect(status?.layer).toBe("top")
  expect(status?.x).toBe(5)
  expect(status?.y).toBe(10)
  expect(status?.componentId).toBe("c1")
})

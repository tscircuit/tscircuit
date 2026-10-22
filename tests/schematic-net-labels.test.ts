import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSchematicNetLabels } from "../index"

test("getSchematicNetLabels extracts text, coordinates, and linked net names", () => {
  const circuitJson: CircuitJson = [
    { type: "source_net", source_net_id: "sn_vcc", name: "VCC_3V3" },
    {
      type: "schematic_net_label",
      schematic_net_label_id: "snl_1",
      source_net_id: "sn_vcc",
      text: "VCC",
      center: { x: 10, y: 5 },
      anchor_side: "left",
    },
    {
      type: "schematic_net_label",
      schematic_net_label_id: "snl_2",
      text: "GND",
      center: { x: 10, y: 0 },
      anchor_side: "right",
    },
  ]

  const labels = getSchematicNetLabels(circuitJson)

  expect(labels.length).toBe(2)

  const gnd = labels.find((l) => l.text === "GND")
  expect(gnd?.center.x).toBe(10)
  expect(gnd?.center.y).toBe(0)
  expect(gnd?.anchorSide).toBe("right")

  const vcc = labels.find((l) => l.text === "VCC_3V3")
  expect(vcc?.sourceNetId).toBe("sn_vcc")
  expect(vcc?.center.x).toBe(10)
  expect(vcc?.center.y).toBe(5)
  expect(vcc?.anchorSide).toBe("left")
})

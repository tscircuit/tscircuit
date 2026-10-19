import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import {
  isFabricationNote,
  isPcbGroup,
  isPcbSubpanel,
  isSchematicGroup,
  isSilkscreenElement,
  isSourceGroup,
} from "../index"

test("subcircuit and group guards correctly classify hierarchy elements", () => {
  const elements: AnyCircuitElement[] = [
    { type: "source_group", source_group_id: "sg_1" },
    { type: "pcb_group", pcb_group_id: "pg_1", source_group_id: "sg_1" },
    {
      type: "schematic_group",
      schematic_group_id: "schg_1",
      source_group_id: "sg_1",
    },
    { type: "pcb_subpanel", pcb_subpanel_id: "panel_1" },
    {
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: "st_1",
      text: "REV 1",
      layer: "top",
      font: "tscircuit2024",
      font_size: 1,
      pcb_component_id: "c1",
    },
    {
      type: "pcb_board",
      pcb_board_id: "b1",
      width: 10,
      height: 10,
      center: { x: 0, y: 0 },
    },
  ]

  expect(elements.filter(isSourceGroup).length).toBe(1)
  expect(elements.filter(isPcbGroup).length).toBe(1)
  expect(elements.filter(isSchematicGroup).length).toBe(1)
  expect(elements.filter(isPcbSubpanel).length).toBe(1)
  expect(elements.filter(isSilkscreenElement).length).toBe(1)
  expect(elements.filter(isFabricationNote).length).toBe(0)
})

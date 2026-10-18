import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import {
  isPcbBoard,
  isPcbComponent,
  isPcbHole,
  isPcbPlatedHole,
  isPcbPort,
  isPcbSmtPad,
  isPcbTrace,
  isPcbVia,
  isSchematicBox,
  isSchematicComponent,
  isSchematicPort,
  isSchematicText,
  isSchematicTrace,
  isSourceComponent,
  isSourceGroup,
  isSourceNet,
  isSourcePort,
  isSourceTrace,
} from "../index"

test("type guards correctly discriminate Circuit JSON elements", () => {
  const elements: AnyCircuitElement[] = [
    { type: "pcb_board", width: 10, height: 10, center: { x: 0, y: 0 }, pcb_board_id: "b1" },
    { type: "pcb_component", source_component_id: "s1", pcb_component_id: "pc1", center: { x: 0, y: 0 }, layer: "top", rotation: 0, width: 2, height: 1 },
    { type: "pcb_hole", hole_shape: "round", hole_diameter: 1, x: 0, y: 0, pcb_hole_id: "h1" },
    { type: "pcb_plated_hole", shape: "circle", outer_diameter: 2, hole_diameter: 1, x: 0, y: 0, layers: ["top", "bottom"], pcb_plated_hole_id: "ph1" },
    { type: "pcb_port", pcb_port_id: "p1", source_port_id: "sp1", x: 0, y: 0, layers: ["top"] },
    { type: "pcb_smtpad", shape: "rect", width: 1, height: 1, x: 0, y: 0, layer: "top", pcb_smtpad_id: "sm1" },
    { type: "pcb_trace", route: [], pcb_trace_id: "t1" },
    { type: "pcb_via", x: 0, y: 0, hole_diameter: 0.3, outer_diameter: 0.6, layers: ["top", "bottom"], from_layer: "top", to_layer: "bottom", pcb_via_id: "v1" },
    { type: "source_component", source_component_id: "sc1", name: "R1", ftype: "simple_resistor" },
    { type: "source_group", source_group_id: "sg1" },
    { type: "source_net", source_net_id: "sn1", name: "VCC", member_source_group_ids: [] },
    { type: "source_port", source_port_id: "sport1", name: "pin1", source_component_id: "sc1" },
    { type: "source_trace", source_trace_id: "st1", connected_source_port_ids: [], connected_source_net_ids: [] },
    { type: "schematic_component", schematic_component_id: "schc1", source_component_id: "sc1", center: { x: 0, y: 0 }, rotation: 0, size: { width: 1, height: 1 } },
    { type: "schematic_port", schematic_port_id: "schp1", source_port_id: "sport1", center: { x: 0, y: 0 }, facing_direction: "up" },
    { type: "schematic_trace", schematic_trace_id: "scht1", edges: [] },
    { type: "schematic_box", schematic_box_id: "schb1", width: 1, height: 1, x: 0, y: 0 },
    { type: "schematic_text", schematic_text_id: "schtxt1", text: "Test", position: { x: 0, y: 0 } },
  ]

  expect(elements.filter(isPcbBoard).length).toBe(1)
  expect(elements.filter(isPcbComponent).length).toBe(1)
  expect(elements.filter(isPcbHole).length).toBe(1)
  expect(elements.filter(isPcbPlatedHole).length).toBe(1)
  expect(elements.filter(isPcbPort).length).toBe(1)
  expect(elements.filter(isPcbSmtPad).length).toBe(1)
  expect(elements.filter(isPcbTrace).length).toBe(1)
  expect(elements.filter(isPcbVia).length).toBe(1)
  expect(elements.filter(isSourceComponent).length).toBe(1)
  expect(elements.filter(isSourceGroup).length).toBe(1)
  expect(elements.filter(isSourceNet).length).toBe(1)
  expect(elements.filter(isSourcePort).length).toBe(1)
  expect(elements.filter(isSourceTrace).length).toBe(1)
  expect(elements.filter(isSchematicComponent).length).toBe(1)
  expect(elements.filter(isSchematicPort).length).toBe(1)
  expect(elements.filter(isSchematicTrace).length).toBe(1)
  expect(elements.filter(isSchematicBox).length).toBe(1)
  expect(elements.filter(isSchematicText).length).toBe(1)
})

import type {
  AnyCircuitElement,
  PcbBoard,
  PcbComponent,
  PcbHole,
  PcbPlatedHole,
  PcbPort,
  PcbSmtPad,
  PcbTrace,
  PcbVia,
  SchematicBox,
  SchematicComponent,
  SchematicPort,
  SchematicText,
  SchematicTrace,
  SourceComponent,
  SourceGroup,
  SourceNet,
  SourcePort,
  SourceTrace,
} from "circuit-json"

export const isPcbBoard = (e: AnyCircuitElement): e is PcbBoard =>
  e.type === "pcb_board"

export const isPcbComponent = (e: AnyCircuitElement): e is PcbComponent =>
  e.type === "pcb_component"

export const isPcbHole = (e: AnyCircuitElement): e is PcbHole =>
  e.type === "pcb_hole"

export const isPcbPlatedHole = (e: AnyCircuitElement): e is PcbPlatedHole =>
  e.type === "pcb_plated_hole"

export const isPcbPort = (e: AnyCircuitElement): e is PcbPort =>
  e.type === "pcb_port"

export const isPcbSmtPad = (e: AnyCircuitElement): e is PcbSmtPad =>
  e.type === "pcb_smtpad"

export const isPcbTrace = (e: AnyCircuitElement): e is PcbTrace =>
  e.type === "pcb_trace"

export const isPcbVia = (e: AnyCircuitElement): e is PcbVia =>
  e.type === "pcb_via"

export const isSourceComponent = (e: AnyCircuitElement): e is SourceComponent =>
  e.type === "source_component"

export const isSourceGroup = (e: AnyCircuitElement): e is SourceGroup =>
  e.type === "source_group"

export const isSourceNet = (e: AnyCircuitElement): e is SourceNet =>
  e.type === "source_net"

export const isSourcePort = (e: AnyCircuitElement): e is SourcePort =>
  e.type === "source_port"

export const isSourceTrace = (e: AnyCircuitElement): e is SourceTrace =>
  e.type === "source_trace"

export const isSchematicComponent = (
  e: AnyCircuitElement,
): e is SchematicComponent => e.type === "schematic_component"

export const isSchematicPort = (e: AnyCircuitElement): e is SchematicPort =>
  e.type === "schematic_port"

export const isSchematicTrace = (e: AnyCircuitElement): e is SchematicTrace =>
  e.type === "schematic_trace"

export const isSchematicBox = (e: AnyCircuitElement): e is SchematicBox =>
  e.type === "schematic_box"

export const isSchematicText = (e: AnyCircuitElement): e is SchematicText =>
  e.type === "schematic_text"

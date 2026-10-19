import type {
  AnyCircuitElement,
  PcbGroup,
  PcbSubpanel,
  SchematicGroup,
  SourceGroup,
} from "circuit-json"

export const isSourceGroup = (e: AnyCircuitElement): e is SourceGroup =>
  e.type === "source_group"

export const isPcbGroup = (e: AnyCircuitElement): e is PcbGroup =>
  e.type === "pcb_group"

export const isSchematicGroup = (e: AnyCircuitElement): e is SchematicGroup =>
  e.type === "schematic_group"

export const isPcbSubpanel = (e: AnyCircuitElement): e is PcbSubpanel =>
  e.type === "pcb_subpanel"

export const isFabricationNote = (e: AnyCircuitElement): boolean =>
  e.type.startsWith("fabrication_note_") ||
  e.type.startsWith("pcb_fabrication_note_")

export const isSilkscreenElement = (e: AnyCircuitElement): boolean =>
  e.type.startsWith("pcb_silkscreen_")

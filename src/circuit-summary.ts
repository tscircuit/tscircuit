import type { AnyCircuitElement, CircuitJson } from "circuit-json"

export interface CircuitSummary {
  totalElements: number
  boardCount: number
  sourceComponentCount: number
  pcbComponentCount: number
  schematicComponentCount: number
  traceCount: number
  viaCount: number
  holeCount: number
  netCount: number
  portCount: number
  byType: Record<string, number>
}

export function getCircuitSummary(circuitJson: CircuitJson): CircuitSummary {
  const byType: Record<string, number> = {}

  let boardCount = 0
  let sourceComponentCount = 0
  let pcbComponentCount = 0
  let schematicComponentCount = 0
  let traceCount = 0
  let viaCount = 0
  let holeCount = 0
  let netCount = 0
  let portCount = 0

  for (const element of circuitJson) {
    const type = element.type
    byType[type] = (byType[type] || 0) + 1

    if (type === "pcb_board") boardCount++
    else if (type === "source_component") sourceComponentCount++
    else if (type === "pcb_component") pcbComponentCount++
    else if (type === "schematic_component") schematicComponentCount++
    else if (
      type === "pcb_trace" ||
      type === "source_trace" ||
      type === "schematic_trace"
    )
      traceCount++
    else if (type === "pcb_via") viaCount++
    else if (type === "pcb_hole" || type === "pcb_plated_hole") holeCount++
    else if (type === "source_net") netCount++
    else if (
      type === "source_port" ||
      type === "pcb_port" ||
      type === "schematic_port"
    )
      portCount++
  }

  return {
    totalElements: circuitJson.length,
    boardCount,
    sourceComponentCount,
    pcbComponentCount,
    schematicComponentCount,
    traceCount,
    viaCount,
    holeCount,
    netCount,
    portCount,
    byType,
  }
}

import type {
  CircuitJson,
  SchematicComponent,
  SourceComponent,
} from "circuit-json"

export interface SchematicSymbolSummary {
  totalSchematicComponents: number
  totalSchematicPorts: number
  unplacedComponentIds: string[]
  componentsBySymbolType: Record<string, number>
}

/**
 * Summarizes schematic symbols and identifies source components not placed in schematic view.
 */
export function getSchematicSymbolSummary(
  circuitJson: CircuitJson,
): SchematicSymbolSummary {
  if (!Array.isArray(circuitJson)) {
    return {
      totalSchematicComponents: 0,
      totalSchematicPorts: 0,
      unplacedComponentIds: [],
      componentsBySymbolType: {},
    }
  }

  const placedSourceComponentIds = new Set<string>()
  const allSourceComponentIds = new Set<string>()
  const symbolTypeCounts: Record<string, number> = {}
  let totalSchematicPorts = 0

  for (const element of circuitJson) {
    if (element.type === "source_component") {
      const sc = element as SourceComponent
      if (sc.source_component_id) {
        allSourceComponentIds.add(sc.source_component_id)
      }
    } else if (element.type === "schematic_component") {
      const schComp = element as SchematicComponent
      if (schComp.source_component_id) {
        placedSourceComponentIds.add(schComp.source_component_id)
      }
      const symType =
        (schComp as any).symbol_name || (schComp as any).ftype || "generic"
      symbolTypeCounts[symType] = (symbolTypeCounts[symType] || 0) + 1
    } else if (element.type === "schematic_port") {
      totalSchematicPorts++
    }
  }

  const unplacedComponentIds: string[] = []
  for (const scId of allSourceComponentIds) {
    if (!placedSourceComponentIds.has(scId)) {
      unplacedComponentIds.push(scId)
    }
  }

  unplacedComponentIds.sort()

  return {
    totalSchematicComponents: placedSourceComponentIds.size,
    totalSchematicPorts,
    unplacedComponentIds,
    componentsBySymbolType: symbolTypeCounts,
  }
}

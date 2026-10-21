import type { CircuitJson, SchematicTrace } from "circuit-json"

export interface SchematicWireItem {
  schematicTraceId: string
  sourceTraceId?: string
  totalLength: number
  segmentCount: number
}

export interface SchematicWireReport {
  traces: SchematicWireItem[]
  totalWireLength: number
  totalTraces: number
}

/**
 * Calculates schematic wiring lengths and segment complexity across all schematic_trace elements.
 */
export function getSchematicWireSummary(
  circuitJson: CircuitJson,
): SchematicWireReport {
  if (!Array.isArray(circuitJson)) {
    return { traces: [], totalWireLength: 0, totalTraces: 0 }
  }

  const traces: SchematicWireItem[] = []
  let overallLength = 0

  for (const element of circuitJson) {
    if (element.type === "schematic_trace") {
      const st = element as SchematicTrace
      const edges: any[] = (st as any).edges || []
      let traceLength = 0
      let segmentCount = 0

      for (const edge of edges) {
        if (
          edge &&
          typeof edge.from?.x === "number" &&
          typeof edge.from?.y === "number" &&
          typeof edge.to?.x === "number" &&
          typeof edge.to?.y === "number"
        ) {
          const dist = Math.hypot(
            edge.to.x - edge.from.x,
            edge.to.y - edge.from.y,
          )
          traceLength += dist
          segmentCount++
        }
      }

      // If junction/points format instead of edges
      if (segmentCount === 0 && Array.isArray((st as any).junctions)) {
        const junctions = (st as any).junctions
        for (let i = 1; i < junctions.length; i++) {
          const p1 = junctions[i - 1]
          const p2 = junctions[i]
          if (
            typeof p1?.x === "number" &&
            typeof p1?.y === "number" &&
            typeof p2?.x === "number" &&
            typeof p2?.y === "number"
          ) {
            traceLength += Math.hypot(p2.x - p1.x, p2.y - p1.y)
            segmentCount++
          }
        }
      }

      const rounded = Math.round(traceLength * 1000) / 1000
      overallLength += rounded

      traces.push({
        schematicTraceId: st.schematic_trace_id,
        sourceTraceId: st.source_trace_id,
        totalLength: rounded,
        segmentCount,
      })
    }
  }

  return {
    traces,
    totalWireLength: Math.round(overallLength * 1000) / 1000,
    totalTraces: traces.length,
  }
}

import type { CircuitJson, PcbTrace } from "circuit-json"

export interface TraceLengthItem {
  pcbTraceId: string
  sourceTraceId?: string
  totalLengthMm: number
  segmentCount: number
  layers: string[]
}

export interface PcbTraceLengthReport {
  traces: TraceLengthItem[]
  totalTraceLengthMm: number
  traceCount: number
}

/**
 * Calculates routed copper trace lengths across all pcb_trace elements in CircuitJson.
 */
export function getPcbTraceLengths(
  circuitJson: CircuitJson,
): PcbTraceLengthReport {
  const traces: TraceLengthItem[] = []
  let overallLength = 0

  if (!Array.isArray(circuitJson)) {
    return {
      traces: [],
      totalTraceLengthMm: 0,
      traceCount: 0,
    }
  }

  for (const element of circuitJson) {
    if (element.type === "pcb_trace") {
      const trace = element as PcbTrace
      const route = trace.route || []
      let traceLength = 0
      let segmentCount = 0
      const layerSet = new Set<string>()

      for (let i = 0; i < route.length; i++) {
        const pt = route[i] as any
        if (pt.layer) layerSet.add(pt.layer)

        if (i > 0) {
          const prev = route[i - 1] as any
          if (
            typeof pt.x === "number" &&
            typeof pt.y === "number" &&
            typeof prev.x === "number" &&
            typeof prev.y === "number"
          ) {
            const dist = Math.hypot(pt.x - prev.x, pt.y - prev.y)
            traceLength += dist
            segmentCount++
          }
        }
      }

      const roundedLength = Math.round(traceLength * 1000) / 1000
      overallLength += roundedLength

      traces.push({
        pcbTraceId: trace.pcb_trace_id,
        sourceTraceId: trace.source_trace_id,
        totalLengthMm: roundedLength,
        segmentCount,
        layers: Array.from(layerSet).sort(),
      })
    }
  }

  return {
    traces,
    totalTraceLengthMm: Math.round(overallLength * 1000) / 1000,
    traceCount: traces.length,
  }
}

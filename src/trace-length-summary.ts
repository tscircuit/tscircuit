import type { AnyCircuitElement } from "circuit-json"

export interface NetTraceLengthDetail {
  netId: string
  totalLengthMm: number
  traceCount: number
  averageLengthMm: number
  maxLengthMm: number
  minLengthMm: number
}

export interface PcbTraceLengthSummary {
  totalCircuitTraceLengthMm: number
  totalTraceCount: number
  totalRoutedSegments: number
  netBreakdown: Record<string, NetTraceLengthDetail>
}

/**
 * Calculates the total trace length, per-net length breakdown, and route segment statistics
 * from a Circuit JSON element collection.
 */
export function getPcbTraceLengthSummary(
  circuitJson: AnyCircuitElement[],
): PcbTraceLengthSummary {
  let totalCircuitTraceLengthMm = 0
  let totalTraceCount = 0
  let totalRoutedSegments = 0
  const netLengthsMap: Record<
    string,
    { lengths: number[]; count: number }
  > = {}

  for (const elm of circuitJson) {
    if (elm.type !== "pcb_trace") continue

    totalTraceCount++
    const netId =
      (elm as any).source_net_id ??
      (elm as any).net_id ??
      (elm as any).subcircuit_connectivity_map_key ??
      "unassigned"

    if (!netLengthsMap[netId]) {
      netLengthsMap[netId] = { lengths: [], count: 0 }
    }
    netLengthsMap[netId].count++

    let currentTraceLength = 0
    const route = (elm as any).route

    if (Array.isArray(route) && route.length >= 2) {
      for (let i = 0; i < route.length - 1; i++) {
        const p1 = route[i]
        const p2 = route[i + 1]

        if (
          typeof p1.x === "number" &&
          typeof p1.y === "number" &&
          typeof p2.x === "number" &&
          typeof p2.y === "number"
        ) {
          const segLength = Math.hypot(p2.x - p1.x, p2.y - p1.y)
          currentTraceLength += segLength
          totalRoutedSegments++
        }
      }
    }

    // Also support precomputed trace_length if route points were not explicit
    if (
      currentTraceLength === 0 &&
      typeof (elm as any).trace_length === "number"
    ) {
      currentTraceLength = (elm as any).trace_length
    }

    totalCircuitTraceLengthMm += currentTraceLength
    netLengthsMap[netId].lengths.push(currentTraceLength)
  }

  const netBreakdown: Record<string, NetTraceLengthDetail> = {}
  for (const [netId, data] of Object.entries(netLengthsMap)) {
    const total = data.lengths.reduce((acc, val) => acc + val, 0)
    const count = data.count
    const max = data.lengths.length > 0 ? Math.max(...data.lengths) : 0
    const min = data.lengths.length > 0 ? Math.min(...data.lengths) : 0

    netBreakdown[netId] = {
      netId,
      totalLengthMm: Number(total.toFixed(4)),
      traceCount: count,
      averageLengthMm: count > 0 ? Number((total / count).toFixed(4)) : 0,
      maxLengthMm: Number(max.toFixed(4)),
      minLengthMm: Number(min.toFixed(4)),
    }
  }

  return {
    totalCircuitTraceLengthMm: Number(totalCircuitTraceLengthMm.toFixed(4)),
    totalTraceCount,
    totalRoutedSegments,
    netBreakdown,
  }
}

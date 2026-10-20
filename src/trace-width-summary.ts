import type { CircuitJson, PcbTrace } from "circuit-json"

export interface PcbTraceWidthReport {
  minWidthMm: number
  maxWidthMm: number
  averageWidthMm: number
  totalTraces: number
  finePitchTraceCount: number
  widthHistogram: Record<string, number>
}

/**
 * Summarizes routed PCB copper trace widths across a circuit layout.
 */
export function getPcbTraceWidthSummary(
  circuitJson: CircuitJson,
): PcbTraceWidthReport {
  if (!Array.isArray(circuitJson)) {
    return {
      minWidthMm: 0,
      maxWidthMm: 0,
      averageWidthMm: 0,
      totalTraces: 0,
      finePitchTraceCount: 0,
      widthHistogram: {},
    }
  }

  let minWidth = Infinity
  let maxWidth = -Infinity
  let totalWidthSum = 0
  let measuredSegments = 0
  let finePitchTraceCount = 0
  let totalTraces = 0
  const widthHistogram: Record<string, number> = {}

  for (const element of circuitJson) {
    if (element.type === "pcb_trace") {
      const trace = element as PcbTrace
      totalTraces++
      const route = trace.route || []
      let hasFinePitch = false

      for (const pt of route) {
        const w = (pt as any).width
        if (typeof w === "number" && w > 0) {
          measuredSegments++
          totalWidthSum += w
          minWidth = Math.min(minWidth, w)
          maxWidth = Math.max(maxWidth, w)

          if (w < 0.15) {
            hasFinePitch = true
          }

          const bucketKey = `${(Math.round(w * 1000) / 1000).toFixed(3)}mm`
          widthHistogram[bucketKey] = (widthHistogram[bucketKey] || 0) + 1
        }
      }

      if (hasFinePitch) {
        finePitchTraceCount++
      }
    }
  }

  if (measuredSegments === 0) {
    return {
      minWidthMm: 0,
      maxWidthMm: 0,
      averageWidthMm: 0,
      totalTraces,
      finePitchTraceCount: 0,
      widthHistogram: {},
    }
  }

  return {
    minWidthMm: Math.round(minWidth * 1000) / 1000,
    maxWidthMm: Math.round(maxWidth * 1000) / 1000,
    averageWidthMm:
      Math.round((totalWidthSum / measuredSegments) * 1000) / 1000,
    totalTraces,
    finePitchTraceCount,
    widthHistogram,
  }
}

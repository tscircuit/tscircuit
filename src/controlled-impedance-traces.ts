import type {
  CircuitJson,
  PcbTrace,
  SourceNet,
  SourceTrace,
} from "circuit-json"

export interface ControlledImpedanceTrace {
  pcbTraceId: string
  sourceTraceId?: string
  netName?: string
  signalType: "differential_pair" | "rf_antenna" | "high_speed_clock"
  polarity?: "positive" | "negative"
}

/**
 * Identifies high-speed, RF, and differential pair traces requiring controlled impedance.
 */
export function getControlledImpedanceTraces(
  circuitJson: CircuitJson,
): ControlledImpedanceTrace[] {
  if (!Array.isArray(circuitJson)) return []

  const netMap = new Map<string, string>()
  for (const el of circuitJson) {
    if (el.type === "source_net") {
      const net = el as SourceNet
      if (net.source_net_id) {
        netMap.set(net.source_net_id, net.name || net.source_net_id)
      }
    }
  }

  // Map source_trace_id -> netName
  const traceNetMap = new Map<string, string>()
  for (const el of circuitJson) {
    if (el.type === "source_trace") {
      const st = el as SourceTrace
      const nids = st.connected_source_net_ids || []
      if (st.source_trace_id && nids.length > 0) {
        const name = netMap.get(nids[0]) || nids[0]
        traceNetMap.set(st.source_trace_id, name)
      }
    }
  }

  const results: ControlledImpedanceTrace[] = []

  for (const el of circuitJson) {
    if (el.type === "pcb_trace") {
      const pt = el as PcbTrace
      const netName = pt.source_trace_id
        ? traceNetMap.get(pt.source_trace_id)
        : undefined

      if (!netName) continue

      const upper = netName.toUpperCase()

      // 1. Differential pair detection (_P/_N, _DP/_DM)
      const isDiffPos =
        upper.endsWith("_P") || upper.endsWith("_DP") || upper.endsWith("+")
      const isDiffNeg =
        upper.endsWith("_N") || upper.endsWith("_DM") || upper.endsWith("-")

      if (isDiffPos || isDiffNeg) {
        results.push({
          pcbTraceId: pt.pcb_trace_id,
          sourceTraceId: pt.source_trace_id,
          netName,
          signalType: "differential_pair",
          polarity: isDiffPos ? "positive" : "negative",
        })
        continue
      }

      // 2. RF / Antenna detection
      if (
        upper.startsWith("RF") ||
        upper.includes("ANTENNA") ||
        upper.includes("ANT_")
      ) {
        results.push({
          pcbTraceId: pt.pcb_trace_id,
          sourceTraceId: pt.source_trace_id,
          netName,
          signalType: "rf_antenna",
        })
        continue
      }

      // 3. High-speed clock detection
      if (
        upper.includes("CLK") ||
        upper.includes("CLOCK") ||
        upper.includes("MCLK")
      ) {
        results.push({
          pcbTraceId: pt.pcb_trace_id,
          sourceTraceId: pt.source_trace_id,
          netName,
          signalType: "high_speed_clock",
        })
      }
    }
  }

  results.sort((a, b) => (a.netName || "").localeCompare(b.netName || ""))

  return results
}

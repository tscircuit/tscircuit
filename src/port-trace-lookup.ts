import type { CircuitJson, SourceNet, SourceTrace } from "circuit-json"

/**
 * Finds all source_trace elements connecting two specific source ports,
 * either directly or through shared nets.
 */
export function getTracesConnectingPorts(
  circuitJson: CircuitJson,
  portIdA: string,
  portIdB: string,
): SourceTrace[] {
  if (!Array.isArray(circuitJson) || !portIdA || !portIdB) return []

  // 1. Direct connections via trace
  const matchingTraces: SourceTrace[] = []
  const netIdsForA = new Set<string>()
  const netIdsForB = new Set<string>()

  // Gather nets from source_net member_source_port_ids
  for (const el of circuitJson) {
    if (el.type === "source_net") {
      const net = el as SourceNet & { member_source_port_ids?: string[] }
      if (Array.isArray(net.member_source_port_ids)) {
        if (net.member_source_port_ids.includes(portIdA)) {
          netIdsForA.add(net.source_net_id)
        }
        if (net.member_source_port_ids.includes(portIdB)) {
          netIdsForB.add(net.source_net_id)
        }
      }
    }
  }

  // Scan traces
  for (const el of circuitJson) {
    if (el.type === "source_trace") {
      const trace = el as SourceTrace
      const portIds = trace.connected_source_port_ids || []
      const netIds = trace.connected_source_net_ids || []

      const hasA = portIds.includes(portIdA)
      const hasB = portIds.includes(portIdB)

      if (hasA && hasB) {
        matchingTraces.push(trace)
        continue
      }

      if (hasA) {
        for (const nid of netIds) netIdsForA.add(nid)
      }
      if (hasB) {
        for (const nid of netIds) netIdsForB.add(nid)
      }
    }
  }

  // Intersect shared nets
  const sharedNets = new Set<string>()
  for (const nid of netIdsForA) {
    if (netIdsForB.has(nid)) {
      sharedNets.add(nid)
    }
  }

  if (sharedNets.size > 0) {
    for (const el of circuitJson) {
      if (el.type === "source_trace") {
        const trace = el as SourceTrace
        if (matchingTraces.includes(trace)) continue

        const netIds = trace.connected_source_net_ids || []
        const connectsToSharedNet = netIds.some((nid) => sharedNets.has(nid))

        if (connectsToSharedNet) {
          const portIds = trace.connected_source_port_ids || []
          if (portIds.includes(portIdA) || portIds.includes(portIdB)) {
            matchingTraces.push(trace)
          }
        }
      }
    }
  }

  return matchingTraces
}

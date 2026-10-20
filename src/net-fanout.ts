import type {
  AnyCircuitElement,
  CircuitJson,
  SourceNet,
  SourcePort,
  SourceTrace,
} from "circuit-json"

export interface NetFanoutDetail {
  netId: string
  netName: string
  fanout: number
  isPowerGround: boolean
}

export interface NetFanoutSummary {
  totalNets: number
  maxFanout: number
  pointToPointNetsCount: number
  multiDropNetsCount: number
  highFanoutNets: NetFanoutDetail[]
}

const POWER_PATTERNS =
  /^(gnd|ground|vcc|vdd|vee|vss|vbat|vbus|vin|\+?[0-9.]+v)$/i

/**
 * Calculates pin fanout for each net in the circuit, identifying
 * high-fanout signals, point-to-point routes, and multidrop topologies.
 */
export function getNetFanoutSummary(
  circuitJson: CircuitJson,
  options: { highFanoutThreshold?: number } = {},
): NetFanoutSummary {
  const threshold = options.highFanoutThreshold ?? 4

  if (!Array.isArray(circuitJson)) {
    return {
      totalNets: 0,
      maxFanout: 0,
      pointToPointNetsCount: 0,
      multiDropNetsCount: 0,
      highFanoutNets: [],
    }
  }

  const netNames = new Map<string, string>()
  const portsPerNet = new Map<string, Set<string>>()

  for (const element of circuitJson as AnyCircuitElement[]) {
    if (element.type === "source_net") {
      const sn = element as SourceNet
      netNames.set(sn.source_net_id, sn.name || sn.source_net_id)
      if (!portsPerNet.has(sn.source_net_id)) {
        portsPerNet.set(sn.source_net_id, new Set())
      }
    } else if (element.type === "source_port") {
      const sp = element as SourcePort
      if (sp.source_net_id) {
        if (!portsPerNet.has(sp.source_net_id)) {
          portsPerNet.set(sp.source_net_id, new Set())
        }
        portsPerNet.get(sp.source_net_id)!.add(sp.source_port_id)
      }
    } else if (element.type === "source_trace") {
      const st = element as SourceTrace
      const portIds = st.connected_source_port_ids || []
      const netIds = st.connected_source_net_ids || []

      for (const netId of netIds) {
        if (!portsPerNet.has(netId)) {
          portsPerNet.set(netId, new Set())
        }
        const set = portsPerNet.get(netId)!
        for (const pid of portIds) {
          set.add(pid)
        }
      }
    }
  }

  let maxFanout = 0
  let pointToPointNetsCount = 0
  let multiDropNetsCount = 0
  const highFanoutNets: NetFanoutDetail[] = []

  for (const [netId, portSet] of portsPerNet.entries()) {
    const fanout = portSet.size
    maxFanout = Math.max(maxFanout, fanout)

    if (fanout === 2) {
      pointToPointNetsCount++
    } else if (fanout > 2) {
      multiDropNetsCount++
    }

    const netName = netNames.get(netId) || netId
    const isPowerGround = POWER_PATTERNS.test(netName.trim())

    if (fanout >= threshold) {
      highFanoutNets.push({
        netId,
        netName,
        fanout,
        isPowerGround,
      })
    }
  }

  highFanoutNets.sort((a, b) => b.fanout - a.fanout)

  return {
    totalNets: portsPerNet.size,
    maxFanout,
    pointToPointNetsCount,
    multiDropNetsCount,
    highFanoutNets,
  }
}

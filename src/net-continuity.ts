import type {
  CircuitJson,
  SourceComponent,
  SourceNet,
  SourcePort,
  SourceTrace,
} from "circuit-json"

export interface DisconnectedNetIsland {
  netId: string
  netName: string
  islandCount: number
  islands: string[][]
}

export interface NetContinuityReport {
  isFullyConnected: boolean
  disconnectedNets: DisconnectedNetIsland[]
  totalNetsChecked: number
}

class UnionFind {
  parent: Map<string, string>

  constructor(elements: string[]) {
    this.parent = new Map()
    for (const el of elements) {
      this.parent.set(el, el)
    }
  }

  find(i: string): string {
    const root = this.parent.get(i) ?? i
    if (root === i) return i
    const res = this.find(root)
    this.parent.set(i, res)
    return res
  }

  union(i: string, j: string) {
    const rootI = this.find(i)
    const rootJ = this.find(j)
    if (rootI !== rootJ) {
      this.parent.set(rootI, rootJ)
    }
  }
}

/**
 * Validates that all ports belonging to each net are electrically contiguous (no broken/split net islands).
 */
export function checkNetContinuity(
  circuitJson: CircuitJson,
): NetContinuityReport {
  if (!Array.isArray(circuitJson)) {
    return {
      isFullyConnected: true,
      disconnectedNets: [],
      totalNetsChecked: 0,
    }
  }

  // 1. Index components
  const compMap = new Map<string, string>()
  for (const el of circuitJson) {
    if (el.type === "source_component") {
      const comp = el as SourceComponent
      if (comp.source_component_id) {
        compMap.set(
          comp.source_component_id,
          comp.name || comp.source_component_id,
        )
      }
    }
  }

  // 2. Index ports
  const portLabelMap = new Map<string, string>()
  for (const el of circuitJson) {
    if (el.type === "source_port") {
      const port = el as SourcePort
      if (port.source_port_id && port.source_component_id) {
        const compName =
          compMap.get(port.source_component_id) || port.source_component_id
        const pinLabel =
          port.name ||
          (port.pin_number != null
            ? `pin${port.pin_number}`
            : port.source_port_id)
        portLabelMap.set(port.source_port_id, `${compName}.${pinLabel}`)
      }
    }
  }

  // 3. Collect ports by net
  const netPortsMap = new Map<string, { netName: string; ports: Set<string> }>()
  const netIdToTraces = new Map<string, SourceTrace[]>()

  for (const el of circuitJson) {
    if (el.type === "source_net") {
      const net = el as SourceNet & { member_source_port_ids?: string[] }
      if (net.source_net_id) {
        if (!netPortsMap.has(net.source_net_id)) {
          netPortsMap.set(net.source_net_id, {
            netName: net.name || net.source_net_id,
            ports: new Set(),
          })
        }
        if (Array.isArray(net.member_source_port_ids)) {
          for (const pid of net.member_source_port_ids) {
            netPortsMap.get(net.source_net_id)!.ports.add(pid)
          }
        }
      }
    } else if (el.type === "source_trace") {
      const trace = el as SourceTrace
      const netIds = trace.connected_source_net_ids || []
      const portIds = trace.connected_source_port_ids || []

      for (const nid of netIds) {
        if (!netPortsMap.has(nid)) {
          netPortsMap.set(nid, { netName: nid, ports: new Set() })
        }
        for (const pid of portIds) {
          netPortsMap.get(nid)!.ports.add(pid)
        }
        if (!netIdToTraces.has(nid)) {
          netIdToTraces.set(nid, [])
        }
        netIdToTraces.get(nid)!.push(trace)
      }
    }
  }

  const disconnectedNets: DisconnectedNetIsland[] = []
  let totalNetsChecked = 0

  for (const [netId, { netName, ports }] of netPortsMap.entries()) {
    const portList = Array.from(ports)
    if (portList.length < 2) continue

    totalNetsChecked++
    const uf = new UnionFind(portList)

    const traces = netIdToTraces.get(netId) || []
    for (const trace of traces) {
      const connected = (trace.connected_source_port_ids || []).filter((pid) =>
        ports.has(pid),
      )
      for (let i = 1; i < connected.length; i++) {
        uf.union(connected[0], connected[i])
      }
    }

    // Group by connected root
    const islandMap = new Map<string, string[]>()
    for (const pid of portList) {
      const root = uf.find(pid)
      if (!islandMap.has(root)) {
        islandMap.set(root, [])
      }
      const label = portLabelMap.get(pid) || pid
      islandMap.get(root)!.push(label)
    }

    if (islandMap.size > 1) {
      const islands = Array.from(islandMap.values()).map((isl) => isl.sort())
      disconnectedNets.push({
        netId,
        netName,
        islandCount: islands.length,
        islands,
      })
    }
  }

  return {
    isFullyConnected: disconnectedNets.length === 0,
    disconnectedNets,
    totalNetsChecked,
  }
}

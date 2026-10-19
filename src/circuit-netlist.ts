import type {
  CircuitJson,
  SourceComponent,
  SourceNet,
  SourcePort,
  SourceTrace,
} from "circuit-json"

export interface NetConnection {
  componentName: string
  componentId: string
  pinNumber?: number
  portName?: string
  portId: string
}

export interface NetInfo {
  netId: string
  netName: string
  connections: NetConnection[]
}

export type CircuitNetlist = Record<string, NetInfo>

/**
 * Extracts an electrical netlist mapping each net to its connected component pins.
 */
export function getCircuitNetlist(circuitJson: CircuitJson): CircuitNetlist {
  if (!Array.isArray(circuitJson)) return {}

  const componentMap = new Map<string, { id: string; name: string }>()
  const portMap = new Map<
    string,
    {
      portId: string
      portName?: string
      pinNumber?: number
      componentId: string
      componentName: string
    }
  >()
  const netMap = new Map<string, string>() // netId -> netName

  // 1. Index components
  for (const el of circuitJson) {
    if (el.type === "source_component") {
      const comp = el as SourceComponent
      if (comp.source_component_id) {
        componentMap.set(comp.source_component_id, {
          id: comp.source_component_id,
          name: comp.name || comp.source_component_id,
        })
      }
    }
  }

  // 2. Index ports
  for (const el of circuitJson) {
    if (el.type === "source_port") {
      const port = el as SourcePort
      if (port.source_port_id && port.source_component_id) {
        const comp = componentMap.get(port.source_component_id)
        portMap.set(port.source_port_id, {
          portId: port.source_port_id,
          portName: port.name,
          pinNumber: port.pin_number,
          componentId: port.source_component_id,
          componentName: comp ? comp.name : port.source_component_id,
        })
      }
    }
  }

  // 3. Index nets
  for (const el of circuitJson) {
    if (el.type === "source_net") {
      const net = el as SourceNet
      if (net.source_net_id) {
        netMap.set(net.source_net_id, net.name || net.source_net_id)
      }
    }
  }

  const netlist: CircuitNetlist = {}

  const getOrCreateNet = (netId: string, netName: string): NetInfo => {
    if (!netlist[netName]) {
      netlist[netName] = {
        netId,
        netName,
        connections: [],
      }
    }
    return netlist[netName]
  }

  // 4. Traces
  for (const el of circuitJson) {
    if (el.type === "source_trace") {
      const trace = el as SourceTrace
      const portIds = trace.connected_source_port_ids || []
      const netIds = trace.connected_source_net_ids || []

      let resolvedNetId: string
      let resolvedNetName: string

      if (netIds.length > 0) {
        resolvedNetId = netIds[0]
        resolvedNetName = netMap.get(resolvedNetId) || resolvedNetId
      } else {
        resolvedNetId = trace.source_trace_id || `trace_${Math.random()}`
        resolvedNetName = `N$${resolvedNetId}`
      }

      const netEntry = getOrCreateNet(resolvedNetId, resolvedNetName)

      for (const portId of portIds) {
        const p = portMap.get(portId)
        if (p && !netEntry.connections.some((c) => c.portId === portId)) {
          netEntry.connections.push({
            componentName: p.componentName,
            componentId: p.componentId,
            pinNumber: p.pinNumber,
            portName: p.portName,
            portId: p.portId,
          })
        }
      }
    }
  }

  // 5. Direct members in source_net
  for (const el of circuitJson) {
    if (el.type === "source_net") {
      const net = el as SourceNet & { member_source_port_ids?: string[] }
      if (Array.isArray(net.member_source_port_ids)) {
        const netName = net.name || net.source_net_id
        const netEntry = getOrCreateNet(net.source_net_id, netName)
        for (const portId of net.member_source_port_ids) {
          const p = portMap.get(portId)
          if (p && !netEntry.connections.some((c) => c.portId === portId)) {
            netEntry.connections.push({
              componentName: p.componentName,
              componentId: p.componentId,
              pinNumber: p.pinNumber,
              portName: p.portName,
              portId: p.portId,
            })
          }
        }
      }
    }
  }

  // Sort connections within each net
  for (const net of Object.values(netlist)) {
    net.connections.sort((a, b) => {
      const cmp = a.componentName.localeCompare(b.componentName)
      if (cmp !== 0) return cmp
      return (a.pinNumber ?? 0) - (b.pinNumber ?? 0)
    })
  }

  return netlist
}

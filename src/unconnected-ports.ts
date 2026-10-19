import type {
  AnyCircuitElement,
  CircuitJson,
  SourcePort,
  SourceComponent,
  SourceTrace,
  SourceNet,
} from "circuit-json"

export interface UnconnectedPort {
  portId: string
  portName?: string
  componentId?: string
  componentName?: string
}

export function getUnconnectedPorts(
  circuitJson: CircuitJson,
): UnconnectedPort[] {
  const componentMap = new Map<string, string>()
  const allPorts = new Map<string, SourcePort>()
  const connectedPortIds = new Set<string>()

  // Build index of components
  for (const element of circuitJson) {
    if (element.type === "source_component") {
      const comp = element as SourceComponent
      if (comp.source_component_id) {
        componentMap.set(
          comp.source_component_id,
          comp.name || comp.source_component_id,
        )
      }
    } else if (element.type === "source_port") {
      const port = element as SourcePort
      if (port.source_port_id) {
        allPorts.set(port.source_port_id, port)
      }
    }
  }

  // Find all ports referenced by traces or nets
  for (const element of circuitJson) {
    if (element.type === "source_trace") {
      const trace = element as SourceTrace
      if (Array.isArray(trace.connected_source_port_ids)) {
        for (const pid of trace.connected_source_port_ids) {
          connectedPortIds.add(pid)
        }
      }
    } else if (element.type === "source_net") {
      const net = element as SourceNet & { member_source_port_ids?: string[] }
      if (Array.isArray(net.member_source_port_ids)) {
        for (const pid of net.member_source_port_ids) {
          connectedPortIds.add(pid)
        }
      }
    }
  }

  const unconnected: UnconnectedPort[] = []
  for (const [portId, port] of allPorts.entries()) {
    if (!connectedPortIds.has(portId)) {
      unconnected.push({
        portId,
        portName: port.name,
        componentId: port.source_component_id,
        componentName: port.source_component_id
          ? componentMap.get(port.source_component_id)
          : undefined,
      })
    }
  }

  return unconnected.sort((a, b) => a.portId.localeCompare(b.portId))
}

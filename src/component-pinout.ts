import type {
  CircuitJson,
  PcbComponent,
  PcbPort,
  SchematicPort,
  SourceComponent,
  SourceNet,
  SourcePort,
  SourceTrace,
} from "circuit-json"

export interface ComponentPinInfo {
  portId: string
  portName?: string
  pinNumber?: number
  connectedNetName?: string
  connectedNetId?: string
  connectedTracesCount: number
  pcbPortId?: string
  schematicPortId?: string
}

export interface ComponentPinout {
  componentId: string
  componentName?: string
  supplierPartNumbers?: Record<string, string[]>
  pins: ComponentPinInfo[]
}

/**
 * Extracts comprehensive pinout details for a given component from a CircuitJson.
 * Looks up by component name, source_component_id, or pcb_component_id.
 */
export function getComponentPinout(
  circuitJson: CircuitJson,
  componentSelector: string,
): ComponentPinout | null {
  if (!Array.isArray(circuitJson)) return null

  // 1. Resolve source component
  let targetSourceComp: SourceComponent | undefined

  for (const element of circuitJson) {
    if (element.type === "source_component") {
      const comp = element as SourceComponent
      if (
        comp.source_component_id === componentSelector ||
        comp.name === componentSelector
      ) {
        targetSourceComp = comp
        break
      }
    }
  }

  // If not found by source_component directly, check if componentSelector matches a pcb_component
  if (!targetSourceComp) {
    for (const element of circuitJson) {
      if (element.type === "pcb_component") {
        const pcbComp = element as PcbComponent
        if (
          pcbComp.pcb_component_id === componentSelector ||
          pcbComp.source_component_id === componentSelector
        ) {
          const matchedSourceId = pcbComp.source_component_id
          targetSourceComp = circuitJson.find(
            (el) =>
              el.type === "source_component" &&
              (el as SourceComponent).source_component_id === matchedSourceId,
          ) as SourceComponent | undefined
          break
        }
      }
    }
  }

  if (!targetSourceComp) {
    return null
  }

  const targetSourceId = targetSourceComp.source_component_id

  // 2. Index nets by ID
  const netMap = new Map<string, string>() // id -> name
  for (const element of circuitJson) {
    if (element.type === "source_net") {
      const net = element as SourceNet
      if (net.source_net_id) {
        netMap.set(net.source_net_id, net.name || net.source_net_id)
      }
    }
  }

  // 3. Find all ports belonging to this component
  const componentPorts: SourcePort[] = []
  for (const element of circuitJson) {
    if (element.type === "source_port") {
      const port = element as SourcePort
      if (port.source_component_id === targetSourceId) {
        componentPorts.push(port)
      }
    }
  }

  // 4. Index trace connections and nets for each port
  const portToNets = new Map<string, { netId?: string; netName?: string }>()
  const portTraceCounts = new Map<string, number>()

  for (const element of circuitJson) {
    if (element.type === "source_trace") {
      const trace = element as SourceTrace
      const connectedPorts = trace.connected_source_port_ids || []
      const connectedNets = trace.connected_source_net_ids || []

      for (const portId of connectedPorts) {
        portTraceCounts.set(portId, (portTraceCounts.get(portId) || 0) + 1)

        if (connectedNets.length > 0 && !portToNets.has(portId)) {
          const netId = connectedNets[0]
          const netName = netMap.get(netId) || netId
          portToNets.set(portId, { netId, netName })
        }
      }
    } else if (element.type === "source_net") {
      const net = element as SourceNet & { member_source_port_ids?: string[] }
      if (Array.isArray(net.member_source_port_ids)) {
        for (const portId of net.member_source_port_ids) {
          if (!portToNets.has(portId)) {
            portToNets.set(portId, {
              netId: net.source_net_id,
              netName: net.name || net.source_net_id,
            })
          }
        }
      }
    }
  }

  // 5. Index PCB ports and Schematic ports
  const pcbPortMap = new Map<string, string>() // source_port_id -> pcb_port_id
  const schematicPortMap = new Map<string, string>() // source_port_id -> schematic_port_id

  for (const element of circuitJson) {
    if (element.type === "pcb_port") {
      const pcbPort = element as PcbPort
      if (pcbPort.source_port_id && pcbPort.pcb_port_id) {
        pcbPortMap.set(pcbPort.source_port_id, pcbPort.pcb_port_id)
      }
    } else if (element.type === "schematic_port") {
      const schPort = element as SchematicPort
      if (schPort.source_port_id && schPort.schematic_port_id) {
        schematicPortMap.set(schPort.source_port_id, schPort.schematic_port_id)
      }
    }
  }

  // 6. Assemble pins
  const pins: ComponentPinInfo[] = componentPorts.map((port) => {
    const netInfo = portToNets.get(port.source_port_id)
    return {
      portId: port.source_port_id,
      portName: port.name,
      pinNumber: port.pin_number,
      connectedNetName: netInfo?.netName,
      connectedNetId: netInfo?.netId,
      connectedTracesCount: portTraceCounts.get(port.source_port_id) || 0,
      pcbPortId: pcbPortMap.get(port.source_port_id),
      schematicPortId: schematicPortMap.get(port.source_port_id),
    }
  })

  // Sort pins by pinNumber if present, else portName, else portId
  pins.sort((a, b) => {
    if (a.pinNumber != null && b.pinNumber != null) {
      return a.pinNumber - b.pinNumber
    }
    if (a.pinNumber != null) return -1
    if (b.pinNumber != null) return 1
    const nameA = a.portName || a.portId
    const nameB = b.portName || b.portId
    return nameA.localeCompare(nameB)
  })

  return {
    componentId: targetSourceComp.source_component_id,
    componentName: targetSourceComp.name,
    supplierPartNumbers: targetSourceComp.supplier_part_numbers,
    pins,
  }
}

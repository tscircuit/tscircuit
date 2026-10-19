import type {
  CircuitJson,
  PcbComponent,
  PcbPlatedHole,
  PcbSmtPad,
  SourceComponent,
  SourceNet,
  SourcePort,
  SourceTrace,
} from "circuit-json"

export interface CircuitTestPoint {
  testPointId: string
  name: string
  netName?: string
  x: number
  y: number
  layer: string
  padType: "smtpad" | "plated_hole" | "component"
}

/**
 * Identifies and locates test points across a PCB layout.
 */
export function getCircuitTestPoints(
  circuitJson: CircuitJson,
): CircuitTestPoint[] {
  if (!Array.isArray(circuitJson)) return []

  const testPoints: CircuitTestPoint[] = []

  // 1. Index nets
  const netMap = new Map<string, string>()
  for (const el of circuitJson) {
    if (el.type === "source_net") {
      const net = el as SourceNet
      if (net.source_net_id) {
        netMap.set(net.source_net_id, net.name || net.source_net_id)
      }
    }
  }

  // 2. Index port -> net
  const portToNetName = new Map<string, string>()
  for (const el of circuitJson) {
    if (el.type === "source_trace") {
      const trace = el as SourceTrace
      const portIds = trace.connected_source_port_ids || []
      const netIds = trace.connected_source_net_ids || []
      if (netIds.length > 0) {
        const netName = netMap.get(netIds[0]) || netIds[0]
        for (const pid of portIds) {
          if (!portToNetName.has(pid)) {
            portToNetName.set(pid, netName)
          }
        }
      }
    } else if (el.type === "source_net") {
      const net = el as SourceNet & { member_source_port_ids?: string[] }
      if (Array.isArray(net.member_source_port_ids)) {
        const netName = net.name || net.source_net_id
        for (const pid of net.member_source_port_ids) {
          if (!portToNetName.has(pid)) {
            portToNetName.set(pid, netName)
          }
        }
      }
    }
  }

  // 3. Find test point components
  const tpComponents: SourceComponent[] = []
  for (const el of circuitJson) {
    if (el.type === "source_component") {
      const comp = el as SourceComponent
      const name = comp.name || ""
      const isTp =
        /^TP[\d_]/i.test(name) ||
        name.toLowerCase().startsWith("testpoint") ||
        (comp as any).ftype === "testpoint"
      if (isTp) {
        tpComponents.push(comp)
      }
    }
  }

  // 4. Index PCB components & pads
  const pcbCompMap = new Map<string, PcbComponent>()
  for (const el of circuitJson) {
    if (el.type === "pcb_component") {
      const pcb = el as PcbComponent
      if (pcb.source_component_id) {
        pcbCompMap.set(pcb.source_component_id, pcb)
      }
    }
  }

  const pcbPadByComp = new Map<string, PcbSmtPad | PcbPlatedHole>()
  for (const el of circuitJson) {
    if (el.type === "pcb_smtpad") {
      const pad = el as PcbSmtPad
      if (pad.pcb_component_id && !pcbPadByComp.has(pad.pcb_component_id)) {
        pcbPadByComp.set(pad.pcb_component_id, pad)
      }
    } else if (el.type === "pcb_plated_hole") {
      const ph = el as PcbPlatedHole
      if (ph.pcb_component_id && !pcbPadByComp.has(ph.pcb_component_id)) {
        pcbPadByComp.set(ph.pcb_component_id, ph)
      }
    }
  }

  // 5. Index ports by component
  const portByComp = new Map<string, SourcePort>()
  for (const el of circuitJson) {
    if (el.type === "source_port") {
      const port = el as SourcePort
      if (
        port.source_component_id &&
        !portByComp.has(port.source_component_id)
      ) {
        portByComp.set(port.source_component_id, port)
      }
    }
  }

  for (const comp of tpComponents) {
    const scId = comp.source_component_id
    const pcbComp = pcbCompMap.get(scId)
    const port = portByComp.get(scId)
    const netName = port ? portToNetName.get(port.source_port_id) : undefined

    let x = 0
    let y = 0
    let layer = "top"
    let padType: "smtpad" | "plated_hole" | "component" = "component"

    if (pcbComp) {
      x = pcbComp.center?.x ?? 0
      y = pcbComp.center?.y ?? 0
      layer = pcbComp.layer || "top"

      const pad = pcbPadByComp.get(pcbComp.pcb_component_id)
      if (pad) {
        x = pad.x
        y = pad.y
        if (pad.type === "pcb_smtpad") {
          padType = "smtpad"
          layer = pad.layer || layer
        } else if (pad.type === "pcb_plated_hole") {
          padType = "plated_hole"
        }
      }
    }

    testPoints.push({
      testPointId: comp.source_component_id,
      name: comp.name || comp.source_component_id,
      netName,
      x,
      y,
      layer,
      padType,
    })
  }

  testPoints.sort((a, b) => a.name.localeCompare(b.name))

  return testPoints
}

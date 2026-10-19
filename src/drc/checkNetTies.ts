import type { AnyCircuitElement } from "circuit-json"

export interface NetTieInfo {
  componentName: string
  pcbComponentId: string
  pads: string[]
  nets: string[]
  pcbX: number
  pcbY: number
}

/**
 * Finds all NetTie components and their associated pads and nets in a CircuitJson.
 */
export function findNetTiesInCircuit(circuitJson: AnyCircuitElement[]): NetTieInfo[] {
  const pcbComponents = circuitJson.filter((e) => e.type === "pcb_component")
  const sourceComponents = circuitJson.filter((e) => e.type === "source_component")
  const pcbPads = circuitJson.filter((e) => e.type === "pcb_smtpad" || e.type === "pcb_plated_hole")
  const pcbPorts = circuitJson.filter((e) => e.type === "pcb_port")
  const sourcePorts = circuitJson.filter((e) => e.type === "source_port")
  const sourceTraces = circuitJson.filter((e) => e.type === "source_trace")
  const sourceNets = circuitJson.filter((e) => e.type === "source_net")

  const netIdToName = new Map<string, string>()
  for (const net of sourceNets) {
    if (net.source_net_id && net.name) {
      netIdToName.set(net.source_net_id, net.name)
    }
  }

  const results: NetTieInfo[] = []

  for (const pcbComp of pcbComponents) {
    const srcComp = sourceComponents.find((s) => s.source_component_id === pcbComp.source_component_id)
    const name = srcComp?.name ?? pcbComp.pcb_component_id

    // Recognize net-tie by name convention (e.g. NT1, NetTie, NET_TIE) or explicit flag
    const isNetTie =
      /^NT(?:[0-9_-]|$)/i.test(name) ||
      /^NET[-_]?TIE/i.test(name) ||
      Boolean((srcComp as any)?.is_net_tie) ||
      (srcComp as any)?.ftype === "net_tie"

    if (!isNetTie) continue

    const compPads = pcbPads.filter((p: any) => p.pcb_component_id === pcbComp.pcb_component_id)
    const padIds = compPads.map((p: any) => p.pcb_smtpad_id ?? p.pcb_plated_hole_id)

    // Find the nets connected to this component's ports
    const compPorts = pcbPorts.filter((p) => p.pcb_component_id === pcbComp.pcb_component_id)
    const nets: string[] = []

    for (const port of compPorts) {
      const srcPort = sourcePorts.find((sp) => sp.source_port_id === port.source_port_id)
      if (!srcPort) continue

      for (const trace of sourceTraces) {
        if (trace.connected_source_port_ids?.includes(srcPort.source_port_id)) {
          for (const netId of trace.connected_source_net_ids ?? []) {
            const netName = netIdToName.get(netId)
            if (netName && !nets.includes(netName)) {
              nets.push(netName)
            }
          }
        }
      }
    }

    results.push({
      componentName: name,
      pcbComponentId: pcbComp.pcb_component_id,
      pads: padIds,
      nets,
      pcbX: pcbComp.center?.x ?? 0,
      pcbY: pcbComp.center?.y ?? 0,
    })
  }

  return results
}

/**
 * Filters DRC errors by exempting intentional pad-to-pad clearance bridges within declared NetTies.
 * Any clearance errors or shorts between pads on different components or elsewhere on the PCB are retained.
 */
export function filterDrcErrorsForNetTies<T extends Record<string, any>>(
  errors: T[],
  circuitJson: AnyCircuitElement[],
): T[] {
  const netTies = findNetTiesInCircuit(circuitJson)
  if (netTies.length === 0) return errors

  // Create a set of pad pairs that belong to the same NetTie
  const netTiePadPairs = new Set<string>()
  for (const netTie of netTies) {
    const { pads } = netTie
    for (let i = 0; i < pads.length; i++) {
      for (let j = i + 1; j < pads.length; j++) {
        const pairKey = [pads[i], pads[j]].sort().join("_")
        netTiePadPairs.add(pairKey)
      }
    }
  }

  return errors.filter((err) => {
    // Check if error is pad-to-pad clearance error
    if (Array.isArray(err.pcb_pad_ids) && err.pcb_pad_ids.length === 2) {
      const pairKey = [...err.pcb_pad_ids].sort().join("_")
      if (netTiePadPairs.has(pairKey)) {
        // Exempt intentional net-tie bridge
        return false
      }
    }

    return true
  })
}

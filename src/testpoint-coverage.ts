import type {
  AnyCircuitElement,
  CircuitJson,
  PcbTestPoint,
  SourceComponent,
  SourceNet,
  SourcePort,
} from "circuit-json"

export interface TestPointCoverageReport {
  totalNetsCount: number
  totalTestpointsCount: number
  coveredNetsCount: number
  coveragePercentage: number
  coveredNetNames: string[]
  uncoveredNetNames: string[]
}

/**
 * Calculates in-circuit testpoint coverage across all nets in the circuit,
 * aiding testability reviews and bed-of-nails fixture design.
 */
export function getTestPointCoverage(
  circuitJson: CircuitJson,
): TestPointCoverageReport {
  if (!Array.isArray(circuitJson)) {
    return {
      totalNetsCount: 0,
      totalTestpointsCount: 0,
      coveredNetsCount: 0,
      coveragePercentage: 0,
      coveredNetNames: [],
      uncoveredNetNames: [],
    }
  }

  const allNets = new Map<string, string>() // netId -> netName
  const portToNet = new Map<string, string>() // portId -> netId
  const compToPorts = new Map<string, string[]>() // sourceCompId -> portIds
  const tpSourceCompIds = new Set<string>()
  const coveredNetIds = new Set<string>()
  let testPointCount = 0

  for (const element of circuitJson as AnyCircuitElement[]) {
    if (element.type === "source_net") {
      const sn = element as SourceNet
      allNets.set(sn.source_net_id, sn.name || sn.source_net_id)
    } else if (element.type === "source_port") {
      const sp = element as SourcePort
      if (sp.source_net_id) {
        portToNet.set(sp.source_port_id, sp.source_net_id)
      }
      if (sp.source_component_id) {
        const ports = compToPorts.get(sp.source_component_id) || []
        ports.push(sp.source_port_id)
        compToPorts.set(sp.source_component_id, ports)
      }
    } else if (element.type === "source_component") {
      const sc = element as SourceComponent
      const name = (sc.name || "").toUpperCase()
      if (
        (sc as any).ftype === "simple_test_point" ||
        name.startsWith("TP") ||
        name.startsWith("TESTPOINT")
      ) {
        tpSourceCompIds.add(sc.source_component_id)
      }
    } else if (element.type === "pcb_test_point") {
      testPointCount++
      const pt = element as PcbTestPoint
      const netId = (pt as any).source_net_id || (pt as any).net_id
      if (netId) {
        coveredNetIds.add(netId)
      }
    }
  }

  for (const compId of tpSourceCompIds) {
    testPointCount++
    const ports = compToPorts.get(compId) || []
    for (const pid of ports) {
      const netId = portToNet.get(pid)
      if (netId) {
        coveredNetIds.add(netId)
      }
    }
  }

  const coveredNetNames: string[] = []
  const uncoveredNetNames: string[] = []

  for (const [netId, netName] of allNets.entries()) {
    if (coveredNetIds.has(netId)) {
      coveredNetNames.push(netName)
    } else {
      uncoveredNetNames.push(netName)
    }
  }

  const totalNetsCount = allNets.size
  const coveredNetsCount = coveredNetNames.length
  const coveragePercentage =
    totalNetsCount > 0
      ? Math.round((coveredNetsCount / totalNetsCount) * 1000) / 10
      : 0

  return {
    totalNetsCount,
    totalTestpointsCount: testPointCount,
    coveredNetsCount,
    coveragePercentage,
    coveredNetNames,
    uncoveredNetNames,
  }
}

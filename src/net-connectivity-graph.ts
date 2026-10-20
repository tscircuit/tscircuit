import type { AnyCircuitElement } from "circuit-json"

export interface NetGraphNode {
  portId: string
  componentId?: string
  portName?: string
  netId?: string
}

export interface NetGraphEdge {
  traceId: string
  fromPortId: string
  toPortId: string
  netId?: string
}

export interface NetConnectivityGraphReport {
  totalNodes: number
  totalEdges: number
  totalNets: number
  isolatedPortsCount: number
  nets: Record<
    string,
    {
      ports: string[]
      components: string[]
    }
  >
  adjacencyList: Record<string, string[]>
}

/**
 * Builds an electrical connectivity graph and adjacency structure
 * from source ports, components, and traces in Circuit JSON.
 */
export function getNetConnectivityGraph(
  circuitJson: AnyCircuitElement[],
): NetConnectivityGraphReport {
  const portToNode: Record<string, NetGraphNode> = {}
  const nets: Record<string, { ports: string[]; components: string[] }> = {}
  const adjacencyList: Record<string, string[]> = {}

  // 1. Collect all source ports
  for (const elm of circuitJson) {
    if (elm.type === "source_port") {
      const portId = (elm as any).source_port_id
      const compId = (elm as any).source_component_id
      const portName = (elm as any).name

      portToNode[portId] = {
        portId,
        componentId: compId,
        portName,
      }
      adjacencyList[portId] = []
    }
  }

  // 2. Map trace edges and build adjacency
  let edgeCount = 0
  for (const elm of circuitJson) {
    if (elm.type === "source_trace") {
      const traceId = (elm as any).source_trace_id ?? "trace"
      const portIds: string[] = (elm as any).connected_source_port_ids ?? []
      const netId =
        (elm as any).connected_source_net_ids?.[0] ??
        (elm as any).name ??
        "unnamed_net"

      if (!nets[netId]) {
        nets[netId] = { ports: [], components: [] }
      }

      for (const pId of portIds) {
        if (!nets[netId].ports.includes(pId)) {
          nets[netId].ports.push(pId)
        }
        const compId = portToNode[pId]?.componentId
        if (compId && !nets[netId].components.includes(compId)) {
          nets[netId].components.push(compId)
        }
      }

      // Connect pairs in adjacency list
      for (let i = 0; i < portIds.length; i++) {
        for (let j = i + 1; j < portIds.length; j++) {
          const u = portIds[i]
          const v = portIds[j]
          if (!adjacencyList[u]) adjacencyList[u] = []
          if (!adjacencyList[v]) adjacencyList[v] = []

          if (!adjacencyList[u].includes(v)) adjacencyList[u].push(v)
          if (!adjacencyList[v].includes(u)) adjacencyList[v].push(u)
          edgeCount++
        }
      }
    }
  }

  // Count isolated ports
  let isolatedPortsCount = 0
  for (const [portId, neighbors] of Object.entries(adjacencyList)) {
    if (neighbors.length === 0) isolatedPortsCount++
  }

  return {
    totalNodes: Object.keys(portToNode).length,
    totalEdges: edgeCount,
    totalNets: Object.keys(nets).length,
    isolatedPortsCount,
    nets,
    adjacencyList,
  }
}

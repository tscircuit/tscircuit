import type { AnyCircuitElement, CircuitJson, PcbVia } from "circuit-json"

export interface ThermalViaCluster {
  clusterId: string
  viaCount: number
  center: { x: number; y: number }
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
  viaIds: string[]
}

export interface ThermalViaClusterReport {
  totalVias: number
  clusterCount: number
  clusters: ThermalViaCluster[]
}

/**
 * Identifies spatial clusters of vias commonly used as thermal dissipation arrays
 * under power components, exposed pads, or ground sinks.
 */
export function getThermalViaClusters(
  circuitJson: CircuitJson,
  options: { maxSpacingMm?: number; minViasPerCluster?: number } = {},
): ThermalViaClusterReport {
  const maxSpacing = options.maxSpacingMm ?? 2.5
  const minVias = options.minViasPerCluster ?? 3

  if (!Array.isArray(circuitJson)) {
    return { totalVias: 0, clusterCount: 0, clusters: [] }
  }

  const vias: Array<{ id: string; x: number; y: number }> = []

  for (const element of circuitJson as AnyCircuitElement[]) {
    if (element.type === "pcb_via") {
      const v = element as PcbVia
      if (typeof v.x === "number" && typeof v.y === "number") {
        vias.push({
          id: v.pcb_via_id || `via_${vias.length}`,
          x: v.x,
          y: v.y,
        })
      }
    }
  }

  if (vias.length === 0) {
    return { totalVias: 0, clusterCount: 0, clusters: [] }
  }

  const visited = new Set<number>()
  const clusters: ThermalViaCluster[] = []

  for (let i = 0; i < vias.length; i++) {
    if (visited.has(i)) continue

    const currentClusterIndices: number[] = [i]
    visited.add(i)

    const queue: number[] = [i]
    while (queue.length > 0) {
      const curr = queue.shift()!
      const currVia = vias[curr]

      for (let j = 0; j < vias.length; j++) {
        if (!visited.has(j)) {
          const otherVia = vias[j]
          const dist = Math.hypot(
            currVia.x - otherVia.x,
            currVia.y - otherVia.y,
          )
          if (dist <= maxSpacing) {
            visited.add(j)
            currentClusterIndices.push(j)
            queue.push(j)
          }
        }
      }
    }

    if (currentClusterIndices.length >= minVias) {
      let sumX = 0
      let sumY = 0
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity
      const viaIds: string[] = []

      for (const idx of currentClusterIndices) {
        const v = vias[idx]
        sumX += v.x
        sumY += v.y
        minX = Math.min(minX, v.x)
        maxX = Math.max(maxX, v.x)
        minY = Math.min(minY, v.y)
        maxY = Math.max(maxY, v.y)
        viaIds.push(v.id)
      }

      const count = currentClusterIndices.length
      clusters.push({
        clusterId: `cluster_${clusters.length + 1}`,
        viaCount: count,
        center: {
          x: Math.round((sumX / count) * 1000) / 1000,
          y: Math.round((sumY / count) * 1000) / 1000,
        },
        bounds: {
          minX: Math.round(minX * 1000) / 1000,
          maxX: Math.round(maxX * 1000) / 1000,
          minY: Math.round(minY * 1000) / 1000,
          maxY: Math.round(maxY * 1000) / 1000,
        },
        viaIds,
      })
    }
  }

  return {
    totalVias: vias.length,
    clusterCount: clusters.length,
    clusters,
  }
}

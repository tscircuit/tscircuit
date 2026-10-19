import type { CircuitJson, PcbCopperPour } from "circuit-json"

export interface CopperPourItem {
  id: string
  sourceNetId?: string
  layer: string
  polygonPointsCount: number
  minX?: number
  maxX?: number
  minY?: number
  maxY?: number
}

export interface CopperPourReport {
  pours: CopperPourItem[]
  totalPourCount: number
  layersWithPours: string[]
}

/**
 * Summarizes PCB copper pour polygons, layers, and boundaries.
 */
export function getCopperPourSummary(
  circuitJson: CircuitJson,
): CopperPourReport {
  if (!Array.isArray(circuitJson)) {
    return {
      pours: [],
      totalPourCount: 0,
      layersWithPours: [],
    }
  }

  const pours: CopperPourItem[] = []
  const layerSet = new Set<string>()

  for (const element of circuitJson) {
    if (
      element.type === "pcb_copper_pour" ||
      (element as any).type === "pcb_custom_copper_pour"
    ) {
      const cp = element as PcbCopperPour
      const layer = (cp as any).layer || "top"
      layerSet.add(layer)

      const rawPoints: any[] =
        (cp as any).polygon_points || (cp as any).points || []
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity

      for (const pt of rawPoints) {
        if (typeof pt.x === "number") {
          minX = Math.min(minX, pt.x)
          maxX = Math.max(maxX, pt.x)
        }
        if (typeof pt.y === "number") {
          minY = Math.min(minY, pt.y)
          maxY = Math.max(maxY, pt.y)
        }
      }

      pours.push({
        id:
          (cp as any).pcb_copper_pour_id ||
          (cp as any).pcb_custom_copper_pour_id ||
          "pour",
        sourceNetId: (cp as any).source_net_id,
        layer,
        polygonPointsCount: rawPoints.length,
        minX: minX === Infinity ? undefined : minX,
        maxX: maxX === -Infinity ? undefined : maxX,
        minY: minY === Infinity ? undefined : minY,
        maxY: maxY === -Infinity ? undefined : maxY,
      })
    }
  }

  return {
    pours,
    totalPourCount: pours.length,
    layersWithPours: Array.from(layerSet).sort(),
  }
}

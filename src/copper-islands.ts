import type {
  AnyCircuitElement,
  CircuitJson,
  PcbCopperPour,
  PcbPlatedHole,
  PcbSmtPad,
  PcbVia,
  SourceNet,
} from "circuit-json"

export interface FloatingIslandInfo {
  pourId: string
  layer: string
  netName?: string
  reason: "no_net_assigned" | "no_stitched_vias_or_pads"
}

export interface CopperPourIslandReport {
  totalPours: number
  floatingCount: number
  floatingIslands: FloatingIslandInfo[]
  hasFloatingIslands: boolean
}

/**
 * Detects floating or isolated copper pours that lack net assignments or
 * via/pad stitching, preventing unintentional EMI radiation and parasitic capacitance.
 */
export function getCopperPourIslands(
  circuitJson: CircuitJson,
): CopperPourIslandReport {
  if (!Array.isArray(circuitJson)) {
    return {
      totalPours: 0,
      floatingCount: 0,
      floatingIslands: [],
      hasFloatingIslands: false,
    }
  }

  const netNames = new Map<string, string>()
  for (const element of circuitJson as AnyCircuitElement[]) {
    if (element.type === "source_net") {
      const sn = element as SourceNet
      netNames.set(sn.source_net_id, sn.name || sn.source_net_id)
    }
  }

  interface Point {
    x: number
    y: number
  }

  const copperPours: Array<{
    id: string
    layer: string
    netId?: string
    polygon: Point[]
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  }> = []

  const connectedPinsAndVias: Array<{
    netId?: string
    layer?: string
    x: number
    y: number
  }> = []

  for (const element of circuitJson as AnyCircuitElement[]) {
    if (element.type === "pcb_copper_pour") {
      const pour = element as PcbCopperPour
      const poly = Array.isArray(pour.polygon) ? (pour.polygon as Point[]) : []
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity

      for (const pt of poly) {
        minX = Math.min(minX, pt.x)
        maxX = Math.max(maxX, pt.x)
        minY = Math.min(minY, pt.y)
        maxY = Math.max(maxY, pt.y)
      }

      copperPours.push({
        id: pour.pcb_copper_pour_id || `pour_${copperPours.length}`,
        layer: pour.layer || "top",
        netId: (pour as any).source_net_id || (pour as any).net_id,
        polygon: poly,
        bounds: { minX, maxX, minY, maxY },
      })
    } else if (element.type === "pcb_via") {
      const v = element as PcbVia
      connectedPinsAndVias.push({
        netId: (v as any).source_net_id || (v as any).net_id,
        x: v.x,
        y: v.y,
      })
    } else if (element.type === "pcb_smtpad") {
      const p = element as PcbSmtPad
      connectedPinsAndVias.push({
        netId: (p as any).source_net_id || (p as any).net_id,
        layer: p.layer,
        x: p.x,
        y: p.y,
      })
    } else if (element.type === "pcb_plated_hole") {
      const ph = element as PcbPlatedHole
      connectedPinsAndVias.push({
        netId: (ph as any).source_net_id || (ph as any).net_id,
        x: ph.x,
        y: ph.y,
      })
    }
  }

  const floatingIslands: FloatingIslandInfo[] = []

  for (const pour of copperPours) {
    if (!pour.netId) {
      floatingIslands.push({
        pourId: pour.id,
        layer: pour.layer,
        reason: "no_net_assigned",
      })
      continue
    }

    const netName = netNames.get(pour.netId) || pour.netId

    // Check if any element of the same net lies within the bounding box of the pour
    const matchingElements = connectedPinsAndVias.filter((item) => {
      if (item.netId !== pour.netId) return false
      return (
        item.x >= pour.bounds.minX &&
        item.x <= pour.bounds.maxX &&
        item.y >= pour.bounds.minY &&
        item.y <= pour.bounds.maxY
      )
    })

    if (matchingElements.length === 0) {
      floatingIslands.push({
        pourId: pour.id,
        layer: pour.layer,
        netName,
        reason: "no_stitched_vias_or_pads",
      })
    }
  }

  return {
    totalPours: copperPours.length,
    floatingCount: floatingIslands.length,
    floatingIslands,
    hasFloatingIslands: floatingIslands.length > 0,
  }
}

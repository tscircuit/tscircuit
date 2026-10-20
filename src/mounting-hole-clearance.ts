import type {
  AnyCircuitElement,
  CircuitJson,
  PcbHole,
  PcbPlatedHole,
  PcbSmtPad,
  PcbTrace,
  PcbVia,
} from "circuit-json"

export interface ClearanceEncroachment {
  holeId: string
  holeCenter: { x: number; y: number }
  encroachingElementType: string
  encroachingElementId: string
  distanceMm: number
  requiredKeepoutMm: number
}

export interface MountingHoleClearanceReport {
  totalMountingHoles: number
  encroachmentsCount: number
  encroachments: ClearanceEncroachment[]
  allClear: boolean
}

/**
 * Checks physical keepout clearance around PCB mounting holes
 * to avoid hardware collisions with screw heads, washers, or standoffs.
 */
export function getMountingHoleClearances(
  circuitJson: CircuitJson,
  options: { keepoutMarginMm?: number } = {},
): MountingHoleClearanceReport {
  const keepoutMargin = options.keepoutMarginMm ?? 1.5

  if (!Array.isArray(circuitJson)) {
    return {
      totalMountingHoles: 0,
      encroachmentsCount: 0,
      encroachments: [],
      allClear: true,
    }
  }

  interface HoleItem {
    id: string
    x: number
    y: number
    radius: number
  }

  const holes: HoleItem[] = []
  const obstacles: Array<{ type: string; id: string; x: number; y: number }> =
    []

  for (const element of circuitJson as AnyCircuitElement[]) {
    if (element.type === "pcb_hole") {
      const h = element as PcbHole
      const radius = (h.hole_diameter ?? 2.0) / 2
      holes.push({
        id: h.pcb_hole_id || `hole_${holes.length}`,
        x: (h as any).x ?? 0,
        y: (h as any).y ?? 0,
        radius,
      })
    } else if (element.type === "pcb_plated_hole") {
      const ph = element as PcbPlatedHole
      // If it's a stand-alone mounting hole or explicitly marked
      if (
        !ph.pcb_component_id ||
        (ph as any).hole_purpose === "mounting_hole"
      ) {
        const radius = (ph.hole_diameter ?? 2.0) / 2
        holes.push({
          id: ph.pcb_plated_hole_id || `plated_hole_${holes.length}`,
          x: ph.x ?? 0,
          y: ph.y ?? 0,
          radius,
        })
      }
    } else if (element.type === "pcb_via") {
      const v = element as PcbVia
      obstacles.push({
        type: "pcb_via",
        id: v.pcb_via_id || "via",
        x: v.x,
        y: v.y,
      })
    } else if (element.type === "pcb_smtpad") {
      const pad = element as PcbSmtPad
      obstacles.push({
        type: "pcb_smtpad",
        id: pad.pcb_smtpad_id || "pad",
        x: pad.x,
        y: pad.y,
      })
    } else if (element.type === "pcb_trace") {
      const tr = element as PcbTrace
      if (Array.isArray(tr.route)) {
        for (const pt of tr.route) {
          if (typeof pt.x === "number" && typeof pt.y === "number") {
            obstacles.push({
              type: "pcb_trace",
              id: tr.pcb_trace_id || "trace",
              x: pt.x,
              y: pt.y,
            })
          }
        }
      }
    }
  }

  const encroachments: ClearanceEncroachment[] = []

  for (const hole of holes) {
    const requiredKeepout = hole.radius + keepoutMargin

    for (const obs of obstacles) {
      const dist = Math.hypot(hole.x - obs.x, hole.y - obs.y)
      if (dist < requiredKeepout) {
        encroachments.push({
          holeId: hole.id,
          holeCenter: { x: hole.x, y: hole.y },
          encroachingElementType: obs.type,
          encroachingElementId: obs.id,
          distanceMm: Math.round(dist * 1000) / 1000,
          requiredKeepoutMm: Math.round(requiredKeepout * 1000) / 1000,
        })
      }
    }
  }

  return {
    totalMountingHoles: holes.length,
    encroachmentsCount: encroachments.length,
    encroachments,
    allClear: encroachments.length === 0,
  }
}

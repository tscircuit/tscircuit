import type {
  AnyCircuitElement,
  CircuitJson,
  PcbComponent,
  SourceComponent,
} from "circuit-json"

export interface ChipDecouplingAudit {
  chipName: string
  chipSourceId: string
  nearestCapacitor?: {
    capName: string
    capSourceId: string
    distanceMm: number
  }
  isWithinThreshold: boolean
}

export interface DecouplingAuditReport {
  totalChips: number
  totalDecouplingCaps: number
  chipAudits: ChipDecouplingAudit[]
  allSatisfied: boolean
}

/**
 * Audits decoupling capacitor proximity to active chips/ICs.
 * Ensures bypass capacitors are located within a specified maximum distance.
 */
export function checkDecouplingCapProximity(
  circuitJson: CircuitJson,
  options: { maxDistanceMm?: number } = {},
): DecouplingAuditReport {
  const maxDistance = options.maxDistanceMm ?? 5.0

  if (!Array.isArray(circuitJson)) {
    return {
      totalChips: 0,
      totalDecouplingCaps: 0,
      chipAudits: [],
      allSatisfied: true,
    }
  }

  const pcbCompBySourceId = new Map<string, PcbComponent>()
  const sourceComps = new Map<string, SourceComponent>()

  for (const element of circuitJson as AnyCircuitElement[]) {
    if (element.type === "pcb_component") {
      const pc = element as PcbComponent
      if (pc.source_component_id && pc.center) {
        pcbCompBySourceId.set(pc.source_component_id, pc)
      }
    } else if (element.type === "source_component") {
      const sc = element as SourceComponent
      sourceComps.set(sc.source_component_id, sc)
    }
  }

  const chips: Array<{ sc: SourceComponent; pc: PcbComponent }> = []
  const caps: Array<{ sc: SourceComponent; pc: PcbComponent }> = []

  for (const [sourceId, sc] of sourceComps.entries()) {
    const pc = pcbCompBySourceId.get(sourceId)
    if (!pc || !pc.center) continue

    const name = (sc.name || "").toUpperCase()
    const ftype = (sc as any).ftype || ""

    if (
      ftype === "simple_capacitor" ||
      name.startsWith("C") ||
      (sc as any).capacitance !== undefined
    ) {
      caps.push({ sc, pc })
    } else if (
      ftype === "simple_chip" ||
      name.startsWith("U") ||
      name.startsWith("IC")
    ) {
      chips.push({ sc, pc })
    }
  }

  const chipAudits: ChipDecouplingAudit[] = []

  for (const chip of chips) {
    let nearestCap:
      | { capName: string; capSourceId: string; distanceMm: number }
      | undefined
    let minDistance = Infinity

    for (const cap of caps) {
      const dist = Math.hypot(
        chip.pc.center.x - cap.pc.center.x,
        chip.pc.center.y - cap.pc.center.y,
      )
      if (dist < minDistance) {
        minDistance = dist
        nearestCap = {
          capName: cap.sc.name || "Cap",
          capSourceId: cap.sc.source_component_id,
          distanceMm: Math.round(dist * 1000) / 1000,
        }
      }
    }

    const isWithin = nearestCap ? nearestCap.distanceMm <= maxDistance : false

    chipAudits.push({
      chipName: chip.sc.name || "Chip",
      chipSourceId: chip.sc.source_component_id,
      nearestCapacitor: nearestCap,
      isWithinThreshold: isWithin,
    })
  }

  const allSatisfied = chipAudits.every((a) => a.isWithinThreshold)

  return {
    totalChips: chips.length,
    totalDecouplingCaps: caps.length,
    chipAudits,
    allSatisfied: chips.length === 0 ? true : allSatisfied,
  }
}

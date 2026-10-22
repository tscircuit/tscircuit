import type { CircuitJson, PcbComponent, SourceComponent } from "circuit-json"

export interface ComponentRotationItem {
  componentId: string
  name: string
  rotationDeg: number
  isOrthogonal: boolean
  layer: string
}

export interface ComponentRotationReport {
  components: ComponentRotationItem[]
  nonOrthogonalCount: number
  orthogonalCount: number
}

function normalizeAngle(deg: number): number {
  let normalized = deg % 360
  if (normalized < 0) normalized += 360
  return Math.round(normalized * 1000) / 1000
}

/**
 * Inspects component rotation angles across a PCB to detect non-orthogonal placements.
 */
export function getComponentRotations(
  circuitJson: CircuitJson,
): ComponentRotationReport {
  if (!Array.isArray(circuitJson)) {
    return { components: [], nonOrthogonalCount: 0, orthogonalCount: 0 }
  }

  // 1. Index source names
  const nameMap = new Map<string, string>()
  for (const el of circuitJson) {
    if (el.type === "source_component") {
      const sc = el as SourceComponent
      if (sc.source_component_id) {
        nameMap.set(sc.source_component_id, sc.name || sc.source_component_id)
      }
    }
  }

  const items: ComponentRotationItem[] = []
  let nonOrthogonalCount = 0
  let orthogonalCount = 0

  for (const el of circuitJson) {
    if (el.type === "pcb_component") {
      const pc = el as PcbComponent
      const rawRot = typeof pc.rotation === "number" ? pc.rotation : 0
      const rotationDeg = normalizeAngle(rawRot)

      // Orthogonal check: 0, 90, 180, 270 (with floating tolerance)
      const remainder = rotationDeg % 90
      const isOrthogonal = remainder === 0 || remainder === 90

      if (isOrthogonal) {
        orthogonalCount++
      } else {
        nonOrthogonalCount++
      }

      const name = pc.source_component_id
        ? nameMap.get(pc.source_component_id) || pc.pcb_component_id
        : pc.pcb_component_id

      items.push({
        componentId: pc.pcb_component_id,
        name,
        rotationDeg,
        isOrthogonal,
        layer: pc.layer || "top",
      })
    }
  }

  items.sort((a, b) => a.name.localeCompare(b.name))

  return {
    components: items,
    nonOrthogonalCount,
    orthogonalCount,
  }
}

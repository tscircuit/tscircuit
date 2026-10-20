import type {
  CircuitJson,
  PcbComponent,
  PcbPlatedHole,
  PcbSmtPad,
  SourceComponent,
} from "circuit-json"

/**
 * Calculates the minimum center-to-center pin pitch (in mm) between adjacent pads of a component.
 */
export function getComponentPinPitch(
  circuitJson: CircuitJson,
  componentSelector: string,
): number | null {
  if (!Array.isArray(circuitJson) || !componentSelector) return null

  // 1. Resolve PCB component ID
  let targetPcbId: string | undefined

  for (const element of circuitJson) {
    if (element.type === "pcb_component") {
      const pc = element as PcbComponent
      if (
        pc.pcb_component_id === componentSelector ||
        pc.source_component_id === componentSelector
      ) {
        targetPcbId = pc.pcb_component_id
        break
      }
    }
  }

  if (!targetPcbId) {
    // Check by source component name
    let matchedSourceId: string | undefined
    for (const element of circuitJson) {
      if (element.type === "source_component") {
        const sc = element as SourceComponent
        if (
          sc.name === componentSelector ||
          sc.source_component_id === componentSelector
        ) {
          matchedSourceId = sc.source_component_id
          break
        }
      }
    }

    if (matchedSourceId) {
      for (const element of circuitJson) {
        if (
          element.type === "pcb_component" &&
          (element as PcbComponent).source_component_id === matchedSourceId
        ) {
          targetPcbId = (element as PcbComponent).pcb_component_id
          break
        }
      }
    }
  }

  if (!targetPcbId) return null

  // 2. Gather all pad coordinates for this PCB component
  const pads: Array<{ x: number; y: number }> = []

  for (const element of circuitJson) {
    if (element.type === "pcb_smtpad") {
      const pad = element as PcbSmtPad
      if (pad.pcb_component_id === targetPcbId) {
        pads.push({ x: pad.x, y: pad.y })
      }
    } else if (element.type === "pcb_plated_hole") {
      const ph = element as PcbPlatedHole
      if (ph.pcb_component_id === targetPcbId) {
        pads.push({ x: ph.x, y: ph.y })
      }
    }
  }

  if (pads.length < 2) return null

  // 3. Find minimum distance between any distinct pair
  let minPitch = Infinity

  for (let i = 0; i < pads.length; i++) {
    for (let j = i + 1; j < pads.length; j++) {
      const dist = Math.hypot(pads[i].x - pads[j].x, pads[i].y - pads[j].y)
      if (dist > 0.001) {
        minPitch = Math.min(minPitch, dist)
      }
    }
  }

  return minPitch === Infinity ? null : Math.round(minPitch * 1000) / 1000
}

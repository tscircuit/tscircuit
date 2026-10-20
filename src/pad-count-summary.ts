import type { AnyCircuitElement } from "circuit-json"

export interface PadShapeCounts {
  rect: number
  circle: number
  pill: number
  oval: number
  polygon: number
  other: number
}

export interface PadCountSummaryReport {
  totalPads: number
  totalSmtPads: number
  totalPlatedHoles: number
  totalNonPlatedHoles: number
  smtPadsByLayer: {
    top: number
    bottom: number
    other: number
  }
  shapes: PadShapeCounts
  padsByComponent: Record<string, number>
}

/**
 * Categorizes and aggregates all SMT pads, through-hole plated holes,
 * and mounting holes across components and PCB layers.
 */
export function getPadCountSummary(
  circuitJson: AnyCircuitElement[],
): PadCountSummaryReport {
  let totalSmtPads = 0
  let totalPlatedHoles = 0
  let totalNonPlatedHoles = 0

  const smtPadsByLayer = {
    top: 0,
    bottom: 0,
    other: 0,
  }

  const shapes: PadShapeCounts = {
    rect: 0,
    circle: 0,
    pill: 0,
    oval: 0,
    polygon: 0,
    other: 0,
  }

  const padsByComponent: Record<string, number> = {}

  for (const elm of circuitJson) {
    if (elm.type === "pcb_smtpad") {
      totalSmtPads++

      const layer = (elm as any).layer ?? "top"
      if (layer === "top") smtPadsByLayer.top++
      else if (layer === "bottom") smtPadsByLayer.bottom++
      else smtPadsByLayer.other++

      const shape = (elm as any).shape ?? "rect"
      if (shape in shapes) {
        shapes[shape as keyof PadShapeCounts]++
      } else {
        shapes.other++
      }

      const compId = (elm as any).pcb_component_id ?? "standalone"
      padsByComponent[compId] = (padsByComponent[compId] ?? 0) + 1
    } else if (elm.type === "pcb_plated_hole") {
      totalPlatedHoles++

      const shape = (elm as any).shape ?? "circle"
      if (shape in shapes) {
        shapes[shape as keyof PadShapeCounts]++
      } else {
        shapes.other++
      }

      const compId = (elm as any).pcb_component_id ?? "standalone"
      padsByComponent[compId] = (padsByComponent[compId] ?? 0) + 1
    } else if (elm.type === "pcb_hole") {
      totalNonPlatedHoles++
    }
  }

  return {
    totalPads: totalSmtPads + totalPlatedHoles,
    totalSmtPads,
    totalPlatedHoles,
    totalNonPlatedHoles,
    smtPadsByLayer,
    shapes,
    padsByComponent,
  }
}

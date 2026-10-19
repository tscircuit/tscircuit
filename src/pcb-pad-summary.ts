import type { CircuitJson, PcbPlatedHole, PcbSmtPad } from "circuit-json"

export interface PcbPadSummary {
  totalPads: number
  smtPadCount: number
  throughHolePadCount: number
  padsByLayer: Record<string, number>
  padsByShape: Record<string, number>
}

/**
 * Summarizes PCB surface mount pads and through-hole component pads.
 */
export function getPcbPadSummary(circuitJson: CircuitJson): PcbPadSummary {
  const padsByLayer: Record<string, number> = {}
  const padsByShape: Record<string, number> = {}
  let smtPadCount = 0
  let throughHolePadCount = 0

  if (!Array.isArray(circuitJson)) {
    return {
      totalPads: 0,
      smtPadCount: 0,
      throughHolePadCount: 0,
      padsByLayer: {},
      padsByShape: {},
    }
  }

  for (const element of circuitJson) {
    if (element.type === "pcb_smtpad") {
      const pad = element as PcbSmtPad
      smtPadCount++

      const layer = pad.layer || "top"
      padsByLayer[layer] = (padsByLayer[layer] || 0) + 1

      const shape = pad.shape || "rect"
      padsByShape[shape] = (padsByShape[shape] || 0) + 1
    } else if (element.type === "pcb_plated_hole") {
      const ph = element as PcbPlatedHole
      throughHolePadCount++

      const shape = ph.shape || "circle"
      padsByShape[shape] = (padsByShape[shape] || 0) + 1

      const layers = ph.layers || ["top", "bottom"]
      for (const l of layers) {
        padsByLayer[l] = (padsByLayer[l] || 0) + 1
      }
    }
  }

  return {
    totalPads: smtPadCount + throughHolePadCount,
    smtPadCount,
    throughHolePadCount,
    padsByLayer,
    padsByShape,
  }
}

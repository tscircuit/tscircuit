import type { AnyCircuitElement, CircuitJson, PcbSmtPad } from "circuit-json"

export interface LayerPasteSummary {
  apertureCount: number
  totalAreaMm2: number
}

export interface SolderPasteMaskSummary {
  totalApertures: number
  totalAreaMm2: number
  top: LayerPasteSummary
  bottom: LayerPasteSummary
}

/**
 * Calculates solder paste stencil apertures and total solder paste area (in mm²)
 * for PCB manufacturing and solder volume estimation.
 */
export function getSolderPasteMaskSummary(
  circuitJson: CircuitJson,
): SolderPasteMaskSummary {
  const top: LayerPasteSummary = { apertureCount: 0, totalAreaMm2: 0 }
  const bottom: LayerPasteSummary = { apertureCount: 0, totalAreaMm2: 0 }

  if (!Array.isArray(circuitJson)) {
    return {
      totalApertures: 0,
      totalAreaMm2: 0,
      top,
      bottom,
    }
  }

  for (const element of circuitJson as AnyCircuitElement[]) {
    if (element.type === "pcb_smtpad") {
      const pad = element as PcbSmtPad
      const layer = pad.layer?.toLowerCase().includes("bottom") ? bottom : top

      let padArea = 0
      if (pad.shape === "rect") {
        padArea = (pad.width ?? 0) * (pad.height ?? 0)
      } else if (pad.shape === "circle") {
        const r = pad.radius ?? (pad.width ? pad.width / 2 : 0)
        padArea = Math.PI * r * r
      } else if (pad.shape === "pill") {
        const w = pad.width ?? 0
        const h = pad.height ?? 0
        const r = Math.min(w, h) / 2
        const rectPart = Math.abs(w - h) * (2 * r)
        padArea = Math.PI * r * r + rectPart
      } else {
        padArea = (pad.width ?? 0) * (pad.height ?? 0)
      }

      layer.apertureCount++
      layer.totalAreaMm2 += padArea
    }
  }

  top.totalAreaMm2 = Math.round(top.totalAreaMm2 * 1000) / 1000
  bottom.totalAreaMm2 = Math.round(bottom.totalAreaMm2 * 1000) / 1000

  const totalApertures = top.apertureCount + bottom.apertureCount
  const totalAreaMm2 =
    Math.round((top.totalAreaMm2 + bottom.totalAreaMm2) * 1000) / 1000

  return {
    totalApertures,
    totalAreaMm2,
    top,
    bottom,
  }
}

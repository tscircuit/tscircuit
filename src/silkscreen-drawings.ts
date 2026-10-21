import type { AnyCircuitElement, CircuitJson } from "circuit-json"

export interface SilkscreenLayerSummary {
  paths: number
  rects: number
  circles: number
  lines: number
  pills: number
  totalDrawings: number
}

export interface SilkscreenDrawingsSummary {
  totalDrawings: number
  top: SilkscreenLayerSummary
  bottom: SilkscreenLayerSummary
  byLayer: Record<string, SilkscreenLayerSummary>
}

/**
 * Summarizes silkscreen graphical drawings (paths, rects, circles, lines, pills)
 * grouped by PCB layer.
 */
export function getSilkscreenDrawingsSummary(
  circuitJson: CircuitJson,
): SilkscreenDrawingsSummary {
  const byLayer: Record<string, SilkscreenLayerSummary> = {
    top: {
      paths: 0,
      rects: 0,
      circles: 0,
      lines: 0,
      pills: 0,
      totalDrawings: 0,
    },
    bottom: {
      paths: 0,
      rects: 0,
      circles: 0,
      lines: 0,
      pills: 0,
      totalDrawings: 0,
    },
  }

  const getLayerSummary = (layerName: string): SilkscreenLayerSummary => {
    const norm = layerName?.toLowerCase().includes("bottom") ? "bottom" : "top"
    if (!byLayer[norm]) {
      byLayer[norm] = {
        paths: 0,
        rects: 0,
        circles: 0,
        lines: 0,
        pills: 0,
        totalDrawings: 0,
      }
    }
    return byLayer[norm]
  }

  let totalDrawings = 0

  if (!Array.isArray(circuitJson)) {
    return {
      totalDrawings: 0,
      top: byLayer.top,
      bottom: byLayer.bottom,
      byLayer,
    }
  }

  for (const element of circuitJson as AnyCircuitElement[]) {
    const el = element as any
    const layer = el.layer || "top"

    switch (element.type) {
      case "pcb_silkscreen_path": {
        const s = getLayerSummary(layer)
        s.paths++
        s.totalDrawings++
        totalDrawings++
        break
      }
      case "pcb_silkscreen_rect": {
        const s = getLayerSummary(layer)
        s.rects++
        s.totalDrawings++
        totalDrawings++
        break
      }
      case "pcb_silkscreen_circle": {
        const s = getLayerSummary(layer)
        s.circles++
        s.totalDrawings++
        totalDrawings++
        break
      }
      case "pcb_silkscreen_line": {
        const s = getLayerSummary(layer)
        s.lines++
        s.totalDrawings++
        totalDrawings++
        break
      }
      case "pcb_silkscreen_pill": {
        const s = getLayerSummary(layer)
        s.pills++
        s.totalDrawings++
        totalDrawings++
        break
      }
      default:
        break
    }
  }

  return {
    totalDrawings,
    top: byLayer.top,
    bottom: byLayer.bottom,
    byLayer,
  }
}

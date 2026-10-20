import type { AnyCircuitElement } from "circuit-json"

export interface LayerElementCounts {
  traces: number
  smtPads: number
  vias: number
  platedHoles: number
  copperPours: number
  silkscreenElements: number
  totalElements: number
}

export interface LayerDistributionSummary {
  layerCounts: Record<string, LayerElementCounts>
  activeLayers: string[]
  totalCopperElements: number
  layerUtilizationPercentages: Record<string, number>
}

/**
 * Computes the distribution of PCB elements across all layers
 * (top, bottom, inner layers, etc.) to assess stackup utilization.
 */
export function getLayerDistributionSummary(
  circuitJson: AnyCircuitElement[],
): LayerDistributionSummary {
  const layerCounts: Record<string, LayerElementCounts> = {}

  const ensureLayer = (layer: string): LayerElementCounts => {
    if (!layerCounts[layer]) {
      layerCounts[layer] = {
        traces: 0,
        smtPads: 0,
        vias: 0,
        platedHoles: 0,
        copperPours: 0,
        silkscreenElements: 0,
        totalElements: 0,
      }
    }
    return layerCounts[layer]
  }

  for (const elm of circuitJson) {
    if (!elm.type.startsWith("pcb_")) continue

    switch (elm.type) {
      case "pcb_trace": {
        const route = (elm as any).route
        const touchedLayers = new Set<string>()
        if (Array.isArray(route)) {
          for (const pt of route) {
            if (pt.layer) touchedLayers.add(pt.layer)
          }
        }
        if (touchedLayers.size === 0 && (elm as any).layer) {
          touchedLayers.add((elm as any).layer)
        }
        for (const lyr of touchedLayers) {
          const counts = ensureLayer(lyr)
          counts.traces++
          counts.totalElements++
        }
        break
      }

      case "pcb_smtpad": {
        const layer = (elm as any).layer ?? "top"
        const counts = ensureLayer(layer)
        counts.smtPads++
        counts.totalElements++
        break
      }

      case "pcb_via": {
        const fromLayer = (elm as any).from_layer ?? "top"
        const toLayer = (elm as any).to_layer ?? "bottom"
        const layers = (elm as any).layers ?? [fromLayer, toLayer]
        for (const lyr of layers) {
          const counts = ensureLayer(lyr)
          counts.vias++
          counts.totalElements++
        }
        break
      }

      case "pcb_plated_hole": {
        const layers = (elm as any).layers ?? ["top", "bottom"]
        for (const lyr of layers) {
          const counts = ensureLayer(lyr)
          counts.platedHoles++
          counts.totalElements++
        }
        break
      }

      case "pcb_copper_pour": {
        const layer = (elm as any).layer ?? "top"
        const counts = ensureLayer(layer)
        counts.copperPours++
        counts.totalElements++
        break
      }

      case "pcb_silkscreen_text":
      case "pcb_silkscreen_path":
      case "pcb_silkscreen_rect":
      case "pcb_silkscreen_circle":
      case "pcb_silkscreen_pill":
      case "pcb_silkscreen_oval": {
        const layer = (elm as any).layer ?? "top"
        const counts = ensureLayer(layer)
        counts.silkscreenElements++
        counts.totalElements++
        break
      }
    }
  }

  let totalCopper = 0
  for (const counts of Object.values(layerCounts)) {
    totalCopper +=
      counts.traces +
      counts.smtPads +
      counts.vias +
      counts.platedHoles +
      counts.copperPours
  }

  const layerUtilizationPercentages: Record<string, number> = {}
  for (const [layer, counts] of Object.entries(layerCounts)) {
    const copperOnLayer =
      counts.traces +
      counts.smtPads +
      counts.vias +
      counts.platedHoles +
      counts.copperPours

    layerUtilizationPercentages[layer] =
      totalCopper > 0
        ? Number(((copperOnLayer / totalCopper) * 100).toFixed(2))
        : 0
  }

  return {
    layerCounts,
    activeLayers: Object.keys(layerCounts).sort(),
    totalCopperElements: totalCopper,
    layerUtilizationPercentages,
  }
}

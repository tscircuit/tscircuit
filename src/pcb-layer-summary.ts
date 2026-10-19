import type { CircuitJson, PcbComponent } from "circuit-json"

export interface PcbLayerSummary {
  copperLayers: string[]
  silkscreenLayers: string[]
  hasTopComponents: boolean
  hasBottomComponents: boolean
  hasThroughHoleComponents: boolean
  elementCountByLayer: Record<string, number>
  estimatedLayerCount: number
}

const COPPER_LAYER_SET = new Set([
  "top",
  "bottom",
  "inner1",
  "inner2",
  "inner3",
  "inner4",
  "inner5",
  "inner6",
  "cu",
  "f_cu",
  "b_cu",
])

/**
 * Computes an analysis of PCB stackup, copper layers, and component placements.
 */
export function getPcbLayerSummary(circuitJson: CircuitJson): PcbLayerSummary {
  const copperLayerSet = new Set<string>()
  const silkscreenLayerSet = new Set<string>()
  const countByLayer: Record<string, number> = {}

  let hasTopComponents = false
  let hasBottomComponents = false
  let hasThroughHoleComponents = false

  if (!Array.isArray(circuitJson)) {
    return {
      copperLayers: [],
      silkscreenLayers: [],
      hasTopComponents: false,
      hasBottomComponents: false,
      hasThroughHoleComponents: false,
      elementCountByLayer: {},
      estimatedLayerCount: 0,
    }
  }

  const recordLayer = (layer: string, isCopper: boolean) => {
    countByLayer[layer] = (countByLayer[layer] || 0) + 1
    if (isCopper || COPPER_LAYER_SET.has(layer.toLowerCase())) {
      copperLayerSet.add(layer)
    }
  }

  for (const element of circuitJson) {
    const el = element as any

    if (element.type === "pcb_component") {
      const comp = element as PcbComponent
      if (comp.layer === "top") hasTopComponents = true
      if (comp.layer === "bottom") hasBottomComponents = true
      if (comp.layer) recordLayer(comp.layer, false)
    } else if (
      element.type === "pcb_trace" ||
      element.type === "pcb_smtpad" ||
      element.type === "pcb_copper_pour"
    ) {
      if (typeof el.layer === "string") {
        recordLayer(el.layer, true)
      }
      if (Array.isArray(el.layers)) {
        for (const l of el.layers) {
          recordLayer(l, true)
        }
      }
    } else if (element.type.startsWith("pcb_silkscreen_")) {
      if (typeof el.layer === "string") {
        countByLayer[el.layer] = (countByLayer[el.layer] || 0) + 1
        silkscreenLayerSet.add(el.layer)
      }
    } else if (
      element.type === "pcb_plated_hole" ||
      element.type === "pcb_hole" ||
      element.type === "pcb_via"
    ) {
      hasThroughHoleComponents = true
      if (Array.isArray(el.layers)) {
        for (const l of el.layers) {
          recordLayer(l, true)
        }
      } else {
        // Vias and through holes span at least top and bottom
        recordLayer("top", true)
        recordLayer("bottom", true)
      }
    }
  }

  // Always at least 2 layers if standard board with top & bottom traces/pads
  const innerCount = Array.from(copperLayerSet).filter((l) =>
    l.toLowerCase().includes("inner"),
  ).length

  let estimatedLayerCount = 0
  if (innerCount > 0) {
    estimatedLayerCount = 2 + innerCount
  } else if (copperLayerSet.has("bottom")) {
    estimatedLayerCount = 2
  } else if (copperLayerSet.has("top")) {
    estimatedLayerCount = 1
  }

  return {
    copperLayers: Array.from(copperLayerSet).sort(),
    silkscreenLayers: Array.from(silkscreenLayerSet).sort(),
    hasTopComponents,
    hasBottomComponents,
    hasThroughHoleComponents,
    elementCountByLayer: countByLayer,
    estimatedLayerCount,
  }
}

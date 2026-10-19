import type { AnyCircuitElement, CircuitJson } from "circuit-json"

export type CircuitElementDomain = "pcb" | "schematic" | "source" | "cad"

export interface CircuitFilterOptions {
  domains?: CircuitElementDomain[]
  excludeDomains?: CircuitElementDomain[]
  layers?: string[]
  types?: string[]
  excludeTypes?: string[]
}

function getElementDomain(type: string): CircuitElementDomain | "other" {
  if (type.startsWith("pcb_")) return "pcb"
  if (type.startsWith("schematic_")) return "schematic"
  if (type.startsWith("source_")) return "source"
  if (type.startsWith("cad_")) return "cad"
  return "other"
}

/**
 * Filters a CircuitJson array based on domains, layers, or element types.
 */
export function filterCircuitJson(
  circuitJson: CircuitJson,
  options: CircuitFilterOptions,
): AnyCircuitElement[] {
  if (!Array.isArray(circuitJson)) return []

  const { domains, excludeDomains, layers, types, excludeTypes } = options

  const domainSet = domains ? new Set(domains) : null
  const excludeDomainSet = excludeDomains ? new Set(excludeDomains) : null
  const layerSet = layers ? new Set(layers) : null
  const typeSet = types ? new Set(types) : null
  const excludeTypeSet = excludeTypes ? new Set(excludeTypes) : null

  return circuitJson.filter((element) => {
    const elType = element.type
    const elDomain = getElementDomain(elType)

    // Domain filtering
    if (domainSet && (elDomain === "other" || !domainSet.has(elDomain))) {
      return false
    }
    if (
      excludeDomainSet &&
      elDomain !== "other" &&
      excludeDomainSet.has(elDomain)
    ) {
      return false
    }

    // Type filtering
    if (typeSet && !typeSet.has(elType)) {
      return false
    }
    if (excludeTypeSet && excludeTypeSet.has(elType)) {
      return false
    }

    // Layer filtering
    if (layerSet) {
      const elAny = element as any
      const elementLayers: string[] = []
      if (typeof elAny.layer === "string") {
        elementLayers.push(elAny.layer)
      }
      if (Array.isArray(elAny.layers)) {
        elementLayers.push(...elAny.layers)
      }

      if (elementLayers.length === 0) {
        // Elements without layer info are excluded when filtering strictly by layer
        return false
      }

      const hasMatchingLayer = elementLayers.some((l) => layerSet.has(l))
      if (!hasMatchingLayer) {
        return false
      }
    }

    return true
  })
}

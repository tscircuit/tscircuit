import type { CircuitJson, SourceComponent } from "circuit-json"

export type FootprintCategory =
  | "smd_passive"
  | "ic_smd"
  | "through_hole"
  | "connector"
  | "other"

export interface FootprintItem {
  componentId: string
  name: string
  footprint: string
  category: FootprintCategory
}

export interface FootprintClassificationReport {
  components: FootprintItem[]
  categoryCounts: Record<FootprintCategory, number>
  totalClassified: number
}

export function classifyFootprint(footprint: string): FootprintCategory {
  const fp = footprint.toLowerCase().trim()

  if (
    /^(0201|0402|0603|0805|1206|1210|2010|2512)$/.test(fp) ||
    fp.startsWith("c_") ||
    fp.startsWith("r_")
  ) {
    return "smd_passive"
  }
  if (
    fp.startsWith("soic") ||
    fp.startsWith("sot") ||
    fp.startsWith("tssop") ||
    fp.startsWith("qfn") ||
    fp.startsWith("qfp") ||
    fp.startsWith("dfn") ||
    fp.startsWith("bga") ||
    fp.startsWith("msop")
  ) {
    return "ic_smd"
  }
  if (
    fp.startsWith("dip") ||
    fp.startsWith("pinrow") ||
    fp.startsWith("to220") ||
    fp.startsWith("to-220") ||
    fp.startsWith("axial") ||
    fp.startsWith("radial")
  ) {
    return "through_hole"
  }
  if (
    fp.startsWith("usb") ||
    fp.startsWith("header") ||
    fp.startsWith("jst") ||
    fp.startsWith("molex") ||
    fp.startsWith("conn")
  ) {
    return "connector"
  }
  return "other"
}

/**
 * Analyzes and classifies all component footprints into manufacturing categories.
 */
export function getFootprintTypeSummary(
  circuitJson: CircuitJson,
): FootprintClassificationReport {
  if (!Array.isArray(circuitJson)) {
    return {
      components: [],
      categoryCounts: {
        smd_passive: 0,
        ic_smd: 0,
        through_hole: 0,
        connector: 0,
        other: 0,
      },
      totalClassified: 0,
    }
  }

  const categoryCounts: Record<FootprintCategory, number> = {
    smd_passive: 0,
    ic_smd: 0,
    through_hole: 0,
    connector: 0,
    other: 0,
  }

  const components: FootprintItem[] = []

  for (const element of circuitJson) {
    if (element.type === "source_component") {
      const comp = element as SourceComponent
      const fp = (comp as any).footprint || (comp as any).ftype || ""
      if (fp) {
        const category = classifyFootprint(fp)
        categoryCounts[category]++
        components.push({
          componentId: comp.source_component_id,
          name: comp.name || comp.source_component_id,
          footprint: fp,
          category,
        })
      }
    }
  }

  components.sort((a, b) => a.name.localeCompare(b.name))

  return {
    components,
    categoryCounts,
    totalClassified: components.length,
  }
}

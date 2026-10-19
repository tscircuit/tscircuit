import type { CircuitJson, PcbHole, PcbPlatedHole, PcbVia } from "circuit-json"

export interface DrillToolItem {
  diameterMm: number
  isPlated: boolean
  count: number
  holeTypes: ("via" | "plated_hole" | "unplated_hole")[]
}

export interface DrillSummary {
  tools: DrillToolItem[]
  totalHoleCount: number
  totalViaCount: number
  totalPlatedHoleCount: number
  totalUnplatedHoleCount: number
}

/**
 * Summarizes PCB through-hole drill sizes, separating plated and unplated holes.
 */
export function getDrillSummary(circuitJson: CircuitJson): DrillSummary {
  if (!Array.isArray(circuitJson)) {
    return {
      tools: [],
      totalHoleCount: 0,
      totalViaCount: 0,
      totalPlatedHoleCount: 0,
      totalUnplatedHoleCount: 0,
    }
  }

  const toolMap = new Map<
    string,
    {
      diameterMm: number
      isPlated: boolean
      count: number
      holeTypes: Set<"via" | "plated_hole" | "unplated_hole">
    }
  >()

  let totalViaCount = 0
  let totalPlatedHoleCount = 0
  let totalUnplatedHoleCount = 0

  const addHole = (
    diameter: number | undefined,
    isPlated: boolean,
    holeType: "via" | "plated_hole" | "unplated_hole",
  ) => {
    if (typeof diameter !== "number" || diameter <= 0) return

    const roundedDiameter = Math.round(diameter * 1000) / 1000
    const key = `${roundedDiameter.toFixed(3)}_${isPlated}`

    if (!toolMap.has(key)) {
      toolMap.set(key, {
        diameterMm: roundedDiameter,
        isPlated,
        count: 0,
        holeTypes: new Set(),
      })
    }

    const entry = toolMap.get(key)!
    entry.count++
    entry.holeTypes.add(holeType)
  }

  for (const element of circuitJson) {
    if (element.type === "pcb_via") {
      const via = element as PcbVia
      totalViaCount++
      addHole(via.hole_diameter, true, "via")
    } else if (element.type === "pcb_plated_hole") {
      const ph = element as PcbPlatedHole
      totalPlatedHoleCount++
      addHole(ph.hole_diameter, true, "plated_hole")
    } else if (element.type === "pcb_hole") {
      const h = element as PcbHole
      totalUnplatedHoleCount++
      addHole(h.hole_diameter, false, "unplated_hole")
    }
  }

  const tools: DrillToolItem[] = Array.from(toolMap.values()).map((t) => ({
    diameterMm: t.diameterMm,
    isPlated: t.isPlated,
    count: t.count,
    holeTypes: Array.from(t.holeTypes),
  }))

  tools.sort((a, b) => {
    if (a.diameterMm !== b.diameterMm) {
      return a.diameterMm - b.diameterMm
    }
    return a.isPlated === b.isPlated ? 0 : a.isPlated ? -1 : 1
  })

  return {
    tools,
    totalHoleCount:
      totalViaCount + totalPlatedHoleCount + totalUnplatedHoleCount,
    totalViaCount,
    totalPlatedHoleCount,
    totalUnplatedHoleCount,
  }
}

import type { CircuitJson, PcbVia } from "circuit-json"

export interface ViaGridCell {
  gridX: number
  gridY: number
  minX: number
  maxX: number
  minY: number
  maxY: number
  viaCount: number
}

export interface ViaDensityReport {
  totalVias: number
  gridSizeMm: number
  maxDensityInCell: number
  cells: ViaGridCell[]
}

/**
 * Computes spatial distribution and clustering density of vias across a PCB grid.
 */
export function getViaDensityMap(
  circuitJson: CircuitJson,
  gridSizeMm = 10,
): ViaDensityReport {
  if (!Array.isArray(circuitJson) || gridSizeMm <= 0) {
    return {
      totalVias: 0,
      gridSizeMm: Math.max(1, gridSizeMm),
      maxDensityInCell: 0,
      cells: [],
    }
  }

  const cellMap = new Map<string, ViaGridCell>()
  let totalVias = 0
  let maxDensityInCell = 0

  for (const element of circuitJson) {
    if (element.type === "pcb_via") {
      const via = element as PcbVia
      totalVias++

      const x = via.x ?? 0
      const y = via.y ?? 0

      const gx = Math.floor(x / gridSizeMm)
      const gy = Math.floor(y / gridSizeMm)
      const key = `${gx}_${gy}`

      if (!cellMap.has(key)) {
        cellMap.set(key, {
          gridX: gx,
          gridY: gy,
          minX: gx * gridSizeMm,
          maxX: (gx + 1) * gridSizeMm,
          minY: gy * gridSizeMm,
          maxY: (gy + 1) * gridSizeMm,
          viaCount: 0,
        })
      }

      const cell = cellMap.get(key)!
      cell.viaCount++
      if (cell.viaCount > maxDensityInCell) {
        maxDensityInCell = cell.viaCount
      }
    }
  }

  const cells = Array.from(cellMap.values())
  cells.sort((a, b) => b.viaCount - a.viaCount)

  return {
    totalVias,
    gridSizeMm,
    maxDensityInCell,
    cells,
  }
}

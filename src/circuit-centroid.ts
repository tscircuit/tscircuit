import type { CircuitJson, PcbBoard, PcbComponent } from "circuit-json"

export interface CircuitCentroidReport {
  centerOfMass: { x: number; y: number }
  componentCount: number
  boundingCenter: { x: number; y: number }
  offsetsFromBoardCenter?: { dx: number; dy: number }
}

/**
 * Calculates the centroid (mean placement coordinates) of all PCB components and board center offset.
 */
export function getCircuitCentroid(
  circuitJson: CircuitJson,
): CircuitCentroidReport {
  if (!Array.isArray(circuitJson)) {
    return {
      centerOfMass: { x: 0, y: 0 },
      componentCount: 0,
      boundingCenter: { x: 0, y: 0 },
    }
  }

  let sumX = 0
  let sumY = 0
  let componentCount = 0
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  let boardCenter: { x: number; y: number } | undefined

  for (const element of circuitJson) {
    if (element.type === "pcb_component") {
      const pc = element as PcbComponent
      if (
        pc.center &&
        typeof pc.center.x === "number" &&
        typeof pc.center.y === "number"
      ) {
        componentCount++
        sumX += pc.center.x
        sumY += pc.center.y
        minX = Math.min(minX, pc.center.x)
        maxX = Math.max(maxX, pc.center.x)
        minY = Math.min(minY, pc.center.y)
        maxY = Math.max(maxY, pc.center.y)
      }
    } else if (element.type === "pcb_board") {
      const pb = element as PcbBoard
      if (pb.center) {
        boardCenter = { x: pb.center.x, y: pb.center.y }
      }
    }
  }

  if (componentCount === 0) {
    return {
      centerOfMass: boardCenter || { x: 0, y: 0 },
      componentCount: 0,
      boundingCenter: boardCenter || { x: 0, y: 0 },
    }
  }

  const meanX = Math.round((sumX / componentCount) * 1000) / 1000
  const meanY = Math.round((sumY / componentCount) * 1000) / 1000

  const boundCenterX = Math.round(((minX + maxX) / 2) * 1000) / 1000
  const boundCenterY = Math.round(((minY + maxY) / 2) * 1000) / 1000

  let offsetsFromBoardCenter: { dx: number; dy: number } | undefined
  if (boardCenter) {
    offsetsFromBoardCenter = {
      dx: Math.round((meanX - boardCenter.x) * 1000) / 1000,
      dy: Math.round((meanY - boardCenter.y) * 1000) / 1000,
    }
  }

  return {
    centerOfMass: { x: meanX, y: meanY },
    componentCount,
    boundingCenter: { x: boundCenterX, y: boundCenterY },
    offsetsFromBoardCenter,
  }
}

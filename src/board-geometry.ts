import type { CircuitJson, PcbBoard } from "circuit-json"

export interface PcbBoardGeometryReport {
  boardId: string
  widthMm: number
  heightMm: number
  areaMm2: number
  areaCm2: number
  perimeterMm: number
  aspectRatio: number
  center: { x: number; y: number }
  isCircular: boolean
}

/**
 * Computes PCB board physical dimensions, surface area, aspect ratio, and perimeter.
 */
export function getPcbBoardGeometry(
  circuitJson: CircuitJson,
): PcbBoardGeometryReport | null {
  if (!Array.isArray(circuitJson)) return null

  let targetBoard: PcbBoard | undefined

  for (const element of circuitJson) {
    if (element.type === "pcb_board") {
      targetBoard = element as PcbBoard
      break
    }
  }

  if (!targetBoard) return null

  const board = targetBoard as any
  let width = typeof board.width === "number" ? board.width : 0
  let height = typeof board.height === "number" ? board.height : 0
  let center = board.center || { x: 0, y: 0 }
  let isCircular = false
  let area = 0
  let perimeter = 0

  if (board.outline && Array.isArray(board.outline)) {
    const pts = board.outline
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)

      const next = pts[(i + 1) % pts.length]
      perimeter += Math.hypot(next.x - p.x, next.y - p.y)
    }

    width = maxX - minX
    height = maxY - minY
    center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }

    // Shoelace formula for polygon area
    let shoelaceSum = 0
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i]
      const p2 = pts[(i + 1) % pts.length]
      shoelaceSum += p1.x * p2.y - p2.x * p1.y
    }
    area = Math.abs(shoelaceSum) / 2
  } else if (typeof board.radius === "number" && board.radius > 0) {
    isCircular = true
    const r = board.radius
    width = r * 2
    height = r * 2
    area = Math.PI * r * r
    perimeter = 2 * Math.PI * r
  } else {
    // Rectangular board
    area = width * height
    perimeter = 2 * (width + height)
  }

  const minDim = Math.min(width, height)
  const maxDim = Math.max(width, height)
  const aspectRatio =
    minDim > 0 ? Math.round((maxDim / minDim) * 1000) / 1000 : 1

  return {
    boardId: targetBoard.pcb_board_id,
    widthMm: Math.round(width * 1000) / 1000,
    heightMm: Math.round(height * 1000) / 1000,
    areaMm2: Math.round(area * 100) / 100,
    areaCm2: Math.round((area / 100) * 100) / 100,
    perimeterMm: Math.round(perimeter * 1000) / 1000,
    aspectRatio,
    center: {
      x: Math.round(center.x * 1000) / 1000,
      y: Math.round(center.y * 1000) / 1000,
    },
    isCircular,
  }
}

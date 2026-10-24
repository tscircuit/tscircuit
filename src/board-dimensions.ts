import type { AnyCircuitElement } from "circuit-json"

export interface BoardDimensionsReport {
  widthMm: number
  heightMm: number
  areaMm2: number
  center: { x: number; y: number }
  bounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
  numLayers: number
  shape: "rect" | "polygon" | "none"
  outlinePoints?: Array<{ x: number; y: number }>
}

/**
 * Extracts and calculates board boundary dimensions, center coordinates,
 * layer count, and enclosed surface area from Circuit JSON.
 */
export function getBoardDimensions(
  circuitJson: AnyCircuitElement[],
): BoardDimensionsReport | null {
  const board = circuitJson.find((elm) => elm.type === "pcb_board") as any
  if (!board) return null

  const numLayers = typeof board.num_layers === "number" ? board.num_layers : 2

  // 1. Polygon / Outline-based board
  if (Array.isArray(board.outline) && board.outline.length >= 3) {
    const pts = board.outline as Array<{ x: number; y: number }>
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)

    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    const widthMm = Number((maxX - minX).toFixed(4))
    const heightMm = Number((maxY - minY).toFixed(4))

    // Calculate polygon area with Shoelace formula
    let shoelaceArea = 0
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      shoelaceArea += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y)
    }
    const areaMm2 = Number(Math.abs(shoelaceArea / 2).toFixed(4))

    const centerX =
      typeof board.center?.x === "number"
        ? board.center.x
        : Number(((minX + maxX) / 2).toFixed(4))
    const centerY =
      typeof board.center?.y === "number"
        ? board.center.y
        : Number(((minY + maxY) / 2).toFixed(4))

    return {
      widthMm,
      heightMm,
      areaMm2,
      center: { x: centerX, y: centerY },
      bounds: { minX, minY, maxX, maxY },
      numLayers,
      shape: "polygon",
      outlinePoints: pts,
    }
  }

  // 2. Rectangular board
  if (typeof board.width === "number" && typeof board.height === "number") {
    const widthMm = Number(board.width.toFixed(4))
    const heightMm = Number(board.height.toFixed(4))
    const areaMm2 = Number((widthMm * heightMm).toFixed(4))

    const centerX = typeof board.center?.x === "number" ? board.center.x : 0
    const centerY = typeof board.center?.y === "number" ? board.center.y : 0

    const minX = Number((centerX - widthMm / 2).toFixed(4))
    const maxX = Number((centerX + widthMm / 2).toFixed(4))
    const minY = Number((centerY - heightMm / 2).toFixed(4))
    const maxY = Number((centerY + heightMm / 2).toFixed(4))

    return {
      widthMm,
      heightMm,
      areaMm2,
      center: { x: centerX, y: centerY },
      bounds: { minX, minY, maxX, maxY },
      numLayers,
      shape: "rect",
    }
  }

  return {
    widthMm: 0,
    heightMm: 0,
    areaMm2: 0,
    center: { x: 0, y: 0 },
    bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    numLayers,
    shape: "none",
  }
}

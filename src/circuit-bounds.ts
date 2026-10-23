import type { AnyCircuitElement, CircuitJson } from "circuit-json"

export interface PcbBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
  center: {
    x: number
    y: number
  }
}

export function getPcbBounds(circuitJson: CircuitJson): PcbBounds | null {
  // First check if an explicit pcb_board exists
  for (const element of circuitJson) {
    if (element.type === "pcb_board") {
      const minX = element.center.x - element.width / 2
      const maxX = element.center.x + element.width / 2
      const minY = element.center.y - element.height / 2
      const maxY = element.center.y + element.height / 2
      return {
        minX,
        maxX,
        minY,
        maxY,
        width: element.width,
        height: element.height,
        center: { ...element.center },
      }
    }
  }

  // Fallback: calculate envelope over points from PCB elements
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let hasPoints = false

  const addPoint = (x: number, y: number) => {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
      hasPoints = true
    }
  }

  for (const element of circuitJson) {
    if (element.type === "pcb_component") {
      const halfW = (element.width || 0) / 2
      const halfH = (element.height || 0) / 2
      addPoint(element.center.x - halfW, element.center.y - halfH)
      addPoint(element.center.x + halfW, element.center.y + halfH)
    } else if (
      element.type === "pcb_via" ||
      element.type === "pcb_hole" ||
      element.type === "pcb_plated_hole"
    ) {
      addPoint(element.x, element.y)
    } else if (element.type === "pcb_smtpad") {
      addPoint(element.x, element.y)
    }
  }

  if (!hasPoints) return null

  const width = maxX - minX
  const height = maxY - minY
  return {
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    center: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    },
  }
}

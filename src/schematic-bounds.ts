import type {
  AnyCircuitElement,
  CircuitJson,
  SchematicComponent,
  SchematicNetLabel,
  SchematicText,
  SchematicWire,
} from "circuit-json"

export interface SchematicBoundsReport {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
  center: { x: number; y: number }
  elementCount: number
}

/**
 * Computes the 2D bounding box encompassing all schematic symbols, wires,
 * texts, and net labels for viewport positioning and PDF/SVG canvas sizing.
 */
export function getSchematicBounds(
  circuitJson: CircuitJson,
): SchematicBoundsReport {
  if (!Array.isArray(circuitJson)) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      width: 0,
      height: 0,
      center: { x: 0, y: 0 },
      elementCount: 0,
    }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let elementCount = 0

  const update = (x: number, y: number) => {
    if (typeof x === "number" && typeof y === "number") {
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }

  for (const element of circuitJson as AnyCircuitElement[]) {
    if (element.type === "schematic_component") {
      const sc = element as SchematicComponent
      if (sc.center) {
        elementCount++
        const halfW = (sc.size?.width ?? 2) / 2
        const halfH = (sc.size?.height ?? 2) / 2
        update(sc.center.x - halfW, sc.center.y - halfH)
        update(sc.center.x + halfW, sc.center.y + halfH)
      }
    } else if (element.type === "schematic_wire") {
      const sw = element as SchematicWire
      let hasEdges = false
      if (Array.isArray(sw.edges)) {
        for (const edge of sw.edges) {
          if (edge.from && edge.to) {
            hasEdges = true
            update(edge.from.x, edge.from.y)
            update(edge.to.x, edge.to.y)
          }
        }
      }
      if (hasEdges) {
        elementCount++
      }
    } else if (element.type === "schematic_text") {
      const st = element as SchematicText
      if (st.position) {
        elementCount++
        update(st.position.x, st.position.y)
      }
    } else if (element.type === "schematic_net_label") {
      const snl = element as SchematicNetLabel
      if (snl.center) {
        elementCount++
        update(snl.center.x, snl.center.y)
      }
    }
  }

  if (elementCount === 0 || minX === Infinity) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      width: 0,
      height: 0,
      center: { x: 0, y: 0 },
      elementCount: 0,
    }
  }

  const roundedMinX = Math.round(minX * 1000) / 1000
  const roundedMaxX = Math.round(maxX * 1000) / 1000
  const roundedMinY = Math.round(minY * 1000) / 1000
  const roundedMaxY = Math.round(maxY * 1000) / 1000

  const width = Math.round((roundedMaxX - roundedMinX) * 1000) / 1000
  const height = Math.round((roundedMaxY - roundedMinY) * 1000) / 1000

  return {
    minX: roundedMinX,
    maxX: roundedMaxX,
    minY: roundedMinY,
    maxY: roundedMaxY,
    width,
    height,
    center: {
      x: Math.round(((roundedMinX + roundedMaxX) / 2) * 1000) / 1000,
      y: Math.round(((roundedMinY + roundedMaxY) / 2) * 1000) / 1000,
    },
    elementCount,
  }
}

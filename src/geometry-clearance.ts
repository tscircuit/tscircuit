export interface Point2D {
  x: number
  y: number
  id?: string
}

export interface ClearanceViolation {
  idA: string
  idB: string
  distance: number
}

export interface MinimumClearanceResult {
  valid: boolean
  violations: ClearanceViolation[]
}

/**
 * Calculates the shortest Euclidean distance from a point to a line segment.
 */
export function distancePointToSegment(
  p: Point2D,
  a: Point2D,
  b: Point2D,
): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const l2 = dx * dx + dy * dy

  if (l2 === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y)
  }

  // Projection parameter t clamped to [0, 1]
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2))
  const projX = a.x + t * dx
  const projY = a.y + t * dy

  return Math.hypot(p.x - projX, p.y - projY)
}

/**
 * Checks that all points in a set maintain a minimum spatial clearance from each other.
 */
export function checkPointsMinimumClearance(
  points: Point2D[],
  minClearance: number,
): MinimumClearanceResult {
  const violations: ClearanceViolation[] = []

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p1 = points[i]
      const p2 = points[j]
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)

      if (dist < minClearance) {
        violations.push({
          idA: p1.id || `pt_${i}`,
          idB: p2.id || `pt_${j}`,
          distance: Math.round(dist * 1000) / 1000,
        })
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  }
}

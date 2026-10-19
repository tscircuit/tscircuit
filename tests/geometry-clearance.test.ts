import { expect, test } from "bun:test"
import { checkPointsMinimumClearance, distancePointToSegment } from "../index"

test("distancePointToSegment calculates accurate orthogonal and projection distances", () => {
  const segA = { x: 0, y: 0 }
  const segB = { x: 10, y: 0 }

  // Point above midpoint
  expect(distancePointToSegment({ x: 5, y: 3 }, segA, segB)).toBe(3)

  // Point beyond start
  expect(distancePointToSegment({ x: -4, y: 3 }, segA, segB)).toBe(5) // hypot(-4, 3) = 5

  // Point beyond end
  expect(distancePointToSegment({ x: 14, y: 3 }, segA, segB)).toBe(5)
})

test("checkPointsMinimumClearance detects clearance violations between vias or points", () => {
  const points = [
    { id: "v1", x: 0, y: 0 },
    { id: "v2", x: 0.5, y: 0 }, // 0.5mm apart
    { id: "v3", x: 10, y: 10 },
  ]

  const pass = checkPointsMinimumClearance(points, 0.4)
  expect(pass.valid).toBe(true)

  const fail = checkPointsMinimumClearance(points, 0.6)
  expect(fail.valid).toBe(false)
  expect(fail.violations.length).toBe(1)
  expect(fail.violations[0].idA).toBe("v1")
  expect(fail.violations[0].idB).toBe("v2")
  expect(fail.violations[0].distance).toBe(0.5)
})

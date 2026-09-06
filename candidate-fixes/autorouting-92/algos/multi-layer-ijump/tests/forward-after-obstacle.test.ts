import { expect, test } from "bun:test"
import type { Obstacle } from "autorouting-dataset/lib/types"
import { MultilayerIjump } from "../MultilayerIjump"
import { ObstacleList3d } from "../ObstacleList3d"
import type { Node3d } from "../types"
import { getDebugSvg } from "../../infinite-grid-ijump-astar/tests/fixtures/get-debug-svg"

const wall: Obstacle = {
  type: "rect",
  center: { x: 0, y: 0 },
  width: 2,
  height: 2,
  layers: ["top"],
  connectedTo: [],
}

const nodeAt = (x: number, y: number): Node3d => ({
  x,
  y,
  l: 0,
  g: 0,
  h: 0,
  f: 0,
  manDistFromParent: 0,
  nodesInPath: 1,
  parent: null,
})

function createRouter(obstacles: Obstacle[]) {
  const router = new MultilayerIjump({
    input: {
      layerCount: 2,
      minTraceWidth: 0.1,
      obstacles,
      connections: [],
      bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    },
    startNode: nodeAt(-3, 0),
    goalPoint: { x: -1.25, y: 3 },
    debug: true,
  })
  router.allowLayerChange = false
  router.obstacles = new ObstacleList3d(2, obstacles)
  return router
}

test("continue forward after turning past an obstacle hit by the parent", () => {
  const router = createRouter([wall])
  const parent = { ...nodeAt(-1.25, 0), obstacleHit: wall }
  const current = { ...nodeAt(-1.25, 1.25), parent }

  const neighbors = router.getNeighbors(current)

  expect(neighbors).toContainEqual(
    expect.objectContaining({ x: -1.25, y: 3, l: 0 }),
  )
  expect(neighbors.some((n) => n.x === current.x && n.y < current.y)).toBe(
    false,
  )

  // Resume A* from the minimal state that used to incorrectly dead-end.
  router.openSet = [current]
  router.solveOneStep()
  expect(router.solveOneStep().solved).toBe(true)
  expect(
    getDebugSvg({
      inputCircuitJson: [
        {
          type: "pcb_smtpad",
          pcb_smtpad_id: "wall-pad",
          pcb_component_id: "wall",
          pcb_port_id: "wall-port",
          shape: "rect",
          x: 0,
          y: 0,
          width: 2,
          height: 2,
          layer: "top",
        },
      ],
      autorouter: router,
      rowHeight: 6,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})

test("continuing forward still stops before a real obstacle", () => {
  const nextWall: Obstacle = {
    ...wall,
    center: { x: -1.25, y: 2.5 },
    width: 1,
    height: 0.5,
  }
  const router = createRouter([wall, nextWall])
  const parent = { ...nodeAt(-1.25, 0), obstacleHit: wall }
  const current = { ...nodeAt(-1.25, 1.25), parent }

  const forwardNeighbors = router
    .getNeighbors(current)
    .filter((n) => n.x === current.x && n.y > current.y)

  expect(forwardNeighbors.length).toBeGreaterThan(0)
  for (const neighbor of forwardNeighbors) {
    expect(neighbor.y).toBeLessThanOrEqual(2.25 - router.OBSTACLE_MARGIN)
  }
})

test("full solve routes around wall when left bypass is blocked", () => {
  const topBlock: Obstacle = {
    type: "rect",
    center: { x: -3, y: 2.5 },
    width: 2,
    height: 2,
    layers: ["top"],
    connectedTo: [],
  }
  const router = new MultilayerIjump({
    input: {
      layerCount: 2,
      minTraceWidth: 0.1,
      obstacles: [wall, topBlock],
      connections: [
        {
          name: "around_wall",
          pointsToConnect: [
            { x: -3, y: 0, layer: "top", pcb_port_id: "start" },
            { x: -1.25, y: 3, layer: "top", pcb_port_id: "goal" },
          ],
        },
      ],
      bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    },
  })
  router.allowLayerChange = false

  const [result] = router.solve()

  expect(result.solved).toBe(true)
  expect(result.route).toContainEqual(
    expect.objectContaining({ x: -1.25, y: 0, layer: "top" }),
  )
  expect(result.route.at(-1)).toMatchObject({ x: -1.25, y: 3, layer: "top" })
})

import {
  GeneralizedAstarAutorouter,
  type ConnectionSolveResult,
} from "algos/infinite-grid-ijump-astar/v2/lib/GeneralizedAstar"
import { getDistanceToOvercomeObstacle } from "algos/infinite-grid-ijump-astar/v2/lib/getDistanceToOvercomeObstacle"
import type {
  Direction,
  Point,
  PointWithObstacleHit,
  Node,
  DirectionWithCollisionInfo,
} from "algos/infinite-grid-ijump-astar/v2/lib/types"
import {
  distAlongDir,
  manDist,
  nodeName,
} from "algos/infinite-grid-ijump-astar/v2/lib/util"
import type {
  Direction3d,
  DirectionWithCollisionInfo3d,
  Node3d,
  Point3dWithObstacleHit,
} from "./types"
import { dirFromAToB, getLayerIndex, indexToLayer } from "./util"
import type {
  SimpleRouteConnection,
  SimpleRouteJson,
} from "autorouting-dataset/lib/solver-utils/SimpleRouteJson"
import { ObstacleList3d } from "./ObstacleList3d"
import type { Obstacle } from "autorouting-dataset/lib/types"
import {
  PcbConnectivityMap,
  type ConnectivityMap,
} from "circuit-json-to-connectivity-map"
import type { ConnectionWithGoalAlternatives } from "autorouting-dataset/lib/solver-utils/ConnectionWithAlternatives"
import { nanoid } from "nanoid"
import type { LayerRef, PCBTrace } from "circuit-json"
import {
  getAlternativeGoalBoxes,
  getConnectionWithAlternativeGoalBoxes,
} from "autorouting-dataset/lib/solver-utils/getAlternativeGoalBoxes"

export class MultilayerIjump extends GeneralizedAstarAutorouter {
  MAX_ITERATIONS: number = 500
  VIA_COST: number = 4 // Define the cost for changing layers
  VIA_DIAMETER: number = 0.5
  allowLayerChange: boolean = true // Flag to allow layer changes
  layerCount: number
  obstacles: ObstacleList3d
  optimizeWithGoalBoxes: boolean
  /**
   * Use this to convert ids into "net ids", obstacles will have a net id in
   * their connectedTo array most of the time
   */
  connMap: ConnectivityMap | undefined

  /**
   * Use this to track what traces have been connected to a net while routing,
   * this is required for generating alternative goal boxes while routing
   */
  pcbConnMap: PcbConnectivityMap

  GOAL_RUSH_FACTOR: number = 1.1

  // TODO we need to travel far enough away from the goal so that we're not
  // hitting a pad, which means we need to know the bounds of the goal
  // The simplest way to do this is to change SimpleJsonInput to include a
  // goalViaMargin, set this.goalViaMargin then add that value here
  defaultGoalViaMargin = 0.5

  /**
   * For a multi-margin autorouter, we penalize traveling close to the wall
   *
   * The best way to compute cost is to multiple the travelMargin cost factor by
   * the distance traveled by along the wall and add the enterMargin cost factor
   * whenever we enter a new margin
   *
   * MUST BE ORDERED FROM HIGHEST MARGIN TO LOWEST (TODO sort in constructor)
   */
  marginsWithCosts: Array<{
    margin: number
    enterCost: number
    travelCostFactor: number
  }>

  get largestMargin() {
    return this.marginsWithCosts[0].margin
  }

  constructor(opts: {
    input: SimpleRouteJson
    startNode?: Node
    goalPoint?: Point
    GRID_STEP?: number
    OBSTACLE_MARGIN?: number
    MAX_ITERATIONS?: number
    VIA_COST?: number
    isRemovePathLoopsEnabled?: boolean
    isShortenPathWithShortcutsEnabled?: boolean
    connMap?: ConnectivityMap
    pcbConnMap?: PcbConnectivityMap
    optimizeWithGoalBoxes?: boolean
    marginsWithCosts?: Array<{
      margin: number
      enterCost: number
      travelCostFactor: number
    }>
    debug?: boolean
  }) {
    super(opts)
    this.layerCount = opts.input.layerCount ?? 2
    this.MAX_ITERATIONS = opts.MAX_ITERATIONS ?? this.MAX_ITERATIONS
    this.VIA_COST = opts.VIA_COST ?? this.VIA_COST
    this.connMap = opts.connMap
    this.pcbConnMap = opts.pcbConnMap ?? new PcbConnectivityMap()
    this.optimizeWithGoalBoxes = opts.optimizeWithGoalBoxes ?? false
    // obstacle lists are created when solving currently
    this.obstacles = null as any // new ObstacleList3d(this.layerCount, this.allObstacles)

    this.marginsWithCosts = opts.marginsWithCosts ?? [
      {
        margin: 1,
        enterCost: 0,
        travelCostFactor: 1,
      },
      {
        margin: this.OBSTACLE_MARGIN,
        enterCost: 10,
        travelCostFactor: 2,
      },
    ]
  }

  preprocessConnectionBeforeSolving(
    connection: SimpleRouteConnection,
  ): ConnectionWithGoalAlternatives {
    if (!this.optimizeWithGoalBoxes) return connection as any
    return getConnectionWithAlternativeGoalBoxes({
      connection,
      pcbConnMap: this.pcbConnMap!,
    })
  }

  /**
   * Add solved traces to pcbConnMap
   */
  postprocessConnectionSolveResult(
    connection: SimpleRouteConnection,
    result: ConnectionSolveResult,
  ): ConnectionSolveResult {
    if (!result.solved) return result

    // Add the trace to the pcbConnMap
    if (this.optimizeWithGoalBoxes) {
      const traceRoute = result.route.map(
        (rp) =>
          ({
            x: rp.x,
            y: rp.y,
            route_type: "wire",
            layer: rp.layer as LayerRef,
            width: this.input.minTraceWidth,
          }) as Extract<PCBTrace["route"][number], { route_type: "wire" }>,
      )
      traceRoute[0].start_pcb_port_id =
        connection.pointsToConnect[0].pcb_port_id
      traceRoute[traceRoute.length - 1].end_pcb_port_id =
        connection.pointsToConnect[1].pcb_port_id

      this.pcbConnMap.addTrace({
        type: "pcb_trace",
        pcb_trace_id: `postprocess_trace_${nanoid(8)}`,
        route: traceRoute,
      })
    }

    return result
  }

  createObstacleList({
    dominantLayer,
    connection,
    obstaclesFromTraces,
  }: {
    dominantLayer?: string
    connection: SimpleRouteConnection
    obstaclesFromTraces: Obstacle[]
  }): ObstacleList3d {
    const bestConnectionId = this.connMap
      ? this.connMap.getNetConnectedToId(connection.name)
      : connection.name

    if (!bestConnectionId) {
      throw new Error(
        `The connection.name "${connection.name}" wasn't present in the full connectivity map`,
      )
    }

    return new ObstacleList3d(
      this.layerCount,
      this.allObstacles
        .filter((obstacle) => !obstacle.connectedTo.includes(bestConnectionId))
        .concat(obstaclesFromTraces ?? []),
    )
  }

  computeG(current: Node3d, neighbor: Node3d): number {
    let cost =
      current.g +
      manDist(current, neighbor) * (current.travelMarginCostFactor ?? 1) +
      (neighbor.enterMarginCost ?? 0)
    if (neighbor.l ?? -1 !== current.l ?? -1) {
      cost += this.VIA_COST
    }
    return cost
  }

  computeH(node: Node3d): number {
    const dx = Math.abs(node.x - this.goalPoint!.x)
    const dy = Math.abs(node.y - this.goalPoint!.y)
    const dl = Math.abs(node.l - (this.goalPoint as any).l)
    return (dx + dy) ** this.GOAL_RUSH_FACTOR + dl * this.VIA_COST
  }

  getStartNode(connection: SimpleRouteConnection): Node3d {
    return {
      ...super.getStartNode(connection),
      l: this.layerToIndex(connection.pointsToConnect[0].layer),
    } as any
  }

  layerToIndex(layer: string): number {
    return getLayerIndex(this.layerCount, layer)
  }
  indexToLayer(index: number): string {
    return indexToLayer(this.layerCount, index)
  }

  getNodeName(node: Node3d): string {
    return `${nodeName(node, this.GRID_STEP)}-${node.l ?? 0}`
  }

  hasSpaceForVia(layers: number[], point: Point) {
    return layers.every(
      (l) =>
        this.obstacles.getObstaclesOverlappingRegion({
          minX: point.x - this.VIA_DIAMETER / 2 - this.OBSTACLE_MARGIN,
          minY: point.y - this.VIA_DIAMETER / 2 - this.OBSTACLE_MARGIN,
          maxX: point.x + this.VIA_DIAMETER / 2 + this.OBSTACLE_MARGIN,
          maxY: point.y + this.VIA_DIAMETER / 2 + this.OBSTACLE_MARGIN,
          l,
        }).length === 0,
    )
  }

  getNeighborsSurroundingGoal(node: Node3d): Array<Point3dWithObstacleHit> {
    const obstacles = this.obstacles!
    const goalPoint: Node3d = this.goalPoint! as any

    const neighbors: Array<Point3dWithObstacleHit> = []

    const travelDirs: Array<Direction3d> = [
      { dx: 1, dy: 0, dl: 0 },
      { dx: -1, dy: 0, dl: 0 },
      { dx: 0, dy: 1, dl: 0 },
      { dx: 0, dy: -1, dl: 0 },
    ]

    const travelDistance =
      this.VIA_DIAMETER + this.OBSTACLE_MARGIN + this.defaultGoalViaMargin

    for (const dir of travelDirs) {
      const candidateNeighbor = {
        x: node.x + dir.dx * travelDistance,
        y: node.y + dir.dy * travelDistance,
        l: node.l + dir.dl,
        obstacleHit: null,
      }
      if (!this.hasSpaceForVia([node.l, goalPoint.l], candidateNeighbor)) {
        continue
      }

      neighbors.push(candidateNeighbor)
    }

    return neighbors
  }

  getNeighbors(node: Node3d): Array<Point3dWithObstacleHit> {
    const obstacles = this.obstacles!
    const goalPoint: Node3d = this.goalPoint! as any

    const goalDistIgnoringLayer = manDist(node, goalPoint)

    // Edgecase: If we're on top of the goal but we're on the wrong layer, we
    // should add points around the goal point to try to via up
    if (goalDistIgnoringLayer <= this.OBSTACLE_MARGIN) {
      return this.getNeighborsSurroundingGoal(node)
    }

    /**
     * This is considered "forward" if we were to continue from the parent,
     * through the current node.
     */
    let forwardDir: Direction3d
    if (!node.parent) {
      forwardDir = dirFromAToB(node, goalPoint)
    } else {
      forwardDir = dirFromAToB(node.parent, node)
    }

    /**
     * Get the possible next directions (excluding backwards direction).
     * Check collisions from the current point: the parent's obstacle may
     * already have been cleared, so it must not rule out continuing forward.
     */
    const travelDirs1: Array<Direction3d> = [
      { dx: 0, dy: 1, dl: 0 },
      { dx: 1, dy: 0, dl: 0 },
      { dx: 0, dy: -1, dl: 0 },
      { dx: -1, dy: 0, dl: 0 },
    ]

    const isFarEnoughFromGoalToChangeLayer =
      goalDistIgnoringLayer > this.VIA_DIAMETER + this.OBSTACLE_MARGIN
    const isFarEnoughFromStartToChangeLayer =
      manDist(node, this.startNode!) > this.VIA_DIAMETER + this.OBSTACLE_MARGIN

    if (
      this.allowLayerChange &&
      isFarEnoughFromGoalToChangeLayer &&
      isFarEnoughFromStartToChangeLayer
    ) {
      if (node.l < this.layerCount - 1) {
        travelDirs1.push({ dx: 0, dy: 0, dl: 1 })
      }
      if (node.l > 0) {
        travelDirs1.push({ dx: 0, dy: 0, dl: -1 })
      }
    }

    const travelDirs2 = travelDirs1
      .filter((dir) => {
        // If we have a parent, don't go backwards towards the parent
        if (
          dir.dx === forwardDir.dx * -1 &&
          dir.dy === forwardDir.dy * -1 &&
          dir.dl === forwardDir.dl * -1
        ) {
          return false
        }
        return true
      })
      .map((dir) => {
        const collisionInfo = obstacles.getOrthoDirectionCollisionInfo(
          node,
          dir,
          {
            margin: this.OBSTACLE_MARGIN,
          },
        )

        return collisionInfo
      })
      // Filter out directions that are too close to the wall
      .filter((dir) => !(dir.wallDistance < this.OBSTACLE_MARGIN))

    /**
     * Figure out how far to travel. There are a couple reasons we would stop
     * traveling:
     * - A different direction opened up while we were traveling (the obstacle
     *   our parent hit was overcome)
     * - We hit a wall
     * - We passed the goal along the travel direction
     */
    const travelDirs3: Array<
      DirectionWithCollisionInfo3d & {
        travelDistance: number
        travelMarginCostFactor: number
        enterMarginCost: number
      }
    > = []
    for (const travelDir of travelDirs2) {
      const isDownVia =
        travelDir.dx === 0 && travelDir.dy === 0 && travelDir.dl === 1
      const isUpVia =
        travelDir.dx === 0 && travelDir.dy === 0 && travelDir.dl === -1
      if (isDownVia || isUpVia) {
        const hasSpaceForVia = [node.l, node.l + travelDir.dl].every(
          (l) =>
            obstacles.getObstaclesOverlappingRegion({
              minX: node.x - this.VIA_DIAMETER / 2 - this.OBSTACLE_MARGIN,
              minY: node.y - this.VIA_DIAMETER / 2 - this.OBSTACLE_MARGIN,
              maxX: node.x + this.VIA_DIAMETER / 2 + this.OBSTACLE_MARGIN,
              maxY: node.y + this.VIA_DIAMETER / 2 + this.OBSTACLE_MARGIN,
              l,
            }).length === 0,
        )
        if (!hasSpaceForVia) {
          continue
        }
      }
      if (isDownVia) {
        if (node.l < this.layerCount - 1) {
          travelDirs3.push({
            ...travelDir,
            travelDistance: 0,
            enterMarginCost: 0,
            travelMarginCostFactor: 1,
          })
        }
        continue
      }
      if (isUpVia) {
        if (node.l > 0) {
          travelDirs3.push({
            ...travelDir,
            travelDistance: 0,
            enterMarginCost: 0,
            travelMarginCostFactor: 1,
          })
        }
        continue
      }

      let overcomeDistance: number | null = null
      if (node?.obstacleHit) {
        overcomeDistance = getDistanceToOvercomeObstacle({
          node,
          travelDir,
          wallDir: { ...forwardDir, wallDistance: this.OBSTACLE_MARGIN },
          obstacle: node.obstacleHit,
          obstacles,
          OBSTACLE_MARGIN: this.OBSTACLE_MARGIN,
          SHOULD_DETECT_CONJOINED_OBSTACLES: true,
        })
      }

      const goalDistAlongTravelDir = distAlongDir(node, goalPoint, travelDir)
      const isGoalInTravelDir =
        (travelDir.dx === 0 ||
          Math.sign(goalPoint.x - node.x) === travelDir.dx) &&
        (travelDir.dy === 0 || Math.sign(goalPoint.y - node.y) === travelDir.dy)

      if (
        goalDistAlongTravelDir < travelDir.wallDistance &&
        goalDistAlongTravelDir > 0 &&
        isGoalInTravelDir
      ) {
        const isGoalOnSameLayer = node.l === goalPoint.l

        let stopShortDistance = 0
        if (
          !isGoalOnSameLayer &&
          Math.abs(goalDistAlongTravelDir - goalDistIgnoringLayer) <
            this.GRID_STEP
        ) {
          stopShortDistance =
            this.VIA_DIAMETER + this.OBSTACLE_MARGIN + this.defaultGoalViaMargin
        }

        travelDirs3.push({
          ...travelDir,
          travelDistance: goalDistAlongTravelDir - stopShortDistance,
          enterMarginCost: 0,
          travelMarginCostFactor: 1,
        })
      } else if (
        overcomeDistance !== null &&
        overcomeDistance < travelDir.wallDistance
      ) {
        for (const { margin, enterCost, travelCostFactor } of this
          .marginsWithCosts) {
          if (
            overcomeDistance - this.OBSTACLE_MARGIN + margin * 2 <
            travelDir.wallDistance
          ) {
            travelDirs3.push({
              ...travelDir,
              travelDistance: overcomeDistance - this.OBSTACLE_MARGIN + margin,
              enterMarginCost: enterCost,
              travelMarginCostFactor: travelCostFactor,
            })
          }
        }
        if (travelDir.wallDistance === Infinity) {
          travelDirs3.push({
            ...travelDir,
            travelDistance: goalDistAlongTravelDir,
            enterMarginCost: 0,
            travelMarginCostFactor: 1,
          })
        } else if (travelDir.wallDistance > this.largestMargin) {
          for (const { margin, enterCost, travelCostFactor } of this
            .marginsWithCosts) {
            if (travelDir.wallDistance > this.largestMargin + margin) {
              travelDirs3.push({
                ...travelDir,
                travelDistance: travelDir.wallDistance - margin,
                enterMarginCost: enterCost,
                travelMarginCostFactor: travelCostFactor,
              })
            }
          }
        }
      } else if (travelDir.wallDistance !== Infinity) {
        for (const { margin, enterCost, travelCostFactor } of this
          .marginsWithCosts) {
          if (travelDir.wallDistance > margin) {
            travelDirs3.push({
              ...travelDir,
              travelDistance: travelDir.wallDistance - margin,
              enterMarginCost: enterCost,
              travelMarginCostFactor: travelCostFactor,
            })
          }
        }
      }
    }

    return travelDirs3.map((dir) => ({
      x: node.x + dir.dx * dir.travelDistance,
      y: node.y + dir.dy * dir.travelDistance,
      l: node.l + dir.dl,
      obstacleHit: dir.obstacle,
      travelMarginCostFactor: dir.travelMarginCostFactor,
      enterMarginCost: dir.enterMarginCost,
    }))
  }
}

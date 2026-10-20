import type { AnyCircuitElement } from "circuit-json"

export interface PcbObstacleBox {
  type: "keepout" | "cutout" | "hole" | "pad"
  id: string
  layer: string
  minX: number
  minY: number
  maxX: number
  maxY: number
  center: { x: number; y: number }
  netId?: string
}

export interface PcbObstaclesSummaryReport {
  totalObstacles: number
  keepoutsCount: number
  cutoutsCount: number
  holesCount: number
  padsCount: number
  obstaclesByLayer: Record<string, PcbObstacleBox[]>
}

/**
 * Extracts all clearance and routing obstacles from Circuit JSON,
 * including keepouts, cutouts, non-plated holes, and copper pads.
 */
export function getPcbObstaclesSummary(
  circuitJson: AnyCircuitElement[],
): PcbObstaclesSummaryReport {
  let keepoutsCount = 0
  let cutoutsCount = 0
  let holesCount = 0
  let padsCount = 0

  const obstaclesByLayer: Record<string, PcbObstacleBox[]> = {}

  const addObstacle = (layer: string, obs: PcbObstacleBox) => {
    if (!obstaclesByLayer[layer]) obstaclesByLayer[layer] = []
    obstaclesByLayer[layer].push(obs)
  }

  for (const elm of circuitJson) {
    switch (elm.type) {
      case "pcb_keepout": {
        keepoutsCount++
        const id = (elm as any).pcb_keepout_id ?? "keepout"
        const layers: string[] = (elm as any).layers ?? [
          (elm as any).layer ?? "all",
        ]

        let minX = 0
        let minY = 0
        let maxX = 0
        let maxY = 0
        const center = (elm as any).center ?? { x: 0, y: 0 }

        if (
          typeof (elm as any).width === "number" &&
          typeof (elm as any).height === "number"
        ) {
          const hw = (elm as any).width / 2
          const hh = (elm as any).height / 2
          minX = center.x - hw
          maxX = center.x + hw
          minY = center.y - hh
          maxY = center.y + hh
        } else if (typeof (elm as any).radius === "number") {
          const r = (elm as any).radius
          minX = center.x - r
          maxX = center.x + r
          minY = center.y - r
          maxY = center.y + r
        }

        for (const lyr of layers) {
          addObstacle(lyr, {
            type: "keepout",
            id,
            layer: lyr,
            minX,
            minY,
            maxX,
            maxY,
            center,
          })
        }
        break
      }

      case "pcb_cutout": {
        cutoutsCount++
        const id = (elm as any).pcb_cutout_id ?? "cutout"
        const center = (elm as any).center ?? { x: 0, y: 0 }
        let minX = center.x
        let maxX = center.x
        let minY = center.y
        let maxY = center.y

        if (
          typeof (elm as any).width === "number" &&
          typeof (elm as any).height === "number"
        ) {
          const hw = (elm as any).width / 2
          const hh = (elm as any).height / 2
          minX = center.x - hw
          maxX = center.x + hw
          minY = center.y - hh
          maxY = center.y + hh
        } else if (typeof (elm as any).radius === "number") {
          const r = (elm as any).radius
          minX = center.x - r
          maxX = center.x + r
          minY = center.y - r
          maxY = center.y + r
        }

        addObstacle("all", {
          type: "cutout",
          id,
          layer: "all",
          minX,
          minY,
          maxX,
          maxY,
          center,
        })
        break
      }

      case "pcb_hole": {
        holesCount++
        const id = (elm as any).pcb_hole_id ?? "hole"
        const x = (elm as any).x ?? 0
        const y = (elm as any).y ?? 0
        const r = ((elm as any).hole_diameter ?? 1) / 2

        addObstacle("all", {
          type: "hole",
          id,
          layer: "all",
          minX: x - r,
          maxX: x + r,
          minY: y - r,
          maxY: y + r,
          center: { x, y },
        })
        break
      }

      case "pcb_smtpad": {
        padsCount++
        const id = (elm as any).pcb_smtpad_id ?? "smtpad"
        const layer = (elm as any).layer ?? "top"
        const x = (elm as any).x ?? 0
        const y = (elm as any).y ?? 0
        const w = (elm as any).width ?? (elm as any).radius * 2 ?? 1
        const h = (elm as any).height ?? (elm as any).radius * 2 ?? 1

        addObstacle(layer, {
          type: "pad",
          id,
          layer,
          minX: x - w / 2,
          maxX: x + w / 2,
          minY: y - h / 2,
          maxY: y + h / 2,
          center: { x, y },
          netId: (elm as any).source_net_id ?? (elm as any).net_id,
        })
        break
      }

      case "pcb_plated_hole": {
        padsCount++
        const id = (elm as any).pcb_plated_hole_id ?? "plated_hole"
        const layers: string[] = (elm as any).layers ?? ["top", "bottom"]
        const x = (elm as any).x ?? 0
        const y = (elm as any).y ?? 0
        const od = (elm as any).outer_diameter ?? 1.6
        const r = od / 2

        for (const lyr of layers) {
          addObstacle(lyr, {
            type: "pad",
            id,
            layer: lyr,
            minX: x - r,
            maxX: x + r,
            minY: y - r,
            maxY: y + r,
            center: { x, y },
            netId: (elm as any).source_net_id ?? (elm as any).net_id,
          })
        }
        break
      }
    }
  }

  let totalObstacles = 0
  for (const list of Object.values(obstaclesByLayer)) {
    totalObstacles += list.length
  }

  return {
    totalObstacles,
    keepoutsCount,
    cutoutsCount,
    holesCount,
    padsCount,
    obstaclesByLayer,
  }
}

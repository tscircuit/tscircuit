import { Board, Trace } from "@tscircuit/core"
import {
  runAllPlacementChecks as origRunAllPlacementChecks,
  runAllRoutingChecks as origRunAllRoutingChecks,
  runAllChecks as origRunAllChecks,
} from "@tscircuit/checks"

export interface Point2D {
  x: number
  y: number
}

export interface Box2D {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

function getPcbBoard(circuitJson: any[]): any | undefined {
  return circuitJson.find((el) => el.type === "pcb_board")
}

function getComponentNameMap(circuitJson: any[]): Map<string, string> {
  const sourceNames = new Map<string, string>()
  for (const el of circuitJson) {
    if (el.type === "source_component" && el.source_component_id && el.name) {
      sourceNames.set(el.source_component_id, el.name)
    }
  }
  const pcbNames = new Map<string, string>()
  for (const el of circuitJson) {
    if (el.type === "pcb_component" && el.pcb_component_id) {
      const name =
        (el.source_component_id && sourceNames.get(el.source_component_id)) ||
        el.pcb_component_id
      pcbNames.set(el.pcb_component_id, name)
    }
  }
  return pcbNames
}

function getNetNameMaps(circuitJson: any[]): {
  portNetMap: Map<string, string>
  traceNetMap: Map<string, string>
  connKeyNetMap: Map<string, string>
} {
  const sourcePortName = new Map<string, string>()
  const sourceNetName = new Map<string, string>()
  const connKeyNetMap = new Map<string, string>()
  for (const el of circuitJson) {
    if (el.type === "source_net" && el.source_net_id && el.name) {
      sourceNetName.set(el.source_net_id, el.name)
      if (el.subcircuit_connectivity_map_key) {
        connKeyNetMap.set(el.subcircuit_connectivity_map_key, el.name)
      }
    }
    if (el.type === "source_port" && el.source_port_id && el.name) {
      sourcePortName.set(el.source_port_id, el.name)
    }
  }

  const sourceTraceNet = new Map<string, string>()
  for (const el of circuitJson) {
    if (el.type === "source_trace" && el.source_trace_id) {
      const netId = el.connected_source_net_ids?.[0]
      const netName =
        (netId && sourceNetName.get(netId)) ||
        (el.subcircuit_connectivity_map_key &&
          connKeyNetMap.get(el.subcircuit_connectivity_map_key)) ||
        el.display_name ||
        el.source_trace_id
      sourceTraceNet.set(el.source_trace_id, netName)
      if (el.subcircuit_connectivity_map_key && !connKeyNetMap.has(el.subcircuit_connectivity_map_key)) {
        connKeyNetMap.set(el.subcircuit_connectivity_map_key, netName)
      }
      for (const spId of el.connected_source_port_ids ?? []) {
        sourcePortName.set(spId, netName)
      }
    }
  }

  const portNetMap = new Map<string, string>()
  for (const el of circuitJson) {
    if (el.type === "pcb_port" && el.pcb_port_id) {
      const net =
        (el.source_port_id && sourcePortName.get(el.source_port_id)) ||
        undefined
      if (net) {
        portNetMap.set(el.pcb_port_id, net)
      }
    }
  }

  const traceNetMap = new Map<string, string>()
  for (const el of circuitJson) {
    if (el.type === "pcb_trace" && el.pcb_trace_id) {
      const net =
        (el.source_trace_id && sourceTraceNet.get(el.source_trace_id)) ||
        el.pcb_trace_id
      traceNetMap.set(el.pcb_trace_id, net)
    }
  }

  return { portNetMap, traceNetMap, connKeyNetMap }
}

// ============================================================================
// 2. Annular ring & via pad/hole size check
// ============================================================================

export interface CheckViaAnnularRingOptions {
  minViaHoleDiameter?: number
  minViaPadDiameter?: number
  minViaAnnularRing?: number
  minPlatedHoleAnnularRing?: number
}

export function checkViaAnnularRing(
  circuitJson: any[],
  options: CheckViaAnnularRingOptions = {},
): any[] {
  const board = getPcbBoard(circuitJson)
  const minViaHoleDiameter =
    options.minViaHoleDiameter ?? board?.min_via_hole_diameter ?? 0.2
  const minViaPadDiameter =
    options.minViaPadDiameter ?? board?.min_via_pad_diameter ?? 0.3
  const minViaAnnularRing = options.minViaAnnularRing ?? 0.1
  const minPlatedHoleAnnularRing = options.minPlatedHoleAnnularRing ?? 0.15

  const errors: any[] = []

  for (const el of circuitJson) {
    if (el.type === "pcb_via") {
      const hole = Number(el.hole_diameter ?? 0)
      const pad = Number(el.outer_diameter ?? 0)
      const ring = (pad - hole) / 2
      const violations: string[] = []

      if (hole + 1e-6 < minViaHoleDiameter) {
        violations.push(
          `hole_diameter ${hole}mm < min_via_hole_diameter ${minViaHoleDiameter}mm`,
        )
      }
      if (pad + 1e-6 < minViaPadDiameter) {
        violations.push(
          `outer_diameter ${pad}mm < min_via_pad_diameter ${minViaPadDiameter}mm`,
        )
      }
      if (ring + 1e-6 < minViaAnnularRing) {
        violations.push(
          `annular ring ${ring.toFixed(4)}mm < minimum ${minViaAnnularRing}mm`,
        )
      }

      if (violations.length > 0) {
        const viaId = el.pcb_via_id ?? `at_${el.x}_${el.y}`
        errors.push({
          type: "pcb_trace_error",
          pcb_trace_error_id: `pcb_via_annular_ring_error_${viaId}`,
          error_type: "pcb_trace_error",
          pcb_trace_id: el.pcb_trace_id ?? "",
          source_trace_id: el.source_trace_id ?? "",
          pcb_component_ids: [],
          pcb_port_ids: Array.isArray(el.pcb_port_ids) ? el.pcb_port_ids : [],
          center: { x: el.x, y: el.y },
          message: `Via ${viaId} at (${el.x}, ${el.y}) violates via minimums: ${violations.join("; ")}`,
        })
      }
    } else if (el.type === "pcb_plated_hole") {
      let ring: number | undefined
      if (el.shape === "circle") {
        if (
          typeof el.outer_diameter === "number" &&
          typeof el.hole_diameter === "number"
        ) {
          ring = (el.outer_diameter - el.hole_diameter) / 2
        }
      } else if (el.shape === "oval" || el.shape === "pill") {
        if (
          typeof el.outer_width === "number" &&
          typeof el.hole_width === "number" &&
          typeof el.outer_height === "number" &&
          typeof el.hole_height === "number"
        ) {
          ring = Math.min(
            (el.outer_width - el.hole_width) / 2,
            (el.outer_height - el.hole_height) / 2,
          )
        }
      } else if (el.shape === "circular_hole_with_rect_pad") {
        if (
          typeof el.rect_pad_width === "number" &&
          typeof el.rect_pad_height === "number" &&
          typeof el.hole_diameter === "number"
        ) {
          ring = Math.min(
            (el.rect_pad_width - el.hole_diameter) / 2,
            (el.rect_pad_height - el.hole_diameter) / 2,
          )
        }
      } else if (
        el.shape === "pill_hole_with_rect_pad" ||
        el.shape === "rotated_pill_hole_with_rect_pad"
      ) {
        if (
          typeof el.rect_pad_width === "number" &&
          typeof el.rect_pad_height === "number" &&
          typeof el.hole_width === "number" &&
          typeof el.hole_height === "number"
        ) {
          ring = Math.min(
            (el.rect_pad_width - el.hole_width) / 2,
            (el.rect_pad_height - el.hole_height) / 2,
          )
        }
      }

      if (ring !== undefined && ring + 1e-6 < minPlatedHoleAnnularRing) {
        const phId = el.pcb_plated_hole_id ?? `at_${el.x}_${el.y}`
        errors.push({
          type: "pcb_trace_error",
          pcb_trace_error_id: `pcb_plated_hole_annular_ring_error_${phId}`,
          error_type: "pcb_trace_error",
          pcb_trace_id: "",
          source_trace_id: "",
          pcb_component_ids: el.pcb_component_id ? [el.pcb_component_id] : [],
          pcb_port_ids: el.pcb_port_id ? [el.pcb_port_id] : [],
          center: { x: el.x, y: el.y },
          message: `Plated hole ${phId} at (${el.x}, ${el.y}) has annular ring ${ring.toFixed(4)}mm < minimum ${minPlatedHoleAnnularRing}mm`,
        })
      }
    }
  }

  return errors
}

export const checkAnnularRing = checkViaAnnularRing

// ============================================================================
// 3. Minimum trace width check
// ============================================================================

export interface CheckMinTraceWidthOptions {
  minTraceWidth?: number
}

export function checkMinTraceWidth(
  circuitJson: any[],
  options: CheckMinTraceWidthOptions = {},
): any[] {
  const board = getPcbBoard(circuitJson)
  const minTraceWidth =
    options.minTraceWidth ?? board?.min_trace_width ?? 0.1

  const errors: any[] = []
  for (const el of circuitJson) {
    if (el.type !== "pcb_trace" || !Array.isArray(el.route)) continue
    for (let i = 0; i < el.route.length; i++) {
      const pt = el.route[i]
      if (
        pt.route_type === "wire" &&
        typeof pt.width === "number" &&
        pt.width + 1e-6 < minTraceWidth
      ) {
        errors.push({
          type: "pcb_trace_error",
          pcb_trace_error_id: `pcb_min_trace_width_error_${el.pcb_trace_id}_${i}`,
          error_type: "pcb_trace_error",
          pcb_trace_id: el.pcb_trace_id ?? "",
          source_trace_id: el.source_trace_id ?? "",
          pcb_component_ids: [],
          pcb_port_ids: [pt.start_pcb_port_id, pt.end_pcb_port_id].filter(
            Boolean,
          ),
          center: { x: pt.x, y: pt.y },
          message: `Trace ${el.pcb_trace_id} route point ${i} on layer ${pt.layer} has width ${pt.width}mm < min_trace_width ${minTraceWidth}mm`,
        })
      }
    }
  }
  return errors
}

// ============================================================================
// 4. Acute angles in traces check
// ============================================================================

export interface CheckTraceAcuteAnglesOptions {
  minAngleDegrees?: number
}

function isPointFilledByCopperOnLayer(
  circuitJson: any[],
  pt: Point2D,
  layer: string,
): boolean {
  for (const el of circuitJson) {
    if (el.type === "pcb_smtpad" && el.layer === layer) {
      if (el.shape === "circle") {
        const r = el.radius ?? 0
        if (Math.hypot(pt.x - el.x, pt.y - el.y) <= r + 1e-4) return true
      } else {
        const w = el.width ?? 0
        const h = el.height ?? 0
        const rot = ((el.ccw_rotation ?? 0) * Math.PI) / 180
        const dx = pt.x - el.x
        const dy = pt.y - el.y
        const lx = dx * Math.cos(-rot) - dy * Math.sin(-rot)
        const ly = dx * Math.sin(-rot) + dy * Math.cos(-rot)
        if (Math.abs(lx) <= w / 2 + 1e-4 && Math.abs(ly) <= h / 2 + 1e-4) {
          return true
        }
      }
    } else if (
      el.type === "pcb_plated_hole" &&
      Array.isArray(el.layers) &&
      el.layers.includes(layer)
    ) {
      if (el.shape === "circle") {
        const r = (el.outer_diameter ?? 0) / 2
        if (Math.hypot(pt.x - el.x, pt.y - el.y) <= r + 1e-4) return true
      } else {
        const w = el.outer_width ?? el.rect_pad_width ?? 0
        const h = el.outer_height ?? el.rect_pad_height ?? 0
        const rot = ((el.ccw_rotation ?? 0) * Math.PI) / 180
        const dx = pt.x - el.x
        const dy = pt.y - el.y
        const lx = dx * Math.cos(-rot) - dy * Math.sin(-rot)
        const ly = dx * Math.sin(-rot) + dy * Math.cos(-rot)
        if (Math.abs(lx) <= w / 2 + 1e-4 && Math.abs(ly) <= h / 2 + 1e-4) {
          return true
        }
      }
    } else if (
      el.type === "pcb_via" &&
      Array.isArray(el.layers) &&
      el.layers.includes(layer)
    ) {
      const r = (el.outer_diameter ?? 0) / 2
      if (Math.hypot(pt.x - el.x, pt.y - el.y) <= r + 1e-4) return true
    }
  }
  return false
}

export function checkTraceAcuteAngles(
  circuitJson: any[],
  options: CheckTraceAcuteAnglesOptions = {},
): any[] {
  const minAngleDegrees = options.minAngleDegrees ?? 80
  const warnings: any[] = []

  for (const el of circuitJson) {
    if (el.type !== "pcb_trace" || !Array.isArray(el.route)) continue
    const route = el.route
    for (let i = 1; i < route.length - 1; i++) {
      const prev = route[i - 1]
      const curr = route[i]
      const next = route[i + 1]

      if (
        prev.route_type !== "wire" ||
        curr.route_type !== "wire" ||
        next.route_type !== "wire"
      ) {
        continue
      }
      if (prev.layer !== curr.layer || curr.layer !== next.layer) {
        continue
      }

      const ux = prev.x - curr.x
      const uy = prev.y - curr.y
      const vx = next.x - curr.x
      const vy = next.y - curr.y
      const lenU = Math.hypot(ux, uy)
      const lenV = Math.hypot(vx, vy)
      if (lenU < 1e-6 || lenV < 1e-6) continue

      const cosAngle = Math.max(
        -1,
        Math.min(1, (ux * vx + uy * vy) / (lenU * lenV)),
      )
      const angleDegrees = (Math.acos(cosAngle) * 180) / Math.PI

      if (angleDegrees + 1e-4 < minAngleDegrees) {
        const uNormX = ux / lenU
        const uNormY = uy / lenU
        const vNormX = vx / lenV
        const vNormY = vy / lenV
        const bisectorX = uNormX + vNormX
        const bisectorY = uNormY + vNormY
        const bisectorLen = Math.hypot(bisectorX, bisectorY)
        const traceWidth = curr.width ?? 0.15
        const notchPoint =
          bisectorLen > 1e-6
            ? {
                x: curr.x + (bisectorX / bisectorLen) * traceWidth,
                y: curr.y + (bisectorY / bisectorLen) * traceWidth,
              }
            : { x: curr.x, y: curr.y }

        if (
          isPointFilledByCopperOnLayer(circuitJson, curr, curr.layer) &&
          isPointFilledByCopperOnLayer(circuitJson, notchPoint, curr.layer)
        ) {
          continue
        }

        warnings.push({
          type: "pcb_trace_warning",
          pcb_trace_warning_id: `pcb_trace_acute_angle_${el.pcb_trace_id}_${i}`,
          warning_type: "pcb_trace_warning",
          pcb_trace_id: el.pcb_trace_id ?? "",
          source_trace_id: el.source_trace_id ?? "",
          pcb_component_ids: [],
          pcb_port_ids: [],
          center: { x: curr.x, y: curr.y },
          angle_degrees: angleDegrees,
          minimum_angle_degrees: minAngleDegrees,
          message: `Trace ${el.pcb_trace_id} has an acute bend of ${angleDegrees.toFixed(2)}° (< ${minAngleDegrees}°) at (${curr.x}, ${curr.y}) on layer ${curr.layer}`,
        })
      }
    }
  }

  return warnings
}

// ============================================================================
// 5. Solder-mask web / bridge check
// ============================================================================

export interface CheckSolderMaskBridgeOptions {
  minBridgeWidth?: number
}

interface MaskOpeningShape {
  id: string
  layer: "top" | "bottom"
  pcb_component_id?: string
  pcb_port_id?: string
  kind: "circle" | "rect"
  x: number
  y: number
  radius?: number
  width?: number
  height?: number
  rotationDeg?: number
  hasExplicitMargin: boolean
  bounds: Box2D
}

function getMaskOpenings(circuitJson: any[]): MaskOpeningShape[] {
  const openings: MaskOpeningShape[] = []

  for (const el of circuitJson) {
    if (el.type === "pcb_smtpad") {
      if (el.is_covered_with_solder_mask === true) continue
      if (el.layer !== "top" && el.layer !== "bottom") continue
      const margin =
        typeof el.soldermask_margin === "number" ? el.soldermask_margin : 0
      const hasExplicitMargin =
        typeof el.soldermask_margin === "number" && el.soldermask_margin !== 0
      if (el.shape === "circle") {
        const r = Math.max(0, (el.radius ?? 0) + margin)
        if (r <= 0) continue
        openings.push({
          id: el.pcb_smtpad_id ?? `smtpad_${el.x}_${el.y}`,
          layer: el.layer,
          pcb_component_id: el.pcb_component_id,
          pcb_port_id: el.pcb_port_id,
          kind: "circle",
          x: el.x,
          y: el.y,
          radius: r,
          hasExplicitMargin,
          bounds: {
            minX: el.x - r,
            maxX: el.x + r,
            minY: el.y - r,
            maxY: el.y + r,
          },
        })
      } else if (el.shape !== "polygon") {
        const w = Math.max(0, (el.width ?? 0) + margin * 2)
        const h = Math.max(0, (el.height ?? 0) + margin * 2)
        if (w <= 0 || h <= 0) continue
        const rot =
          el.shape === "rotated_rect" || el.shape === "rotated_pill"
            ? (el.ccw_rotation ?? 0)
            : 0
        const rad = (rot * Math.PI) / 180
        const bw = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))
        const bh = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad))
        openings.push({
          id: el.pcb_smtpad_id ?? `smtpad_${el.x}_${el.y}`,
          layer: el.layer,
          pcb_component_id: el.pcb_component_id,
          pcb_port_id: el.pcb_port_id,
          kind: "rect",
          x: el.x,
          y: el.y,
          width: w,
          height: h,
          rotationDeg: rot,
          hasExplicitMargin,
          bounds: {
            minX: el.x - bw / 2,
            maxX: el.x + bw / 2,
            minY: el.y - bh / 2,
            maxY: el.y + bh / 2,
          },
        })
      }
    } else if (el.type === "pcb_soldermask_opening") {
      if (el.layer !== "top" && el.layer !== "bottom") continue
      if (el.shape === "circle") {
        const r = el.radius ?? 0
        if (r <= 0) continue
        openings.push({
          id: el.pcb_soldermask_opening_id ?? `mask_opening_${el.x}_${el.y}`,
          layer: el.layer,
          pcb_component_id: el.pcb_component_id,
          kind: "circle",
          x: el.x,
          y: el.y,
          radius: r,
          hasExplicitMargin: true,
          bounds: {
            minX: el.x - r,
            maxX: el.x + r,
            minY: el.y - r,
            maxY: el.y + r,
          },
        })
      } else if (el.shape !== "polygon") {
        const w = el.width ?? 0
        const h = el.height ?? 0
        if (w <= 0 || h <= 0) continue
        const rot = el.shape === "rotated_rect" ? (el.ccw_rotation ?? 0) : 0
        const rad = (rot * Math.PI) / 180
        const bw = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))
        const bh = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad))
        openings.push({
          id: el.pcb_soldermask_opening_id ?? `mask_opening_${el.x}_${el.y}`,
          layer: el.layer,
          pcb_component_id: el.pcb_component_id,
          kind: "rect",
          x: el.x,
          y: el.y,
          width: w,
          height: h,
          rotationDeg: rot,
          hasExplicitMargin: true,
          bounds: {
            minX: el.x - bw / 2,
            maxX: el.x + bw / 2,
            minY: el.y - bh / 2,
            maxY: el.y + bh / 2,
          },
        })
      }
    } else if (el.type === "pcb_plated_hole") {
      if (el.is_covered_with_solder_mask === true) continue
      const margin =
        typeof el.soldermask_margin === "number" ? el.soldermask_margin : 0
      const hasExplicitMargin =
        typeof el.soldermask_margin === "number" && el.soldermask_margin !== 0
      for (const layer of ["top", "bottom"] as const) {
        if (!Array.isArray(el.layers) || !el.layers.includes(layer)) continue
        if (el.shape === "circle") {
          const r = Math.max(0, (el.outer_diameter ?? 0) / 2 + margin)
          if (r <= 0) continue
          openings.push({
            id: `${el.pcb_plated_hole_id}_${layer}`,
            layer,
            pcb_component_id: el.pcb_component_id,
            pcb_port_id: el.pcb_port_id,
            kind: "circle",
            x: el.x,
            y: el.y,
            radius: r,
            hasExplicitMargin,
            bounds: {
              minX: el.x - r,
              maxX: el.x + r,
              minY: el.y - r,
              maxY: el.y + r,
            },
          })
        } else {
          const w = Math.max(
            0,
            (el.outer_width ?? el.rect_pad_width ?? 0) + margin * 2,
          )
          const h = Math.max(
            0,
            (el.outer_height ?? el.rect_pad_height ?? 0) + margin * 2,
          )
          if (w <= 0 || h <= 0) continue
          const rot = el.ccw_rotation ?? el.rect_ccw_rotation ?? 0
          const rad = (rot * Math.PI) / 180
          const bw = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))
          const bh = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad))
          openings.push({
            id: `${el.pcb_plated_hole_id}_${layer}`,
            layer,
            pcb_component_id: el.pcb_component_id,
            pcb_port_id: el.pcb_port_id,
            kind: "rect",
            x: el.x,
            y: el.y,
            width: w,
            height: h,
            rotationDeg: rot,
            hasExplicitMargin,
            bounds: {
              minX: el.x - bw / 2,
              maxX: el.x + bw / 2,
              minY: el.y - bh / 2,
              maxY: el.y + bh / 2,
            },
          })
        }
      }
    }
  }

  return openings
}

function computeOpeningGap(a: MaskOpeningShape, b: MaskOpeningShape): number {
  if (a.kind === "circle" && b.kind === "circle") {
    return Math.hypot(a.x - b.x, a.y - b.y) - ((a.radius ?? 0) + (b.radius ?? 0))
  }
  const dx = Math.max(0, a.bounds.minX - b.bounds.maxX, b.bounds.minX - a.bounds.maxX)
  const dy = Math.max(0, a.bounds.minY - b.bounds.maxY, b.bounds.minY - a.bounds.maxY)
  if (dx === 0 && dy === 0) {
    const overlapX = Math.min(a.bounds.maxX, b.bounds.maxX) - Math.max(a.bounds.minX, b.bounds.minX)
    const overlapY = Math.min(a.bounds.maxY, b.bounds.maxY) - Math.max(a.bounds.minY, b.bounds.minY)
    return -Math.min(overlapX, overlapY)
  }
  return Math.hypot(dx, dy)
}

export function checkSolderMaskBridge(
  circuitJson: any[],
  options: CheckSolderMaskBridgeOptions = {},
): any[] {
  const minBridgeWidth = options.minBridgeWidth ?? 0.1
  const openings = getMaskOpenings(circuitJson)
  const errors: any[] = []

  for (let i = 0; i < openings.length; i++) {
    for (let j = i + 1; j < openings.length; j++) {
      const a = openings[i]
      const b = openings[j]
      if (a.layer !== b.layer) continue

      const gap = computeOpeningGap(a, b)
      if (gap > -1e-6 && gap + 1e-6 < minBridgeWidth) {
        errors.push({
          type: "pcb_pad_pad_clearance_error",
          pcb_pad_pad_clearance_error_id: `pcb_solder_mask_bridge_${a.id}_${b.id}`,
          pcb_error_id: `pcb_solder_mask_bridge_${a.id}_${b.id}`,
          error_type: "pcb_pad_pad_clearance_error",
          pcb_pad_ids: [a.id, b.id],
          layer: a.layer,
          minimum_clearance: minBridgeWidth,
          actual_clearance: Math.max(0, gap),
          center: {
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2,
          },
          message: `Solder-mask web (bridge) between ${a.id} and ${b.id} on ${a.layer} is ${Math.max(0, gap).toFixed(4)}mm, below minimum bridge width ${minBridgeWidth}mm`,
        })
      }
    }
  }

  return errors
}

// ============================================================================
// 6. Silkscreen over pads / mask openings / holes check
// ============================================================================

export interface CheckSilkscreenOverPadsOptions {
  minClearance?: number
}

function distanceSegmentToBox(
  p1: Point2D,
  p2: Point2D,
  box: Box2D,
): number {
  const pointToBoxDist = (p: Point2D) => {
    const dx = Math.max(0, box.minX - p.x, p.x - box.maxX)
    const dy = Math.max(0, box.minY - p.y, p.y - box.maxY)
    return Math.hypot(dx, dy)
  }

  if (pointToBoxDist(p1) === 0 || pointToBoxDist(p2) === 0) return 0

  const segDist = (a1: Point2D, a2: Point2D, b1: Point2D, b2: Point2D): number => {
    const orient = (p: Point2D, q: Point2D, r: Point2D) =>
      (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)
    const onSeg = (p: Point2D, q: Point2D, r: Point2D) =>
      q.x >= Math.min(p.x, r.x) - 1e-9 &&
      q.x <= Math.max(p.x, r.x) + 1e-9 &&
      q.y >= Math.min(p.y, r.y) - 1e-9 &&
      q.y <= Math.max(p.y, r.y) + 1e-9

    const o1 = orient(a1, a2, b1)
    const o2 = orient(a1, a2, b2)
    const o3 = orient(b1, b2, a1)
    const o4 = orient(b1, b2, a2)

    if (
      ((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) &&
      ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))
    ) {
      return 0
    }
    if (Math.abs(o1) < 1e-9 && onSeg(a1, b1, a2)) return 0
    if (Math.abs(o2) < 1e-9 && onSeg(a1, b2, a2)) return 0
    if (Math.abs(o3) < 1e-9 && onSeg(b1, a1, b2)) return 0
    if (Math.abs(o4) < 1e-9 && onSeg(b1, a2, b2)) return 0

    const ptSeg = (p: Point2D, s1: Point2D, s2: Point2D) => {
      const dx = s2.x - s1.x
      const dy = s2.y - s1.y
      const lenSq = dx * dx + dy * dy
      if (lenSq < 1e-12) return Math.hypot(p.x - s1.x, p.y - s1.y)
      const t = Math.max(
        0,
        Math.min(1, ((p.x - s1.x) * dx + (p.y - s1.y) * dy) / lenSq),
      )
      return Math.hypot(p.x - (s1.x + t * dx), p.y - (s1.y + t * dy))
    }

    return Math.min(
      ptSeg(a1, b1, b2),
      ptSeg(a2, b1, b2),
      ptSeg(b1, a1, a2),
      ptSeg(b2, a1, a2),
    )
  }

  const c1 = { x: box.minX, y: box.minY }
  const c2 = { x: box.maxX, y: box.minY }
  const c3 = { x: box.maxX, y: box.maxY }
  const c4 = { x: box.minX, y: box.maxY }

  return Math.min(
    segDist(p1, p2, c1, c2),
    segDist(p1, p2, c2, c3),
    segDist(p1, p2, c3, c4),
    segDist(p1, p2, c4, c1),
  )
}

function getSilkscreenTextBounds(el: any): Box2D {
  const fontSize = Number(el.font_size ?? 1)
  const text = String(el.text ?? "")
  const capHeight = fontSize * 0.7
  const charAdvance = fontSize * 0.65
  const textWidth = Math.max(fontSize * 0.5, text.length * charAdvance)
  const textHeight = capHeight

  let x0 = Number(el.anchor_position?.x ?? 0)
  let y0 = Number(el.anchor_position?.y ?? 0)
  const align = el.anchor_alignment ?? "center"

  if (align === "top_center") {
    x0 -= textWidth / 2
    y0 -= textHeight
  } else if (align === "top_right") {
    x0 -= textWidth
    y0 -= textHeight
  } else if (align === "top_left") {
    y0 -= textHeight
  } else if (align === "center_left") {
    y0 -= textHeight / 2
  } else if (align === "center_right") {
    x0 -= textWidth
    y0 -= textHeight / 2
  } else if (align === "bottom_center") {
    x0 -= textWidth / 2
  } else if (align === "bottom_right") {
    x0 -= textWidth
  } else if (align === "bottom_left") {
    // x0, y0 is bottom-left
  } else {
    x0 -= textWidth / 2
    y0 -= textHeight / 2
  }

  const cx = x0 + textWidth / 2
  const cy = y0 + textHeight / 2
  const rot = ((el.ccw_rotation ?? 0) * Math.PI) / 180
  const bw =
    Math.abs(textWidth * Math.cos(rot)) + Math.abs(textHeight * Math.sin(rot))
  const bh =
    Math.abs(textWidth * Math.sin(rot)) + Math.abs(textHeight * Math.cos(rot))

  return {
    minX: cx - bw / 2,
    maxX: cx + bw / 2,
    minY: cy - bh / 2,
    maxY: cy + bh / 2,
  }
}

export function checkSilkscreenOverPads(
  circuitJson: any[],
  options: CheckSilkscreenOverPadsOptions = {},
): any[] {
  const minClearance = options.minClearance ?? 0
  const obstacles = getMaskOpenings(circuitJson)

  for (const el of circuitJson) {
    if (el.type === "pcb_hole") {
      const r =
        typeof el.hole_diameter === "number"
          ? el.hole_diameter / 2
          : Math.max(el.hole_width ?? 0, el.hole_height ?? 0) / 2
      if (r <= 0) continue
      for (const layer of ["top", "bottom"] as const) {
        obstacles.push({
          id: `${el.pcb_hole_id ?? "hole"}_${layer}`,
          layer,
          kind: "circle",
          x: el.x,
          y: el.y,
          radius: r,
          hasExplicitMargin: false,
          bounds: {
            minX: el.x - r,
            maxX: el.x + r,
            minY: el.y - r,
            maxY: el.y + r,
          },
        })
      }
    } else if (el.type === "pcb_via") {
      for (const layer of ["top", "bottom"] as const) {
        if (!Array.isArray(el.layers) || !el.layers.includes(layer)) continue
        const isTented =
          (layer === "top" ? el.tented_on_top : el.tented_on_bottom) ??
          el.is_tented
        if (isTented === true) continue
        const r = (el.outer_diameter ?? 0) / 2
        if (r <= 0) continue
        obstacles.push({
          id: `${el.pcb_via_id ?? "via"}_${layer}`,
          layer,
          kind: "circle",
          x: el.x,
          y: el.y,
          radius: r,
          hasExplicitMargin: false,
          bounds: {
            minX: el.x - r,
            maxX: el.x + r,
            minY: el.y - r,
            maxY: el.y + r,
          },
        })
      }
    }
  }

  const errors: any[] = []

  for (const el of circuitJson) {
    if (el.type === "pcb_silkscreen_path" && Array.isArray(el.route)) {
      const layer = el.layer ?? "top"
      const halfStroke = (el.stroke_width ?? 0.1) / 2
      const silkId = el.pcb_silkscreen_path_id ?? "silkscreen_path"

      for (const obs of obstacles) {
        if (obs.layer !== layer) continue
        let minDist = Infinity
        for (let i = 1; i < el.route.length; i++) {
          const p1 = el.route[i - 1]
          const p2 = el.route[i]
          const d = distanceSegmentToBox(p1, p2, obs.bounds) - halfStroke
          if (d < minDist) minDist = d
        }
        if (minDist <= minClearance + 1e-6) {
          errors.push({
            type: "pcb_footprint_overlap_error",
            pcb_error_id: `pcb_silkscreen_overlap_${silkId}_${obs.id}`,
            error_type: "pcb_footprint_overlap_error",
            pcb_component_ids: [el.pcb_component_id, obs.pcb_component_id].filter(
              Boolean,
            ),
            pcb_smtpad_ids: obs.id.startsWith("pcb_smtpad") ? [obs.id] : [],
            message: `Silkscreen path ${silkId} on ${layer} overlaps pad/opening ${obs.id}`,
          })
          break
        }
      }
    } else if (el.type === "pcb_silkscreen_text") {
      const layer = el.layer ?? "top"
      const silkId = el.pcb_silkscreen_text_id ?? `silkscreen_text_${el.text}`
      const textBounds = getSilkscreenTextBounds(el)

      for (const obs of obstacles) {
        if (obs.layer !== layer) continue
        const gapX = Math.max(
          0,
          textBounds.minX - obs.bounds.maxX,
          obs.bounds.minX - textBounds.maxX,
        )
        const gapY = Math.max(
          0,
          textBounds.minY - obs.bounds.maxY,
          obs.bounds.minY - textBounds.maxY,
        )
        const dist = Math.hypot(gapX, gapY)
        if (dist <= minClearance + 1e-6 && gapX === 0 && gapY === 0) {
          errors.push({
            type: "pcb_footprint_overlap_error",
            pcb_error_id: `pcb_silkscreen_overlap_${silkId}_${obs.id}`,
            error_type: "pcb_footprint_overlap_error",
            pcb_component_ids: [el.pcb_component_id, obs.pcb_component_id].filter(
              Boolean,
            ),
            pcb_smtpad_ids: obs.id.startsWith("pcb_smtpad") ? [obs.id] : [],
            message: `Silkscreen text "${el.text}" (${silkId}) on ${layer} overlaps pad/opening ${obs.id}`,
          })
          break
        }
      }
    } else if (el.type === "pcb_silkscreen_line") {
      const layer = el.layer ?? "top"
      const halfStroke = (el.stroke_width ?? 0.1) / 2
      const silkId = el.pcb_silkscreen_line_id ?? "silkscreen_line"
      const p1 = { x: el.x1, y: el.y1 }
      const p2 = { x: el.x2, y: el.y2 }

      for (const obs of obstacles) {
        if (obs.layer !== layer) continue
        const d = distanceSegmentToBox(p1, p2, obs.bounds) - halfStroke
        if (d <= minClearance + 1e-6) {
          errors.push({
            type: "pcb_footprint_overlap_error",
            pcb_error_id: `pcb_silkscreen_overlap_${silkId}_${obs.id}`,
            error_type: "pcb_footprint_overlap_error",
            pcb_component_ids: [el.pcb_component_id, obs.pcb_component_id].filter(
              Boolean,
            ),
            pcb_smtpad_ids: obs.id.startsWith("pcb_smtpad") ? [obs.id] : [],
            message: `Silkscreen line ${silkId} on ${layer} overlaps pad/opening ${obs.id}`,
          })
          break
        }
      }
    } else if (
      el.type === "pcb_silkscreen_rect" ||
      el.type === "pcb_silkscreen_circle"
    ) {
      const layer = el.layer ?? "top"
      const halfStroke = (el.stroke_width ?? 0.1) / 2
      const silkId =
        el.pcb_silkscreen_rect_id ??
        el.pcb_silkscreen_circle_id ??
        "silkscreen_shape"
      const w =
        el.type === "pcb_silkscreen_circle"
          ? (el.radius ?? 0) * 2
          : (el.width ?? 0)
      const h =
        el.type === "pcb_silkscreen_circle"
          ? (el.radius ?? 0) * 2
          : (el.height ?? 0)
      const cx = el.center?.x ?? 0
      const cy = el.center?.y ?? 0
      const shapeBounds: Box2D = {
        minX: cx - w / 2 - halfStroke,
        maxX: cx + w / 2 + halfStroke,
        minY: cy - h / 2 - halfStroke,
        maxY: cy + h / 2 + halfStroke,
      }

      for (const obs of obstacles) {
        if (obs.layer !== layer) continue
        const gapX = Math.max(
          0,
          shapeBounds.minX - obs.bounds.maxX,
          obs.bounds.minX - shapeBounds.maxX,
        )
        const gapY = Math.max(
          0,
          shapeBounds.minY - obs.bounds.maxY,
          obs.bounds.minY - shapeBounds.maxY,
        )
        if (gapX === 0 && gapY === 0) {
          errors.push({
            type: "pcb_footprint_overlap_error",
            pcb_error_id: `pcb_silkscreen_overlap_${silkId}_${obs.id}`,
            error_type: "pcb_footprint_overlap_error",
            pcb_component_ids: [el.pcb_component_id, obs.pcb_component_id].filter(
              Boolean,
            ),
            pcb_smtpad_ids: obs.id.startsWith("pcb_smtpad") ? [obs.id] : [],
            message: `Silkscreen shape ${silkId} on ${layer} overlaps pad/opening ${obs.id}`,
          })
          break
        }
      }
    }
  }

  return errors
}

// ============================================================================
// 7. Gerber X2 export with ViaDrill/ComponentDrill, AperFunction & Obround Pill Flash
// ============================================================================

function formatGerberCoord(mm: number): string {
  const um = Math.round(mm * 1e6)
  const absStr = Math.abs(um).toString().padStart(9, "0")
  return um < 0 ? `-${absStr.slice(1).padStart(8, "0")}` : absStr
}

interface GerberApertureDef {
  apertureNumber: number
  code: "C" | "R" | "O"
  diameter?: number
  xSize?: number
  ySize?: number
  aperFunction?: string
}

export interface ConvertToGerberOptions {
  flip_y_axis?: boolean
}

function getLayerCount(circuitJson: any[]): number {
  const board = getPcbBoard(circuitJson)
  return Math.max(2, Math.min(10, Number(board?.num_layers ?? 2)))
}

function getGerberLayerName(
  layerRef: string,
  layerType: "copper" | "soldermask" | "paste" | "silkscreen",
): string {
  if (layerRef === "edgecut") return "Edge_Cuts"
  if (layerRef.startsWith("inner")) {
    return `In${layerRef.slice("inner".length)}_Cu`
  }
  const prefix = layerRef === "top" ? "F_" : "B_"
  const suffixMap = {
    copper: "Cu",
    soldermask: "Mask",
    paste: "Paste",
    silkscreen: "SilkScreen",
  }
  return `${prefix}${suffixMap[layerType]}`
}

function getCopperLayerNumber(layer: string, totalLayerCount: number): number {
  if (layer === "top") return 1
  if (layer === "bottom") return totalLayerCount
  return Number(layer.replace("inner", "")) + 1
}

function buildGerberHeaderLines(opts: {
  layer: string
  layerType?: "copper" | "soldermask" | "paste" | "silkscreen"
  totalLayerCount: number
}): string[] {
  const now = new Date().toISOString()
  let fileFunction = "Profile,NP"
  if (opts.layerType === "copper" && opts.layer !== "edgecut") {
    const layerNum = getCopperLayerNumber(opts.layer, opts.totalLayerCount)
    const pos =
      opts.layer === "top" ? "Top" : opts.layer === "bottom" ? "Bot" : "Inr"
    fileFunction = `Copper,L${layerNum},${pos}`
  } else if (opts.layerType === "soldermask") {
    fileFunction = `Soldermask,${opts.layer === "top" ? "Top" : "Bot"}`
  } else if (opts.layerType === "paste") {
    fileFunction = `Paste,${opts.layer === "top" ? "Top" : "Bot"}`
  } else if (opts.layerType === "silkscreen") {
    fileFunction = `Legend,${opts.layer === "top" ? "Top" : "Bot"}`
  }

  const lines = [
    `%TF.GenerationSoftware,tscircuit,circuit-json-to-gerber,0.0.112*%`,
    `%TF.CreationDate,${now}*%`,
    `%TF.SameCoordinates,Original*%`,
    `%TF.FileFunction,${fileFunction}*%`,
  ]
  if (opts.layer !== "edgecut") {
    lines.push(
      `%TF.FilePolarity,${opts.layerType === "soldermask" ? "Negative" : "Positive"}*%`,
    )
  }
  lines.push(
    `%FSLAX46Y46*%`,
    `%MOMM*%`,
    `G04 Gerber Fmt 4.6, Leading zero omitted, Abs format (unit mm)*`,
    `G04 Created by tscircuit (builder) date ${now}*`,
    `G01*`,
    `%LPD*%`,
    `G75*`,
  )
  return lines
}

function formatApertureDef(ap: GerberApertureDef): string[] {
  const lines: string[] = []
  if (ap.aperFunction) {
    lines.push(`%TA.AperFunction,${ap.aperFunction}*%`)
  }
  if (ap.code === "C") {
    lines.push(`%ADD${ap.apertureNumber}C,${(ap.diameter ?? 0).toFixed(6)}*%`)
  } else if (ap.code === "R" || ap.code === "O") {
    lines.push(
      `%ADD${ap.apertureNumber}${ap.code},${(ap.xSize ?? 0).toFixed(6)}X${(ap.ySize ?? 0).toFixed(6)}*%`,
    )
  }
  if (ap.aperFunction) {
    lines.push(`%TD*%`)
  }
  return lines
}

export function convertCircuitJsonToGerberFiles(
  circuitJson: any[],
  options: ConvertToGerberOptions = {},
): Record<string, string> {
  const flipY = options.flip_y_axis ?? false
  const mfy = (y: number) => (flipY ? -y : y)
  const layerCount = getLayerCount(circuitJson)
  const innerLayers = Array.from(
    { length: Math.max(0, layerCount - 2) },
    (_, i) => `inner${i + 1}`,
  )
  const copperLayers = ["top", ...innerLayers, "bottom"]
  const compNames = getComponentNameMap(circuitJson)
  const { portNetMap, traceNetMap, connKeyNetMap } = getNetNameMaps(circuitJson)

  const files: Record<string, string> = {}

  const buildLayerFile = (
    layerRef: string,
    layerType: "copper" | "soldermask" | "paste" | "silkscreen",
  ): string => {
    const headerLines = buildGerberHeaderLines({
      layer: layerRef,
      layerType,
      totalLayerCount: layerCount,
    })
    const apertures: GerberApertureDef[] = []
    const bodyLines: string[] = []
    let nextApertureNum = 10

    const getOrCreateAperture = (
      spec: Omit<GerberApertureDef, "apertureNumber">,
    ): number => {
      const existing = apertures.find(
        (a) =>
          a.code === spec.code &&
          a.aperFunction === spec.aperFunction &&
          Math.abs((a.diameter ?? 0) - (spec.diameter ?? 0)) < 1e-6 &&
          Math.abs((a.xSize ?? 0) - (spec.xSize ?? 0)) < 1e-6 &&
          Math.abs((a.ySize ?? 0) - (spec.ySize ?? 0)) < 1e-6,
      )
      if (existing) return existing.apertureNumber
      const ap: GerberApertureDef = {
        ...spec,
        apertureNumber: nextApertureNum++,
      }
      apertures.push(ap)
      return ap.apertureNumber
    }

    const emitObjectAttrs = (compId?: string, netName?: string) => {
      const cName = compId ? compNames.get(compId) : undefined
      if (cName) {
        bodyLines.push(`%TO.C,${cName}*%`)
      }
      if (netName) {
        bodyLines.push(`%TO.N,${netName}*%`)
      }
    }

    const clearObjectAttrs = (compId?: string, netName?: string) => {
      if ((compId && compNames.get(compId)) || netName) {
        bodyLines.push(`%TD*%`)
      }
    }

    if (layerType === "copper" || layerType === "soldermask") {
      const isMask = layerType === "soldermask"

      // 1. SMT pads
      for (const el of circuitJson) {
        if (el.type !== "pcb_smtpad" || el.layer !== layerRef) continue
        if (isMask && el.is_covered_with_solder_mask === true) continue
        const margin =
          isMask && typeof el.soldermask_margin === "number"
            ? el.soldermask_margin
            : 0
        const aperFunction = isMask ? undefined : "SMDPad,CuDef"
        const netName = !isMask && el.pcb_port_id ? portNetMap.get(el.pcb_port_id) : undefined

        if (el.shape === "circle") {
          const d = (el.radius ?? 0) * 2 + margin * 2
          const dCode = getOrCreateAperture({
            code: "C",
            diameter: d,
            aperFunction,
          })
          if (!isMask) emitObjectAttrs(el.pcb_component_id, netName)
          bodyLines.push(`D${dCode}*`)
          bodyLines.push(
            `X${formatGerberCoord(el.x)}Y${formatGerberCoord(mfy(el.y))}D03*`,
          )
          if (!isMask) clearObjectAttrs(el.pcb_component_id, netName)
        } else if (el.shape === "pill" || el.shape === "rotated_pill") {
          let w = (el.width ?? 0) + margin * 2
          let h = (el.height ?? 0) + margin * 2
          let rot =
            el.shape === "rotated_pill" && typeof el.ccw_rotation === "number"
              ? ((el.ccw_rotation % 360) + 360) % 360
              : 0
          if (Math.abs(rot - 90) < 1e-4 || Math.abs(rot - 270) < 1e-4) {
            ;[w, h] = [h, w]
            rot = 0
          } else if (Math.abs(rot - 180) < 1e-4) {
            rot = 0
          }
          const dCode = getOrCreateAperture({
            code: "O",
            xSize: w,
            ySize: h,
            aperFunction,
          })
          if (!isMask) emitObjectAttrs(el.pcb_component_id, netName)
          bodyLines.push(`D${dCode}*`)
          if (rot !== 0) bodyLines.push(`%LR${rot}*%`)
          bodyLines.push(
            `X${formatGerberCoord(el.x)}Y${formatGerberCoord(mfy(el.y))}D03*`,
          )
          if (rot !== 0) bodyLines.push(`%LR0*%`)
          if (!isMask) clearObjectAttrs(el.pcb_component_id, netName)
        } else if (el.shape !== "polygon") {
          let w = (el.width ?? 0) + margin * 2
          let h = (el.height ?? 0) + margin * 2
          let rot =
            el.shape === "rotated_rect" && typeof el.ccw_rotation === "number"
              ? ((el.ccw_rotation % 360) + 360) % 360
              : 0
          if (Math.abs(rot - 90) < 1e-4 || Math.abs(rot - 270) < 1e-4) {
            ;[w, h] = [h, w]
            rot = 0
          } else if (Math.abs(rot - 180) < 1e-4) {
            rot = 0
          }
          const dCode = getOrCreateAperture({
            code: "R",
            xSize: w,
            ySize: h,
            aperFunction,
          })
          if (!isMask) emitObjectAttrs(el.pcb_component_id, netName)
          bodyLines.push(`D${dCode}*`)
          if (rot !== 0) bodyLines.push(`%LR${rot}*%`)
          bodyLines.push(
            `X${formatGerberCoord(el.x)}Y${formatGerberCoord(mfy(el.y))}D03*`,
          )
          if (rot !== 0) bodyLines.push(`%LR0*%`)
          if (!isMask) clearObjectAttrs(el.pcb_component_id, netName)
        }
      }

      // 2. Plated holes
      for (const el of circuitJson) {
        if (
          el.type !== "pcb_plated_hole" ||
          !Array.isArray(el.layers) ||
          !el.layers.includes(layerRef)
        ) {
          continue
        }
        if (isMask && el.is_covered_with_solder_mask === true) continue
        const margin =
          isMask && typeof el.soldermask_margin === "number"
            ? el.soldermask_margin
            : 0
        const aperFunction = isMask ? undefined : "ComponentPad"
        const netName =
          !isMask && el.pcb_port_id ? portNetMap.get(el.pcb_port_id) : undefined

        if (el.shape === "circle") {
          const d = (el.outer_diameter ?? el.hole_diameter ?? 0) + margin * 2
          const dCode = getOrCreateAperture({
            code: "C",
            diameter: d,
            aperFunction,
          })
          if (!isMask) emitObjectAttrs(el.pcb_component_id, netName)
          bodyLines.push(`D${dCode}*`)
          bodyLines.push(
            `X${formatGerberCoord(el.x)}Y${formatGerberCoord(mfy(el.y))}D03*`,
          )
          if (!isMask) clearObjectAttrs(el.pcb_component_id, netName)
        } else if (el.shape === "pill" || el.shape === "oval") {
          let w = (el.outer_width ?? el.hole_width ?? 0) + margin * 2
          let h = (el.outer_height ?? el.hole_height ?? 0) + margin * 2
          let rot =
            typeof el.ccw_rotation === "number"
              ? ((el.ccw_rotation % 360) + 360) % 360
              : 0
          if (Math.abs(rot - 90) < 1e-4 || Math.abs(rot - 270) < 1e-4) {
            ;[w, h] = [h, w]
            rot = 0
          } else if (Math.abs(rot - 180) < 1e-4) {
            rot = 0
          }
          const dCode = getOrCreateAperture({
            code: "O",
            xSize: w,
            ySize: h,
            aperFunction,
          })
          if (!isMask) emitObjectAttrs(el.pcb_component_id, netName)
          bodyLines.push(`D${dCode}*`)
          if (rot !== 0) bodyLines.push(`%LR${rot}*%`)
          bodyLines.push(
            `X${formatGerberCoord(el.x)}Y${formatGerberCoord(mfy(el.y))}D03*`,
          )
          if (rot !== 0) bodyLines.push(`%LR0*%`)
          if (!isMask) clearObjectAttrs(el.pcb_component_id, netName)
        } else {
          let w = (el.rect_pad_width ?? el.outer_width ?? 0) + margin * 2
          let h = (el.rect_pad_height ?? el.outer_height ?? 0) + margin * 2
          let rot =
            typeof el.rect_ccw_rotation === "number"
              ? ((el.rect_ccw_rotation % 360) + 360) % 360
              : 0
          if (Math.abs(rot - 90) < 1e-4 || Math.abs(rot - 270) < 1e-4) {
            ;[w, h] = [h, w]
            rot = 0
          } else if (Math.abs(rot - 180) < 1e-4) {
            rot = 0
          }
          const dCode = getOrCreateAperture({
            code: "R",
            xSize: w,
            ySize: h,
            aperFunction,
          })
          if (!isMask) emitObjectAttrs(el.pcb_component_id, netName)
          bodyLines.push(`D${dCode}*`)
          if (rot !== 0) bodyLines.push(`%LR${rot}*%`)
          bodyLines.push(
            `X${formatGerberCoord(el.x)}Y${formatGerberCoord(mfy(el.y))}D03*`,
          )
          if (rot !== 0) bodyLines.push(`%LR0*%`)
          if (!isMask) clearObjectAttrs(el.pcb_component_id, netName)
        }
      }

      // 3. Vias
      for (const el of circuitJson) {
        if (
          el.type !== "pcb_via" ||
          !Array.isArray(el.layers) ||
          !el.layers.includes(layerRef)
        ) {
          continue
        }
        if (isMask) {
          const isTented =
            (layerRef === "top" ? el.tented_on_top : el.tented_on_bottom) ??
            el.is_tented
          if (isTented !== false) continue
        }
        const aperFunction = isMask ? undefined : "ViaPad"
        const netName = !isMask
          ? (el.pcb_trace_id && traceNetMap.get(el.pcb_trace_id)) ||
            (el.subcircuit_connectivity_map_key &&
              connKeyNetMap.get(el.subcircuit_connectivity_map_key))
          : undefined
        const dCode = getOrCreateAperture({
          code: "C",
          diameter: el.outer_diameter ?? 0.6,
          aperFunction,
        })
        if (!isMask && netName) emitObjectAttrs(undefined, netName)
        bodyLines.push(`D${dCode}*`)
        bodyLines.push(
          `X${formatGerberCoord(el.x)}Y${formatGerberCoord(mfy(el.y))}D03*`,
        )
        if (!isMask && netName) clearObjectAttrs(undefined, netName)
      }

      // 4. Traces on copper layers
      if (!isMask) {
        let emittedConductor = false
        for (const el of circuitJson) {
          if (el.type !== "pcb_trace" || !Array.isArray(el.route)) continue
          const netName =
            (el.pcb_trace_id && traceNetMap.get(el.pcb_trace_id)) || undefined
          for (let i = 1; i < el.route.length; i++) {
            const a = el.route[i - 1]
            const b = el.route[i]
            const isSegmentOnLayer =
              (a.route_type === "wire" &&
                a.layer === layerRef &&
                (b.route_type === "wire" || b.route_type === "via")) ||
              (a.route_type === "via" &&
                b.route_type === "wire" &&
                b.layer === layerRef)
            if (!isSegmentOnLayer) continue
            if (Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9) {
              continue
            }
            const width =
              a.route_type === "wire"
                ? (a.width ?? 0.15)
                : (b.width ?? 0.15)
            const dCode = getOrCreateAperture({
              code: "C",
              diameter: width,
              aperFunction: "Conductor",
            })
            emittedConductor = true
            if (netName) emitObjectAttrs(undefined, netName)
            bodyLines.push(`D${dCode}*`)
            bodyLines.push(
              `X${formatGerberCoord(a.x)}Y${formatGerberCoord(mfy(a.y))}D02*`,
            )
            bodyLines.push(
              `X${formatGerberCoord(b.x)}Y${formatGerberCoord(mfy(b.y))}D01*`,
            )
            if (netName) clearObjectAttrs(undefined, netName)
          }
        }

        // Also handle pcb_via with source_trace_id when not yet materialized as pcb_trace
        if (!emittedConductor) {
          const board = getPcbBoard(circuitJson)
          const traceWidth = board?.min_trace_width ?? 0.15
          for (const via of circuitJson) {
            if (
              via.type !== "pcb_via" ||
              !via.source_trace_id ||
              !Array.isArray(via.layers) ||
              !via.layers.includes(layerRef)
            ) {
              continue
            }
            const st = circuitJson.find(
              (e) =>
                e.type === "source_trace" &&
                e.source_trace_id === via.source_trace_id,
            )
            if (!st || !Array.isArray(st.connected_source_port_ids)) continue
            for (const spId of st.connected_source_port_ids) {
              const pcbPort = circuitJson.find(
                (e) =>
                  e.type === "pcb_port" &&
                  e.source_port_id === spId &&
                  Array.isArray(e.layers) &&
                  e.layers.includes(layerRef),
              )
              if (!pcbPort) continue
              if (
                Math.abs(pcbPort.x - via.x) < 1e-9 &&
                Math.abs(pcbPort.y - via.y) < 1e-9
              ) {
                continue
              }
              const dCode = getOrCreateAperture({
                code: "C",
                diameter: traceWidth,
                aperFunction: "Conductor",
              })
              const netName = st.display_name || st.source_trace_id
              if (netName) emitObjectAttrs(undefined, netName)
              bodyLines.push(`D${dCode}*`)
              bodyLines.push(
                `X${formatGerberCoord(pcbPort.x)}Y${formatGerberCoord(mfy(pcbPort.y))}D02*`,
              )
              bodyLines.push(
                `X${formatGerberCoord(via.x)}Y${formatGerberCoord(mfy(via.y))}D01*`,
              )
              if (netName) clearObjectAttrs(undefined, netName)
            }
          }
        }
      }
    } else if (layerType === "paste") {
      for (const el of circuitJson) {
        if (el.type !== "pcb_solder_paste" || el.layer !== layerRef) continue
        if (el.shape === "circle") {
          const dCode = getOrCreateAperture({
            code: "C",
            diameter: (el.radius ?? 0) * 2,
          })
          bodyLines.push(`D${dCode}*`)
          bodyLines.push(
            `X${formatGerberCoord(el.x)}Y${formatGerberCoord(mfy(el.y))}D03*`,
          )
        } else if (el.shape === "pill" || el.shape === "rotated_pill") {
          const dCode = getOrCreateAperture({
            code: "O",
            xSize: el.width ?? 0,
            ySize: el.height ?? 0,
          })
          bodyLines.push(`D${dCode}*`)
          bodyLines.push(
            `X${formatGerberCoord(el.x)}Y${formatGerberCoord(mfy(el.y))}D03*`,
          )
        } else if (el.shape !== "polygon") {
          const dCode = getOrCreateAperture({
            code: "R",
            xSize: el.width ?? 0,
            ySize: el.height ?? 0,
          })
          bodyLines.push(`D${dCode}*`)
          bodyLines.push(
            `X${formatGerberCoord(el.x)}Y${formatGerberCoord(mfy(el.y))}D03*`,
          )
        }
      }
    } else if (layerType === "silkscreen") {
      for (const el of circuitJson) {
        if (
          el.type === "pcb_silkscreen_path" &&
          el.layer === layerRef &&
          Array.isArray(el.route) &&
          el.route.length >= 2
        ) {
          const dCode = getOrCreateAperture({
            code: "C",
            diameter: el.stroke_width ?? 0.1,
          })
          bodyLines.push(`D${dCode}*`)
          bodyLines.push(
            `X${formatGerberCoord(el.route[0].x)}Y${formatGerberCoord(mfy(el.route[0].y))}D02*`,
          )
          for (let i = 1; i < el.route.length; i++) {
            bodyLines.push(
              `X${formatGerberCoord(el.route[i].x)}Y${formatGerberCoord(mfy(el.route[i].y))}D01*`,
            )
          }
        }
      }
    }

    const apertureLines = apertures.flatMap(formatApertureDef)
    return [...headerLines, ...apertureLines, ...bodyLines, "M02*"].join("\n")
  }

  for (const copperLayer of copperLayers) {
    const gerberName = getGerberLayerName(copperLayer, "copper")
    files[`${gerberName}.gbr`] = buildLayerFile(copperLayer, "copper")
  }
  for (const outerLayer of ["top", "bottom"] as const) {
    files[`${getGerberLayerName(outerLayer, "soldermask")}.gbr`] =
      buildLayerFile(outerLayer, "soldermask")
    files[`${getGerberLayerName(outerLayer, "paste")}.gbr`] = buildLayerFile(
      outerLayer,
      "paste",
    )
    files[`${getGerberLayerName(outerLayer, "silkscreen")}.gbr`] =
      buildLayerFile(outerLayer, "silkscreen")
  }

  // Edge_Cuts
  const edgeHeader = buildGerberHeaderLines({
    layer: "edgecut",
    totalLayerCount: layerCount,
  })
  const edgeLines: string[] = [`%ADD10C,0.050000*%`]
  const board = getPcbBoard(circuitJson)
  if (board) {
    edgeLines.push(`D10*`)
    if (Array.isArray(board.outline) && board.outline.length > 2) {
      const first = board.outline[0]
      edgeLines.push(
        `X${formatGerberCoord(first.x)}Y${formatGerberCoord(mfy(first.y))}D02*`,
      )
      for (let i = 1; i < board.outline.length; i++) {
        const pt = board.outline[i]
        edgeLines.push(
          `X${formatGerberCoord(pt.x)}Y${formatGerberCoord(mfy(pt.y))}D01*`,
        )
      }
      edgeLines.push(
        `X${formatGerberCoord(first.x)}Y${formatGerberCoord(mfy(first.y))}D01*`,
      )
    } else if (board.center && board.width && board.height) {
      const minX = board.center.x - board.width / 2
      const maxX = board.center.x + board.width / 2
      const minY = board.center.y - board.height / 2
      const maxY = board.center.y + board.height / 2
      edgeLines.push(
        `X${formatGerberCoord(minX)}Y${formatGerberCoord(mfy(minY))}D02*`,
        `X${formatGerberCoord(maxX)}Y${formatGerberCoord(mfy(minY))}D01*`,
        `X${formatGerberCoord(maxX)}Y${formatGerberCoord(mfy(maxY))}D01*`,
        `X${formatGerberCoord(minX)}Y${formatGerberCoord(mfy(maxY))}D01*`,
        `X${formatGerberCoord(minX)}Y${formatGerberCoord(mfy(minY))}D01*`,
      )
    }
  }
  edgeLines.push("M02*")
  files["Edge_Cuts.gbr"] = [...edgeHeader, ...edgeLines].join("\n")

  // Drill file(s): group plated tools by (diameter, isVia) so pcb_via gets ViaDrill and pcb_plated_hole gets ComponentDrill
  interface DrillItem {
    x: number
    y: number
    diameter: number
    isVia: boolean
    slotEnd?: { x: number; y: number }
  }
  const platedDrills: DrillItem[] = []
  for (const el of circuitJson) {
    if (el.type === "pcb_plated_hole") {
      if (typeof el.hole_diameter === "number") {
        platedDrills.push({
          x: el.x + (el.hole_offset_x ?? 0),
          y: mfy(el.y + (el.hole_offset_y ?? 0)),
          diameter: el.hole_diameter,
          isVia: false,
        })
      } else if (
        typeof el.hole_width === "number" &&
        typeof el.hole_height === "number"
      ) {
        const w = el.hole_width
        const h = el.hole_height
        const minDim = Math.min(w, h)
        const maxDim = Math.max(w, h)
        const cx = el.x + (el.hole_offset_x ?? 0)
        const cy = el.y + (el.hole_offset_y ?? 0)
        if (Math.abs(maxDim - minDim) <= 1e-6) {
          platedDrills.push({
            x: cx,
            y: mfy(cy),
            diameter: minDim,
            isVia: false,
          })
        } else {
          const rot =
            ((el.hole_ccw_rotation ?? el.ccw_rotation ?? 0) * Math.PI) / 180
          const halfSlot = (maxDim - minDim) / 2
          const rel =
            w >= h
              ? { sx: -halfSlot, sy: 0, ex: halfSlot, ey: 0 }
              : { sx: 0, sy: -halfSlot, ex: 0, ey: halfSlot }
          const sx = cx + rel.sx * Math.cos(rot) - rel.sy * Math.sin(rot)
          const sy = cy + rel.sx * Math.sin(rot) + rel.sy * Math.cos(rot)
          const ex = cx + rel.ex * Math.cos(rot) - rel.ey * Math.sin(rot)
          const ey = cy + rel.ex * Math.sin(rot) + rel.ey * Math.cos(rot)
          platedDrills.push({
            x: sx,
            y: mfy(sy),
            diameter: minDim,
            isVia: false,
            slotEnd: { x: ex, y: mfy(ey) },
          })
        }
      }
    } else if (el.type === "pcb_via") {
      if (typeof el.hole_diameter === "number") {
        platedDrills.push({
          x: el.x,
          y: mfy(el.y),
          diameter: el.hole_diameter,
          isVia: true,
        })
      }
    }
  }

  if (platedDrills.length > 0) {
    const now = new Date().toISOString()
    const drillLines: string[] = [
      "M48",
      `; DRILL file {tscircuit} date ${now}`,
      "; FORMAT={-:-/ absolute / metric / decimal}",
      `; #@! TF.CreationDate,${now}`,
      "; #@! TF.GenerationSoftware,tscircuit",
      `; #@! TF.FileFunction,Plated,1,${layerCount},PTH`,
      "FMAT,2",
      "METRIC",
    ]
    const tools = new Map<string, { toolNum: number; diameter: number; isVia: boolean; items: DrillItem[] }>()
    let toolNum = 10
    for (const item of platedDrills) {
      const key = `${item.isVia ? "via" : "comp"}:${item.diameter.toFixed(6)}`
      let entry = tools.get(key)
      if (!entry) {
        entry = {
          toolNum: toolNum++,
          diameter: item.diameter,
          isVia: item.isVia,
          items: [],
        }
        tools.set(key, entry)
        drillLines.push(
          item.isVia
            ? "; #@! TA.AperFunction,Plated,PTH,ViaDrill"
            : "; #@! TA.AperFunction,Plated,PTH,ComponentDrill",
        )
        drillLines.push(`T${entry.toolNum}C${entry.diameter.toFixed(6)}`)
      }
      entry.items.push(item)
    }
    drillLines.push("%", "G90", "G05")
    for (const entry of tools.values()) {
      drillLines.push(`T${entry.toolNum}`)
      for (const item of entry.items) {
        if (item.slotEnd) {
          drillLines.push(
            `X${item.x.toFixed(4)}Y${item.y.toFixed(4)}`,
            `G85X${item.slotEnd.x.toFixed(4)}Y${item.slotEnd.y.toFixed(4)}`,
          )
        } else {
          drillLines.push(`X${item.x.toFixed(4)}Y${item.y.toFixed(4)}`)
        }
      }
    }
    drillLines.push("M30")
    files[`drill-L1-L${layerCount}.drl`] = drillLines.join("\n")
  }

  return files
}

// ============================================================================
// 8. Runtime patches on @tscircuit/core (Trace via sizing & Board DRC checks)
//    and wrappers for @tscircuit/checks
// ============================================================================

let dfmPatchesApplied = false

export function applyDfmAndGerberFixes(): void {
  if (dfmPatchesApplied) return
  dfmPatchesApplied = true

  // 1. Fix pcbPath / pcbPaths via sizing to default to board min_via_hole_diameter / min_via_pad_diameter
  const origGetInheritedMergedProperty = (Trace.prototype as any)
    .getInheritedMergedProperty
  if (typeof origGetInheritedMergedProperty === "function") {
    ;(Trace.prototype as any).getInheritedMergedProperty = function (
      propName: string,
      ...rest: any[]
    ) {
      const base = origGetInheritedMergedProperty.call(this, propName, ...rest)
      if (propName !== "pcbStyle") return base

      const trace = this as any
      const db = trace.root?.db
      const boardComp = trace._getBoard?.()
      const pcbBoard =
        boardComp?.pcb_board_id && db
          ? db.pcb_board.get(boardComp.pcb_board_id)
          : db?.pcb_board?.list?.()?.[0]
      const subcircuitProps = trace.getSubcircuit?.()?._parsedProps

      const boardMinHole =
        pcbBoard?.min_via_hole_diameter ?? subcircuitProps?.minViaHoleDiameter
      const boardMinPad =
        pcbBoard?.min_via_pad_diameter ?? subcircuitProps?.minViaPadDiameter

      if (boardMinHole === undefined && boardMinPad === undefined) {
        return base
      }

      return {
        ...(base ?? {}),
        viaHoleDiameter: base?.viaHoleDiameter ?? boardMinHole,
        viaPadDiameter: base?.viaPadDiameter ?? boardMinPad,
      }
    }
  }

  const origDoInitialPcbManualTraceRender = (Trace.prototype as any)
    .doInitialPcbManualTraceRender
  if (typeof origDoInitialPcbManualTraceRender === "function") {
    ;(Trace.prototype as any).doInitialPcbManualTraceRender = function (
      ...args: any[]
    ) {
      const result = origDoInitialPcbManualTraceRender.apply(this, args)
      const trace = this as any
      const db = trace.root?.db
      if (!db) return result

      const pcbStyle = trace.getInheritedMergedProperty?.("pcbStyle")
      const boardComp = trace._getBoard?.()
      const pcbBoard =
        boardComp?.pcb_board_id
          ? db.pcb_board.get(boardComp.pcb_board_id)
          : db.pcb_board.list()?.[0]
      const holeDiameter =
        pcbStyle?.viaHoleDiameter ?? pcbBoard?.min_via_hole_diameter
      const padDiameter =
        pcbStyle?.viaPadDiameter ?? pcbBoard?.min_via_pad_diameter

      if (holeDiameter !== undefined || padDiameter !== undefined) {
        const traceIds = new Set<string>()
        if (trace.pcb_trace_id) traceIds.add(trace.pcb_trace_id)
        for (const t of db.pcb_trace.list()) {
          if (
            trace.source_trace_id &&
            t.source_trace_id === trace.source_trace_id
          ) {
            traceIds.add(t.pcb_trace_id)
          }
        }
        for (const v of db.pcb_via.list()) {
          if (v.pcb_trace_id && traceIds.has(v.pcb_trace_id)) {
            db.pcb_via.update(v.pcb_via_id, {
              hole_diameter: holeDiameter ?? v.hole_diameter,
              outer_diameter: padDiameter ?? v.outer_diameter,
            })
          }
        }
      }
      return result
    }
  }

  // Hook DFM checks into Board.prototype.updatePcbDesignRuleChecks
  const origUpdatePcbDesignRuleChecks = (Board.prototype as any)
    .updatePcbDesignRuleChecks
  if (typeof origUpdatePcbDesignRuleChecks === "function") {
    ;(Board.prototype as any).updatePcbDesignRuleChecks = function (
      ...args: any[]
    ) {
      const board = this as any
      const result = origUpdatePcbDesignRuleChecks.apply(this, args)
      const db = board.root?.db
      const drcChecksDisabled =
        board.root?.platform?.drcChecksDisabled ??
        board.getInheritedProperty?.("drcChecksDisabled")
      const pcbDisabled = board.root?.pcbDisabled

      if (!db || drcChecksDisabled || pcbDisabled) {
        return result
      }

      board._queueAsyncEffect?.("board:dfm-checks-5559", async () => {
        const circuitJson = db.toArray()
        const dfmFindings = [
          ...checkViaAnnularRing(circuitJson),
          ...checkMinTraceWidth(circuitJson),
          ...checkTraceAcuteAngles(circuitJson),
          ...checkSolderMaskBridge(circuitJson),
          ...checkSilkscreenOverPads(circuitJson),
        ]
        if (dfmFindings.length > 0) {
          db.insertAll(dfmFindings)
        }
      })

      return result
    }
  }
}

export async function runAllPlacementChecks(
  circuitJson: any[],
  options?: { consolidateOverlaps?: boolean },
): Promise<any[]> {
  const baseResults = await origRunAllPlacementChecks(circuitJson, options)
  return [
    ...baseResults,
    ...checkViaAnnularRing(circuitJson),
    ...checkSolderMaskBridge(circuitJson),
    ...checkSilkscreenOverPads(circuitJson),
  ]
}

export async function runAllRoutingChecks(circuitJson: any[]): Promise<any[]> {
  const baseResults = await origRunAllRoutingChecks(circuitJson)
  return [
    ...baseResults,
    ...checkViaAnnularRing(circuitJson),
    ...checkMinTraceWidth(circuitJson),
    ...checkTraceAcuteAngles(circuitJson),
  ]
}

export async function runAllChecks(circuitJson: any[]): Promise<any[]> {
  const baseResults = await origRunAllChecks(circuitJson)
  const extra = [
    ...checkViaAnnularRing(circuitJson),
    ...checkMinTraceWidth(circuitJson),
    ...checkTraceAcuteAngles(circuitJson),
    ...checkSolderMaskBridge(circuitJson),
    ...checkSilkscreenOverPads(circuitJson),
  ]
  const seenIds = new Set<string>()
  const merged: any[] = []
  for (const item of [...baseResults, ...extra]) {
    const id =
      item.pcb_trace_error_id ??
      item.pcb_trace_warning_id ??
      item.pcb_pad_pad_clearance_error_id ??
      item.pcb_error_id ??
      `${item.type}:${item.message}`
    if (seenIds.has(id)) continue
    seenIds.add(id)
    merged.push(item)
  }
  return merged
}

applyDfmAndGerberFixes()

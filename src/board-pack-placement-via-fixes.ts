import { Board, Group } from "@tscircuit/core"
import {
  checkViaPadClearance as origCheckViaPadClearance,
  runAllRoutingChecks as origRunAllRoutingChecks,
  runAllChecks as origRunAllChecks,
} from "@tscircuit/checks"
import {
  findBoundsAndCenter,
  transformPCBElements,
} from "@tscircuit/circuit-json-util"
import { distance } from "circuit-json"
import { translate } from "transformation-matrix"

function isRoutingDisabledForGroup(group: any): boolean {
  if (!group) return false
  if (group.root?.pcbRoutingDisabled) return true
  if (group.getInheritedProperty?.("routingDisabled")) return true
  if (group._parsedProps?.routingDisabled || group.props?.routingDisabled) {
    return true
  }
  return false
}

function isDescendantGroup(
  db: any,
  groupId: string | undefined,
  ancestorId: string | undefined,
): boolean {
  if (!groupId || !ancestorId) return false
  if (groupId === ancestorId) return true
  const group = db.source_group?.get?.(groupId)
  if (!group || !group.parent_source_group_id) return false
  return isDescendantGroup(db, group.parent_source_group_id, ancestorId)
}

interface Box2D {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

function getComponentFullBoundsInWorld(db: any, pcbComponentId: string): Box2D | null {
  const pcbComp = db.pcb_component.get(pcbComponentId)
  if (!pcbComp) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const expandRect = (cx: number, cy: number, w: number, h: number) => {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(w) || !Number.isFinite(h)) {
      return
    }
    minX = Math.min(minX, cx - w / 2)
    maxX = Math.max(maxX, cx + w / 2)
    minY = Math.min(minY, cy - h / 2)
    maxY = Math.max(maxY, cy + h / 2)
  }

  for (const sp of db.pcb_smtpad.list({ pcb_component_id: pcbComponentId })) {
    if (sp.shape === "circle") {
      const d = (sp.radius ?? 0) * 2
      expandRect(sp.x, sp.y, d, d)
    } else if (sp.shape === "polygon" && Array.isArray(sp.points)) {
      for (const pt of sp.points) {
        expandRect(pt.x, pt.y, 0, 0)
      }
    } else if (sp.shape === "rotated_rect" || sp.shape === "rotated_pill") {
      const rad = ((sp.ccw_rotation ?? 0) * Math.PI) / 180
      const w = Math.abs((sp.width ?? 0) * Math.cos(rad)) + Math.abs((sp.height ?? 0) * Math.sin(rad))
      const h = Math.abs((sp.width ?? 0) * Math.sin(rad)) + Math.abs((sp.height ?? 0) * Math.cos(rad))
      expandRect(sp.x, sp.y, w, h)
    } else {
      expandRect(sp.x, sp.y, sp.width ?? 0, sp.height ?? 0)
    }
  }

  for (const ph of db.pcb_plated_hole.list({ pcb_component_id: pcbComponentId })) {
    if (ph.shape === "circle") {
      const d = ph.outer_diameter ?? ph.hole_diameter ?? 0
      expandRect(ph.x, ph.y, d, d)
    } else if (ph.shape === "oval" || ph.shape === "pill") {
      expandRect(ph.x, ph.y, ph.outer_width ?? 0, ph.outer_height ?? 0)
    } else {
      expandRect(ph.x, ph.y, ph.rect_pad_width ?? 0, ph.rect_pad_height ?? 0)
    }
  }

  for (const rect of db.pcb_courtyard_rect.list()) {
    if (rect.pcb_component_id !== pcbComponentId) continue
    expandRect(rect.center.x, rect.center.y, rect.width, rect.height)
  }
  for (const poly of db.pcb_courtyard_polygon?.list?.() ?? []) {
    if (poly.pcb_component_id !== pcbComponentId) continue
    for (const pt of poly.points ?? []) {
      expandRect(pt.x, pt.y, 0, 0)
    }
  }
  for (const outline of db.pcb_courtyard_outline?.list?.() ?? []) {
    if (outline.pcb_component_id !== pcbComponentId) continue
    for (const pt of outline.outline ?? []) {
      expandRect(pt.x, pt.y, 0, 0)
    }
  }
  for (const circle of db.pcb_courtyard_circle?.list?.() ?? []) {
    if (circle.pcb_component_id !== pcbComponentId) continue
    expandRect(circle.center.x, circle.center.y, circle.radius * 2, circle.radius * 2)
  }

  if (!Number.isFinite(minX)) {
    if (pcbComp.center && pcbComp.width && pcbComp.height) {
      expandRect(pcbComp.center.x, pcbComp.center.y, pcbComp.width, pcbComp.height)
    } else {
      return null
    }
  }

  return { minX, maxX, minY, maxY }
}

function boxesHaveOverlapOrInsufficientClearance(
  a: Box2D,
  b: Box2D,
  minClearance: number,
): boolean {
  const gapX = Math.max(0, a.minX - b.maxX, b.minX - a.maxX)
  const gapY = Math.max(0, a.minY - b.maxY, b.minY - a.maxY)
  if (gapX === 0 && gapY === 0) {
    return true
  }
  return Math.hypot(gapX, gapY) + 1e-6 < minClearance
}

function translateComponentToCenter(
  db: any,
  pcbComponentId: string,
  targetWorldCenter: { x: number; y: number },
) {
  const pcbComp = db.pcb_component.get(pcbComponentId)
  if (!pcbComp?.center) return
  const dx = targetWorldCenter.x - pcbComp.center.x
  const dy = targetWorldCenter.y - pcbComp.center.y
  if (Math.abs(dx) > 1e-6 || Math.abs(dy) > 1e-6) {
    const related = db
      .toArray()
      .filter(
        (elm: any) =>
          "pcb_component_id" in elm && elm.pcb_component_id === pcbComponentId,
      )
    transformPCBElements(related, translate(dx, dy))
  }
  db.pcb_component.update(pcbComponentId, {
    position_mode: "packed",
  })
}

let patchesApplied = false

export function applyBoardPackPlacementViaFixes(): void {
  if (patchesApplied) return
  patchesApplied = true

  // 1. Fix routingDisabled ignored on async re-render
  const origShouldRouteAsync = (Group.prototype as any)._shouldRouteAsync
  if (typeof origShouldRouteAsync === "function") {
    ;(Group.prototype as any)._shouldRouteAsync = function (...args: any[]) {
      if (isRoutingDisabledForGroup(this)) return false
      return origShouldRouteAsync.apply(this, args)
    }
  }

  const origDoInitialPcbTraceRender = (Group.prototype as any).doInitialPcbTraceRender
  if (typeof origDoInitialPcbTraceRender === "function") {
    ;(Group.prototype as any).doInitialPcbTraceRender = function (...args: any[]) {
      if (isRoutingDisabledForGroup(this)) return
      return origDoInitialPcbTraceRender.apply(this, args)
    }
  }

  const origUpdatePcbTraceRender = (Group.prototype as any).updatePcbTraceRender
  if (typeof origUpdatePcbTraceRender === "function") {
    ;(Group.prototype as any).updatePcbTraceRender = function (...args: any[]) {
      if (isRoutingDisabledForGroup(this)) return
      return origUpdatePcbTraceRender.apply(this, args)
    }
  }

  const origStartAsyncAutorouting = (Group.prototype as any)._startAsyncAutorouting
  if (typeof origStartAsyncAutorouting === "function") {
    ;(Group.prototype as any)._startAsyncAutorouting = function (...args: any[]) {
      if (isRoutingDisabledForGroup(this)) return
      return origStartAsyncAutorouting.apply(this, args)
    }
  }

  // 2. Fix bounded pcbPack group ignoring external fixed parts & stacking unplaced ones
  const origDoInitialPcbLayoutPack =
    (Group.prototype as any)._doInitialPcbLayoutPack ??
    (Group.prototype as any).doInitialPcbLayoutPack
  if (typeof origDoInitialPcbLayoutPack === "function") {
    const wrappedDoInitialPcbLayoutPack = function (this: any, ...args: any[]) {
      const group = this as any
      const db = group.root?.db
      if (!db) {
        return origDoInitialPcbLayoutPack.apply(this, args)
      }

      const props = group._parsedProps ?? {}
      const groupTransform = group._computePcbGlobalTransformBeforeLayout?.() ?? {
        e: 0,
        f: 0,
      }
      const groupOrigin = {
        x: typeof groupTransform.e === "number" ? groupTransform.e : 0,
        y: typeof groupTransform.f === "number" ? groupTransform.f : 0,
      }

      const allPcbComponents = db.pcb_component.list()
      const inGroupComponentIds = new Set<string>()
      const staticInGroupIds = new Set<string>()

      for (const child of group.children ?? []) {
        if (child?._isNormalComponent && child?.isRelativelyPositioned?.() && child?.pcb_component_id) {
          staticInGroupIds.add(child.pcb_component_id)
        }
      }

      for (const pcbComp of allPcbComponents) {
        const sourceComp = pcbComp.source_component_id
          ? db.source_component.get(pcbComp.source_component_id)
          : null
        const sourceGroupId = sourceComp?.source_group_id
        if (isDescendantGroup(db, sourceGroupId, group.source_group_id)) {
          inGroupComponentIds.add(pcbComp.pcb_component_id)
        }
      }

      // Collect external fixed component obstacles in group's local coordinate frame
      // (since PackSolver2 solves in local space centered at (0,0) before applyPackOutput translates by groupOrigin)
      const tempHoleIds: string[] = []
      const tempCourtyardIds: string[] = []
      const externalWorldBoxes: Box2D[] = []

      for (const pcbComp of allPcbComponents) {
        const compId = pcbComp.pcb_component_id
        if (inGroupComponentIds.has(compId)) {
          // Ensure in-group component courtyards enclose all their pads during packing
          const fullBounds = getComponentFullBoundsInWorld(db, compId)
          const existingCourtyards = db.pcb_courtyard_rect
            .list()
            .filter((r: any) => r.pcb_component_id === compId)
          if (fullBounds && existingCourtyards.length > 0) {
            const tempRect = db.pcb_courtyard_rect.insert({
              pcb_component_id: compId,
              layer: pcbComp.layer ?? "top",
              center: {
                x: (fullBounds.minX + fullBounds.maxX) / 2,
                y: (fullBounds.minY + fullBounds.maxY) / 2,
              },
              width: fullBounds.maxX - fullBounds.minX,
              height: fullBounds.maxY - fullBounds.minY,
            })
            if (tempRect?.pcb_courtyard_rect_id) {
              tempCourtyardIds.push(tempRect.pcb_courtyard_rect_id)
            }
          }
          if (staticInGroupIds.has(compId) && fullBounds) {
            externalWorldBoxes.push(fullBounds)
            const localCx = (fullBounds.minX + fullBounds.maxX) / 2 - groupOrigin.x
            const localCy = (fullBounds.minY + fullBounds.maxY) / 2 - groupOrigin.y
            const tempHole = db.pcb_hole.insert({
              hole_shape: "rect",
              hole_width: fullBounds.maxX - fullBounds.minX,
              hole_height: fullBounds.maxY - fullBounds.minY,
              x: localCx,
              y: localCy,
            })
            if (tempHole?.pcb_hole_id) {
              tempHoleIds.push(tempHole.pcb_hole_id)
            }
          }
          continue
        }

        const fullBounds = getComponentFullBoundsInWorld(db, compId)
        if (!fullBounds) continue
        externalWorldBoxes.push(fullBounds)

        const localCx = (fullBounds.minX + fullBounds.maxX) / 2 - groupOrigin.x
        const localCy = (fullBounds.minY + fullBounds.maxY) / 2 - groupOrigin.y
        const tempHole = db.pcb_hole.insert({
          hole_shape: "rect",
          hole_width: fullBounds.maxX - fullBounds.minX,
          hole_height: fullBounds.maxY - fullBounds.minY,
          x: localCx,
          y: localCy,
        })
        if (tempHole?.pcb_hole_id) {
          tempHoleIds.push(tempHole.pcb_hole_id)
        }
      }

      const packingErrorsBefore = new Set(
        (db.pcb_packing_error?.list?.() ?? []).map(
          (e: any) => e.pcb_packing_error_id,
        ),
      )

      try {
        origDoInitialPcbLayoutPack.apply(this, args)
      } finally {
        for (const holeId of tempHoleIds) {
          db.pcb_hole.delete(holeId)
        }
        for (const courtyardId of tempCourtyardIds) {
          db.pcb_courtyard_rect.delete(courtyardId)
        }
      }

      const dynamicGroupCompIds = Array.from(inGroupComponentIds).filter(
        (id) => !staticInGroupIds.has(id),
      )
      if (dynamicGroupCompIds.length === 0) return

      const hasBounds = props.width !== undefined && props.height !== undefined
      const widthMm = hasBounds ? distance.parse(props.width) : undefined
      const heightMm = hasBounds ? distance.parse(props.height) : undefined
      const worldBounds: Box2D | null =
        widthMm !== undefined && heightMm !== undefined
          ? {
              minX: groupOrigin.x - widthMm / 2,
              maxX: groupOrigin.x + widthMm / 2,
              minY: groupOrigin.y - heightMm / 2,
              maxY: groupOrigin.y + heightMm / 2,
            }
          : null

      const newPackingErrors = (db.pcb_packing_error?.list?.() ?? []).filter(
        (e: any) => !packingErrorsBefore.has(e.pcb_packing_error_id),
      )

      // Check whether any dynamic component in the group overlaps an external obstacle,
      // another dynamic component, or lies outside worldBounds
      const checkPlacementValid = (clearanceMm: number): boolean => {
        const dynamicBoxes: Array<{ id: string; box: Box2D }> = []
        for (const compId of dynamicGroupCompIds) {
          const box = getComponentFullBoundsInWorld(db, compId)
          if (!box) continue
          if (worldBounds) {
            if (
              box.minX < worldBounds.minX - 1e-3 ||
              box.maxX > worldBounds.maxX + 1e-3 ||
              box.minY < worldBounds.minY - 1e-3 ||
              box.maxY > worldBounds.maxY + 1e-3
            ) {
              return false
            }
          }
          for (const extBox of externalWorldBoxes) {
            if (boxesHaveOverlapOrInsufficientClearance(box, extBox, clearanceMm)) {
              return false
            }
          }
          for (const prev of dynamicBoxes) {
            if (boxesHaveOverlapOrInsufficientClearance(box, prev.box, clearanceMm)) {
              return false
            }
          }
          dynamicBoxes.push({ id: compId, box })
        }
        return true
      }

      if (newPackingErrors.length === 0 && checkPlacementValid(0.15)) {
        return
      }

      // Try tighter obstacle-aware arrangement within worldBounds (or around groupOrigin)
      const compDimensions = dynamicGroupCompIds
        .map((compId) => {
          const pcbComp = db.pcb_component.get(compId)
          const box = getComponentFullBoundsInWorld(db, compId)
          if (!pcbComp || !box) return null
          const w = box.maxX - box.minX
          const h = box.maxY - box.minY
          const offsetX = (box.minX + box.maxX) / 2 - pcbComp.center.x
          const offsetY = (box.minY + box.maxY) / 2 - pcbComp.center.y
          return { compId, w, h, offsetX, offsetY }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)

      const tryPackWithGap = (gapMm: number): Map<string, { x: number; y: number }> | null => {
        if (!worldBounds) return null
        const placedBoxes: Box2D[] = [...externalWorldBoxes]
        const placements = new Map<string, { x: number; y: number }>()

        for (const item of compDimensions) {
          const minCx = worldBounds.minX + item.w / 2
          const maxCx = worldBounds.maxX - item.w / 2
          const minCy = worldBounds.minY + item.h / 2
          const maxCy = worldBounds.maxY - item.h / 2
          if (minCx > maxCx + 1e-6 || minCy > maxCy + 1e-6) {
            return null
          }

          let bestCenter: { x: number; y: number } | null = null
          let bestScore = Infinity
          const stepX = Math.max(0.2, Math.min(0.5, (maxCx - minCx) / 24 || 0.25))
          const stepY = Math.max(0.2, Math.min(0.5, (maxCy - minCy) / 16 || 0.25))

          const yCandidates: number[] = []
          for (let y = minCy; y <= maxCy + 1e-6; y += stepY) {
            yCandidates.push(Math.min(y, maxCy))
          }
          if (!yCandidates.some((y) => Math.abs(y - maxCy) < 1e-5)) {
            yCandidates.push(maxCy)
          }

          const xCandidates: number[] = []
          for (let x = minCx; x <= maxCx + 1e-6; x += stepX) {
            xCandidates.push(Math.min(x, maxCx))
          }
          if (!xCandidates.some((x) => Math.abs(x - maxCx) < 1e-5)) {
            xCandidates.push(maxCx)
          }

          for (const cy of yCandidates) {
            for (const cx of xCandidates) {
              const candidateBox: Box2D = {
                minX: cx - item.w / 2,
                maxX: cx + item.w / 2,
                minY: cy - item.h / 2,
                maxY: cy + item.h / 2,
              }
              const collides = placedBoxes.some((obs) =>
                boxesHaveOverlapOrInsufficientClearance(candidateBox, obs, gapMm),
              )
              if (collides) continue
              // Prefer compact packing ordered top-to-bottom, left-to-right near group center
              const score =
                (cy - worldBounds.minY) * 100 +
                (cx - worldBounds.minX) +
                Math.hypot(cx - groupOrigin.x, cy - groupOrigin.y) * 0.01
              if (score < bestScore) {
                bestScore = score
                bestCenter = {
                  x: cx - item.offsetX,
                  y: cy - item.offsetY,
                }
              }
            }
          }

          if (!bestCenter) {
            return null
          }

          const finalBoxCenter = {
            x: bestCenter.x + item.offsetX,
            y: bestCenter.y + item.offsetY,
          }
          placedBoxes.push({
            minX: finalBoxCenter.x - item.w / 2,
            maxX: finalBoxCenter.x + item.w / 2,
            minY: finalBoxCenter.y - item.h / 2,
            maxY: finalBoxCenter.y + item.h / 2,
          })
          placements.set(item.compId, bestCenter)
        }

        return placements
      }

      let solvedPlacements: Map<string, { x: number; y: number }> | null = null
      for (const candidateGap of [0.5, 0.35, 0.25, 0.15]) {
        solvedPlacements = tryPackWithGap(candidateGap)
        if (solvedPlacements) break
      }

      if (solvedPlacements) {
        for (const [compId, targetCenter] of solvedPlacements.entries()) {
          translateComponentToCenter(db, compId, targetCenter)
        }
        // Clear any packing errors emitted by the overly loose initial attempt
        for (const err of newPackingErrors) {
          if (err.pcb_packing_error_id) {
            db.pcb_packing_error.delete(err.pcb_packing_error_id)
          }
        }
        if (group.pcb_group_id) {
          const groupPcbComponents = db.pcb_component.list({
            pcb_group_id: group.pcb_group_id,
          })
          group.calculatePcbGroupBounds?.(findBoundsAndCenter(groupPcbComponents))
        }
        group.root?.emit("packing:end", {
          subcircuit_id: group.subcircuit_id,
          componentDisplayName: group.getString(),
        })
        return
      }

      // If bounds are genuinely too small even at minimum clearance, keep the pcb_packing_error
      // but unstack any overlapping/unplaced components so they do not pile up at (0, 0)
      const occupiedBoxes: Box2D[] = [...externalWorldBoxes]
      let overflowIndex = 0
      for (const item of compDimensions) {
        const currentBox = getComponentFullBoundsInWorld(db, item.compId)
        if (!currentBox) continue
        const overlapsExisting = occupiedBoxes.some((obs) =>
          boxesHaveOverlapOrInsufficientClearance(currentBox, obs, 0.15),
        )
        if (!overlapsExisting) {
          occupiedBoxes.push(currentBox)
          continue
        }
        // Place overflowing component in the nearest non-overlapping slot
        let placed = false
        const baseX = worldBounds ? worldBounds.minX + item.w / 2 : groupOrigin.x
        const baseY = worldBounds ? worldBounds.maxY + item.h / 2 + 0.5 : groupOrigin.y
        for (let row = 0; row < 20 && !placed; row++) {
          for (let col = 0; col < 20 && !placed; col++) {
            const cx = baseX + col * (item.w + 0.5)
            const cy = baseY + row * (item.h + 0.5)
            const candidateBox: Box2D = {
              minX: cx - item.w / 2,
              maxX: cx + item.w / 2,
              minY: cy - item.h / 2,
              maxY: cy + item.h / 2,
            }
            if (
              !occupiedBoxes.some((obs) =>
                boxesHaveOverlapOrInsufficientClearance(candidateBox, obs, 0.15),
              )
            ) {
              translateComponentToCenter(db, item.compId, {
                x: cx - item.offsetX,
                y: cy - item.offsetY,
              })
              occupiedBoxes.push(candidateBox)
              placed = true
              overflowIndex++
            }
          }
        }
      }
    }
    ;(Group.prototype as any)._doInitialPcbLayoutPack = wrappedDoInitialPcbLayoutPack
    ;(Group.prototype as any).doInitialPcbLayoutPack = wrappedDoInitialPcbLayoutPack
  }

  // 3. Fix pcb_board.center on outlined boards
  const origBoardPcbComponentRender = (Board.prototype as any).doInitialPcbComponentRender
  if (typeof origBoardPcbComponentRender === "function") {
    ;(Board.prototype as any).doInitialPcbComponentRender = function (...args: any[]) {
      const result = origBoardPcbComponentRender.apply(this, args)
      const board = this as any
      const db = board.root?.db
      const props = board._parsedProps ?? {}
      if (db && board.pcb_board_id && props.outline && Array.isArray(props.outline) && props.outline.length > 0) {
        const pcbBoard = db.pcb_board.get(board.pcb_board_id)
        if (
          pcbBoard?.outline &&
          pcbBoard.outline.length > 0 &&
          !board._hasUserDefinedPcbPosition?.() &&
          !props.boardAnchorPosition
        ) {
          const xs = pcbBoard.outline.map((p: { x: number; y: number }) => p.x)
          const ys = pcbBoard.outline.map((p: { x: number; y: number }) => p.y)
          const minX = Math.min(...xs)
          const maxX = Math.max(...xs)
          const minY = Math.min(...ys)
          const maxY = Math.max(...ys)
          if (
            Number.isFinite(minX) &&
            Number.isFinite(maxX) &&
            Number.isFinite(minY) &&
            Number.isFinite(maxY)
          ) {
            db.pcb_board.update(board.pcb_board_id, {
              center: {
                x: (minX + maxX) / 2,
                y: (minY + maxY) / 2,
              },
              width: maxX - minX,
              height: maxY - minY,
            })
          }
        }
      }
      return result
    }
  }

  // 4. Hook checkViaPadClearance fix into Board DRC checks
  const origUpdatePcbDesignRuleChecks = (Board.prototype as any).updatePcbDesignRuleChecks
  if (typeof origUpdatePcbDesignRuleChecks === "function") {
    ;(Board.prototype as any).updatePcbDesignRuleChecks = function (...args: any[]) {
      const board = this as any
      const result = origUpdatePcbDesignRuleChecks.apply(this, args)
      const db = board.root?.db
      const drcChecksDisabled =
        board.root?.platform?.drcChecksDisabled ??
        board.getInheritedProperty?.("drcChecksDisabled")
      const pcbDisabled = board.root?.pcbDisabled
      const routingDrcChecksDisabled =
        board.root?.platform?.routingDrcChecksDisabled ??
        board.getInheritedProperty?.("routingDrcChecksDisabled")

      if (!db || drcChecksDisabled || pcbDisabled || routingDrcChecksDisabled) {
        return result
      }

      board._queueAsyncEffect?.("board:via-pad-clearance-drc-fix", async () => {
        const circuitJson = db.toArray()
        const viaPadErrors = checkViaPadClearance(circuitJson)
        const existingIds = new Set(
          circuitJson
            .filter((el: any) => el.type === "pcb_pad_pad_clearance_error")
            .map((el: any) => el.pcb_pad_pad_clearance_error_id),
        )
        for (const err of viaPadErrors) {
          if (
            err.pcb_pad_pad_clearance_error_id &&
            existingIds.has(err.pcb_pad_pad_clearance_error_id)
          ) {
            db.pcb_pad_pad_clearance_error?.update?.(
              err.pcb_pad_pad_clearance_error_id,
              err,
            )
          } else {
            db.insertAll([err])
          }
        }
      })

      return result
    }
  }
}

export function checkViaPadClearance(
  circuitJson: any[],
  options: { connMap?: any; minClearance?: number } = {},
) {
  const board = circuitJson.find((el) => el.type === "pcb_board")
  const boardViaPadClearance =
    typeof board?.min_via_edge_to_pad_edge_clearance === "number" &&
    board.min_via_edge_to_pad_edge_clearance > 0
      ? board.min_via_edge_to_pad_edge_clearance
      : undefined
  const boardPadPadClearance =
    typeof board?.min_pad_edge_to_pad_edge_clearance === "number" &&
    board.min_pad_edge_to_pad_edge_clearance > 0
      ? board.min_pad_edge_to_pad_edge_clearance
      : undefined

  const resolvedClearance =
    options.minClearance ?? boardViaPadClearance ?? boardPadPadClearance ?? 0.1

  return origCheckViaPadClearance(circuitJson, {
    ...options,
    minClearance: resolvedClearance,
  })
}

export async function runAllRoutingChecks(circuitJson: any[]) {
  const baseResults = await origRunAllRoutingChecks(circuitJson)
  const withoutOldViaPad = baseResults.filter(
    (err: any) =>
      !(
        err.type === "pcb_pad_pad_clearance_error" &&
        typeof err.pcb_pad_pad_clearance_error_id === "string" &&
        err.pcb_pad_pad_clearance_error_id.startsWith("via_pad_clearance_")
      ),
  )
  return [...withoutOldViaPad, ...checkViaPadClearance(circuitJson)]
}

export async function runAllChecks(circuitJson: any[]) {
  const baseResults = await origRunAllChecks(circuitJson)
  const withoutOldViaPad = baseResults.filter(
    (err: any) =>
      !(
        err.type === "pcb_pad_pad_clearance_error" &&
        typeof err.pcb_pad_pad_clearance_error_id === "string" &&
        err.pcb_pad_pad_clearance_error_id.startsWith("via_pad_clearance_")
      ),
  )
  return [...withoutOldViaPad, ...checkViaPadClearance(circuitJson)]
}

applyBoardPackPlacementViaFixes()

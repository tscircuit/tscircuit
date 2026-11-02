import {
  checkEachPcbTraceNonOverlapping as baseCheckEachPcbTraceNonOverlapping,
  checkPadPadClearance as baseCheckPadPadClearance,
  checkPadTraceClearance as baseCheckPadTraceClearance,
  checkPcbComponentOverlap as baseCheckPcbComponentOverlap,
  runAllPlacementChecks as baseRunAllPlacementChecks,
  runAllRoutingChecks as baseRunAllRoutingChecks,
} from "@tscircuit/checks"
import {
  Board,
  CourtyardRect,
  Footprint,
  Net,
  NormalComponent,
  Port,
  RootCircuit,
  SmtPad,
  Trace,
  createUseComponent,
} from "@tscircuit/core"
import { CircuitRunner } from "@tscircuit/eval"
import {
  type CommonComponentProps,
  type PinLabelsProp,
  commonComponentProps,
  pinLabelsProp,
} from "@tscircuit/props"
import { type AnyCircuitElement, distance } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import React from "react"
import { z } from "zod"

export type NetTieShape = "bridge" | "pad"

export interface NetTieProps extends Omit<CommonComponentProps, "name"> {
  name?: string
  /**
   * Two or more net names or selectors joined at this net tie
   * (e.g. `["net.AGND", "net.DGND"]` or `["AGND", "DGND", "PGND"]`).
   */
  nets?: string[]
  /**
   * Alias for `nets` (e.g. `connectsTo={["net.AGND", "net.DGND"]}`).
   */
  connectsTo?: string[]
  /**
   * Shorthand for pin 1 net/port target on a 2-pin net tie.
   */
  from?: string
  /**
   * Shorthand for pin 2 net/port target on a 2-pin net tie.
   */
  to?: string
  /**
   * Number of pins on the net tie (defaults to `nets.length` or `2`, minimum `2`).
   */
  pinCount?: number
  /**
   * Pin labels mapping or array for the net tie pins.
   */
  pinLabels?: PinLabelsProp
  /**
   * Explicit pin-to-net or pin-to-port connections map.
   */
  connections?: Record<string, string | string[] | readonly string[]>
  /**
   * Physical copper geometry of the net tie:
   * - `"bridge"` (default): separate SMT port pads joined at the center by a short solder-mask-covered copper bridge.
   * - `"pad"`: SMT port pads abutting at one shared pad location.
   */
  shape?: NetTieShape
  /**
   * Width of each port pad (default `0.5mm`).
   */
  padWidth?: number | string
  /**
   * Height of each port pad (default `0.5mm`).
   */
  padHeight?: number | string
  /**
   * Width of the copper bridge connecting the pads in `"bridge"` mode (default `0.25mm`).
   */
  bridgeWidth?: number | string
  /**
   * Length of the copper bridge / spacing between port pad inner edges in `"bridge"` mode (default `0.5mm`).
   */
  bridgeLength?: number | string
  /**
   * Alias for `bridgeLength`.
   */
  clearance?: number | string
  /**
   * Whether the port pads are covered with solder mask (the bridge copper is always covered with solder mask).
   */
  coveredWithSolderMask?: boolean
}

export const netTieProps = commonComponentProps.omit({ name: true }).extend({
  name: z.string().optional(),
  nets: z.array(z.string()).min(2).optional(),
  connectsTo: z.array(z.string()).min(2).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  pinCount: z.number().int().min(2).optional(),
  pinLabels: pinLabelsProp.optional(),
  connections: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
  shape: z.enum(["bridge", "pad"]).optional(),
  padWidth: distance.optional(),
  padHeight: distance.optional(),
  bridgeWidth: distance.optional(),
  bridgeLength: distance.optional(),
  clearance: distance.optional(),
  coveredWithSolderMask: z.boolean().optional(),
})

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      nettie: NetTieProps
      netTie: NetTieProps
    }
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      nettie: NetTieProps
      netTie: NetTieProps
    }
  }
}

let autoNetTieCounter = 0

export const normalizeNetTieTarget = (target: string): string => {
  const trimmed = target.trim()
  if (!trimmed) return trimmed
  if (
    trimmed.startsWith("net.") ||
    trimmed.startsWith(".") ||
    trimmed.startsWith(">") ||
    trimmed.includes(" > ") ||
    trimmed.includes(".")
  ) {
    return trimmed
  }
  return `net.${trimmed}`
}

export const extractNetNameFromTarget = (target: string): string | null => {
  const normalized = normalizeNetTieTarget(target)
  const match = normalized.match(/(?:^|\s|>)net\.([A-Za-z0-9_+-]+)$/)
  return match ? match[1] : null
}

const isBuiltInNetTieFootprintString = (footprint: unknown): boolean => {
  if (typeof footprint !== "string") return false
  const normalized = footprint.trim().toLowerCase()
  return (
    /^nettie(?:\d+)?(?:_(?:bridge|pad|smd))?(?:_|$)/.test(normalized) ||
    /^net[_-]?tie/.test(normalized) ||
    normalized.startsWith("kicad:nettie:")
  )
}

const parseNetTieFootprintPreset = (
  footprint: unknown,
): {
  pinCount?: number
  shape?: NetTieShape
  padSize?: number
} => {
  if (typeof footprint !== "string") return {}
  const normalized = footprint.trim()
  const lower = normalized.toLowerCase()

  const kicadMatch = normalized.match(
    /^kicad:NetTie:NetTie-(\d+)_(?:SMD|THT)_Pad([\d.]+)mm/i,
  )
  if (kicadMatch) {
    return {
      pinCount: Number(kicadMatch[1]),
      shape: "bridge",
      padSize: Number(kicadMatch[2]),
    }
  }

  const nettieMatch = lower.match(/^nettie(\d+)?(?:_(bridge|pad))?$/)
  if (nettieMatch) {
    return {
      pinCount: nettieMatch[1] ? Number(nettieMatch[1]) : undefined,
      shape: (nettieMatch[2] as NetTieShape | undefined) ?? undefined,
    }
  }

  return {}
}

export class NetTieClass extends NormalComponent<typeof netTieProps> {
  constructor(props: NetTieProps) {
    const resolvedName = props?.name ?? `NT${++autoNetTieCounter}`
    super({
      ...props,
      name: resolvedName,
    } as any)
  }

  get config() {
    return {
      componentName: "NetTie",
      zodProps: netTieProps,
      shouldRenderAsSchematicBox: true,
      sourceFtype: "interconnect" as any,
    }
  }

  /**
   * NetTie ports must NOT be marked as internally connected in the source netlist
   * or `circuit-json-to-connectivity-map`, so the netlist, autorouter, copper pours,
   * and board-wide DRC keep the joined nets separate everywhere else on the board.
   */
  get defaultInternallyConnectedPinNames(): string[][] {
    return []
  }

  get internallyConnectedPinNames(): string[][] {
    return []
  }

  _getResolvedNetTargets(): string[] {
    const props = (this._parsedProps ?? this.props ?? {}) as NetTieProps
    const rawTargets =
      props.nets ??
      props.connectsTo ??
      (props.from && props.to ? [props.from, props.to] : [])
    return rawTargets.map(normalizeNetTieTarget)
  }

  _getResolvedPinCount(): number {
    const props = (this._parsedProps ?? this.props ?? {}) as NetTieProps
    const preset = parseNetTieFootprintPreset(props.footprint)
    if (props.pinCount && props.pinCount >= 2) return props.pinCount
    if (preset.pinCount && preset.pinCount >= 2) return preset.pinCount
    const netTargets = this._getResolvedNetTargets()
    if (netTargets.length >= 2) return netTargets.length
    if (Array.isArray(props.pinLabels) && props.pinLabels.length >= 2) {
      return props.pinLabels.length
    }
    if (props.pinLabels && typeof props.pinLabels === "object") {
      const count = Object.keys(props.pinLabels).length
      if (count >= 2) return count
    }
    if (props.connections && typeof props.connections === "object") {
      const count = Object.keys(props.connections).length
      if (count >= 2) return count
    }
    return 2
  }

  _getResolvedShape(): NetTieShape {
    const props = (this._parsedProps ?? this.props ?? {}) as NetTieProps
    const preset = parseNetTieFootprintPreset(props.footprint)
    if (props.shape) return props.shape
    if (preset.shape) return preset.shape
    const rawBridgeLength = props.bridgeLength ?? props.clearance
    if (rawBridgeLength !== undefined && Number(rawBridgeLength) === 0) {
      return "pad"
    }
    return "bridge"
  }

  _getSchematicPortArrangement() {
    const arrangement = super._getSchematicPortArrangement()
    if (arrangement && Object.keys(arrangement).length > 0) return arrangement
    const pinCount = this._getResolvedPinCount()
    return {
      leftSize: 1,
      rightSize: Math.max(1, pinCount - 1),
    }
  }

  resolveFootprint() {
    const rawFootprint =
      this._parsedProps?.footprint ?? (this.props as any)?.footprint
    if (rawFootprint && !isBuiltInNetTieFootprintString(rawFootprint)) {
      return rawFootprint
    }
    return null
  }

  _getPortHintsForPin(pinNumber: number): string[] {
    const hints = new Set<string>([`pin${pinNumber}`, String(pinNumber)])
    const pinCount = this._getResolvedPinCount()
    if (pinCount === 2) {
      if (pinNumber === 1) hints.add("left")
      if (pinNumber === 2) hints.add("right")
    }
    const props = (this._parsedProps ?? this.props ?? {}) as NetTieProps
    const pinLabels = props.pinLabels as any
    if (Array.isArray(pinLabels)) {
      const label = pinLabels[pinNumber - 1]
      if (typeof label === "string" && label) hints.add(label)
    } else if (pinLabels && typeof pinLabels === "object") {
      const entry = pinLabels[`pin${pinNumber}`] ?? pinLabels[String(pinNumber)]
      if (typeof entry === "string" && entry) {
        hints.add(entry)
      } else if (Array.isArray(entry)) {
        for (const item of entry) {
          if (typeof item === "string" && item) hints.add(item)
        }
      }
    }
    return Array.from(hints)
  }

  _createBuiltInNetTieFootprint(): Footprint {
    const props = (this._parsedProps ?? this.props ?? {}) as NetTieProps
    const preset = parseNetTieFootprintPreset(props.footprint)
    const pinCount = this._getResolvedPinCount()
    const shape = this._getResolvedShape()
    const padWidth = Number(props.padWidth ?? preset.padSize ?? 0.5)
    const padHeight = Number(props.padHeight ?? preset.padSize ?? 0.5)
    const bridgeLength =
      shape === "pad" ? 0 : Number(props.bridgeLength ?? props.clearance ?? 0.5)
    const bridgeWidth = Number(
      props.bridgeWidth ?? Math.min(padWidth, padHeight) * 0.5,
    )
    const coveredWithSolderMask = props.coveredWithSolderMask ?? false

    const footprint = new Footprint({})

    if (shape === "pad") {
      if (pinCount === 2) {
        const halfWidth = padWidth / 2
        const centerOffset = padWidth / 4
        footprint.add(
          new SmtPad({
            shape: "rect",
            width: halfWidth,
            height: padHeight,
            pcbX: -centerOffset,
            pcbY: 0,
            portHints: this._getPortHintsForPin(1),
            coveredWithSolderMask,
          } as any),
        )
        footprint.add(
          new SmtPad({
            shape: "rect",
            width: halfWidth,
            height: padHeight,
            pcbX: centerOffset,
            pcbY: 0,
            portHints: this._getPortHintsForPin(2),
            coveredWithSolderMask,
          } as any),
        )
      } else {
        const subPadWidth = padWidth / 2
        const subPadHeight = padHeight / 2
        const offset = padWidth / 2
        const positions = this._getRadialPinPositions(pinCount, offset)
        for (let i = 0; i < pinCount; i++) {
          footprint.add(
            new SmtPad({
              shape: "rect",
              width: subPadWidth,
              height: subPadHeight,
              pcbX: positions[i].x,
              pcbY: positions[i].y,
              portHints: this._getPortHintsForPin(i + 1),
              coveredWithSolderMask,
            } as any),
          )
        }
        footprint.add(
          new SmtPad({
            shape: "rect",
            width: subPadWidth,
            height: subPadHeight,
            pcbX: 0,
            pcbY: 0,
            coveredWithSolderMask: true,
            noSolderPaste: true,
          } as any),
        )
      }
      const courtyardExtentX =
        pinCount === 2 ? padWidth + 0.3 : padWidth * 1.5 + 0.3
      const courtyardExtentY =
        pinCount === 2 ? padHeight + 0.3 : padHeight * 1.5 + 0.3
      footprint.add(
        new CourtyardRect({
          width: courtyardExtentX,
          height: courtyardExtentY,
          pcbX: 0,
          pcbY: 0,
        } as any),
      )
      return footprint
    }

    // "bridge" mode: separate SMT pads connected by a short solder-mask-covered copper bridge at (0, 0)
    if (pinCount === 2) {
      const padCenterOffset = bridgeLength / 2 + padWidth / 2
      footprint.add(
        new SmtPad({
          shape: "rect",
          width: padWidth,
          height: padHeight,
          pcbX: -padCenterOffset,
          pcbY: 0,
          portHints: this._getPortHintsForPin(1),
          coveredWithSolderMask,
        } as any),
      )
      footprint.add(
        new SmtPad({
          shape: "rect",
          width: padWidth,
          height: padHeight,
          pcbX: padCenterOffset,
          pcbY: 0,
          portHints: this._getPortHintsForPin(2),
          coveredWithSolderMask,
        } as any),
      )
      footprint.add(
        new SmtPad({
          shape: "rect",
          width: bridgeLength,
          height: bridgeWidth,
          pcbX: 0,
          pcbY: 0,
          coveredWithSolderMask: true,
          noSolderPaste: true,
        } as any),
      )
      footprint.add(
        new CourtyardRect({
          width: bridgeLength + padWidth * 2 + 0.3,
          height: Math.max(padHeight, bridgeWidth) + 0.3,
          pcbX: 0,
          pcbY: 0,
        } as any),
      )
    } else {
      const offset = bridgeLength / 2 + padWidth / 2
      const positions = this._getRadialPinPositions(pinCount, offset)
      for (let i = 0; i < pinCount; i++) {
        footprint.add(
          new SmtPad({
            shape: "rect",
            width: padWidth,
            height: padHeight,
            pcbX: positions[i].x,
            pcbY: positions[i].y,
            portHints: this._getPortHintsForPin(i + 1),
            coveredWithSolderMask,
          } as any),
        )
      }
      footprint.add(
        new SmtPad({
          shape: "rect",
          width: bridgeLength,
          height: bridgeLength,
          pcbX: 0,
          pcbY: 0,
          coveredWithSolderMask: true,
          noSolderPaste: true,
        } as any),
      )
      const span = (offset + Math.max(padWidth, padHeight) / 2) * 2 + 0.3
      footprint.add(
        new CourtyardRect({
          width: span,
          height: span,
          pcbX: 0,
          pcbY: 0,
        } as any),
      )
    }

    return footprint
  }

  _getRadialPinPositions(
    pinCount: number,
    offset: number,
  ): Array<{ x: number; y: number }> {
    if (pinCount === 2) {
      return [
        { x: -offset, y: 0 },
        { x: offset, y: 0 },
      ]
    }
    if (pinCount === 3) {
      return [
        { x: -offset, y: 0 },
        { x: offset, y: 0 },
        { x: 0, y: offset },
      ]
    }
    if (pinCount === 4) {
      return [
        { x: -offset, y: 0 },
        { x: offset, y: 0 },
        { x: 0, y: offset },
        { x: 0, y: -offset },
      ]
    }
    return Array.from({ length: pinCount }, (_, i) => {
      const angle = (2 * Math.PI * i) / pinCount
      return {
        x: Number((offset * Math.cos(angle)).toFixed(6)),
        y: Number((offset * Math.sin(angle)).toFixed(6)),
      }
    })
  }

  _addChildrenFromStringFootprint() {
    const rawFootprint =
      this._parsedProps?.footprint ?? (this.props as any)?.footprint
    if (
      rawFootprint &&
      typeof rawFootprint === "string" &&
      !isBuiltInNetTieFootprintString(rawFootprint)
    ) {
      super._addChildrenFromStringFootprint()
      return
    }
    if (React.isValidElement(rawFootprint)) {
      return
    }
    const hasFootprintChild = this.children.some(
      (c) => c.componentName === "Footprint",
    )
    if (!hasFootprintChild) {
      this.add(this._createBuiltInNetTieFootprint())
    }
  }

  initPorts(opts: any = {}) {
    const pinCount = this._getResolvedPinCount()
    const additionalAliases: Record<string, string[]> = {
      ...(opts.additionalAliases ?? {}),
    }
    if (pinCount === 2) {
      additionalAliases.pin1 = Array.from(
        new Set([...(additionalAliases.pin1 ?? []), "left"]),
      )
      additionalAliases.pin2 = Array.from(
        new Set([...(additionalAliases.pin2 ?? []), "right"]),
      )
    }
    super.initPorts({
      ...opts,
      pinCount,
      additionalAliases,
    })
    for (let pn = 1; pn <= pinCount; pn++) {
      const hasPort = this.children.some(
        (c) =>
          c.componentName === "Port" &&
          (c as any)._parsedProps?.pinNumber === pn,
      )
      if (!hasPort) {
        this.add(
          new Port({
            pinNumber: pn,
            aliases: this._getPortHintsForPin(pn),
          }),
        )
      }
    }
  }

  doInitialCreateNetsFromProps() {
    const netTargets = this._getResolvedNetTargets()
    const subcircuit = this.getSubcircuit()
    for (const target of netTargets) {
      const netName = extractNetNameFromTarget(target)
      if (netName && subcircuit) {
        const existingNet = subcircuit.children.find(
          (child: any) =>
            child.componentName === "Net" &&
            (child._parsedProps?.name === netName ||
              child.props?.name === netName),
        )
        if (!existingNet) {
          subcircuit.add(new Net({ name: netName }))
        }
      }
    }
    this._createNetsFromProps([
      ...netTargets,
      ...this._getNetsFromConnectionsProp(),
    ])
  }

  doInitialCreateTracesFromProps() {
    const netTargets = this._getResolvedNetTargets()
    for (let i = 0; i < netTargets.length; i++) {
      const target = netTargets[i]
      if (!target) continue
      this.add(
        new Trace({
          from: `${this.getSubcircuitSelector()} > port.pin${i + 1}`,
          to: target,
        }),
      )
    }
    this._createTracesFromConnectionsProp()
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "interconnect" as any,
      name: this.name,
      manufacturer_part_number:
        props.manufacturerPartNumber ?? (props as any).mfrPartNumber,
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: true,
      display_name: props.displayName ?? this.name,
    } as any)
    this.source_component_id = source_component.source_component_id
  }

  doInitialSourceParentAttachment() {
    // Intentionally do not insert `internally_connected_source_port_ids` or
    // `source_component_internal_connection` so that the tied nets remain
    // distinct in the netlist, autorouter, copper pours, and global DRC.
  }

  updateSourceParentAttachment() {
    // Intentionally no-op: keep nets distinct in source connectivity.
  }

  doInitialPcbComponentRender() {
    super.doInitialPcbComponentRender()
    if (!this.pcb_component_id || !this.root?.db) return
    const pcbComponent = this.root.db.pcb_component.get(this.pcb_component_id)
    if (!pcbComponent) return
    this.root.db.pcb_component.update(this.pcb_component_id, {
      metadata: {
        ...(pcbComponent.metadata ?? {}),
        is_net_tie: true,
        net_tie_shape: this._getResolvedShape(),
        net_tie_pin_count: this._getResolvedPinCount(),
      },
    } as any)
  }
}

interface NetTieFootprintDescriptor {
  pcbComponentId: string
  sourceComponentId?: string
  padIds: Set<string>
  portIds: Set<string>
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

const getPadBoundsAndCenter = (
  pad: any,
): {
  minX: number
  maxX: number
  minY: number
  maxY: number
} | null => {
  if (pad.type === "pcb_smtpad") {
    if (pad.shape === "circle") {
      const r = pad.radius ?? 0
      return {
        minX: pad.x - r,
        maxX: pad.x + r,
        minY: pad.y - r,
        maxY: pad.y + r,
      }
    }
    if (pad.shape === "polygon" && Array.isArray(pad.points)) {
      const xs = pad.points.map((p: any) => p.x)
      const ys = pad.points.map((p: any) => p.y)
      return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      }
    }
    const w = pad.width ?? 0
    const h = pad.height ?? 0
    return {
      minX: pad.x - w / 2,
      maxX: pad.x + w / 2,
      minY: pad.y - h / 2,
      maxY: pad.y + h / 2,
    }
  }
  if (pad.type === "pcb_plated_hole") {
    const w = pad.outer_diameter ?? pad.outer_width ?? 0
    const h = pad.outer_diameter ?? pad.outer_height ?? 0
    return {
      minX: pad.x - w / 2,
      maxX: pad.x + w / 2,
      minY: pad.y - h / 2,
      maxY: pad.y + h / 2,
    }
  }
  return null
}

const collectNetTieDescriptors = (
  circuitJson: AnyCircuitElement[],
): NetTieFootprintDescriptor[] => {
  const descriptors: NetTieFootprintDescriptor[] = []
  const netTiePcbComponents = circuitJson.filter(
    (elm: any) =>
      elm.type === "pcb_component" && elm.metadata?.is_net_tie === true,
  ) as any[]
  if (netTiePcbComponents.length === 0) return descriptors

  for (const pcbComp of netTiePcbComponents) {
    const pcbComponentId = pcbComp.pcb_component_id
    const padIds = new Set<string>()
    const portIds = new Set<string>()
    let minX = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    for (const elm of circuitJson as any[]) {
      if (
        elm.type === "pcb_smtpad" &&
        elm.pcb_component_id === pcbComponentId
      ) {
        padIds.add(elm.pcb_smtpad_id)
        if (elm.pcb_port_id) portIds.add(elm.pcb_port_id)
        const b = getPadBoundsAndCenter(elm)
        if (b) {
          minX = Math.min(minX, b.minX)
          maxX = Math.max(maxX, b.maxX)
          minY = Math.min(minY, b.minY)
          maxY = Math.max(maxY, b.maxY)
        }
      } else if (
        elm.type === "pcb_plated_hole" &&
        elm.pcb_component_id === pcbComponentId
      ) {
        padIds.add(elm.pcb_plated_hole_id)
        if (elm.pcb_port_id) portIds.add(elm.pcb_port_id)
        const b = getPadBoundsAndCenter(elm)
        if (b) {
          minX = Math.min(minX, b.minX)
          maxX = Math.max(maxX, b.maxX)
          minY = Math.min(minY, b.minY)
          maxY = Math.max(maxY, b.maxY)
        }
      } else if (
        elm.type === "pcb_port" &&
        elm.pcb_component_id === pcbComponentId
      ) {
        portIds.add(elm.pcb_port_id)
        if (elm.source_port_id) portIds.add(elm.source_port_id)
      }
    }

    if (!Number.isFinite(minX)) {
      const halfW = (pcbComp.width ?? 1) / 2
      const halfH = (pcbComp.height ?? 1) / 2
      minX = (pcbComp.center?.x ?? 0) - halfW
      maxX = (pcbComp.center?.x ?? 0) + halfW
      minY = (pcbComp.center?.y ?? 0) - halfH
      maxY = (pcbComp.center?.y ?? 0) + halfH
    }

    descriptors.push({
      pcbComponentId,
      sourceComponentId: pcbComp.source_component_id,
      padIds,
      portIds,
      bounds: { minX, maxX, minY, maxY },
    })
  }

  return descriptors
}

const isPointWithinBounds = (
  point: { x?: number; y?: number } | undefined,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  margin: number,
): boolean => {
  if (!point || point.x === undefined || point.y === undefined) return true
  return (
    point.x >= bounds.minX - margin &&
    point.x <= bounds.maxX + margin &&
    point.y >= bounds.minY - margin &&
    point.y <= bounds.maxY + margin
  )
}

const isTraceConnectedToNetTie = (
  traceId: string,
  nt: NetTieFootprintDescriptor,
  connMap: ReturnType<typeof getFullConnectivityMapFromCircuitJson>,
): boolean => {
  for (const id of nt.portIds) {
    if (connMap.areIdsConnected(traceId, id)) return true
  }
  for (const id of nt.padIds) {
    if (connMap.areIdsConnected(traceId, id)) return true
  }
  return false
}

/**
 * Returns `true` if a DRC error is caused by the intentional connection inside a
 * `NetTie` footprint (for example clearance/overlap between a NetTie's own pads/bridge
 * or a trace entering a NetTie pad within the NetTie footprint bounds), while returning
 * `false` for shorts or clearance violations between those nets anywhere else on the board.
 */
export const isNetTieDrcError = (
  circuitJson: AnyCircuitElement[],
  error: AnyCircuitElement | Record<string, any>,
): boolean => {
  if (!error || typeof error !== "object") return false
  const descriptors = collectNetTieDescriptors(circuitJson)
  if (descriptors.length === 0) return false

  if (
    error.type === "pcb_pad_pad_clearance_error" &&
    Array.isArray(error.pcb_pad_ids) &&
    error.pcb_pad_ids.length > 0
  ) {
    return descriptors.some((nt) =>
      error.pcb_pad_ids.every((padId: string) => nt.padIds.has(padId)),
    )
  }

  if (error.type === "pcb_footprint_overlap_error") {
    const padIds: string[] = [
      ...(error.pcb_smtpad_ids ?? []),
      ...(error.pcb_plated_hole_ids ?? []),
    ]
    if (padIds.length > 0) {
      return descriptors.some((nt) => padIds.every((id) => nt.padIds.has(id)))
    }
  }

  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)

  if (error.type === "pcb_pad_trace_clearance_error") {
    const padId = error.pcb_pad_id as string | undefined
    const traceId = error.pcb_trace_id as string | undefined
    if (!padId || !traceId) return false
    const margin = Math.max(Number(error.minimum_clearance ?? 0.2), 0.25)
    return descriptors.some(
      (nt) =>
        nt.padIds.has(padId) &&
        isTraceConnectedToNetTie(traceId, nt, connMap) &&
        isPointWithinBounds(error.center, nt.bounds, margin),
    )
  }

  if (error.type === "pcb_trace_error") {
    const errorId = String(error.pcb_trace_error_id ?? "")
    const traceId = error.pcb_trace_id as string | undefined
    for (const nt of descriptors) {
      // Check trace overlapping a pad of the same NetTie component
      for (const padId of nt.padIds) {
        if (
          traceId &&
          errorId === `overlap_${traceId}_${padId}` &&
          isTraceConnectedToNetTie(traceId, nt, connMap) &&
          isPointWithinBounds(error.center, nt.bounds, 0.25)
        ) {
          return true
        }
      }
      // Check two traces meeting at the NetTie footprint itself
      if (
        errorId.startsWith("overlap_") &&
        traceId &&
        errorId.startsWith(`overlap_${traceId}_`)
      ) {
        const otherId = errorId.slice(`overlap_${traceId}_`.length)
        if (
          otherId &&
          isTraceConnectedToNetTie(traceId, nt, connMap) &&
          isTraceConnectedToNetTie(otherId, nt, connMap) &&
          error.center &&
          isPointWithinBounds(error.center, nt.bounds, 0.15)
        ) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Filters out expected NetTie internal DRC errors while preserving all DRC errors
 * where the tied nets short or violate clearance elsewhere on the board.
 */
export const filterNetTieDrcErrors = <
  T extends AnyCircuitElement | Record<string, any>,
>(
  circuitJson: AnyCircuitElement[],
  errors: T[],
): T[] => {
  return errors.filter((err) => !isNetTieDrcError(circuitJson, err))
}

export const checkPadPadClearance: typeof baseCheckPadPadClearance = (
  circuitJson,
  opts,
) => {
  return filterNetTieDrcErrors(
    circuitJson,
    baseCheckPadPadClearance(circuitJson, opts),
  )
}

export const checkPadTraceClearance: typeof baseCheckPadTraceClearance = (
  circuitJson,
  opts,
) => {
  return filterNetTieDrcErrors(
    circuitJson,
    baseCheckPadTraceClearance(circuitJson, opts),
  )
}

export const checkEachPcbTraceNonOverlapping: typeof baseCheckEachPcbTraceNonOverlapping =
  (circuitJson, opts) => {
    return filterNetTieDrcErrors(
      circuitJson,
      baseCheckEachPcbTraceNonOverlapping(circuitJson, opts),
    )
  }

export const checkPcbComponentOverlap: typeof baseCheckPcbComponentOverlap = (
  circuitJson,
) => {
  return filterNetTieDrcErrors(
    circuitJson,
    baseCheckPcbComponentOverlap(circuitJson),
  )
}

export const runAllPlacementChecks: typeof baseRunAllPlacementChecks = async (
  circuitJson,
  opts,
) => {
  const results = await baseRunAllPlacementChecks(circuitJson, opts)
  return filterNetTieDrcErrors(circuitJson, results)
}

export const runAllRoutingChecks: typeof baseRunAllRoutingChecks = async (
  circuitJson,
) => {
  const results = await baseRunAllRoutingChecks(circuitJson)
  return filterNetTieDrcErrors(circuitJson, results)
}

export type NetTieComponent = {
  (props: NetTieProps): React.ReactElement
  new (props: NetTieProps): NetTieClass
}

export const NetTie: NetTieComponent = new Proxy(NetTieClass as any, {
  apply(_target, _thisArg, argArray) {
    return React.createElement("nettie", argArray[0] ?? {})
  },
  construct(target, argArray, newTarget) {
    return Reflect.construct(target, argArray, newTarget)
  },
})

export const netTiePins = [
  "pin1",
  "pin2",
  "pin3",
  "pin4",
  "left",
  "right",
] as const

export const useNetTie = createUseComponent(
  (props: NetTieProps) => React.createElement("nettie", props),
  netTiePins as any,
)

let isNetTieRegistered = false

export const registerNetTie = () => {
  if (isNetTieRegistered) return
  isNetTieRegistered = true

  // 1. Register NetTie in @tscircuit/core's internal JSX catalogue
  let capturedCatalogue: Record<string, any> | null = null
  Object.defineProperty(Object.prototype, "__tsci_capture_catalogue__", {
    configurable: true,
    get() {
      capturedCatalogue = this
      return NormalComponent
    },
  })
  try {
    new RootCircuit().add(
      React.createElement("__tsci_capture_catalogue__" as any, {
        name: "__tmp_nettie_probe__",
      }),
    )
  } catch {
    // Ignore probe errors
  } finally {
    Reflect.deleteProperty(Object.prototype, "__tsci_capture_catalogue__")
  }

  if (capturedCatalogue && typeof capturedCatalogue === "object") {
    const cat = capturedCatalogue as Record<string, any>
    cat.NetTie = NetTieClass
    cat.nettie = NetTieClass
    cat.netTie = NetTieClass
    cat["net-tie"] = NetTieClass
    cat.net_tie = NetTieClass
  }

  // 2. Patch Board._isExpectedCastellatedHoleDrcError so Board's built-in
  // placement and routing DRC checks exempt intentional NetTie connections
  // at the NetTie footprint while catching shorts everywhere else.
  const boardProto = Board.prototype as any
  if (
    boardProto &&
    typeof boardProto._isExpectedCastellatedHoleDrcError === "function" &&
    !boardProto._isNetTiePatched
  ) {
    const origCheck = boardProto._isExpectedCastellatedHoleDrcError
    boardProto._isExpectedCastellatedHoleDrcError = function (result: any) {
      if (origCheck.call(this, result)) return true
      const circuitJson = this.root?.db?.toArray?.() ?? []
      return isNetTieDrcError(circuitJson, result)
    }
    boardProto._isNetTiePatched = true
  }

  // 3. Patch CircuitRunner so runTscircuitCode / CircuitRunner pre-supplied
  // imports for "tscircuit" and "@tscircuit/core" include NetTie & helpers.
  const runnerProto = CircuitRunner.prototype as any
  if (runnerProto && !runnerProto._isNetTiePatched) {
    const injectIntoExecutionContext = (ctx: any) => {
      if (!ctx?.preSuppliedImports) return
      const extraExports = {
        NetTie,
        useNetTie,
        netTieProps,
        isNetTieDrcError,
        filterNetTieDrcErrors,
      }
      if (ctx.preSuppliedImports["@tscircuit/core"]) {
        ctx.preSuppliedImports["@tscircuit/core"] = {
          ...ctx.preSuppliedImports["@tscircuit/core"],
          ...extraExports,
        }
      }
      if (ctx.preSuppliedImports.tscircuit) {
        ctx.preSuppliedImports.tscircuit = {
          ...ctx.preSuppliedImports.tscircuit,
          ...extraExports,
        }
      }
    }

    const origExecuteWithFsMap = runnerProto.executeWithFsMap
    if (typeof origExecuteWithFsMap === "function") {
      runnerProto.executeWithFsMap = async function (...args: any[]) {
        const origBind = this._bindEventListeners
        this._bindEventListeners = function (...bindArgs: any[]) {
          injectIntoExecutionContext(this._executionContext)
          return origBind.apply(this, bindArgs)
        }
        try {
          return await origExecuteWithFsMap.apply(this, args)
        } finally {
          this._bindEventListeners = origBind
        }
      }
    }

    const origExecute = runnerProto.execute
    if (typeof origExecute === "function") {
      runnerProto.execute = async function (...args: any[]) {
        const origBind = this._bindEventListeners
        this._bindEventListeners = function (...bindArgs: any[]) {
          injectIntoExecutionContext(this._executionContext)
          return origBind.apply(this, bindArgs)
        }
        try {
          return await origExecute.apply(this, args)
        } finally {
          this._bindEventListeners = origBind
        }
      }
    }

    runnerProto._isNetTiePatched = true
  }
}

registerNetTie()

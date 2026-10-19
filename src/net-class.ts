import { AutoroutingPipelineSolver9_PreloadedTraceGraph } from "@tscircuit/capacity-autorouter"
import {
  checkDifferentNetViaSpacing as baseCheckDifferentNetViaSpacing,
  checkEachPcbTraceNonOverlapping as baseCheckEachPcbTraceNonOverlapping,
  checkPadPadClearance as baseCheckPadPadClearance,
  checkPadTraceClearance as baseCheckPadTraceClearance,
  checkViaPadClearance as baseCheckViaPadClearance,
  checkViaTraceClearance as baseCheckViaTraceClearance,
  runAllChecks as baseRunAllChecks,
  runAllPlacementChecks as baseRunAllPlacementChecks,
  runAllRoutingChecks as baseRunAllRoutingChecks,
} from "@tscircuit/checks"
import {
  Board,
  Group,
  Net,
  PrimitiveComponent,
  RootCircuit,
} from "@tscircuit/core"
import { CircuitRunner } from "@tscircuit/eval"
import { type AnyCircuitElement, distance } from "circuit-json"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import React from "react"
import { z } from "zod"

export type WorkingVoltageEnvironment =
  | "external_uncoated"
  | "external_coated"
  | "internal"

export interface WorkingVoltageTableEntry {
  maxVoltage: number
  externalUncoatedMm: number
  externalCoatedMm: number
  internalMm: number
}

/**
 * IPC-2221B / IEC 60664-1 PCB conductor spacing table indexed by peak working voltage (V).
 * Above 500V, per-volt scaling of 0.005 mm/V (external uncoated), 0.00305 mm/V (external coated),
 * and 0.0025 mm/V (internal layers) is applied.
 */
export const IPC_2221_WORKING_VOLTAGE_CLEARANCE_TABLE: readonly WorkingVoltageTableEntry[] =
  [
    {
      maxVoltage: 15,
      externalUncoatedMm: 0.1,
      externalCoatedMm: 0.05,
      internalMm: 0.05,
    },
    {
      maxVoltage: 30,
      externalUncoatedMm: 0.15,
      externalCoatedMm: 0.1,
      internalMm: 0.05,
    },
    {
      maxVoltage: 50,
      externalUncoatedMm: 0.25,
      externalCoatedMm: 0.13,
      internalMm: 0.1,
    },
    {
      maxVoltage: 100,
      externalUncoatedMm: 0.6,
      externalCoatedMm: 0.4,
      internalMm: 0.1,
    },
    {
      maxVoltage: 150,
      externalUncoatedMm: 1.0,
      externalCoatedMm: 0.4,
      internalMm: 0.2,
    },
    {
      maxVoltage: 170,
      externalUncoatedMm: 1.25,
      externalCoatedMm: 0.4,
      internalMm: 0.2,
    },
    {
      maxVoltage: 250,
      externalUncoatedMm: 1.5,
      externalCoatedMm: 0.4,
      internalMm: 0.2,
    },
    {
      maxVoltage: 300,
      externalUncoatedMm: 2.0,
      externalCoatedMm: 0.8,
      internalMm: 0.25,
    },
    {
      maxVoltage: 500,
      externalUncoatedMm: 2.5,
      externalCoatedMm: 0.8,
      internalMm: 0.25,
    },
  ]

/**
 * Parse a voltage specification (e.g. `400`, `"400V"`, `"1.5kV"`, `"500mV"`) into Volts.
 */
export const parseVoltageVolts = (
  value: number | string | undefined,
): number | undefined => {
  if (value === undefined) return undefined
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.abs(value) : undefined
  }
  const trimmed = value.trim()
  const match = trimmed.match(/^([+-]?\d+(?:\.\d+)?)\s*(mv|kv|v)?$/i)
  if (!match) {
    const fallback = Number(trimmed)
    return Number.isFinite(fallback) ? Math.abs(fallback) : undefined
  }
  const numeric = Math.abs(Number(match[1]))
  const unit = (match[2] ?? "v").toLowerCase()
  if (unit === "kv") return numeric * 1000
  if (unit === "mv") return numeric / 1000
  return numeric
}

/**
 * Compute required PCB clearance (in mm) from a working voltage using the IPC-2221B table.
 */
export const getClearanceFromWorkingVoltage = (
  workingVoltage: number | string,
  options: { environment?: WorkingVoltageEnvironment } = {},
): number => {
  const volts = parseVoltageVolts(workingVoltage) ?? 0
  const env = options.environment ?? "external_uncoated"
  for (const row of IPC_2221_WORKING_VOLTAGE_CLEARANCE_TABLE) {
    if (volts <= row.maxVoltage) {
      if (env === "external_coated") return row.externalCoatedMm
      if (env === "internal") return row.internalMm
      return row.externalUncoatedMm
    }
  }
  const excessVolts = Math.max(0, volts - 500)
  if (env === "external_coated") {
    return Number((0.8 + excessVolts * 0.00305).toFixed(4))
  }
  if (env === "internal") {
    return Number((0.25 + excessVolts * 0.0025).toFixed(4))
  }
  return Number((2.5 + excessVolts * 0.005).toFixed(4))
}

const parseDistanceMm = (
  val: number | string | undefined,
  fallback?: number,
): number | undefined => {
  if (val === undefined) return fallback
  const parsed = distance.parse(val)
  if (typeof parsed === "number" && !Number.isNaN(parsed)) {
    return parsed
  }
  const numeric = Number(val)
  return Number.isFinite(numeric) ? numeric : fallback
}

export interface NetClassProps {
  name: string
  /**
   * Minimum clearance for nets in this class (e.g. `"3mm"` or `3`).
   * If omitted and `workingVoltage` is provided, calculated from the IPC-2221B working-voltage table.
   */
  clearance?: number | string
  /**
   * Peak working voltage for nets in this class (e.g. `400`, `"400V"`, `"1.5kV"`).
   */
  workingVoltage?: number | string
  /**
   * Alias for `workingVoltage`.
   */
  voltage?: number | string
  /**
   * Environment used when calculating clearance from `workingVoltage`.
   */
  voltageEnvironment?: WorkingVoltageEnvironment
  /**
   * Nominal/minimum trace width for nets in this class (e.g. `"0.4mm"`).
   */
  traceWidth?: number | string
  /**
   * Minimum via pad outer diameter for nets in this class (e.g. `"0.8mm"`).
   */
  viaDiameter?: number | string
  /**
   * Minimum via drill hole diameter for nets in this class (e.g. `"0.4mm"`).
   */
  viaHoleDiameter?: number | string
  /**
   * Net names or selectors assigned to this net class (e.g. `["net.HV_POS", "net.HV_NEG"]` or `["HV_POS", "HV_NEG"]`).
   */
  nets?: string[]
  /**
   * Alias for `nets`.
   */
  connectsTo?: string | string[]
  /**
   * Optional per-target-class clearance overrides (e.g. `{ LV: "3mm", DEFAULT: "2.5mm" }`).
   */
  clearanceTo?: Record<string, number | string>
  description?: string
}

export interface ClearanceMatrixRuleEntry {
  from?: string
  to?: string
  classA?: string
  classB?: string
  classes?: [string, string]
  clearance: number | string
}

export interface ClearanceMatrixProps {
  name?: string
  /**
   * Default board clearance when a pair of classes is not explicitly listed (default `0.15mm`).
   */
  defaultClearance?: number | string
  /**
   * Nested class-to-class clearance map, e.g. `{ HV: { LV: "3mm", HV: "1.5mm" }, LV: { LV: "0.15mm" } }`.
   */
  matrix?: Record<string, Record<string, number | string>>
  /**
   * Flat or nested clearance map, e.g. `{ "HV-LV": "3mm", "LV-LV": "0.15mm" }` or nested records.
   */
  clearances?: Record<string, number | string | Record<string, number | string>>
  /**
   * Array of pairwise clearance rules.
   */
  rules?: ClearanceMatrixRuleEntry[]
}

export interface SourceNetClassElement {
  type: "source_net_class"
  source_net_class_id: string
  name: string
  clearance: number
  working_voltage?: number
  trace_width?: number
  via_diameter?: number
  via_hole_diameter?: number
  net_names: string[]
  source_net_ids: string[]
  source_trace_ids: string[]
  source_port_ids: string[]
  pcb_port_ids: string[]
  clearance_to?: Record<string, number>
  subcircuit_id?: string
}

export interface SourceClearanceMatrixElement {
  type: "source_clearance_matrix"
  source_clearance_matrix_id: string
  default_clearance?: number
  matrix: Record<string, Record<string, number>>
  subcircuit_id?: string
}

export const netClassProps = z.object({
  name: z.string(),
  clearance: z.union([z.number(), z.string()]).optional(),
  workingVoltage: z.union([z.number(), z.string()]).optional(),
  voltage: z.union([z.number(), z.string()]).optional(),
  voltageEnvironment: z
    .enum(["external_uncoated", "external_coated", "internal"])
    .optional(),
  traceWidth: z.union([z.number(), z.string()]).optional(),
  viaDiameter: z.union([z.number(), z.string()]).optional(),
  viaHoleDiameter: z.union([z.number(), z.string()]).optional(),
  nets: z.array(z.string()).optional(),
  connectsTo: z.union([z.string(), z.array(z.string())]).optional(),
  clearanceTo: z
    .record(z.string(), z.union([z.number(), z.string()]))
    .optional(),
  description: z.string().optional(),
})

export const clearanceMatrixProps = z.object({
  name: z.string().optional(),
  defaultClearance: z.union([z.number(), z.string()]).optional(),
  matrix: z
    .record(z.string(), z.record(z.string(), z.union([z.number(), z.string()])))
    .optional(),
  clearances: z
    .record(
      z.string(),
      z.union([
        z.number(),
        z.string(),
        z.record(z.string(), z.union([z.number(), z.string()])),
      ]),
    )
    .optional(),
  rules: z
    .array(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        classA: z.string().optional(),
        classB: z.string().optional(),
        classes: z.tuple([z.string(), z.string()]).optional(),
        clearance: z.union([z.number(), z.string()]),
      }),
    )
    .optional(),
})

const normalizeNetName = (selector: string): string => {
  const trimmed = selector.trim()
  if (trimmed.startsWith("net.")) return trimmed.slice(4).trim()
  if (trimmed.startsWith(".net.")) return trimmed.slice(5).trim()
  return trimmed
}

const normalizeMatrixInput = (
  props: ClearanceMatrixProps,
): Record<string, Record<string, number>> => {
  const result: Record<string, Record<string, number>> = {}
  const setPair = (classA: string, classB: string, rawVal: number | string) => {
    const a = classA.trim()
    const b = classB.trim()
    if (!a || !b) return
    const val = parseDistanceMm(rawVal)
    if (val === undefined) return
    result[a] ??= {}
    result[b] ??= {}
    result[a][b] = val
    result[b][a] = val
  }

  if (props.matrix) {
    for (const [classA, row] of Object.entries(props.matrix)) {
      if (!row || typeof row !== "object") continue
      for (const [classB, val] of Object.entries(row)) {
        setPair(classA, classB, val)
      }
    }
  }

  if (props.clearances) {
    for (const [key, val] of Object.entries(props.clearances)) {
      if (typeof val === "object" && val !== null) {
        for (const [classB, innerVal] of Object.entries(val)) {
          setPair(key, classB, innerVal)
        }
      } else {
        const parts = key.split(/\s*(?:<->|->|[-:/|,])\s*/)
        if (parts.length === 2) {
          setPair(parts[0], parts[1], val)
        }
      }
    }
  }

  if (props.rules) {
    for (const rule of props.rules) {
      const a = rule.from ?? rule.classA ?? rule.classes?.[0]
      const b = rule.to ?? rule.classB ?? rule.classes?.[1]
      if (a && b) {
        setPair(a, b, rule.clearance)
      }
    }
  }

  return result
}

const getCircuitJsonArrayFromRoot = (
  root: RootCircuit | null | undefined,
): AnyCircuitElement[] | null => {
  if (!root?.db) return null
  const dbRecord = root.db as unknown as {
    _elements?: AnyCircuitElement[]
    toArray?: () => AnyCircuitElement[]
  }
  if (Array.isArray(dbRecord._elements)) {
    return dbRecord._elements
  }
  return null
}

const upsertCircuitElementInRoot = (
  root: RootCircuit | null | undefined,
  idField: string,
  idValue: string,
  element: AnyCircuitElement,
) => {
  if (!root?.db) return
  const dbRecord = root.db as unknown as {
    _elements?: AnyCircuitElement[]
    insertAll?: (elms: AnyCircuitElement[]) => void
  }
  if (Array.isArray(dbRecord._elements)) {
    const existingIdx = dbRecord._elements.findIndex(
      (e) =>
        e.type === element.type &&
        (e as unknown as Record<string, unknown>)[idField] === idValue,
    )
    if (existingIdx >= 0) {
      dbRecord._elements[existingIdx] = element
      return
    }
    dbRecord._elements.push(element)
    return
  }
  dbRecord.insertAll?.([element])
}

export class NetClassImpl extends PrimitiveComponent<typeof netClassProps> {
  source_net_class_id: string | null = null

  get config() {
    return {
      componentName: "NetClass",
      zodProps: netClassProps,
    }
  }

  private _syncNetClassElement() {
    if (!this.root?.db) return
    const props = this._parsedProps as NetClassProps
    const subcircuit = this.getSubcircuit()
    const subcircuitId = subcircuit?.subcircuit_id ?? undefined

    const rawTargets = [
      ...(props.nets ?? []),
      ...(typeof props.connectsTo === "string"
        ? [props.connectsTo]
        : (props.connectsTo ?? [])),
    ]

    const netNames = new Set<string>()
    const sourceNetIds = new Set<string>()
    const sourceTraceIds = new Set<string>()
    const sourcePortIds = new Set<string>()
    const pcbPortIds = new Set<string>()

    const allElements = this.root.db.toArray()

    for (const rawTarget of rawTargets) {
      const normalized = normalizeNetName(rawTarget)
      netNames.add(normalized)

      for (const el of allElements) {
        if (el.type === "source_net" && el.name === normalized) {
          sourceNetIds.add(el.source_net_id)
        }
      }

      if (subcircuit) {
        const selectedPort = subcircuit.selectOne(rawTarget, {
          type: "port",
        }) as { source_port_id?: string; pcb_port_id?: string } | null
        if (selectedPort?.source_port_id) {
          sourcePortIds.add(selectedPort.source_port_id)
        }
        if (selectedPort?.pcb_port_id) {
          pcbPortIds.add(selectedPort.pcb_port_id)
        }
        const selectedNet = subcircuit.selectOne(
          rawTarget.startsWith("net.") ? rawTarget : `net.${normalized}`,
          { type: "net" },
        ) as { source_net_id?: string; name?: string } | null
        if (selectedNet?.source_net_id) {
          sourceNetIds.add(selectedNet.source_net_id)
        }
      }
    }

    for (const el of allElements) {
      if (el.type === "source_net") {
        const netRecord = el as unknown as {
          source_net_id: string
          name: string
          net_class?: string
        }
        if (
          netRecord.net_class === props.name ||
          netNames.has(netRecord.name)
        ) {
          sourceNetIds.add(netRecord.source_net_id)
          netNames.add(netRecord.name)
        }
      }
    }

    for (const el of allElements) {
      if (el.type === "source_trace") {
        const connectsNet = el.connected_source_net_ids?.some((id) =>
          sourceNetIds.has(id),
        )
        const connectsPort = el.connected_source_port_ids?.some((id) =>
          sourcePortIds.has(id),
        )
        if (connectsNet || connectsPort) {
          sourceTraceIds.add(el.source_trace_id)
          for (const portId of el.connected_source_port_ids ?? []) {
            sourcePortIds.add(portId)
          }
        }
      }
    }

    for (const el of allElements) {
      if (
        el.type === "pcb_port" &&
        el.source_port_id &&
        sourcePortIds.has(el.source_port_id)
      ) {
        pcbPortIds.add(el.pcb_port_id)
      }
    }

    const rawVoltage = props.workingVoltage ?? props.voltage
    const workingVoltage = parseVoltageVolts(rawVoltage)
    const voltageClearance =
      rawVoltage !== undefined
        ? getClearanceFromWorkingVoltage(rawVoltage, {
            environment: props.voltageEnvironment,
          })
        : undefined
    const explicitClearance = parseDistanceMm(props.clearance)
    const resolvedClearance =
      explicitClearance !== undefined && voltageClearance !== undefined
        ? Math.max(explicitClearance, voltageClearance)
        : (explicitClearance ?? voltageClearance ?? 0.15)

    const traceWidth = parseDistanceMm(props.traceWidth)
    const viaDiameter = parseDistanceMm(props.viaDiameter)
    const viaHoleDiameter = parseDistanceMm(props.viaHoleDiameter)

    let clearanceTo: Record<string, number> | undefined
    if (props.clearanceTo) {
      clearanceTo = {}
      for (const [targetClass, val] of Object.entries(props.clearanceTo)) {
        const parsed = parseDistanceMm(val)
        if (parsed !== undefined) {
          clearanceTo[targetClass.trim()] = parsed
        }
      }
    }

    if (!this.source_net_class_id) {
      this.source_net_class_id = `source_net_class_${props.name}`
    }

    const element: SourceNetClassElement = {
      type: "source_net_class",
      source_net_class_id: this.source_net_class_id,
      name: props.name,
      clearance: resolvedClearance,
      ...(workingVoltage !== undefined
        ? { working_voltage: workingVoltage }
        : {}),
      ...(traceWidth !== undefined ? { trace_width: traceWidth } : {}),
      ...(viaDiameter !== undefined ? { via_diameter: viaDiameter } : {}),
      ...(viaHoleDiameter !== undefined
        ? { via_hole_diameter: viaHoleDiameter }
        : {}),
      net_names: Array.from(netNames),
      source_net_ids: Array.from(sourceNetIds),
      source_trace_ids: Array.from(sourceTraceIds),
      source_port_ids: Array.from(sourcePortIds),
      pcb_port_ids: Array.from(pcbPortIds),
      ...(clearanceTo ? { clearance_to: clearanceTo } : {}),
      ...(subcircuitId ? { subcircuit_id: subcircuitId } : {}),
    }

    upsertCircuitElementInRoot(
      this.root,
      "source_net_class_id",
      this.source_net_class_id,
      element as unknown as AnyCircuitElement,
    )
  }

  doInitialSourcePrimitiveRender() {
    this._syncNetClassElement()
  }

  doInitialSourceAddConnectivityMapKey() {
    this._syncNetClassElement()
  }

  doInitialPcbPrimitiveRender() {
    this._syncNetClassElement()
  }
}

export class ClearanceMatrixImpl extends PrimitiveComponent<
  typeof clearanceMatrixProps
> {
  source_clearance_matrix_id: string | null = null

  get config() {
    return {
      componentName: "ClearanceMatrix",
      zodProps: clearanceMatrixProps,
    }
  }

  private _syncClearanceMatrixElement() {
    if (!this.root?.db) return
    const props = this._parsedProps as ClearanceMatrixProps
    const subcircuit = this.getSubcircuit()
    const subcircuitId = subcircuit?.subcircuit_id ?? undefined

    const defaultClearance = parseDistanceMm(props.defaultClearance)
    const matrix = normalizeMatrixInput(props)

    if (!this.source_clearance_matrix_id) {
      this.source_clearance_matrix_id = `source_clearance_matrix_${props.name ?? "default"}`
    }

    const element: SourceClearanceMatrixElement = {
      type: "source_clearance_matrix",
      source_clearance_matrix_id: this.source_clearance_matrix_id,
      ...(defaultClearance !== undefined
        ? { default_clearance: defaultClearance }
        : {}),
      matrix,
      ...(subcircuitId ? { subcircuit_id: subcircuitId } : {}),
    }

    upsertCircuitElementInRoot(
      this.root,
      "source_clearance_matrix_id",
      this.source_clearance_matrix_id,
      element as unknown as AnyCircuitElement,
    )
  }

  doInitialSourcePrimitiveRender() {
    this._syncClearanceMatrixElement()
  }

  doInitialPcbPrimitiveRender() {
    this._syncClearanceMatrixElement()
  }
}

export interface NetClassComponent {
  (props: NetClassProps): React.ReactElement
  new (props: NetClassProps): NetClassImpl
}

export interface ClearanceMatrixComponent {
  (props: ClearanceMatrixProps): React.ReactElement
  new (props: ClearanceMatrixProps): ClearanceMatrixImpl
}

export const NetClass: NetClassComponent = new Proxy(
  NetClassImpl as unknown as NetClassComponent,
  {
    apply(_target, _thisArg, argArray) {
      return React.createElement("netclass", argArray[0] ?? {})
    },
    construct(target, argArray, newTarget) {
      return Reflect.construct(target, argArray, newTarget)
    },
  },
)

export const ClearanceMatrix: ClearanceMatrixComponent = new Proxy(
  ClearanceMatrixImpl as unknown as ClearanceMatrixComponent,
  {
    apply(_target, _thisArg, argArray) {
      return React.createElement("clearancematrix", argArray[0] ?? {})
    },
    construct(target, argArray, newTarget) {
      return Reflect.construct(target, argArray, newTarget)
    },
  },
)

export const useNetClass = (
  name: string,
  props?: Omit<NetClassProps, "name">,
) => {
  return (overrideProps?: Partial<NetClassProps>) =>
    React.createElement("netclass", {
      name,
      ...props,
      ...overrideProps,
    })
}

export const useClearanceMatrix = (
  nameOrProps?: string | ClearanceMatrixProps,
  maybeProps?: ClearanceMatrixProps,
) => {
  const baseProps: ClearanceMatrixProps =
    typeof nameOrProps === "string"
      ? { name: nameOrProps, ...maybeProps }
      : (nameOrProps ?? {})
  return (overrideProps?: Partial<ClearanceMatrixProps>) =>
    React.createElement("clearancematrix", {
      ...baseProps,
      ...overrideProps,
    })
}

export interface ResolvedNetClassInfo {
  name: string
  clearance: number
  workingVoltage?: number
  traceWidth?: number
  viaDiameter?: number
  viaHoleDiameter?: number
  netNames: Set<string>
  sourceNetIds: Set<string>
  sourceTraceIds: Set<string>
  sourcePortIds: Set<string>
  pcbPortIds: Set<string>
  clearanceTo: Record<string, number>
}

export interface NetClassResolver {
  hasRules: boolean
  netClassesByName: Map<string, ResolvedNetClassInfo>
  matrix: Record<string, Record<string, number>>
  defaultClearance?: number
  getNetClassForElementId: (
    id: string | undefined,
  ) => ResolvedNetClassInfo | null
  getNetClassForPcbElement: (
    element: AnyCircuitElement,
  ) => ResolvedNetClassInfo | null
  getNetClassForSrjConnection: (connection: {
    name: string
    source_trace_id?: string
    pointsToConnect?: Array<{
      pointId?: string
      pcb_port_id?: string
      port_selector?: string
    }>
  }) => ResolvedNetClassInfo | null
  getNetClassForSrjObstacle: (obstacle: {
    obstacleId?: string
    connectedTo: string[]
    center: { x: number; y: number }
  }) => ResolvedNetClassInfo | null
  getRequiredClearanceBetweenClasses: (
    classA: ResolvedNetClassInfo | string | null | undefined,
    classB: ResolvedNetClassInfo | string | null | undefined,
    fallbackClearance: number,
  ) => number
  getRequiredClearanceBetweenElements: (
    elemA: AnyCircuitElement,
    elemB: AnyCircuitElement,
    fallbackClearance: number,
  ) => number
  getMaxRequiredClearanceForClass: (
    netClass: ResolvedNetClassInfo | null | undefined,
    fallbackClearance: number,
  ) => number
}

/**
 * Build a unified NetClass and ClearanceMatrix resolver from `CircuitJson`.
 */
export const createNetClassResolver = (
  circuitJson: AnyCircuitElement[],
  existingConnMap?: ReturnType<typeof getFullConnectivityMapFromCircuitJson>,
): NetClassResolver => {
  const connMap =
    existingConnMap ?? getFullConnectivityMapFromCircuitJson(circuitJson)

  const netClassesByName = new Map<string, ResolvedNetClassInfo>()
  const matrix: Record<string, Record<string, number>> = {}
  let matrixDefaultClearance: number | undefined

  const setMatrixPair = (a: string, b: string, val: number) => {
    matrix[a] ??= {}
    matrix[b] ??= {}
    matrix[a][b] = Math.max(matrix[a][b] ?? 0, val)
    matrix[b][a] = Math.max(matrix[b][a] ?? 0, val)
  }

  for (const el of circuitJson) {
    const raw = el as unknown as Record<string, unknown>
    if (raw.type === "source_net_class") {
      const nc = raw as unknown as SourceNetClassElement
      const existing = netClassesByName.get(nc.name)
      const info: ResolvedNetClassInfo = existing ?? {
        name: nc.name,
        clearance: nc.clearance ?? 0.15,
        workingVoltage: nc.working_voltage,
        traceWidth: nc.trace_width,
        viaDiameter: nc.via_diameter,
        viaHoleDiameter: nc.via_hole_diameter,
        netNames: new Set<string>(),
        sourceNetIds: new Set<string>(),
        sourceTraceIds: new Set<string>(),
        sourcePortIds: new Set<string>(),
        pcbPortIds: new Set<string>(),
        clearanceTo: {},
      }
      info.clearance = Math.max(info.clearance, nc.clearance ?? 0)
      if (nc.working_voltage !== undefined) {
        info.workingVoltage = nc.working_voltage
      }
      if (nc.trace_width !== undefined) {
        info.traceWidth = Math.max(info.traceWidth ?? 0, nc.trace_width)
      }
      if (nc.via_diameter !== undefined) {
        info.viaDiameter = Math.max(info.viaDiameter ?? 0, nc.via_diameter)
      }
      if (nc.via_hole_diameter !== undefined) {
        info.viaHoleDiameter = Math.max(
          info.viaHoleDiameter ?? 0,
          nc.via_hole_diameter,
        )
      }
      for (const n of nc.net_names ?? []) info.netNames.add(normalizeNetName(n))
      for (const id of nc.source_net_ids ?? []) info.sourceNetIds.add(id)
      for (const id of nc.source_trace_ids ?? []) info.sourceTraceIds.add(id)
      for (const id of nc.source_port_ids ?? []) info.sourcePortIds.add(id)
      for (const id of nc.pcb_port_ids ?? []) info.pcbPortIds.add(id)
      if (nc.clearance_to) {
        for (const [target, val] of Object.entries(nc.clearance_to)) {
          info.clearanceTo[target] = val
          setMatrixPair(nc.name, target, val)
        }
      }
      netClassesByName.set(nc.name, info)
    } else if (raw.type === "source_clearance_matrix") {
      const cm = raw as unknown as SourceClearanceMatrixElement
      if (cm.default_clearance !== undefined) {
        matrixDefaultClearance = Math.max(
          matrixDefaultClearance ?? 0,
          cm.default_clearance,
        )
      }
      if (cm.matrix) {
        for (const [classA, row] of Object.entries(cm.matrix)) {
          for (const [classB, val] of Object.entries(row)) {
            setMatrixPair(classA, classB, val)
          }
        }
      }
    }
  }

  for (const el of circuitJson) {
    if (el.type === "source_net") {
      const rawNet = el as unknown as {
        source_net_id: string
        name: string
        net_class?: string
        clearance?: number
        working_voltage?: number
        trace_width?: number
      }
      for (const info of netClassesByName.values()) {
        if (
          info.netNames.has(rawNet.name) ||
          info.netNames.has(`net.${rawNet.name}`) ||
          rawNet.net_class === info.name
        ) {
          info.sourceNetIds.add(rawNet.source_net_id)
          info.netNames.add(rawNet.name)
        }
      }
      if (rawNet.net_class && !netClassesByName.has(rawNet.net_class)) {
        const clearance =
          rawNet.clearance ??
          (rawNet.working_voltage !== undefined
            ? getClearanceFromWorkingVoltage(rawNet.working_voltage)
            : 0.15)
        netClassesByName.set(rawNet.net_class, {
          name: rawNet.net_class,
          clearance,
          workingVoltage: rawNet.working_voltage,
          traceWidth: rawNet.trace_width,
          netNames: new Set([rawNet.name]),
          sourceNetIds: new Set([rawNet.source_net_id]),
          sourceTraceIds: new Set(),
          sourcePortIds: new Set(),
          pcbPortIds: new Set(),
          clearanceTo: {},
        })
      }
    }
  }

  for (const el of circuitJson) {
    if (el.type === "source_trace") {
      for (const info of netClassesByName.values()) {
        const matchesNet = el.connected_source_net_ids?.some((id) =>
          info.sourceNetIds.has(id),
        )
        const matchesPort = el.connected_source_port_ids?.some((id) =>
          info.sourcePortIds.has(id),
        )
        if (matchesNet || matchesPort) {
          info.sourceTraceIds.add(el.source_trace_id)
          for (const portId of el.connected_source_port_ids ?? []) {
            info.sourcePortIds.add(portId)
          }
        }
      }
    }
  }

  for (const el of circuitJson) {
    if (el.type === "pcb_port" && el.source_port_id) {
      for (const info of netClassesByName.values()) {
        if (info.sourcePortIds.has(el.source_port_id)) {
          info.pcbPortIds.add(el.pcb_port_id)
        }
      }
    }
  }

  const elementIdToClass = new Map<string, ResolvedNetClassInfo>()
  const connectivityNetToClass = new Map<string, ResolvedNetClassInfo>()

  const registerIdForClass = (
    id: string | undefined,
    info: ResolvedNetClassInfo,
  ) => {
    if (!id) return
    const existing = elementIdToClass.get(id)
    if (!existing || info.clearance > existing.clearance) {
      elementIdToClass.set(id, info)
    }
    const netKey = connMap.getNetConnectedToId(id)
    if (netKey) {
      const existingNet = connectivityNetToClass.get(netKey)
      if (!existingNet || info.clearance > existingNet.clearance) {
        connectivityNetToClass.set(netKey, info)
      }
    }
  }

  for (const info of netClassesByName.values()) {
    for (const id of info.sourceNetIds) registerIdForClass(id, info)
    for (const id of info.sourceTraceIds) registerIdForClass(id, info)
    for (const id of info.sourcePortIds) registerIdForClass(id, info)
    for (const id of info.pcbPortIds) registerIdForClass(id, info)
    for (const name of info.netNames) {
      registerIdForClass(name, info)
      registerIdForClass(`net.${name}`, info)
    }
  }

  for (const el of circuitJson) {
    if (el.type === "pcb_smtpad") {
      const cls =
        (el.pcb_port_id ? elementIdToClass.get(el.pcb_port_id) : undefined) ??
        (connMap.getNetConnectedToId(el.pcb_smtpad_id)
          ? connectivityNetToClass.get(
              connMap.getNetConnectedToId(el.pcb_smtpad_id)!,
            )
          : undefined)
      if (cls) registerIdForClass(el.pcb_smtpad_id, cls)
    } else if (el.type === "pcb_plated_hole") {
      const cls =
        (el.pcb_port_id ? elementIdToClass.get(el.pcb_port_id) : undefined) ??
        (connMap.getNetConnectedToId(el.pcb_plated_hole_id)
          ? connectivityNetToClass.get(
              connMap.getNetConnectedToId(el.pcb_plated_hole_id)!,
            )
          : undefined)
      if (cls) registerIdForClass(el.pcb_plated_hole_id, cls)
    } else if (el.type === "pcb_trace") {
      let cls =
        (el.source_trace_id
          ? elementIdToClass.get(el.source_trace_id)
          : undefined) ??
        (connMap.getNetConnectedToId(el.pcb_trace_id)
          ? connectivityNetToClass.get(
              connMap.getNetConnectedToId(el.pcb_trace_id)!,
            )
          : undefined)
      if (!cls) {
        for (const pt of el.route) {
          if (pt.route_type === "wire") {
            const pId = pt.start_pcb_port_id ?? pt.end_pcb_port_id
            if (pId) {
              const found =
                elementIdToClass.get(pId) ??
                (connMap.getNetConnectedToId(pId)
                  ? connectivityNetToClass.get(
                      connMap.getNetConnectedToId(pId)!,
                    )
                  : undefined)
              if (found) {
                cls = found
                break
              }
            }
          }
        }
      }
      if (cls) registerIdForClass(el.pcb_trace_id, cls)
    }
  }

  const pcbTraces = circuitJson.filter(
    (el): el is Extract<AnyCircuitElement, { type: "pcb_trace" }> =>
      el.type === "pcb_trace",
  )

  for (const el of circuitJson) {
    if (el.type === "pcb_via") {
      const viaRaw = el as unknown as {
        pcb_via_id: string
        pcb_trace_id?: string
        subcircuit_connectivity_map_key?: string
        x: number
        y: number
      }
      let cls =
        (viaRaw.pcb_trace_id
          ? elementIdToClass.get(viaRaw.pcb_trace_id)
          : undefined) ??
        (connMap.getNetConnectedToId(viaRaw.pcb_via_id)
          ? connectivityNetToClass.get(
              connMap.getNetConnectedToId(viaRaw.pcb_via_id)!,
            )
          : undefined)
      if (!cls && viaRaw.subcircuit_connectivity_map_key) {
        cls = connectivityNetToClass.get(viaRaw.subcircuit_connectivity_map_key)
      }
      if (!cls) {
        for (const tr of pcbTraces) {
          const trClass = elementIdToClass.get(tr.pcb_trace_id)
          if (!trClass) continue
          const touches = tr.route.some(
            (pt) =>
              "x" in pt &&
              "y" in pt &&
              Math.hypot(pt.x - viaRaw.x, pt.y - viaRaw.y) <= 1e-2,
          )
          if (touches) {
            cls = trClass
            break
          }
        }
      }
      if (cls) registerIdForClass(viaRaw.pcb_via_id, cls)
    }
  }

  const getNetClassForElementId = (
    id: string | undefined,
  ): ResolvedNetClassInfo | null => {
    if (!id) return null
    const direct = elementIdToClass.get(id)
    if (direct) return direct
    const netKey = connMap.getNetConnectedToId(id)
    if (netKey) {
      const byNet = connectivityNetToClass.get(netKey)
      if (byNet) return byNet
    }
    const normalized = normalizeNetName(id)
    for (const info of netClassesByName.values()) {
      if (info.netNames.has(normalized)) return info
      for (const knownId of [
        ...info.sourceNetIds,
        ...info.sourceTraceIds,
        ...info.sourcePortIds,
        ...info.pcbPortIds,
      ]) {
        if (connMap.areIdsConnected(id, knownId)) {
          return info
        }
      }
    }
    return null
  }

  const getNetClassForPcbElement = (
    element: AnyCircuitElement,
  ): ResolvedNetClassInfo | null => {
    if (element.type === "pcb_smtpad") {
      return (
        getNetClassForElementId(element.pcb_smtpad_id) ??
        getNetClassForElementId(element.pcb_port_id)
      )
    }
    if (element.type === "pcb_plated_hole") {
      return (
        getNetClassForElementId(element.pcb_plated_hole_id) ??
        getNetClassForElementId(element.pcb_port_id)
      )
    }
    if (element.type === "pcb_via") {
      const viaRaw = element as unknown as {
        pcb_via_id: string
        pcb_trace_id?: string
      }
      return (
        getNetClassForElementId(viaRaw.pcb_via_id) ??
        getNetClassForElementId(viaRaw.pcb_trace_id)
      )
    }
    if (element.type === "pcb_trace") {
      return (
        getNetClassForElementId(element.pcb_trace_id) ??
        getNetClassForElementId(element.source_trace_id)
      )
    }
    return null
  }

  const getNetClassForSrjConnection = (connection: {
    name: string
    source_trace_id?: string
    pointsToConnect?: Array<{
      pointId?: string
      pcb_port_id?: string
      port_selector?: string
    }>
  }): ResolvedNetClassInfo | null => {
    const byName =
      getNetClassForElementId(connection.name) ??
      getNetClassForElementId(connection.source_trace_id)
    if (byName) return byName
    for (const pt of connection.pointsToConnect ?? []) {
      const byPt =
        getNetClassForElementId(pt.pcb_port_id) ??
        getNetClassForElementId(pt.pointId)
      if (byPt) return byPt
    }
    return null
  }

  const getNetClassForSrjObstacle = (obstacle: {
    obstacleId?: string
    connectedTo: string[]
    center: { x: number; y: number }
  }): ResolvedNetClassInfo | null => {
    if (obstacle.obstacleId) {
      const byObsId = getNetClassForElementId(obstacle.obstacleId)
      if (byObsId) return byObsId
    }
    for (const id of obstacle.connectedTo ?? []) {
      const byConnId = getNetClassForElementId(id)
      if (byConnId) return byConnId
    }
    return null
  }

  const lookupMatrixEntry = (
    nameA: string,
    nameB: string,
  ): number | undefined => {
    const direct = matrix[nameA]?.[nameB] ?? matrix[nameB]?.[nameA]
    if (direct !== undefined) return direct
    for (const wildcard of ["DEFAULT", "default", "*"]) {
      if (nameB === "DEFAULT") {
        const wildA = matrix[nameA]?.[wildcard] ?? matrix[wildcard]?.[nameA]
        if (wildA !== undefined) return wildA
      }
      if (nameA === "DEFAULT") {
        const wildB = matrix[nameB]?.[wildcard] ?? matrix[wildcard]?.[nameB]
        if (wildB !== undefined) return wildB
      }
    }
    return undefined
  }

  const getRequiredClearanceBetweenClasses = (
    classA: ResolvedNetClassInfo | string | null | undefined,
    classB: ResolvedNetClassInfo | string | null | undefined,
    fallbackClearance: number,
  ): number => {
    const infoA =
      typeof classA === "string"
        ? (netClassesByName.get(classA) ?? null)
        : (classA ?? null)
    const infoB =
      typeof classB === "string"
        ? (netClassesByName.get(classB) ?? null)
        : (classB ?? null)
    const nameA =
      typeof classA === "string" ? classA : (infoA?.name ?? "DEFAULT")
    const nameB =
      typeof classB === "string" ? classB : (infoB?.name ?? "DEFAULT")

    const matrixVal = lookupMatrixEntry(nameA, nameB)
    if (matrixVal !== undefined) {
      return matrixVal
    }

    const baseDefault = matrixDefaultClearance ?? fallbackClearance
    return Math.max(infoA?.clearance ?? 0, infoB?.clearance ?? 0, baseDefault)
  }

  const getRequiredClearanceBetweenElements = (
    elemA: AnyCircuitElement,
    elemB: AnyCircuitElement,
    fallbackClearance: number,
  ): number => {
    const classA = getNetClassForPcbElement(elemA)
    const classB = getNetClassForPcbElement(elemB)
    return getRequiredClearanceBetweenClasses(classA, classB, fallbackClearance)
  }

  const getMaxRequiredClearanceForClass = (
    netClass: ResolvedNetClassInfo | null | undefined,
    fallbackClearance: number,
  ): number => {
    if (!netClass) return matrixDefaultClearance ?? fallbackClearance
    let maxClearance = Math.max(
      netClass.clearance,
      matrixDefaultClearance ?? fallbackClearance,
    )
    for (const otherClass of netClassesByName.values()) {
      maxClearance = Math.max(
        maxClearance,
        getRequiredClearanceBetweenClasses(
          netClass,
          otherClass,
          fallbackClearance,
        ),
      )
    }
    maxClearance = Math.max(
      maxClearance,
      getRequiredClearanceBetweenClasses(
        netClass,
        "DEFAULT",
        fallbackClearance,
      ),
    )
    return maxClearance
  }

  const hasRules =
    netClassesByName.size > 0 ||
    Object.keys(matrix).length > 0 ||
    matrixDefaultClearance !== undefined

  return {
    hasRules,
    netClassesByName,
    matrix,
    defaultClearance: matrixDefaultClearance,
    getNetClassForElementId,
    getNetClassForPcbElement,
    getNetClassForSrjConnection,
    getNetClassForSrjObstacle,
    getRequiredClearanceBetweenClasses,
    getRequiredClearanceBetweenElements,
    getMaxRequiredClearanceForClass,
  }
}

interface SrjPointToConnect {
  x: number
  y: number
  layer?: string
  layers?: string[]
  pointId?: string
  pcb_port_id?: string
  port_selector?: string
}

interface SrjConnection {
  name: string
  source_trace_id?: string
  nominalTraceWidth?: number
  width?: number
  netClassName?: string
  clearance?: number
  viaDiameter?: number
  viaHoleDiameter?: number
  pointsToConnect: SrjPointToConnect[]
  externallyConnectedPointIds?: string[][]
}

interface SrjObstacle {
  type: "rect"
  obstacleId?: string
  layers: string[]
  center: { x: number; y: number }
  width: number
  height: number
  connectedTo: string[]
  offBoardConnectsTo?: string[]
  netIsAssignable?: boolean
  isCopperPour?: boolean
  _isNetClassClearanceHalo?: boolean
}

interface SrjTraceRoutePoint {
  route_type: "wire" | "via" | "through_obstacle" | "jumper"
  x: number
  y: number
  width?: number
  layer?: string
  from_layer?: string
  to_layer?: string
  via_diameter?: number
  via_hole_diameter?: number
  start_pcb_port_id?: string
  end_pcb_port_id?: string
}

interface SrjTrace {
  type: "pcb_trace"
  pcb_trace_id: string
  connection_name?: string
  source_trace_id?: string
  connectsTo?: string[]
  route: SrjTraceRoutePoint[]
}

export interface SimpleRouteJsonWithNetClasses {
  layerCount: number
  minTraceWidth: number
  nominalTraceWidth?: number
  defaultObstacleMargin?: number
  minTraceToPadEdgeClearance?: number
  minTraceToHoleEdgeClearance?: number
  minViaEdgeToPadEdgeClearance?: number
  minViaHoleEdgeToViaHoleEdgeClearance?: number
  minPadEdgeToPadEdgeClearance?: number
  minViaDiameter?: number
  minViaPadDiameter?: number
  minViaHoleDiameter?: number
  min_via_pad_diameter?: number
  min_via_hole_diameter?: number
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
  obstacles: SrjObstacle[]
  connections: SrjConnection[]
  traces?: SrjTrace[]
  netClasses?: Array<{
    name: string
    clearance: number
    workingVoltage?: number
    traceWidth?: number
    viaDiameter?: number
    viaHoleDiameter?: number
    nets: string[]
  }>
  clearanceMatrix?: Record<string, Record<string, number>>
}

const cloneDeep = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const computeSafeHaloMarginForObstacle = (
  obstacle: SrjObstacle,
  desiredExtraMargin: number,
  allConnectionPoints: Array<{
    x: number
    y: number
    layers: string[]
    connectionName: string
    pointId?: string
    pcb_port_id?: string
  }>,
  connMap: ReturnType<typeof getFullConnectivityMapFromCircuitJson>,
): number => {
  if (desiredExtraMargin <= 1e-4) return 0
  let safeExtraMargin = desiredExtraMargin
  const halfW = obstacle.width / 2
  const halfH = obstacle.height / 2

  for (const pt of allConnectionPoints) {
    const sharesLayer = pt.layers.some((l) => obstacle.layers.includes(l))
    if (!sharesLayer) continue
    const isSameNet = obstacle.connectedTo.some(
      (id) =>
        id === pt.connectionName ||
        id === pt.pointId ||
        id === pt.pcb_port_id ||
        connMap.areIdsConnected(id, pt.connectionName) ||
        (pt.pointId ? connMap.areIdsConnected(id, pt.pointId) : false) ||
        (pt.pcb_port_id ? connMap.areIdsConnected(id, pt.pcb_port_id) : false),
    )
    if (isSameNet) continue

    const dx = Math.max(0, Math.abs(pt.x - obstacle.center.x) - halfW)
    const dy = Math.max(0, Math.abs(pt.y - obstacle.center.y) - halfH)
    const boxEdgeDist = Math.hypot(dx, dy)
    const maxAllowedMargin =
      boxEdgeDist < 1.4 ? 0 : Math.max(0, boxEdgeDist - 0.55)
    safeExtraMargin = Math.min(safeExtraMargin, maxAllowedMargin)
  }

  return Math.max(0, safeExtraMargin)
}

/**
 * Mutate a `SimpleRouteJson` in-place to apply NetClass trace widths, via rules,
 * obstacle clearance halos, and attach `netClasses` + `clearanceMatrix` metadata.
 */
export const applyNetClassesToSimpleRouteJson = (
  simpleRouteJson: SimpleRouteJsonWithNetClasses,
  circuitJson: AnyCircuitElement[],
): SimpleRouteJsonWithNetClasses => {
  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const resolver = createNetClassResolver(circuitJson, connMap)
  if (!resolver.hasRules) return simpleRouteJson

  simpleRouteJson.netClasses = Array.from(
    resolver.netClassesByName.values(),
  ).map((nc) => ({
    name: nc.name,
    clearance: nc.clearance,
    ...(nc.workingVoltage !== undefined
      ? { workingVoltage: nc.workingVoltage }
      : {}),
    ...(nc.traceWidth !== undefined ? { traceWidth: nc.traceWidth } : {}),
    ...(nc.viaDiameter !== undefined ? { viaDiameter: nc.viaDiameter } : {}),
    ...(nc.viaHoleDiameter !== undefined
      ? { viaHoleDiameter: nc.viaHoleDiameter }
      : {}),
    nets: Array.from(nc.netNames),
  }))
  simpleRouteJson.clearanceMatrix = resolver.matrix

  const baseMargin =
    simpleRouteJson.minTraceToPadEdgeClearance ??
    simpleRouteJson.defaultObstacleMargin ??
    0.15

  for (const conn of simpleRouteJson.connections) {
    const nc = resolver.getNetClassForSrjConnection(conn)
    if (!nc) continue
    conn.netClassName = nc.name
    conn.clearance = resolver.getMaxRequiredClearanceForClass(nc, baseMargin)
    if (nc.traceWidth !== undefined) {
      conn.nominalTraceWidth = Math.max(
        conn.nominalTraceWidth ?? 0,
        nc.traceWidth,
      )
      conn.width = Math.max(conn.width ?? 0, nc.traceWidth)
    }
    if (nc.viaDiameter !== undefined) {
      conn.viaDiameter = nc.viaDiameter
    }
    if (nc.viaHoleDiameter !== undefined) {
      conn.viaHoleDiameter = nc.viaHoleDiameter
    }
  }

  simpleRouteJson.obstacles = simpleRouteJson.obstacles.filter(
    (obs) => !obs._isNetClassClearanceHalo,
  )

  const allConnectionPoints = simpleRouteJson.connections.flatMap((conn) =>
    conn.pointsToConnect.map((pt) => ({
      x: pt.x,
      y: pt.y,
      layers: pt.layers ?? (pt.layer ? [pt.layer] : ["top"]),
      connectionName: conn.name,
      pointId: pt.pointId,
      pcb_port_id: pt.pcb_port_id,
    })),
  )

  const activeConnectionClasses = new Set<ResolvedNetClassInfo | null>()
  for (const conn of simpleRouteJson.connections) {
    activeConnectionClasses.add(resolver.getNetClassForSrjConnection(conn))
  }

  let maxActiveTraceWidth = 0.15
  for (const conn of simpleRouteJson.connections) {
    maxActiveTraceWidth = Math.max(
      maxActiveTraceWidth,
      conn.width ?? conn.nominalTraceWidth ?? 0.15,
    )
  }

  const haloObstacles: SrjObstacle[] = []
  for (const obs of simpleRouteJson.obstacles) {
    if (obs.isCopperPour) continue
    const obsClass = resolver.getNetClassForSrjObstacle(obs)
    let requiredClearance = baseMargin
    if (activeConnectionClasses.size > 0) {
      for (const connClass of activeConnectionClasses) {
        requiredClearance = Math.max(
          requiredClearance,
          resolver.getRequiredClearanceBetweenClasses(
            obsClass,
            connClass,
            baseMargin,
          ),
        )
      }
    } else if (obsClass) {
      requiredClearance = Math.max(
        requiredClearance,
        resolver.getMaxRequiredClearanceForClass(obsClass, baseMargin),
      )
    }

    if (requiredClearance <= baseMargin + 1e-4) continue
    const desiredExtra = requiredClearance + maxActiveTraceWidth / 2 + 0.25
    if (desiredExtra <= 1e-4) continue

    const safeExtra = computeSafeHaloMarginForObstacle(
      obs,
      desiredExtra,
      allConnectionPoints,
      connMap,
    )
    if (safeExtra <= 1e-4) continue

    haloObstacles.push({
      type: "rect",
      obstacleId: `${obs.obstacleId ?? "obs"}_netclass_halo`,
      layers: [...obs.layers],
      center: { x: obs.center.x, y: obs.center.y },
      width: obs.width + 2 * safeExtra,
      height: obs.height + 2 * safeExtra,
      connectedTo: [...obs.connectedTo],
      ...(obs.offBoardConnectsTo
        ? { offBoardConnectsTo: [...obs.offBoardConnectsTo] }
        : {}),
      _isNetClassClearanceHalo: true,
    })
  }

  if (haloObstacles.length > 0) {
    simpleRouteJson.obstacles.push(...haloObstacles)
    for (const halo of haloObstacles) {
      simpleRouteJson.bounds = {
        minX: Math.min(
          simpleRouteJson.bounds.minX,
          halo.center.x - halo.width / 2 - 1,
        ),
        maxX: Math.max(
          simpleRouteJson.bounds.maxX,
          halo.center.x + halo.width / 2 + 1,
        ),
        minY: Math.min(
          simpleRouteJson.bounds.minY,
          halo.center.y - halo.height / 2 - 1,
        ),
        maxY: Math.max(
          simpleRouteJson.bounds.maxY,
          halo.center.y + halo.height / 2 + 1,
        ),
      }
    }
  }

  return simpleRouteJson
}

const createTraceSegmentHaloObstacles = (
  trace: SrjTrace,
  clearanceMargin: number,
  allLayerNames: string[],
): SrjObstacle[] => {
  if (clearanceMargin <= 1e-4) return []
  const obstacles: SrjObstacle[] = []
  const connectedIds = [
    ...(trace.connection_name ? [trace.connection_name] : []),
    ...(trace.source_trace_id ? [trace.source_trace_id] : []),
    ...(trace.connectsTo ?? []),
  ]

  for (let i = 0; i < trace.route.length; i++) {
    const pt = trace.route[i]
    if (pt.route_type === "via") {
      const viaDia = pt.via_diameter ?? 0.6
      obstacles.push({
        type: "rect",
        obstacleId: `${trace.pcb_trace_id}_via_${i}_halo`,
        layers: allLayerNames,
        center: { x: pt.x, y: pt.y },
        width: viaDia + 2 * clearanceMargin,
        height: viaDia + 2 * clearanceMargin,
        connectedTo: connectedIds,
        _isNetClassClearanceHalo: true,
      })
    }
    if (i < trace.route.length - 1) {
      const next = trace.route[i + 1]
      if (pt.route_type === "wire" && next.route_type === "wire") {
        const layer = pt.layer ?? next.layer ?? "top"
        const width = Math.max(pt.width ?? 0.15, next.width ?? 0.15)
        const dx = next.x - pt.x
        const dy = next.y - pt.y
        const segLen = Math.hypot(dx, dy)
        if (Math.abs(dx) <= 1e-4 || Math.abs(dy) <= 1e-4 || segLen <= 0.5) {
          obstacles.push({
            type: "rect",
            obstacleId: `${trace.pcb_trace_id}_seg_${i}_halo`,
            layers: [layer],
            center: { x: (pt.x + next.x) / 2, y: (pt.y + next.y) / 2 },
            width: Math.abs(dx) + width + 2 * clearanceMargin,
            height: Math.abs(dy) + width + 2 * clearanceMargin,
            connectedTo: connectedIds,
            _isNetClassClearanceHalo: true,
          })
        } else {
          const stepSize = Math.max(0.4, clearanceMargin / 2)
          const steps = Math.max(2, Math.ceil(segLen / stepSize))
          for (let s = 0; s <= steps; s++) {
            const t = s / steps
            obstacles.push({
              type: "rect",
              obstacleId: `${trace.pcb_trace_id}_seg_${i}_${s}_halo`,
              layers: [layer],
              center: { x: pt.x + dx * t, y: pt.y + dy * t },
              width: width + 2 * clearanceMargin,
              height: width + 2 * clearanceMargin,
              connectedTo: connectedIds,
              _isNetClassClearanceHalo: true,
            })
          }
        }
      }
    }
  }

  return obstacles
}

const applyConnectionRulesToRoutedTraces = (
  traces: SrjTrace[],
  connections: SrjConnection[],
): SrjTrace[] => {
  const connByName = new Map<string, SrjConnection>()
  for (const conn of connections) {
    connByName.set(conn.name, conn)
    if (conn.source_trace_id) connByName.set(conn.source_trace_id, conn)
  }

  return traces.map((trace) => {
    const conn =
      (trace.connection_name
        ? connByName.get(trace.connection_name)
        : undefined) ??
      (trace.source_trace_id
        ? connByName.get(trace.source_trace_id)
        : undefined)
    if (!conn) return trace
    const route = trace.route.map((pt) => {
      if (pt.route_type === "wire" && conn.width !== undefined) {
        return {
          ...pt,
          width: Math.max(pt.width ?? 0, conn.width),
        }
      }
      if (pt.route_type === "via") {
        return {
          ...pt,
          ...(conn.viaDiameter !== undefined
            ? { via_diameter: conn.viaDiameter }
            : {}),
          ...(conn.viaHoleDiameter !== undefined
            ? { via_hole_diameter: conn.viaHoleDiameter }
            : {}),
        }
      }
      return pt
    })
    return { ...trace, route }
  })
}

class NetClassStagedAutorouter {
  private inputSrj: SimpleRouteJsonWithNetClasses
  private circuitJson: AnyCircuitElement[]
  private eventHandlers: {
    complete: Array<(ev: { type: "complete"; traces: SrjTrace[] }) => void>
    error: Array<(ev: { type: "error"; error: Error }) => void>
    progress: Array<(ev: Record<string, unknown>) => void>
  } = {
    complete: [],
    error: [],
    progress: [],
  }
  solver: { getOutputJumpers?: () => unknown[] } = {}
  private outputSrj: SimpleRouteJsonWithNetClasses | null = null

  constructor(
    inputSrj: SimpleRouteJsonWithNetClasses,
    circuitJson: AnyCircuitElement[],
  ) {
    this.inputSrj = inputSrj
    this.circuitJson = circuitJson
  }

  on(event: "complete" | "error" | "progress", cb: (ev: never) => void): void {
    if (event === "complete") {
      this.eventHandlers.complete.push(cb as never)
    } else if (event === "error") {
      this.eventHandlers.error.push(cb as never)
    } else if (event === "progress") {
      this.eventHandlers.progress.push(cb as never)
    }
  }

  start(): void {
    try {
      const traces = this.solveSync()
      for (const handler of this.eventHandlers.complete) {
        handler({ type: "complete", traces })
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      for (const handler of this.eventHandlers.error) {
        handler({ type: "error", error })
      }
    }
  }

  stop(): void {}

  getOutputSimpleRouteJson(): SimpleRouteJsonWithNetClasses | undefined {
    return this.outputSrj ?? undefined
  }

  solveSync(): SrjTrace[] {
    const connMap = getFullConnectivityMapFromCircuitJson(this.circuitJson)
    const resolver = createNetClassResolver(this.circuitJson, connMap)
    applyNetClassesToSimpleRouteJson(this.inputSrj, this.circuitJson)

    const baseMargin =
      this.inputSrj.minTraceToPadEdgeClearance ??
      this.inputSrj.defaultObstacleMargin ??
      0.15

    const connectionsWithClass = this.inputSrj.connections.map((conn) => {
      const nc = resolver.getNetClassForSrjConnection(conn)
      const classKey = nc?.name ?? "__DEFAULT__"
      const ownClearance = nc?.clearance ?? baseMargin
      const maxClearance = resolver.getMaxRequiredClearanceForClass(
        nc,
        baseMargin,
      )
      return { conn, nc, classKey, ownClearance, maxClearance }
    })

    const distinctClassKeys = Array.from(
      new Set(connectionsWithClass.map((c) => c.classKey)),
    ).sort((keyA, keyB) => {
      const itemA = connectionsWithClass.find((c) => c.classKey === keyA)!
      const itemB = connectionsWithClass.find((c) => c.classKey === keyB)!
      if (Math.abs(itemB.ownClearance - itemA.ownClearance) > 1e-4) {
        return itemB.ownClearance - itemA.ownClearance
      }
      return itemB.maxClearance - itemA.maxClearance
    })

    const allLayerNames =
      this.inputSrj.layerCount <= 1
        ? ["top"]
        : this.inputSrj.layerCount === 2
          ? ["top", "bottom"]
          : [
              "top",
              ...Array.from(
                { length: this.inputSrj.layerCount - 2 },
                (_, idx) => `inner${idx + 1}`,
              ),
              "bottom",
            ]

    if (distinctClassKeys.length > 1 && this.inputSrj.connections.length > 1) {
      try {
        const accumulatedTraces: Array<{
          trace: SrjTrace
          nc: ResolvedNetClassInfo | null
        }> = []
        const baseRealObstacles = this.inputSrj.obstacles.filter(
          (o) => !o._isNetClassClearanceHalo,
        )

        for (const tierClassKey of distinctClassKeys) {
          const tierItems = connectionsWithClass.filter(
            (c) => c.classKey === tierClassKey,
          )
          if (tierItems.length === 0) continue

          const stageSrj: SimpleRouteJsonWithNetClasses = {
            ...cloneDeep(this.inputSrj),
            obstacles: cloneDeep(baseRealObstacles),
            connections: cloneDeep(tierItems.map((t) => t.conn)),
          }
          applyNetClassesToSimpleRouteJson(stageSrj, this.circuitJson)

          const tierConnectionPoints = stageSrj.connections.flatMap((conn) =>
            conn.pointsToConnect.map((pt) => ({
              x: pt.x,
              y: pt.y,
              layers: pt.layers ?? (pt.layer ? [pt.layer] : ["top"]),
              connectionName: conn.name,
              pointId: pt.pointId,
              pcb_port_id: pt.pcb_port_id,
            })),
          )

          for (const prev of accumulatedTraces) {
            let maxPairwise = baseMargin
            let maxTierTraceWidth = 0.15
            for (const item of tierItems) {
              maxPairwise = Math.max(
                maxPairwise,
                resolver.getRequiredClearanceBetweenClasses(
                  prev.nc,
                  item.nc,
                  baseMargin,
                ),
              )
              maxTierTraceWidth = Math.max(
                maxTierTraceWidth,
                item.nc?.traceWidth ?? item.conn.width ?? 0.15,
              )
            }
            const extraMargin = Math.max(0, maxPairwise + maxTierTraceWidth / 2)
            const segHalos = createTraceSegmentHaloObstacles(
              prev.trace,
              extraMargin,
              allLayerNames,
            )
            for (const segHalo of segHalos) {
              const baseSegObs: SrjObstacle = {
                ...segHalo,
                width: Math.max(0.1, segHalo.width - 2 * extraMargin),
                height: Math.max(0.1, segHalo.height - 2 * extraMargin),
              }
              const safeMargin = computeSafeHaloMarginForObstacle(
                baseSegObs,
                extraMargin,
                tierConnectionPoints,
                connMap,
              )
              if (safeMargin > 1e-4) {
                const trim = extraMargin - safeMargin
                stageSrj.obstacles.push({
                  ...segHalo,
                  width: Math.max(0.1, segHalo.width - 2 * trim),
                  height: Math.max(0.1, segHalo.height - 2 * trim),
                })
              }
            }
          }

          const SolverClass =
            AutoroutingPipelineSolver9_PreloadedTraceGraph as unknown as new (
              srj: SimpleRouteJsonWithNetClasses,
            ) => {
              solve: () => void
              failed: boolean
              error?: string
              getOutputSimplifiedPcbTraces: () => SrjTrace[]
            }
          const stageSolver = new SolverClass(stageSrj)
          stageSolver.solve()
          if (stageSolver.failed) {
            throw new Error(stageSolver.error ?? "Tiered autorouting failed")
          }
          const stageTraces = applyConnectionRulesToRoutedTraces(
            stageSolver.getOutputSimplifiedPcbTraces(),
            stageSrj.connections,
          )
          for (const tr of stageTraces) {
            const matchedItem = tierItems.find(
              (item) =>
                item.conn.name === tr.connection_name ||
                item.conn.source_trace_id === tr.connection_name,
            )
            accumulatedTraces.push({
              trace: tr,
              nc: matchedItem?.nc ?? tierItems[0].nc,
            })
          }
        }

        const finalTraces = accumulatedTraces.map((a) => a.trace)
        this.inputSrj.obstacles = this.inputSrj.obstacles.filter(
          (o) => !o._isNetClassClearanceHalo,
        )
        this.outputSrj = {
          ...this.inputSrj,
          traces: finalTraces,
        }
        return finalTraces
      } catch {
        // Fallback to single-pass with obstacle halos below
      }
    }

    const SolverClass =
      AutoroutingPipelineSolver9_PreloadedTraceGraph as unknown as new (
        srj: SimpleRouteJsonWithNetClasses,
      ) => {
        solve: () => void
        failed: boolean
        error?: string
        getOutputSimplifiedPcbTraces: () => SrjTrace[]
      }
    const solver = new SolverClass(cloneDeep(this.inputSrj))
    solver.solve()
    this.inputSrj.obstacles = this.inputSrj.obstacles.filter(
      (o) => !o._isNetClassClearanceHalo,
    )
    if (solver.failed) {
      throw new Error(solver.error ?? "Autorouting failed")
    }
    const traces = applyConnectionRulesToRoutedTraces(
      solver.getOutputSimplifiedPcbTraces(),
      this.inputSrj.connections,
    )
    this.outputSrj = {
      ...this.inputSrj,
      traces,
    }
    return traces
  }
}

interface PadShapeInfo {
  element: AnyCircuitElement
  id: string
  pcbComponentId?: string
  x: number
  y: number
  width: number
  height: number
  isCircle: boolean
  radius: number
  layers: string[]
}

const extractPadsFromCircuitJson = (
  circuitJson: AnyCircuitElement[],
): PadShapeInfo[] => {
  const board = circuitJson.find((el) => el.type === "pcb_board") as
    | { num_layers?: number }
    | undefined
  const numLayers = board?.num_layers ?? 2
  const allLayers = numLayers <= 1 ? ["top"] : ["top", "bottom"]

  const pads: PadShapeInfo[] = []
  for (const el of circuitJson) {
    if (el.type === "pcb_smtpad") {
      if (el.shape === "circle") {
        pads.push({
          element: el,
          id: el.pcb_smtpad_id,
          pcbComponentId: el.pcb_component_id,
          x: el.x,
          y: el.y,
          width: el.radius * 2,
          height: el.radius * 2,
          isCircle: true,
          radius: el.radius,
          layers: [el.layer],
        })
      } else if ("width" in el && "height" in el) {
        pads.push({
          element: el,
          id: el.pcb_smtpad_id,
          pcbComponentId: el.pcb_component_id,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          isCircle: false,
          radius: Math.hypot(el.width, el.height) / 2,
          layers: [el.layer],
        })
      }
    } else if (el.type === "pcb_plated_hole") {
      if (el.shape === "circle") {
        pads.push({
          element: el,
          id: el.pcb_plated_hole_id,
          pcbComponentId: el.pcb_component_id,
          x: el.x,
          y: el.y,
          width: el.outer_diameter,
          height: el.outer_diameter,
          isCircle: true,
          radius: el.outer_diameter / 2,
          layers: el.layers ?? allLayers,
        })
      } else if ("outer_width" in el && "outer_height" in el) {
        pads.push({
          element: el,
          id: el.pcb_plated_hole_id,
          pcbComponentId: el.pcb_component_id,
          x: el.x,
          y: el.y,
          width: el.outer_width,
          height: el.outer_height,
          isCircle: false,
          radius: Math.hypot(el.outer_width, el.outer_height) / 2,
          layers: el.layers ?? allLayers,
        })
      }
    }
  }
  return pads
}

const computePointToRectGap = (
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): number => {
  const dx = Math.max(0, Math.abs(px - rx) - rw / 2)
  const dy = Math.max(0, Math.abs(py - ry) - rh / 2)
  return Math.hypot(dx, dy)
}

const computePadToPadEdgeGap = (a: PadShapeInfo, b: PadShapeInfo): number => {
  if (a.isCircle && b.isCircle) {
    return Math.hypot(a.x - b.x, a.y - b.y) - a.radius - b.radius
  }
  if (a.isCircle && !b.isCircle) {
    return (
      computePointToRectGap(a.x, a.y, b.x, b.y, b.width, b.height) - a.radius
    )
  }
  if (!a.isCircle && b.isCircle) {
    return (
      computePointToRectGap(b.x, b.y, a.x, a.y, a.width, a.height) - b.radius
    )
  }
  const dx = Math.max(0, Math.abs(a.x - b.x) - (a.width + b.width) / 2)
  const dy = Math.max(0, Math.abs(a.y - b.y) - (a.height + b.height) / 2)
  return Math.hypot(dx, dy)
}

const pointToSegmentDistAndClosest = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { dist: number; cx: number; cy: number } => {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq <= 1e-12) {
    return { dist: Math.hypot(px - x1, py - y1), cx: x1, cy: y1 }
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq))
  const cx = x1 + t * dx
  const cy = y1 + t * dy
  return { dist: Math.hypot(px - cx, py - cy), cx, cy }
}

const segmentsIntersect = (
  ax1: number,
  ay1: number,
  ax2: number,
  ay2: number,
  bx1: number,
  by1: number,
  bx2: number,
  by2: number,
): boolean => {
  const ccw = (
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    p3x: number,
    p3y: number,
  ) => (p3y - p1y) * (p2x - p1x) > (p2y - p1y) * (p3x - p1x)
  return (
    ccw(ax1, ay1, bx1, by1, bx2, by2) !== ccw(ax2, ay2, bx1, by1, bx2, by2) &&
    ccw(ax1, ay1, ax2, ay2, bx1, by1) !== ccw(ax1, ay1, ax2, ay2, bx2, by2)
  )
}

const segmentToSegmentDistAndMidpoint = (
  ax1: number,
  ay1: number,
  ax2: number,
  ay2: number,
  bx1: number,
  by1: number,
  bx2: number,
  by2: number,
): { dist: number; center: { x: number; y: number } } => {
  if (segmentsIntersect(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2)) {
    return {
      dist: 0,
      center: {
        x: (ax1 + ax2 + bx1 + bx2) / 4,
        y: (ay1 + ay2 + by1 + by2) / 4,
      },
    }
  }
  const c1 = pointToSegmentDistAndClosest(ax1, ay1, bx1, by1, bx2, by2)
  const c2 = pointToSegmentDistAndClosest(ax2, ay2, bx1, by1, bx2, by2)
  const c3 = pointToSegmentDistAndClosest(bx1, by1, ax1, ay1, ax2, ay2)
  const c4 = pointToSegmentDistAndClosest(bx2, by2, ax1, ay1, ax2, ay2)

  let best = {
    dist: c1.dist,
    center: { x: (ax1 + c1.cx) / 2, y: (ay1 + c1.cy) / 2 },
  }
  if (c2.dist < best.dist) {
    best = {
      dist: c2.dist,
      center: { x: (ax2 + c2.cx) / 2, y: (ay2 + c2.cy) / 2 },
    }
  }
  if (c3.dist < best.dist) {
    best = {
      dist: c3.dist,
      center: { x: (bx1 + c3.cx) / 2, y: (by1 + c3.cy) / 2 },
    }
  }
  if (c4.dist < best.dist) {
    best = {
      dist: c4.dist,
      center: { x: (bx2 + c4.cx) / 2, y: (by2 + c4.cy) / 2 },
    }
  }
  return best
}

const computeSegmentToPadEdgeGap = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segWidth: number,
  pad: PadShapeInfo,
): { gap: number; center: { x: number; y: number } } => {
  if (pad.isCircle) {
    const { dist, cx, cy } = pointToSegmentDistAndClosest(
      pad.x,
      pad.y,
      x1,
      y1,
      x2,
      y2,
    )
    return {
      gap: dist - pad.radius - segWidth / 2,
      center: { x: (pad.x + cx) / 2, y: (pad.y + cy) / 2 },
    }
  }
  const left = pad.x - pad.width / 2
  const right = pad.x + pad.width / 2
  const bottom = pad.y - pad.height / 2
  const top = pad.y + pad.height / 2

  const pointInside = (px: number, py: number) =>
    px >= left && px <= right && py >= bottom && py <= top
  if (pointInside(x1, y1) || pointInside(x2, y2)) {
    return { gap: -segWidth / 2, center: { x: pad.x, y: pad.y } }
  }

  const edges: Array<[number, number, number, number]> = [
    [left, bottom, right, bottom],
    [right, bottom, right, top],
    [right, top, left, top],
    [left, top, left, bottom],
  ]
  let minEdgeDist = Number.POSITIVE_INFINITY
  let bestCenter = { x: pad.x, y: pad.y }
  for (const [ex1, ey1, ex2, ey2] of edges) {
    const res = segmentToSegmentDistAndMidpoint(
      x1,
      y1,
      x2,
      y2,
      ex1,
      ey1,
      ex2,
      ey2,
    )
    if (res.dist < minEdgeDist) {
      minEdgeDist = res.dist
      bestCenter = res.center
    }
  }
  return {
    gap: minEdgeDist - segWidth / 2,
    center: bestCenter,
  }
}

const EPSILON = 1e-4

export const checkNetClassPadPadClearance = (
  circuitJson: AnyCircuitElement[],
  defaultMinClearance = 0.1,
): AnyCircuitElement[] => {
  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const resolver = createNetClassResolver(circuitJson, connMap)
  if (!resolver.hasRules) return []

  const pads = extractPadsFromCircuitJson(circuitJson)
  const errors: AnyCircuitElement[] = []

  for (let i = 0; i < pads.length; i++) {
    for (let j = i + 1; j < pads.length; j++) {
      const padA = pads[i]
      const padB = pads[j]
      if (!padA.layers.some((l) => padB.layers.includes(l))) continue
      if (connMap.areIdsConnected(padA.id, padB.id)) continue
      if (
        padA.pcbComponentId &&
        padB.pcbComponentId &&
        padA.pcbComponentId === padB.pcbComponentId
      ) {
        continue
      }

      const classA = resolver.getNetClassForPcbElement(padA.element)
      const classB = resolver.getNetClassForPcbElement(padB.element)
      if (!classA && !classB && resolver.defaultClearance === undefined)
        continue

      const reqClearance = resolver.getRequiredClearanceBetweenClasses(
        classA,
        classB,
        defaultMinClearance,
      )
      const gap = computePadToPadEdgeGap(padA, padB)
      if (gap + EPSILON >= reqClearance) continue

      const pairId = [padA.id, padB.id].sort().join("_")
      errors.push({
        type: "pcb_pad_pad_clearance_error",
        pcb_pad_pad_clearance_error_id: `pad_pad_clearance_${pairId}`,
        error_type: "pcb_pad_pad_clearance_error",
        message: `Pads ${padA.id} (${classA?.name ?? "DEFAULT"}) and ${padB.id} (${classB?.name ?? "DEFAULT"}) violate net class clearance (actual: ${gap.toFixed(3)}mm, required: ${reqClearance.toFixed(3)}mm)`,
        pcb_pad_ids: [padA.id, padB.id],
        minimum_clearance: reqClearance,
        actual_clearance: gap,
        center: {
          x: (padA.x + padB.x) / 2,
          y: (padA.y + padB.y) / 2,
        },
      } as unknown as AnyCircuitElement)
    }
  }

  return errors
}

export const checkNetClassPadTraceClearance = (
  circuitJson: AnyCircuitElement[],
  defaultMinClearance = 0.1,
): AnyCircuitElement[] => {
  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const resolver = createNetClassResolver(circuitJson, connMap)
  if (!resolver.hasRules) return []

  const pads = extractPadsFromCircuitJson(circuitJson)
  const traces = circuitJson.filter(
    (el): el is Extract<AnyCircuitElement, { type: "pcb_trace" }> =>
      el.type === "pcb_trace",
  )

  const errorsByPair = new Map<
    string,
    { gap: number; error: AnyCircuitElement }
  >()

  for (const pad of pads) {
    const padClass = resolver.getNetClassForPcbElement(pad.element)
    for (const trace of traces) {
      if (connMap.areIdsConnected(pad.id, trace.pcb_trace_id)) continue
      if (
        trace.source_trace_id &&
        connMap.areIdsConnected(pad.id, trace.source_trace_id)
      ) {
        continue
      }
      const traceTouchesOwnPort = trace.route.some(
        (pt) =>
          pt.route_type === "wire" &&
          ((pt.start_pcb_port_id &&
            connMap.areIdsConnected(pad.id, pt.start_pcb_port_id)) ||
            (pt.end_pcb_port_id &&
              connMap.areIdsConnected(pad.id, pt.end_pcb_port_id))),
      )
      if (traceTouchesOwnPort) continue

      if (pad.pcbComponentId) {
        const connectsToSameComponentSiblingPad = pads.some(
          (otherPad) =>
            otherPad.id !== pad.id &&
            otherPad.pcbComponentId === pad.pcbComponentId &&
            (connMap.areIdsConnected(otherPad.id, trace.pcb_trace_id) ||
              (trace.source_trace_id
                ? connMap.areIdsConnected(otherPad.id, trace.source_trace_id)
                : false)),
        )
        if (connectsToSameComponentSiblingPad) continue
      }

      const traceClass = resolver.getNetClassForPcbElement(trace)
      if (!padClass && !traceClass && resolver.defaultClearance === undefined) {
        continue
      }

      const reqClearance = resolver.getRequiredClearanceBetweenClasses(
        padClass,
        traceClass,
        defaultMinClearance,
      )

      for (let i = 0; i < trace.route.length - 1; i++) {
        const p1 = trace.route[i]
        const p2 = trace.route[i + 1]
        if (p1.route_type !== "wire" || p2.route_type !== "wire") continue
        if (p1.layer !== p2.layer) continue
        if (!pad.layers.includes(p1.layer)) continue

        const segWidth = Math.max(p1.width ?? 0.15, p2.width ?? 0.15)
        const { gap, center } = computeSegmentToPadEdgeGap(
          p1.x,
          p1.y,
          p2.x,
          p2.y,
          segWidth,
          pad,
        )
        if (gap + EPSILON >= reqClearance) continue

        const pairId = `${pad.id}_${trace.pcb_trace_id}`
        const current = errorsByPair.get(pairId)
        if (!current || gap < current.gap) {
          errorsByPair.set(pairId, {
            gap,
            error: {
              type: "pcb_pad_trace_clearance_error",
              pcb_pad_trace_clearance_error_id: `pad_trace_clearance_${pairId}`,
              error_type: "pcb_pad_trace_clearance_error",
              message: `Pad ${pad.id} (${padClass?.name ?? "DEFAULT"}) and trace ${trace.pcb_trace_id} (${traceClass?.name ?? "DEFAULT"}) violate net class clearance (actual: ${gap.toFixed(3)}mm, required: ${reqClearance.toFixed(3)}mm)`,
              pcb_pad_id: pad.id,
              pcb_trace_id: trace.pcb_trace_id,
              minimum_clearance: reqClearance,
              actual_clearance: gap,
              center,
            } as unknown as AnyCircuitElement,
          })
        }
      }
    }
  }

  return Array.from(errorsByPair.values()).map((e) => e.error)
}

export const checkNetClassTraceTraceClearance = (
  circuitJson: AnyCircuitElement[],
  defaultMinClearance = 0.1,
): AnyCircuitElement[] => {
  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const resolver = createNetClassResolver(circuitJson, connMap)
  if (!resolver.hasRules) return []

  const traces = circuitJson.filter(
    (el): el is Extract<AnyCircuitElement, { type: "pcb_trace" }> =>
      el.type === "pcb_trace",
  )

  const errorsByPair = new Map<
    string,
    { gap: number; error: AnyCircuitElement }
  >()

  for (let i = 0; i < traces.length; i++) {
    for (let j = i + 1; j < traces.length; j++) {
      const traceA = traces[i]
      const traceB = traces[j]
      if (connMap.areIdsConnected(traceA.pcb_trace_id, traceB.pcb_trace_id)) {
        continue
      }
      if (
        traceA.source_trace_id &&
        traceB.source_trace_id &&
        connMap.areIdsConnected(traceA.source_trace_id, traceB.source_trace_id)
      ) {
        continue
      }

      const classA = resolver.getNetClassForPcbElement(traceA)
      const classB = resolver.getNetClassForPcbElement(traceB)
      if (!classA && !classB && resolver.defaultClearance === undefined) {
        continue
      }

      const reqClearance = resolver.getRequiredClearanceBetweenClasses(
        classA,
        classB,
        defaultMinClearance,
      )

      for (let sa = 0; sa < traceA.route.length - 1; sa++) {
        const a1 = traceA.route[sa]
        const a2 = traceA.route[sa + 1]
        if (a1.route_type !== "wire" || a2.route_type !== "wire") continue
        if (a1.layer !== a2.layer) continue
        const widthA = Math.max(a1.width ?? 0.15, a2.width ?? 0.15)

        for (let sb = 0; sb < traceB.route.length - 1; sb++) {
          const b1 = traceB.route[sb]
          const b2 = traceB.route[sb + 1]
          if (b1.route_type !== "wire" || b2.route_type !== "wire") continue
          if (b1.layer !== b2.layer || a1.layer !== b1.layer) continue
          const widthB = Math.max(b1.width ?? 0.15, b2.width ?? 0.15)

          const { dist, center } = segmentToSegmentDistAndMidpoint(
            a1.x,
            a1.y,
            a2.x,
            a2.y,
            b1.x,
            b1.y,
            b2.x,
            b2.y,
          )
          const gap = dist - widthA / 2 - widthB / 2
          if (gap + EPSILON >= reqClearance) continue

          const pairId = [traceA.pcb_trace_id, traceB.pcb_trace_id]
            .sort()
            .join("_")
          const current = errorsByPair.get(pairId)
          if (!current || gap < current.gap) {
            errorsByPair.set(pairId, {
              gap,
              error: {
                type: "pcb_trace_error",
                pcb_trace_error_id: `trace_clearance_${pairId}`,
                error_type: "pcb_trace_error",
                message: `Traces ${traceA.pcb_trace_id} (${classA?.name ?? "DEFAULT"}) and ${traceB.pcb_trace_id} (${classB?.name ?? "DEFAULT"}) violate net class clearance (actual: ${gap.toFixed(3)}mm, required: ${reqClearance.toFixed(3)}mm)`,
                pcb_trace_id: traceA.pcb_trace_id,
                pcb_component_ids: [],
                pcb_port_ids: [],
                minimum_clearance: reqClearance,
                actual_clearance: gap,
                center,
              } as unknown as AnyCircuitElement,
            })
          }
        }
      }
    }
  }

  return Array.from(errorsByPair.values()).map((e) => e.error)
}

export const checkNetClassViaPadClearance = (
  circuitJson: AnyCircuitElement[],
  defaultMinClearance = 0.1,
): AnyCircuitElement[] => {
  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const resolver = createNetClassResolver(circuitJson, connMap)
  if (!resolver.hasRules) return []

  const vias = circuitJson.filter(
    (el): el is Extract<AnyCircuitElement, { type: "pcb_via" }> =>
      el.type === "pcb_via",
  )
  const pads = extractPadsFromCircuitJson(circuitJson)
  if (vias.length === 0 || pads.length === 0) return []

  const errors: AnyCircuitElement[] = []
  for (const via of vias) {
    const viaRaw = via as unknown as {
      pcb_via_id: string
      pcb_trace_id?: string
      x: number
      y: number
      outer_diameter: number
      layers?: string[]
    }
    const viaLayers = viaRaw.layers ?? ["top", "bottom"]
    const viaClass = resolver.getNetClassForPcbElement(via)
    const viaAsPad: PadShapeInfo = {
      element: via,
      id: viaRaw.pcb_via_id,
      x: viaRaw.x,
      y: viaRaw.y,
      width: viaRaw.outer_diameter,
      height: viaRaw.outer_diameter,
      isCircle: true,
      radius: viaRaw.outer_diameter / 2,
      layers: viaLayers,
    }

    for (const pad of pads) {
      if (!viaLayers.some((l) => pad.layers.includes(l))) continue
      if (connMap.areIdsConnected(viaRaw.pcb_via_id, pad.id)) continue
      if (
        viaRaw.pcb_trace_id &&
        connMap.areIdsConnected(viaRaw.pcb_trace_id, pad.id)
      ) {
        continue
      }

      const padClass = resolver.getNetClassForPcbElement(pad.element)
      if (!viaClass && !padClass && resolver.defaultClearance === undefined) {
        continue
      }

      const reqClearance = resolver.getRequiredClearanceBetweenClasses(
        viaClass,
        padClass,
        defaultMinClearance,
      )
      const gap = computePadToPadEdgeGap(viaAsPad, pad)
      if (gap + EPSILON >= reqClearance) continue

      errors.push({
        type: "pcb_pad_pad_clearance_error",
        pcb_pad_pad_clearance_error_id: `via_pad_clearance_${viaRaw.pcb_via_id}_${pad.id}`,
        error_type: "pcb_pad_pad_clearance_error",
        message: `Via ${viaRaw.pcb_via_id} (${viaClass?.name ?? "DEFAULT"}) and pad ${pad.id} (${padClass?.name ?? "DEFAULT"}) violate net class clearance (actual: ${gap.toFixed(3)}mm, required: ${reqClearance.toFixed(3)}mm)`,
        pcb_pad_ids: [viaRaw.pcb_via_id, pad.id],
        minimum_clearance: reqClearance,
        actual_clearance: gap,
        center: {
          x: (viaRaw.x + pad.x) / 2,
          y: (viaRaw.y + pad.y) / 2,
        },
      } as unknown as AnyCircuitElement)
    }
  }

  return errors
}

export const checkNetClassViaTraceClearance = (
  circuitJson: AnyCircuitElement[],
  defaultMinClearance = 0.1,
): AnyCircuitElement[] => {
  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const resolver = createNetClassResolver(circuitJson, connMap)
  if (!resolver.hasRules) return []

  const vias = circuitJson.filter(
    (el): el is Extract<AnyCircuitElement, { type: "pcb_via" }> =>
      el.type === "pcb_via",
  )
  const traces = circuitJson.filter(
    (el): el is Extract<AnyCircuitElement, { type: "pcb_trace" }> =>
      el.type === "pcb_trace",
  )
  if (vias.length === 0 || traces.length === 0) return []

  const errorsByPair = new Map<
    string,
    { gap: number; error: AnyCircuitElement }
  >()

  for (const via of vias) {
    const viaRaw = via as unknown as {
      pcb_via_id: string
      pcb_trace_id?: string
      x: number
      y: number
      outer_diameter: number
      layers?: string[]
    }
    const viaLayers = viaRaw.layers ?? ["top", "bottom"]
    const viaClass = resolver.getNetClassForPcbElement(via)

    for (const trace of traces) {
      if (viaRaw.pcb_trace_id === trace.pcb_trace_id) continue
      if (connMap.areIdsConnected(viaRaw.pcb_via_id, trace.pcb_trace_id)) {
        continue
      }
      if (
        viaRaw.pcb_trace_id &&
        connMap.areIdsConnected(viaRaw.pcb_trace_id, trace.pcb_trace_id)
      ) {
        continue
      }
      const touchesOwnVia = trace.route.some(
        (pt) =>
          "x" in pt &&
          "y" in pt &&
          Math.hypot(pt.x - viaRaw.x, pt.y - viaRaw.y) <= 1e-2,
      )
      if (touchesOwnVia) continue

      const traceClass = resolver.getNetClassForPcbElement(trace)
      if (!viaClass && !traceClass && resolver.defaultClearance === undefined) {
        continue
      }

      const reqClearance = resolver.getRequiredClearanceBetweenClasses(
        viaClass,
        traceClass,
        defaultMinClearance,
      )

      for (let i = 0; i < trace.route.length - 1; i++) {
        const p1 = trace.route[i]
        const p2 = trace.route[i + 1]
        if (p1.route_type !== "wire" || p2.route_type !== "wire") continue
        if (p1.layer !== p2.layer) continue
        if (!viaLayers.includes(p1.layer)) continue

        const segWidth = Math.max(p1.width ?? 0.15, p2.width ?? 0.15)
        const { dist, cx, cy } = pointToSegmentDistAndClosest(
          viaRaw.x,
          viaRaw.y,
          p1.x,
          p1.y,
          p2.x,
          p2.y,
        )
        const gap = dist - viaRaw.outer_diameter / 2 - segWidth / 2
        if (gap + EPSILON >= reqClearance) continue

        const pairId = `${viaRaw.pcb_via_id}_${trace.pcb_trace_id}`
        const current = errorsByPair.get(pairId)
        if (!current || gap < current.gap) {
          errorsByPair.set(pairId, {
            gap,
            error: {
              type: "pcb_via_trace_clearance_error",
              pcb_via_trace_clearance_error_id: `via_trace_clearance_${pairId}`,
              error_type: "pcb_via_trace_clearance_error",
              message: `Via ${viaRaw.pcb_via_id} (${viaClass?.name ?? "DEFAULT"}) and trace ${trace.pcb_trace_id} (${traceClass?.name ?? "DEFAULT"}) violate net class clearance (actual: ${gap.toFixed(3)}mm, required: ${reqClearance.toFixed(3)}mm)`,
              pcb_via_id: viaRaw.pcb_via_id,
              pcb_trace_id: trace.pcb_trace_id,
              minimum_clearance: reqClearance,
              actual_clearance: gap,
              center: { x: (viaRaw.x + cx) / 2, y: (viaRaw.y + cy) / 2 },
            } as unknown as AnyCircuitElement,
          })
        }
      }
    }
  }

  return Array.from(errorsByPair.values()).map((e) => e.error)
}

export const checkNetClassDifferentNetViaSpacing = (
  circuitJson: AnyCircuitElement[],
  defaultMinClearance = 0.1,
): AnyCircuitElement[] => {
  const connMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const resolver = createNetClassResolver(circuitJson, connMap)
  if (!resolver.hasRules) return []

  const vias = circuitJson.filter(
    (el): el is Extract<AnyCircuitElement, { type: "pcb_via" }> =>
      el.type === "pcb_via",
  )
  if (vias.length < 2) return []

  const errors: AnyCircuitElement[] = []
  for (let i = 0; i < vias.length; i++) {
    for (let j = i + 1; j < vias.length; j++) {
      const viaA = vias[i] as unknown as {
        pcb_via_id: string
        pcb_trace_id?: string
        x: number
        y: number
        outer_diameter: number
        layers?: string[]
      }
      const viaB = vias[j] as unknown as {
        pcb_via_id: string
        pcb_trace_id?: string
        x: number
        y: number
        outer_diameter: number
        layers?: string[]
      }
      if (connMap.areIdsConnected(viaA.pcb_via_id, viaB.pcb_via_id)) continue
      if (
        viaA.pcb_trace_id &&
        viaB.pcb_trace_id &&
        (viaA.pcb_trace_id === viaB.pcb_trace_id ||
          connMap.areIdsConnected(viaA.pcb_trace_id, viaB.pcb_trace_id))
      ) {
        continue
      }

      const classA = resolver.getNetClassForPcbElement(vias[i])
      const classB = resolver.getNetClassForPcbElement(vias[j])
      if (!classA && !classB && resolver.defaultClearance === undefined) {
        continue
      }
      if (
        classA &&
        classB &&
        classA.name === classB.name &&
        classA.sourceNetIds.size === 1
      ) {
        const [onlyNet] = Array.from(classA.sourceNetIds)
        if (onlyNet) continue
      }

      const reqClearance = resolver.getRequiredClearanceBetweenClasses(
        classA,
        classB,
        defaultMinClearance,
      )
      const centerDist = Math.hypot(viaA.x - viaB.x, viaA.y - viaB.y)
      const gap = centerDist - viaA.outer_diameter / 2 - viaB.outer_diameter / 2
      if (gap + EPSILON >= reqClearance) continue

      const pairId = [viaA.pcb_via_id, viaB.pcb_via_id].sort().join("_")
      errors.push({
        type: "pcb_via_clearance_error",
        pcb_error_id: `different_net_vias_close_${pairId}`,
        error_type: "pcb_via_clearance_error",
        message: `Vias ${viaA.pcb_via_id} (${classA?.name ?? "DEFAULT"}) and ${viaB.pcb_via_id} (${classB?.name ?? "DEFAULT"}) from different nets violate net class clearance (actual: ${gap.toFixed(3)}mm, required: ${reqClearance.toFixed(3)}mm)`,
        pcb_via_ids: [viaA.pcb_via_id, viaB.pcb_via_id],
        minimum_clearance: reqClearance,
        actual_clearance: gap,
        pcb_center: {
          x: (viaA.x + viaB.x) / 2,
          y: (viaA.y + viaB.y) / 2,
        },
        center: {
          x: (viaA.x + viaB.x) / 2,
          y: (viaA.y + viaB.y) / 2,
        },
      } as unknown as AnyCircuitElement)
    }
  }

  return errors
}

const dedupeDrcErrors = <T extends AnyCircuitElement>(errors: T[]): T[] => {
  const byKey = new Map<string, T>()
  for (const err of errors) {
    const rec = err as unknown as Record<string, unknown>
    const key =
      (rec.pcb_pad_pad_clearance_error_id as string | undefined) ??
      (rec.pcb_pad_trace_clearance_error_id as string | undefined) ??
      (rec.pcb_via_trace_clearance_error_id as string | undefined) ??
      (rec.pcb_trace_error_id as string | undefined) ??
      (rec.pcb_error_id as string | undefined) ??
      `${err.type}:${rec.message ?? ""}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, err)
    } else {
      const existingMin =
        (existing as unknown as { minimum_clearance?: number })
          .minimum_clearance ?? 0
      const nextMin =
        (err as unknown as { minimum_clearance?: number }).minimum_clearance ??
        0
      if (nextMin > existingMin) {
        byKey.set(key, err)
      }
    }
  }
  return Array.from(byKey.values())
}

export const checkPadPadClearance = (
  ...args: Parameters<typeof baseCheckPadPadClearance>
): ReturnType<typeof baseCheckPadPadClearance> => {
  const baseResults = baseCheckPadPadClearance(...args)
  const netClassResults = checkNetClassPadPadClearance(
    args[0],
    typeof args[1] === "number" ? args[1] : 0.1,
  )
  return dedupeDrcErrors([
    ...baseResults,
    ...(netClassResults as ReturnType<typeof baseCheckPadPadClearance>),
  ])
}

export const checkPadTraceClearance = (
  ...args: Parameters<typeof baseCheckPadTraceClearance>
): ReturnType<typeof baseCheckPadTraceClearance> => {
  const baseResults = baseCheckPadTraceClearance(...args)
  const netClassResults = checkNetClassPadTraceClearance(
    args[0],
    args[1]?.minClearance ?? 0.1,
  )
  return dedupeDrcErrors([
    ...baseResults,
    ...(netClassResults as ReturnType<typeof baseCheckPadTraceClearance>),
  ])
}

export const checkEachPcbTraceNonOverlapping = (
  ...args: Parameters<typeof baseCheckEachPcbTraceNonOverlapping>
): ReturnType<typeof baseCheckEachPcbTraceNonOverlapping> => {
  const baseResults = baseCheckEachPcbTraceNonOverlapping(...args)
  const netClassResults = checkNetClassTraceTraceClearance(
    args[0],
    args[1]?.minClearance ?? 0.1,
  )
  return dedupeDrcErrors([
    ...baseResults,
    ...(netClassResults as ReturnType<
      typeof baseCheckEachPcbTraceNonOverlapping
    >),
  ])
}

export const checkViaPadClearance = (
  ...args: Parameters<typeof baseCheckViaPadClearance>
): ReturnType<typeof baseCheckViaPadClearance> => {
  const baseResults = baseCheckViaPadClearance(...args)
  const netClassResults = checkNetClassViaPadClearance(
    args[0],
    args[1]?.minClearance ?? 0.1,
  )
  return dedupeDrcErrors([
    ...baseResults,
    ...(netClassResults as ReturnType<typeof baseCheckViaPadClearance>),
  ])
}

export const checkViaTraceClearance = (
  ...args: Parameters<typeof baseCheckViaTraceClearance>
): ReturnType<typeof baseCheckViaTraceClearance> => {
  const baseResults = baseCheckViaTraceClearance(...args)
  const netClassResults = checkNetClassViaTraceClearance(
    args[0],
    args[1]?.minClearance ?? 0.1,
  )
  return dedupeDrcErrors([
    ...baseResults,
    ...(netClassResults as ReturnType<typeof baseCheckViaTraceClearance>),
  ])
}

export const checkDifferentNetViaSpacing = (
  ...args: Parameters<typeof baseCheckDifferentNetViaSpacing>
): ReturnType<typeof baseCheckDifferentNetViaSpacing> => {
  const baseResults = baseCheckDifferentNetViaSpacing(...args)
  const netClassResults = checkNetClassDifferentNetViaSpacing(
    args[0],
    args[1]?.minClearance ?? 0.1,
  )
  return dedupeDrcErrors([
    ...baseResults,
    ...(netClassResults as ReturnType<typeof baseCheckDifferentNetViaSpacing>),
  ])
}

export const runAllPlacementChecks = async (
  ...args: Parameters<typeof baseRunAllPlacementChecks>
): ReturnType<typeof baseRunAllPlacementChecks> => {
  const baseResults = await baseRunAllPlacementChecks(...args)
  const circuitJson = args[0]
  const netClassPadErrors = checkNetClassPadPadClearance(circuitJson)
  const netClassViaPadErrors = checkNetClassViaPadClearance(circuitJson)
  return dedupeDrcErrors([
    ...baseResults,
    ...netClassPadErrors,
    ...netClassViaPadErrors,
  ]) as Awaited<ReturnType<typeof baseRunAllPlacementChecks>>
}

export const runAllRoutingChecks = async (
  ...args: Parameters<typeof baseRunAllRoutingChecks>
): ReturnType<typeof baseRunAllRoutingChecks> => {
  const baseResults = await baseRunAllRoutingChecks(...args)
  const circuitJson = args[0]
  const padTraceErrors = checkNetClassPadTraceClearance(circuitJson)
  const traceTraceErrors = checkNetClassTraceTraceClearance(circuitJson)
  const viaTraceErrors = checkNetClassViaTraceClearance(circuitJson)
  const viaPadErrors = checkNetClassViaPadClearance(circuitJson)
  const viaViaErrors = checkNetClassDifferentNetViaSpacing(circuitJson)
  return dedupeDrcErrors([
    ...baseResults,
    ...padTraceErrors,
    ...traceTraceErrors,
    ...viaTraceErrors,
    ...viaPadErrors,
    ...viaViaErrors,
  ]) as Awaited<ReturnType<typeof baseRunAllRoutingChecks>>
}

export const runAllChecks = async (
  ...args: Parameters<typeof baseRunAllChecks>
): ReturnType<typeof baseRunAllChecks> => {
  const baseResults = await baseRunAllChecks(...args)
  const circuitJson = args[0]
  const netClassErrors = [
    ...checkNetClassPadPadClearance(circuitJson),
    ...checkNetClassPadTraceClearance(circuitJson),
    ...checkNetClassTraceTraceClearance(circuitJson),
    ...checkNetClassViaPadClearance(circuitJson),
    ...checkNetClassViaTraceClearance(circuitJson),
    ...checkNetClassDifferentNetViaSpacing(circuitJson),
  ]
  return dedupeDrcErrors([...baseResults, ...netClassErrors]) as Awaited<
    ReturnType<typeof baseRunAllChecks>
  >
}

const syncNetClassComponentsInCircuit = (
  root: RootCircuit | null | undefined,
) => {
  if (!root?.db) return
  const allComponents = root.children.flatMap((c) => [c, ...c.getDescendants()])
  for (const child of allComponents) {
    if (child instanceof NetClassImpl) {
      child.doInitialPcbPrimitiveRender()
    } else if (child instanceof ClearanceMatrixImpl) {
      child.doInitialPcbPrimitiveRender()
    } else if (child instanceof Net) {
      const rawProps = child.props as Record<string, unknown> | undefined
      const netName = rawProps?.name as string | undefined
      const netClassProp = (rawProps?.netClass ?? rawProps?.className) as
        | string
        | undefined
      const clearanceProp = rawProps?.clearance as number | string | undefined
      const voltageProp = (rawProps?.workingVoltage ?? rawProps?.voltage) as
        | number
        | string
        | undefined
      if (
        netName &&
        (netClassProp ||
          clearanceProp !== undefined ||
          voltageProp !== undefined)
      ) {
        const className = netClassProp ?? `NET_${netName}`
        const explicitClearance = parseDistanceMm(clearanceProp)
        const voltageClearance =
          voltageProp !== undefined
            ? getClearanceFromWorkingVoltage(voltageProp)
            : undefined
        const resolvedClearance = explicitClearance ?? voltageClearance ?? 0.15
        const sourceNetId = (child as unknown as { source_net_id?: string })
          .source_net_id
        upsertCircuitElementInRoot(
          root,
          "source_net_class_id",
          `source_net_class_${className}_${netName}`,
          {
            type: "source_net_class",
            source_net_class_id: `source_net_class_${className}_${netName}`,
            name: className,
            clearance: resolvedClearance,
            ...(voltageProp !== undefined
              ? { working_voltage: parseVoltageVolts(voltageProp) }
              : {}),
            net_names: [netName],
            source_net_ids: sourceNetId ? [sourceNetId] : [],
            source_trace_ids: [],
            source_port_ids: [],
            pcb_port_ids: [],
          } as unknown as AnyCircuitElement,
        )
      }
    } else if (child instanceof Board) {
      const rawProps = child.props as Record<string, unknown> | undefined
      if (
        rawProps?.clearanceMatrix &&
        typeof rawProps.clearanceMatrix === "object"
      ) {
        const cmInput = rawProps.clearanceMatrix as Record<string, unknown>
        const normalized =
          "matrix" in cmInput || "clearances" in cmInput || "rules" in cmInput
            ? normalizeMatrixInput(cmInput as ClearanceMatrixProps)
            : normalizeMatrixInput({
                matrix: cmInput as Record<
                  string,
                  Record<string, number | string>
                >,
              })
        upsertCircuitElementInRoot(
          root,
          "source_clearance_matrix_id",
          "source_clearance_matrix_board",
          {
            type: "source_clearance_matrix",
            source_clearance_matrix_id: "source_clearance_matrix_board",
            matrix: normalized,
          } as unknown as AnyCircuitElement,
        )
      }
    }
  }
}

let isNetClassPatched = false

export const registerNetClass = () => {
  if (isNetClassPatched) return
  isNetClassPatched = true

  let capturedCatalogue: Record<string, unknown> | null = null
  const probeKey = "__tsci_capture_net_class_catalogue__"
  Object.defineProperty(Object.prototype, probeKey, {
    configurable: true,
    get() {
      capturedCatalogue = this as Record<string, unknown>
      return NetClassImpl
    },
  })
  try {
    const tempCircuit = new RootCircuit()
    tempCircuit.add(React.createElement(probeKey, { name: "__probe__" }))
  } catch {
    // Ignore probe errors
  } finally {
    delete (Object.prototype as Record<string, unknown>)[probeKey]
  }

  if (capturedCatalogue) {
    const cat = capturedCatalogue as Record<string, unknown>
    cat.NetClass = NetClassImpl
    cat.netclass = NetClassImpl
    cat.netClass = NetClassImpl
    cat["net-class"] = NetClassImpl
    cat.ClearanceMatrix = ClearanceMatrixImpl
    cat.clearancematrix = ClearanceMatrixImpl
    cat.clearanceMatrix = ClearanceMatrixImpl
    cat["clearance-matrix"] = ClearanceMatrixImpl
  }

  const origGetAutorouterConfig = (
    Group.prototype as unknown as {
      _getAutorouterConfig?: () => Record<string, unknown>
    }
  )._getAutorouterConfig

  if (typeof origGetAutorouterConfig === "function") {
    ;(
      Group.prototype as unknown as {
        _getAutorouterConfig: (this: Group) => Record<string, unknown>
      }
    )._getAutorouterConfig = function (this: Group) {
      const config = origGetAutorouterConfig.call(this)
      if (config.algorithmFn || !config.local) return config
      if (this.root?.db) {
        syncNetClassComponentsInCircuit(this.root)
        const circuitJson = this.root.db.toArray()
        const resolver = createNetClassResolver(circuitJson)
        if (resolver.hasRules) {
          return {
            ...config,
            algorithmFn: async (srj: SimpleRouteJsonWithNetClasses) =>
              new NetClassStagedAutorouter(srj, this.root!.db.toArray()),
          }
        }
      }
      return config
    }
  }

  const origBoardQueueAsyncEffect = (
    Board.prototype as unknown as {
      _queueAsyncEffect?: (name: string, effect: () => Promise<void>) => void
    }
  )._queueAsyncEffect

  if (typeof origBoardQueueAsyncEffect === "function") {
    ;(
      Board.prototype as unknown as {
        _queueAsyncEffect: (
          this: Board,
          name: string,
          effect: () => Promise<void>,
        ) => void
      }
    )._queueAsyncEffect = function (
      this: Board,
      name: string,
      effect: () => Promise<void>,
    ) {
      if (name === "board:drc-checks") {
        return origBoardQueueAsyncEffect.call(this, name, async () => {
          await effect()
          if (!this.root?.db) return
          syncNetClassComponentsInCircuit(this.root)
          const circuitJson = this.root.db.toArray()
          const resolver = createNetClassResolver(circuitJson)
          if (!resolver.hasRules) return

          const drcDisabled =
            this.root?.platform?.drcChecksDisabled ??
            this.getInheritedProperty("drcChecksDisabled")
          if (drcDisabled) return

          const placementDisabled =
            this.root?.platform?.placementDrcChecksDisabled ??
            this.getInheritedProperty("placementDrcChecksDisabled")
          const routingDisabled =
            this.root?.platform?.routingDrcChecksDisabled ??
            this.getInheritedProperty("routingDrcChecksDisabled")

          const netClassErrors: AnyCircuitElement[] = []
          if (!placementDisabled) {
            netClassErrors.push(
              ...checkNetClassPadPadClearance(circuitJson),
              ...checkNetClassViaPadClearance(circuitJson),
            )
          }
          if (!routingDisabled) {
            netClassErrors.push(
              ...checkNetClassPadTraceClearance(circuitJson),
              ...checkNetClassTraceTraceClearance(circuitJson),
              ...checkNetClassViaTraceClearance(circuitJson),
              ...checkNetClassDifferentNetViaSpacing(circuitJson),
            )
          }

          if (netClassErrors.length > 0) {
            const rawElements = getCircuitJsonArrayFromRoot(this.root)
            if (rawElements) {
              const merged = dedupeDrcErrors([
                ...rawElements,
                ...netClassErrors,
              ])
              rawElements.splice(0, rawElements.length, ...merged)
            } else {
              ;(
                this.root.db as unknown as {
                  insertAll?: (elms: AnyCircuitElement[]) => void
                }
              ).insertAll?.(dedupeDrcErrors(netClassErrors))
            }
          }
        })
      }
      return origBoardQueueAsyncEffect.call(this, name, effect)
    }
  }

  const origExecuteWithFsMap = CircuitRunner.prototype.executeWithFsMap
  if (typeof origExecuteWithFsMap === "function") {
    CircuitRunner.prototype.executeWithFsMap = async function (
      this: CircuitRunner,
      ...args: Parameters<CircuitRunner["executeWithFsMap"]>
    ) {
      const runnerAny = this as unknown as {
        _executionContext?: {
          preSuppliedImports?: Record<string, Record<string, unknown>>
        }
      }
      const injectPreSupplied = () => {
        const preSupplied = runnerAny._executionContext?.preSuppliedImports
        if (!preSupplied) return
        for (const modName of ["@tscircuit/core", "tscircuit"]) {
          if (
            preSupplied[modName] &&
            typeof preSupplied[modName] === "object"
          ) {
            preSupplied[modName] = {
              ...preSupplied[modName],
              NetClass,
              ClearanceMatrix,
              useNetClass,
              useClearanceMatrix,
              getClearanceFromWorkingVoltage,
            }
          }
        }
      }
      injectPreSupplied()
      const result = await origExecuteWithFsMap.apply(this, args)
      injectPreSupplied()
      return result
    }
  }
}

registerNetClass()

declare module "@tscircuit/core" {
  interface IntrinsicElements {
    netclass: NetClassProps
    clearancematrix: ClearanceMatrixProps
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      netclass: NetClassProps
      clearancematrix: ClearanceMatrixProps
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      netclass: NetClassProps
      clearancematrix: ClearanceMatrixProps
    }
  }
}

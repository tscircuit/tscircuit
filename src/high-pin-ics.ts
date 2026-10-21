import type {
  AnyCircuitElement,
  CircuitJson,
  SourceComponent,
  SourcePort,
} from "circuit-json"

export interface HighPinComponentInfo {
  name: string
  sourceComponentId: string
  pinCount: number
  ftype?: string
}

export interface HighPinCountReport {
  totalHighPinComponents: number
  highestPinCount: number
  components: HighPinComponentInfo[]
}

/**
 * Identifies high pin count components (e.g. MCUs, FPGAs, complex ICs)
 * exceeding a given pin count threshold.
 */
export function getHighPinCountIcs(
  circuitJson: CircuitJson,
  options: { minPinCount?: number } = {},
): HighPinCountReport {
  const minPins = options.minPinCount ?? 16

  if (!Array.isArray(circuitJson)) {
    return {
      totalHighPinComponents: 0,
      highestPinCount: 0,
      components: [],
    }
  }

  const portCountBySourceComp = new Map<string, number>()
  const sourceComps = new Map<string, SourceComponent>()

  for (const element of circuitJson as AnyCircuitElement[]) {
    if (element.type === "source_port") {
      const sp = element as SourcePort
      if (sp.source_component_id) {
        portCountBySourceComp.set(
          sp.source_component_id,
          (portCountBySourceComp.get(sp.source_component_id) || 0) + 1,
        )
      }
    } else if (element.type === "source_component") {
      const sc = element as SourceComponent
      sourceComps.set(sc.source_component_id, sc)
    }
  }

  const matched: HighPinComponentInfo[] = []

  for (const [sourceId, pinCount] of portCountBySourceComp.entries()) {
    if (pinCount >= minPins) {
      const sc = sourceComps.get(sourceId)
      matched.push({
        name: sc?.name || sourceId,
        sourceComponentId: sourceId,
        pinCount,
        ftype: (sc as any)?.ftype,
      })
    }
  }

  matched.sort((a, b) => b.pinCount - a.pinCount)

  const highestPinCount = matched.length > 0 ? matched[0].pinCount : 0

  return {
    totalHighPinComponents: matched.length,
    highestPinCount,
    components: matched,
  }
}

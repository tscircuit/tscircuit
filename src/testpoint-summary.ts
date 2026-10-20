import type { AnyCircuitElement } from "circuit-json"

export interface TestPointDetail {
  componentId: string
  name: string
  netId?: string
  layer: "top" | "bottom" | "other"
  x: number
  y: number
  padShape: string
  padDimensions: {
    width?: number
    height?: number
    diameter?: number
  }
}

export interface TestPointSummaryReport {
  totalTestPoints: number
  topLayerCount: number
  bottomLayerCount: number
  coveredNets: string[]
  testPoints: TestPointDetail[]
}

/**
 * Extracts and analyzes all test points in Circuit JSON for in-circuit testing (ICT)
 * and automated manufacturing verification.
 */
export function getTestPointSummary(
  circuitJson: AnyCircuitElement[],
): TestPointSummaryReport {
  const testPointSourceComponents: Record<
    string,
    { name: string; netId?: string }
  > = {}

  // 1. Identify test point source components
  for (const elm of circuitJson) {
    if (
      elm.type === "source_component" &&
      ((elm as any).ftype === "simple_test_point" ||
        (elm as any).name?.startsWith("TP"))
    ) {
      testPointSourceComponents[(elm as any).source_component_id] = {
        name: (elm as any).name,
      }
    }
  }

  // 2. Find pcb_components matching these source components
  const pcbCompToSource: Record<string, string> = {}
  for (const elm of circuitJson) {
    if (elm.type === "pcb_component") {
      const srcId = (elm as any).source_component_id
      if (srcId && testPointSourceComponents[srcId]) {
        pcbCompToSource[(elm as any).pcb_component_id] = srcId
      }
    }
  }

  // 3. Extract pads corresponding to these test points
  const testPoints: TestPointDetail[] = []
  const coveredNetsSet = new Set<string>()
  let topCount = 0
  let bottomCount = 0

  for (const elm of circuitJson) {
    let compId: string | undefined
    if (elm.type === "pcb_smtpad" || elm.type === "pcb_plated_hole") {
      const pcbCompId = (elm as any).pcb_component_id
      if (pcbCompId && pcbCompToSource[pcbCompId]) {
        compId = pcbCompId
      }
    }

    if (compId) {
      const srcId = pcbCompToSource[compId]
      const srcData = testPointSourceComponents[srcId]
      const rawLayer = (elm as any).layer ?? "top"
      const layer: "top" | "bottom" | "other" =
        rawLayer === "top"
          ? "top"
          : rawLayer === "bottom"
            ? "bottom"
            : "other"

      if (layer === "top") topCount++
      else if (layer === "bottom") bottomCount++

      const netId =
        (elm as any).source_net_id ??
        (elm as any).net_id ??
        srcData.netId ??
        undefined
      if (netId) coveredNetsSet.add(netId)

      const shape = (elm as any).shape ?? "circle"
      const w = (elm as any).width
      const h = (elm as any).height
      const dia =
        (elm as any).hole_diameter ??
        (elm as any).outer_diameter ??
        (typeof (elm as any).radius === "number"
          ? (elm as any).radius * 2
          : undefined)

      testPoints.push({
        componentId: compId,
        name: srcData.name,
        netId,
        layer,
        x: (elm as any).x ?? 0,
        y: (elm as any).y ?? 0,
        padShape: shape,
        padDimensions: {
          width: w,
          height: h,
          diameter: dia,
        },
      })
    }
  }

  return {
    totalTestPoints: testPoints.length,
    topLayerCount: topCount,
    bottomLayerCount: bottomCount,
    coveredNets: Array.from(coveredNetsSet).sort(),
    testPoints,
  }
}

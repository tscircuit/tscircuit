import type { AnyCircuitElement } from "circuit-json"

export interface BomLineItem {
  lineItemNumber: number
  quantity: number
  designators: string[]
  designatorString: string
  componentType: string
  value?: string
  footprint?: string
  manufacturerPartNumber?: string
  supplierPartNumbers?: Record<string, string>
}

export interface ComponentBOMSummaryReport {
  totalComponents: number
  uniquePartsCount: number
  lineItems: BomLineItem[]
}

/**
 * Aggregates all source components in Circuit JSON into a structured,
 * grouped Bill of Materials (BOM) for PCBA assembly and procurement.
 */
export function getComponentBOMSummary(
  circuitJson: AnyCircuitElement[],
): ComponentBOMSummaryReport {
  const groupsMap: Record<
    string,
    {
      designators: string[]
      componentType: string
      value?: string
      footprint?: string
      mpn?: string
      supplierPartNumbers?: Record<string, string>
    }
  > = {}

  let totalComponents = 0

  for (const elm of circuitJson) {
    if (elm.type !== "source_component") continue

    const name = (elm as any).name
    if (!name) continue

    totalComponents++

    const ftype = (elm as any).ftype ?? "generic"
    const componentType = ftype.replace("simple_", "")
    const value =
      (elm as any).resistance !== undefined
        ? String((elm as any).resistance)
        : (elm as any).capacitance !== undefined
          ? String((elm as any).capacitance)
          : (elm as any).inductance !== undefined
            ? String((elm as any).inductance)
            : undefined

    const footprint =
      (elm as any).footprint ??
      (elm as any).package ??
      (elm as any).supplier_part_numbers?.footprint ??
      undefined

    const mpn = (elm as any).manufacturer_part_number ?? undefined
    const supplierPartNumbers = (elm as any).supplier_part_numbers ?? undefined

    // Grouping key: MPN if available, otherwise componentType + value + footprint
    const groupKey = mpn
      ? `mpn:${mpn}`
      : `${componentType}:${value ?? ""}:${footprint ?? ""}`

    if (!groupsMap[groupKey]) {
      groupsMap[groupKey] = {
        designators: [],
        componentType,
        value,
        footprint,
        mpn,
        supplierPartNumbers,
      }
    }

    groupsMap[groupKey].designators.push(name)
  }

  const lineItems: BomLineItem[] = []
  let lineNumber = 1

  for (const group of Object.values(groupsMap)) {
    // Natural sort designators: R1, R2, ... R10
    const sortedDesignators = [...group.designators].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    )

    lineItems.push({
      lineItemNumber: lineNumber++,
      quantity: sortedDesignators.length,
      designators: sortedDesignators,
      designatorString: sortedDesignators.join(", "),
      componentType: group.componentType,
      value: group.value,
      footprint: group.footprint,
      manufacturerPartNumber: group.mpn,
      supplierPartNumbers: group.supplierPartNumbers,
    })
  }

  // Sort line items alphabetically by designator
  lineItems.sort((a, b) =>
    a.designators[0].localeCompare(b.designators[0], undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  )

  // Reassign line numbers after sort
  for (let i = 0; i < lineItems.length; i++) {
    lineItems[i].lineItemNumber = i + 1
  }

  return {
    totalComponents,
    uniquePartsCount: lineItems.length,
    lineItems,
  }
}

import type {
  AnyCircuitElement,
  CircuitJson,
  SourceComponent,
} from "circuit-json"

export interface BomItem {
  name: string
  ftype?: string
  count: number
  designators: string[]
  supplierPartNumbers?: Record<string, string[]>
}

export function getCircuitBom(circuitJson: CircuitJson): BomItem[] {
  const map = new Map<string, BomItem>()

  for (const element of circuitJson) {
    if (element.type === "source_component") {
      const comp = element as SourceComponent & {
        supplier_part_numbers?: Record<string, string[]>
      }
      const designator = comp.name || comp.source_component_id

      // Grouping key: by primary supplier part number, or by ftype + name prefix
      let key = comp.ftype || "generic"
      if (comp.supplier_part_numbers) {
        const firstSupplier = Object.keys(comp.supplier_part_numbers)[0]
        if (
          firstSupplier &&
          comp.supplier_part_numbers[firstSupplier]?.length
        ) {
          key = `${firstSupplier}:${comp.supplier_part_numbers[firstSupplier][0]}`
        }
      }

      const existing = map.get(key)
      if (existing) {
        existing.count++
        if (designator && !existing.designators.includes(designator)) {
          existing.designators.push(designator)
        }
        if (comp.supplier_part_numbers) {
          existing.supplierPartNumbers = {
            ...existing.supplierPartNumbers,
            ...comp.supplier_part_numbers,
          }
        }
      } else {
        map.set(key, {
          name: comp.name || comp.ftype || "Component",
          ftype: comp.ftype,
          count: 1,
          designators: designator ? [designator] : [],
          supplierPartNumbers: comp.supplier_part_numbers
            ? { ...comp.supplier_part_numbers }
            : undefined,
        })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

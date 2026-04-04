import type {
  AnySoupElement,
  PCBComponent,
  SupplierName,
} from "@tscircuit/soup"
import { formatSI } from "format-si-prefix"
import type { SourceComponent } from "lib/types"

import Papa from "papaparse"

type SupplierPartNumberColumn = "JLCPCB Part#"

interface BomRow {
  designator: string
  comment: string
  value: string
  footprint: string
  supplier_part_number_columns?: Partial<
    Record<SupplierPartNumberColumn, string>
  >
  manufacturer_mpn_pairs?: Array<{
    manufacturer: string
    mpn: string
  }>
  extra_columns?: Record<string, string>
}

interface ResolvedPart {
  part_number?: string
  footprint?: string
  comment?: string
  supplier_part_number_columns?: Record<SupplierPartNumberColumn, string>
  manufacturer_mpn_pairs?: Array<{
    manufacturer: string
    mpn: string
  }>
  extra_columns?: Record<string, string>
}

// HEADERS FROM DIFFERENT bom.csv FILES
// Comment Designator Footprint "JLCPCB Part#(optional)"
// Designator Value Footprint Populate MPN Manufacturer MPN Manufacturer MPN Manufacturer MPN Manufacturer MPN Manufacturer

export const convertSoupToBomRows = async ({
  soup,
  resolvePart,
}: {
  soup: AnySoupElement[]
  resolvePart?: (part_info: {
    source_component: SourceComponent
    pcb_component: PCBComponent
  }) => Promise<ResolvedPart | null>
}): Promise<BomRow[]> => {
  const bom: BomRow[] = []
  for (const elm of soup) {
    if (elm.type !== "pcb_component") continue

    const source_component = soup.find(
      (e) =>
        e.type === "source_component" &&
        e.source_component_id === elm.source_component_id
    ) as any as SourceComponent

    const part_info: Partial<ResolvedPart> =
      (await resolvePart?.({ pcb_component: elm, source_component })) ?? {}

    let comment = ""

    if (source_component.ftype === "simple_resistor")
      comment = si(source_component.resistance)
    if (source_component.ftype === "simple_capacitor")
      comment = si(source_component.capacitance)

    bom.push({
      designator: elm.pcb_component_id,
      comment,
      value: comment,
      footprint: part_info.footprint || "",
      supplier_part_number_columns:
        part_info.supplier_part_number_columns ??
        source_component.supplier_part_numbers
          ? convertSupplierPartNumbersIntoColumns(
              source_component.supplier_part_numbers
            )
          : undefined,
    })
  }

  return bom
}

function convertSupplierPartNumbersIntoColumns(
  supplier_part_numbers: Partial<Record<SupplierName, string[]>> | undefined
): BomRow["supplier_part_number_columns"] {
  const supplier_part_number_columns: Partial<
    BomRow["supplier_part_number_columns"]
  > = {}

  if (supplier_part_numbers?.jlcpcb) {
    supplier_part_number_columns["JLCPCB Part#"] =
      supplier_part_numbers.jlcpcb[0]
  }

  return supplier_part_number_columns
}

function si(v: string | number | undefined | null) {
  if (v === null || v === undefined) return ""
  if (typeof v === "string") return v
  return formatSI(v)
}

export const convertBomRowsToCsv = (bom_rows: BomRow[]): string => {
  const csv_data = bom_rows.map((row) => {
    // Check if footprint exists and is not just whitespace
    if (!row.footprint || row.footprint.trim() === "") {
      throw new Error(
        `Footprint missing for component "${row.designator}". BOM/Pick-and-place export failed.`
      )
    }

    return {
      Designator: row.designator,
      Footprint: row.footprint,
      Quantity: row.quantity,
      "MPN/Source": row.mpn ?? row.source ?? "",
    }
  })
    const supplier_part_number_columns = row.supplier_part_number_columns
    const supplier_part_numbers = Object.values(
      supplier_part_number_columns || {}
    ).join(", ")
    const extraColumns = Object.entries(row.extra_columns || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")

    return {
      Designator: row.designator,
      Comment: row.comment,
      Value: row.value,
      Footprint: row.footprint,
      ...supplier_part_number_columns,
    }
  })

  return Papa.unparse(csv_data)
}
// Tracking issue: https://github.com/tscircuit/tscircuit/issues/2820

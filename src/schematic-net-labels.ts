import type { CircuitJson, SchematicNetLabel, SourceNet } from "circuit-json"

export interface SchematicNetLabelItem {
  id: string
  sourceNetId?: string
  text: string
  center: { x: number; y: number }
  anchorSide?: "left" | "right" | "top" | "bottom"
}

/**
 * Extracts and maps schematic net labels and connection pin locations.
 */
export function getSchematicNetLabels(
  circuitJson: CircuitJson,
): SchematicNetLabelItem[] {
  if (!Array.isArray(circuitJson)) return []

  const netNameMap = new Map<string, string>()
  for (const el of circuitJson) {
    if (el.type === "source_net") {
      const sn = el as SourceNet
      if (sn.source_net_id) {
        netNameMap.set(sn.source_net_id, sn.name || sn.source_net_id)
      }
    }
  }

  const labels: SchematicNetLabelItem[] = []

  for (const el of circuitJson) {
    if (el.type === "schematic_net_label") {
      const snl = el as SchematicNetLabel
      const netName = snl.source_net_id
        ? netNameMap.get(snl.source_net_id) || snl.text
        : snl.text

      labels.push({
        id: snl.schematic_net_label_id,
        sourceNetId: snl.source_net_id,
        text: netName,
        center: snl.center || { x: 0, y: 0 },
        anchorSide: snl.anchor_side,
      })
    }
  }

  labels.sort((a, b) => a.text.localeCompare(b.text))

  return labels
}

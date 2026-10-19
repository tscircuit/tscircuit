import type { CircuitJson, PcbSilkscreenText } from "circuit-json"

export interface SilkscreenTextItem {
  id: string
  text: string
  layer: string
  x: number
  y: number
  fontSize: number
  componentId?: string
}

/**
 * Extracts and locates all silkscreen text elements across a PCB.
 */
export function getSilkscreenTexts(
  circuitJson: CircuitJson,
): SilkscreenTextItem[] {
  if (!Array.isArray(circuitJson)) return []

  const texts: SilkscreenTextItem[] = []

  for (const element of circuitJson) {
    if (element.type === "pcb_silkscreen_text") {
      const st = element as PcbSilkscreenText
      const pos = (st as any).anchor_position ||
        (st as any).center || { x: 0, y: 0 }
      const fontSize =
        typeof st.font_size === "number"
          ? st.font_size
          : typeof (st as any).size === "number"
            ? (st as any).size
            : 1.0

      texts.push({
        id: st.pcb_silkscreen_text_id,
        text: st.text,
        layer: st.layer || "top",
        x: pos.x ?? 0,
        y: pos.y ?? 0,
        fontSize,
        componentId: st.pcb_component_id,
      })
    }
  }

  texts.sort((a, b) => {
    if (a.layer !== b.layer) return a.layer.localeCompare(b.layer)
    return a.text.localeCompare(b.text)
  })

  return texts
}

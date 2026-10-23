import React from "react"

export interface NetTieFootprintConfig {
  padWidth: number
  padHeight: number
  gap: number
  bridgeWidth: number
}

export const NET_TIE_PRESETS: Record<string, NetTieFootprintConfig> = {
  net_tie_0402: {
    padWidth: 0.4,
    padHeight: 0.5,
    gap: 0.2,
    bridgeWidth: 0.2,
  },
  net_tie_0603: {
    padWidth: 0.6,
    padHeight: 0.8,
    gap: 0.3,
    bridgeWidth: 0.25,
  },
  net_tie_0805: {
    padWidth: 0.8,
    padHeight: 1.25,
    gap: 0.4,
    bridgeWidth: 0.3,
  },
  net_tie_1206: {
    padWidth: 1.0,
    padHeight: 1.6,
    gap: 0.6,
    bridgeWidth: 0.4,
  },
}

export interface NetTieFootprintProps {
  footprintPreset?: keyof typeof NET_TIE_PRESETS | string
  padWidth?: number
  padHeight?: number
  gap?: number
  bridgeWidth?: number
  layer?: "top" | "bottom"
}

export function parseDimension(value: number | string | undefined, defaultValue: number): number {
  if (value === undefined || value === null) return defaultValue
  if (typeof value === "number") return value
  const num = parseFloat(value)
  return isNaN(num) ? defaultValue : num
}

export const NetTieFootprint = (props: NetTieFootprintProps) => {
  const preset = (props.footprintPreset && NET_TIE_PRESETS[props.footprintPreset]) || NET_TIE_PRESETS.net_tie_0805
  const padWidth = props.padWidth ?? preset.padWidth
  const padHeight = props.padHeight ?? preset.padHeight
  const gap = props.gap ?? preset.gap
  const bridgeWidth = props.bridgeWidth ?? preset.bridgeWidth
  const layer = props.layer ?? "top"

  const centerDistance = padWidth + gap
  const pad1X = -centerDistance / 2
  const pad2X = centerDistance / 2

  // Total span of bridge to overlap securely between the two pads
  const bridgeSpan = gap + padWidth * 0.5

  return (
    <footprint>
      {/* Pad 1 (Net 1 contact) */}
      <smtpad
        shape="rect"
        width={`${padWidth}mm`}
        height={`${padHeight}mm`}
        pcbX={`${pad1X}mm`}
        pcbY="0mm"
        layer={layer}
        portHints={["pin1", "1"]}
      />

      {/* Pad 2 (Net 2 contact) */}
      <smtpad
        shape="rect"
        width={`${padWidth}mm`}
        height={`${padHeight}mm`}
        pcbX={`${pad2X}mm`}
        pcbY="0mm"
        layer={layer}
        portHints={["pin2", "2"]}
      />

      {/* Intentional Copper Bridge joining the two pads */}
      <smtpad
        shape="rect"
        width={`${bridgeSpan}mm`}
        height={`${bridgeWidth}mm`}
        pcbX="0mm"
        pcbY="0mm"
        layer={layer}
      />
    </footprint>
  )
}

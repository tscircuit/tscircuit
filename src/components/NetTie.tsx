import React from "react"
import { NetTieFootprint, parseDimension } from "../footprints/net-tie"

export interface NetTieProps {
  /**
   * Component designator name (e.g. "NT1", "NET_TIE_1")
   */
  name: string

  /**
   * Two net selectors to connect at this single point (e.g. ["net.AGND", "net.GND"] or ["AGND", "GND"])
   */
  connects?: [string, string]

  /**
   * Alternative explicit prop for first net
   */
  net1?: string

  /**
   * Alternative explicit prop for second net
   */
  net2?: string

  /**
   * X coordinate on PCB
   */
  pcbX?: number | string

  /**
   * Y coordinate on PCB
   */
  pcbY?: number | string

  /**
   * Rotation on PCB in degrees
   */
  pcbRotation?: number | string

  /**
   * PCB layer for the net-tie pads and bridge ("top" or "bottom")
   */
  layer?: "top" | "bottom"

  /**
   * Preset footprint size: "net_tie_0402" | "net_tie_0603" | "net_tie_0805" | "net_tie_1206"
   */
  footprint?: "net_tie_0402" | "net_tie_0603" | "net_tie_0805" | "net_tie_1206" | string

  /**
   * Custom pad width (mm or string with unit)
   */
  padWidth?: number | string

  /**
   * Custom pad height (mm or string with unit)
   */
  padHeight?: number | string

  /**
   * Custom gap between pads (mm or string with unit)
   */
  gap?: number | string

  /**
   * Custom width of the copper bridge (mm or string with unit)
   */
  bridgeWidth?: number | string
}

function normalizeNet(net: string | undefined): string | undefined {
  if (!net) return undefined
  if (net.startsWith("net.")) return net
  return `net.${net}`
}

/**
 * NetTie component for joining two named nets at exactly one physical location.
 * Commonly used for separating Analog and Digital grounds (AGND / DGND) or Kelvin sensing.
 */
export const NetTie = (props: NetTieProps) => {
  const {
    name,
    connects,
    net1: propNet1,
    net2: propNet2,
    pcbX = 0,
    pcbY = 0,
    pcbRotation = 0,
    layer = "top",
    footprint = "net_tie_0805",
    padWidth,
    padHeight,
    gap,
    bridgeWidth,
  } = props

  const net1 = normalizeNet(propNet1 ?? connects?.[0])
  const net2 = normalizeNet(propNet2 ?? connects?.[1])

  return (
    <group subcircuit>
      <chip
        name={name}
        pcbX={pcbX}
        pcbY={pcbY}
        pcbRotation={pcbRotation}
        layer={layer}
        footprint={
          <NetTieFootprint
            footprintPreset={footprint}
            padWidth={padWidth !== undefined ? parseDimension(padWidth, 0.8) : undefined}
            padHeight={padHeight !== undefined ? parseDimension(padHeight, 1.25) : undefined}
            gap={gap !== undefined ? parseDimension(gap, 0.4) : undefined}
            bridgeWidth={bridgeWidth !== undefined ? parseDimension(bridgeWidth, 0.3) : undefined}
            layer={layer}
          />
        }
      />
      {net1 && <trace from={`${name} .pin1`} to={net1} />}
      {net2 && <trace from={`${name} .pin2`} to={net2} />}
    </group>
  )
}

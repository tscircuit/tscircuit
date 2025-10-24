import { applyToPoint, compose, scale, translate, rotate } from "transformation-matrix"

// Types for silkscreen text with knockout support
interface PcbSilkscreenText {
  type: "pcb_silkscreen_text"
  pcb_silkscreen_text_id: string
  pcb_group_id?: string
  subcircuit_id?: string
  font: "tscircuit2024"
  font_size: number
  pcb_component_id: string
  text: string
  is_knockout?: boolean
  knockout_padding?: {
    left: number
    top: number
    bottom: number
    right: number
  }
  ccw_rotation?: number
  layer: "top" | "bottom"
  is_mirrored?: boolean
  anchor_position: { x: number; y: number }
  anchor_alignment: "center" | "top_left" | "top_center" | "top_right" | "center_left" | "center_right" | "bottom_left" | "bottom_center" | "bottom_right"
}

// Rendering context interface
interface RenderContext {
  transform: any
  layer: "top" | "bottom" | null
  colorMap: {
    silkscreen: {
      top: string
      bottom: string
    }
  }
}

// Enhanced function with knockout support
export function createSvgObjectsFromPcbSilkscreenText(
  pcbSilkscreenText: PcbSilkscreenText,
  ctx: RenderContext
): any[] {
  const { transform, layer: layerFilter, colorMap } = ctx
  const {
    anchor_position,
    text,
    font_size = 1,
    layer = "top",
    ccw_rotation = 0,
    anchor_alignment = "center",
    is_knockout = false,
    knockout_padding = { left: 0.2, top: 0.2, bottom: 0.2, right: 0.2 }
  } = pcbSilkscreenText

  if (layerFilter && layer !== layerFilter) return []

  if (!anchor_position || typeof anchor_position.x !== "number" || typeof anchor_position.y !== "number") {
    console.error("Invalid anchor_position:", anchor_position)
    return []
  }

  const [transformedX, transformedY] = applyToPoint(transform, [
    anchor_position.x,
    anchor_position.y
  ])

  const transformedFontSize = font_size * Math.abs(transform.a)
  let textAnchor = "middle"
  let dominantBaseline = "central"

  // Set text anchor and baseline based on alignment - EXACT original logic
  switch (anchor_alignment) {
    case "top_left":
      textAnchor = "start"
      dominantBaseline = "text-before-edge"
      break
    case "top_center":
      textAnchor = "middle"
      dominantBaseline = "text-before-edge"
      break
    case "top_right":
      textAnchor = "end"
      dominantBaseline = "text-before-edge"
      break
    case "center_left":
      textAnchor = "start"
      dominantBaseline = "central"
      break
    case "center_right":
      textAnchor = "end"
      dominantBaseline = "central"
      break
    case "bottom_left":
      textAnchor = "start"
      dominantBaseline = "text-after-edge"
      break
    case "bottom_center":
      textAnchor = "middle"
      dominantBaseline = "text-after-edge"
      break
    case "bottom_right":
      textAnchor = "end"
      dominantBaseline = "text-after-edge"
      break
    case "center":
    default:
      textAnchor = "middle"
      dominantBaseline = "central"
      break
  }

  const textTransform = compose(
    translate(transformedX, transformedY),
    rotate(-ccw_rotation * Math.PI / 180),
    ...(layer === "bottom" ? [scale(-1, 1)] : [])
  )

  const color = layer === "bottom" ? colorMap.silkscreen.bottom : colorMap.silkscreen.top
  const lines = text.split("\n")

  const textChildren = lines.length === 1 ? [
    {
      type: "text",
      value: text,
      name: "",
      attributes: {},
      children: []
    }
  ] : lines.map((line, idx) => ({
    type: "element",
    name: "tspan",
    value: "",
    attributes: {
      x: "0",
      ...(idx > 0 ? { dy: transformedFontSize.toString() } : {})
    },
    children: [
      {
        type: "text",
        value: line,
        name: "",
        attributes: {},
        children: []
      }
    ]
  }))

  const textSvgObject = {
    name: "text",
    type: "element",
    attributes: {
      x: "0",
      y: "0",
      fill: color,
      "font-family": "Arial, sans-serif",
      "font-size": transformedFontSize.toString(),
      "text-anchor": textAnchor,
      "dominant-baseline": dominantBaseline,
      transform: textTransform.toString(),
      class: `pcb-silkscreen-text pcb-silkscreen-${layer}`,
      "data-pcb-silkscreen-text-id": pcbSilkscreenText.pcb_component_id,
      stroke: "none"
    },
    children: textChildren,
    value: ""
  }

  // Add knockout rectangle if enabled
  if (is_knockout) {
    const lineHeight = transformedFontSize
    const textWidth = text.length * transformedFontSize * 0.6
    const textHeight = lines.length * lineHeight

    const knockoutWidth = textWidth + (knockout_padding.left + knockout_padding.right) * transformedFontSize
    const knockoutHeight = textHeight + (knockout_padding.top + knockout_padding.bottom) * transformedFontSize

    let knockoutX = -knockoutWidth / 2
    let knockoutY = -knockoutHeight / 2

    if (textAnchor === "start") knockoutX = 0
    else if (textAnchor === "end") knockoutX = -knockoutWidth

    if (dominantBaseline === "text-before-edge") knockoutY = 0
    else if (dominantBaseline === "text-after-edge") knockoutY = -knockoutHeight

    const knockoutTransform = compose(
      translate(transformedX, transformedY),
      rotate(-ccw_rotation * Math.PI / 180),
      ...(layer === "bottom" ? [scale(-1, 1)] : [])
    )

    const knockoutSvgObject = {
      name: "rect",
      type: "element",
      attributes: {
        x: knockoutX.toString(),
        y: knockoutY.toString(),
        width: knockoutWidth.toString(),
        height: knockoutHeight.toString(),
        fill: color,
        transform: knockoutTransform.toString(),
        class: `pcb-silkscreen-knockout pcb-silkscreen-${layer}`,
        "data-pcb-silkscreen-text-id": pcbSilkscreenText.pcb_component_id
      },
      children: [],
      value: ""
    }

    return [knockoutSvgObject, textSvgObject]
  }

  return [textSvgObject]
}

// Example usage
export const knockoutTextExample = {
  type: "pcb_silkscreen_text",
  pcb_silkscreen_text_id: "silkscreen_text_1",
  pcb_component_id: "component_1",
  text: "U1",
  anchor_position: { x: 0, y: 0 },
  font_size: 1,
  layer: "top",
  is_knockout: true,
  knockout_padding: {
    left: 0.3,
    top: 0.3,
    bottom: 0.3,
    right: 0.3
  },
  ccw_rotation: 0,
  anchor_alignment: "center"
}

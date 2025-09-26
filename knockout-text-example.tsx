// Basic knockout text usage example
export const basicKnockoutExample = {
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

// Knockout text with different padding example
export const customPaddingExample = {
  type: "pcb_silkscreen_text",
  pcb_silkscreen_text_id: "silkscreen_text_2",
  pcb_component_id: "component_2",
  text: "IC101",
  anchor_position: { x: 5, y: 0 },
  font_size: 1,
  layer: "top",
  is_knockout: true,
  knockout_padding: {
    left: 0.2,
    top: 0.2,
    right: 0.2,
    bottom: 0.2
  },
  ccw_rotation: 0,
  anchor_alignment: "center"
}

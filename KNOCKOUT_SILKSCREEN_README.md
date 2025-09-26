# Knockout Silkscreen Text Implementation

Knockout silkscreen text creates a filled background rectangle with the text cut out (omitted).

## Current Status

✅ **circuit-json**: Already supports `is_knockout` and `knockout_padding` properties
✅ **@tscircuit/props**: Already supports `isKnockout` and `knockoutPadding*` properties
✅ **circuit-to-svg**: Implementation completed
❌ **pcb-viewer**: Needs implementation
❌ **3d-viewer**: Needs implementation

## Implementation Details

### Circuit JSON Schema

The `pcb_silkscreen_text` type already includes:

```typescript
{
  type: "pcb_silkscreen_text"
  pcb_silkscreen_text_id: string
  text: string
  is_knockout?: boolean  // defaults to false
  knockout_padding?: {
    left: number
    top: number
    bottom: number
    right: number
  }  // defaults to 0.2mm each side
  // ... other properties
}
```

### Props Support

The `@tscircuit/props` package supports:

```typescript
export const silkscreenTextProps = pcbLayoutProps.extend({
  text: z.string(),
  isKnockout: z.boolean().optional(),
  knockoutPadding: length.optional(),
  knockoutPaddingLeft: length.optional(),
  knockoutPaddingRight: length.optional(),
  knockoutPaddingTop: length.optional(),
  knockoutPaddingBottom: length.optional(),
})
```

## Usage

### Basic Usage

```typescript
{
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
```

## Circuit-to-SVG Implementation

The knockout functionality is implemented by:

1. **Text Rendering**: Creates the text element with proper styling and positioning
2. **Knockout Rectangle**: When `is_knockout` is true, creates a filled rectangle behind the text
3. **Dimensions**: Calculates text dimensions based on font size, text length, and knockout padding
4. **Positioning**: Aligns the knockout rectangle with the text based on anchor alignment
5. **Transformations**: Applies the same rotation and transformations to both text and knockout rectangle

### Key Features

- **Automatic Sizing**: Text dimensions are calculated automatically
- **Flexible Padding**: Supports individual padding for each side or uniform padding
- **Alignment Support**: Works with all text anchor alignments
- **Layer Support**: Works on both top and bottom layers
- **Rotation Support**: Properly handles rotated text

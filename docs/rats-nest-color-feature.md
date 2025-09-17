# Rats Nest Color Feature

This document describes the implementation of the `ratsNestColor` property for issue #796, which allows specifying custom colors for rats nest lines in the PCB viewer.

## Overview

The `ratsNestColor` property enables users to specify custom colors for:
- **Trace elements**: Individual traces between components
- **Net elements**: Groups of connected pins
- **Pin elements**: Individual component pins

This feature improves the visual clarity of PCB designs by allowing different nets and connections to be displayed in distinct colors.

## Usage

### Trace Elements

```tsx
<trace 
  path={[".R1 > .left", ".R2 > .left"]} 
  ratsNestColor="#ff0000" // Red color
/>
```

### Net Elements

```tsx
<net name="VCC_NET" ratsNestColor="#ff0000">
  <pin name="R1.left" />
  <pin name="U1.VCC" />
</net>
```

### Pin Elements

```tsx
<pin name="U1.RESET" ratsNestColor="#ff8000" />
```

## Color Format

The `ratsNestColor` property accepts any valid CSS color value:
- **Hex colors**: `#ff0000`, `#00ff00`, `#0000ff`
- **RGB colors**: `rgb(255, 0, 0)`, `rgb(0, 255, 0)`
- **Named colors**: `red`, `green`, `blue`
- **HSL colors**: `hsl(0, 100%, 50%)`

## Implementation Details

### Type Definitions

```typescript
export interface RatsNestColorProps {
  ratsNestColor?: string
}

export interface TraceProps extends RatsNestColorProps {
  path: string[]
  [key: string]: any
}

export interface NetProps extends RatsNestColorProps {
  name: string
  [key: string]: any
}

export interface PinProps extends RatsNestColorProps {
  name: string
  [key: string]: any
}
```

### Circuit JSON Schema

The `ratsNestColor` property is included in the circuit JSON output:

```json
{
  "type": "trace",
  "path": [".R1 > .left", ".R2 > .left"],
  "ratsNestColor": "#ff0000"
}
```

### PCB Viewer Integration

The PCB viewer reads the `ratsNestColor` property and applies the specified color when rendering rats nest lines. If no color is specified, the default color is used.

## Examples

### Basic Usage

```tsx
import React from "react"

const BasicExample = () => (
  <board width="50mm" height="50mm">
    <resistor name="R1" resistance="10kohm" pcb_x="10mm" pcb_y="10mm" />
    <resistor name="R2" resistance="5kohm" pcb_x="20mm" pcb_y="10mm" />
    
    {/* Red trace */}
    <trace 
      path={[".R1 > .left", ".R2 > .left"]} 
      ratsNestColor="#ff0000"
    />
    
    {/* Blue trace */}
    <trace 
      path={[".R1 > .right", ".R2 > .right"]} 
      ratsNestColor="#0000ff"
    />
  </board>
)
```

### Advanced Usage with Nets

```tsx
const AdvancedExample = () => (
  <board width="100mm" height="80mm">
    <chip name="U1" footprint="qfp-32" pcb_x="10mm" pcb_y="10mm" />
    <resistor name="R1" resistance="10kohm" pcb_x="30mm" pcb_y="10mm" />
    <ground name="GND" pcb_x="50mm" pcb_y="30mm" />
    
    {/* Power net in red */}
    <net name="VCC" ratsNestColor="#ff0000">
      <pin name="U1.VCC" />
      <pin name="R1.left" />
    </net>
    
    {/* Ground net in blue */}
    <net name="GND" ratsNestColor="#0000ff">
      <pin name="U1.GND" />
      <pin name="GND.gnd" />
    </net>
    
    {/* Signal net in green */}
    <net name="SIGNAL" ratsNestColor="#00ff00">
      <pin name="U1.D0" />
      <pin name="R1.right" />
    </net>
  </board>
)
```

## Testing

The feature includes comprehensive tests in `tests/rats-nest-color.test.tsx`:

- Trace elements with `ratsNestColor`
- Net elements with `ratsNestColor`
- Pin elements with `ratsNestColor`
- Integration with `runTscircuitCode`

Run tests with:
```bash
bun test tests/rats-nest-color.test.tsx
```

## Future Enhancements

Potential future improvements:
- Color validation and error handling
- Color themes and presets
- Animation support for color changes
- Export to manufacturing files with color information

## Related Issues

- Issue #796: Allow specifying ratsNestColor on nets or pins

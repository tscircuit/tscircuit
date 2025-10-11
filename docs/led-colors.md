# LED Color Configuration

This guide explains how to configure LED colors in tscircuit with 3D preview support.

## Basic LED Usage

```tsx
const MyCircuit = () => (
  <board width="20mm" height="15mm">
    <led
      name="LED1"
      color="red"
      footprint="0402"
      pcb_x={0}
      pcb_y={0}
    />
  </board>
)
```

## Supported Colors

### Standard Colors
```tsx
<led name="LED_RED" color="red" footprint="0402" />
<led name="LED_GREEN" color="green" footprint="0402" />
<led name="LED_BLUE" color="blue" footprint="0402" />
<led name="LED_YELLOW" color="yellow" footprint="0402" />
<led name="LED_WHITE" color="white" footprint="0402" />
```

### Custom Hex Colors
```tsx
<led name="LED_CUSTOM" color="#FF6B35" footprint="0402" />
<led name="LED_PINK" color="#FF69B4" footprint="0402" />
```

## Example Circuit

```tsx
const LEDExample = () => (
  <board width="30mm" height="20mm">
    <led name="LED_RED" color="red" footprint="0402" pcb_x={-10} pcb_y={0} />
    <led name="LED_GREEN" color="green" footprint="0402" pcb_x={0} pcb_y={0} />
    <led name="LED_BLUE" color="blue" footprint="0402" pcb_x={10} pcb_y={0} />
    
    <resistor name="R1" resistance="330ohm" footprint="0402" pcb_x={0} pcb_y={-10} />
    <trace path={[".LED_RED > .cathode", "gnd"]} />
  </board>
)
```

## 3D Preview

LED colors are rendered in the 3D PCB preview with support for:
- Standard color names (red, green, blue, etc.)
- Hex color codes (#FF6B35)
- 0402, 0603, 0805, 1206 footprints
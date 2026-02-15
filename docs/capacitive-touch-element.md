# Capacitive Touch Element

Capacitive touch sensors are a common PCB design pattern. They work by
detecting changes in capacitance when a finger touches or approaches a copper
pad. In tscircuit you can build capacitive touch pads and sliders using the
`<smtpad>` element with the `coveredWithSolderMask` property.

## How It Works

A capacitive touch pad is simply a copper area on the PCB that is covered by
solder mask. The solder mask acts as a dielectric layer, protecting the copper
from direct contact while still allowing capacitive coupling with a finger.

When `coveredWithSolderMask` is set on an `<smtpad>`, tscircuit generates the
`is_covered_with_solder_mask` field in circuit-json, which tells downstream
tools (gerber export, PCB viewers, 3D renderers) that the pad should remain
covered by solder mask rather than being exposed for soldering.

## Basic Touch Pad

The simplest capacitive touch element is a single rectangular pad covered with
solder mask:

```tsx
import { Circuit } from "tscircuit"

const TouchPad = () => (
  <board width="20mm" height="20mm">
    <chip
      name="TOUCH1"
      footprint={
        <footprint>
          <smtpad
            shape="rect"
            width="10mm"
            height="10mm"
            portHints={["1"]}
            coveredWithSolderMask
          />
        </footprint>
      }
    />
  </board>
)
```

This creates a 10mm x 10mm rectangular copper pad covered with solder mask.
The pad is large enough for reliable finger detection.

## Pad Shapes

You can use any pad shape supported by `<smtpad>`. Each shape supports the
`coveredWithSolderMask` property:

### Rectangular Pad

```tsx
<smtpad
  shape="rect"
  width="10mm"
  height="10mm"
  portHints={["1"]}
  coveredWithSolderMask
/>
```

### Circular Pad

```tsx
<smtpad
  shape="circle"
  radius="5mm"
  portHints={["1"]}
  coveredWithSolderMask
/>
```

### Pill-Shaped Pad

```tsx
<smtpad
  shape="pill"
  width="12mm"
  height="6mm"
  radius="3mm"
  portHints={["1"]}
  coveredWithSolderMask
/>
```

### Polygon Pad

Polygon pads allow arbitrary shapes for custom touch sensor geometry:

```tsx
<smtpad
  shape="polygon"
  points={[
    { x: -5, y: -5 },
    { x: 5, y: -5 },
    { x: 5, y: 5 },
    { x: -5, y: 5 },
  ]}
  portHints={["1"]}
  coveredWithSolderMask
/>
```

## Capacitive Touch Slider

A touch slider is built by placing multiple touch pads in a row. The
microcontroller reads each pad's capacitance to determine where along the
slider the finger is positioned.

```tsx
import { Circuit } from "tscircuit"

const TouchSlider = () => {
  const padCount = 5
  const padWidth = 4 // mm
  const padHeight = 10 // mm
  const padSpacing = 5 // mm
  const totalWidth = padCount * padSpacing
  const startX = -totalWidth / 2 + padSpacing / 2

  return (
    <board width="40mm" height="20mm">
      {Array.from({ length: padCount }, (_, i) => (
        <chip
          key={`PAD${i + 1}`}
          name={`PAD${i + 1}`}
          pcbX={startX + i * padSpacing}
          pcbY={0}
          footprint={
            <footprint>
              <smtpad
                shape="rect"
                width={`${padWidth}mm`}
                height={`${padHeight}mm`}
                portHints={["1"]}
                coveredWithSolderMask
              />
            </footprint>
          }
        />
      ))}
    </board>
  )
}
```

This creates five rectangular pads spaced evenly across the board. Each pad is
covered with solder mask so a finger can slide across them without touching
bare copper.

## Connecting to a Microcontroller

In a real design, each touch pad connects to a capacitive touch input on a
microcontroller. Here is an example connecting a touch slider to an MCU:

```tsx
const TouchSliderWithMCU = () => {
  const padCount = 5
  const padSpacing = 5
  const totalWidth = padCount * padSpacing
  const startX = -totalWidth / 2 + padSpacing / 2

  return (
    <board width="50mm" height="30mm">
      {Array.from({ length: padCount }, (_, i) => (
        <chip
          key={`PAD${i + 1}`}
          name={`PAD${i + 1}`}
          pcbX={startX + i * padSpacing}
          pcbY={6}
          footprint={
            <footprint>
              <smtpad
                shape="rect"
                width="4mm"
                height="10mm"
                portHints={["1"]}
                coveredWithSolderMask
              />
            </footprint>
          }
        />
      ))}

      <chip name="U1" footprint="soic8" pcbY={-8} />

      {Array.from({ length: padCount }, (_, i) => (
        <trace
          key={`trace${i + 1}`}
          from={`.PAD${i + 1} > .1`}
          to={`.U1 > .${i + 1}`}
        />
      ))}
    </board>
  )
}
```

## Design Guidelines

- **Pad size**: Use pads at least 8mm x 8mm for reliable finger detection.
  Larger pads are more sensitive but take up more board space.

- **Spacing**: Leave 0.5mm to 1mm gaps between adjacent slider pads.
  Overlapping detection zones improve slider resolution.

- **Ground plane**: Place a ground plane beneath the touch pads with a gap.
  This creates a controlled reference capacitance.

- **Trace routing**: Keep traces from touch pads to the MCU short and away
  from noisy signals. Long or noisy traces degrade sensitivity.

- **Solder mask thickness**: Standard solder mask (typically 10-25 um) works
  well as the dielectric layer for capacitive sensing.

## Circuit JSON Output

When you use `coveredWithSolderMask` on an `<smtpad>`, the generated
circuit-json includes `is_covered_with_solder_mask: true` on the `pcb_smtpad`
element:

```json
{
  "type": "pcb_smtpad",
  "shape": "rect",
  "width": 10,
  "height": 10,
  "x": 0,
  "y": 0,
  "layer": "top",
  "is_covered_with_solder_mask": true,
  "port_hints": ["1"]
}
```

This field is recognized by PCB fabrication tools to keep the solder mask over
the pad instead of creating an opening.

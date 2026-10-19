# Custom Components & Props Guide

In **tscircuit**, hardware modules are defined as pure, reusable React components. Just like standard UI components, hardware components can accept typed props, encapsulate internal routing and decoupling passives, and expose clean external pins.

---

## 1. Anatomy of a Custom Hardware Component

A custom component returns a JSX hierarchy composed of chips, passives, and traces:

```tsx
import type { CommonLayoutProps } from "tscircuit"

export interface VoltageRegulatorProps extends CommonLayoutProps {
  name: string
  inputVoltage?: string // e.g. "5V"
  outputVoltage?: string // e.g. "3.3V"
}

export const VoltageRegulator = (props: VoltageRegulatorProps) => {
  return (
    <group {...props}>
      {/* Linear Regulator IC (SOT-223) */}
      <chip
        name={`${props.name}_U`}
        footprint="sot223"
        pinLabels={{
          pin1: "GND",
          pin2: "VOUT",
          pin3: "VIN",
          pin4: "VOUT_TAB",
        }}
        supplierPartNumbers={{
          jlcpcb: ["C6186"], // AMS1117-3.3
        }}
      />

      {/* Input Decoupling Capacitor 10uF 0805 */}
      <capacitor
        name={`${props.name}_CIN`}
        capacitance="10uF"
        footprint="0805"
        supplierPartNumbers={{ jlcpcb: ["C15849"] }}
      />

      {/* Output Filter Capacitor 22uF 0805 */}
      <capacitor
        name={`${props.name}_COUT`}
        capacitance="22uF"
        footprint="0805"
        supplierPartNumbers={{ jlcpcb: ["C45783"] }}
      />

      {/* Internal Bypass Routing */}
      <trace from={`.${props.name}_U > .VIN`} to={`.${props.name}_CIN > .pin1`} />
      <trace from={`.${props.name}_U > .VOUT`} to={`.${props.name}_COUT > .pin1`} />
      <trace from={`.${props.name}_U > .GND`} to={`.${props.name}_CIN > .pin2`} />
      <trace from={`.${props.name}_U > .GND`} to={`.${props.name}_COUT > .pin2`} />
    </group>
  )
}
```

---

## 2. Using `pinLabels` for Ergonomic Port Access

The `pinLabels` prop maps physical package pin numbers (e.g. `pin1`, `pin2`) to meaningful circuit signals (e.g. `VCC`, `GND`, `SDA`, `SCL`, `TX`, `RX`).

```tsx
<chip
  name="U1"
  footprint="soic8"
  pinLabels={{
    pin1: "VCC",
    pin2: "GND",
    pin3: "GPIO0",
    pin4: "GPIO1",
    pin5: "GPIO2",
    pin6: "GPIO3",
    pin7: "SCL",
    pin8: "SDA",
  }}
/>
```

Traces can connect directly to labeled pins using dot notation:
```tsx
<trace from=".U1 > .VCC" to="net.3V3" />
<trace from=".U1 > .GND" to="net.GND" />
```

---

## 3. Footprint Standards & KiCad Strings

tscircuit supports standard IPC footprint strings out of the box:
- **SMD Passives:** `0201`, `0402`, `0603`, `0805`, `1206`
- **IC Packages:** `soic8`, `soic16`, `sot23`, `sot223`, `tssop20`, `qfn32`, `qfp48`
- **Through-Hole:** `dip8`, `dip16`, `pinrow4`, `pinrow6`

You can also use custom KiCad footprint strings or models via `kicadFootprintStrings`.

---

## 4. Subcircuit Encapsulation & Net Scoping

Wrapping related modules in `<group subcircuit>` establishes a local electrical and schematic scope:
- Internal net names do not leak or conflict with identically named nets in other instances of the same component.
- The subcircuit can be placed, rotated, and duplicated easily across the board.

---

## 5. Manufacturing Metadata & Supplier Part Numbers

For turnkey manufacturing (such as JLCPCB or PCBWay SMT assembly), specify `supplierPartNumbers`:

```tsx
<resistor
  resistance="10k"
  footprint="0603"
  supplierPartNumbers={{
    jlcpcb: ["C25804"],
    lcsc: ["C25804"],
  }}
/>
```

These part numbers will automatically populate in the generated Bill of Materials (`getCircuitBom`) and Pick-and-Place files.

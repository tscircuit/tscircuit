# Pin Attributes

`pinAttributes` describes the electrical role and intended use of a component's
pins. tscircuit copies most of these attributes into Circuit JSON, where they
can be used by design-rule checks, simulation, board pinouts, and other tooling.

They are most useful on `<chip />` elements and custom components built on
`ChipProps`.

## Declaring pin attributes

`pinAttributes` is a record keyed by a pin label, pin name, or pin number alias.
Using the labels from `pinLabels` usually makes the component easiest to read:

```tsx
const pinLabels = {
  pin1: "VCC",
  pin2: "GND",
  pin3: "IRQ",
  pin4: "NC",
} as const

export default () => (
  <board width="20mm" height="20mm" routingDisabled>
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={pinLabels}
      pinAttributes={{
        VCC: { requiresPower: true, requiresVoltage: "3.3V" },
        GND: { requiresGround: true },
        IRQ: {
          mustBeConnected: true,
          capabilities: ["uart_rx"],
          activeCapability: "uart_rx",
        },
        NC: { doNotConnect: true },
      }}
    />
  </board>
)
```

The keys could also be written as `pin1`, `pin2`, and so on. Custom components
typed with `ChipProps<typeof pinLabels>` restrict `pinAttributes` keys to the
component's known pin numbers and labels.

## Warnings and checks triggered by pin attributes

The checks do not all mean the same thing. Some classify whether the chip is
sufficiently described, while others verify actual connectivity.

| Condition | Diagnostic | Result |
| --- | --- | --- |
| Every pin lacks a recognized attribute | `source_component_pins_underspecified_warning` | The chip needs at least one `pinAttributes` entry with a recognized source-pin attribute. |
| No pin has `requiresPower: true` | `source_no_power_pin_defined_warning` | Identify at least one power-input pin. `providesPower` does not satisfy this check. |
| No pin has `requiresGround: true` | `source_no_ground_pin_defined_warning` | Identify at least one ground-input pin. `providesGround` does not satisfy this check. |
| A pin with `requiresPower`, `requiresGround`, or `requiresVoltage` is floating | `source_pin_missing_trace_warning` | Connect the pin with a trace, or correct the attribute if the pin is not actually required. |
| A pin with `mustBeConnected: true` is floating | `source_pin_must_be_connected_error` | Connect the pin with a trace. This is a netlist error rather than a missing-trace warning. |

The three pin-specification checks are independent. For example, adding
`capabilities` to one pin removes the all-pins-underspecified warning, but the
chip will still warn if it has no `requiresPower` or `requiresGround` pin.
An attribute explicitly set to `false` is still considered specified, although
it does not enable that attribute's behavior.

Board-level checks run asynchronously near the end of rendering. When inspecting
Circuit JSON in a test or script, use `await circuit.renderUntilSettled()` so the
pin-specification warnings and `mustBeConnected` errors have been inserted.

### Example: a deliberately floating chip

The first example leaves `VCC`, `GND`, and `IRQ` floating. A full render produces:

```text
source_pin_missing_trace_warning: Port VCC on U1 is missing a trace
source_pin_missing_trace_warning: Port GND on U1 is missing a trace
source_pin_must_be_connected_error: Port IRQ on U1 must be connected but is floating
```

It does not produce the three specification warnings because the component has
recognized attributes and declares both required power and ground pins.

Connect the required pins to clear the connectivity diagnostics:

```tsx
export default () => (
  <board width="20mm" height="20mm" routingDisabled>
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "IRQ", pin4: "NC" }}
      pinAttributes={{
        VCC: { requiresPower: true, requiresVoltage: "3.3V" },
        GND: { requiresGround: true },
        IRQ: { mustBeConnected: true },
        NC: { doNotConnect: true },
      }}
    />
    <trace name="VCC_TRACE" from=".U1 > .VCC" to="net.VCC_3V3" />
    <trace name="GND_TRACE" from=".U1 > .GND" to="net.GND" />
    <trace name="IRQ_TRACE" from=".U1 > .IRQ" to="net.IRQ" />
  </board>
)
```

## Intentionally unconnected pins

Use `doNotConnect` for a pin that the datasheet says must remain floating:

```tsx
<chip
  name="U1"
  pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "NC" }}
  pinAttributes={{ NC: { doNotConnect: true } }}
/>
```

On `<chip />`, `noConnect` is a shorthand for the same intent:

```tsx
<chip
  name="U1"
  pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "NC" }}
  noConnect={["NC"]}
/>
```

A do-not-connect pin is excluded from the missing-trace warning. Do not combine
`doNotConnect: true` with `mustBeConnected: true`; those attributes express
contradictory requirements, and the must-be-connected check still expects a
trace.

## Attribute reference

The currently accepted attributes are grouped below. Attributes described as
metadata are preserved on source ports for downstream tools, but do not all have
a dedicated validation check today.

### Connectivity and power

- `mustBeConnected`: requires the pin to participate in a source trace.
- `requiresPower`, `requiresGround`: classify required supply pins and require a
  trace.
- `providesPower`, `providesGround`: classify supply-output pins.
- `requiresVoltage`, `providesVoltage`: record voltage requirements or output
  voltage as a number or string such as `3.3` or `"3.3V"`.
- `doNotConnect`: marks a pin as intentionally floating.

When a connected chip has a `providesPower` pin with a numeric
`providesVoltage` and a `providesGround` pin, core can use the pair as a
simulation voltage source.

### Digital capabilities and configuration

- `capabilities`: functions the pin supports.
- `activeCapability` or `activeCapabilities`: functions currently configured.
- Supported values are `i2c_sda`, `i2c_scl`, `spi_cs`, `spi_sck`, `spi_mosi`,
  `spi_miso`, `uart_tx`, and `uart_rx`.
- `isGpio`: marks the pin as general-purpose I/O metadata.

### Pull resistors and output drivers

- `canUseInternalPullup`, `isUsingInternalPullup`, `needsExternalPullup`
- `canUseInternalPulldown`, `isUsingInternalPulldown`, `needsExternalPulldown`
- `canUseOpenDrain`, `isUsingOpenDrain`
- `canUsePushPull`, `isUsingPushPull`

These attributes describe capability, active configuration, and external
requirements. They currently do not create pull resistors or traces for you.

### Pinout, decoupling, and display metadata

- `includeInBoardPinout`: includes the corresponding PCB port in generated board
  pinout data.
- `shouldHaveDecouplingCapacitor`: explicitly opts a power pin into or out of
  decoupling-capacitor behavior.
- `recommendedDecouplingCapacitorCapacitance`: records a suggested capacitance.
- `highlightColor`: associates a display color with the pin.

`highlightColor` and `isGpio` are accepted by the props schema but are not
currently copied onto `source_port` records and do not participate in the
source-pin specification checks. Do not use either one by itself merely to
suppress the underspecified warning; describe the pin's electrical role instead.

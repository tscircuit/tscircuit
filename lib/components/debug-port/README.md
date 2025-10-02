# Debug Port Component

A drop-in debugging component for tscircuit that provides ~20 debug connections for monitoring board traces.

## Features

- **RP2040 Microcontroller**: Acts as the receiver board with powerful processing capabilities
- **ADC Module**: Converts analog signals to digital without requiring programming
- **SPI/I2C/UART Interfaces**: Multiple communication protocols supported
- **Configurable Pin Count**: Up to 20 debug pins (default: 20)
- **Power Regulation**: Built-in voltage regulation and filtering
- **External Connections**: Easy access to debug signals via ports

## Architecture

The debug port consists of:

1. **RP2040 Chip**: Raspberry Pi RP2040 microcontroller with 32 GPIO pins
2. **ADC Module**: Analog-to-digital converter for signal monitoring
3. **SPI Header**: 6-pin header for SPI/I2C/UART communication
4. **Debug Header**: Configurable pin header for debug connections
5. **Power Circuit**: Resistor and capacitor for power regulation

## Usage

```typescript
import { createDebugPortJsx } from "tscircuit"

const debugPortCode = createDebugPortJsx({
  name: "DEBUG",        // Component name
  x: 60,               // X position
  y: 20,               // Y position
  pinCount: 16,        // Number of debug pins (1-20)
  width: 30,           // Board width in mm
  height: 20           // Board height in mm
})

// Use in your circuit
const circuit = (
  <board width="100mm" height="80mm">
    {/* Your circuit components */}
    <resistor name="R1" resistance="1k" />

    {/* Add debug port */}
    {debugPortCode}
  </board>
)
```

## Pin Mapping

- **RP2040 GPIOs 0-1**: Connected to ADC inputs
- **RP2040 GPIOs 2-5**: SPI/I2C/UART outputs (MOSI, MISO, SCK, CS)
- **RP2040 GPIOs 6-21**: Connected to debug pins D1-D16
- **External Ports**: Available as `DEBUG_EXT_D1`, `DEBUG_EXT_D2`, etc.

## Connections

The debug port provides these external connection points:

- **SPI Header** (6 pins): GND, 3.3V, MOSI, MISO, SCK, CS
- **Debug Pins** (configurable): D1, D2, ..., D20
- **Power**: 3.3V and GND available on SPI header

## Example Circuit

```typescript
import { createDebugPortJsx } from "tscircuit"

export const MyBoard = () => (
  <board width="100mm" height="80mm">
    {/* Main circuit */}
    <chip name="MAIN_MCU" footprint="qfp32" />
    <resistor name="R1" resistance="10k" />

    {/* Debug port for monitoring signals */}
    {createDebugPortJsx({
      name: "DEBUG",
      x: 60,
      y: 20,
      pinCount: 12
    })}

    {/* Connect debug pins to circuit traces */}
    <trace path={[".MAIN_MCU > .GPIO0", ".DEBUG > .DEBUG_EXT_D1"]} />
    <trace path={[".MAIN_MCU > .GPIO1", ".DEBUG > .DEBUG_EXT_D2"]} />
  </board>
)
```

## Default Configuration

- **Name**: "DEBUG_PORT"
- **Position**: (0, 0)
- **Dimensions**: 30mm × 20mm
- **Pins**: 20 debug pins
- **RP2040 Footprint**: QFN32
- **ADC Footprint**: SOIC8

## Customization

All aspects of the debug port can be customized:

- Component name and positioning
- Board dimensions
- Number of debug pins (1-20)
- All internal component parameters

This provides a complete debugging solution that can be dropped into any tscircuit design with minimal configuration.

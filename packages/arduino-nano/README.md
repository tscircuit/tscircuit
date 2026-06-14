# Arduino Nano V3.0 tscircuit Package

This package implements the Arduino Nano V3.0 board as a reusable tscircuit component.

## Usage

```tsx
import { ArduinoNano } from "@tscircuit/arduino-nano"

export default () => (
  <ArduinoNano />
)
```

## Features
- ATmega328P-AU Core
- CH340G USB-Serial Bridge
- 5V/3.3V Power Regulation
- Authentic 45mm x 18mm form factor

## BOM (Bill of Materials)
| Component | Part Number | Qty | Description |
|-----------|------------|-----|-------------|
| U1 | ATmega328P-AU | 1 | Microcontroller (TQFP-32) |
| U2 | CH340G | 1 | USB-UART bridge (SOIC-16) |
| U3 | AMS1117-5.0 | 1 | 5V Power Regulator (SOT-223) |
| Y1 | 16MHz Crystal | 1 | MCU Clock (HC49) |
| Y2 | 12MHz Crystal | 1 | CH340G Clock (HC49) |
| R1 | 10k Resistor | 1 | Reset Pull-up (0402) |
| R2 | 1k Resistor | 1 | LED Current Limiter (0402) |
| C1 | 100nF Capacitor | 1 | Auto-reset Cap (0402) |
| C2 | 100nF Capacitor | 1 | Decoupling Cap (0402) |
| L1 | Green LED | 1 | Power Indicator (0603) |
| L2 | Yellow LED | 1 | TX Indicator (0603) |
| L3 | Yellow LED | 1 | RX Indicator (0603) |

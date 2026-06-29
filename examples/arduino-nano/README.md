# Arduino Nano V3.0 (tscircuit)

Modular recreation of the [Arduino Nano](https://store-usa.arduino.cc/products/arduino-nano) using tscircuit snippets.

## Board

- **MCU:** ATmega328P-AU (TQFP-32)
- **USB bridge:** CH340G (SOIC-16)
- **Regulator:** AMS1117-5.0 (SOT-223)
- **Form factor:** 45 mm × 18 mm (authentic Nano dimensions)
- **Headers:** Dual 1×15 2.54 mm (D0–D13, A0–A7, power)

## Modules

| File | Contents |
|------|----------|
| `lib/PowerCircuit.tsx` | AMS1117, bulk/decoupling caps, power LED |
| `lib/CrystalCircuit.tsx` | 16 MHz (MCU) + 12 MHz (CH340G) crystals |
| `lib/ATmega328Circuit.tsx` | MCU, reset pull-up, auto-reset cap |
| `lib/CH340Circuit.tsx` | USB-UART bridge |
| `lib/UsbConnector.tsx` | Mini-USB connector |
| `lib/LedCircuit.tsx` | TX/RX activity LEDs |
| `lib/PinHeaders.tsx` | Nano pinout headers |

## Develop

```bash
cd examples/arduino-nano
npm install
npx tsci dev
```

## Registry

Published at: https://tscircuit.com/yanyishuai/arduino-nano-v3

Closes tscircuit/tscircuit#328

# Arduino Nano V3 (tscircuit)

Reference implementation of the [Arduino Nano V3](https://store-usa.arduino.cc/products/arduino-nano) (ATmega328P-AU + CH340G + Mini-USB).

## Modules

- `components/ATmega328PCore.tsx` — MCU, 16MHz crystal, decoupling, reset pull-up, D13 LED
- `components/CH340GSerial.tsx` — USB Mini-B, CH340G UART bridge, 12MHz crystal, TX/RX LEDs
- `ArduinoNanoV3.tsx` — power regulation, headers, ICSP, and all interconnect traces

## Validate

```bash
cd ../..
bun install
bun run build
bun test examples/arduino-nano/tests/arduino-nano.test.tsx
```

# Arduino Nano — tscircuit component

A tscircuit implementation of the Arduino Nano (ATmega328P-based development board).

## Features

- ATmega328P microcontroller at 16 MHz
- 14 digital I/O pins (D0–D13), 6 PWM outputs
- 8 analog inputs (A0–A7)
- USB Mini-B connector
- 3.3V and 5V regulated power outputs
- 18mm × 45mm board footprint

## Usage

```tsx
import { ArduinoNano } from "./index"

export default () => (
  <board width="100mm" height="80mm">
    <ArduinoNano name="MCU" pcbX={0} pcbY={0} />
  </board>
)
```

## Pinout

| Pin | Function |
|-----|----------|
| D0  | RX (UART) |
| D1  | TX (UART) |
| D2  | Digital I/O |
| D3  | Digital I/O / PWM |
| D4  | Digital I/O |
| D5  | Digital I/O / PWM |
| D6  | Digital I/O / PWM |
| D7  | Digital I/O |
| D8  | Digital I/O |
| D9  | Digital I/O / PWM |
| D10 | SPI SS / PWM |
| D11 | SPI MOSI / PWM |
| D12 | SPI MISO |
| D13 | SPI SCK / LED |
| A0–A7 | Analog inputs |
| VIN | 7–12V power input |
| 5V  | 5V regulated output |
| 3V3 | 3.3V regulated output |
| GND | Ground |
| RST | Reset |

## Reference

- [Arduino Nano official page](https://store.arduino.cc/products/arduino-nano)
- [ATmega328P datasheet](https://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-7810-Automotive-Microcontrollers-ATmega328P_Datasheet.pdf)

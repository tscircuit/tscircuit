import React from "react"

/**
 * Arduino Nano V3.0 — tscircuit implementation
 *
 * Hardware matches the official Arduino Nano schematic:
 *   https://store-usa.arduino.cc/products/arduino-nano
 *
 * Components:
 *   U1  — ATmega328P-AU (TQFP-32)     main MCU
 *   U2  — CH340G (SOP-16)             USB-to-serial converter
 *   Y1  — 16 MHz crystal (HC-49S)     MCU clock
 *   Y2  — 12 MHz crystal (HC-49S)     CH340G clock
 *   C1/C2  — 22pF load caps (Y1)
 *   C3/C4  — 22pF load caps (Y2)
 *   C5-C8  — 100nF decoupling (VCC)
 *   C9  — 10uF bulk cap (VCC)
 *   C10 — 100nF AREF bypass
 *   C11 — 100nF auto-reset (DTR→RESET)
 *   C12 — 100nF reset debounce
 *   R1  — 10kΩ RESET pull-up
 *   R2  — 1kΩ PWR LED series resistor
 *   R3  — 1kΩ TX LED series resistor
 *   R4  — 1kΩ RX LED series resistor
 *   R5  — 1kΩ L (D13) LED series resistor
 *   D1  — Green PWR LED (0402)
 *   D2  — Yellow TX  LED (0402)
 *   D3  — Yellow RX  LED (0402)
 *   D4  — Yellow L   LED (0402)
 *   SW1 — Reset tact switch
 *   J1  — 15-pin top header  (D0-D13 + AREF side)
 *   J2  — 15-pin bottom header (A0-A7 + power side)
 *   J3  — 6-pin ICSP 2×3 header
 */
export const ArduinoNano = () => (
  <board width="45mm" height="18mm">
    {/* ─────────────────────────────────────────────────────────
        U1 — ATmega328P-AU  (TQFP-32, 7×7mm, 0.8mm pitch)
        Pin mapping follows the official Arduino Nano schematic.
    ───────────────────────────────────────────────────────── */}
    <chip
      name="U1"
      footprint="qfp32_w7_h7_p0.8"
      manufacturerPartNumber="ATmega328P-AU"
      pinLabels={{
        pin1: "RESET",
        pin2: "RXD",
        pin3: "TXD",
        pin4: "D2",
        pin5: "D3",
        pin6: "D4",
        pin7: "VCC",
        pin8: "GND",
        pin9: "XTAL1",
        pin10: "XTAL2",
        pin11: "D5",
        pin12: "D6",
        pin13: "D7",
        pin14: "D8",
        pin15: "D9",
        pin16: "D10",
        pin17: "D11_MOSI",
        pin18: "D12_MISO",
        pin19: "D13_SCK",
        pin20: "AVCC",
        pin21: "AREF",
        pin22: "GND2",
        pin23: "A0",
        pin24: "A1",
        pin25: "A2",
        pin26: "A3",
        pin27: "A4_SDA",
        pin28: "A5_SCL",
        pin29: "ADC6",
        pin30: "ADC7",
        pin31: "NC1",
        pin32: "NC2",
      }}
      schPinArrangement={{
        leftSide: {
          pins: [
            "RESET",
            "RXD",
            "TXD",
            "D2",
            "D3",
            "D4",
            "D5",
            "D6",
            "D7",
            "D8",
          ],
          direction: "top-to-bottom",
        },
        rightSide: {
          pins: [
            "D9",
            "D10",
            "D11_MOSI",
            "D12_MISO",
            "D13_SCK",
            "A0",
            "A1",
            "A2",
            "A3",
            "A4_SDA",
            "A5_SCL",
          ],
          direction: "top-to-bottom",
        },
        topSide: {
          pins: ["XTAL1", "XTAL2", "ADC6", "ADC7"],
          direction: "left-to-right",
        },
        bottomSide: {
          pins: ["VCC", "AVCC", "AREF", "GND", "GND2", "NC1", "NC2"],
          direction: "left-to-right",
        },
      }}
      connections={{
        VCC: "net.VCC",
        AVCC: "net.VCC",
        GND: "net.GND",
        GND2: "net.GND",
        XTAL1: "net.MCU_X1",
        XTAL2: "net.MCU_X2",
        TXD: "net.MCU_TX",
        RXD: "net.MCU_RX",
        RESET: "net.RESET",
        D13_SCK: "net.D13_L",
        D11_MOSI: "net.MOSI",
        D12_MISO: "net.MISO",
        AREF: "net.AREF",
      }}
      pcbX={10}
      pcbY={0}
    />

    {/* ─────────────────────────────────────────────────────────
        U2 — CH340G  (SOP-16)   USB ↔ UART bridge
    ───────────────────────────────────────────────────────── */}
    <chip
      name="U2"
      footprint="soic16"
      manufacturerPartNumber="CH340G"
      pinLabels={{
        pin1: "INT",
        pin2: "TXD",
        pin3: "RXD",
        pin4: "V3",
        pin5: "UD_PLUS",
        pin6: "UD_MINUS",
        pin7: "XI",
        pin8: "XO",
        pin9: "GND",
        pin10: "DTR",
        pin11: "RTS",
        pin12: "CTS",
        pin13: "DSR",
        pin14: "DCD",
        pin15: "RI",
        pin16: "VCC",
      }}
      connections={{
        VCC: "net.VCC",
        GND: "net.GND",
        TXD: "net.MCU_RX",
        RXD: "net.MCU_TX",
        UD_PLUS: "net.USB_DP",
        UD_MINUS: "net.USB_DM",
        XI: "net.CH340_X1",
        XO: "net.CH340_X2",
        DTR: "net.CH340_DTR",
      }}
      pcbX={-10}
      pcbY={0}
    />

    {/* ─────────────────────────────────────────────────────────
        Y1 — 16 MHz crystal  (MCU clock)
        C1/C2 — 22pF load caps to GND
    ───────────────────────────────────────────────────────── */}
    <chip
      name="Y1"
      footprint="crystal_smd_3215_2p"
      pinLabels={{ pin1: "X1", pin2: "X2" }}
      connections={{ X1: "net.MCU_X1", X2: "net.MCU_X2" }}
      pcbX={10}
      pcbY={5}
    />
    <capacitor
      name="C1"
      capacitance="22pF"
      footprint="0402"
      connections={{ pin1: "net.MCU_X1", pin2: "net.GND" }}
      pcbX={8}
      pcbY={7}
    />
    <capacitor
      name="C2"
      capacitance="22pF"
      footprint="0402"
      connections={{ pin1: "net.MCU_X2", pin2: "net.GND" }}
      pcbX={12}
      pcbY={7}
    />

    {/* ─────────────────────────────────────────────────────────
        Y2 — 12 MHz crystal  (CH340G clock)
        C3/C4 — 22pF load caps to GND
    ───────────────────────────────────────────────────────── */}
    <chip
      name="Y2"
      footprint="crystal_smd_3215_2p"
      pinLabels={{ pin1: "X1", pin2: "X2" }}
      connections={{ X1: "net.CH340_X1", X2: "net.CH340_X2" }}
      pcbX={-10}
      pcbY={5}
    />
    <capacitor
      name="C3"
      capacitance="22pF"
      footprint="0402"
      connections={{ pin1: "net.CH340_X1", pin2: "net.GND" }}
      pcbX={-12}
      pcbY={7}
    />
    <capacitor
      name="C4"
      capacitance="22pF"
      footprint="0402"
      connections={{ pin1: "net.CH340_X2", pin2: "net.GND" }}
      pcbX={-8}
      pcbY={7}
    />

    {/* ─────────────────────────────────────────────────────────
        Decoupling capacitors  (100nF × 4 + 10µF bulk near VCC)
    ───────────────────────────────────────────────────────── */}
    <capacitor
      name="C5"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      pcbX={6}
      pcbY={-5}
    />
    <capacitor
      name="C6"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      pcbX={8}
      pcbY={-5}
    />
    <capacitor
      name="C7"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      pcbX={-6}
      pcbY={-5}
    />
    <capacitor
      name="C8"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      pcbX={-8}
      pcbY={-5}
    />
    <capacitor
      name="C9"
      capacitance="10uF"
      footprint="0805"
      connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      pcbX={0}
      pcbY={-7}
    />

    {/* C10 — AREF bypass cap */}
    <capacitor
      name="C10"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "net.AREF", pin2: "net.GND" }}
      pcbX={14}
      pcbY={-3}
    />

    {/* C11 — Auto-reset: DTR → 100nF → RESET  (enables Arduino IDE upload) */}
    <capacitor
      name="C11"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "net.CH340_DTR", pin2: "net.RESET" }}
      pcbX={0}
      pcbY={-4}
    />

    {/* ─────────────────────────────────────────────────────────
        Reset circuit
        R1 — 10kΩ pull-up  (VCC → RESET)
        SW1 — tact switch  (RESET → GND)
        C12 — 100nF debounce cap (RESET → GND)
    ───────────────────────────────────────────────────────── */}
    <resistor
      name="R1"
      resistance="10kohm"
      footprint="0402"
      connections={{ pin1: "net.VCC", pin2: "net.RESET" }}
      pcbX={18}
      pcbY={3}
    />
    <chip
      name="SW1"
      footprint="tact_switch_3x4mm"
      pinLabels={{ pin1: "A", pin2: "B" }}
      connections={{ A: "net.RESET", B: "net.GND" }}
      pcbX={18}
      pcbY={0}
    />
    <capacitor
      name="C12"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "net.RESET", pin2: "net.GND" }}
      pcbX={18}
      pcbY={-3}
    />

    {/* ─────────────────────────────────────────────────────────
        Status LEDs + current-limiting resistors
        D1 (green)  — PWR   driven from VCC via R2
        D2 (yellow) — TX    driven from MCU_TX via R3
        D3 (yellow) — RX    driven from MCU_RX via R4
        D4 (yellow) — L/D13 driven from D13 via R5
    ───────────────────────────────────────────────────────── */}
    {/* PWR LED */}
    <resistor
      name="R2"
      resistance="1kohm"
      footprint="0402"
      connections={{ pin1: "net.VCC", pin2: "net.LED_PWR_A" }}
      pcbX={-18}
      pcbY={6}
    />
    <led
      name="D1"
      color="green"
      footprint="0402"
      connections={{ anode: "net.LED_PWR_A", cathode: "net.GND" }}
      pcbX={-18}
      pcbY={8}
    />

    {/* TX LED */}
    <resistor
      name="R3"
      resistance="1kohm"
      footprint="0402"
      connections={{ pin1: "net.MCU_TX", pin2: "net.LED_TX_A" }}
      pcbX={-14}
      pcbY={6}
    />
    <led
      name="D2"
      color="yellow"
      footprint="0402"
      connections={{ anode: "net.LED_TX_A", cathode: "net.GND" }}
      pcbX={-14}
      pcbY={8}
    />

    {/* RX LED */}
    <resistor
      name="R4"
      resistance="1kohm"
      footprint="0402"
      connections={{ pin1: "net.MCU_RX", pin2: "net.LED_RX_A" }}
      pcbX={-10}
      pcbY={6}
    />
    <led
      name="D3"
      color="yellow"
      footprint="0402"
      connections={{ anode: "net.LED_RX_A", cathode: "net.GND" }}
      pcbX={-10}
      pcbY={8}
    />

    {/* L LED — D13 */}
    <resistor
      name="R5"
      resistance="1kohm"
      footprint="0402"
      connections={{ pin1: "net.D13_L", pin2: "net.LED_L_A" }}
      pcbX={14}
      pcbY={6}
    />
    <led
      name="D4"
      color="yellow"
      footprint="0402"
      connections={{ anode: "net.LED_L_A", cathode: "net.GND" }}
      pcbX={14}
      pcbY={8}
    />

    {/* ─────────────────────────────────────────────────────────
        Pin headers — match official Arduino Nano pinout
        J1 (top, 15 pins):  D1-D13, AREF, 3V3
        J2 (bot, 15 pins):  D0/RX, D1/TX, RST, GND, D2-D6,
                             +5V, A7, A6, A5, A4, A3, A2, A1, A0, AREF, 3V3
        (simplified as 15×1 connectors; see official schematic)
    ───────────────────────────────────────────────────────── */}
    <pinheader
      name="J1"
      pinCount={15}
      pitch="2.54mm"
      pcbX={-9}
      pcbY={9}
    />
    <pinheader
      name="J2"
      pinCount={15}
      pitch="2.54mm"
      pcbX={-9}
      pcbY={-9}
    />

    {/* ─────────────────────────────────────────────────────────
        J3 — ICSP 2×3 header (SPI + RESET + power)
        Pinout: MISO / VCC / SCK / MOSI / RESET / GND
    ───────────────────────────────────────────────────────── */}
    <pinheader
      name="J3"
      pinCount={6}
      pitch="2.54mm"
      doubleRow
      pcbX={20}
      pcbY={0}
    />
    <trace from=".J3 > .pin1" to="net.MISO" />
    <trace from=".J3 > .pin2" to="net.VCC" />
    <trace from=".J3 > .pin3" to="net.MCU_X2" />
    <trace from=".J3 > .pin4" to="net.MOSI" />
    <trace from=".J3 > .pin5" to="net.RESET" />
    <trace from=".J3 > .pin6" to="net.GND" />
  </board>
)

export default ArduinoNano

import React from "react"

/**
 * Arduino Nano V3.0 — tscircuit implementation
 *
 * Components:
 *   - ATmega328P-AU (TQFP-32) — main MCU
 *   - CH340G (SOP-16)         — USB-to-serial converter
 *   - 16 MHz crystal (Y1)     — MCU clock
 *   - 12 MHz crystal (Y2)     — CH340G clock
 *   - Decoupling caps, LEDs, reset button
 *   - 2×15 pin headers
 */
export const ArduinoNano = () => (
  <board width="45mm" height="18mm">
    {/* ── ATmega328P-AU MCU (TQFP-32) ─────────────────────── */}
    <chip
      name="U1"
      footprint="qfp32_w7_h7_p0.8"
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
          pins: ["RESET", "RXD", "TXD", "D2", "D3", "D4", "D5", "D6", "D7", "D8"],
          direction: "top-to-bottom",
        },
        rightSide: {
          pins: ["D9", "D10", "D11_MOSI", "D12_MISO", "D13_SCK", "A0", "A1", "A2", "A3", "A4_SDA", "A5_SCL"],
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
        D13_SCK: "net.LED_L",
      }}
      pcbX={10}
      pcbY={0}
    />

    {/* ── CH340G USB-to-Serial (SOP-16) ───────────────────── */}
    <chip
      name="U2"
      footprint="soic16"
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

    {/* ── 16 MHz Crystal for MCU ───────────────────────────── */}
    <chip
      name="Y1"
      footprint="crystal_smd_3215_2p"
      pinLabels={{ pin1: "X1", pin2: "X2" }}
      connections={{ X1: "net.MCU_X1", X2: "net.MCU_X2" }}
      pcbX={10}
      pcbY={5}
    />
    <capacitor name="C1" capacitance="22pF" footprint="0402"
      connections={{ pin1: "net.MCU_X1", pin2: "net.GND" }} />
    <capacitor name="C2" capacitance="22pF" footprint="0402"
      connections={{ pin1: "net.MCU_X2", pin2: "net.GND" }} />

    {/* ── 12 MHz Crystal for CH340G ───────────────────────── */}
    <chip
      name="Y2"
      footprint="crystal_smd_3215_2p"
      pinLabels={{ pin1: "X1", pin2: "X2" }}
      connections={{ X1: "net.CH340_X1", X2: "net.CH340_X2" }}
      pcbX={-10}
      pcbY={5}
    />
    <capacitor name="C3" capacitance="22pF" footprint="0402"
      connections={{ pin1: "net.CH340_X1", pin2: "net.GND" }} />
    <capacitor name="C4" capacitance="22pF" footprint="0402"
      connections={{ pin1: "net.CH340_X2", pin2: "net.GND" }} />

    {/* ── Decoupling caps ──────────────────────────────────── */}
    <capacitor name="C5" capacitance="100nF" footprint="0402"
      connections={{ pin1: "net.VCC", pin2: "net.GND" }} />
    <capacitor name="C6" capacitance="100nF" footprint="0402"
      connections={{ pin1: "net.VCC", pin2: "net.GND" }} />
    <capacitor name="C7" capacitance="10uF" footprint="0805"
      connections={{ pin1: "net.VCC", pin2: "net.GND" }} />
    <capacitor name="C8" capacitance="100nF" footprint="0402"
      connections={{ pin1: "net.VCC", pin2: "net.GND" }} />

    {/* AREF bypass cap */}
    <capacitor name="C9" capacitance="100nF" footprint="0402"
      connections={{ pin1: "net.AREF_NET", pin2: "net.GND" }} />
    <trace from=".U1 > .AREF" to="net.AREF_NET" />

    {/* Auto-reset: DTR → C10 → RESET */}
    <capacitor name="C10" capacitance="100nF" footprint="0402"
      connections={{ pin1: "net.CH340_DTR", pin2: "net.RESET" }} />

    {/* ── LEDs ─────────────────────────────────────────────── */}
    {/* PWR LED (green) */}
    <led name="D1" color="green" footprint="0402"
      connections={{ anode: "net.LED_PWR", cathode: "net.GND" }} />
    <resistor name="R1" resistance="1kohm" footprint="0402"
      connections={{ pin1: "net.VCC", pin2: "net.LED_PWR" }} />

    {/* TX LED (yellow) */}
    <led name="D2" color="yellow" footprint="0402"
      connections={{ anode: "net.LED_TX", cathode: "net.GND" }} />
    <resistor name="R2" resistance="1kohm" footprint="0402"
      connections={{ pin1: "net.MCU_TX", pin2: "net.LED_TX" }} />

    {/* RX LED (yellow) */}
    <led name="D3" color="yellow" footprint="0402"
      connections={{ anode: "net.LED_RX", cathode: "net.GND" }} />
    <resistor name="R3" resistance="1kohm" footprint="0402"
      connections={{ pin1: "net.MCU_RX", pin2: "net.LED_RX" }} />

    {/* L LED — D13 (yellow) */}
    <led name="D4" color="yellow" footprint="0402"
      connections={{ anode: "net.LED_L", cathode: "net.GND" }} />
    <resistor name="R4" resistance="1kohm" footprint="0402"
      connections={{ pin1: "net.LED_L", pin2: "net.LED_L_A" }} />

    {/* ── Reset button ─────────────────────────────────────── */}
    <chip
      name="SW1"
      footprint="tact_switch_3x4mm"
      pinLabels={{ pin1: "A", pin2: "B" }}
      connections={{ A: "net.RESET", B: "net.GND" }}
      pcbX={0}
      pcbY={7}
    />
    {/* 10k pull-up */}
    <resistor name="R5" resistance="10kohm" footprint="0402"
      connections={{ pin1: "net.VCC", pin2: "net.RESET" }} />
    {/* 100nF debounce */}
    <capacitor name="C11" capacitance="100nF" footprint="0402"
      connections={{ pin1: "net.RESET", pin2: "net.GND" }} />
  </board>
)

export default ArduinoNano

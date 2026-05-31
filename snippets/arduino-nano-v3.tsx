import React from "react"

/**
 * Arduino Nano V3.0 — Complete tscircuit implementation
 *
 * Components:
 * - ATmega328P-AU (TQFP-32) — main MCU
 * - CH340G (SOIC-16) — USB-to-serial
 * - AMS1117-5.0 (SOT-223) — 5V regulator
 * - AMS1117-3.3 (SOT-223) — 3.3V regulator
 * - 16MHz crystal + 22pF caps — MCU clock
 * - 12MHz crystal + 22pF caps — USB-serial clock
 * - Mini-B USB connector
 * - Power/TX/RX/L LEDs with 1kΩ resistors
 * - RESET button + 10kΩ pull-up
 * - DTR auto-reset circuit (100nF cap)
 * - ICSP 2×3 header
 * - 15-pin digital header (JP1)
 * - 15-pin analog/power header (JP2)
 *
 * Board dimensions: 45mm × 18mm (standard Nano size)
 */

const ATmega328P = (props: any) => (
  <chip
    manufacturerPartNumber="ATmega328P-AU"
    footprint="tqfp32_p0.8mm"
    pinLabels={{
      pin1: "D3",
      pin2: "D4",
      pin3: "GND1",
      pin4: "VCC1",
      pin5: "GND2",
      pin6: "VCC2",
      pin7: "XTAL1",
      pin8: "XTAL2",
      pin9: "D5",
      pin10: "D6",
      pin11: "D7",
      pin12: "D8",
      pin13: "D9",
      pin14: "D10_SS",
      pin15: "D11_MOSI",
      pin16: "D12_MISO",
      pin17: "D13_SCK",
      pin18: "AVCC",
      pin19: "A6",
      pin20: "AREF",
      pin21: "GND3",
      pin22: "A7",
      pin23: "A0",
      pin24: "A1",
      pin25: "A2",
      pin26: "A3",
      pin27: "A4_SDA",
      pin28: "A5_SCL",
      pin29: "RESET",
      pin30: "D0_RX",
      pin31: "D1_TX",
      pin32: "D2",
    }}
    schPinArrangement={{
      leftSide: {
        direction: "top-to-bottom",
        pins: [
          "pin30", "pin31", "pin32", "pin1", "pin2",
          "pin9", "pin10", "pin11", "pin12", "pin13",
          "pin14", "pin15", "pin16", "pin17", "pin29",
        ],
      },
      rightSide: {
        direction: "top-to-bottom",
        pins: [
          "pin23", "pin24", "pin25", "pin26", "pin27",
          "pin28", "pin19", "pin22", "pin20", "pin18",
          "pin7", "pin8",
        ],
      },
      topSide: { direction: "left-to-right", pins: ["pin4", "pin6"] },
      bottomSide: { direction: "left-to-right", pins: ["pin3", "pin5", "pin21"] },
    }}
    {...props}
  />
)

const CH340G = (props: any) => (
  <chip
    manufacturerPartNumber="CH340G"
    footprint="soic16_w3.9mm_p1.27mm"
    pinLabels={{
      pin1: "GND",
      pin2: "TXD",
      pin3: "RXD",
      pin4: "V3",
      pin5: "UD_PLUS",
      pin6: "UD_MINUS",
      pin7: "XI",
      pin8: "XO",
      pin9: "CTS",
      pin10: "DSR",
      pin11: "RI",
      pin12: "DCD",
      pin13: "DTR",
      pin14: "RTS",
      pin15: "R232",
      pin16: "VCC",
    }}
    schPinArrangement={{
      leftSide: {
        direction: "top-to-bottom",
        pins: ["pin16", "pin4", "pin7", "pin8", "pin5", "pin6", "pin15", "pin1"],
      },
      rightSide: {
        direction: "top-to-bottom",
        pins: ["pin2", "pin3", "pin13", "pin14", "pin9", "pin10", "pin11", "pin12"],
      },
    }}
    {...props}
  />
)

const AMS1117 = (props: any) => (
  <chip
    footprint="sot223"
    pinLabels={{
      pin1: "GND",
      pin2: "OUT",
      pin3: "IN",
      pin4: "OUT_TAB",
    }}
    {...props}
  />
)

const USB_MiniB = (props: any) => (
  <chip
    manufacturerPartNumber="USB-Mini-B"
    footprint="soic8_w5.23mm_p1.27mm"
    pinLabels={{
      pin1: "VBUS",
      pin2: "D_MINUS",
      pin3: "D_PLUS",
      pin4: "ID",
      pin5: "GND",
    }}
    schPinArrangement={{
      leftSide: {
        direction: "top-to-bottom",
        pins: ["pin1", "pin2", "pin3"],
      },
      rightSide: {
        direction: "top-to-bottom",
        pins: ["pin4", "pin5"],
      },
    }}
    {...props}
  />
)

const ArduinoNanoV3 = () => (
  <board width="45mm" height="18mm" autorouterEffortLevel="100x">
    {/* ── Ground planes ── */}
    <copperpour
      name="GND_TOP"
      layer="top"
      connectsTo="net.GND"
      padMargin="0.25mm"
      traceMargin="0.25mm"
      boardEdgeMargin="0.4mm"
    />
    <copperpour
      name="GND_BOTTOM"
      layer="bottom"
      connectsTo="net.GND"
      padMargin="0.25mm"
      traceMargin="0.25mm"
      boardEdgeMargin="0.4mm"
    />

    {/* ── MCU: ATmega328P-AU ── */}
    <ATmega328P
      name="U1"
      schX={0}
      schY={0}
      pcbX={0}
      pcbY={0}
      connections={{
        pin1: "net.D3",
        pin2: "net.D4",
        pin3: "net.GND",
        pin4: "net.VCC5",
        pin5: "net.GND",
        pin6: "net.VCC5",
        pin7: "net.XTAL16_1",
        pin8: "net.XTAL16_2",
        pin9: "net.D5",
        pin10: "net.D6",
        pin11: "net.D7",
        pin12: "net.D8",
        pin13: "net.D9",
        pin14: "net.D10_SS",
        pin15: "net.D11_MOSI",
        pin16: "net.D12_MISO",
        pin17: "net.D13_SCK",
        pin18: "net.VCC5",
        pin19: "net.A6",
        pin20: "net.AREF",
        pin21: "net.GND",
        pin22: "net.A7",
        pin23: "net.A0",
        pin24: "net.A1",
        pin25: "net.A2",
        pin26: "net.A3",
        pin27: "net.A4_SDA",
        pin28: "net.A5_SCL",
        pin29: "net.RESET",
        pin30: "net.D0_RX",
        pin31: "net.D1_TX",
        pin32: "net.D2",
      }}
    />

    {/* ── USB-to-Serial: CH340G ── */}
    <CH340G
      name="U2"
      schX={12}
      schY={0}
      pcbX={11}
      pcbY={1.5}
      connections={{
        pin1: "net.GND",
        pin2: "net.D0_RX",
        pin3: "net.D1_TX",
        pin4: "net.VCC3V3",
        pin5: "net.USB_DP",
        pin6: "net.USB_DM",
        pin7: "net.XTAL12_1",
        pin8: "net.XTAL12_2",
        pin9: "net.GND",
        pin10: "net.GND",
        pin11: "net.GND",
        pin12: "net.GND",
        pin13: "net.DTR",
        pin14: "net.GND",
        pin15: "net.GND",
        pin16: "net.VCC5",
      }}
    />

    {/* ── 5V Regulator ── */}
    <AMS1117
      name="U3"
      schX={-12}
      schY={6}
      pcbX={-14}
      pcbY={-4}
      connections={{
        pin1: "net.GND",
        pin2: "net.VCC5",
        pin4: "net.VCC5",
        pin3: "net.VIN",
      }}
    />

    {/* ── 3.3V Regulator ── */}
    <AMS1117
      name="U4"
      schX={-12}
      schY={-6}
      pcbX={-14}
      pcbY={4}
      connections={{
        pin1: "net.GND",
        pin2: "net.VCC3V3",
        pin4: "net.VCC3V3",
        pin3: "net.VCC5",
      }}
    />

    {/* ── USB Mini-B Connector ── */}
    <USB_MiniB
      name="J1"
      schX={18}
      schY={0}
      pcbX={17}
      pcbY={0}
      connections={{
        pin1: "net.VIN",
        pin2: "net.USB_DM",
        pin3: "net.USB_DP",
        pin4: "net.GND",
        pin5: "net.GND",
      }}
    />

    {/* ── 16MHz Crystal (MCU) ── */}
    <crystal
      name="Y1"
      frequency="16MHz"
      loadCapacitance="22pF"
      footprint="hc49"
      schX={4}
      schY={8}
      pcbX={-4}
      pcbY={-5}
      connections={{ pin1: "net.XTAL16_1", pin2: "net.XTAL16_2" }}
    />

    {/* ── 16MHz Load Capacitors ── */}
    <capacitor
      name="C1"
      capacitance="22pF"
      footprint="0402"
      schX={2}
      schY={10}
      pcbX={-6}
      pcbY={-5}
      connections={{ pin1: "net.XTAL16_1", pin2: "net.GND" }}
    />
    <capacitor
      name="C2"
      capacitance="22pF"
      footprint="0402"
      schX={6}
      schY={10}
      pcbX={-2}
      pcbY={-5}
      connections={{ pin1: "net.XTAL16_2", pin2: "net.GND" }}
    />

    {/* ── 12MHz Crystal (CH340G) ── */}
    <crystal
      name="Y2"
      frequency="12MHz"
      loadCapacitance="22pF"
      footprint="hc49"
      schX={16}
      schY={8}
      pcbX={11}
      pcbY={-5}
      connections={{ pin1: "net.XTAL12_1", pin2: "net.XTAL12_2" }}
    />

    {/* ── 12MHz Load Capacitors ── */}
    <capacitor
      name="C3"
      capacitance="22pF"
      footprint="0402"
      schX={14}
      schY={10}
      pcbX={9}
      pcbY={-5}
      connections={{ pin1: "net.XTAL12_1", pin2: "net.GND" }}
    />
    <capacitor
      name="C4"
      capacitance="22pF"
      footprint="0402"
      schX={18}
      schY={10}
      pcbX={13}
      pcbY={-5}
      connections={{ pin1: "net.XTAL12_2", pin2: "net.GND" }}
    />

    {/* ── Decoupling Capacitors ── */}
    <capacitor
      name="C5"
      capacitance="100nF"
      footprint="0402"
      schX={-4}
      schY={4}
      pcbX={4}
      pcbY={6}
      connections={{ pin1: "net.VCC5", pin2: "net.GND" }}
    />
    <capacitor
      name="C6"
      capacitance="100nF"
      footprint="0402"
      schX={-4}
      schY={2}
      pcbX={-4}
      pcbY={6}
      connections={{ pin1: "net.AVCC", pin2: "net.GND" }}
    />

    {/* ── DTR Auto-Reset Circuit ── */}
    <capacitor
      name="C7"
      capacitance="100nF"
      footprint="0402"
      schX={8}
      schY={-6}
      pcbX={8}
      pcbY={6}
      connections={{ pin1: "net.DTR", pin2: "net.RESET" }}
    />

    {/* ── RESET Pull-up ── */}
    <resistor
      name="R1"
      resistance="10k"
      footprint="0402"
      schX={-6}
      schY={-8}
      pcbX={-8}
      pcbY={-6}
      connections={{ pin1: "net.VCC5", pin2: "net.RESET" }}
    />

    {/* ── USB Series Resistors ── */}
    <resistor
      name="R2"
      resistance="22"
      footprint="0402"
      schX={16}
      schY={-4}
      pcbX={14}
      pcbY={-3}
      connections={{ pin1: "net.USB_DP", pin2: "net.USB_D_PLUS" }}
    />
    <resistor
      name="R3"
      resistance="22"
      footprint="0402"
      schX={16}
      schY={-6}
      pcbX={14}
      pcbY={3}
      connections={{ pin1: "net.USB_DM", pin2: "net.USB_D_MINUS" }}
    />

    {/* ── LEDs ── */}
    <led
      name="D1"
      color="green"
      footprint="0603"
      schX={-8}
      schY={-4}
      pcbX={-12}
      pcbY={-6}
      connections={{ anode: "net.VCC5", cathode: "net.GND" }}
    />
    <resistor
      name="R4"
      resistance="1k"
      footprint="0402"
      schX={-10}
      schY={-4}
      pcbX={-13}
      pcbY={-6}
      connections={{ pin1: "net.VCC5", pin2: "net.LED_PWR" }}
    />

    <led
      name="D2"
      color="yellow"
      footprint="0603"
      schX={4}
      schY={-8}
      pcbX={6}
      pcbY={7}
      connections={{ anode: "net.D1_TX", cathode: "net.GND" }}
    />
    <resistor
      name="R5"
      resistance="1k"
      footprint="0402"
      schX={6}
      schY={-8}
      pcbX={7}
      pcbY={7}
      connections={{ pin1: "net.D1_TX", pin2: "net.LED_TX" }}
    />

    <led
      name="D3"
      color="yellow"
      footprint="0603"
      schX={8}
      schY={-8}
      pcbX={8}
      pcbY={7}
      connections={{ anode: "net.D0_RX", cathode: "net.GND" }}
    />
    <resistor
      name="R6"
      resistance="1k"
      footprint="0402"
      schX={10}
      schY={-8}
      pcbX={9}
      pcbY={7}
      connections={{ pin1: "net.D0_RX", pin2: "net.LED_RX" }}
    />

    <led
      name="D4"
      color="yellow"
      footprint="0603"
      schX={-2}
      schY={-8}
      pcbX={4}
      pcbY={-7}
      connections={{ anode: "net.D13_SCK", cathode: "net.GND" }}
    />
    <resistor
      name="R7"
      resistance="1k"
      footprint="0402"
      schX={0}
      schY={-8}
      pcbX={5}
      pcbY={-7}
      connections={{ pin1: "net.D13_SCK", pin2: "net.LED_L" }}
    />

    {/* ── RESET Button ── */}
    <pushbutton
      name="SW1"
      footprint="tsop_6pin"
      schX={-8}
      schY={-8}
      pcbX={-10}
      pcbY={0}
      connections={{
        pin1: "net.RESET",
        pin2: "net.GND",
      }}
    />

    {/* ── Input Capacitor (VIN) ── */}
    <capacitor
      name="C8"
      capacitance="10uF"
      footprint="0805"
      schX={-16}
      schY={4}
      pcbX={-16}
      pcbY={-4}
      connections={{ pin1: "net.VIN", pin2: "net.GND" }}
    />

    {/* ── Output Capacitors ── */}
    <capacitor
      name="C9"
      capacitance="10uF"
      footprint="0805"
      schX={-8}
      schY={6}
      pcbX={-12}
      pcbY={-4}
      connections={{ pin1: "net.VCC5", pin2: "net.GND" }}
    />
    <capacitor
      name="C10"
      capacitance="10uF"
      footprint="0805"
      schX={-8}
      schY={-6}
      pcbX={-12}
      pcbY={4}
      connections={{ pin1: "net.VCC3V3", pin2: "net.GND" }}
    />

    {/* ── AREF Decoupling ── */}
    <capacitor
      name="C11"
      capacitance="100nF"
      footprint="0402"
      schX={-4}
      schY={0}
      pcbX={-6}
      pcbY={6}
      connections={{ pin1: "net.AREF", pin2: "net.GND" }}
    />

    {/* ── ICSP Header (2×3) ── */}
    <pinheader
      name="JP3"
      pinCount={6}
      schX={6}
      schY={6}
      pcbX={0}
      pcbY={-7}
      title="ICSP"
      pinLabels={{
        pin1: "MISO",
        pin2: "VCC5",
        pin3: "SCK",
        pin4: "MOSI",
        pin5: "RESET",
        pin6: "GND",
      }}
      connections={{
        pin1: "net.D12_MISO",
        pin2: "net.VCC5",
        pin3: "net.D13_SCK",
        pin4: "net.D11_MOSI",
        pin5: "net.RESET",
        pin6: "net.GND",
      }}
    />

    {/* ── Digital Header JP1 (1×15) ── */}
    <pinheader
      name="JP1"
      pinCount={15}
      schX={-18}
      schY={0}
      pcbX={-17}
      pcbY={-7}
      title="DIGITAL"
      pinLabels={{
        pin1: "D0_RX",
        pin2: "D1_TX",
        pin3: "D2",
        pin4: "D3",
        pin5: "D4",
        pin6: "D5",
        pin7: "D6",
        pin8: "D7",
        pin9: "D8",
        pin10: "D9",
        pin11: "D10_SS",
        pin12: "D11_MOSI",
        pin13: "D12_MISO",
        pin14: "D13_SCK",
        pin15: "GND",
      }}
      connections={{
        pin1: "net.D0_RX",
        pin2: "net.D1_TX",
        pin3: "net.D2",
        pin4: "net.D3",
        pin5: "net.D4",
        pin6: "net.D5",
        pin7: "net.D6",
        pin8: "net.D7",
        pin9: "net.D8",
        pin10: "net.D9",
        pin11: "net.D10_SS",
        pin12: "net.D11_MOSI",
        pin13: "net.D12_MISO",
        pin14: "net.D13_SCK",
        pin15: "net.GND",
      }}
    />

    {/* ── Analog/Power Header JP2 (1×15) ── */}
    <pinheader
      name="JP2"
      pinCount={15}
      schX={18}
      schY={-6}
      pcbX={17}
      pcbY={-7}
      title="ANALOG"
      pinLabels={{
        pin1: "AREF",
        pin2: "GND",
        pin3: "A0",
        pin4: "A1",
        pin5: "A2",
        pin6: "A3",
        pin7: "A4_SDA",
        pin8: "A5_SCL",
        pin9: "A6",
        pin10: "A7",
        pin11: "5V",
        pin12: "RESET",
        pin13: "3V3",
        pin14: "VIN",
        pin15: "GND",
      }}
      connections={{
        pin1: "net.AREF",
        pin2: "net.GND",
        pin3: "net.A0",
        pin4: "net.A1",
        pin5: "net.A2",
        pin6: "net.A3",
        pin7: "net.A4_SDA",
        pin8: "net.A5_SCL",
        pin9: "net.A6",
        pin10: "net.A7",
        pin11: "net.VCC5",
        pin12: "net.RESET",
        pin13: "net.VCC3V3",
        pin14: "net.VIN",
        pin15: "net.GND",
      }}
    />
  </board>
)

export default ArduinoNanoV3

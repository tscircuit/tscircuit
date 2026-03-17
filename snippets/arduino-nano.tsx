import React from "react"

/**
 * Arduino Nano - Full Circuit Implementation
 *
 * Based on the official Arduino Nano V3.0 schematic:
 * - ATmega328P-AU (TQFP-32) main MCU
 * - CH340G (SOP-16) USB-to-serial converter
 * - AMS1117-5.0 voltage regulator (5V output)
 * - Mini-USB connector
 * - 16MHz crystal for MCU, 12MHz crystal for CH340G
 * - Status LEDs: PWR (green), TX/RX (yellow), L on D13 (yellow)
 * - Reset button with pull-up & debounce
 * - 2×15 pin headers + 2×3 ICSP header
 * - Full decoupling capacitor network
 *
 * Board dimensions: 45mm × 18mm (standard Arduino Nano form factor)
 *
 * @see https://store-usa.arduino.cc/products/arduino-nano
 */

const atmega328pPinLabels = {
  // Port D
  pin30: "PD0_RXD",
  pin31: "PD1_TXD",
  pin32: "PD2",
  pin1: "PD3",
  pin2: "PD4",
  pin9: "PD5",
  pin10: "PD6",
  pin11: "PD7",
  // Port B
  pin12: "PB0",
  pin13: "PB1",
  pin14: "PB2_SS",
  pin15: "PB3_MOSI",
  pin16: "PB4_MISO",
  pin17: "PB5_SCK",
  pin7: "XTAL1",
  pin8: "XTAL2",
  // Port C (analog + I2C)
  pin23: "PC0_A0",
  pin24: "PC1_A1",
  pin25: "PC2_A2",
  pin26: "PC3_A3",
  pin27: "PC4_A4_SDA",
  pin28: "PC5_A5_SCL",
  pin29: "N_RESET",
  // ADC
  pin19: "ADC6",
  pin22: "ADC7",
  // Power
  pin3: "GND1",
  pin5: "GND2",
  pin21: "GND3",
  pin4: "VCC1",
  pin6: "VCC2",
  pin18: "AVCC",
  pin20: "AREF",
} as const

const ch340gPinLabels = {
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
  pin14: "N_RTS",
  pin15: "R232",
  pin16: "VCC",
} as const

export const ArduinoNano = () => (
  <board width="45mm" height="18mm">
    {/* ========== MICROCONTROLLER ========== */}
    <chip
      name="U1"
      footprint="tqfp32"
      pinLabels={atmega328pPinLabels}
      manufacturerPartNumber="ATmega328P-AU"
      supplierPartNumbers={{ jlcpcb: ["C14877"] }}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: [
            "N_RESET",
            "PD0_RXD",
            "PD1_TXD",
            "PD2",
            "PD3",
            "PD4",
            "PD5",
            "PD6",
            "PD7",
          ],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: [
            "PB0",
            "PB1",
            "PB2_SS",
            "PB3_MOSI",
            "PB4_MISO",
            "PB5_SCK",
            "PC0_A0",
            "PC1_A1",
            "PC2_A2",
            "PC3_A3",
            "PC4_A4_SDA",
            "PC5_A5_SCL",
          ],
        },
        topSide: {
          direction: "left-to-right",
          pins: ["XTAL1", "XTAL2", "ADC6", "ADC7"],
        },
        bottomSide: {
          direction: "left-to-right",
          pins: ["VCC1", "VCC2", "AVCC", "AREF", "GND1", "GND2", "GND3"],
        },
      }}
      connections={{
        GND1: "net.GND",
        GND2: "net.GND",
        GND3: "net.GND",
        VCC1: "net.VCC",
        VCC2: "net.VCC",
        AVCC: "net.VCC",
      }}
      pcbX={2}
      pcbY={0}
    />

    {/* ========== USB-SERIAL CONVERTER ========== */}
    <chip
      name="U2"
      footprint="soic16"
      pinLabels={ch340gPinLabels}
      manufacturerPartNumber="CH340G"
      supplierPartNumbers={{ jlcpcb: ["C14267"] }}
      connections={{
        GND: "net.GND",
        VCC: "net.VCC",
      }}
      pcbX={-14}
      pcbY={0}
    />

    {/* ========== VOLTAGE REGULATOR ========== */}
    <chip
      name="U3"
      footprint="sot223"
      pinLabels={{
        pin1: "GND",
        pin2: "VOUT",
        pin3: "VIN",
      }}
      manufacturerPartNumber="AMS1117-5.0"
      supplierPartNumbers={{ jlcpcb: ["C6187"] }}
      connections={{
        GND: "net.GND",
        VOUT: "net.VCC",
        VIN: "net.VIN",
      }}
      pcbX={-18}
      pcbY={-4}
    />

    {/* ========== USB CONNECTOR ========== */}
    <chip
      name="J_USB"
      footprint="soic8"
      pinLabels={{
        pin1: "VBUS",
        pin2: "D_MINUS",
        pin3: "D_PLUS",
        pin4: "ID",
        pin5: "GND",
      }}
      connections={{
        VBUS: "net.VIN",
        GND: "net.GND",
      }}
      pcbX={-20}
      pcbY={0}
    />

    {/* ========== 16MHz CRYSTAL (ATmega328P) ========== */}
    <crystal
      name="Y1"
      frequency="16MHz"
      loadCapacitance="18pF"
      footprint="hc49s"
      pcbX={8}
      pcbY={5}
    />
    {/* Crystal load capacitors */}
    <capacitor name="C1" capacitance="22pF" footprint="0402" pcbX={6} pcbY={6} />
    <capacitor name="C2" capacitance="22pF" footprint="0402" pcbX={10} pcbY={6} />

    {/* ========== 12MHz CRYSTAL (CH340G) ========== */}
    <crystal
      name="Y2"
      frequency="12MHz"
      loadCapacitance="18pF"
      footprint="hc49s"
      pcbX={-16}
      pcbY={5}
    />
    {/* Crystal load capacitors */}
    <capacitor
      name="C8"
      capacitance="22pF"
      footprint="0402"
      pcbX={-18}
      pcbY={6}
    />
    <capacitor
      name="C9"
      capacitance="22pF"
      footprint="0402"
      pcbX={-14}
      pcbY={6}
    />

    {/* ========== STATUS LEDs ========== */}
    {/* Power LED (green) */}
    <led name="LED_PWR" footprint="0402" color="green" pcbX={-8} pcbY={7} />
    <resistor name="R_PWR" resistance="1k" footprint="0402" pcbX={-10} pcbY={7} />

    {/* TX LED (yellow) - active when CH340G transmits */}
    <led name="LED_TX" footprint="0402" color="yellow" pcbX={-4} pcbY={7} />
    <resistor name="R_TX" resistance="1k" footprint="0402" pcbX={-6} pcbY={7} />

    {/* RX LED (yellow) - active when CH340G receives */}
    <led name="LED_RX" footprint="0402" color="yellow" pcbX={0} pcbY={7} />
    <resistor name="R_RX" resistance="1k" footprint="0402" pcbX={-2} pcbY={7} />

    {/* L LED on D13/PB5 (yellow) - user LED */}
    <led name="LED_L" footprint="0402" color="yellow" pcbX={4} pcbY={7} />
    <resistor name="R_L" resistance="1k" footprint="0402" pcbX={2} pcbY={7} />

    {/* ========== RESET CIRCUIT ========== */}
    <pushbutton name="SW_RST" footprint="sw_push_4pin" pcbX={14} pcbY={2} />
    {/* Pull-up resistor on RESET */}
    <resistor name="R_RST" resistance="10k" footprint="0402" pcbX={12} pcbY={4} />
    {/* Debounce capacitor */}
    <capacitor
      name="C_RST"
      capacitance="100nF"
      footprint="0402"
      pcbX={14}
      pcbY={5}
    />

    {/* ========== DECOUPLING CAPACITORS ========== */}
    {/* ATmega328P VCC decoupling */}
    <capacitor
      name="C3"
      capacitance="100nF"
      footprint="0402"
      pcbX={0}
      pcbY={-5}
    />
    <capacitor
      name="C4"
      capacitance="100nF"
      footprint="0402"
      pcbX={4}
      pcbY={-5}
    />
    {/* ATmega328P bulk capacitor */}
    <capacitor
      name="C5"
      capacitance="10uF"
      footprint="0805"
      pcbX={6}
      pcbY={-6}
    />
    {/* CH340G VCC decoupling */}
    <capacitor
      name="C6"
      capacitance="100nF"
      footprint="0402"
      pcbX={-12}
      pcbY={-5}
    />
    {/* ATmega328P AREF bypass capacitor */}
    <capacitor
      name="C_AREF"
      capacitance="100nF"
      footprint="0402"
      pcbX={4}
      pcbY={-7}
    />
    {/* CH340G V3 bypass (3.3V internal regulator) */}
    <capacitor
      name="C7"
      capacitance="100nF"
      footprint="0402"
      pcbX={-15}
      pcbY={-5}
    />
    {/* Voltage regulator input cap */}
    <capacitor
      name="C10"
      capacitance="10uF"
      footprint="0805"
      pcbX={-20}
      pcbY={-6}
    />
    {/* Voltage regulator output cap */}
    <capacitor
      name="C11"
      capacitance="10uF"
      footprint="0805"
      pcbX={-16}
      pcbY={-6}
    />

    {/* ========== PIN HEADERS ========== */}
    {/* Top header: D13-D0, AREF, A0-A7 (15 pins) */}
    <pinheader name="J_TOP" pinCount={15} pitch="2.54mm" pcbX={-7} pcbY={8} />
    {/* Bottom header: VIN, GND, RST, 5V, A0-A7, 3V3 (15 pins) */}
    <pinheader name="J_BOT" pinCount={15} pitch="2.54mm" pcbX={-7} pcbY={-8} />
    {/* ICSP header (2×3) */}
    <pinheader
      name="J_ICSP"
      pinCount={6}
      pitch="2.54mm"
      pcbX={18}
      pcbY={0}
    />

    {/* ========== TRACES: Crystal Connections ========== */}
    {/* 16MHz crystal → ATmega328P */}
    <trace from=".Y1 > .pin1" to=".U1 > .XTAL1" />
    <trace from=".Y1 > .pin2" to=".U1 > .XTAL2" />
    <trace from=".C1 > .pin1" to=".Y1 > .pin1" />
    <trace from=".C2 > .pin1" to=".Y1 > .pin2" />
    <trace from=".C1 > .pin2" to="net.GND" />
    <trace from=".C2 > .pin2" to="net.GND" />

    {/* 12MHz crystal → CH340G */}
    <trace from=".Y2 > .pin1" to=".U2 > .XI" />
    <trace from=".Y2 > .pin2" to=".U2 > .XO" />
    <trace from=".C8 > .pin1" to=".Y2 > .pin1" />
    <trace from=".C9 > .pin1" to=".Y2 > .pin2" />
    <trace from=".C8 > .pin2" to="net.GND" />
    <trace from=".C9 > .pin2" to="net.GND" />

    {/* ========== TRACES: USB-UART Bridge ========== */}
    <trace from=".U2 > .TXD" to=".U1 > .PD0_RXD" />
    <trace from=".U2 > .RXD" to=".U1 > .PD1_TXD" />
    {/* USB data lines */}
    <trace from=".J_USB > .D_PLUS" to=".U2 > .UD_PLUS" />
    <trace from=".J_USB > .D_MINUS" to=".U2 > .UD_MINUS" />
    {/* CH340G DTR → reset circuit (auto-reset for programming) */}
    <trace from=".U2 > .DTR" to=".C_RST > .pin1" />

    {/* ========== TRACES: CH340G V3 bypass cap ========== */}
    <trace from=".U2 > .V3" to=".C7 > .pin1" />
    <trace from=".C7 > .pin2" to="net.GND" />

    {/* ========== TRACES: Power LED ========== */}
    <trace from="net.VCC" to=".R_PWR > .pin1" />
    <trace from=".R_PWR > .pin2" to=".LED_PWR > .anode" />
    <trace from=".LED_PWR > .cathode" to="net.GND" />

    {/* ========== TRACES: TX LED ========== */}
    <trace from=".U2 > .TXD" to=".R_TX > .pin1" />
    <trace from=".R_TX > .pin2" to=".LED_TX > .anode" />
    <trace from=".LED_TX > .cathode" to="net.GND" />

    {/* ========== TRACES: RX LED ========== */}
    <trace from=".U2 > .RXD" to=".R_RX > .pin1" />
    <trace from=".R_RX > .pin2" to=".LED_RX > .anode" />
    <trace from=".LED_RX > .cathode" to="net.GND" />

    {/* ========== TRACES: L LED (D13/PB5) ========== */}
    <trace from=".U1 > .PB5_SCK" to=".R_L > .pin1" />
    <trace from=".R_L > .pin2" to=".LED_L > .anode" />
    <trace from=".LED_L > .cathode" to="net.GND" />

    {/* ========== TRACES: Reset Circuit ========== */}
    <trace from=".SW_RST > .pin1" to=".U1 > .N_RESET" />
    <trace from=".SW_RST > .pin2" to="net.GND" />
    <trace from="net.VCC" to=".R_RST > .pin1" />
    <trace from=".R_RST > .pin2" to=".U1 > .N_RESET" />
    {/* DTR auto-reset: cap already connected above */}
    <trace from=".C_RST > .pin2" to=".U1 > .N_RESET" />

    {/* ========== TRACES: AREF bypass ========== */}
    <trace from=".U1 > .AREF" to=".C_AREF > .pin1" />
    <trace from=".C_AREF > .pin2" to="net.GND" />

    {/* ========== TRACES: VCC decoupling ========== */}
    <trace from=".C3 > .pin1" to="net.VCC" />
    <trace from=".C3 > .pin2" to="net.GND" />
    <trace from=".C5 > .pin1" to="net.VCC" />
    <trace from=".C5 > .pin2" to="net.GND" />
    <trace from=".C6 > .pin1" to="net.VCC" />
    <trace from=".C6 > .pin2" to="net.GND" />

    {/* ========== TRACES: Voltage Regulator Caps ========== */}
    <trace from=".C10 > .pin1" to="net.VIN" />
    <trace from=".C10 > .pin2" to="net.GND" />
    <trace from=".C11 > .pin1" to="net.VCC" />
    <trace from=".C11 > .pin2" to="net.GND" />

    {/* ========== TRACES: ICSP Header ========== */}
    <trace from=".J_ICSP > .pin1" to=".U1 > .PB3_MOSI" />
    <trace from=".J_ICSP > .pin3" to=".U1 > .PB5_SCK" />
    <trace from=".J_ICSP > .pin4" to=".U1 > .PB4_MISO" />
    <trace from=".J_ICSP > .pin2" to="net.VCC" />
    <trace from=".J_ICSP > .pin5" to=".U1 > .N_RESET" />
    <trace from=".J_ICSP > .pin6" to="net.GND" />
  </board>
)

export default ArduinoNano

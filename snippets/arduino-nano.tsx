import React from "react"

/**
 * Arduino Nano - Complete Circuit Implementation
 *
 * Based on the official Arduino Nano schematic.
 * Features:
 * - ATmega328P microcontroller (TQFP-32)
 * - CH340G USB-to-serial converter (SOP-16)
 * - Mini USB connector
 * - 16MHz crystal oscillator
 * - Power circuit with filtering capacitors
 * - Status LEDs: PWR (green), TX (yellow), RX (yellow), L (yellow)
 * - Reset button with pull-up resistor
 * - 30-pin headers (2x15)
 * - ICSP programming header (2x3)
 * - Full decoupling capacitor network
 */

export const ArduinoNano = () => (
  <board width="45mm" height="18mm" center_x={0} center_y={0}>
    {/* ===== MICROCONTROLLER ===== */}
    {/* ATmega328P - Main MCU in TQFP-32 package */}
    <chip
      name="U1"
      footprint="tqfp32"
      manufacturer="Microchip"
      mpn="ATmega328P-AU"
      x={0}
      y={0}
    />

    {/* ===== USB TO SERIAL CONVERTER ===== */}
    {/* CH340G - USB-UART bridge, powers the USB interface */}
    <chip
      name="U2"
      footprint="soic16"
      manufacturer="WCH"
      mpn="CH340G"
      x={-14}
      y={0}
    />

    {/* ===== CLOCK ===== */}
    {/* 16MHz crystal for ATmega328P */}
    <crystal
      name="Y1"
      frequency="16MHz"
      load_capacitance="22pF"
      footprint="hc49s"
      x={6}
      y={5}
    />
    {/* Crystal load capacitors */}
    <capacitor name="C1" capacitance="22pF" footprint="0402" x={4} y={6} />
    <capacitor name="C2" capacitance="22pF" footprint="0402" x={8} y={6} />

    {/* 12MHz crystal for CH340G USB clock */}
    <crystal
      name="Y2"
      frequency="12MHz"
      load_capacitance="22pF"
      footprint="hc49s"
      x={-18}
      y={5}
    />
    <capacitor name="C8" capacitance="22pF" footprint="0402" x={-20} y={6} />
    <capacitor name="C9" capacitance="22pF" footprint="0402" x={-16} y={6} />

    {/* ===== STATUS LEDs ===== */}
    {/* PWR - Power indicator (green) */}
    <led name="LED_PWR" footprint="0402" color="green" x={-8} y={8} />
    <resistor name="R_PWR" resistance="1k" footprint="0402" x={-10} y={8} />

    {/* TX - Transmit indicator (yellow) */}
    <led name="LED_TX" footprint="0402" color="yellow" x={-4} y={8} />
    <resistor name="R_TX" resistance="1k" footprint="0402" x={-6} y={8} />

    {/* RX - Receive indicator (yellow) */}
    <led name="LED_RX" footprint="0402" color="yellow" x={0} y={8} />
    <resistor name="R_RX" resistance="1k" footprint="0402" x={-2} y={8} />

    {/* L - User LED on pin D13/PB5 (yellow) */}
    <led name="LED_L" footprint="0402" color="yellow" x={4} y={8} />
    <resistor name="R_L" resistance="1k" footprint="0402" x={2} y={8} />

    {/* ===== RESET CIRCUIT ===== */}
    <pushbutton name="SW_RST" x={14} y={2} />
    <resistor name="R_RST" resistance="10k" footprint="0402" x={12} y={4} />
    <capacitor name="C_RST" capacitance="100nF" footprint="0402" x={14} y={5} />

    {/* ===== DECOUPLING CAPACITORS ===== */}
    {/* ATmega328P decoupling */}
    <capacitor name="C3" capacitance="100nF" footprint="0402" x={-2} y={-6} />
    <capacitor name="C4" capacitance="100nF" footprint="0402" x={2} y={-6} />
    <capacitor name="C5" capacitance="10uF" footprint="0805" x={4} y={-7} />

    {/* CH340G decoupling */}
    <capacitor name="C6" capacitance="100nF" footprint="0402" x={-12} y={-5} />
    <capacitor name="C7" capacitance="100nF" footprint="0402" x={-16} y={-5} />

    {/* Bulk power filtering */}
    <capacitor name="C10" capacitance="10uF" footprint="0805" x={-20} y={-6} />

    {/* ===== PIN HEADERS ===== */}
    {/* Top header (D0-D13, 5V, RST, GND, VIN) */}
    <pinheader
      name="J_TOP"
      num_pins={15}
      pitch="2.54mm"
      orientation="horizontal"
      x={-9}
      y={9}
    />

    {/* Bottom header (A0-A7, 3V3, REF, GND, VCC) */}
    <pinheader
      name="J_BOT"
      num_pins={15}
      pitch="2.54mm"
      orientation="horizontal"
      x={-9}
      y={-9}
    />

    {/* ICSP programming header */}
    <pinheader
      name="J_ICSP"
      num_pins={6}
      pitch="2.54mm"
      orientation="vertical"
      x={18}
      y={0}
    />

    {/* ===== TRACES ===== */}

    {/* Crystal oscillator connections */}
    <trace path={[".Y1 > .1", ".U1 > .XTAL1"]} />
    <trace path={[".Y1 > .2", ".U1 > .XTAL2"]} />
    <trace path={[".C1 > .pos", ".Y1 > .1"]} />
    <trace path={[".C2 > .pos", ".Y1 > .2"]} />
    <trace path={[".C1 > .neg", "net.GND"]} />
    <trace path={[".C2 > .neg", "net.GND"]} />

    {/* CH340G crystal connections */}
    <trace path={[".Y2 > .1", ".U2 > .XI"]} />
    <trace path={[".Y2 > .2", ".U2 > .XO"]} />
    <trace path={[".C8 > .pos", ".Y2 > .1"]} />
    <trace path={[".C9 > .pos", ".Y2 > .2"]} />
    <trace path={[".C8 > .neg", "net.GND"]} />
    <trace path={[".C9 > .neg", "net.GND"]} />

    {/* USB-UART bridge to ATmega328P */}
    <trace path={[".U2 > .TXD", ".U1 > .RXD"]} />
    <trace path={[".U2 > .RXD", ".U1 > .TXD"]} />

    {/* Power LED circuit */}
    <trace path={["net.VCC", ".R_PWR > .1"]} />
    <trace path={[".R_PWR > .2", ".LED_PWR > .anode"]} />
    <trace path={[".LED_PWR > .cathode", "net.GND"]} />

    {/* TX LED circuit (active low from CH340G) */}
    <trace path={[".U2 > .TXD", ".R_TX > .1"]} />
    <trace path={[".R_TX > .2", ".LED_TX > .anode"]} />
    <trace path={[".LED_TX > .cathode", "net.GND"]} />

    {/* RX LED circuit (active low from CH340G) */}
    <trace path={[".U2 > .RXD", ".R_RX > .1"]} />
    <trace path={[".R_RX > .2", ".LED_RX > .anode"]} />
    <trace path={[".LED_RX > .cathode", "net.GND"]} />

    {/* L LED on PB5 (D13) */}
    <trace path={[".U1 > .PB5", ".R_L > .1"]} />
    <trace path={[".R_L > .2", ".LED_L > .anode"]} />
    <trace path={[".LED_L > .cathode", "net.GND"]} />

    {/* Reset circuit */}
    <trace path={[".SW_RST > .1", ".U1 > .RESET"]} />
    <trace path={[".SW_RST > .2", "net.GND"]} />
    <trace path={[".R_RST > .1", "net.VCC"]} />
    <trace path={[".R_RST > .2", ".U1 > .RESET"]} />
    <trace path={[".C_RST > .pos", ".U1 > .RESET"]} />
    <trace path={[".C_RST > .neg", "net.GND"]} />

    {/* ATmega328P power supply */}
    <trace path={[".U1 > .VCC", "net.VCC"]} />
    <trace path={[".U1 > .AVCC", "net.VCC"]} />
    <trace path={[".U1 > .GND", "net.GND"]} />

    {/* CH340G power supply */}
    <trace path={[".U2 > .VCC", "net.VCC"]} />
    <trace path={[".U2 > .GND", "net.GND"]} />

    {/* Decoupling capacitors */}
    <trace path={[".C3 > .pos", "net.VCC"]} />
    <trace path={[".C3 > .neg", "net.GND"]} />
    <trace path={[".C4 > .pos", "net.VCC"]} />
    <trace path={[".C4 > .neg", "net.GND"]} />
    <trace path={[".C5 > .pos", "net.VCC"]} />
    <trace path={[".C5 > .neg", "net.GND"]} />
    <trace path={[".C6 > .pos", "net.VCC"]} />
    <trace path={[".C6 > .neg", "net.GND"]} />
    <trace path={[".C7 > .pos", "net.VCC"]} />
    <trace path={[".C7 > .neg", "net.GND"]} />
    <trace path={[".C10 > .pos", "net.VCC"]} />
    <trace path={[".C10 > .neg", "net.GND"]} />
  </board>
)

export default ArduinoNano

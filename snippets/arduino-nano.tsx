import React from "react"

/**
 * Arduino Nano - Complete Circuit Implementation
 *
 * Based on the official Arduino Nano schematic.
 * Features:
 * - ATmega328P microcontroller (TQFP-32)
 * - CH340G USB-to-serial converter (SOP-16)
 * - 16MHz crystal oscillator for MCU
 * - 12MHz crystal oscillator for CH340G
 * - Status LEDs: PWR (green), TX (yellow), RX (yellow), L (yellow)
 * - Reset button with pull-up resistor and debounce cap
 * - 30-pin headers (2x15) and ICSP header (2x3)
 * - Full decoupling capacitor network
 */

export const ArduinoNano = () => (
  <board width="45mm" height="18mm">
    {/* ===== MICROCONTROLLER ===== */}
    {/* ATmega328P - Main MCU in TQFP-32 package */}
    <chip
      name="U1"
      footprint="tqfp32"
      manufacturerPartNumber="ATmega328P-AU"
      pcbX={0}
      pcbY={0}
    />

    {/* ===== USB TO SERIAL CONVERTER ===== */}
    {/* CH340G - USB-UART bridge */}
    <chip
      name="U2"
      footprint="soic16"
      manufacturerPartNumber="CH340G"
      pcbX={-14}
      pcbY={0}
    />

    {/* ===== 16MHz CLOCK (ATmega328P) ===== */}
    <crystal
      name="Y1"
      frequency="16MHz"
      loadCapacitance="22pF"
      footprint="hc49s"
      pcbX={6}
      pcbY={5}
    />
    <capacitor name="C1" capacitance="22pF" footprint="0402" pcbX={4} pcbY={6} />
    <capacitor name="C2" capacitance="22pF" footprint="0402" pcbX={8} pcbY={6} />

    {/* ===== 12MHz CLOCK (CH340G) ===== */}
    <crystal
      name="Y2"
      frequency="12MHz"
      loadCapacitance="22pF"
      footprint="hc49s"
      pcbX={-18}
      pcbY={5}
    />
    <capacitor name="C8" capacitance="22pF" footprint="0402" pcbX={-20} pcbY={6} />
    <capacitor name="C9" capacitance="22pF" footprint="0402" pcbX={-16} pcbY={6} />

    {/* ===== STATUS LEDs ===== */}
    <led name="LED_PWR" footprint="0402" color="green" pcbX={-8} pcbY={8} />
    <resistor name="R_PWR" resistance="1k" footprint="0402" pcbX={-10} pcbY={8} />

    <led name="LED_TX" footprint="0402" color="yellow" pcbX={-4} pcbY={8} />
    <resistor name="R_TX" resistance="1k" footprint="0402" pcbX={-6} pcbY={8} />

    <led name="LED_RX" footprint="0402" color="yellow" pcbX={0} pcbY={8} />
    <resistor name="R_RX" resistance="1k" footprint="0402" pcbX={-2} pcbY={8} />

    {/* L LED on D13 (PB5) */}
    <led name="LED_L" footprint="0402" color="yellow" pcbX={4} pcbY={8} />
    <resistor name="R_L" resistance="1k" footprint="0402" pcbX={2} pcbY={8} />

    {/* ===== RESET CIRCUIT ===== */}
    <pushbutton name="SW_RST" footprint="sw_push_4pin" pcbX={14} pcbY={2} />
    <resistor name="R_RST" resistance="10k" footprint="0402" pcbX={12} pcbY={4} />
    <capacitor name="C_RST" capacitance="100nF" footprint="0402" pcbX={14} pcbY={5} />

    {/* ===== DECOUPLING CAPACITORS ===== */}
    <capacitor name="C3" capacitance="100nF" footprint="0402" pcbX={-2} pcbY={-6} />
    <capacitor name="C4" capacitance="100nF" footprint="0402" pcbX={2} pcbY={-6} />
    <capacitor name="C5" capacitance="10uF" footprint="0805" pcbX={4} pcbY={-7} />
    <capacitor name="C6" capacitance="100nF" footprint="0402" pcbX={-12} pcbY={-5} />
    <capacitor name="C7" capacitance="100nF" footprint="0402" pcbX={-16} pcbY={-5} />
    <capacitor name="C10" capacitance="10uF" footprint="0805" pcbX={-20} pcbY={-6} />

    {/* ===== PIN HEADERS ===== */}
    <pinheader
      name="J_TOP"
      pinCount={15}
      pitch="2.54mm"
      pcbX={-9}
      pcbY={9}
    />
    <pinheader
      name="J_BOT"
      pinCount={15}
      pitch="2.54mm"
      pcbX={-9}
      pcbY={-9}
    />
    <pinheader
      name="J_ICSP"
      pinCount={6}
      pitch="2.54mm"
      doubleRow={true}
      pcbX={18}
      pcbY={0}
    />

    {/* ===== TRACES ===== */}

    {/* 16MHz crystal connections */}
    <trace path={[".Y1 > .1", ".U1 > .XTAL1"]} />
    <trace path={[".Y1 > .2", ".U1 > .XTAL2"]} />
    <trace path={[".C1 > .pos", ".Y1 > .1"]} />
    <trace path={[".C2 > .pos", ".Y1 > .2"]} />
    <trace path={[".C1 > .neg", "net.GND"]} />
    <trace path={[".C2 > .neg", "net.GND"]} />

    {/* 12MHz crystal connections for CH340G */}
    <trace path={[".Y2 > .1", ".U2 > .XI"]} />
    <trace path={[".Y2 > .2", ".U2 > .XO"]} />
    <trace path={[".C8 > .pos", ".Y2 > .1"]} />
    <trace path={[".C9 > .pos", ".Y2 > .2"]} />
    <trace path={[".C8 > .neg", "net.GND"]} />
    <trace path={[".C9 > .neg", "net.GND"]} />

    {/* USB-UART bridge to ATmega328P */}
    <trace path={[".U2 > .TXD", ".U1 > .RXD"]} />
    <trace path={[".U2 > .RXD", ".U1 > .TXD"]} />

    {/* Power LED */}
    <trace path={["net.VCC", ".R_PWR > .1"]} />
    <trace path={[".R_PWR > .2", ".LED_PWR > .anode"]} />
    <trace path={[".LED_PWR > .cathode", "net.GND"]} />

    {/* TX LED */}
    <trace path={[".U2 > .TXD", ".R_TX > .1"]} />
    <trace path={[".R_TX > .2", ".LED_TX > .anode"]} />
    <trace path={[".LED_TX > .cathode", "net.GND"]} />

    {/* RX LED */}
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

    {/* ATmega328P power */}
    <trace path={[".U1 > .VCC", "net.VCC"]} />
    <trace path={[".U1 > .AVCC", "net.VCC"]} />
    <trace path={[".U1 > .GND", "net.GND"]} />

    {/* CH340G power */}
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

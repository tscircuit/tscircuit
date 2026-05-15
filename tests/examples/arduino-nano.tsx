import { Board, Chip, Resistor, Capacitor, Crystal, Header, Diode } from "@tscircuit/core"

/**
 * Arduino Nano v3.3 - Full Circuit Implementation
 *
 * Based on official Arduino Nano schematic (Rev 3.3)
 * All 30 pins connected with proper net assignments
 *
 * Pin Headers:
 *   LEFT  (P1): D0-D13, GND, AREF, A0-A7
 *   RIGHT (P2): VIN, GND, 5V, 3V3, RST, D12-D0
 */

// ATmega328P TQFP-32 Pin Assignments
const ATMEGA = {
  // Port B (D8-D13)
  D13_PB5: 19, D12_PB4: 18, D11_PB3: 17,
  D10_PB2: 16, D9_PB1: 15, D8_PB0: 14,
  // Port C (analog)
  PC5_A5: 28, PC4_A4: 27, PC3_A3: 26,
  PC2_A2: 25, PC1_A1: 24, PC0_A0: 23,
  // Port D
  D7_PD7: 13, D6_PD6: 12, D5_PD5: 11,
  D4_PD4: 6, D3_PD3: 5, D2_PD2: 4,
  D1_TXD: 3, D0_RXD: 2,
  // Power
  VCC: 7, AVCC: 20, GND_A: 22, GND_B: 8,
  // Crystal
  XTAL1: 9, XTAL2: 10,
  // Special
  ADC6: 29, ADC7: 30,
  AREF: 21, RESET: 1,
}

export const ArduinoNano = () => (
  <board name="Arduino Nano v3.3" width={18} height={43}>
    {/* === POWER REGULATION === */}
    {/* 5V Regulator */}
    <chip
      name="U3" footprint="sot223" partNumber="AMS1117-5.0"
      pcbX={13} pcbY={38}
    />
    <trace from="U3.VIN" to="VIN" />
    <trace from="U3.VOUT" to="5V" />
    <trace from="U3.GND" to="GND" />
    <capacitor name="C1" capacitance="10uF" pcbX={15} pcbY={36} />
    <capacitor name="C2" capacitance="100nF" pcbX={11} pcbY={36} />
    <trace from="C1.pin1" to="5V" /><trace from="C1.pin2" to="GND" />
    <trace from="C2.pin1" to="5V" /><trace from="C2.pin2" to="GND" />

    {/* 3.3V Regulator */}
    <chip
      name="U4" footprint="sot223" partNumber="AMS1117-3.3"
      pcbX={13} pcbY={32}
    />
    <trace from="U4.VIN" to="5V" />
    <trace from="U4.VOUT" to="3V3" />
    <trace from="U4.GND" to="GND" />
    <capacitor name="C3" capacitance="10uF" pcbX={15} pcbY={30} />
    <capacitor name="C4" capacitance="100nF" pcbX={11} pcbY={30} />
    <trace from="C3.pin1" to="3V3" /><trace from="C3.pin2" to="GND" />
    <trace from="C4.pin1" to="3V3" /><trace from="C4.pin2" to="GND" />

    {/* === ATmega328P MCU === */}
    <chip
      name="U1" footprint="tqfp32" partNumber="ATmega328P"
      pcbX={9} pcbY={22}
    />

    {/* ATmega328P Power */}
    <trace from={} to="5V" />
    <trace from={} to="5V" />
    <trace from={} to="GND" />
    <trace from={} to="GND" />

    {/* Decoupling Caps */}
    <capacitor name="C5" capacitance="100nF" pcbX={13} pcbY={24} />
    <trace from="C5.pin1" to={} />
    <trace from="C5.pin2" to="GND" />
    <capacitor name="C6" capacitance="100nF" pcbX={5} pcbY={20} />
    <trace from="C6.pin1" to={} />
    <trace from="C6.pin2" to="GND" />

    {/* 16MHz Crystal + 22pF Load Caps */}
    <crystal name="Y1" frequency="16MHz" pcbX={4} pcbY={15} />
    <capacitor name="C7" capacitance="22pF" pcbX={2} pcbY={13} />
    <capacitor name="C8" capacitance="22pF" pcbX={2} pcbY={17} />
    <trace from={} to="Y1.pin1" />
    <trace from={} to="Y1.pin2" />
    <trace from="Y1.pin1" to="C7.pin1" /><trace from="C7.pin2" to="GND" />
    <trace from="Y1.pin2" to="C8.pin1" /><trace from="C8.pin2" to="GND" />

    {/* Reset Circuit: 10k pull-up to 5V */}
    <resistor name="R1" resistance="10k" pcbX={4} pcbY={8} />
    <trace from={} to="R1.pin1" />
    <trace from="R1.pin2" to="5V" />

    {/* AREF filtering */}
    <capacitor name="C12" capacitance="100nF" pcbX={6} pcbY={25} />
    <trace from={} to="C12.pin1" />
    <trace from="C12.pin2" to="GND" />

    {/* === CH340G USB-to-Serial === */}
    <chip
      name="U2" footprint="soic16" partNumber="CH340G"
      pcbX={9} pcbY={5}
    />
    <trace from="U2.5" to={} />  {/* CH340 TX → ATmega RX */}
    <trace from="U2.6" to={} />  {/* CH340 RX → ATmega TX */}
    <trace from="U2.16" to="5V" />   {/* CH340 VCC */}
    <trace from="U2.8" to="GND" />   {/* CH340 GND */}

    {/* CH340G 12MHz Crystal */}
    <crystal name="Y2" frequency="12MHz" pcbX={6} pcbY={3} />
    <trace from="U2.XI" to="Y2.pin1" />
    <trace from="U2.XO" to="Y2.pin2" />
    <capacitor name="C10" capacitance="22pF" pcbX={4} pcbY={1} />
    <capacitor name="C11" capacitance="22pF" pcbX={8} pcbY={1} />
    <trace from="Y2.pin1" to="C10.pin1" /><trace from="C10.pin2" to="GND" />
    <trace from="Y2.pin2" to="C11.pin1" /><trace from="C11.pin2" to="GND" />

    {/* CH340G Decoupling */}
    <capacitor name="C9" capacitance="100nF" pcbX={12} pcbY={3} />
    <trace from="C9.pin1" to="5V" />
    <trace from="C9.pin2" to="GND" />

    {/* CH340G D+ D- to USB */}
    <capacitor name="C13" capacitance="22pF" pcbX={11} pcbY={1} />
    <trace from="U2.3" to="USB_D+" />  {/* CH340 UD+ */}
    <trace from="U2.4" to="USB_D-" />  {/* CH340 UD- */}
    <resistor name="R2" resistance="1.5k" pcbX={13} pcbY={1} />
    <trace from="U2.3" to="R2.pin1" />
    <trace from="R2.pin2" to="USB_D+" />

    {/* === Pin Headers === */}
    {/* Left Header (P1): D0-D13, GND, AREF, A0-A7 */}
    <trace from="USB_D+" to="H1.pin1" />
    <trace from={} to="H1.pin1" />
    <trace from={} to="H1.pin2" />
    <trace from={} to="H1.pin3" />
    <trace from={} to="H1.pin4" />
    <trace from={} to="H1.pin5" />
    <trace from={} to="H1.pin6" />
    <trace from={} to="H1.pin7" />
    <trace from={} to="H1.pin8" />
    <trace from={} to="H1.pin9" />
    <trace from={} to="H1.pin10" />
    <trace from={} to="H1.pin11" />
    <trace from={} to="H1.pin12" />
    <trace from={} to="H1.pin13" />
    <trace from={} to="H1.pin14" />
    <trace from="GND" to="H1.pin15" />
    <trace from={} to="H1.pin16" />
    {/* ADC6, ADC7 not broken out on Nano - they are internal */}

    {/* Right Header (P2): VIN, GND, 5V, 3V3, RESET */}
    <trace from="VIN" to="H2.pin1" />
    <trace from="GND" to="H2.pin2" />
    <trace from="GND" to="H2.pin3" />
    <trace from="5V" to="H2.pin4" />
    <trace from="3V3" to="H2.pin5" />
    <trace from={} to="H2.pin6" />
    <trace from="GND" to="H2.pin7" />
    <trace from={} to="H2.pin8" />
    <trace from={} to="H2.pin9" />
    <trace from={} to="H2.pin10" />
    <trace from={} to="H2.pin11" />
    <trace from={} to="H2.pin12" />
    <trace from={} to="H2.pin13" />

    {/* ICSP header: MISO, MOSI, SCK, RESET, 5V, GND */}
    <trace from={} to="ICSP.MISO" />
    <trace from={} to="ICSP.MOSI" />
    <trace from={} to="ICSP.SCK" />
    <trace from={} to="ICSP.RESET" />
    <trace from="5V" to="ICSP.5V" />
    <trace from="GND" to="ICSP.GND" />
  </board>
)

export default ArduinoNano

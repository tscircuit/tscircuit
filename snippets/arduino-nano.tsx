import { sel } from "tscircuit"

/**
 * Arduino Nano V3.0 (ATmega328P)
 *
 * Based on the official Arduino Nano schematic.
 * - MCU: ATmega328P (TQFP-32)
 * - USB-Serial: CH340G
 * - Regulator: AMS1117-5.0 (5V) + AMS1117-3.3 (3.3V)
 * - Clock: 16 MHz crystal
 * - Auto-reset via DTR -> 100nF -> RESET
 *
 * For tscircuit/tscircuit issue #328
 * https://github.com/tscircuit/tscircuit/issues/328
 */

const ATmega328P = (props: any) => (
  <chip
    manufacturerPartNumber="ATmega328P-AU"
    pinLabels={{
      pin1: "PD3",
      pin2: "PD4",
      pin3: "GND",
      pin4: "VCC",
      pin5: "GND2",
      pin6: "VCC2",
      pin7: "XTAL1",
      pin8: "XTAL2",
      pin9: "PD5",
      pin10: "PD6",
      pin11: "PD7",
      pin12: "PB0",
      pin13: "PB1",
      pin14: "PB2",
      pin15: "PB3",
      pin16: "PB4",
      pin17: "PB5",
      pin18: "AVCC",
      pin19: "ADC6",
      pin20: "AREF",
      pin21: "GND3",
      pin22: "ADC7",
      pin23: "PC0",
      pin24: "PC1",
      pin25: "PC2",
      pin26: "PC3",
      pin27: "PC4",
      pin28: "PC5",
      pin29: "PC6",
      pin30: "PD0",
      pin31: "PD1",
      pin32: "PD2",
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
          "pin23", "pin24", "pin25", "pin26", "pin27", "pin28",
          "pin19", "pin22", "pin20", "pin18",
          "pin7", "pin8",
        ],
      },
      topSide: {
        direction: "left-to-right",
        pins: ["pin4", "pin6"],
      },
      bottomSide: {
        direction: "left-to-right",
        pins: ["pin3", "pin5", "pin21"],
      },
    }}
    {...props}
  />
)

const CH340G = (props: any) => (
  <chip
    manufacturerPartNumber="CH340G"
    pinLabels={{
      pin1: "TXD",
      pin2: "RXD",
      pin3: "V3",
      pin4: "UD_PLUS",
      pin5: "UD_MINUS",
      pin6: "XI",
      pin7: "XO",
      pin8: "TEST",
      pin9: "GND",
      pin10: "CTS",
      pin11: "DSR",
      pin12: "RI",
      pin13: "DCD",
      pin14: "DTR",
      pin15: "RTS",
      pin16: "VCC",
    }}
    schPinArrangement={{
      leftSide: {
        direction: "top-to-bottom",
        pins: ["pin16", "pin6", "pin7", "pin3", "pin4", "pin5", "pin8", "pin9"],
      },
      rightSide: {
        direction: "top-to-bottom",
        pins: ["pin1", "pin2", "pin14", "pin15", "pin10", "pin11", "pin12", "pin13"],
      },
    }}
    {...props}
  />
)

const AMS1117_5V = (props: any) => (
  <chip
    manufacturerPartNumber="AMS1117-5.0"
    pinLabels={{
      pin1: "ADJ_GND",
      pin2: "OUT",
      pin3: "IN",
      pin4: "OUT2",
    }}
    {...props}
  />
)

const AMS1117_3V3 = (props: any) => (
  <chip
    manufacturerPartNumber="AMS1117-3.3"
    pinLabels={{
      pin1: "ADJ_GND",
      pin2: "OUT",
      pin3: "IN",
      pin4: "OUT2",
    }}
    {...props}
  />
)

export const ArduinoNano = () => (
  <board width="18mm" height="46mm" autorouter="auto-cloud">

    {/* MCU */}
    <ATmega328P
      name="U1"
      footprint="tqfp32_p0.8mm"
      schX={0} schY={0}
      pcbX={0} pcbY={0}
      connections={{
        pin30: sel.U2.pin2,
        pin31: sel.U2.pin1,
        pin4: "net.VCC5",
        pin6: "net.VCC5",
        pin18: "net.VCC5",
        pin3: "net.GND",
        pin5: "net.GND",
        pin21: "net.GND",
        pin7: sel.Y1.pin1,
        pin8: sel.Y1.pin2,
        pin29: "net.RESET",
        pin15: sel.ICSP.pin4,
        pin16: sel.ICSP.pin1,
        pin17: sel.ICSP.pin3,
      }}
    />

    {/* USB-Serial bridge */}
    <CH340G
      name="U2"
      footprint="soic16_p1.27mm"
      schX={16} schY={0}
      pcbX={7} pcbY={0}
      connections={{
        pin3: "net.VCC3V3",
        pin8: "net.GND",
        pin9: "net.GND",
        pin14: "net.DTR_CAP",
        pin16: "net.VCC5",
      }}
    />

    {/* 16 MHz Crystal */}
    <chip
      name="Y1"
      manufacturerPartNumber="16MHz_Crystal"
      footprint="crystal_hc49s_p4.88mm"
      pinLabels={{ pin1: "IN", pin2: "OUT" }}
      schX={-8} schY={4}
      pcbX={-4} pcbY={4}
    />
    <capacitor name="C1" capacitance="22pF" footprint="0402"
      schX={-12} schY={6} pcbX={-4} pcbY={5.5}
      connections={{ pin1: sel.Y1.pin1, pin2: "net.GND" }} />
    <capacitor name="C2" capacitance="22pF" footprint="0402"
      schX={-12} schY={8} pcbX={-4} pcbY={6.5}
      connections={{ pin1: sel.Y1.pin2, pin2: "net.GND" }} />

    {/* 5V LDO */}
    <AMS1117_5V
      name="U3"
      footprint="sot223"
      schX={16} schY={-10}
      pcbX={7} pcbY={-8}
      connections={{ pin1: "net.GND", pin2: "net.VCC5", pin3: "net.VIN", pin4: "net.VCC5" }}
    />
    <capacitor name="C7" capacitance="10uF" footprint="0805"
      schX={20} schY={-10} pcbX={9} pcbY={-8}
      connections={{ pin1: "net.VIN", pin2: "net.GND" }} />
    <capacitor name="C8" capacitance="10uF" footprint="0805"
      schX={20} schY={-12} pcbX={9} pcbY={-6}
      connections={{ pin1: "net.VCC5", pin2: "net.GND" }} />

    {/* 3.3V LDO */}
    <AMS1117_3V3
      name="U4"
      footprint="sot223"
      schX={16} schY={-16}
      pcbX={7} pcbY={-12}
      connections={{ pin1: "net.GND", pin2: "net.VCC3V3", pin3: "net.VCC5", pin4: "net.VCC3V3" }}
    />
    <capacitor name="C9" capacitance="10uF" footprint="0805"
      schX={20} schY={-16} pcbX={9} pcbY={-12}
      connections={{ pin1: "net.VCC3V3", pin2: "net.GND" }} />

    {/* USB Mini-B */}
    <chip
      name="J1"
      manufacturerPartNumber="USB_MINI_B"
      footprint="usb_mini_b_p2.0mm"
      pinLabels={{ pin1: "VBUS", pin2: "D_MINUS", pin3: "D_PLUS", pin4: "ID", pin5: "GND" }}
      schX={24} schY={4}
      pcbX={9} pcbY={18}
      connections={{ pin1: "net.VUSB", pin2: sel.U2.pin5, pin3: sel.U2.pin4, pin5: "net.GND" }}
    />
    <capacitor name="C10" capacitance="100nF" footprint="0402"
      schX={24} schY={2}
      connections={{ pin1: "net.VUSB", pin2: "net.GND" }} />
    <chip
      name="D5"
      manufacturerPartNumber="B5819W"
      footprint="sod123"
      pinLabels={{ pin1: "A", pin2: "K" }}
      schX={22} schY={-2}
      connections={{ pin1: "net.VUSB", pin2: "net.VIN" }}
    />

    {/* Auto-reset */}
    <capacitor name="C6" capacitance="100nF" footprint="0402"
      schX={10} schY={-6} pcbX={3} pcbY={-6}
      connections={{ pin1: "net.DTR_CAP", pin2: "net.RESET" }} />
    <resistor name="R3" resistance="10kohm" footprint="0402"
      schX={6} schY={-8} pcbX={1} pcbY={-6}
      connections={{ pin1: "net.VCC5", pin2: "net.RESET" }} />

    {/* Reset button */}
    <pushbutton
      name="SW1"
      footprint="pushbutton_smd_4mm"
      schX={6} schY={-12} pcbX={1} pcbY={-10}
      connections={{ pin1: "net.RESET", pin2: "net.GND" }}
    />

    {/* LEDs */}
    <led name="LED_PWR" color="green" footprint="0402"
      schX={10} schY={-14} pcbX={3} pcbY={-14}
      connections={{ anode: "net.VCC5", cathode: "net.LED_PWR_K" }} />
    <resistor name="R1" resistance="1kohm" footprint="0402"
      schX={10} schY={-16} pcbX={3} pcbY={-15.5}
      connections={{ pin1: "net.LED_PWR_K", pin2: "net.GND" }} />

    <led name="LED_TX" color="orange" footprint="0402"
      schX={14} schY={-14} pcbX={5} pcbY={-14}
      connections={{ anode: "net.VCC5", cathode: "net.LED_TX_K" }} />
    <resistor name="R4" resistance="1kohm" footprint="0402"
      schX={14} schY={-16}
      connections={{ pin1: "net.LED_TX_K", pin2: sel.U1.pin31 }} />

    <led name="LED_RX" color="orange" footprint="0402"
      schX={18} schY={-14}
      connections={{ anode: "net.VCC5", cathode: "net.LED_RX_K" }} />
    <resistor name="R5" resistance="1kohm" footprint="0402"
      schX={18} schY={-16}
      connections={{ pin1: "net.LED_RX_K", pin2: sel.U1.pin30 }} />

    <led name="LED_L" color="yellow" footprint="0402"
      schX={22} schY={-14}
      connections={{ anode: "net.LED_L_A", cathode: "net.GND" }} />
    <resistor name="R6" resistance="1kohm" footprint="0402"
      schX={22} schY={-16}
      connections={{ pin1: sel.U1.pin17, pin2: "net.LED_L_A" }} />

    {/* ICSP header */}
    <pinheader
      name="ICSP"
      pinCount={6}
      rows={2}
      schX={-8} schY={-10}
      pcbX={-5} pcbY={-10}
      connections={{
        pin1: sel.U1.pin16,
        pin2: "net.VCC5",
        pin3: sel.U1.pin17,
        pin4: sel.U1.pin15,
        pin5: "net.RESET",
        pin6: "net.GND",
      }}
    />

    {/* JP1: Digital D0-D12 */}
    <pinheader
      name="JP1"
      pinCount={15}
      schX={-16} schY={0}
      pcbX={-8} pcbY={0}
      connections={{
        pin1:  sel.U1.pin30,
        pin2:  sel.U1.pin31,
        pin3:  "net.RESET",
        pin4:  "net.GND",
        pin5:  sel.U1.pin32,
        pin6:  sel.U1.pin1,
        pin7:  sel.U1.pin2,
        pin8:  sel.U1.pin9,
        pin9:  sel.U1.pin10,
        pin10: sel.U1.pin11,
        pin11: sel.U1.pin12,
        pin12: sel.U1.pin13,
        pin13: sel.U1.pin14,
        pin14: sel.U1.pin15,
        pin15: sel.U1.pin16,
      }}
    />

    {/* JP2: D13 + power + analog */}
    <pinheader
      name="JP2"
      pinCount={15}
      schX={16} schY={10}
      pcbX={8} pcbY={0}
      connections={{
        pin1:  sel.U1.pin17,
        pin2:  "net.VCC3V3",
        pin3:  "net.AREF",
        pin4:  sel.U1.pin23,
        pin5:  sel.U1.pin24,
        pin6:  sel.U1.pin25,
        pin7:  sel.U1.pin26,
        pin8:  sel.U1.pin27,
        pin9:  sel.U1.pin28,
        pin10: sel.U1.pin19,
        pin11: sel.U1.pin22,
        pin12: "net.VCC5",
        pin13: "net.RESET",
        pin14: "net.GND",
        pin15: "net.VIN",
      }}
    />

    {/* Decoupling caps */}
    <capacitor name="C3" capacitance="100nF" footprint="0402"
      schX={6} schY={6}
      connections={{ pin1: "net.AREF", pin2: "net.GND" }} />
    <capacitor name="C4" capacitance="100nF" footprint="0402"
      schX={2} schY={-18}
      connections={{ pin1: "net.VCC5", pin2: "net.GND" }} />
    <capacitor name="C5" capacitance="100nF" footprint="0402"
      schX={4} schY={-18}
      connections={{ pin1: "net.VCC5", pin2: "net.GND" }} />

  </board>
)

export default ArduinoNano

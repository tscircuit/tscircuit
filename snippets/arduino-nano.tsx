import { sel } from "tscircuit"

// ATmega328P DIP-28 – Arduino Nano V3.0 main MCU
const ATmega328P = (props: any) => (
  <chip
    manufacturerPartNumber="ATmega328P-PU"
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
    }}
    schPinArrangement={{
      leftSide: {
        direction: "top-to-bottom",
        pins: [
          "pin1",
          "pin2",
          "pin3",
          "pin4",
          "pin5",
          "pin6",
          "pin7",
          "pin8",
          "pin9",
          "pin10",
          "pin11",
          "pin12",
          "pin13",
          "pin14",
        ],
      },
      rightSide: {
        direction: "top-to-bottom",
        pins: [
          "pin28",
          "pin27",
          "pin26",
          "pin25",
          "pin24",
          "pin23",
          "pin22",
          "pin21",
          "pin20",
          "pin19",
          "pin18",
          "pin17",
          "pin16",
          "pin15",
        ],
      },
    }}
    {...props}
  />
)

// CH340G USB-UART bridge (SOP-16)
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
        pins: ["pin16", "pin15", "pin14", "pin13", "pin12", "pin11", "pin10", "pin9"],
      },
      rightSide: {
        direction: "top-to-bottom",
        pins: ["pin1", "pin2", "pin3", "pin4", "pin5", "pin6", "pin7", "pin8"],
      },
    }}
    {...props}
  />
)

// Arduino Nano V3.0 board
const ArduinoNano = () => (
  <board width="18mm" height="43.18mm" autorouter="auto-cloud">
    {/* ATmega328P – main MCU */}
    <ATmega328P
      name="U1"
      footprint="dip28_p2.54mm"
      schX={0}
      schY={0}
      pcbX={0}
      pcbY={0}
    />

    {/* CH340G – USB-to-serial bridge */}
    <CH340G
      name="U2"
      footprint="soic16_p1.27mm"
      schX={14}
      schY={0}
      pcbX={6}
      pcbY={0}
      connections={{
        pin1: sel.U1.pin3, // CH340 TXD → ATmega RXD
        pin2: sel.U1.pin2, // CH340 RXD ← ATmega TXD
        pin9: "net.GND",
        pin16: "net.VCC5",
        pin14: "net.AUTO_RESET", // DTR for auto-reset
      }}
    />

    {/* 16 MHz crystal for ATmega328P */}
    <chip
      name="Y1"
      manufacturerPartNumber="16MHz_Crystal"
      footprint="crystal_hc49s_p4.88mm"
      pinLabels={{ pin1: "IN", pin2: "OUT" }}
      schX={-10}
      schY={6}
      pcbX={-5}
      pcbY={6}
      connections={{
        pin1: sel.U1.pin9, // XTAL1
        pin2: sel.U1.pin10, // XTAL2
      }}
    />

    {/* Crystal load capacitors (22 pF) */}
    <capacitor
      name="C1"
      capacitance="22pF"
      footprint="0402"
      schX={-13}
      schY={4}
      pcbX={-7}
      pcbY={4.5}
      connections={{ pin1: sel.U1.pin9, pin2: "net.GND" }}
    />
    <capacitor
      name="C2"
      capacitance="22pF"
      footprint="0402"
      schX={-13}
      schY={8}
      pcbX={-7}
      pcbY={7.5}
      connections={{ pin1: sel.U1.pin10, pin2: "net.GND" }}
    />

    {/* AMS1117-5.0 LDO – VIN to 5V */}
    <chip
      name="U3"
      manufacturerPartNumber="AMS1117-5.0"
      footprint="sot223"
      pinLabels={{ pin1: "ADJ_GND", pin2: "OUT", pin3: "IN", pin4: "OUT2" }}
      schX={20}
      schY={-8}
      pcbX={8}
      pcbY={-8}
      connections={{
        pin1: "net.GND",
        pin2: "net.VCC5",
        pin4: "net.VCC5",
        pin3: "net.VIN",
      }}
    />

    {/* AMS1117-3.3 LDO – 5V to 3.3V */}
    <chip
      name="U4"
      manufacturerPartNumber="AMS1117-3.3"
      footprint="sot223"
      pinLabels={{ pin1: "ADJ_GND", pin2: "OUT", pin3: "IN", pin4: "OUT2" }}
      schX={20}
      schY={-12}
      pcbX={8}
      pcbY={-12}
      connections={{
        pin1: "net.GND",
        pin2: "net.VCC3V3",
        pin4: "net.VCC3V3",
        pin3: "net.VCC5",
      }}
    />

    {/* VCC5 bulk decoupling */}
    <capacitor
      name="C3"
      capacitance="100nF"
      footprint="0402"
      schX={4}
      schY={10}
      pcbX={2}
      pcbY={-3}
      connections={{ pin1: "net.VCC5", pin2: "net.GND" }}
    />
    <capacitor
      name="C4"
      capacitance="10uF"
      footprint="0805"
      schX={6}
      schY={10}
      pcbX={3}
      pcbY={-3}
      connections={{ pin1: "net.VCC5", pin2: "net.GND" }}
    />

    {/* AVCC decoupling */}
    <capacitor
      name="C5"
      capacitance="100nF"
      footprint="0402"
      schX={8}
      schY={10}
      pcbX={-2}
      pcbY={-3}
      connections={{ pin1: "net.VCC5", pin2: "net.GND" }}
    />
    <inductor
      name="L1"
      inductance="10uH"
      footprint="0402"
      schX={8}
      schY={8}
      pcbX={-3}
      pcbY={-3}
      connections={{ pin1: "net.VCC5", pin2: sel.U1.pin20 }}
    />

    {/* Power LED */}
    <led
      name="LED1"
      color="green"
      footprint="0402"
      schX={-6}
      schY={-10}
      pcbX={-4}
      pcbY={-8}
      connections={{ anode: "net.VCC5", cathode: "net.LED_PWR_K" }}
    />
    <resistor
      name="R1"
      resistance="1kohm"
      footprint="0402"
      schX={-4}
      schY={-10}
      pcbX={-2}
      pcbY={-8}
      connections={{ pin1: "net.LED_PWR_K", pin2: "net.GND" }}
    />

    {/* L13 LED on D13 */}
    <led
      name="LED2"
      color="yellow"
      footprint="0402"
      schX={-6}
      schY={-12}
      pcbX={-4}
      pcbY={-10}
      connections={{ anode: "net.LED13_A", cathode: "net.GND" }}
    />
    <resistor
      name="R2"
      resistance="1kohm"
      footprint="0402"
      schX={-4}
      schY={-12}
      pcbX={-2}
      pcbY={-10}
      connections={{ pin1: sel.U1.pin19, pin2: "net.LED13_A" }}
    />

    {/* Auto-reset circuit: 100nF cap between DTR and RESET */}
    <capacitor
      name="C6"
      capacitance="100nF"
      footprint="0402"
      schX={10}
      schY={-6}
      pcbX={5}
      pcbY={-6}
      connections={{ pin1: "net.AUTO_RESET", pin2: sel.U1.pin1 }}
    />

    {/* 10kΩ pull-up on RESET */}
    <resistor
      name="R3"
      resistance="10kohm"
      footprint="0402"
      schX={-8}
      schY={-6}
      pcbX={-5}
      pcbY={-6}
      connections={{ pin1: "net.VCC5", pin2: sel.U1.pin1 }}
    />

    {/* RESET button */}
    <pushbutton
      name="SW1"
      footprint="pushbutton_smd_4mm"
      schX={-8}
      schY={-8}
      pcbX={-5}
      pcbY={-9}
      connections={{ pin1: sel.U1.pin1, pin2: "net.GND" }}
    />

    {/* Digital I/O pin header D0–D13 */}
    <pinheader
      name="JP1"
      pinCount={15}
      schX={-18}
      schY={0}
      pcbX={-8}
      pcbY={0}
      connections={{
        pin1: "net.D0_RX",
        pin2: "net.D1_TX",
        pin3: sel.U1.pin4,
        pin4: sel.U1.pin5,
        pin5: sel.U1.pin6,
        pin6: sel.U1.pin11,
        pin7: sel.U1.pin12,
        pin8: sel.U1.pin13,
        pin9: sel.U1.pin14,
        pin10: sel.U1.pin15,
        pin11: sel.U1.pin16,
        pin12: sel.U1.pin17,
        pin13: sel.U1.pin18,
        pin14: sel.U1.pin19,
        pin15: "net.AREF",
      }}
    />

    {/* Analog I/O pin header A0–A7 + power */}
    <pinheader
      name="JP2"
      pinCount={8}
      schX={-18}
      schY={8}
      pcbX={-8}
      pcbY={8}
      connections={{
        pin1: sel.U1.pin23,
        pin2: sel.U1.pin24,
        pin3: sel.U1.pin25,
        pin4: sel.U1.pin26,
        pin5: sel.U1.pin27,
        pin6: sel.U1.pin28,
        pin7: "net.VCC5",
        pin8: "net.GND",
      }}
    />

    {/* Power pin header: VIN, GND, RST, 5V, 3V3 */}
    <pinheader
      name="JP3"
      pinCount={5}
      schX={-18}
      schY={14}
      pcbX={-8}
      pcbY={14}
      connections={{
        pin1: "net.VIN",
        pin2: "net.GND",
        pin3: sel.U1.pin1,
        pin4: "net.VCC5",
        pin5: "net.VCC3V3",
      }}
    />

    {/* USB Mini-B connector → CH340G */}
    <chip
      name="J1"
      manufacturerPartNumber="USB_MINI_B"
      footprint="usb_mini_b_p2.0mm"
      pinLabels={{ pin1: "VBUS", pin2: "DM", pin3: "DP", pin4: "ID", pin5: "GND" }}
      schX={22}
      schY={6}
      pcbX={9}
      pcbY={6}
      connections={{
        pin1: "net.VBUS",
        pin2: sel.U2.pin5, // D−
        pin3: sel.U2.pin4, // D+
        pin5: "net.GND",
      }}
    />

    {/* Power net labels */}
    <netlabel net="VCC5" anchorSide="bottom" connection="U1.pin7" />
    <netlabel net="VCC5" anchorSide="bottom" connection="U1.pin20" />
    <netlabel net="GND" anchorSide="top" connection="U1.pin8" />
    <netlabel net="GND" anchorSide="top" connection="U1.pin22" />
    <netlabel net="AREF" anchorSide="bottom" connection="U1.pin21" />
  </board>
)

export default ArduinoNano

import React from "react"

const ATmega328P = (props: any) => (
  <chip
    manufacturerPartNumber="ATmega328P-AU"
    footprint="tqfp32_p0.8mm"
    pinLabels={{
      pin1: "PD3/D3",
      pin2: "PD4/D4",
      pin3: "GND",
      pin4: "VCC",
      pin5: "GND",
      pin6: "VCC",
      pin7: "XTAL1",
      pin8: "XTAL2",
      pin9: "PD5/D5",
      pin10: "PD6/D6",
      pin11: "PD7/D7",
      pin12: "PB0/D8",
      pin13: "PB1/D9",
      pin14: "PB2/D10",
      pin15: "PB3/D11",
      pin16: "PB4/D12",
      pin17: "PB5/D13",
      pin18: "AVCC",
      pin19: "ADC6",
      pin20: "AREF",
      pin21: "GND",
      pin22: "ADC7",
      pin23: "PC0/A0",
      pin24: "PC1/A1",
      pin25: "PC2/A2",
      pin26: "PC3/A3",
      pin27: "PC4/A4/SDA",
      pin28: "PC5/A5/SCL",
      pin29: "RESET",
      pin30: "PD0/RX",
      pin31: "PD1/TX",
      pin32: "PD2/D2",
    }}
    schPinArrangement={{
      leftSide: { direction: "top-to-bottom", pins: ["pin30", "pin31", "pin32", "pin1", "pin2", "pin9", "pin10", "pin11", "pin12", "pin13", "pin14", "pin15", "pin16", "pin17", "pin29"] },
      rightSide: { direction: "top-to-bottom", pins: ["pin23", "pin24", "pin25", "pin26", "pin27", "pin28", "pin19", "pin22", "pin20", "pin18"] },
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
      pin1: "TXD",
      pin2: "RXD",
      pin3: "V3",
      pin4: "UD+",
      pin5: "UD-",
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
    {...props}
  />
)

const Regulator = (props: any) => (
  <chip
    manufacturerPartNumber="AMS1117-5.0"
    footprint="sot223"
    pinLabels={{ pin1: "GND", pin2: "VOUT", pin3: "VIN", pin4: "VOUT" }}
    {...props}
  />
)

const Header15 = (props: any) => (
  <chip
    footprint="pinrow15_p2.54mm"
    pinLabels={{
      pin1: "D13",
      pin2: "3V3",
      pin3: "AREF",
      pin4: "A0",
      pin5: "A1",
      pin6: "A2",
      pin7: "A3",
      pin8: "A4/SDA",
      pin9: "A5/SCL",
      pin10: "A6",
      pin11: "A7",
      pin12: "5V",
      pin13: "RESET",
      pin14: "GND",
      pin15: "VIN",
    }}
    {...props}
  />
)

const DigitalHeader15 = (props: any) => (
  <chip
    footprint="pinrow15_p2.54mm"
    pinLabels={{
      pin1: "D12",
      pin2: "D11",
      pin3: "D10",
      pin4: "D9",
      pin5: "D8",
      pin6: "D7",
      pin7: "D6",
      pin8: "D5",
      pin9: "D4",
      pin10: "D3",
      pin11: "D2",
      pin12: "GND",
      pin13: "RESET",
      pin14: "RX0",
      pin15: "TX1",
    }}
    {...props}
  />
)

export const ArduinoNanoDefgtyg = () => (
  <board width="45mm" height="18mm" autorouterEffortLevel="high">
    <ATmega328P name="U1" pcbX={0} pcbY={0} />
    <CH340G name="U2" pcbX={-12} pcbY={-2.5} />
    <Regulator name="U3" pcbX={13} pcbY={-4.5} />
    <Header15 name="J1" pcbX={0} pcbY={7.2} />
    <DigitalHeader15 name="J2" pcbX={0} pcbY={-7.2} />

    <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX={-3.5} pcbY={3.8} />
    <capacitor name="C2" capacitance="100nF" footprint="0603" pcbX={3.5} pcbY={3.8} />
    <capacitor name="C3" capacitance="10uF" footprint="0805" pcbX={15.5} pcbY={-1.5} />
    <resistor name="R1" resistance="10k" footprint="0603" pcbX={6.5} pcbY={2.5} />
    <resistor name="R2" resistance="1k" footprint="0603" pcbX={-8.8} pcbY={2.2} />
    <resistor name="R3" resistance="1k" footprint="0603" pcbX={-8.8} pcbY={0.8} />
    <resistor name="R4" resistance="22ohm" footprint="0603" pcbX={-15.5} pcbY={-4.5} />
    <resistor name="R5" resistance="22ohm" footprint="0603" pcbX={-15.5} pcbY={-5.9} />

    <netlabel net="5V" x={10} y={4} />
    <netlabel net="3V3" x={10} y={2.5} />
    <ground name="GND" x={10} y={1} />

    <trace path={[".U1 > .VCC", ".C1 > .pos", ".J1 > .5V", "net.5V"]} />
    <trace path={[".U1 > .AVCC", ".C2 > .pos", "net.5V"]} />
    <trace path={[".U1 > .GND", ".C1 > .neg", ".C2 > .neg", ".GND"]} />
    <trace path={[".U3 > .VOUT", ".C3 > .pos", "net.5V"]} />
    <trace path={[".U3 > .GND", ".C3 > .neg", ".GND"]} />
    <trace path={[".U1 > .RESET", ".R1 > .left", ".J1 > .RESET", ".J2 > .RESET"]} />
    <trace path={[".R1 > .right", "net.5V"]} />

    <trace path={[".U1 > .PD0/RX", ".R2 > .left", ".U2 > .TXD", ".J2 > .RX0"]} />
    <trace path={[".U1 > .PD1/TX", ".R3 > .left", ".U2 > .RXD", ".J2 > .TX1"]} />
    <trace path={[".U2 > .UD+", ".R4 > .left"]} />
    <trace path={[".U2 > .UD-", ".R5 > .left"]} />
    <trace path={[".U2 > .VCC", "net.5V"]} />
    <trace path={[".U2 > .GND", ".GND"]} />

    <trace path={[".U1 > .PB5/D13", ".J1 > .D13"]} />
    <trace path={[".U1 > .PB4/D12", ".J2 > .D12"]} />
    <trace path={[".U1 > .PB3/D11", ".J2 > .D11"]} />
    <trace path={[".U1 > .PB2/D10", ".J2 > .D10"]} />
    <trace path={[".U1 > .PB1/D9", ".J2 > .D9"]} />
    <trace path={[".U1 > .PB0/D8", ".J2 > .D8"]} />
    <trace path={[".U1 > .PD7/D7", ".J2 > .D7"]} />
    <trace path={[".U1 > .PD6/D6", ".J2 > .D6"]} />
    <trace path={[".U1 > .PD5/D5", ".J2 > .D5"]} />
    <trace path={[".U1 > .PD4/D4", ".J2 > .D4"]} />
    <trace path={[".U1 > .PD3/D3", ".J2 > .D3"]} />
    <trace path={[".U1 > .PD2/D2", ".J2 > .D2"]} />

    <trace path={[".U1 > .PC0/A0", ".J1 > .A0"]} />
    <trace path={[".U1 > .PC1/A1", ".J1 > .A1"]} />
    <trace path={[".U1 > .PC2/A2", ".J1 > .A2"]} />
    <trace path={[".U1 > .PC3/A3", ".J1 > .A3"]} />
    <trace path={[".U1 > .PC4/A4/SDA", ".J1 > .A4/SDA"]} />
    <trace path={[".U1 > .PC5/A5/SCL", ".J1 > .A5/SCL"]} />
    <trace path={[".U1 > .ADC6", ".J1 > .A6"]} />
    <trace path={[".U1 > .ADC7", ".J1 > .A7"]} />
    <trace path={[".U1 > .AREF", ".J1 > .AREF"]} />
    <trace path={[".J1 > .GND", ".J2 > .GND", ".GND"]} />
    <trace path={[".J1 > .VIN", ".U3 > .VIN"]} />
  </board>
)

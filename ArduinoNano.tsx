import { sel } from "tscircuit"

const ArduinoNano = () => {
  return (
    <board width="45mm" height="18mm" center_x={0} center_y={0}>
      {/* ATmega328P Microcontroller */}
      <chip
        name="U1"
        footprint="dip28"
        pinLabels={{
          1: "PC6(RST)", 2: "PD0(RXD)", 3: "PD1(TXD)", 4: "PD2(INT0)",
          5: "PD3(INT1)", 6: "PD4(XCK/T0)", 7: "VCC", 8: "GND",
          9: "PB6(XTAL1)", 10: "PB7(XTAL2)", 11: "PD5(T1)", 12: "PD6(AIN0)",
          13: "PD7(AIN1)", 14: "PB0(ICP)", 15: "PB1(OC1A)", 16: "PB2(SS/OC1B)",
          17: "PB3(MOSI/OC2)", 18: "PB4(MISO)", 19: "PB5(SCK)", 20: "AVCC",
          21: "AREF", 22: "GND", 23: "PC0(ADC0)", 24: "PC1(ADC1)",
          25: "PC2(ADC2)", 26: "PC3(ADC3)", 27: "PC4(ADC4/SDA)",
          28: "PC5(ADC5/SCL)"
        }}
        manufacturerPartNumber="ATmega328P-AU"
        supplierPartNumbers={{ jlcpcb: ["C14877"] }}
        connections={{
          VCC: "net.VCC", GND: "net.GND"
        }}
      />

      {/* CH340G USB-to-Serial Chip */}
      <chip
        name="U2"
        footprint="soic16"
        pinLabels={{
          1: "GND", 2: "TXD", 3: "RXD", 4: "V3-3V", 5: "RST", 6: "NC",
          7: "NC", 8: "NC", 9: "NC", 10: "NC", 11: "NC", 12: "NC", 13: "NC",
          14: "NC", 15: "NC", 16: "NC"
        }}
        manufacturerPartNumber="CH340G"
        supplierPartNumbers={{ jlcpcb: ["C14267"] }}
        connections={{
          GND: "net.GND", TXD: "net.ATMEGA_TX", RXD: "net.ATMEGA_RX", V3-3V: "net.3V3"
        }}
      />

      {/* 16MHz Crystal */}
      <chip
        name="X1"
        footprint="crystal_5032"
        pinLabels={{
          1: "XTAL1", 2: "XTAL2"
        }}
        manufacturerPartNumber="16MHz Crystal"
        supplierPartNumbers={{ jlcpcb: ["C16218"] }}
        connections={{
          XTAL1: "net.XTAL1", XTAL2: "net.XTAL2"
        }}
      />

      {/* AMS1117-5.0 5V Regulator */}
      <chip
        name="U3"
        footprint="sot223"
        pinLabels={{
          1: "VIN", 2: "GND", 3: "VOUT"
        }}
        manufacturerPartNumber="AMS1117-5.0"
        supplierPartNumbers={{ jlcpcb: ["C6187"] }}
        connections={{
          VIN: "net.VIN", GND: "net.GND", VOUT: "net.VCC"
        }}
      />

      {/* AMS1117-3.3 3.3V Regulator */}
      <chip
        name="U4"
        footprint="sot223"
        pinLabels={{
          1: "VIN", 2: "GND", 3: "VOUT"
        }}
        manufacturerPartNumber="AMS1117-3.3"
        supplierPartNumbers={{ jlcpcb: ["C6186"] }}
        connections={{
          VIN: "net.VCC", GND: "net.GND", VOUT: "net.3V3"
        }}
      />

      {/* Mini-USB Connector */}
      <chip
        name="J1"
        footprint="mini_usb_b"
        pinLabels={{
          1: "VCC", 2: "D-", 3: "D+", 4: "ID", 5: "GND"
        }}
        manufacturerPartNumber="Mini USB B"
        supplierPartNumbers={{ jlcpcb: ["C46398"] }}
        connections={{
          VCC: "net.VIN", "D-": "net.USB_D-", "D+": "net.USB_D+", GND: "net.GND"
        }}
      />

      {/* Reset Button */}
      <chip
        name="SW1"
        footprint="pushbutton_6mm"
        pinLabels={{
          1: "RST", 2: "GND"
        }}
        connections={{
          RST: "net.RESET", GND: "net.GND"
        }}
      />

      {/* Power LED */}
      <chip
        name="D1"
        footprint="led_0402"
        pinLabels={{
          1: "A", 2: "K"
        }}
        manufacturerPartNumber="Power LED"
        supplierPartNumbers={{ jlcpcb: ["C72043"] }}
        connections={{
          A: "net.VCC", K: "net.GND"
        }}
      />

      {/* Status LED (D13) */}
      <chip
        name="D2"
        footprint="led_0402"
        pinLabels={{
          1: "A", 2: "K"
        }}
        connections={{
          A: "net.ATMEGA_PIN13", K: "net.GND"
        }}
      />

      {/* 22pF Capacitors for Crystal */}
      <chip
        name="C1"
        footprint="capacitor_0402"
        pinLabels={{
          1: "1", 2: "2"
        }}
        capacitance="22pF"
        manufacturerPartNumber="22pF Crystal Load Cap"
        supplierPartNumbers={{ jlcpcb: ["C1572"] }}
        connections={{
          1: "net.XTAL1", 2: "net.GND"
        }}
      />

      <chip
        name="C2"
        footprint="capacitor_0402"
        pinLabels={{
          1: "1", 2: "2"
        }}
        capacitance="22pF"
        connections={{
          1: "net.XTAL2", 2: "net.GND"
        }}
      />

      {/* 100nF Decoupling Capacitors */}
      <chip
        name="C3"
        footprint="capacitor_0402"
        pinLabels={{
          1: "1", 2: "2"
        }}
        capacitance="100nF"
        supplierPartNumbers={{ jlcpcb: ["C1525"] }}
        connections={{
          1: "net.VCC", 2: "net.GND"
        }}
      />

      <chip
        name="C4"
        footprint="capacitor_0402"
        connections={{
          1: "net.VCC", 2: "net.GND"
        }}
      />

      <chip
        name="C5"
        footprint="capacitor_0402"
        connections={{
          1: "net.3V3", 2: "net.GND"
        }}
      />

      {/* 10uF Capacitor */}
      <chip
        name="C6"
        footprint="capacitor_0805"
        pinLabels={{
          1: "1", 2: "2"
        }}
        capacitance="10uF"
        supplierPartNumbers={{ jlcpcb: ["C17024"] }}
        connections={{
          1: "net.VIN", 2: "net.GND"
        }}
      />

      {/* 10k Resistor for Reset */}
      <chip
        name="R1"
        footprint="resistor_0402"
        pinLabels={{
          1: "1", 2: "2"
        }}
        resistance="10k"
        supplierPartNumbers={{ jlcpcb: ["C25804"] }}
        connections={{
          1: "net.VCC", 2: "net.RESET"
        }}
      />

      {/* 1k Resistor for Power LED */}
      <chip
        name="R2"
        footprint="resistor_0402"
        resistance="1k"
        connections={{
          1: "net.VCC", 2: "net.LED_K"
        }}
      />

      {/* 1k Resistor for Status LED */}
      <chip
        name="R3"
        footprint="resistor_0402"
        resistance="1k"
        connections={{
          1: "net.ATMEGA_PIN13", 2: "net.LED2_K"
        }}
      />

      {/* Pin Headers (2x15 pins) */}
      <chip
        name="J2"
        footprint="pinheader_2x15"
        pinLabels={{
          1: "D0(RX)", 2: "A0", 3: "D2", 4: "A2", 5: "D4", 6: "A4", 7: "D6", 8: "A6", 9: "D8", 10: "D10", 11: "D12", 12: "GND",
          13: "D1(TX)", 14: "A1", 15: "D3", 16: "A3", 17: "D5", 18: "A5", 19: "D7", 20: "A7", 21: "D9", 22: "D11", 23: "D13", 24: "3V3",
          25: "RST", 26: "GND", 27: "+5V", 28: "REF", 29: "NC", 30: "NC", 31: "NC", 32: "NC", 33: "NC", 34: "NC", 35: "NC", 36: "NC",
          37: "VIN", 38: "GND", 39: "RST", 40: "+5V", 41: "A0", 42: "A1", 43: "A2", 44: "A3", 45: "A4", 46: "A5", 47: "NC", 48: "NC"
        }}
        connections={{
          D0: "net.ATMEGA_PD0", A0: "net.ATMEGA_PC0", D2: "net.ATMEGA_PD2", A2: "net.ATMEGA_PC2",
          D4: "net.ATMEGA_PD4", A4: "net.ATMEGA_PC4", D6: "net.ATMEGA_PD6", A6: "net.ATMEGA_PC6",
          D8: "net.ATMEGA_PB0", D10: "net.ATMEGA_PB2", D12: "net.ATMEGA_PB4", GND: "net.GND",
          D1: "net.ATMEGA_PD1", A1: "net.ATMEGA_PC1", D3: "net.ATMEGA_PD3", A3: "net.ATMEGA_PC3",
          D5: "net.ATMEGA_PD5", A5: "net.ATMEGA_PC5", D7: "net.ATMEGA_PD7", A7: "net.ATMEGA_PC7",
          D9: "net.ATMEGA_PB1", D11: "net.ATMEGA_PB3", D13: "net.ATMEGA_PB5", "3V3": "net.3V3",
          RST: "net.RESET", "+5V": "net.VCC", REF: "net.AREF", VIN: "net.VIN"
        }}
      />

      {/* Power Net */}
      <trace path={["C6 > .1", "U3 > .1", "C3 > .1", "U1 > .7", "U1 > .20", "U1 > .21", "U4 > .1", "R1 > .1", "D1 > .1", "D2 > .1", "J2 > .27", "J2 > .28", "J2 > .29", "J2 > .30", "J2 > .39", "J2 > .40"]} />

      {/* Ground Net */}
      <trace path={["C6 > .2", "U3 > .2", "C3 > .2", "U1 > .8", "U1 > .22", "U4 > .2", "SW1 > .2", "D1 > .2", "D2 > .2", "J2 > .12", "J2 > .26", "J2 > .38", "J2 > .46", "J2 > .47", "C1 > .2", "C2 > .2", "C4 > .2", "C5 > .2"]} />

      {/* 3.3V Net */}
      <trace path={["U4 > .3", "C5 > .1", "U2 > .4", "J2 > .24"]} />

      {/* Crystal Net */}
      <trace path={["U1 > .9", "X1 > .1", "C1 > .1"]} />
      <trace path={["U1 > .10", "X1 > .2", "C2 > .1"]} />

      {/* USB Net */}
      <trace path={["J1 > .2", "U2 > .2", "U1 > .3"]} />
      <trace path={["J1 > .3", "U2 > .3", "U1 > .2"]} />

      {/* Reset Net */}
      <trace path={["U1 > .1", "SW1 > .1", "R1 > .2"]} />

      {/* Status LED Net */}
      <trace path={["U1 > .19", "D2 > .1"]} />
    </board>
  )
}
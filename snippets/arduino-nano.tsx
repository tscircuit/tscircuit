/**
 * Arduino Nano V3.0 (ATmega328P + CH340G)
 *
 * Recreation of the common Arduino Nano form factor for tscircuit.
 * Reference: https://store-usa.arduino.cc/products/arduino-nano
 *
 * Board: 45 mm × 18 mm
 * - U1  ATmega328P-AU (TQFP-32)
 * - U2  CH340G USB-UART (SOIC-16)
 * - U3  AMS1117-5.0 regulator (SOT-223)
 * - Y1  16 MHz crystal (MCU), Y2 12 MHz crystal (CH340G)
 * - Dual 1×15 headers (D0–D13, A0–A7, power), ICSP 2×3, Mini-USB
 */

export const ArduinoNano = () => (
  <board width="45mm" height="18mm">
    {/* Main MCU — ATmega328P-AU TQFP-32 pinout */}
    <chip
      name="U1"
      footprint="tqfp32"
      manufacturerPartNumber="ATmega328P-AU"
      pcbX={0}
      pcbY={0}
      pinLabels={{
        pin1: "PD3",
        pin2: "PD4",
        pin3: "GND1",
        pin4: "VCC",
        pin5: "GND2",
        pin6: "VCC2",
        pin7: "PB6",
        pin8: "PB7",
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
      connections={{
        VCC: "net.V5",
        VCC2: "net.V5",
        AVCC: "net.V5",
        GND1: "net.GND",
        GND2: "net.GND",
        GND3: "net.GND",
        AREF: "net.AREF",
        PD0: "net.UART_RX",
        PD1: "net.UART_TX",
        PC6: "net.RESET",
        PB6: "net.XTAL1",
        PB7: "net.XTAL2",
        PB5: "net.SCK",
        PB4: "net.MISO",
        PB3: "net.MOSI",
        PB2: "net.D10",
        PB1: "net.D9",
        PB0: "net.D8",
        PD7: "net.D7",
        PD6: "net.D6",
        PD5: "net.D5",
        PD4: "net.D4",
        PD3: "net.D3",
        PD2: "net.D2",
        PC0: "net.A0",
        PC1: "net.A1",
        PC2: "net.A2",
        PC3: "net.A3",
        PC4: "net.A4",
        PC5: "net.A5",
        ADC6: "net.A6",
        ADC7: "net.A7",
      }}
    />

    {/* USB-UART bridge — CH340G SOP-16 pinout */}
    <chip
      name="U2"
      footprint="soic16"
      manufacturerPartNumber="CH340G"
      pcbX={-12}
      pcbY={0}
      pinLabels={{
        pin1: "TXD",
        pin2: "RXD",
        pin3: "V3",
        pin4: "UDP",
        pin5: "UDN",
        pin6: "XI",
        pin7: "XO",
        pin8: "GND",
        pin9: "CTS",
        pin10: "DSR",
        pin11: "RI",
        pin12: "DCD",
        pin13: "DTR",
        pin14: "RTS",
        pin15: "R232",
        pin16: "VCC",
      }}
      connections={{
        TXD: "net.UART_RX",
        RXD: "net.UART_TX",
        UDP: "net.USB_DP",
        UDN: "net.USB_DN",
        XI: "net.CH340_XI",
        XO: "net.CH340_XO",
        GND: "net.GND",
        VCC: "net.V5",
        DTR: "net.DTR",
      }}
    />

    {/* 5 V LDO */}
    <chip
      name="U3"
      footprint="sot223"
      manufacturerPartNumber="AMS1117-5.0"
      pcbX={14}
      pcbY={4}
      pinLabels={{ pin1: "GND", pin2: "VOUT", pin3: "VIN" }}
      connections={{
        GND: "net.GND",
        VOUT: "net.V5",
        VIN: "net.VIN",
      }}
    />

    {/* 16 MHz crystal (MCU) */}
    <crystal
      name="Y1"
      frequency="16MHz"
      footprint="hc49"
      pcbX={6}
      pcbY={5}
      connections={{ pin1: "net.XTAL1", pin2: "net.XTAL2" }}
    />
    <capacitor
      name="C1"
      capacitance="22pF"
      footprint="0402"
      pcbX={4}
      pcbY={6}
      connections={{ pin1: "net.XTAL1", pin2: "net.GND" }}
    />
    <capacitor
      name="C2"
      capacitance="22pF"
      footprint="0402"
      pcbX={8}
      pcbY={6}
      connections={{ pin1: "net.XTAL2", pin2: "net.GND" }}
    />

    {/* 12 MHz crystal (CH340G) */}
    <crystal
      name="Y2"
      frequency="12MHz"
      footprint="hc49"
      pcbX={-16}
      pcbY={5}
      connections={{ pin1: "net.CH340_XI", pin2: "net.CH340_XO" }}
    />
    <capacitor
      name="C3"
      capacitance="22pF"
      footprint="0402"
      pcbX={-18}
      pcbY={6}
      connections={{ pin1: "net.CH340_XI", pin2: "net.GND" }}
    />
    <capacitor
      name="C4"
      capacitance="22pF"
      footprint="0402"
      pcbX={-14}
      pcbY={6}
      connections={{ pin1: "net.CH340_XO", pin2: "net.GND" }}
    />

    {/* Power decoupling */}
    <capacitor
      name="C5"
      capacitance="100nF"
      footprint="0402"
      pcbX={-2}
      pcbY={-4}
      connections={{ pin1: "net.V5", pin2: "net.GND" }}
    />
    <capacitor
      name="C6"
      capacitance="100nF"
      footprint="0402"
      pcbX={2}
      pcbY={-4}
      connections={{ pin1: "net.V5", pin2: "net.GND" }}
    />
    <capacitor
      name="C7"
      capacitance="10uF"
      footprint="0805"
      pcbX={0}
      pcbY={-6}
      connections={{ pin1: "net.V5", pin2: "net.GND" }}
    />
    <capacitor
      name="C8"
      capacitance="100nF"
      footprint="0402"
      pcbX={4}
      pcbY={-4}
      connections={{ pin1: "net.AREF", pin2: "net.GND" }}
    />
    <capacitor
      name="C9"
      capacitance="100nF"
      footprint="0402"
      pcbX={-10}
      pcbY={-4}
      connections={{ pin1: "net.V5", pin2: "net.GND" }}
    />
    <capacitor
      name="C10"
      capacitance="10uF"
      footprint="0805"
      pcbX={12}
      pcbY={2}
      connections={{ pin1: "net.VIN", pin2: "net.GND" }}
    />
    <capacitor
      name="C11"
      capacitance="10uF"
      footprint="0805"
      pcbX={16}
      pcbY={2}
      connections={{ pin1: "net.V5", pin2: "net.GND" }}
    />
    {/* CH340 V3 bypass */}
    <capacitor
      name="C12"
      capacitance="100nF"
      footprint="0402"
      pcbX={-12}
      pcbY={-4}
      connections={{ pin1: "U2.V3", pin2: "net.GND" }}
    />
    {/* DTR auto-reset */}
    <capacitor
      name="C13"
      capacitance="100nF"
      footprint="0402"
      pcbX={-8}
      pcbY={4}
      connections={{ pin1: "net.DTR", pin2: "net.RESET" }}
    />

    {/* Reset pull-up + button */}
    <resistor
      name="R1"
      resistance="10k"
      footprint="0402"
      pcbX={10}
      pcbY={6}
      connections={{ pin1: "net.V5", pin2: "net.RESET" }}
    />
    <pushbutton
      name="SW1"
      footprint="pushbutton"
      pcbX={12}
      pcbY={7}
      connections={{ pin1: "net.RESET", pin2: "net.GND" }}
    />

    {/* Status LEDs: PWR, TX, RX, L (D13) */}
    <resistor
      name="R2"
      resistance="1k"
      footprint="0402"
      pcbX={-4}
      pcbY={7}
      connections={{ pin1: "net.V5", pin2: "D1.pin1" }}
    />
    <led
      name="D1"
      color="green"
      footprint="0603"
      pcbX={-2}
      pcbY={7}
      connections={{ pin2: "net.GND" }}
    />
    <resistor
      name="R3"
      resistance="1k"
      footprint="0402"
      pcbX={0}
      pcbY={7}
      connections={{ pin1: "net.UART_TX", pin2: "D2.pin1" }}
    />
    <led
      name="D2"
      color="yellow"
      footprint="0603"
      pcbX={2}
      pcbY={7}
      connections={{ pin2: "net.GND" }}
    />
    <resistor
      name="R4"
      resistance="1k"
      footprint="0402"
      pcbX={4}
      pcbY={7}
      connections={{ pin1: "net.UART_RX", pin2: "D3.pin1" }}
    />
    <led
      name="D3"
      color="yellow"
      footprint="0603"
      pcbX={6}
      pcbY={7}
      connections={{ pin2: "net.GND" }}
    />
    <resistor
      name="R5"
      resistance="1k"
      footprint="0402"
      pcbX={8}
      pcbY={7}
      connections={{ pin1: "net.SCK", pin2: "D4.pin1" }}
    />
    <led
      name="D4"
      color="yellow"
      footprint="0603"
      pcbX={10}
      pcbY={7}
      connections={{ pin2: "net.GND" }}
    />

    {/* Mini-USB */}
    <chip
      name="JUSB"
      footprint="usb_mini_b"
      manufacturerPartNumber="Mini-USB-B"
      pcbX={-20}
      pcbY={0}
      pinLabels={{
        pin1: "VBUS",
        pin2: "DN",
        pin3: "DP",
        pin4: "ID",
        pin5: "GND",
      }}
      connections={{
        VBUS: "net.VIN",
        DN: "net.USB_DN",
        DP: "net.USB_DP",
        GND: "net.GND",
      }}
    />

    {/* Digital / power header (USB end → far end): D1..D12 side */}
    <pinheader
      name="J1"
      pinCount={15}
      pitch="2.54mm"
      gender="male"
      schFacingDirection="left"
      pcbX={0}
      pcbY={8.5}
      pinLabels={{
        pin1: "D1",
        pin2: "D0",
        pin3: "RST",
        pin4: "GND",
        pin5: "D2",
        pin6: "D3",
        pin7: "D4",
        pin8: "D5",
        pin9: "D6",
        pin10: "D7",
        pin11: "D8",
        pin12: "D9",
        pin13: "D10",
        pin14: "D11",
        pin15: "D12",
      }}
      connections={{
        D1: "net.UART_TX",
        D0: "net.UART_RX",
        RST: "net.RESET",
        GND: "net.GND",
        D2: "net.D2",
        D3: "net.D3",
        D4: "net.D4",
        D5: "net.D5",
        D6: "net.D6",
        D7: "net.D7",
        D8: "net.D8",
        D9: "net.D9",
        D10: "net.D10",
        D11: "net.MOSI",
        D12: "net.MISO",
      }}
    />

    {/* Analog / power header */}
    <pinheader
      name="J2"
      pinCount={15}
      pitch="2.54mm"
      gender="male"
      schFacingDirection="right"
      pcbX={0}
      pcbY={-8.5}
      pinLabels={{
        pin1: "D13",
        pin2: "V3V3",
        pin3: "AREF",
        pin4: "A0",
        pin5: "A1",
        pin6: "A2",
        pin7: "A3",
        pin8: "A4",
        pin9: "A5",
        pin10: "A6",
        pin11: "A7",
        pin12: "V5",
        pin13: "RST",
        pin14: "GND",
        pin15: "VIN",
      }}
      connections={{
        D13: "net.SCK",
        AREF: "net.AREF",
        A0: "net.A0",
        A1: "net.A1",
        A2: "net.A2",
        A3: "net.A3",
        A4: "net.A4",
        A5: "net.A5",
        A6: "net.A6",
        A7: "net.A7",
        V5: "net.V5",
        RST: "net.RESET",
        GND: "net.GND",
        VIN: "net.VIN",
      }}
    />

    {/* ICSP 2×3 */}
    <pinheader
      name="J3"
      pinCount={6}
      pitch="2.54mm"
      gender="male"
      doubleRow
      pcbX={18}
      pcbY={-2}
      pinLabels={{
        pin1: "MISO",
        pin2: "VCC",
        pin3: "SCK",
        pin4: "MOSI",
        pin5: "RESET",
        pin6: "GND",
      }}
      connections={{
        MISO: "net.MISO",
        VCC: "net.V5",
        SCK: "net.SCK",
        MOSI: "net.MOSI",
        RESET: "net.RESET",
        GND: "net.GND",
      }}
    />
  </board>
)

export default ArduinoNano

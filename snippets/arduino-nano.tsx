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
          "pin30",
          "pin31",
          "pin32",
          "pin1",
          "pin2",
          "pin9",
          "pin10",
          "pin11",
          "pin12",
          "pin13",
          "pin14",
          "pin15",
          "pin16",
          "pin17",
          "pin29",
        ],
      },
      rightSide: {
        direction: "top-to-bottom",
        pins: [
          "pin23",
          "pin24",
          "pin25",
          "pin26",
          "pin27",
          "pin28",
          "pin19",
          "pin22",
          "pin20",
          "pin18",
          "pin7",
          "pin8",
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
    footprint="soic16_w3.9mm_p1.27mm"
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
        pins: ["pin16", "pin3", "pin6", "pin7", "pin4", "pin5", "pin8", "pin9"],
      },
      rightSide: {
        direction: "top-to-bottom",
        pins: ["pin1", "pin2", "pin14", "pin15", "pin10", "pin11", "pin12", "pin13"],
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

const Crystal = (props: any) => (
  <chip
    footprint="hc49"
    pinLabels={{ pin1: props.leftPin, pin2: props.rightPin }}
    {...props}
  />
)

export const ArduinoNano = () => (
  <board width="45mm" height="18mm" autorouterEffortLevel="100x">
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

    <CH340G
      name="U2"
      schX={12}
      schY={0}
      pcbX={11}
      pcbY={1.5}
      connections={{
        pin1: "net.D0_RX",
        pin2: "net.D1_TX",
        pin3: "net.VCC3V3",
        pin4: "net.USB_D_PLUS",
        pin5: "net.USB_D_MINUS",
        pin6: "net.XTAL12_1",
        pin7: "net.XTAL12_2",
        pin8: "net.GND",
        pin9: "net.GND",
        pin10: "net.GND",
        pin11: "net.GND",
        pin12: "net.GND",
        pin13: "net.GND",
        pin14: "net.DTR",
        pin15: "net.GND",
        pin16: "net.VCC5",
      }}
    />

    <AMS1117
      name="U3"
      manufacturerPartNumber="AMS1117-5.0"
      schX={13}
      schY={-7}
      pcbX={12}
      pcbY={-5.5}
      connections={{
        pin1: "net.GND",
        pin2: "net.VCC5",
        pin3: "net.VIN",
        pin4: "net.VCC5",
      }}
    />
    <AMS1117
      name="U4"
      manufacturerPartNumber="AMS1117-3.3"
      schX={13}
      schY={-11}
      pcbX={17}
      pcbY={-5.5}
      connections={{
        pin1: "net.GND",
        pin2: "net.VCC3V3",
        pin3: "net.VCC5",
        pin4: "net.VCC3V3",
      }}
    />

    <chip
      name="J_USB"
      manufacturerPartNumber="USB-MINI-B"
      footprint="pinrow5_p1mm_id0.7mm_od1mm"
      pinLabels={{
        pin1: "VBUS",
        pin2: "D_MINUS",
        pin3: "D_PLUS",
        pin4: "ID",
        pin5: "GND",
      }}
      schX={22}
      schY={0}
      pcbX={21}
      pcbY={0}
      connections={{
        pin1: "net.VUSB",
        pin2: "net.USB_D_MINUS",
        pin3: "net.USB_D_PLUS",
        pin5: "net.GND",
      }}
    />
    <chip
      name="D_USB"
      manufacturerPartNumber="SS14"
      footprint="sod123"
      pinLabels={{ pin1: "A", pin2: "K" }}
      schX={18}
      schY={-4}
      pcbX={17}
      pcbY={-2.5}
      connections={{ pin1: "net.VUSB", pin2: "net.VCC5" }}
    />

    <Crystal
      name="Y1_16MHZ"
      manufacturerPartNumber="16MHz Crystal"
      leftPin="XTAL1"
      rightPin="XTAL2"
      schX={-8}
      schY={3}
      pcbX={-15}
      pcbY={1.8}
      connections={{ pin1: "net.XTAL16_1", pin2: "net.XTAL16_2" }}
    />
    <capacitor
      name="C1"
      capacitance="22pF"
      footprint="0402"
      schX={-11}
      schY={5}
      pcbX={-18}
      pcbY={2.8}
      connections={{ pin1: "net.XTAL16_1", pin2: "net.GND" }}
    />
    <capacitor
      name="C2"
      capacitance="22pF"
      footprint="0402"
      schX={-11}
      schY={7}
      pcbX={-18}
      pcbY={1.2}
      connections={{ pin1: "net.XTAL16_2", pin2: "net.GND" }}
    />

    <Crystal
      name="Y2_12MHZ"
      manufacturerPartNumber="12MHz Crystal"
      leftPin="XI"
      rightPin="XO"
      schX={16}
      schY={4}
      pcbX={12.5}
      pcbY={5.4}
      connections={{ pin1: "net.XTAL12_1", pin2: "net.XTAL12_2" }}
    />
    <capacitor
      name="C3"
      capacitance="22pF"
      footprint="0402"
      schX={19}
      schY={5}
      pcbX={14.5}
      pcbY={5}
      connections={{ pin1: "net.XTAL12_1", pin2: "net.GND" }}
    />
    <capacitor
      name="C4"
      capacitance="22pF"
      footprint="0402"
      schX={19}
      schY={7}
      pcbX={14.5}
      pcbY={6}
      connections={{ pin1: "net.XTAL12_2", pin2: "net.GND" }}
    />

    <capacitor
      name="C_RESET"
      capacitance="100nF"
      footprint="0402"
      schX={7}
      schY={-5}
      pcbX={-10}
      pcbY={-2.2}
      connections={{ pin1: "net.DTR", pin2: "net.RESET" }}
    />
    <resistor
      name="R_RESET"
      resistance="10kohm"
      footprint="0402"
      schX={4}
      schY={-5}
      pcbX={-10}
      pcbY={-4.2}
      connections={{ pin1: "net.VCC5", pin2: "net.RESET" }}
    />
    <pushbutton
      name="SW_RESET"
      footprint="pushbutton_smd_4mm"
      pinLabels={{
        pin1: "RESET_A",
        pin2: "GND_A",
        pin3: "RESET_B",
        pin4: "GND_B",
      }}
      schX={4}
      schY={-8}
      pcbX={-13}
      pcbY={-2.5}
      connections={{
        pin1: "net.RESET",
        pin2: "net.GND",
        pin3: "net.RESET",
        pin4: "net.GND",
      }}
    />

    <pinheader
      name="ICSP"
      pinCount={6}
      doubleRow
      footprint="pinrow6_rows2_p2.54mm_id1mm_od1.5mm_male"
      pinLabels={{
        pin1: "MISO",
        pin2: "5V",
        pin3: "SCK",
        pin4: "MOSI",
        pin5: "RESET",
        pin6: "GND",
      }}
      schX={-10}
      schY={-7}
      pcbX={-13}
      pcbY={2.8}
      connections={{
        pin1: "net.D12_MISO",
        pin2: "net.VCC5",
        pin3: "net.D13_SCK",
        pin4: "net.D11_MOSI",
        pin5: "net.RESET",
        pin6: "net.GND",
      }}
    />

    <pinheader
      name="J_LEFT"
      pinCount={15}
      footprint="pinrow15_p2.54mm_id1mm_od1.5mm_male"
      pinLabels={{
        pin1: "D1_TX",
        pin2: "D0_RX",
        pin3: "RESET",
        pin4: "GND",
        pin5: "D2",
        pin6: "D3",
        pin7: "D4",
        pin8: "D5",
        pin9: "D6",
        pin10: "D7",
        pin11: "D8",
        pin12: "D9",
        pin13: "D10_SS",
        pin14: "D11_MOSI",
        pin15: "D12_MISO",
      }}
      schX={-17}
      schY={0}
      pcbX={0}
      pcbY={-8}
      connections={{
        pin1: "net.D1_TX",
        pin2: "net.D0_RX",
        pin3: "net.RESET",
        pin4: "net.GND",
        pin5: "net.D2",
        pin6: "net.D3",
        pin7: "net.D4",
        pin8: "net.D5",
        pin9: "net.D6",
        pin10: "net.D7",
        pin11: "net.D8",
        pin12: "net.D9",
        pin13: "net.D10_SS",
        pin14: "net.D11_MOSI",
        pin15: "net.D12_MISO",
      }}
    />

    <pinheader
      name="J_RIGHT"
      pinCount={15}
      footprint="pinrow15_p2.54mm_id1mm_od1.5mm_male"
      pinLabels={{
        pin1: "VIN",
        pin2: "GND",
        pin3: "RESET",
        pin4: "5V",
        pin5: "A7",
        pin6: "A6",
        pin7: "A5_SCL",
        pin8: "A4_SDA",
        pin9: "A3",
        pin10: "A2",
        pin11: "A1",
        pin12: "A0",
        pin13: "AREF",
        pin14: "3V3",
        pin15: "D13_SCK_L",
      }}
      schX={17}
      schY={0}
      pcbX={0}
      pcbY={8}
      connections={{
        pin1: "net.VIN",
        pin2: "net.GND",
        pin3: "net.RESET",
        pin4: "net.VCC5",
        pin5: "net.A7",
        pin6: "net.A6",
        pin7: "net.A5_SCL",
        pin8: "net.A4_SDA",
        pin9: "net.A3",
        pin10: "net.A2",
        pin11: "net.A1",
        pin12: "net.A0",
        pin13: "net.AREF",
        pin14: "net.VCC3V3",
        pin15: "net.D13_SCK",
      }}
    />

    <resistor
      name="LED_PWR_R"
      resistance="1kohm"
      footprint="0402"
      schX={4}
      schY={-12}
      pcbX={-6}
      pcbY={-7}
      connections={{ pin1: "net.VCC5", pin2: "net.LED_PWR_A" }}
    />
    <led
      name="LED_PWR"
      color="green"
      footprint="0402"
      schX={7}
      schY={-12}
      pcbX={-5}
      pcbY={-7}
      connections={{ anode: "net.LED_PWR_A", cathode: "net.GND" }}
    />
    <resistor
      name="LED_TX_R"
      resistance="1kohm"
      footprint="0402"
      schX={10}
      schY={-12}
      pcbX={-2}
      pcbY={-7}
      connections={{ pin1: "net.D1_TX", pin2: "net.LED_TX_A" }}
    />
    <led
      name="LED_TX"
      color="orange"
      footprint="0402"
      schX={13}
      schY={-12}
      pcbX={-1}
      pcbY={-7}
      connections={{ anode: "net.LED_TX_A", cathode: "net.GND" }}
    />
    <resistor
      name="LED_RX_R"
      resistance="1kohm"
      footprint="0402"
      schX={16}
      schY={-12}
      pcbX={2}
      pcbY={-7}
      connections={{ pin1: "net.D0_RX", pin2: "net.LED_RX_A" }}
    />
    <led
      name="LED_RX"
      color="orange"
      footprint="0402"
      schX={19}
      schY={-12}
      pcbX={3}
      pcbY={-7}
      connections={{ anode: "net.LED_RX_A", cathode: "net.GND" }}
    />
    <resistor
      name="LED_L_R"
      resistance="1kohm"
      footprint="0402"
      schX={22}
      schY={-12}
      pcbX={6}
      pcbY={-7}
      connections={{ pin1: "net.D13_SCK", pin2: "net.LED_L_A" }}
    />
    <led
      name="LED_L"
      color="yellow"
      footprint="0402"
      schX={25}
      schY={-12}
      pcbX={7}
      pcbY={-7}
      connections={{ anode: "net.LED_L_A", cathode: "net.GND" }}
    />

    <capacitor
      name="C5_AREF"
      capacitance="100nF"
      footprint="0402"
      schX={-5}
      schY={7}
      pcbX={-8}
      pcbY={3.8}
      connections={{ pin1: "net.AREF", pin2: "net.GND" }}
    />
    <capacitor
      name="C6_VCC"
      capacitance="100nF"
      footprint="0402"
      schX={-2}
      schY={7}
      pcbX={-8}
      pcbY={2.6}
      connections={{ pin1: "net.VCC5", pin2: "net.GND" }}
    />
    <capacitor
      name="C7_AVCC"
      capacitance="100nF"
      footprint="0402"
      schX={1}
      schY={7}
      pcbX={-8}
      pcbY={1.4}
      connections={{ pin1: "net.VCC5", pin2: "net.GND" }}
    />
    <capacitor
      name="C8_USB"
      capacitance="100nF"
      footprint="0402"
      schX={22}
      schY={3}
      pcbX={18}
      pcbY={3.5}
      connections={{ pin1: "net.VUSB", pin2: "net.GND" }}
    />
    <capacitor
      name="C9_5V_IN"
      capacitance="10uF"
      footprint="0805"
      schX={16}
      schY={-7}
      pcbX={14}
      pcbY={-4.5}
      connections={{ pin1: "net.VIN", pin2: "net.GND" }}
    />
    <capacitor
      name="C10_5V_OUT"
      capacitance="10uF"
      footprint="0805"
      schX={16}
      schY={-9}
      pcbX={14}
      pcbY={-6.5}
      connections={{ pin1: "net.VCC5", pin2: "net.GND" }}
    />
    <capacitor
      name="C11_3V3_OUT"
      capacitance="10uF"
      footprint="0805"
      schX={16}
      schY={-11}
      pcbX={19}
      pcbY={-6.5}
      connections={{ pin1: "net.VCC3V3", pin2: "net.GND" }}
    />
  </board>
)

export default ArduinoNano

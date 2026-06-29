export const CH340Circuit = () => (
  <group name="usb_uart" pcbPack>
    <chip
      name="U2"
      footprint="soic16"
      manufacturerPartNumber="CH340G"
      schX={4}
      schY={0}
      pcbX="8mm"
      pcbY="0mm"
      pinLabels={{
        pin1: "GND",
        pin2: "TXD",
        pin3: "RXD",
        pin4: "V3",
        pin5: "UD+",
        pin6: "UD-",
        pin7: "XI",
        pin8: "XO",
        pin9: "CTS",
        pin10: "DSR",
        pin11: "RI",
        pin12: "DCD",
        pin13: "DTR",
        pin14: "RTS",
        pin15: "VCC",
        pin16: "VCC",
      }}
      connections={{
        GND: "net.GND",
        VCC: "net.V5",
        V3: "net.V5",
        TXD: "net.UART_RX",
        RXD: "net.UART_TX",
        "UD+": "net.USB_P",
        "UD-": "net.USB_N",
        DTR: "net.DTR",
      }}
    />
    <capacitor
      name="C11"
      capacitance="100nF"
      footprint="0402"
      schX={5}
      schY={1}
      connections={{ pin1: "U2.VCC", pin2: "net.GND" }}
    />
  </group>
)

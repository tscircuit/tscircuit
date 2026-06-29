export const ATmega328Circuit = () => (
  <group name="mcu" pcbPack>
    <chip
      name="U1"
      footprint="tqfp32"
      manufacturerPartNumber="ATmega328P-AU"
      schX={0}
      schY={0}
      pcbX="0mm"
      pcbY="0mm"
      pinLabels={{
        pin1: "PD3",
        pin2: "PD4",
        pin3: "GND",
        pin4: "VCC",
        pin5: "GND",
        pin6: "VCC",
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
        pin21: "GND",
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
        VCC: ["net.V5", "C8.pin1"],
        GND: ["net.GND", "C8.pin2", "C9.pin2"],
        AVCC: "net.V5",
        AREF: "net.AREF",
        PD0: "net.UART_RX",
        PD1: "net.UART_TX",
        PD2: "net.INT0",
        PC6: "net.RESET",
      }}
    />
    <capacitor
      name="C8"
      capacitance="100nF"
      footprint="0402"
      schX={1}
      schY={1}
      pcbX="2mm"
      pcbY="1mm"
    />
    <capacitor
      name="C9"
      capacitance="100nF"
      footprint="0402"
      schX={-1}
      schY={1}
      pcbX="-2mm"
      pcbY="1mm"
      connections={{ pin1: "net.AREF", pin2: "net.GND" }}
    />
    <resistor
      name="R2"
      resistance="10k"
      footprint="0402"
      schX={2}
      schY={-1}
      pcbX="3mm"
      pcbY="-2mm"
      connections={{ pin1: "net.V5", pin2: "net.RESET" }}
    />
    <capacitor
      name="C10"
      capacitance="100nF"
      footprint="0402"
      schX={3}
      schY={-1}
      connections={{ pin1: "U2.DTR", pin2: "net.RESET" }}
    />
  </group>
)

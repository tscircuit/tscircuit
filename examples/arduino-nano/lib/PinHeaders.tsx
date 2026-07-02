/** Nano-style 2×15 2.54 mm headers (D0–D13, A0–A7, power rails). */
export const PinHeaders = () => (
  <group name="headers" pcbPack>
    <pinheader
      name="HDR1"
      pinCount={15}
      schX={-6}
      schY={4}
      pcbX="-12mm"
      pcbY="-6mm"
      pinLabels={Object.fromEntries(
        [
          "VIN",
          "GND",
          "RST",
          "V5",
          "A7",
          "A6",
          "A5",
          "A4",
          "A3",
          "A2",
          "A1",
          "A0",
          "AREF",
          "GND",
          "V5",
        ].map((label, i) => [`pin${i + 1}`, label]),
      )}
    />
    <pinheader
      name="HDR2"
      pinCount={15}
      schX={6}
      schY={4}
      pcbX="12mm"
      pcbY="-6mm"
      pinLabels={Object.fromEntries(
        [
          "D13",
          "D12",
          "D11",
          "D10",
          "D9",
          "D8",
          "D7",
          "D6",
          "D5",
          "D4",
          "D3",
          "D2",
          "D1",
          "D0",
          "GND",
        ].map((label, i) => [`pin${i + 1}`, label]),
      )}
    />
    <trace from="HDR1.pin3" to="net.RESET" />
    <trace from="HDR1.pin4" to="net.V5" />
    <trace from="HDR1.pin15" to="net.V5" />
    <trace from="HDR1.pin2" to="net.GND" />
    <trace from="HDR1.pin14" to="net.GND" />
    <trace from="HDR2.pin15" to="net.GND" />
    <trace from="HDR1.pin1" to="J1.VBUS" />
    <trace from="HDR2.pin13" to="U1.PD1" />
    <trace from="HDR2.pin14" to="U1.PD0" />
    <trace from="HDR2.pin12" to="U1.PD2" />
    <trace from="HDR2.pin11" to="U1.PD3" />
    <trace from="HDR2.pin10" to="U1.PD4" />
    <trace from="HDR2.pin9" to="U1.PD5" />
    <trace from="HDR2.pin8" to="U1.PD6" />
    <trace from="HDR2.pin7" to="U1.PD7" />
    <trace from="HDR2.pin6" to="U1.PB2" />
    <trace from="HDR2.pin5" to="U1.PB1" />
    <trace from="HDR2.pin4" to="U1.PB0" />
    <trace from="HDR2.pin3" to="U1.PB3" />
    <trace from="HDR2.pin2" to="U1.PB4" />
    <trace from="HDR2.pin1" to="U1.PB5" />
    <trace from="HDR1.pin13" to="net.AREF" />
    <trace from="HDR1.pin12" to="U1.PC0" />
    <trace from="HDR1.pin11" to="U1.PC1" />
    <trace from="HDR1.pin10" to="U1.PC2" />
    <trace from="HDR1.pin9" to="U1.PC3" />
    <trace from="HDR1.pin8" to="U1.PC4" />
    <trace from="HDR1.pin7" to="U1.PC5" />
    <trace from="HDR1.pin6" to="U1.ADC6" />
    <trace from="HDR1.pin5" to="U1.ADC7" />
  </group>
)

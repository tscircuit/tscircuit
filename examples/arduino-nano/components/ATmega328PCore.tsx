import React from "react"

export const ATmega328PCore = ({ name }: { name: string }) => (
  <group name={name}>
    {/* ATmega328P-AU (TQFP-32) — the brain of the Arduino Nano */}
    <chip
      name="U1"
      footprint="tqfp32_w7_h7_p0.8mm"
      pinLabels={{
        pin1: "PD3", pin2: "PD4",
        pin3: "GND", pin4: "VCC", pin5: "GND2", pin6: "VCC2",
        pin7: "XTAL1", pin8: "XTAL2",
        pin9: "PD5", pin10: "PD6", pin11: "PD7",
        pin12: "PB0", pin13: "PB1", pin14: "PB2",
        pin15: "PB3_MOSI", pin16: "PB4_MISO", pin17: "PB5_SCK",
        pin18: "AVCC", pin19: "ADC6", pin20: "AREF",
        pin21: "GND3", pin22: "ADC7",
        pin23: "PC0", pin24: "PC1", pin25: "PC2",
        pin26: "PC3", pin27: "PC4_SDA", pin28: "PC5_SCL",
        pin29: "PC6_RESET",
        pin30: "PD0_RXD", pin31: "PD1_TXD", pin32: "PD2",
      }}
      pcbX="0mm"
      pcbY="0mm"
    />

    {/* 16MHz Crystal Oscillator */}
    <chip name="Y1" footprint="hc49s"
      pinLabels={{ pin1: "IN", pin2: "OUT" }}
      pcbX="0mm" pcbY="-6mm"
    />

    {/* Crystal load capacitors — 22pF each */}
    <capacitor name="C_X1" capacitance="22pF" footprint="0805"
      pcbX="-2mm" pcbY="-6mm" />
    <capacitor name="C_X2" capacitance="22pF" footprint="0805"
      pcbX="2mm" pcbY="-6mm" />

    {/* VCC Decoupling — 100nF placed near VCC pin */}
    <capacitor name="C_VCC" capacitance="100nF" footprint="0805"
      pcbX="5mm" pcbY="1mm" />

    {/* AVCC Filtering — 100nF for analog supply */}
    <capacitor name="C_AVCC" capacitance="100nF" footprint="0805"
      pcbX="5mm" pcbY="-1mm" />

    {/* Reset Pull-up — 10kΩ pulls RESET high */}
    <resistor name="R_RST" resistance="10kohm" footprint="0805"
      pcbX="-5mm" pcbY="3mm" />

    {/* Pin 13 LED (L) — user-controllable LED */}
    <led name="LED_L" footprint="0805" pcbX="5mm" pcbY="3mm" />
    <resistor name="R_L" resistance="1kohm" footprint="0805"
      pcbX="7mm" pcbY="3mm" />

    {/* === Internal Traces === */}

    {/* Crystal connections */}
    <trace path={[".Y1 > .IN", ".U1 > .XTAL1"]} />
    <trace path={[".Y1 > .OUT", ".U1 > .XTAL2"]} />

    {/* Crystal load caps: one end to crystal pin, other end to GND */}
    <trace path={[".C_X1 > .pos", ".U1 > .XTAL1"]} />
    <trace path={[".C_X1 > .neg", ".U1 > .GND"]} />
    <trace path={[".C_X2 > .pos", ".U1 > .XTAL2"]} />
    <trace path={[".C_X2 > .neg", ".U1 > .GND"]} />

    {/* VCC decoupling: pos to VCC, neg to GND */}
    <trace path={[".C_VCC > .pos", ".U1 > .VCC"]} />
    <trace path={[".C_VCC > .neg", ".U1 > .GND"]} />

    {/* AVCC decoupling: pos to AVCC, neg to GND */}
    <trace path={[".C_AVCC > .pos", ".U1 > .AVCC"]} />
    <trace path={[".C_AVCC > .neg", ".U1 > .GND"]} />

    {/* Tie all GND pins together */}
    <trace path={[".U1 > .GND", ".U1 > .GND2"]} />
    <trace path={[".U1 > .GND", ".U1 > .GND3"]} />

    {/* Tie all VCC pins together */}
    <trace path={[".U1 > .VCC", ".U1 > .VCC2"]} />

    {/* Reset pull-up: left to RESET, right to VCC */}
    <trace path={[".R_RST > .left", ".U1 > .PC6_RESET"]} />
    <trace path={[".R_RST > .right", ".U1 > .VCC"]} />

    {/* Pin 13 LED: LED anode → resistor → PB5 (SCK/D13), cathode → GND */}
    <trace path={[".LED_L > .anode", ".R_L > .left"]} />
    <trace path={[".R_L > .right", ".U1 > .PB5_SCK"]} />
    <trace path={[".LED_L > .cathode", ".U1 > .GND"]} />
  </group>
)

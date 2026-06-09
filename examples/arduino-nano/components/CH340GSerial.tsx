import React from "react"

export const CH340GSerial = ({ name }: { name: string }) => (
  <group name={name}>
    {/* USB Mini-B Connector */}
    <chip name="USB1" footprint="usb_mini_b"
      pinLabels={{ pin1: "VBUS", pin2: "D_MINUS", pin3: "D_PLUS", pin4: "NC", pin5: "GND" }}
      pcbX="0mm" pcbY="-18mm"
    />

    {/* CH340G USB-to-Serial Converter (SOP-16) */}
    <chip name="U2" footprint="soic16_w3.9mm_p1.27mm"
      pinLabels={{
        pin1: "GND", pin2: "TXD", pin3: "RXD", pin4: "V3",
        pin5: "UD_PLUS", pin6: "UD_MINUS", pin7: "XI", pin8: "XO",
        pin9: "CTS", pin10: "DSR", pin11: "RI", pin12: "DCD",
        pin13: "DTR", pin14: "RTS", pin15: "R232", pin16: "VCC",
      }}
      pcbX="0mm" pcbY="-12mm"
    />

    {/* 12MHz Crystal for CH340G */}
    <chip name="Y2" footprint="hc49s"
      pinLabels={{ pin1: "IN", pin2: "OUT" }}
      pcbX="4mm" pcbY="-12mm"
    />

    {/* USB VBUS Decoupling — 4.7µF between VBUS and GND */}
    <capacitor name="C_USB" capacitance="4.7uF" footprint="0805"
      pcbX="-3mm" pcbY="-18mm" />

    {/* CH340G VCC Decoupling — 100nF between VCC and GND */}
    <capacitor name="C_CH" capacitance="100nF" footprint="0805"
      pcbX="4mm" pcbY="-14mm" />

    {/* CH340G V3 pin — internal 3.3V regulator output needs 100nF decoupling cap */}
    <capacitor name="C_V3" capacitance="100nF" footprint="0805"
      pcbX="-3mm" pcbY="-14mm" />

    {/* TX LED */}
    <led name="LED_TX" footprint="0805" pcbX="-4mm" pcbY="-10mm" />
    <resistor name="R_TX" resistance="1kohm" footprint="0805"
      pcbX="-6mm" pcbY="-10mm" />

    {/* RX LED */}
    <led name="LED_RX" footprint="0805" pcbX="-4mm" pcbY="-8mm" />
    <resistor name="R_RX" resistance="1kohm" footprint="0805"
      pcbX="-6mm" pcbY="-8mm" />

    {/* Auto-Reset Capacitor — 100nF between DTR and MCU RESET */}
    <capacitor name="C_RST" capacitance="100nF" footprint="0805"
      pcbX="-5mm" pcbY="-14mm" />

    {/* === Internal Traces === */}

    {/* USB data lines to CH340G */}
    <trace path={[".USB1 > .D_PLUS", ".U2 > .UD_PLUS"]} />
    <trace path={[".USB1 > .D_MINUS", ".U2 > .UD_MINUS"]} />

    {/* USB VBUS to CH340G VCC — CH340G is powered from USB */}
    <trace path={[".USB1 > .VBUS", ".U2 > .VCC"]} />

    {/* USB GND to CH340G GND */}
    <trace path={[".USB1 > .GND", ".U2 > .GND"]} />

    {/* USB VBUS decoupling cap */}
    <trace path={[".C_USB > .pos", ".USB1 > .VBUS"]} />
    <trace path={[".C_USB > .neg", ".USB1 > .GND"]} />

    {/* CH340G VCC decoupling cap */}
    <trace path={[".C_CH > .pos", ".U2 > .VCC"]} />
    <trace path={[".C_CH > .neg", ".U2 > .GND"]} />

    {/* CH340G V3 pin decoupling — per datasheet, V3 must have 100nF to GND */}
    <trace path={[".C_V3 > .pos", ".U2 > .V3"]} />
    <trace path={[".C_V3 > .neg", ".U2 > .GND"]} />

    {/* 12MHz Crystal to CH340G */}
    <trace path={[".Y2 > .IN", ".U2 > .XI"]} />
    <trace path={[".Y2 > .OUT", ".U2 > .XO"]} />

    {/* TX LED: CH340G TXD → resistor → LED anode, LED cathode → GND */}
    <trace path={[".R_TX > .right", ".U2 > .TXD"]} />
    <trace path={[".R_TX > .left", ".LED_TX > .anode"]} />
    <trace path={[".LED_TX > .cathode", ".U2 > .GND"]} />

    {/* RX LED: CH340G RXD → resistor → LED anode, LED cathode → GND */}
    <trace path={[".R_RX > .right", ".U2 > .RXD"]} />
    <trace path={[".R_RX > .left", ".LED_RX > .anode"]} />
    <trace path={[".LED_RX > .cathode", ".U2 > .GND"]} />
  </group>
)

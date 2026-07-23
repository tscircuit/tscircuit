export const LedCircuit = () => (
  <group name="leds" pcbPack>
    <resistor
      name="R3"
      resistance="1k"
      footprint="0402"
      schX={6}
      schY={2}
      pcbX="10mm"
      pcbY="5mm"
      connections={{ pin1: "U2.TXD", pin2: "L2.pin1" }}
    />
    <led name="L2" color="yellow" footprint="0603" schX={7} schY={2} pcbX="11mm" pcbY="5mm" />
    <resistor
      name="R4"
      resistance="1k"
      footprint="0402"
      schX={6}
      schY={0}
      pcbX="10mm"
      pcbY="3mm"
      connections={{ pin1: "U2.RXD", pin2: "L3.pin1" }}
    />
    <led name="L3" color="yellow" footprint="0603" schX={7} schY={0} pcbX="11mm" pcbY="3mm" />
    <trace from="L2.pin2" to="net.GND" />
    <trace from="L3.pin2" to="net.GND" />
  </group>
)

export const PowerCircuit = () => (
  <group name="power" pcbPack>
    <chip
      name="U3"
      footprint="sot223"
      manufacturerPartNumber="AMS1117-5.0"
      pinLabels={{ pin1: "GND", pin2: "VOUT", pin3: "VIN" }}
      schX={-4}
      schY={2}
      pcbX="-8mm"
      pcbY="6mm"
    />
    <capacitor
      name="C1"
      capacitance="10uF"
      footprint="0805"
      schX={-2}
      schY={2}
      pcbX="-5mm"
      pcbY="6mm"
      connections={{ pin1: "U3.VIN", pin2: "net.GND" }}
    />
    <capacitor
      name="C2"
      capacitance="10uF"
      footprint="0805"
      schX={-2}
      schY={0}
      pcbX="-5mm"
      pcbY="4mm"
      connections={{ pin1: "U3.VOUT", pin2: "net.GND" }}
    />
    <capacitor
      name="C3"
      capacitance="100nF"
      footprint="0402"
      schX={0}
      schY={0}
      pcbX="-3mm"
      pcbY="4mm"
      connections={{ pin1: "U3.VOUT", pin2: "net.GND" }}
    />
    <resistor
      name="R1"
      resistance="1k"
      footprint="0402"
      schX={2}
      schY={2}
      pcbX="0mm"
      pcbY="7mm"
      connections={{ pin1: "net.V5", pin2: "L1.pin1" }}
    />
    <led name="L1" color="green" footprint="0603" schX={3} schY={2} pcbX="2mm" pcbY="7mm" />
    <trace from="U3.VOUT" to="net.V5" />
    <trace from="U3.GND" to="net.GND" />
    <trace from="L1.pin2" to="net.GND" />
  </group>
)

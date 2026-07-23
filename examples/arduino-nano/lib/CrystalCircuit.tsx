export const CrystalCircuit = () => (
  <group name="crystals" pcbPack>
    <crystal
      name="Y1"
      frequency="16MHz"
      footprint="hc49"
      schX={-2}
      schY={-2}
      pcbX="-6mm"
      pcbY="0mm"
      connections={{ pin1: "U1.PB6", pin2: "U1.PB7" }}
    />
    <capacitor
      name="C4"
      capacitance="22pF"
      footprint="0402"
      schX={-3}
      schY={-3}
      connections={{ pin1: "U1.PB6", pin2: "net.GND" }}
    />
    <capacitor
      name="C5"
      capacitance="22pF"
      footprint="0402"
      schX={-1}
      schY={-3}
      connections={{ pin1: "U1.PB7", pin2: "net.GND" }}
    />
    <crystal
      name="Y2"
      frequency="12MHz"
      footprint="hc49"
      schX={2}
      schY={-2}
      pcbX="4mm"
      pcbY="0mm"
      connections={{ pin1: "U2.XI", pin2: "U2.XO" }}
    />
    <capacitor
      name="C6"
      capacitance="22pF"
      footprint="0402"
      schX={1}
      schY={-3}
      connections={{ pin1: "U2.XI", pin2: "net.GND" }}
    />
    <capacitor
      name="C7"
      capacitance="22pF"
      footprint="0402"
      schX={3}
      schY={-3}
      connections={{ pin1: "U2.XO", pin2: "net.GND" }}
    />
  </group>
)

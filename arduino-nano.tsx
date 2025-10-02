export const ArduinoNano = () => (
  <board width="45mm" height="18mm">
    <chip name="U1" footprint="tqfp32" left={15} top={6} />
    <crystal name="Y1" frequency="16MHz" footprint="hc49s" left={30} top={8} />
    <capacitor name="C1" capacitance="22pF" footprint="0805" left={25} top={5} />
    <capacitor name="C2" capacitance="22pF" footprint="0805" left={35} top={5} />
    <led name="PWR_LED" footprint="0805" color="red" left={5} top={3} />
    <led name="TX_LED" footprint="0805" color="yellow" left={35} top={3} />
    <led name="RX_LED" footprint="0805" color="yellow" left={40} top={3} />
    <resistor name="R1" resistance="1k" footprint="0805" left={5} top={1} />
    <resistor name="R2" resistance="220" footprint="0805" left={35} top={1} />
    <resistor name="R3" resistance="220" footprint="0805" left={40} top={1} />

    <trace path={[".Y1 > .1", ".U1 > .XTAL1"]} />
    <trace path={[".Y1 > .2", ".U1 > .XTAL2"]} />
    <trace path={[".Y1 > .1", ".C1 > .pos"]} />
    <trace path={[".Y1 > .2", ".C2 > .pos"]} />
    <trace path={[".C1 > .neg", ".GND"]} />
    <trace path={[".C2 > .neg", ".GND"]} />

    <trace path={[".U1 > .PB6", ".R1 > .1"]} />
    <trace path={[".R1 > .2", ".PWR_LED > .A"]} />
    <trace path={[".PWR_LED > .C", ".GND"]} />

    <trace path={[".U1 > .PB5", ".R2 > .1"]} />
    <trace path={[".R2 > .2", ".TX_LED > .A"]} />
    <trace path={[".TX_LED > .C", ".GND"]} />

    <trace path={[".U1 > .PB4", ".R3 > .1"]} />
    <trace path={[".R3 > .2", ".RX_LED > .A"]} />
    <trace path={[".RX_LED > .C", ".GND"]} />

    <trace path={[".U1 > .VCC", ".VCC"]} />
    <trace path={[".U1 > .GND", ".GND"]} />
  </board>
)

export default ArduinoNano

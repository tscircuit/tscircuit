import React from "react"
import { test, expect } from "bun:test"
import { runTscircuitCode } from "../dist"

test("Arduino Nano circuit compiles successfully", async () => {
  const circuitCode = `
    import React from "react"

    export default () => (
      <board width="45mm" height="18mm">
        {/* Main microcontroller */}
        <chip
          name="U1"
          footprint="tqfp32"
          manufacturer="Microchip"
          mpn="ATmega328P-AU"
          left={15}
          top={6}
        />

        {/* Clock crystal */}
        <crystal
          name="Y1"
          frequency="16MHz"
          load_capacitance="18pF"
          footprint="hc49s"
          left={30}
          top={8}
        />

        {/* Crystal load capacitors */}
        <capacitor name="C1" capacitance="22pF" voltage="50V" footprint="0805" left={25} top={5} />
        <capacitor name="C2" capacitance="22pF" voltage="50V" footprint="0805" left={35} top={5} />

        {/* Status LEDs */}
        <led name="PWR_LED" footprint="0805" color="red"    left={5}  top={3} />
        <led name="TX_LED"  footprint="0805" color="yellow" left={35} top={3} />
        <led name="RX_LED"  footprint="0805" color="yellow" left={40} top={3} />

        {/* LED current limiting resistors */}
        <resistor name="R1" resistance="1k"   footprint="0805" left={5}  top={1} />
        <resistor name="R2" resistance="220"  footprint="0805" left={35} top={1} />
        <resistor name="R3" resistance="220"  footprint="0805" left={40} top={1} />

        {/* Crystal oscillator connections */}
        <trace path={[".Y1 > .1", ".U1 > .XTAL1"]} />
        <trace path={[".Y1 > .2", ".U1 > .XTAL2"]} />
        <trace path={[".Y1 > .1", ".C1 > .pos"]} />
        <trace path={[".Y1 > .2", ".C2 > .pos"]} />
        <trace path={[".C1 > .neg", ".GND"]} />
        <trace path={[".C2 > .neg", ".GND"]} />

        {/* LED circuits */}
        <trace path={[".U1 > .PB6", ".R1 > .1"]} />
        <trace path={[".R1 > .2", ".PWR_LED > .A"]} />
        <trace path={[".PWR_LED > .C", ".GND"]} />

        <trace path={[".U1 > .PB5", ".R2 > .1"]} />
        <trace path={[".R2 > .2", ".TX_LED > .A"]} />
        <trace path={[".TX_LED > .C", ".GND"]} />

        <trace path={[".U1 > .PB4", ".R3 > .1"]} />
        <trace path={[".R3 > .2", ".RX_LED > .A"]} />
        <trace path={[".RX_LED > .C", ".GND"]} />

        {/* Power connections */}
        <trace path={[".U1 > .VCC", ".VCC"]} />
        <trace path={[".U1 > .GND", ".GND"]} />
      </board>
    )
  `

  const circuitJson = await runTscircuitCode(circuitCode)
  expect(circuitJson).toBeTruthy()
  expect(circuitJson).toBeDefined()
})
